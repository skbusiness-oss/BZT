/**
 * Cloud Functions entry point. Each export becomes a deployable function.
 * Region + memory are set per function for cost (1st-gen on 256 MiB).
 */
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { awardXp } from './awardXp';
export { setUserRole } from './setUserRole';
export { setUserDisabled } from './setUserDisabled';
export { deleteUser } from './deleteUser';
export { onCommentCreated, onCommentDeleted } from './maintainCommentCount';
export { wipeLegacyMetrics } from './wipeLegacyMetrics';
export { forwardMessagesToCoach } from './forwardMessages';
export { onMessageCreated, onCheckInReviewed } from './pushNotifications';
