# Course Library Migration Log

Purpose: keep a clear, reversible record of every change made during the video-library-to-course-library migration.

Baseline

- Date started: 2026-05-03
- Branch at baseline: `master`
- Existing worktree state before this log was added: dirty, with many modified and untracked files already present.
- Safety rule: do not treat pre-existing modifications as migration changes unless explicitly noted in this file.

How To Use This Log

For every implementation step, add an entry with:

1. Goal
2. Files changed
3. What changed
4. Why it changed
5. How to verify
6. Rollback notes

Step Template

```md
## Step N - Short Title

Status: planned | in progress | completed | reverted
Date:

Goal:

Files changed:

- `path/to/file`

What changed:

- ...

Why:

- ...

How to verify:

- ...

Rollback notes:

- ...
```

## Step 0 - Migration Log Created

Status: completed
Date: 2026-05-03

Goal:

- Create a persistent record so another assistant or engineer can understand exactly what was changed during the course-library migration.

Files changed:

- `COURSE_LIBRARY_MIGRATION_LOG.md`

What changed:

- Added this log file and the required entry format.

Why:

- The repository already had many modified/untracked files before course-library implementation began, so a dedicated migration log is needed to distinguish new migration work from existing work.

How to verify:

- Confirm this file exists at the repo root.

Rollback notes:

- This file can be deleted if the migration is abandoned, but keeping it is recommended even if implementation changes are reverted.

## Step 1 - Course-Style Library Over Existing Videos

Status: completed
Date: 2026-05-03

Goal:

- Start the course-library design migration without deleting existing video CRUD, playback, Firebase reads, or local watch tracking.

Files changed:

- `COURSE_LIBRARY_MIGRATION_LOG.md`
- `src/pages/VideoLibrary.tsx`

What changed:

- Added course grouping on top of the existing flat `videos` data, using `level + category` as the temporary course identity.
- Added Stitch-style course cards as the primary `/library` experience.
- Added a course detail/timeline view with hero, progress, lesson count, estimated time, resource count, lesson nodes, and locked lesson states.
- Moved the existing flat video-card grid into a collapsible `Legacy Lesson Archive` so the old direct-video path remains available.
- Kept the existing add/edit/delete video modal, PDF attachment UI, local watched tracking, and video player modal intact.

Why:

- This gives the app the new course-library design direction immediately while avoiding a risky Firestore schema migration in the first pass.

How to verify:

- Run `npm.cmd run build` from PowerShell.
- Open `/library`.
- Confirm existing videos appear as course cards.
- Click a course card and confirm its lesson timeline opens.
- Click an unlocked lesson and confirm the existing video player opens.
- Confirm coach/admin add/edit/delete controls still target the original video records.
- Verification result: `npm.cmd run build` passed on 2026-05-03. The first `npm run build` attempt was blocked by PowerShell script policy, and the sandboxed `npm.cmd run build` attempt failed because Vite/esbuild could not spawn. The approved out-of-sandbox build passed.

Rollback notes:

- Revert the changes in `src/pages/VideoLibrary.tsx` from this step to return to the flat video-card grid.
- No Firestore collections or rules are changed in this step.

## Step 2 - Stabilize Claude Academy Backend Pass

Status: completed
Date: 2026-05-04

Goal:

- Fix the issues found after Claude's academy implementation so the app compiles safely and the new course/lesson access model does not leak protected lesson content.

Files changed:

- `COURSE_LIBRARY_MIGRATION_LOG.md`
- `src/context/AcademyContext.tsx`
- `src/components/academy/CourseDetail.tsx`
- `src/pages/VideoLibrary.tsx`
- `firestore.rules`

What changed:

- Confirmed the TypeScript build blockers from Claude's first pass had been resolved before the final stabilization edits: unused imports/state were gone and `createCourse` / `createLesson` now omit `createdBy` because the context writes it.
- Confirmed `AcademyContext.loadLessons()` now uses `onSnapshot` for real-time lesson reads instead of `getDocs`.
- Confirmed opening a lesson card no longer marks it complete automatically; completion now happens from `Mark as Complete` or `Next Lesson`.
- Updated `AcademyContext` so course listeners refresh when `user.role` changes, not only when `user.id` or coach/admin status changes.
- Added client-side access validation before `markLessonComplete()` writes progress. It now checks that the course exists, the lesson exists, the lesson is not archived, and the current user can access that lesson.
- Tightened `firestore.rules` for `courses/{courseId}/lessons/{lessonId}` so nested lessons respect the parent course access model, with preview lessons allowed only on published courses.
- Tightened `firestore.rules` for `userCourseProgress/{progressId}` so users can only create/update their own progress, cannot take over another user's progress doc, and can only write progress for a lesson they can read.
- Updated `VideoLibrary.tsx` so non-coaches explicitly cannot access unpublished courses and the active lesson listener refreshes if the user's role changes.
- Removed the stale `isCoach` prop passed into `CourseDetail`; the detail component only needs `isManaging` plus the `canAccessLesson` callback.

