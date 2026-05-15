# BioZackTeam Fitness — AI Context

> Shared context file for Antigravity and Claude Code. Read this first before doing any work.

---

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Auth**: Firebase Authentication (email/password)
- **Database**: Cloud Firestore (real-time `onSnapshot` listeners)
- **Storage**: Firebase Storage (progress photos, PDFs)
- **Roles**: `admin`, `coach`, `client`, `community`
- **Languages**: English + Arabic (RTL support)
- **Design language**: "BioZackTeam" — deep navy `#0e1322`, liquid gold (`#e6c364→#c9a84c` gradient), no 1px borders, glassmorphism, editorial typography (Manrope display + Inter body).

## Key Patterns

- All Firestore reads use `onSnapshot` (real-time, not `getDocs`)
- Client account creation uses a **secondary Firebase app** so the coach stays signed in
- Account revocation: set `users/{uid}.disabled = true` → AuthContext live-subscribes and kicks them out (works mid-session, any tab)
- `AuthContext` lives on a per-user `onSnapshot` so role flips and disable take effect without refresh
- Static training programs live in `src/data/` (not Firestore) — 100+ pre-built workouts + ~30 exercise library entries
- Input validation + rate limiting in `src/lib/validation.ts`
- Error boundaries wrap every route in `AppRoutes.tsx`
- Admin email is from `VITE_ADMIN_EMAIL` env var (never hardcoded)

## Firebase Collections

| Collection | Purpose |
|---|---|
| `users/{uid}` | Auth profile, role, `disabled` flag, `disabledAt`, Stripe ID |
| `users/{uid}/selfLogs/{date}` | Daily self-tracked weight, measurements (chest/waist/hips/arms/thighs/neck), metrics (strength/hunger/energy/cardioCalories), notes |
| `clients/{clientId}` | Coaching client data (linked to users via `userId`) |
| `checkIns/{clientId-wN}` | Weekly check-in data (macros, weight, photos, scales) |
| `videos/{id}` | Video library entries |
| `workouts/{id}` | Custom coach-created workouts |
| `messages/{id}` | Coach ↔ Client private messages |
| `posts/{id}` + `posts/{id}/comments/{id}` | Community feed posts + comments |
| `settings/videoCategories` | Video category list |
| `settings/workoutCategories` | Workout category list |
| `userPrograms/{uid}` | Active training program assignment |
| `auditLog/{id}` | Coach-only append-only trail (delete client, etc.). `update`/`delete` denied by rules |
| `deletionLogs/{uid}` | Community-member ban audit (one doc per banned user) |
| `libraryCategories/{id}` | Academy course categories. Coach CRUD. `name`, `icon`, `createdBy`, `createdAt` |
| `libraryTags/{id}` | Legacy video tags. Coach CRUD. `name`, `icon`, `createdBy`, `createdAt` |
| `courses/{courseId}` | Academy courses. `title`, `description`, `level`, `courseType`, `categoryIds[]`, `accessTier`, `order`, `isRequired`, `isPublished`, `lessonCount`, `requiredLessonCount`, `totalDurationMinutes`, `coverImageUrl`, `createdBy`, `createdAt` |
| `courses/{courseId}/lessons/{lessonId}` | Lesson metadata only — no video URL. `title`, `description`, `thumbnailUrl`, `order`, `durationMinutes`, `isRequired`, `isPreview`, `prerequisiteLessonId`, `hasContent`, `archived`, `createdBy`, `createdAt` |
| `courses/{courseId}/lessonContent/{lessonId}` | Protected lesson content (video URL + PDFs). Readable only when lesson is unlocked by sequential progress. `videoUrl`, `platform`, `resources[]` |
| `userLessonProgress/{uid_courseId_lessonId}` | Per-lesson progress. `status: 'started' \| 'completed'`, `startedAt`, `completedAt`. Append-only (no delete). |
| `userCourseProgress/{uid_courseId}` | Legacy course-level progress. Now derived in memory from `userLessonProgress`. No longer client-writable. |

## Context Providers (in order of nesting)

1. `AuthProvider` — Firebase Auth + live-subscribed `users/{uid}` doc; exposes `authError` for disabled state
2. `CoachingProvider` — Clients, weeks/check-ins, CRUD operations
3. `MediaProvider` — Videos, workouts, categories (legacy `videos/{id}` + `libraryTags`)
4. `AcademyProvider` — Courses, lessons, lesson content, user lesson progress; all real-time `onSnapshot`
5. `MessagesContext` — Coach ↔ Client messaging
6. `CommunityContext` — Posts, likes, comments
7. `LanguageContext` — EN/AR bilingual support
8. `DataContext` — Legacy wrapper (being phased out)

