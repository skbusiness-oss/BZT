/**
 * One-shot script — destructive sibling of forward-messages-once.cjs.
 *
 * What it does:
 *   1. Mutate receiverId in place on every message addressed to FROM_UID
 *      that was NOT sent by the coach → set to COACH_UID. Preserves the
 *      original on `originalReceiverId` for audit.
 *   2. Delete the forwarded duplicates created by the earlier forward
 *      script (messages with receiverId == COACH_UID AND
 *      forwardedFromMessageId pointing at a now-migrated original).
 *   3. Print a summary.
 *
 * Why this exists alongside the Cloud Function: the Cloud Function
 * (consolidateMessagesToCoach) needs a `functions:deploy` round-trip
 * before it's callable. This script bypasses that — uses Application
 * Default Credentials directly. Use whichever is more convenient.
 *
 * Run with (project Application Default Credentials must be set —
 * either `gcloud auth application-default login` once, or
 * GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account JSON):
 *   node scripts/consolidate-messages-once.cjs
 */
// firebase-admin lives in functions/node_modules (Cloud Functions
// runtime dependency). Resolve through there so this script doesn't
// require a separate npm install at the project root.
const path = require('path');
const adminPath = path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin');
const admin = require(adminPath);

const FROM_UID = 'ITc4VlP0PNeNUetjNxpEyGJOpW32'; // admin (Souktan)
const COACH_UID = 'Y9DlGI9kF6dPFPBh4cDvMnxbayB3'; // coach Zaki (medzakc90)
const PROJECT_ID = 'biozackteam-3d593';

(async () => {
    admin.initializeApp({ projectId: PROJECT_ID });
    const db = admin.firestore();

    console.log(`Consolidating messages: receiverId=${FROM_UID} → ${COACH_UID}`);
    console.log('');

    // ── Pre-flight: check the coach actually has role: coach/admin ────
    // If not, MessagesContext won't subscribe to the unfiltered query
    // and Firestore rules will refuse reads — meaning the coach STILL
    // won't see anything even after the migration. Surface this early.
    try {
        const coachDoc = await db.doc(`users/${COACH_UID}`).get();
        if (!coachDoc.exists) {
            console.warn(`⚠ users/${COACH_UID} does not exist. The coach must sign in at least once before this script can help.`);
        } else {
            const role = coachDoc.data()?.role;
            const disabled = coachDoc.data()?.disabled === true;
            console.log(`  Coach role: ${role ?? '(unset)'}${disabled ? ' (DISABLED)' : ''}`);
            if (role !== 'coach' && role !== 'admin') {
                console.warn(`  ⚠ Role is "${role}" — coach will only see his own messages, not the unfiltered inbox.`);
                console.warn(`  Fix: run the setUserRole callable, or set users/${COACH_UID}.role = "coach" in Firestore.`);
            }
            if (disabled) {
                console.warn(`  ⚠ Account is disabled — sign-in will bounce.`);
            }
        }
    } catch (err) {
        console.warn(`  Could not read users/${COACH_UID}:`, err.message);
    }
    console.log('');

    // ── 1. Mutate originals in place ──────────────────────────────────
    const sourceSnap = await db.collection('messages').where('receiverId', '==', FROM_UID).get();
    console.log(`Messages currently addressed to ${FROM_UID}: ${sourceSnap.size}`);

    let migrated = 0;
    let skippedCoachOutbound = 0;
    const migratedIds = new Set();
    const BATCH = 400;
    if (!sourceSnap.empty) {
        const docs = sourceSnap.docs;
        for (let i = 0; i < docs.length; i += BATCH) {
            const slice = docs.slice(i, i + BATCH);
            const batch = db.batch();
            let dirty = false;
            for (const src of slice) {
                if (src.data().senderId === COACH_UID) {
                    skippedCoachOutbound++;
                    continue;
                }
                batch.update(src.ref, {
                    receiverId: COACH_UID,
                    originalReceiverId: FROM_UID,
                    consolidatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                migratedIds.add(src.id);
                migrated++;
                dirty = true;
            }
            if (dirty) {
                await batch.commit();
                console.log(`  Mutated batch ${Math.floor(i / BATCH) + 1}.`);
            }
        }
    }

    // ── 2. Delete redundant forwarded duplicates ──────────────────────
    const coachSnap = await db.collection('messages').where('receiverId', '==', COACH_UID).get();
    const toDelete = [];
    coachSnap.docs.forEach(d => {
        const sourceId = d.data().forwardedFromMessageId;
        if (typeof sourceId === 'string' && migratedIds.has(sourceId)) {
            toDelete.push(d.ref);
        }
    });
    let deletedDuplicates = 0;
    for (let i = 0; i < toDelete.length; i += BATCH) {
        const slice = toDelete.slice(i, i + BATCH);
        const batch = db.batch();
        slice.forEach(ref => batch.delete(ref));
        await batch.commit();
        deletedDuplicates += slice.length;
        console.log(`  Deleted forwarded duplicates batch ${Math.floor(i / BATCH) + 1}.`);
    }

    // ── 3. Audit log ──────────────────────────────────────────────────
    await db.collection('auditLog').add({
        action: 'consolidateMessagesToCoach',
        actorUid: 'cli:scripts/consolidate-messages-once.cjs',
        fromUid: FROM_UID,
        coachUid: COACH_UID,
        migratedCount: migrated,
        skippedCoachOutboundCount: skippedCoachOutbound,
        deletedDuplicateCount: deletedDuplicates,
        scannedTotal: sourceSnap.size,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ── 4. Verification ───────────────────────────────────────────────
    const verifyFrom = await db.collection('messages').where('receiverId', '==', FROM_UID).get();
    const verifyCoach = await db.collection('messages').where('receiverId', '==', COACH_UID).get();

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Migrated (receiverId rewritten):  ${migrated}`);
    console.log(`Skipped (sender was the coach):   ${skippedCoachOutbound}`);
    console.log(`Forwarded duplicates deleted:     ${deletedDuplicates}`);
    console.log(`Source scanned total:             ${sourceSnap.size}`);
    console.log('');
    console.log(`Post-migration counts:`);
    console.log(`  Messages still addressed to FROM (${FROM_UID.slice(0, 6)}…):   ${verifyFrom.size}`);
    console.log(`  Messages addressed to COACH (${COACH_UID.slice(0, 6)}…):       ${verifyCoach.size}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Done.');
    process.exit(0);
})().catch(err => {
    console.error('FAILED:', err.message);
    if (err.code === 'app/no-app' || (err.message ?? '').includes('credential')) {
        console.error('\nLikely missing Application Default Credentials. Run once:');
        console.error('  gcloud auth application-default login');
        console.error('Or set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON.');
    }
    process.exit(1);
});
