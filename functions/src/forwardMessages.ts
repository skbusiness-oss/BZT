/**
 * forwardMessagesToCoach - admin-only callable. Forwards every message
 * where `fromUid` is sender or receiver to a duplicate using `toUid`.
 *
 * Context: before the "team routing" fix landed, the client's coach
 * lookup used `limit(1)` on the `users` collection and arbitrarily
 * picked the admin. So historical client messages have
 * receiverId == admin.uid even though they were intended for the
 * coach. This function creates parallel copies for the coach so they
 * can see the full conversation history without losing the admin's copy.
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

type ForwardDirection = 'received' | 'sent';

interface SourceMessage {
    id: string;
    data: Record<string, unknown>;
    direction: ForwardDirection;
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

        // 1. Read the whole historical admin conversation in both
        //    directions. Older versions only copied messages received by
        //    the admin, which left admin replies invisible to the coach.
        const sourceMessagesById = new Map<string, SourceMessage>();
        const readSources = async (field: 'receiverId' | 'senderId', direction: ForwardDirection) => {
            let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
            for (;;) {
                let q = db.collection('messages').where(field, '==', fromUid).limit(200);
                if (cursor) q = q.startAfter(cursor);
                const snap = await q.get();
                if (snap.empty) break;
                for (const d of snap.docs) {
                    sourceMessagesById.set(d.id, { id: d.id, data: d.data(), direction });
                }
                if (snap.size < 200) break;
                cursor = snap.docs[snap.docs.length - 1];
            }
        };

        await readSources('receiverId', 'received');
        await readSources('senderId', 'sent');
        const sourceMessages = Array.from(sourceMessagesById.values());

        if (sourceMessages.length === 0) {
            return { ok: true, forwardedCount: 0, skippedAlreadyForwardedCount: 0 };
        }

        // 2. Find existing forwarded copies (idempotency). Check both
        //    coach-received and coach-sent copies because this function
        //    now preserves the original conversation direction.
        const alreadyForwardedIds = new Set<string>();
        const readForwardedIds = async (field: 'receiverId' | 'senderId') => {
            let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
            for (;;) {
                let q = db.collection('messages').where(field, '==', toUid).limit(500);
                if (cursor) q = q.startAfter(cursor);
                const snap = await q.get();
                if (snap.empty) break;
                for (const d of snap.docs) {
                    const fromId = d.data().forwardedFromMessageId as string | undefined;
                    if (fromId) alreadyForwardedIds.add(fromId);
                }
                if (snap.size < 500) break;
                cursor = snap.docs[snap.docs.length - 1];
            }
        };

        await readForwardedIds('receiverId');
        await readForwardedIds('senderId');

        // 3. For each source message NOT yet forwarded, write a duplicate.
        //    Preserve every original field; swap only the staff-side uid
        //    and add forwarding markers. Batched in groups of 400 to stay
        //    under Firestore's 500-write batch limit.
        let forwarded = 0;
        let skipped = 0;
        const BATCH = 400;
        for (let i = 0; i < sourceMessages.length; i += BATCH) {
            const slice = sourceMessages.slice(i, i + BATCH);
            const batch = db.batch();
            let writesInBatch = 0;
            for (const src of slice) {
                if (alreadyForwardedIds.has(src.id)) {
                    skipped++;
                    continue;
                }
                const newRef = db.collection('messages').doc();
                const directionalFields = src.direction === 'received'
                    ? { receiverId: toUid, read: false }
                    : { senderId: toUid, senderName: 'Coach Zaki' };
                batch.set(newRef, {
                    ...src.data,
                    ...directionalFields,
                    forwardedFromMessageId: src.id,
                    forwardedFromUid: fromUid,
                    forwardedToUid: toUid,
                    forwardedDirection: src.direction,
                    forwardedAt: FieldValue.serverTimestamp(),
                });
                forwarded++;
                writesInBatch++;
            }
            if (writesInBatch > 0) await batch.commit();
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