## File Structure

```
src/
├── lib/
│   ├── firebase.ts          # App + Auth + Firestore + Storage init
│   ├── constants.ts         # DEFAULT_TARGETS
│   ├── validation.ts        # Input sanitization, rate limiting
│   └── exerciseService.ts   # Exercise data service
├── context/
│   ├── AcademyContext.tsx   # Courses, lessons (onSnapshot per course), lessonContent, userLessonProgress
│   └── ...                  # other contexts (see above)
├── lib/
│   └── videoUtils.ts        # buildEmbedUrl() — shared YouTube/Vimeo URL → embed URL parser
├── pages/
│   ├── Login.tsx            # Sign-in only (no self-registration); shows authError on disable
│   ├── Dashboard.tsx        # Role-based dashboard router
│   ├── CheckIn.tsx          # Client weekly check-in form
│   ├── CoachReview.tsx      # Coach reviews client check-ins; "Info" button + Compare panel
│   ├── Clients.tsx          # Coach client management — Coaching/Community tabs, filter chips
│   ├── Messages.tsx         # Private messaging
│   ├── Community.tsx        # Community feed
│   ├── VideoLibrary.tsx     # Zero to Hero Academy + Recorded Lives + Topics + Manage (legacy videos in details toggle)
│   ├── Workouts.tsx         # Training programs
│   ├── Profile.tsx          # User profile
│   ├── Settings.tsx         # App settings
│   ├── AdminSetup.tsx       # Admin setup page
│   ├── UserView.tsx         # Coach read-only view of any user (/users/:userId/view)
│   └── ProgramBrowse.tsx    # Browse training programs (/workouts/program/:programId)
├── components/
│   ├── layout/Layout.tsx
│   ├── academy/
│   │   ├── CourseCard.tsx          # Course card with level/type badge, progress bar, reorder controls
│   │   ├── CourseDetail.tsx        # Lesson timeline; sequential locking; async lesson open + resource URL
│   │   ├── ManageCourseModal.tsx   # Create/edit course (title, description, cover, level, type, access, categories)
│   │   └── ManageLessonModal.tsx   # Add/edit lesson; PDF upload via uploadLessonResource; reads lessonContent
│   ├── dashboard/
│   │   ├── ClientDashboard.tsx     # Coaching client (existing + SelfTrackingPanel)
│   │   ├── CommunityDashboard.tsx  # Renders ONLY <CommunityBioZackTeam />
│   │   ├── CommunityBioZackTeam.tsx # BioZackTeam dashboard (header, weight chart, daily check-in, body measurements)
│   │   ├── CoachDashboard.tsx
│   │   ├── MeDashboard.tsx
│   │   ├── ProgressCharts.tsx
│   │   └── SelfTrackingPanel.tsx   # Reusable weight + measurements panel (owner-write, coach read-only)
│   ├── checkin/
│   │   ├── ClientInfoPanel.tsx     # Modal: vitals, plan, goal, latest check-in, photos, streak
│   │   ├── CheckInCompare.tsx      # Pick 2 weeks → side-by-side metrics + deltas + photos
│   │   ├── DailyTrackingTable.tsx
│   │   └── ClientInfoPanel.tsx
│   ├── workouts/
│   │   ├── ActiveProgramCard.tsx
│   │   ├── ExerciseModal.tsx
│   │   ├── ProgramCard.tsx
│   │   ├── ProgramDetail.tsx
│   │   └── WorkoutDayView.tsx
│   └── shared/                     # ErrorBoundary, AddClientModal, VideoPlayer
├── hooks/
│   ├── useActiveProgram.ts         # Active program tracking
│   ├── useSelfLogs.ts              # Self-logging (subscribes to users/{uid}/selfLogs)
│   └── useCommunityMembers.ts      # Lists community members for coach (where role == 'community')
├── data/                            # 100+ static programs + exerciseLibrary.ts (lift + cardio_protocol entries)
├── types/index.ts                   # All TypeScript interfaces
├── i18n/                            # Translation files
└── AppRoutes.tsx                    # Protected routes with role-based access
```

---

## Current Sprint

**Last session**: May 4, 2026 — Zero to Hero Academy full implementation
**Working on**: Testing + next feature

