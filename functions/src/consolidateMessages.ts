/**
 * consolidateMessagesToCoach - admin-only callable. One-shot data
 * migration that makes a single UID (`coachUid`) the staff side of
 * every message in the database that historically used another staff
 * UID (`fromUid`, typically the legacy admin).
 *
 * Differs from forwardMessagesToCoach (sibling file) in one key way:
 * this MUTATES the original message in place instead of creating a
 * duplicate. That makes the coach's read-status flow work correctly
 * post-migration because Firestore rules only let the receiver flip
 * `read`.
 *
 * What it does
 * ────────────
 * 1. Read every message with receiverId == fromUid or senderId == fromUid.
 * 2. Update each remaining message: receiverId or senderId -> coachUid.
 *    Preserve the original staff UID for audit / rollback.
 * 3. Delete redundant forwarded duplicates whose source message now
 *    uses coachUid on the staff side. Keeping both would duplicate the
 *    coach's thread.
 * 4. Audit-log the run.
 *
 * Idempotency: re-running yields 0 mutations after all originals already
 * use coachUid, and 0 deletions after forwarded duplicates are removed.
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

type ConsolidateDirection = 'received' | 'sent';

interface SourceMessage {
    id: string;
    data: Record<string, unknown>;
    direction: ConsolidateDirection;
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

        // 1. Read every message where `fromUid` is the staff side. Page
        //    through so memory stays flat regardless of inbox size.
        const sourceMessagesById = new Map<string, SourceMessage>();
        const readSources = async (field: 'receiverId' | 'senderId', direction: ConsolidateDirection) => {
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
                const wouldBecomeSelfConversation =
                    (src.direction === 'received' && src.data.senderId === coachUid)
                    || (src.direction === 'sent' && src.data.receiverId === coachUid);
                if (wouldBecomeSelfConversation) {
                    skippedCoachOutbound++;
                    continue;
                }
                const updateData = src.direction === 'received'
                    ? {
                        receiverId: coachUid,
                        originalReceiverId: fromUid,
                        consolidatedAt: FieldValue.serverTimestamp(),
                    }
                    : {
                        senderId: coachUid,
                        senderName: 'Coach Zaki',
                        originalSenderId: fromUid,
                        consolidatedAt: FieldValue.serverTimestamp(),
                    };
                batch.update(db.collection('messages').doc(src.id), updateData);
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
                .filter(s => !(
                    (s.direction === 'received' && s.data.senderId === coachUid)
                    || (s.direction === 'sent' && s.data.receiverId === coachUid)
                ))
                .map(s => s.id)
        );
        let deletedDuplicates = 0;
        {
            const toDelete = new Set<string>();
            const collectForwardedDuplicates = async (field: 'receiverId' | 'senderId') => {
                let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
                for (;;) {
                    let q = db.collection('messages').where(field, '==', coachUid).limit(500);
                    if (cursor) q = q.startAfter(cursor);
                    const snap = await q.get();
                    if (snap.empty) break;
                    for (const d of snap.docs) {
                        const data = d.data();
                        const sourceId = data.forwardedFromMessageId;
                        if (typeof sourceId === 'string' && migratedIds.has(sourceId)) {
                            toDelete.add(d.id);
                        }
                    }
                    if (snap.size < 500) break;
                    cursor = snap.docs[snap.docs.length - 1];
                }
            };

            await collectForwardedDuplicates('receiverId');
            await collectForwardedDuplicates('senderId');

            const toDeleteIds = Array.from(toDelete);
            for (let i = 0; i < toDeleteIds.length; i += BATCH) {
                const slice = toDeleteIds.slice(i, i + BATCH);
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
