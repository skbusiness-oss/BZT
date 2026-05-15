# BioZackTeam Fitness — AI Context

> Shared context file for Antigravity and Codex. Read this first before doing any work.

---

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Auth**: Firebase Authentication (email/password)
- **Database**: Cloud Firestore (real-time `onSnapshot` listeners)
- **Storage**: Firebase Storage (progress photos, PDFs)
- **Roles**: `admin`, `coach`, `client`, `community`
- **Languages**: English + Arabic (RTL support)

## Key Patterns

- All Firestore reads use `onSnapshot` (real-time, not `getDocs`)
- Client account creation uses a **secondary Firebase app** so the coach stays signed in
- Account revocation: set `users/{uid}.disabled = true` → AuthContext live-subscribes and kicks them out
- Static training programs live in `src/data/` (not Firestore) — 100+ pre-built workouts
- Input validation + rate limiting in `src/lib/validation.ts`
- Error boundaries wrap every route in `AppRoutes.tsx`

## Firebase Collections

| Collection | Purpose |
|---|---|
| `users/{uid}` | Auth profile, role, disabled flag, Stripe ID |
| `clients/{uid}` | Coaching client data (linked to users via `userId`) |
| `checkIns/{clientId-wN}` | Weekly check-in data (macros, weight, photos) |
| `videos/{id}` | Video library entries |
| `workouts/{id}` | Custom coach-created workouts |
| `messages/{id}` | Coach ↔ Client private messages |
| `posts/{id}` | Community feed posts |
| `settings/videoCategories` | Video category list |
| `settings/workoutCategories` | Workout category list |
| `userPrograms/{uid}` | Active training program assignment |

## Context Providers (in order of nesting)

1. `AuthProvider` — Firebase Auth + Firestore user doc
2. `CoachingProvider` — Clients, weeks/check-ins, CRUD operations
3. `MediaProvider` — Videos, workouts, categories
4. `MessagesContext` — Coach ↔ Client messaging
5. `CommunityContext` — Posts, likes, comments
6. `LanguageContext` — EN/AR bilingual support
7. `DataContext` — Legacy wrapper (being phased out)

## File Structure

```
src/
├── lib/
│   ├── firebase.ts          # App + Auth + Firestore + Storage init
│   ├── constants.ts          # DEFAULT_TARGETS
│   ├── validation.ts         # Input sanitization, rate limiting
│   └── exerciseService.ts    # Exercise data service
├── context/                  # All React contexts (see above)
├── pages/
│   ├── Login.tsx             # Sign-in only (no self-registration)
│   ├── Dashboard.tsx         # Role-based dashboard router
│   ├── CheckIn.tsx           # Client weekly check-in form
│   ├── CoachReview.tsx       # Coach reviews client check-ins
│   ├── Clients.tsx           # Coach client management
│   ├── Messages.tsx          # Private messaging
│   ├── Community.tsx         # Community feed
│   ├── VideoLibrary.tsx      # Video library (39KB — largest page)
│   ├── Workouts.tsx          # Training programs (54KB — largest page)
│   ├── Profile.tsx           # User profile
│   ├── Settings.tsx          # App settings
│   ├── AdminSetup.tsx        # Admin setup page
│   ├── UserView.tsx          # Coach view of any user
│   └── ProgramBrowse.tsx     # Browse training programs
├── components/
│   ├── layout/Layout.tsx     # Sidebar + background
│   ├── dashboard/            # Role-specific dashboard components
│   ├── checkin/              # Check-in sub-components
│   ├── workouts/             # Workout wizard, day view, exercise modal
│   └── shared/               # ErrorBoundary, shared components
├── hooks/
│   ├── useActiveProgram.ts   # Active program tracking
│   └── useSelfLogs.ts        # Self-logging hook
├── data/                     # 100+ static training programs
├── types/index.ts            # All TypeScript interfaces
├── i18n/                     # Translation files
└── AppRoutes.tsx             # Protected routes with role-based access
```

---

## Current Sprint

**Last session**: May 1, 2026 — Checklist audit + first batch of fixes
**Working on**: Fixes checklist (see below)
**Completed this session**:
- ✅ #10: Added `CheckInCompare` to client dashboard (clients can now compare their own weeks)
- ✅ #1: Replaced static "Status: Active" card with dynamic program completion %
- ✅ #4: Added audit logging (`deletionLogs/{uid}`) when coach deletes a client
- ✅ #6: Added `renameCategory` and `removeCategory` to MediaContext + DataContext
- ✅ #9: Enhanced `UserView` with coaching stats, Info modal, check-in compare toggle
- ✅ All changes pass `tsc --noEmit` with zero errors

**Known bugs**: Coach delete client doesn't fully revoke Firebase Auth (only sets Firestore `disabled` flag — needs Cloud Function)

