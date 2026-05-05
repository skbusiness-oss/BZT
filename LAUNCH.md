# BioZackTeam — 4-Day Pre-Launch Sprint

> **Target launch date: T+4.** Closed beta with one coach + first paying clients.
> This document drives daily standups. Mark items `[x]` only after the
> "Done means" check passes on a real device.

**Critical truth:** the app is feature-complete enough. The launch risk is **integrity** —
banned users still have access, scores are forge-able, content paths leak, and there's no
real revocation chain. Each day below closes one slice of that risk.

---

## Pre-flight (do once, before Day 1)

- [ ] Confirm Firebase project is on **Blaze plan** (Cloud Functions + outbound HTTP require it). If not, upgrade — every server-side fix below depends on it.
- [ ] Set up `firebase init functions` (TypeScript). Region: `us-central1` unless coach is in EU.
- [ ] Add `firebase-admin` and `firebase-functions` to a new `functions/` directory.
- [ ] Create a `staging` Firebase project mirror so destructive tests don't hit prod.
- [ ] Snapshot prod Firestore (`gcloud firestore export gs://...-backup/launch-baseline`).

---

## Day 1 (T-3) — Trust Boundary

**Theme:** make XP, role, and access changes **server-controlled**.
After today: a user can't forge their score, can't escalate their role,
can't survive a ban past the next token refresh.

### 1.1 Cloud Function: `awardXp` (idempotent, server-side)

Move XP writes off the client.

- [ ] `functions/src/awardXp.ts` — callable function. Validates `source` against an allowlist (`SELF_LOG`, `WEEKLY_CHECKIN`, `WORKOUT_DAY`, `LESSON_COMPLETE`, `POST`, `COMMENT`).
- [ ] Idempotency: composite event ID `${uid}-${source}-${sourceId}` in `xpEvents/` — `setDoc(..., { merge: false })` so duplicate calls reject.
- [ ] On success: increment `users/{uid}.activityScore`, recompute streak, mirror to `publicProfiles/{uid}`. Single transaction.
- [ ] Update [src/lib/activityScore.ts](src/lib/activityScore.ts) → `awardXp` becomes a thin `httpsCallable` wrapper. Drop the writeBatch.
- [ ] Update Firestore rules: `users/{uid}.activityScore`, `users/{uid}.streak`, `publicProfiles/{uid}` are now **read-only for owners, write-only for service account**.

**Done means:** signed in as a client, open DevTools, run `firebase.firestore().doc('users/MY_UID').update({ activityScore: 999999 })` → permission denied. Same write through the callable function works once, fails on retry.

### 1.2 Cloud Function: `setUserRole` (custom claims)

Roles need to live in the auth token, not a Firestore field, so Storage rules can check them without cross-service reads.

- [ ] `functions/src/setUserRole.ts` — callable, coach-only via `isCoach(context.auth)`.
- [ ] Sets `admin.auth().setCustomUserClaims(uid, { role: 'coach' | 'client' | 'community' | 'admin' })`.
- [ ] Mirrors to `users/{uid}.role` for readability in queries.
- [ ] Forces token refresh for the affected user via `admin.auth().revokeRefreshTokens(uid)` so the new claim takes effect within 1 hour (or sooner on next foreground).
- [ ] Update [src/context/CoachingContext.tsx](src/context/CoachingContext.tsx) `updateClient` — when `accessLevel` flips, call this function instead of writing the role field directly.

**Done means:** new account → `firebase.auth().currentUser.getIdTokenResult().then(t => console.log(t.claims.role))` returns the role.

### 1.3 Cloud Function: `setUserDisabled` (real revocation)

This is the fix for "I disabled them but they still see videos."

