/**
 * One-shot script — duplicate every message addressed to `FROM_UID`
 * into a parallel message addressed to `TO_UID`. Idempotent via
 * `forwardedFromMessageId` marker.
 *
 * Uses Application Default Credentials. If you've ever run
 *   gcloud auth application-default login
 * OR have GOOGLE_APPLICATION_CREDENTIALS pointing at a service account
 * JSON, this will work. Otherwise admin.initializeApp() will throw and
 * the error message will tell you what's missing.
 *
 * Run with:
 *   node scripts/forward-messages-once.cjs
 */
const admin = require('firebase-admin');

const FROM_UID = 'ITc4VlP0PNeNUetjNxpEyGJOpW32'; // admin (Souktan)
const TO_UID   = 'Y9DlGI9kF6dPFPBh4cDvMnxbayB3'; // coach Zaki (medzakc90)
const PROJECT_ID = 'biozackteam-3d593';

(async () => {
    admin.initializeApp({ projectId: PROJECT_ID });
    const db = admin.firestore();

    console.log(`Forwarding messages with receiverId=${FROM_UID} → receiverId=${TO_UID}`);

    // 1. All messages addressed to FROM
    const sourceSnap = await db.collection('messages').where('receiverId', '==', FROM_UID).get();
    console.log(`Source messages found: ${sourceSnap.size}`);

    if (sourceSnap.empty) {
        console.log('Nothing to forward. Exiting.');
        process.exit(0);
    }

    // 2. Existing forwarded copies (idempotency)
    const existingFwdSnap = await db.collection('messages').where('receiverId', '==', TO_UID).get();
    const alreadyForwardedIds = new Set();
    existingFwdSnap.docs.forEach(d => {
        const fromId = d.data().forwardedFromMessageId;
        if (fromId) alreadyForwardedIds.add(fromId);
    });
    console.log(`Already-forwarded source ids: ${alreadyForwardedIds.size}`);

    // 3. Forward each not-yet-forwarded message
    let forwarded = 0;
    let skipped = 0;
    const BATCH = 400;
    const sourceDocs = sourceSnap.docs;
    for (let i = 0; i < sourceDocs.length; i += BATCH) {
        const slice = sourceDocs.slice(i, i + BATCH);
        const batch = db.batch();
        for (const src of slice) {
            if (alreadyForwardedIds.has(src.id)) {
                skipped++;
                continue;
            }
            const data = src.data();
            const newRef = db.collection('messages').doc();
            batch.set(newRef, {
                ...data,
                receiverId: TO_UID,
                forwardedFromMessageId: src.id,
                forwardedFromUid: FROM_UID,
                forwardedAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
            });
            forwarded++;
        }
        await batch.commit();
        console.log(`  Batch ${Math.floor(i / BATCH) + 1} committed.`);
    }

    // 4. Audit log
    await db.collection('auditLog').add({
        action: 'forwardMessagesToCoach',
        actorUid: 'cli:scripts/forward-messages-once.cjs',
        fromUid: FROM_UID,
        toUid: TO_UID,
        forwardedCount: forwarded,
        skippedAlreadyForwardedCount: skipped,
        sourceTotal: sourceSnap.size,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Forwarded:                 ${forwarded}`);
    console.log(`Skipped (already done):    ${skipped}`);
    console.log(`Source total:              ${sourceSnap.size}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Done.');
    process.exit(0);
})().catch(err => {
    console.error('FAILED:', err.message);
    if (err.code === 'app/no-app' || err.message?.includes('credential')) {
        console.error('\nLikely missing ADC. Run once: `gcloud auth application-default login`');
    }
    process.exit(1);
});