**Completed (May 1–4)**:
- ✅ **BioZackTeam UI migration fully complete** — all pages migrated to `surface-container` tokens + `font-headline`/`font-label` typography.
- ✅ **§1 Dashboard organization** — Community = BioZackTeam-only. Coaching client = existing + `SelfTrackingPanel`.
- ✅ **§2 Client profile** — `ClientInfoPanel` + `CheckInCompare`.
- ✅ **§4 Coach delete client** (everything except Cloud-Function items).
- ✅ **§8 My Clients tabs** — Coaching / Community tabs; Cut/Bulk/Pro/Health filter chips.
- ✅ **§9 partial** — `/users/:userId/view` read-only coach view.
- ✅ **§11 partial** — Firestore rules hardened, Storage rules use `firestore.get()` role check.
- ✅ **§5 Zero to Hero Academy** — Full `AcademyContext` with real-time `onSnapshot` listeners; `courses`, `lessonContent`, `userLessonProgress` Firestore collections; sequential lesson locking via `prerequisiteLessonId`; `CourseCard`, `CourseDetail`, `ManageCourseModal`, `ManageLessonModal` components; coach full CRUD with drag-order (swap batch); PDF uploads to `course-resources/{courseId}/{lessonId}/`; `buildEmbedUrl` shared utility; complete Firestore + Storage rules; `tsc --noEmit` passes with zero errors.

**Known bugs / blockers**:
- ⚠️ Full Firebase Auth account deletion requires a Cloud Function — not shipped.
- ⚠️ Academy has no data until a coach creates the first course in the running app (no seed data).
- ⚠️ `userCourseProgress` (legacy summary) is no longer client-writable — any old client-side writes will be rejected by updated Firestore rules.

**Next priorities**:
1. **§3 Theme system** — light theme + toggle.
2. **§7 Achievements & leveling**.
3. **§4 finish** — Cloud Function for hard Auth delete + Stripe cancel.
4. **§11 finish** — rules unit tests via `@firebase/rules-unit-testing`.

---

## Video Library → Course Library Migration Plan

> Reference: `COURSE_LIBRARY_MIGRATION_LOG.md` tracks every implementation step.
> Stitch reference files: `code3.html`/`screen3.png` (Course Library), `code2.html`/`screen2.png` (Course Detail), `code1.html`/`screen1.png` (Lesson Player), `code.html`/`screen.png` (Manage Tags).

### Target Data Model

| Collection | Fields |
|---|---|
| `courses/{courseId}` | `title`, `description`, `level`, `tagIds[]`, `coverImageUrl`, `accessTier`, `order`, `isPublished`, `createdBy`, `createdAt`, `updatedAt` |
| `courses/{courseId}/lessons/{lessonId}` | `title`, `description`, `videoUrl`, `platform`, `thumbnailUrl`, `durationMinutes`, `order`, `resources[]`, `isPreview`, `createdAt` |
| `libraryTags/{tagId}` | `name`, `icon`, `createdBy`, `createdAt` |
| `userCourseProgress/{uid_courseId}` | `userId`, `courseId`, `completedLessonIds[]`, `lastLessonId`, `completedAt`, `updatedAt` |

### Access Tiers
- `community` users: courses/lessons with `accessTier: "community"` OR lesson `isPreview: true`
- `client` users: `community` + `coaching` content
- `coach`/`admin`: full access + management

### Routes (target)
- `/library` — Course Library grid (level tabs + tag filters)
- `/library/courses/:courseId` — Course Detail (hero, progress, lesson timeline, resources)
- `/library/courses/:courseId/lessons/:lessonId` — Lesson Player (video, metadata, mark complete, next lesson CTA)
- `/settings/library-tags` — Manage Library Tags (coach-only)

### Implementation Order
1. ~~Step 0 — Migration log~~ ✅
2. ~~Step 1 — Frontend course bridge (Codex)~~ ✅ No Firestore changes
3. **Step 2 — `libraryTags` collection** — replace `settings/videoCategories` array; coach CRUD; Firestore rules
4. **Step 3 — `courses` + `lessons` collections** — types, MediaContext listeners, CRUD functions, Firestore rules, Storage rules
5. **Step 4 — UI: Course Library** — real courses replace derived `courseGroups`; progress from Firestore
6. **Step 5 — UI: Course Detail** — real lesson timeline; sequential locking; next-lesson CTA
7. **Step 6 — UI: Lesson Player** — full-screen player; mark complete; resource blueprint
8. **Step 7 — UI: Manage Tags** — Stitch §7.4 layout (asymmetric bento); coach CRUD
9. **Step 8 — Video migration** — map existing `videos/{id}` into starter courses or "Legacy Library" courses; no deletion until verified