- [ ] `functions/src/setUserDisabled.ts` — callable, coach-only.
- [ ] Calls `admin.auth().updateUser(uid, { disabled: true })` AND `admin.auth().revokeRefreshTokens(uid)`.
- [ ] Sets `users/{uid}.disabled = true` and `disabledAt = serverTimestamp()` for query/audit.
- [ ] Cancels Stripe subscription if present (stub for now if Stripe isn't wired).
- [ ] Writes to `deletionLogs/{uid}` (already in rules).

**Done means:** ban a client → within 60 seconds (next foreground/refresh) their PWA is back at `/login` with "Your account has been disabled."

### 1.4 Cloud Function: `deleteUser` (full cascade)

- [ ] `functions/src/deleteUser.ts` — callable, coach-only.
- [ ] Deletes Firebase Auth user (`admin.auth().deleteUser(uid)`).
- [ ] Deletes `users/{uid}`, `clients/{clientId}`, all `checkIns/{clientId-w*}`, `userPrograms/{uid}`, `publicProfiles/{uid}`, `users/{uid}/selfLogs/*`, `users/{uid}/xpEvents/*`.
- [ ] Cancels Stripe subscription.
- [ ] Writes audit `deletionLogs/{uid}` with `{ deletedBy, deletedAt, reason }`.
- [ ] Update [src/pages/Clients.tsx](src/pages/Clients.tsx) delete confirmation to call this function.

**Done means:** delete a client → their UID can no longer log in (Firebase shows "user-not-found"). All their docs are gone except the audit log.

### 1.5 Lock Storage Rules to coach claim

Now that roles are in the token, replace the broken `firestore.get` pattern (which we fell back to "any signed-in user") with a real check.

- [ ] [storage.rules](storage.rules):
  ```
  function isCoach() {
    return request.auth.token.role in ['coach', 'admin'];
  }
  match /video-pdfs/{videoId}/{allPaths=**} {
    allow read: if request.auth != null;
    allow write, delete: if isCoach()
                          && request.resource.contentType.matches('application/pdf.*')
                          && request.resource.size <= 50 * 1024 * 1024;
  }
  match /course-resources/{courseId}/{lessonId}/{allPaths=**} {
    allow read: if request.auth != null;
    allow write, delete: if isCoach()
                          && request.resource.contentType.matches('application/pdf.*')
                          && request.resource.size <= 50 * 1024 * 1024;
  }
  ```
- [ ] Same `request.auth.token.role` check for any future coach-only paths.

**Done means:** a community user signing into DevTools and trying to upload to `/course-resources/foo/bar/x.pdf` gets `storage/unauthorized`.

### Day 1 acceptance gate

- [ ] All 4 callable functions deployed.
- [ ] Storage rules use custom claims (no more `firestore.get`).
- [ ] Firestore rules block client-side writes to `activityScore`, `streak`, `role`, `disabled`.
- [ ] Manual test: signed-in client cannot inflate their own score, cannot become coach, cannot survive a ban.

---

## Day 2 (T-2) — Disabled Enforcement + Idle Timeout + Watermark

**Theme:** make sure a banned user actually loses access on every device,
even when the PWA is bookmarked, even after a long idle.

### 2.1 Force fresh auth on resume

The PWA on a phone often runs in the background for days. When the user opens it,
the SW serves cached HTML and the existing Firebase Auth state is still "signed in"
even if the user has been disabled in the meantime.

- [ ] [src/context/AuthContext.tsx](src/context/AuthContext.tsx) — add a `visibilitychange` listener:
  ```ts
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        // Force token refresh — if the user is disabled at the Auth layer,
        // this throws and we sign out.
        auth.currentUser.getIdToken(true).catch(async () => {
          await firebaseSignOut(auth);
          setUser(null);
        });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
  ```
- [ ] Same listener should re-fetch the user doc once on resume to catch the `disabled: true` flag if Auth-level disable hasn't kicked in yet.

**Done means:** on the same device, ban the user from the coach side, switch to the banned user's PWA, foreground it → within 5 seconds they're booted to /login.

### 2.2 Block render until user doc is fresh

Today the loading flow is: token exists → render. We need: token exists AND user doc fetched THIS session AND not disabled → render. Otherwise the cached app shell can show a single video to a disabled user before the snapshot arrives.

- [ ] [src/AppRoutes.tsx](src/AppRoutes.tsx) `ProtectedRoute` — add a `freshUserDocLoaded` flag from AuthContext. Show the loader (not the layout) until it's true.
- [ ] AuthContext sets `freshUserDocLoaded = false` on every `visibilitychange`-triggered refresh and `true` only after the snapshot fires.

**Done means:** even if the SW serves a cached `index.html` instantly, the app sits on a loader until the live user doc says "ok, not disabled."

### 2.3 Idle timeout — force re-login after N minutes

The classic PWA bookmark problem. Even with #2.1, if the device never wakes the page, the cached state lives forever.

- [ ] In AuthContext, on every user interaction (focus, click, navigation) write `localStorage.setItem('lastActiveAt', Date.now())`.
- [ ] On app boot, if `Date.now() - lastActiveAt > 30 * 60 * 1000` (30 min), force `firebaseSignOut` and route to `/login`.
- [ ] Make 30 min configurable via env var; coaches can set higher.

**Done means:** open PWA, log in, lock phone for 31 min, reopen → forced back to login.

### 2.4 Make `/library` and `/workouts` block render on `disabled`

Belt-and-suspenders. Even if everything else fails, these two routes (the high-value content) should refuse to render for `user.disabled === true`.

- [ ] Create a `<RequireActive>` wrapper. Returns `<Navigate to="/login">` if `user.disabled`. Wrap `/library`, `/workouts`, `/checkin`, `/messages` in [src/AppRoutes.tsx](src/AppRoutes.tsx).
- [ ] AuthContext already has the disabled-detection logic for the Firestore flag — surface it on `user.disabled` so RequireActive can read it.

**Done means:** simulating `disabled: true` (manually edit Firestore), PWA reload → cannot reach any content route.

### 2.5 Per-user watermark on video player

Honest bit: this doesn't prevent recording. It deters reselling because every recording carries the leaker's email.

- [ ] [src/components/VideoPlayer.tsx](src/components/VideoPlayer.tsx) — overlay a `<div>` positioned absolute, low opacity (8%), pointer-events-none, with `user.email` repeated in a tile pattern.
- [ ] Animate position slowly so it can't be cleanly cropped out.
- [ ] CSS variables only — no JS performance cost.
- [ ] On the coach-edit side, label this clearly: "Your email is shown on every video as a watermark to prevent reselling."

**Done means:** open any video → faint email pattern visible across the frame.

### 2.6 Migrate YouTube embeds to Vimeo Pro (if budget allows)

Vimeo Pro lets you:
- Domain-lock embeds (only `biozackteam-3d593.web.app` can play them).
- Disable downloads.
- Hide videos from Vimeo's site itself.

- [ ] Coach creates a Vimeo Pro account.
- [ ] Re-upload the 5–10 most valuable videos to Vimeo with privacy: "Hide from Vimeo" + "Specific domains" → biozackteam-3d593.web.app.
- [ ] Update those video docs to `platform: 'vimeo'` with the new IDs.
- [ ] If budget says no this week: skip this task, ship with watermark only, plan Vimeo migration for week 2.

**Done means:** copying the Vimeo embed URL and pasting it into a different domain's HTML refuses to play.

### Day 2 acceptance gate

- [ ] Disabled client on iOS PWA gets booted within 5 seconds of foregrounding.
- [ ] Idle timeout works on both iOS and Android PWA.
- [ ] Every video page shows the user's email as watermark.
- [ ] (Optional) Top-priority videos migrated to Vimeo with domain lock.

---

## Day 3 (T-1) — Coach Cockpit + Navigation Cleanup + Performance

**Theme:** make the app feel premium for the coach managing the first 5 clients,
and ship the obvious nav inconsistencies.

### 3.1 Coach attention queue on `/clients`

The single biggest UX gap on the coach side. Right now if a client misses their check-in, nothing surfaces it. For 5 paying clients, this is the difference between "coach uses it" and "coach forgets it exists."

- [ ] [src/pages/Clients.tsx](src/pages/Clients.tsx) — add three pre-filtered segments at the top of the list:
  - **Needs review** — `weeks.find(w => w.status === 'submitted')` exists for the client's current week.
  - **Missed this week** — current week is `pending` AND it's been > 7 days since the previous week was reviewed.
  - **Stale** — no entry in `selfLogs` for 7+ days AND no submitted week.
- [ ] Each segment shows count badge. Tapping a segment filters the client list to that group.
- [ ] Sort by how-long-stale within each segment (longest first).

**Done means:** a coach can land on `/clients` and immediately answer "who do I need to look at today?"

### 3.2 Nav cleanup (15 min, big UX win)

- [ ] Sidebar Community link → `/community` route, NOT Discord. Add a "Join Discord" button on the `/community` page that opens Discord externally.
- [ ] `/leaderboard` route gated to coach (currently route is reachable by anyone via URL, but link is hidden). Use `<RequireCoach>` wrapper.
- [ ] Add "BETA" pill next to the leaderboard title until the XP system is server-side hardened.

**Done means:** community user clicks Community in sidebar → lands on the in-app community feed, not Discord.

### 3.3 Bundle splitting

Current bundle: 1.7 MB JS. Big pages (`/library`, `/workouts`, `/checkin`) should be lazy-loaded.

- [ ] [src/AppRoutes.tsx](src/AppRoutes.tsx) — convert top-level routes to `React.lazy(() => import('./pages/Foo'))` + `<Suspense fallback={<Loader />}>`.
- [ ] Target: main bundle < 500 KB gzipped, lazy chunks for Library/Workouts/CheckIn.

**Done means:** Lighthouse Performance score on `/login` (cold load) ≥ 85 on a Moto G4 emulator.

### 3.4 Disable right-click on video pages

Cosmetic, but stops 80% of casual content theft.

- [ ] On [src/pages/VideoLibrary.tsx](src/pages/VideoLibrary.tsx) and [src/components/academy/CourseDetail.tsx](src/components/academy/CourseDetail.tsx) wrappers: `onContextMenu={(e) => e.preventDefault()}`.
- [ ] Disable text selection on video player overlays.

### Day 3 acceptance gate

- [ ] Coach lands on `/clients` and can identify "needs review / missed / stale" in 5 seconds.
- [ ] Sidebar Community → `/community` (not Discord).
- [ ] Bundle is split, main chunk < 500 KB gzipped.
- [ ] Right-click disabled on video pages.

---

## Day 4 (T-0) — Content Seed + QA + Launch Readiness

**Theme:** real data, real users, real test matrix. No code today unless something is on fire.

### 4.1 Seed real academy content

- [ ] At least one fully-published "Beginner" course with 5 lessons (videos + PDFs).
- [ ] At least one "Intermediate" course unlocked after Beginner is complete.
- [ ] At least one "Recorded Live" session.
- [ ] Coach reviews each course end-to-end as a community user.

### 4.2 Four-account QA matrix

Spin up four accounts and click through each one.

| Role | Email | Test |
|---|---|---|
| **admin** | (you) | All routes load. Can change anyone's role. Can delete anyone. |
| **coach** | (coach) | Can review clients, assign programs, watch clients' progress, ban a test client. |
| **client** | (test paying client) | Onboarding → first check-in → submit photos required → coach review → next week unlocks. |
| **community** | (test free user) | Can browse academy, can self-log, cannot see coach-only content, no `/leaderboard` in sidebar. |

- [ ] Each account exercises: login, dashboard, profile, library, workouts, community, messages.
- [ ] Run on **iOS PWA**, **Android PWA**, **desktop Chrome**, **desktop Safari**.
- [ ] Test the disabled flow: coach disables client account → within 60s on each platform the user is booted.
- [ ] Test the deletion flow: coach deletes test community user → user can't log back in (auth/user-not-found).

### 4.3 Firestore rules unit tests (smoke level)

Not exhaustive — just enough to catch regressions on the core rules we hardened.

- [ ] `npm i -D @firebase/rules-unit-testing`
- [ ] Tests for:
  - Client A cannot read Client B's check-ins.
  - Client cannot mutate `users/{uid}.role`, `disabled`, `activityScore`, `streak`.
  - Coach can read all client docs.
  - Disabled user's docs reject reads after rule re-evaluation.
- [ ] Add to CI (or at minimum, run before every deploy).

### 4.4 Launch checklist

Final 30-minute pass before flipping the announcement post.

- [ ] All env vars set in Firebase Hosting + Functions.
- [ ] Stripe webhook signature validation (if Stripe is live).
- [ ] Customer-facing terms/privacy pages exist.
- [ ] Discord server invite link is valid.
- [ ] At least 3 published courses.
- [ ] First 3 clients onboarded with their initial program assigned.
- [ ] Coach knows where to find the "Needs Review" filter.
- [ ] Backup of Firestore taken (`gcloud firestore export ... launch-day`).
- [ ] Service Worker version bumped.
- [ ] Lighthouse run on prod: Performance ≥ 85, Accessibility ≥ 90.

### Day 4 acceptance gate

- [ ] All 4 roles fully tested on 2 phones + 2 desktop browsers.
- [ ] Disabled flow works on iOS PWA in under 60s.
- [ ] Rules unit tests pass.
- [ ] Launch announcement scheduled.

---

## Things explicitly NOT in this sprint

These are real gaps but not 4-day blockers. Plan them for week 2-4.

- **Stripe full integration** (subscriptions, webhooks, dunning). Use manual invoicing for first 5 clients.
- **Achievements + badges system** (the old item #7 in CLAUDE.md). Leaderboard alone is enough for beta.
- **Monthly leaderboard reset / top-10 rewards**. Keep leaderboard as "all time, beta, no rewards" for now.
- **Anti-screen-recording at the OS level**. Watermarking is the closest practical fix.
- **Light theme polish for charts + non-token components**. Default is dark; light is a known incomplete experience.
- **Translations sweep for any English strings introduced in the launch sprint**. Run a final pass on Day 4 if time allows.
- **Notifications** (push, email reminders for missed check-ins). Day 5+.

---

## On-call notes (Day +1 onwards)

After launch, the most likely fires:

| Symptom | First place to look |
|---|---|
| Client says "I can't sign in" | Firebase Auth → check `disabled` flag. Check if `revokeRefreshTokens` was called accidentally. |
| Client says "I logged my check-in but coach can't see it" | Firestore `checkIns/{id}` → status field. Make sure the rule transition `pending → submitted` works. |
| Coach says "I assigned a program but client doesn't see it" | `userPrograms/{uid}` write went through? Client's `useActiveProgram` is on `onSnapshot`, should be live. |
| PDF upload says "permission denied" | Custom claim missing. Re-run `setUserRole` for that coach. |
| Score didn't increment | Cloud Function logs. `awardXp` idempotency key already exists? |
| App stuck on loading | `freshUserDocLoaded` check — Firestore subscription failing? Network? |

Each of these should have a runbook entry by week 2.

---

## Update log

Add a one-liner here whenever you complete a major item. Date + what.

- **2026-05-04** — sprint plan created. Day 1 starts.
