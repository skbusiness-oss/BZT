# BioZackTeam Platform Stabilization Plan

Last updated: 2026-05-05

This file is the working plan for platform errors, launch gaps, and implementation order. It covers the whole app, not only the video library.

Do not mark an item complete only because code exists. Mark it complete only after it is verified in the running app and, when relevant, in Firebase Auth, Firestore, Storage, and deployed Cloud Functions.

## Current Highest-Risk Issue

Coach deletion is not reliable yet.

Observed behavior:
- Coach tries to delete a user from the web app.
- App shows an internal error.
- Old delete path only marks the user disabled or removes client records.
- Removed/disabled user may still log in and watch videos.

Likely causes from code review:
- `functions/src/deleteUser.ts` deletes Firestore user data before Firebase Auth deletion succeeds.
- `src/context/AuthContext.tsx` recreates `users/{uid}` as a community profile when a signed-in Auth user has no Firestore user doc.
- `src/context/CoachingContext.tsx` still has a legacy frontend-only `removeClient` path that tries to set `disabled` from the browser.
- `firestore.rules` has many reads based on `isSignedIn()` and `role()` falls back to `community` when the user doc is missing.

Required outcome:
- Deleted users cannot sign in.
- Deleted users cannot access videos by deep link.
- Disabled users are blocked by Auth, Firestore rules, Storage rules, and UI.
- Coach receives a clear error message if deletion fails.
- Audit log remains even when deletion succeeds.

## Priority 0 - Access Revocation And Deletion

### 0.1 Fix `deleteUser` Cloud Function

Files:
- `functions/src/deleteUser.ts`
- `functions/src/index.ts`
- `src/pages/Clients.tsx`

Implementation:
- Validate caller is coach/admin.
- Validate `targetUid` exists.
- Block self-delete.
- First set Firebase Auth user disabled.
- Revoke refresh tokens immediately.
- Set `users/{targetUid}.disabled = true` before cleanup.
- Write deletion/audit log before destructive cleanup.
- Delete or soft-delete related Firestore docs.
- Delete Firebase Auth user last.
- If final Auth delete fails, leave the user disabled and return a clear callable error with a safe message.

Acceptance:
- Deleted user cannot sign in with email/password.
- Deleted user cannot access `/library`, `/workouts`, `/community`, or direct video URLs.
- Coach sees success only after Auth deletion or hard disable succeeds.
- Audit log exists after deletion.

### 0.2 Stop missing user profile recreation

File:
- `src/context/AuthContext.tsx`

Implementation:
- Do not auto-create `users/{uid}` during normal sign-in.
- Only allow profile creation in explicit setup/account creation flows.
- If an Auth user signs in and `users/{uid}` is missing, sign them out and show a blocked/account-not-found message.
- Keep a special admin bootstrap flow only if needed, and make it explicit.

Acceptance:
- A deleted Auth user cannot return as a community user if Firestore doc is missing.
- Existing legitimate users with valid `users/{uid}` still sign in normally.

### 0.3 Remove unsafe legacy delete fallback

Files:
- `src/pages/Clients.tsx`
- `src/context/CoachingContext.tsx`
- `src/context/DataContext.tsx`

Implementation:
- Do not use browser-side `removeClient` to revoke accounts.
- For clients without `userId`, show an "account link missing" repair state.
- Keep any record-only cleanup as an admin-only maintenance tool, not a normal delete action.

Acceptance:
- Every visible delete button uses the Cloud Function path.
- No frontend path claims to revoke access by writing `users/{uid}.disabled`.

### 0.4 Add active-user rule helper

Files:
- `firestore.rules`
- `storage.rules`

Implementation:
- Add helper equivalent to `isActiveUser()`:
  - request is authenticated.
  - `users/{request.auth.uid}` exists.
  - `disabled != true`.
- Use it for content reads, especially:
  - videos
  - courses
  - lesson metadata
  - lesson content
  - workouts
  - posts/comments
  - library categories/tags
  - user progress
- Do not let missing user docs fallback to community access.

Acceptance:
- Missing `users/{uid}` cannot read videos.
- Disabled user cannot read videos.
- Community/client/coach valid users still read their allowed content.

## Priority 1 - Video And Resource Security

### 1.1 Protect course resources and PDFs

Files:
- `storage.rules`
- `src/context/AcademyContext.tsx`
- `src/components/academy/ManageLessonModal.tsx`

Current gap:
- Storage reads for `video-pdfs` and `course-resources` are too broad for protected resources.