### Migration Rules
- Keep `lucide-react` icons (no Material Symbols switch — app-wide consistency).
- Keep BioZack branding; ignore "Antigravity" text from design PDF.
- Preserve existing `videos/{id}` collection as read-only legacy until Step 8 is verified.
- Store progress in Firestore per user (replace localStorage `bz_watched`).
- Full coach/admin CRUD in v1.
7. **§11 finish** — rules unit tests via `@firebase/rules-unit-testing`.
8. **§4 finish** — Cloud Function for hard Auth delete + Stripe cancel.

---

## Fixes & Features Checklist

> Use this to verify each fix/feature is implemented.
> Mark `[x]` when verified in the running app + Firebase. Don't mark complete based on code presence alone.

### 1. Dashboard Organization (Community + Client)

- [x] Community dashboard reviewed and reorganized (clear hierarchy, no clutter) — `CommunityBioZackTeam`
- [x] Client dashboard reviewed and reorganized — existing + `SelfTrackingPanel`
- [x] Consistent spacing, typography, and component reuse across both
- [x] Primary actions are visually prominent; secondary info is de-emphasized
- [x] Mobile-responsive at breakpoints: sm / md / lg
- [x] No "random stats" floating without context — every metric has a reason to be there

### 2. Client Profile — Info + Measurements

- [x] Default profile view no longer shows random/disconnected stats
- [x] An **Info button** is present on the client profile (CoachReview header)
- [x] Clicking Info opens a panel/modal with: current measurements, age, goal, plan tier, start date
- [x] Latest check-in measurements visible (weight, scales, cardio calories)
- [x] Comparison UI: pick two weeks/check-ins and see them side by side (`CheckInCompare`)
- [x] Comparison shows numeric deltas (e.g., `-1.4 kg`)
- [x] Comparison includes progress photos when available (front / side / back)
- [ ] Body fat % / circumferences — schema doesn't track these on Week yet (only via selfLogs measurements)

### 3. Theme System (from Stitch design)

- [x] Stitch design tokens (colors, typography, spacing) imported into the codebase
- [x] Dark theme fully implemented across all screens (BioZackTeam)
- [ ] Light theme fully implemented across all screens (Deferred — Luxury spec is dark-only)
- [ ] Theme toggle button accessible from header or settings
- [ ] Theme choice persists across sessions (localStorage + user profile)
- [x] No hardcoded hex colors — all colors reference theme tokens
- [x] All custom components (charts, modals, toasts) respect the active theme

### 4. Coach Delete Client — Full Firebase Cleanup ⚠️

> **Current behavior**: Disable flag works (account is locked out of web app immediately). Hard Auth deletion is blocked on Cloud Functions.

- [ ] Deleting from "My Clients" deletes the Firebase **Auth user** (needs Cloud Function)
- [x] Firestore client document is removed; checkIns deleted; `userPrograms` cleared
- [ ] Stripe subscription is cancelled via API on delete (needs Cloud Function)
- [ ] Vimeo / video library access is revoked immediately (needs Cloud Function or custom claim)
- [ ] Discord role removed (out of scope until Discord integration exists)
- [x] Deleted client cannot log in (verified — disable flag + AuthContext `onSnapshot` kicks them out)
- [x] Deleted client cannot access videos via deep link (auth gate kicks them out instantly)
- [x] Confirmation modal shown before deletion ("This is permanent" — BioZackTeam red modal)
- [x] Audit log / Firestore record of the deletion (`auditLog/{id}` + `deletionLogs/{uid}`)
- [ ] Cloud Function (or server route) handles cascade delete — not client-side only

### 5. Courses — Level-Based Structure

- [x] Video library reorganized into **levels** (Beginner / Intermediate / Advanced tabs in VideoLibrary)
- [x] Each level contains ordered courses (`order` field; coach can reorder via ↑↓ swap-batch)
- [x] Lessons within a course play in sequential order (required lessons locked until prerequisite complete)
- [x] User progress tracked per lesson (`userLessonProgress` — started / completed)
- [x] Visual progress bar per course (completed / total required lessons)
- [x] Coach can add/edit/archive/reorder courses and their lessons (full CRUD in Manage tab)
- [ ] Existing legacy videos migrated into starter courses (only code-available; no seed data yet)
- [x] Vimeo integration — `buildEmbedUrl` parses YouTube + Vimeo URLs into embed URLs; platform stored on lessonContent

### 6. Playlists — Tags CRUD

- [ ] Coach UI to **create** a tag (e.g., cardio, hormones, diet)
- [ ] Coach UI to **edit** a tag (rename)
- [ ] Coach UI to **delete** a tag (with confirmation; handles tag in use)
- [ ] Tags can be assigned to one or more playlists
- [ ] Video library has a tag filter that uses these tags
- [ ] Filter supports multi-select
- [ ] Tag changes reflect in real time for all users (Firestore listener)
- [ ] Tags stored in their own Firestore collection with proper schema (`id`, `name`, `createdBy`, `createdAt`)