Why:

- The academy rewrite introduced the right long-term structure, but it needed a stabilization pass before it should be trusted: build health, real-time read consistency, access-control parity between UI and rules, and accurate progress behavior.

How to verify:

- Run `npm.cmd run build`.
- Open `/library`.
- Confirm Academy Path, Live Sessions, Topics, and coach Manage tab still render.
- Open a lesson and confirm the progress bar does not change until `Mark as Complete` or `Next Lesson` is pressed.
- Confirm a non-coach cannot read unpublished courses.
- Confirm non-preview lessons require access to the parent course.
- Verification result: `npm.cmd run build` passed on 2026-05-04 after the stabilization patch. Vite still reports a large chunk warning, but there are no TypeScript or production build errors.

Rollback notes:

- Revert the files listed in this step to restore Claude's pre-stabilization state.
- If only the progress hardening causes trouble during Firebase testing, revert the `isValidCourseProgressWrite()` helper and the `userCourseProgress` rule changes in `firestore.rules`, then retest progress writes.

## Step 3 - Secure Sequential Academy Flow

Status: completed
Date: 2026-05-04

Goal:

- Finish the core video-library academy flow with sequential lesson locking, safer per-lesson progress, accurate course counts, and protected academy lesson resources.

Files changed:

- `COURSE_LIBRARY_MIGRATION_LOG.md`
- `src/types/index.ts`
- `src/context/AcademyContext.tsx`
- `src/components/academy/CourseCard.tsx`
- `src/components/academy/CourseDetail.tsx`
- `src/components/academy/ManageLessonModal.tsx`
- `src/pages/VideoLibrary.tsx`
- `firestore.rules`
- `storage.rules`

What changed:

- Added academy data contracts for `LessonContent`, `LessonResource`, and `UserLessonProgress`.
- Added course summary fields: `lessonCount`, `requiredLessonCount`, and `totalDurationMinutes`.
- Split lesson saves in `AcademyContext`: public lesson metadata is written to `courses/{courseId}/lessons/{lessonId}`, while video URLs and PDF resources are written to `courses/{courseId}/lessonContent/{lessonId}`.
- Added `loadLessonContent()` using `onSnapshot`; locked lesson content is only loaded when the UI confirms the lesson is unlocked.
- Added `userLessonProgress/{userId_courseId_lessonId}` writes through `markLessonStarted()` and `markLessonComplete()`.
- Kept `userProgress` available to the UI, but now derives it locally from `userLessonProgress` instead of writing/trusting `userCourseProgress`.
- Added prerequisite syncing for required lessons. Required lessons are chained in course order; optional lessons do not block the path.
- Added course stat syncing after lesson create/update/archive/reorder.
- Updated the course detail UI so locked required lessons cannot be opened until their prerequisite is complete.
- Updated the lesson modal so academy PDFs are uploaded only for saved lessons, using `course-resources/{courseId}/{lessonId}/...`.
- Hardened Firestore rules:
  - lesson metadata cannot contain `videoUrl`, `platform`, or `resources`;
  - private `lessonContent` is readable only when the lesson is unlocked;
  - per-lesson progress can only be written by the owning user for an unlocked lesson;
  - legacy `userCourseProgress` writes are no longer client-writable.
- Hardened Storage rules:
  - legacy `video-pdfs` reads are coach/admin only;
  - academy `course-resources` reads use the same sequential lesson access check.
- Existing legacy video CRUD/archive remains present; no legacy components or data were deleted.

Why:

- The previous academy pass had the right UI/backend shape, but sequence gating and protected lesson content need to be enforceable instead of only visual.

How to verify:

- Run `npm.cmd run build`.
- As coach/admin: create a course, add lessons, reorder lessons, and confirm counts update on course cards.
- As client/community: confirm later required lessons stay locked until previous required lessons are completed.
- Confirm opening a lesson starts progress and `Mark as Complete` completes only that lesson.
- Confirm lesson video/resources are loaded from protected lesson content only after the lesson is unlocked.
- Verification result: `npm.cmd run build` passed on 2026-05-04 after Step 3. Vite still reports the existing large chunk warning, but there are no TypeScript or production build errors.
- Not verified locally: Firebase rules emulator tests, because Firebase CLI is not installed in this workspace.

Rollback notes:

- Revert the files listed in this step.
- Existing legacy videos remain in the legacy archive; this step does not delete them.
- If Storage access causes trouble during manual testing, first check that academy PDFs are under `course-resources/{courseId}/{lessonId}/...`; old `video-pdfs` are intentionally no longer broadly readable.