Implementation:
- Store course resources in course/lesson scoped paths.
- Only allow read when the same user can read the lesson content.
- Avoid storing permanent public download URLs for protected resources if possible.

Acceptance:
- Community user cannot download client-only lesson PDFs.
- Client cannot download coach-only resources.
- Direct URL/deep-link test fails for unauthorized users.

### 1.2 Scrub old lesson metadata

Files:
- `src/context/AcademyContext.tsx`
- optional script under `scripts/`

Current gap:
- New lesson writes split public metadata from private content, but old lesson docs may still contain `videoUrl`, `platform`, or `resources`.

Implementation:
- Create a one-time migration script or admin-only maintenance action.
- For every `courses/{courseId}/lessons/{lessonId}`, move private fields into `lessonContent/{lessonId}`.
- Delete private fields from lesson metadata.

Acceptance:
- No lesson metadata doc contains video URL or protected resources.
- App still plays lessons after migration.

### 1.3 Unify category systems

Files:
- `src/context/MediaContext.tsx`
- `src/context/AcademyContext.tsx`
- `src/pages/VideoLibrary.tsx`

Current gap:
- Legacy videos use `libraryTags` and `settings/videoCategories`.
- Academy courses use `libraryCategories`.

Implementation:
- Choose one canonical taxonomy.
- Migrate legacy tags/categories into it.
- Keep old collections read-only only during migration.

Acceptance:
- Coach/admin sees one category management UI.
- Filters use the same category source across courses, lives, and legacy videos.

## Priority 1 - Role-Based Experiences

### 2.1 Define entitlements per role

Roles:
- `admin`
- `coach`
- `client`
- `community`

Need a clear matrix:
- Which roles can watch community courses?
- Which roles can watch client courses?
- Which roles can use workouts?
- Which roles can post/comment?
- Which roles can message coaches?
- Which roles can submit weekly check-ins?
- Which roles can create or manage content?

Acceptance:
- Firestore rules, Storage rules, route guards, and UI all match the same matrix.

### 2.2 Improve client and community dashboards