### 7. Achievements & Leveling System

- [ ] Achievement tracking active for **paid (coaching) clients**
- [ ] Achievement tracking active for **community clients**
- [ ] Inputs tracked: videos watched, weekly check-ins submitted, streaks, comments, etc.
- [ ] User levels up based on activity score
- [ ] User levels **down** (or score decays) with inactivity
- [ ] Level + progress visible on user profile
- [ ] Notification/toast when an achievement unlocks or level changes
- [ ] **Monthly leaderboard** computed and visible
- [ ] Top 10 monthly users flagged for gifts/recognition (export or admin view)
- [ ] Leaderboard reset/snapshot logic at month end (Cloud Function on schedule)

### 8. Coach "My Clients" — Tab Structure

- [x] Two top-level tabs: **Community** and **Coaching Clients**
- [x] Community tab lists all community members (via `useCommunityMembers`)
- [x] Coaching Clients tab lists 1-on-1 clients only (filter `accessLevel === 'client'`)
- [x] Inside Coaching Clients: filter chips for **Cut**, **Bulk**, **Health**, **Pro**
- [x] Filter chips work and can be combined with search
- [x] Counts shown per tab and per filter (e.g., "Cut (12)")
- [x] Search bar searches across the active tab
- [x] Empty states handled (no clients in a filter)

### 9. Coach 3rd-Party View of Any Client

- [ ] Global search by name available to coach (only per-tab search exists today)
- [ ] Search returns both community + coaching clients in one place
- [x] Clicking a result opens a read-only profile view (`/users/:userId/view`)
- [x] Profile shows: name, age, goal, plan, start date (via `ClientInfoPanel`)
- [x] Profile shows: latest measurements + check-in history (via `SelfTrackingPanel` for community; `CheckInCompare`/`CoachReview` for coaching)
- [ ] Profile shows: video activity log (what they've watched, when) — depends on §5
- [ ] Profile shows: streaks, level, achievements — depends on §7
- [ ] Fast-load (optimized for use during live calls — under 1s if possible)
- [x] Access scoped to coach role only — verified via Firestore rules + `ProtectedRoute`

### 10. Compare Check-ins (Coaching Clients)

- [x] Component exists (`CheckInCompare`) — pick 2 weeks → metrics + deltas + photos
- [ ] Client can select 2+ check-ins from their history to compare (component not yet embedded in client view)
- [x] Side-by-side metric view (weight, strength, energy, hunger, cardio calories)
- [x] Photo comparison (front / side / back per selected week)
- [x] Numeric deltas shown clearly between selected check-ins
- [ ] Optional: line chart showing trend across all check-ins
- [x] Coach can perform the same comparison from the client's profile (CoachReview)

### 11. Security — Prompt Injection & Data Isolation 🔒

#### Prompt injection / input safety
- [ ] All user text inputs sanitized server-side (no raw HTML, scripts stripped)
- [x] No LLM features in the app today (N/A unless added later)
- [ ] (When LLM is added) System prompts isolated from user input
- [ ] (When LLM is added) Treat user content as data, not instructions
- [x] Image uploads validated for type and size (`validateImageFile`); MIME used for extension to prevent spoofing
- [x] No system prompt to leak (no LLM yet)

#### Data isolation (Firestore + Storage rules)
- [x] Firestore security rules enforce: client can only read/write their own data
- [x] Coach role has explicit, scoped read access (no blanket admin reads — role-based per collection)
- [x] Storage rules enforce per-user access on progress photos (with Firestore-backed role check via `firestore.get()`)
- [x] No client-side-only permission checks (rules are source of truth)
- [x] Owner cannot elevate own role or un-disable themselves (rule denies `role`, `disabled`, `disabledAt`)
- [x] `posts.authorRole` spoofing prevented (must equal caller's actual `role()`)
- [x] `checkIns` coach-only fields locked from client updates (`coachFeedback`, `newMacros`, `activeTargets`, `status`)
- [x] `auditLog` / `deletionLogs` are append-only, coach-only
- [ ] Rule unit tests written using `@firebase/rules-unit-testing`
- [ ] Stripe webhooks verify signature before mutating data (no Stripe yet)
- [ ] Auth token freshness enforced on sensitive routes

### Sign-off

- [ ] All items above verified in production-equivalent environment
- [ ] Manual smoke test completed by coach account
- [ ] Manual smoke test completed by community account
- [ ] Manual smoke test completed by paid client account
- [ ] No regressions on existing weekly check-in flow
