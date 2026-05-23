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
export { consolidateMessagesToCoach } from './consolidateMessages';
export { onMessageCreated, onCheckInReviewed } from './pushNotifications';
export { onBroadcastCreated } from './broadcastNotifications';
export { weeklyReminders } from './weeklyReminders';
export { sendTestPush } from './sendTestPush';
export { stripeWebhook } from './stripeWebhook';
export { createUpgradeCheckout } from './createUpgradeCheckout';
export { createCustomerPortalSession } from './createCustomerPortalSession';
export { createClientAccount } from './createClientAccount';