Files:
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/ClientDashboard.tsx`
- `src/components/dashboard/CommunityBioZackTeam.tsx`

Current direction:
- Home should welcome first, then guide.
- Community users should not be pushed directly into weekly check-ins.
- Clients should see coaching tasks without feeling overwhelmed.

Needed blocks:
- Welcome header.
- Continue watching.
- Current workout or create/select workout.
- Streak and level.
- Current score/leadership status.
- Check-in only when relevant to paid coaching.
- Clear next action.

Acceptance:
- Community account has a calm first-run experience.
- Client account sees coaching obligations but not as the only app purpose.

### 2.3 Complete profile information system

Files:
- `src/pages/Profile.tsx`
- `src/components/profile/ProgressPanel.tsx`
- `src/pages/UserView.tsx`

Needed:
- Info panel for own profile.
- Current measurements.
- Goal.
- Plan/tier.
- Start date.
- Latest check-in data.
- Comparison between check-ins/logs.
- Photos when available.

Acceptance:
- Client/community can understand their own status from profile.
- Coach can inspect the same data from `UserView`.

## Priority 1 - Coach Admin And Coaching Workflow

### 3.1 Coach user view and search

Files:
- `src/pages/Clients.tsx`
- `src/pages/UserView.tsx`
- `src/AppRoutes.tsx`

Needed:
- Coach can search community and coaching users.
- Coach can open read-only user view.
- View includes profile, measurements, check-ins, activity, videos watched, streak, level, achievements.

Acceptance:
- Coach can prepare for live calls in under one minute.
- Route works from both clients and community tabs.

### 3.2 Coach cockpit

Files:
- `src/components/dashboard/CoachDashboard.tsx`

Needed:
- Pending check-ins.
- Stale clients.
- New community signups.
- Top active users.
- Users losing momentum.
- Recent video/course completion.
- Quick links to review/profile/message.

Acceptance:
- Coach dashboard answers "who needs me today?"

## Priority 2 - Leadership Score System

Goal:
- Score should reward useful client/community behavior without encouraging spam.

Server-side only:
- Award points through Cloud Functions.
- Store idempotent events under `users/{uid}/xpEvents/{eventId}`.
- Never let the browser directly mutate score.

Candidate inputs:
- Lesson completed.
- Course completed.
- Workout day completed.
- Daily self-log submitted.
- Weekly coaching check-in submitted.
- Helpful community post/comment.
- Streak maintained.

Anti-gaming:
- Cap points per source per day.
- No unlimited comment farming.
- Optional coach bonus/recognition.
- Monthly score separate from lifetime score.

Needed views:
- User profile level.
- Home dashboard score card.
- Coach leaderboard.
- Monthly winner export/snapshot.

Acceptance:
- Community and client roles both have score.
- Coach/admin can audit why a user has points.

## Priority 2 - Community Experience

Files:
- `src/pages/Community.tsx`
- `src/context/CommunityContext.tsx`
- `src/components/layout/Layout.tsx`

Current gap:
- Community context exists, but route experience appears closer to a Discord CTA.

Decision needed:
- Is community inside the app, Discord-only, or hybrid?

If inside app:
- Feed.
- Comments.
- Likes.
- Moderation/reporting.
- Coach announcements.
- Role-aware visibility.

If Discord-first:
- App should not pretend to have a full internal community.
- Make the Discord handoff intentional.

Acceptance:
- Community user knows exactly where discussion happens.

## Priority 2 - Design, Theme, And Premium Feel

Files:
- `src/index.css`
- `tailwind.config.js`
- `src/context/ThemeContext.tsx`
- dashboard/profile/workout/library components

Needed:
- Remove remaining "Atelier" text/comments if user-facing or confusing.
- Theme toggle near top app title/header, not only buried.
- Replace hardcoded colors in charts and cards with theme tokens.
- Check all screens in dark and light mode.
- Check mobile layout for overflow, cramped cards, and text clipping.

Acceptance:
- App feels like one product, not multiple design passes stitched together.
- Dark/light themes work across dashboards, library, workouts, profile, modals, charts.

## Priority 2 - Performance And Maintainability

Current gap:
- Main bundle is large.

Needed:
- Lazy-load large routes.
- Split `VideoLibrary`, `Workouts`, `CoachReview`, dashboard variants.
- Keep contexts lean.
- Reduce legacy `DataContext` usage over time.
- Remove dead/fluff code after flows are stable.

Acceptance:
- Initial load is smaller.
- Route transitions remain smooth.
- Build has no oversized main chunk warning or the warning is accepted with a reason.

## Priority 3 - Payments And External Access

Needed:
- Stripe customer/subscription model.
- Stripe webhook signature verification.
- Downgrade/cancel should update role/access.
- Delete should cancel active subscription or flag manual action.
- Vimeo/video provider access policy documented.
- Discord role removal if Discord is in scope.

Acceptance:
- A user who stops paying loses paid access without manual database edits.
- Delete/downgrade/access changes are visible in audit logs.

## Testing And Verification Plan

### Automated

Add tests for:
- Firestore rules:
  - Missing user doc cannot read videos.
  - Disabled user cannot read videos.
  - Community cannot read client-only lesson content.
  - Client cannot read another client's private data.
  - Coach can read scoped user/client data.
- Storage rules:
  - Client A cannot read Client B photos.
  - Community cannot read protected course resources.
- Cloud Functions:
  - `deleteUser` disables/deletes Auth user.
  - `deleteUser` keeps account disabled if cleanup partially fails.
  - `awardXp` is idempotent.

### Manual smoke tests

Run with these accounts:
- Admin
- Coach
- Paid client
- Community user
- Deleted user
- Disabled user

Smoke test:
- Sign in/out.
- Open dashboard.
- Open library.
- Play allowed and blocked videos.
- Complete lesson.
- Complete workout day.
- Submit self-log/check-in.
- Coach delete user.
- Deleted user login attempt.
- Direct URL/deep-link attempt after deletion.

## Suggested Implementation Order

1. Fix deletion/revocation path.
2. Stop missing profile recreation.
3. Add active-user Firestore/Storage gating.
4. Deploy functions/rules and test with real Firebase users.
5. Protect course resources/PDFs.
6. Scrub old lesson metadata.
7. Unify categories.
8. Finalize role entitlement matrix.
9. Polish dashboards/profile by role.
10. Complete coach cockpit and user view.
11. Finish leadership score/leaderboard.
12. Add tests and smoke checklist.
13. Optimize bundle and route lazy-loading.
14. Stripe/external access revocation.

## Notes For Claude Or Codex

- Keep changes small and verifiable.
- Do not delete existing components unless the plan explicitly says they are replaced and tested.
- Prefer server/rules enforcement over UI-only checks.
- After every security change, run:
  - `npm run build`
  - `npm --prefix functions run build`
  - Firebase emulator/rules tests once available.
- Document each completed step in this file or a dated migration log.
