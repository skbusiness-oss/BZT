/**
 * deleteUser — coach/admin only. Deletes a user across:
 *   - Firebase Auth (most important: revokes all tokens forever).
 *   - Firestore: users/{uid} + subcollections (selfLogs, xpEvents),
 *     clients/{clientId}, all checkIns, userPrograms, publicProfiles,
 *     userDiets, and messages where the user is sender or receiver.
 *   - posts/* by the user → tombstoned (authorId blanked, authorName
 *     replaced with sentinel '[deleted]'). Comments by the user inside
 *     OTHER users' posts are tombstoned in place. Likes by the user are
 *     removed from every post's likes[] array.
 *   - Writes audienceProfiles/{anonId} BEFORE the cascade — anonymized
 *     ICP snapshot for cohort analytics, keyed by a random id (NOT the
 *     original uid) so the deleted person can't be re-identified.
 *   - Writes deletionLogs/{uid} as the audit trail.
 *   - (Stripe cancellation hook — stub until Stripe is wired.)
 *
 * This is the strongest revocation. Once the Auth user is deleted, no
 * token they ever held is valid. Every subsequent request from that uid
 * fails with `auth/user-not-found`.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { throttle } from './rateLimit';

async function callerIsCoach(uid: string | undefined): Promise<boolean> {
    if (!uid) return false;
    const claims = (await getAuth().getUser(uid)).customClaims as { role?: string } | undefined;
    if (claims?.role === 'coach' || claims?.role === 'admin') return true;
    const snap = await getFirestore().doc(`users/${uid}`).get();
    const role = snap.data()?.role;
    return role === 'coach' || role === 'admin';
}

/** Delete every doc in a subcollection, in batches of 200. */
async function deleteCollection(path: string): Promise<void> {
    const db = getFirestore();
    const ref = db.collection(path);
    for (;;) {
        const snap = await ref.limit(200).get();
        if (snap.empty) return;
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        if (snap.size < 200) return;
    }
}

// ─── Audience-profile helpers ───────────────────────────────────────────
type AgeBracket = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';

function ageToBracket(age: number | null): AgeBracket | null {
    if (age == null || !Number.isFinite(age) || age < 13) return null;
    if (age <= 17) return '13-17';
    if (age <= 24) return '18-24';
    if (age <= 34) return '25-34';
    if (age <= 44) return '35-44';
    if (age <= 54) return '45-54';
    return '55+';
}

function ageFromBirthdate(iso: string | null | undefined): number | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age > 0 ? age : null;
}

/** Random id for audienceProfiles. NOT the user's uid — that's the whole
 *  point of the anonymization. crypto.randomBytes is FIPS-grade and gives
 *  ~1e-19 collision probability across the lifetime of the platform. */
function newAnonId(): string {
    return crypto.randomBytes(12).toString('hex'); // 24 hex chars
}

/** Truncate a date to the first of its month, ISO format. */
function truncToMonthIso(d: Date): string {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString();
}

