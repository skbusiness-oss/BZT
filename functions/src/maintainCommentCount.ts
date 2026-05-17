/**
 * maintainCommentCount — keeps `posts/{postId}.commentCount` in sync with
 * the actual `posts/{postId}/comments` subcollection. Server-only writes
 * so the client cannot inflate / forge the count (the Firestore rule
 * forbids non-author non-coach updates to commentCount).
 *
 * Increments on comment create, decrements on comment delete. Uses
 * FieldValue.increment for atomicity under concurrent comments.
 */
import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const onCommentCreated = onDocumentCreated(
    { region: 'us-central1', document: 'posts/{postId}/comments/{commentId}' },
    async (event) => {
        const postId = event.params.postId;
        await getFirestore().doc(`posts/${postId}`).set(
            { commentCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
            { merge: true },
        );
    },
);

export const onCommentDeleted = onDocumentDeleted(
    { region: 'us-central1', document: 'posts/{postId}/comments/{commentId}' },
    async (event) => {
        const postId = event.params.postId;
        await getFirestore().doc(`posts/${postId}`).set(
            { commentCount: FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp() },
            { merge: true },
        );
    },
);
