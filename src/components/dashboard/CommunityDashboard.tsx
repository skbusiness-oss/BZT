import { CommunityBioZackTeam } from './CommunityBioZackTeam';

/**
 * Community dashboard — BioZackTeam-style self-tracking only.
 * No coaching features, no upgrade CTA, no quick actions.
 * Coach view-as renders this same panel via /users/:userId/view (read-only).
 */
export const CommunityDashboard = () => <CommunityBioZackTeam />;