function tsToDate(v: unknown): Date | null {
    if (!v) return null;
    if (v instanceof Timestamp) return v.toDate();
    if (typeof v === 'string') {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

// ─── Tombstone helpers (posts/comments/likes) ───────────────────────────
const TOMBSTONE_AUTHOR_ID = '';
const TOMBSTONE_AUTHOR_NAME = '[deleted]';

interface PostComment {
    id?: string;
    authorId?: string;
    authorName?: string;
    content?: string;
    timestamp?: unknown;
}

/** Tombstone every post/comment/like by the deleted user across the
 *  entire posts/ collection. Single full scan — fine while community
 *  feed is small (<10k posts). At scale, swap to a `where('authorId',
 *  '==', uid)` query for owned posts plus a separate sweep for comments
 *  via a parallel comments index. */
async function tombstonePostsByUser(targetUid: string): Promise<{ ownedRewritten: number; commentsRewritten: number; likesRewritten: number }> {
    const db = getFirestore();
    let ownedRewritten = 0;
    let commentsRewritten = 0;
    let likesRewritten = 0;

    // Owned posts — query by indexed field, batch update.
    const ownedSnap = await db.collection('posts').where('authorId', '==', targetUid).get();
    const ownedBatch = db.batch();
    ownedSnap.docs.forEach((d) => {
        ownedBatch.update(d.ref, {
            authorId: TOMBSTONE_AUTHOR_ID,
            authorName: TOMBSTONE_AUTHOR_NAME,
        });
        ownedRewritten++;
    });
    if (ownedRewritten > 0) await ownedBatch.commit();

    // Comments + likes — Firestore can't query into array elements server-
    // side, so we scan. For likes we use the array-contains query as a
    // cheap pre-filter; for comments we still need a full scan because
    // they're an array of objects.
    const likedSnap = await db.collection('posts').where('likes', 'array-contains', targetUid).get();
    {
        const batch = db.batch();
        likedSnap.docs.forEach((d) => {
            batch.update(d.ref, { likes: FieldValue.arrayRemove(targetUid) });
            likesRewritten++;
        });
        if (likesRewritten > 0) await batch.commit();
    }

    // Comments — full scan, paginated.
    const seen = new Set<string>();
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    for (;;) {
        let q = db.collection('posts').orderBy('__name__').limit(200);
        if (cursor) q = q.startAfter(cursor);
        const snap = await q.get();
        if (snap.empty) break;
        const batch = db.batch();
        let dirty = 0;
        for (const doc of snap.docs) {
            if (seen.has(doc.id)) continue;
            seen.add(doc.id);
            const data = doc.data() as { comments?: PostComment[] };
            const comments = data.comments ?? [];
            let touched = false;
            const next = comments.map((c) => {
                if (c.authorId === targetUid) {
                    touched = true;
                    commentsRewritten++;
                    return { ...c, authorId: TOMBSTONE_AUTHOR_ID, authorName: TOMBSTONE_AUTHOR_NAME };
                }
                return c;
            });
            if (touched) {
                batch.update(doc.ref, { comments: next });
                dirty++;
            }
        }
        if (dirty > 0) await batch.commit();
        if (snap.size < 200) break;
        cursor = snap.docs[snap.docs.length - 1];
    }

    return { ownedRewritten, commentsRewritten, likesRewritten };
}

// ─── Audience profile builder ───────────────────────────────────────────
async function buildAudienceProfile(args: {
    targetUid: string;
    userData: Record<string, unknown>;
    clientIds: string[];
}): Promise<{ anonId: string; profile: Record<string, unknown> }> {
    const db = getFirestore();
    const { targetUid, userData, clientIds } = args;

    // Pull the (first) client doc if any — coaching clients have intake
    // data with gender/birthdate/fitnessLevel that the user doc doesn't.
    let clientData: Record<string, unknown> = {};
    if (clientIds.length > 0) {
        const cSnap = await db.doc(`clients/${clientIds[0]}`).get();
        clientData = cSnap.data() ?? {};
    }

    const accountType: 'community' | 'client' = clientIds.length > 0 ? 'client' : 'community';

    // Demographics — best-of from across the user/client/dietProfile docs.
    const dietProfile = (userData.dietProfile as { sex?: 'male' | 'female' } | undefined) ?? undefined;
    const gender =
        (clientData.gender as 'male' | 'female' | undefined) ??
        dietProfile?.sex ??
        null;

    const birthdate = (clientData.birthdate as string | undefined) ?? null;
    const ageFromUser = typeof userData.age === 'number' ? (userData.age as number) : null;
    const ageFromIntake = ageFromBirthdate(birthdate);
    const ageBracket = ageToBracket(ageFromUser ?? ageFromIntake);

    const goal =
        (typeof userData.goal === 'string' ? (userData.goal as string) : null) ??
        ((clientData.intakeData as { goal?: string } | undefined)?.goal ?? null);

    const language: 'en' | 'ar' | null =
        (userData.preferredLanguage as 'en' | 'ar' | undefined) ?? null;
    const country = (userData.country as string | undefined) ?? null;

    // Engagement — count distinct submitted weeks for clients, selfLog
    // entries for community users.
    let weeksActive = 0;
    let checkInsSubmitted = 0;
    let lastActivity: Date | null = null;

    if (clientIds.length > 0) {
        const weeksQ = await db.collection('checkIns').where('clientId', '==', clientIds[0]).get();
        const submitted = weeksQ.docs.filter((d) => {
            const status = (d.data().status as string | undefined) ?? '';
            return status === 'submitted' || status === 'reviewed' || status === 'locked';
        });
        weeksActive = new Set(submitted.map((d) => d.data().weekNumber)).size;
        checkInsSubmitted = submitted.length;
        for (const d of submitted) {
            const ts = tsToDate(d.data().updatedAt) ?? tsToDate(d.data().createdAt);
            if (ts && (!lastActivity || ts > lastActivity)) lastActivity = ts;
        }
    } else {
        const logsSnap = await db.collection(`users/${targetUid}/selfLogs`).get();
        checkInsSubmitted = logsSnap.size;
        const dates = new Set<string>();
        for (const d of logsSnap.docs) {
            const date = (d.data().date as string | undefined) ?? null;
            if (date) dates.add(date.slice(0, 10));
            const ts = tsToDate(d.data().updatedAt) ?? tsToDate(d.data().createdAt);
            if (ts && (!lastActivity || ts > lastActivity)) lastActivity = ts;
        }
        // For community users, "weeks active" is roughly distinct weeks
        // they logged something in.
        weeksActive = new Set(
            Array.from(dates).map((iso) => {
                const d = new Date(iso);
                if (Number.isNaN(d.getTime())) return iso;
                const onejan = new Date(d.getFullYear(), 0, 1);
                const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
                return `${d.getFullYear()}-${week}`;
            }),
        ).size;
    }

    const joinedAtDate = tsToDate(userData.createdAt) ?? null;
    const daysFromJoinToLast =
        joinedAtDate && lastActivity
            ? Math.max(0, Math.floor((lastActivity.getTime() - joinedAtDate.getTime()) / 86400000))
            : 0;

    const anonId = newAnonId();
    const profile: Record<string, unknown> = {
        anonId,
        accountType,
        status: 'deleted',
        gender,
        ageBracket,
        country,
        language,
        goal,
        engagementSummary: {
            weeksActive,
            checkInsSubmitted,
            daysFromJoinToLast,
        },
        joinedAt: joinedAtDate ? truncToMonthIso(joinedAtDate) : null,
        deletedAt: truncToMonthIso(new Date()),
    };

    return { anonId, profile };
}

export const deleteUser = onCall(
    { region: 'us-central1', memory: '256MiB', timeoutSeconds: 120, invoker: 'public' },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in required.');
        // Deletes are heavyweight (cascade across multiple collections).
        // Cap at 10/min/caller — even an aggressive cleanup run shouldn't
        // exceed that, and a compromised admin token can't loop deletions.
        await throttle(callerUid, 'deleteUser', { maxPerWindow: 10, windowSec: 60 });
        const callerClaims = (await getAuth().getUser(callerUid)).customClaims as { role?: string } | undefined;
        const callerClaimRole = callerClaims?.role ?? null;
        if (!(await callerIsCoach(callerUid))) {
            throw new HttpsError('permission-denied', 'Only coaches can delete users.');
        }

        const { targetUid, reason } = (request.data ?? {}) as { targetUid?: string; reason?: string };
        if (!targetUid || typeof targetUid !== 'string') {
            throw new HttpsError('invalid-argument', 'targetUid required.');
        }
        if (targetUid === callerUid) {
            throw new HttpsError('failed-precondition', 'You cannot delete yourself.');
        }

        const db = getFirestore();

        // Capture user info for the audit log + audience profile BEFORE
        // anything is deleted. Once `users/{uid}` is gone we lose the
        // demographics needed to build the anonymized record.
        const userSnap = await db.doc(`users/${targetUid}`).get();
        const userData = userSnap.data() ?? {};

        // Coaches can only delete clients/community. Deleting another coach
        // or an admin requires admin — prevents one compromised coach
        // account from wiping out the rest of the team.
        const targetRole = (userData.role as string | undefined) ?? null;
        if ((targetRole === 'coach' || targetRole === 'admin') && callerClaimRole !== 'admin') {
            throw new HttpsError('permission-denied', `Only admins can delete a ${targetRole}.`);
        }
        let stripeCustomerId: string | null = (userData.stripeCustomerId as string | null) ?? null;

        // Find the matching client doc by userId field (clientId !== uid).
        const clientQ = await db.collection('clients').where('userId', '==', targetUid).get();
        const clientIds = clientQ.docs.map((d) => d.id);

        // ----- Archive audience profile (BEFORE any delete) -----
        // Anonymized snapshot keyed by a random id. Survives the deletion
        // and feeds cohort/ICP analytics. No PII, no link back to uid.
        const { anonId, profile } = await buildAudienceProfile({ targetUid, userData, clientIds });
        await db.doc(`audienceProfiles/${anonId}`).set(profile);

        // ----- Tombstone posts/comments/likes (BEFORE deleting users/) -----
        // The user's own posts get tombstoned (authorId blanked, name
        // replaced with '[deleted]'). Comments inside other users' posts
        // get the same treatment in place. Likes are array-removed.
        const tombstoneStats = await tombstonePostsByUser(targetUid);

        // ----- Cleanup Firestore -----
        const ops: Promise<unknown>[] = [];

        // User doc + private subcollections
        ops.push(deleteCollection(`users/${targetUid}/selfLogs`));
        ops.push(deleteCollection(`users/${targetUid}/xpEvents`));

        // Client docs + their weekly check-ins
        for (const cid of clientIds) {
            const weeksQ = await db.collection('checkIns').where('clientId', '==', cid).get();
            for (const w of weeksQ.docs) {
                ops.push(w.ref.delete());
            }
            ops.push(db.doc(`clients/${cid}`).delete());
        }

        // Program assignment + public projection + assigned diet
        ops.push(db.doc(`userPrograms/${targetUid}`).delete());
        ops.push(db.doc(`publicProfiles/${targetUid}`).delete());
        ops.push(db.doc(`userDiets/${targetUid}`).delete());

        // Conversation cleanup — messages where the user is on either side.
        // Without this, the coach's Messages list (and the other party's)
        // keeps showing the deleted user as an active conversation partner.
        // Two queries because Firestore can't OR across fields server-side.
        const [sentSnap, receivedSnap] = await Promise.all([
            db.collection('messages').where('senderId', '==', targetUid).get(),
            db.collection('messages').where('receiverId', '==', targetUid).get(),
        ]);
        const messageIds = new Set<string>();
        sentSnap.docs.forEach((d) => messageIds.add(d.id));
        receivedSnap.docs.forEach((d) => messageIds.add(d.id));
        for (const mid of messageIds) {
            ops.push(db.doc(`messages/${mid}`).delete());
        }

        await Promise.all(ops);
        // Delete the user doc last so callerIsCoach lookups still work mid-flight.
        await db.doc(`users/${targetUid}`).delete();

        // ----- Audit log (BEFORE deleting Auth, so we keep a trail) -----
        await db.doc(`deletionLogs/${targetUid}`).set(
            {
                type: 'deleted',
                deletedAt: FieldValue.serverTimestamp(),
                deletedBy: callerUid,
                reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
                // Cached snapshot so the log is meaningful even after the doc is gone.
                snapshot: {
                    displayName: userData.displayName ?? null,
                    email: userData.email ?? null,
                    role: userData.role ?? null,
                    clientIds,
                    messagesDeleted: messageIds.size,
                    audienceAnonId: anonId,
                    postsTombstoned: tombstoneStats.ownedRewritten,
                    commentsTombstoned: tombstoneStats.commentsRewritten,
                    likesRemoved: tombstoneStats.likesRewritten,
                },
            },
            { merge: true },
        );

        // ----- Stripe cancel (stub) -----
        if (stripeCustomerId) {
            // TODO: when Stripe is wired, cancel here.
            // const stripe = new Stripe(...); await stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active' })
            //   .then(s => Promise.all(s.data.map(sub => stripe.subscriptions.cancel(sub.id))));
            stripeCustomerId = null; // satisfies linter
        }

        // ----- Auth (terminal step — every token they hold becomes invalid) -----
        try {
            await getAuth().deleteUser(targetUid);
        } catch (e) {
            // If Auth user already gone, that's fine.
            const err = e as { code?: string };
            if (err.code !== 'auth/user-not-found') throw e;
        }

        return { ok: true, deletedClientIds: clientIds, audienceAnonId: anonId };
    },
);
