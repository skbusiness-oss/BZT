/**
 * consolidateMessagesToCoach — admin-only callable. One-shot data
 * migration that makes a single UID (`coachUid`) the sole receiver of
 * every message in the database that was historically addressed to
 * some other staff UID (`fromUid`, typically the legacy admin).
 *
 * Differs from forwardMessagesToCoach (sibling file) in one key way:
 * this MUTATES the original `receiverId` in place instead of creating
 * a duplicate. That makes the coach's read-status flow work correctly
 * post-migration — Firestore rules only let the receiver flip `read`,
 * so a coach reading an admin-addressed message can't mark it read
 * until the message is actually addressed to him.
 *
 * What it does
 * ────────────
 * 1. Read every message with receiverId == fromUid. Skip any whose
 *    senderId == coachUid (those are coach's outbound — receiver is
 *    correct as-is; mutating would be wrong).
 * 2. Update each remaining message: receiverId → coachUid. Preserve
 *    the original in `originalReceiverId` for audit / rollback.
 * 3. Delete redundant forwarded duplicates: messages with
 *    receiverId == coachUid AND forwardedFromMessageId set, where the
 *    source message is now ALSO addressed to coachUid (i.e. step 2
 *    just migrated the original — keeping the forwarded copy would be
 *    a duplicate in the coach's thread). The forwarded copy carries
 *    no information the original doesn't.
 * 4. Audit-log the run.
 *
 * Idempotency: re-running yields 0 mutations (all originals already
 * addressed to coach) and 0 deletions (forwarded duplicates already
 * removed on the first run).
 *
 * Why a separate function instead of expanding forwardMessagesToCoach:
 * forwardMessagesToCoach is a non-destructive operation (creates
 * duplicates, originals stay put). This is a destructive operation
 * (mutates originals, deletes duplicates). Keeping them as separate
 * callables makes the destructive intent explicit and reviewable in
 * audit logs.
 *
 * Usage (admin signed in, from AdminSetup UI):
 *   { fromUid: 'ITc4...', coachUid: 'Y9Dl...' }
 *
 * Returns { ok, migratedCount, deletedDuplicateCount, skippedCoachOutboundCount, scannedTotal }.
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

export const consolidateMessagesToCoach = onCall(
    { region: 'us-central1', memory: '256MiB', invoker: 'public', timeoutSeconds: 300 },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        await throttle(callerUid, 'consolidateMessagesToCoach', { maxPerWindow: 3, windowSec: 300 });
        if (!(await callerIsAdmin(callerUid))) {
            throw new HttpsError('permission-denied', 'Only admins can consolidate messages.');
        }

        const { fromUid, coachUid } = (request.data ?? {}) as { fromUid?: string; coachUid?: string };
        if (!fromUid || typeof fromUid !== 'string') {
            throw new HttpsError('invalid-argument', 'fromUid required.');
        }
        if (!coachUid || typeof coachUid !== 'string') {
            throw new HttpsError('invalid-argument', 'coachUid required.');
        }
        if (fromUid === coachUid) {
            throw new HttpsError('invalid-argument', 'fromUid and coachUid must differ.');
        }

        const db = getFirestore();

        // 1. Read every message addressed to `fromUid`. Page through so
        //    memory stays flat regardless of inbox size.
        const sourceMessages: { id: string; data: Record<string, unknown> }[] = [];
        {
            let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
            for (;;) {
                let q = db.collection('messages').where('receiverId', '==', fromUid).limit(200);
                if (cursor) q = q.startAfter(cursor);
                const snap = await q.get();
                if (snap.empty) break;
                for (const d of snap.docs) sourceMessages.push({ id: d.id, data: d.data() });
                if (snap.size < 200) break;
                cursor = snap.docs[snap.docs.length - 1];
            }
        }

        // 2. Mutate originals in place — receiverId → coachUid. Skip any
        //    whose sender IS the coach (coach's outbound to fromUid; we
        //    don't want to flip the receiver to himself).
        let migrated = 0;
        let skippedCoachOutbound = 0;
        const BATCH = 400;
        for (let i = 0; i < sourceMessages.length; i += BATCH) {
            const slice = sourceMessages.slice(i, i + BATCH);
            const batch = db.batch();
            let dirty = false;
            for (const src of slice) {
                if (src.data.senderId === coachUid) {
                    skippedCoachOutbound++;
                    continue;
                }
                batch.update(db.collection('messages').doc(src.id), {
                    receiverId: coachUid,
                    originalReceiverId: fromUid,
                    consolidatedAt: FieldValue.serverTimestamp(),
                });
                migrated++;
                dirty = true;
            }
            if (dirty) await batch.commit();
        }

        // 3. Delete redundant forwarded duplicates. After step 2, the
        //    originals (formerly addressed to fromUid) are now addressed
        //    to coachUid. Any forwarded duplicate whose source id matches
        //    a now-migrated original is redundant — delete it.
        const migratedIds = new Set(
            sourceMessages
                .filter(s => s.data.senderId !== coachUid)
                .map(s => s.id)
        );
        let deletedDuplicates = 0;
        {
            // Read all messages addressed to coachUid that carry a
            // forwardedFromMessageId. (Most coach-addressed messages do
            // not have that field, so the in-memory filter is cheap.)
            let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
            const toDelete: string[] = [];
            for (;;) {
                let q = db.collection('messages').where('receiverId', '==', coachUid).limit(500);
                if (cursor) q = q.startAfter(cursor);
                const snap = await q.get();
                if (snap.empty) break;
                for (const d of snap.docs) {
                    const data = d.data();
                    const sourceId = data.forwardedFromMessageId;
                    if (typeof sourceId === 'string' && migratedIds.has(sourceId)) {
                        toDelete.push(d.id);
                    }
                }
                if (snap.size < 500) break;
                cursor = snap.docs[snap.docs.length - 1];
            }
            for (let i = 0; i < toDelete.length; i += BATCH) {
                const slice = toDelete.slice(i, i + BATCH);
                const batch = db.batch();
                for (const id of slice) batch.delete(db.collection('messages').doc(id));
                await batch.commit();
                deletedDuplicates += slice.length;
            }
        }

        // 4. Audit log.
        try {
            await db.collection('auditLog').add({
                action: 'consolidateMessagesToCoach',
                actorUid: callerUid,
                fromUid,
                coachUid,
                migratedCount: migrated,
                skippedCoachOutboundCount: skippedCoachOutbound,
                deletedDuplicateCount: deletedDuplicates,
                scannedTotal: sourceMessages.length,
                createdAt: FieldValue.serverTimestamp(),
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[auditLog/consolidateMessagesToCoach] write failed:', err);
        }

        return {
            ok: true,
            migratedCount: migrated,
            skippedCoachOutboundCount: skippedCoachOutbound,
            deletedDuplicateCount: deletedDuplicates,
            scannedTotal: sourceMessages.length,
        };
    },
);
