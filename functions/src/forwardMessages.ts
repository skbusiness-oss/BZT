/**
 * forwardMessagesToCoach — admin-only callable. Forwards every message
 * whose receiver is `fromUid` to a duplicate addressed to `toUid`.
 *
 * Context: before the "team routing" fix landed, the client's coach
 * lookup used `limit(1)` on the `users` collection and arbitrarily
 * picked the admin. So historical client messages have
 * receiverId == admin.uid even though they were intended for the
 * coach. This function creates a parallel copy for the coach so they
 * can see the conversation history without losing the admin's copy.
 *
 * Idempotency: each forwarded message gets a `forwardedFromMessageId`
 * field equal to the source message id. On re-run, we skip messages
 * whose source id already has a forwarded copy. Safe to call multiple
 * times.
 *
 * Usage (admin signed in, from AdminSetup UI):
 *   { fromUid: 'ITc4...', toUid: 'Y9Dl...' }
 *
 * Returns { ok, forwardedCount, skippedAlreadyForwardedCount }.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { throttle } from './rateLimit';

async function callerIsAdmin(uid: string | undefined): Promise<boolean> {
    if (!uid) return false;
    const claims = (await getAuth().getUser(uid)).customClaims as { role?: string } | undefined;
    if (claims?.role === 'admin') return true;
    const snap = await getFirestore().doc(`users/${uid}`).get();
    return snap.data()?.role === 'admin';
}

export const forwardMessagesToCoach = onCall(
    { region: 'us-central1', memory: '256MiB', invoker: 'public', timeoutSeconds: 120 },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        await throttle(callerUid, 'forwardMessagesToCoach', { maxPerWindow: 5, windowSec: 60 });
        if (!(await callerIsAdmin(callerUid))) {
            throw new HttpsError('permission-denied', 'Only admins can forward messages.');
        }

        const { fromUid, toUid } = (request.data ?? {}) as { fromUid?: string; toUid?: string };
        if (!fromUid || typeof fromUid !== 'string') {
            throw new HttpsError('invalid-argument', 'fromUid required.');
        }
        if (!toUid || typeof toUid !== 'string') {
            throw new HttpsError('invalid-argument', 'toUid required.');
        }
        if (fromUid === toUid) {
            throw new HttpsError('invalid-argument', 'fromUid and toUid must differ.');
        }

        const db = getFirestore();

        // 1. Read all messages whose receiver is `fromUid`. Page through
        //    so memory stays flat regardless of inbox size.
        const sourceMessages: { id: string; data: Record<string, unknown> }[] = [];
        let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
        for (;;) {
            let q = db.collection('messages').where('receiverId', '==', fromUid).limit(200);
            if (cursor) q = q.startAfter(cursor);
            const snap = await q.get();
            if (snap.empty) break;
            for (const d of snap.docs) {
                sourceMessages.push({ id: d.id, data: d.data() });
            }
            if (snap.size < 200) break;
            cursor = snap.docs[snap.docs.length - 1];
        }

        if (sourceMessages.length === 0) {
            return { ok: true, forwardedCount: 0, skippedAlreadyForwardedCount: 0 };
        }

        // 2. Find existing forwarded copies (idempotency). One query —
        //    look for messages addressed to `toUid` with a
        //    `forwardedFromMessageId` field. Build a Set of source ids
        //    already covered.
        const alreadyForwardedIds = new Set<string>();
        const existingFwdSnap = await db
            .collection('messages')
            .where('receiverId', '==', toUid)
            .get();
        for (const d of existingFwdSnap.docs) {
            const fromId = d.data().forwardedFromMessageId as string | undefined;
            if (fromId) alreadyForwardedIds.add(fromId);
        }

        // 3. For each source message NOT yet forwarded, write a duplicate.
        //    Preserve every original field; just swap receiverId and add
        //    the forwarding marker. Batched in groups of 400 to stay
        //    under Firestore's 500-write batch limit.
        let forwarded = 0;
        let skipped = 0;
        const BATCH = 400;
        for (let i = 0; i < sourceMessages.length; i += BATCH) {
            const slice = sourceMessages.slice(i, i + BATCH);
            const batch = db.batch();
            for (const src of slice) {
                if (alreadyForwardedIds.has(src.id)) {
                    skipped++;
                    continue;
                }
                const newRef = db.collection('messages').doc();
                batch.set(newRef, {
                    ...src.data,
                    receiverId: toUid,
                    forwardedFromMessageId: src.id,
                    forwardedFromUid: fromUid,
                    forwardedAt: FieldValue.serverTimestamp(),
                    // Force unread on the forwarded copy regardless of
                    // whether the admin had marked the original as read.
                    // The coach hasn't seen it.
                    read: false,
                });
                forwarded++;
            }
            await batch.commit();
        }

        // 4. Audit log.
        try {
            await db.collection('auditLog').add({
                action: 'forwardMessagesToCoach',
                actorUid: callerUid,
                fromUid,
                toUid,
                forwardedCount: forwarded,
                skippedAlreadyForwardedCount: skipped,
                sourceTotal: sourceMessages.length,
                createdAt: FieldValue.serverTimestamp(),
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[auditLog/forwardMessagesToCoach] write failed:', err);
        }

        return {
            ok: true,
            forwardedCount: forwarded,
            skippedAlreadyForwardedCount: skipped,
            sourceTotal: sourceMessages.length,
        };
    },
);