**Next priorities**:
1. Theme system (#3) — CSS variables + toggle
2. Level-based courses (#5) — restructure video library
3. Achievements/XP (#7) — new system

---

## Fixes & Features Checklist

> Use this to verify each fix/feature is implemented.
> Mark `[x]` when verified in the running app + Firebase. Don't mark complete based on code presence alone.

### 1. Dashboard Organization (Community + Client)

- [ ] Community dashboard reviewed and reorganized (clear hierarchy, no clutter)
- [ ] Client dashboard reviewed and reorganized
- [ ] Consistent spacing, typography, and component reuse across both
- [ ] Primary actions are visually prominent; secondary info is de-emphasized
- [ ] Mobile-responsive at breakpoints: sm / md / lg
- [ ] No "random stats" floating without context — every metric has a reason to be there

### 2. Client Profile — Info + Measurements

- [ ] Default profile view no longer shows random/disconnected stats
- [ ] An **Info button** is present on the client profile
- [ ] Clicking Info opens a panel/modal with: current measurements, age, goal, plan tier, start date
- [ ] Latest check-in measurements visible (weight, body fat %, circumferences, etc.)
- [ ] Comparison UI: client can pick two weeks/check-ins and see them side by side
- [ ] Comparison shows numeric deltas (e.g., `-1.4 kg`, `-0.8% BF`)
- [ ] Comparison includes progress photos when available

### 3. Theme System (from Stitch design)

- [ ] Stitch design tokens (colors, typography, spacing) imported into the codebase
- [ ] Dark theme fully implemented across all screens
- [ ] Light theme fully implemented across all screens
- [ ] Theme toggle button accessible from header or settings
- [ ] Theme choice persists across sessions (localStorage + user profile)
- [ ] No hardcoded hex colors — all colors reference theme tokens
- [ ] All custom components (charts, modals, toasts) respect the active theme

### 4. Coach Delete Client — Full Firebase Cleanup ⚠️ (current bug)

> Current behavior: deleting only removes records, client still has video access. This must be fixed.

- [ ] Deleting from "My Clients" deletes the Firebase **Auth user** (not just Firestore doc)
- [ ] Firestore client document is removed (or soft-deleted with `deleted: true` and rules block access)
- [ ] Stripe subscription is cancelled via API on delete
- [ ] Vimeo / video library access is revoked immediately (custom claim or membership flag flipped)
- [ ] Discord role removed (if Discord integration is in scope)
- [ ] Deleted client cannot log in (verified by attempting login post-delete)
- [ ] Deleted client cannot access videos via deep link (verified)
- [ ] Confirmation modal shown before deletion ("This is permanent")
- [ ] Audit log / Firestore record of the deletion (who, when, which client)
- [ ] Cloud Function (or server route) handles cascade delete — not client-side only

### 5. Courses — Level-Based Structure

- [ ] Video library reorganized into **levels** (e.g., Beginner → Intermediate → Advanced)
- [ ] Each level contains ordered courses/playlists
- [ ] Videos within a course play in sequential order (next-video CTA)
- [ ] User progress tracked per video (watched / in-progress / not started)
- [ ] Visual progress bar per course and per level
- [ ] Coach can update a level's contents (add/remove/reorder videos and courses)
- [ ] Existing random playlists are migrated or archived (no orphan content)
- [ ] Vimeo integration preserves the new structure

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

- [ ] Two top-level tabs: **Community** and **Coaching Clients**
- [ ] Community tab lists all community members
- [ ] Coaching Clients tab lists 1-on-1 clients only
- [ ] Inside Coaching Clients: filter chips for **Cut**, **Bulk**, **Health**, **Pro**
- [ ] Filter chips work and can be combined with search
- [ ] Counts shown per tab and per filter (e.g., "Cut (12)")
- [ ] Search bar searches across the active tab
- [ ] Empty states handled (no clients in a filter)

### 9. Coach 3rd-Party View of Any Client

- [ ] Global search by name available to coach
- [ ] Search returns both community + coaching clients
- [ ] Clicking a result opens a read-only profile view
- [ ] Profile shows: name, age, goal, plan, start date
- [ ] Profile shows: latest measurements + check-in history
- [ ] Profile shows: video activity log (what they've watched, when)
- [ ] Profile shows: streaks, level, achievements
- [ ] Fast-load (optimized for use during live calls — under 1s if possible)
- [ ] Access scoped to coach role only — verified via Firestore rules

### 10. Compare Check-ins (Coaching Clients)

- [ ] Client can select 2+ check-ins from their history to compare
- [ ] Side-by-side metric view (weight, measurements, BF%, etc.)
- [ ] Photo comparison (front / side / back per selected week)
- [ ] Numeric deltas shown clearly between selected check-ins
- [ ] Optional: line chart showing trend across all check-ins
- [ ] Coach can perform the same comparison from the client's profile

### 11. Security — Prompt Injection & Data Isolation 🔒

#### Prompt injection / input safety
- [ ] All user text inputs sanitized server-side (no raw HTML, scripts stripped)
- [ ] If any LLM features exist (e.g., AI summaries, chatbot): system prompts isolated from user input
- [ ] LLM calls treat user content as data, not instructions (clear delimiters, instruction guards)
- [ ] Image uploads validated for type and size; OCR-based prompt-injection considered if images are fed to any LLM
- [ ] No system prompt leakage on probing inputs (manual test with adversarial prompts)

#### Data isolation (Firestore + Storage rules)
- [ ] Firestore security rules enforce: **client can only read/write their own data**
- [ ] Coach role has explicit, scoped read access (no blanket admin reads)
- [ ] Storage rules enforce per-user access on progress photos
- [ ] No client-side-only permission checks (server/rules are source of truth)
- [ ] API/Cloud Functions validate caller's UID against resource ownership on every write
- [ ] Rule unit tests written using `@firebase/rules-unit-testing` covering:
  - Client A cannot read Client B's check-ins
  - Client A cannot read Client B's photos
  - Non-coach cannot access `/coachOnly/*` paths
  - Deleted user's token is rejected
- [ ] Stripe webhooks verify signature before mutating data
- [ ] Auth token freshness enforced on sensitive routes

### Sign-off

- [ ] All items above verified in production-equivalent environment
- [ ] Manual smoke test completed by coach account
- [ ] Manual smoke test completed by community account
- [ ] Manual smoke test completed by paid client account
- [ ] No regressions on existing weekly check-in flow
