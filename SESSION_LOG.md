# BioZackTeam — Pre-Launch Session Log

Running record of what was changed, why, and what state it left the system in.
Newest entries at the top. Use this when picking up work; pair with `LAUNCH.md` (the
forward-looking checklist) and `PLATFORM_STABILIZATION_PLAN.md` (Codex's queued plan).

---

## 2026-05-05 — Trust boundary deploy + worktree incident + delete-user cascade

This was a long day. Three distinct phases.

### Phase A — Day 1 of the launch sprint: Trust Boundary

**Why:** before launch, every privileged action (XP, role, disable, delete) was
client-side. A user with DevTools could forge a score, change their role, or survive a
revocation by reusing a cached PWA bundle. This phase moved all of that to the server.

**Cloud Functions (2nd-gen, Node 20, us-central1, 256 MiB) — all deployed live:**

| Function | What it does | Auth gate |
|---|---|---|
| `awardXp` | Idempotent server-side XP credit. Composite key `${source}-${sourceId}` in `xpEvents/{}` deduplicates retries. Refuses to credit `disabled` users. | `request.auth.uid` required |
| `setUserRole` | Sets the `role` custom Auth claim, mirrors to Firestore, revokes refresh tokens on the target. | Coach/admin only |
| `setUserDisabled` | Auth-level disable + `revokeRefreshTokens()` + audit log to `deletionLogs/{uid}`. Refuses self-disable. | Coach/admin only |
| `deleteUser` | Cascade delete of `selfLogs`, `xpEvents`, `clients`, `checkIns`, `userPrograms`, `publicProfiles`, then Auth user. Captures audit snapshot before delete. Stripe stub at end. | Coach/admin only |

**Firestore rules** (`firestore.rules`) locked down:
- `users/{uid}` blocks owner mutations to `role`, `disabled`, `disabledAt`, `disabledBy`, `activityScore`, `streak`, `lastActiveAt` — server-only fields.
- `users/{uid}` direct delete is `false` — must go through `deleteUser` Cloud Function.
- `publicProfiles/{uid}`: read for any signed-in, write blocked.
- `isCoach()` prefers `request.auth.token.role` over Firestore lookup (matches Storage rules + saves a read).

**Storage rules** (`storage.rules`) hardened:
- `isCoach()` checks `request.auth.token.role` (Storage rules can't `firestore.get()`, so this is the only viable path).
- PDF write/delete genuinely coach-only via custom claim. All scaffolding from the prior `firestore.get()` attempts removed.

**Frontend trust:**
- `src/lib/firebase.ts` — `getFunctions(app, 'us-central1')` exported.
- `src/lib/activityScore.ts` — rewrote to call `awardXp` callable instead of writing client-side.
- `src/context/AuthContext.tsx` — auto-bootstrap of role custom claim on sign-in for accounts with Firestore role coach/admin (one-time migration so coaches don't have to be set up manually post-deploy).

**Cloud Build IAM hiccup:** first deploy of functions failed with "missing permission on the build service account." Fixed by granting `Cloud Build Service Account` role to `51844467480-compute@developer.gserviceaccount.com` in Cloud Console IAM, plus enabling Cloud Run Admin API and Eventarc API.

### Phase A.5 — Day 2: Disabled enforcement, ToS, watermark, idle timeout

Five layers of revocation so a banned user can't squeeze through any seam:

1. **Auth-level disable** — `setUserDisabled` calls `admin.auth().updateUser(uid, { disabled: true })` + `revokeRefreshTokens()`. Tokens become invalid at the token server.
2. **`visibilitychange` token refresh** — `AuthContext` calls `getIdToken(true)` whenever the tab regains focus, so a disabled user's stale token gets re-validated within seconds of unlocking their phone.
3. **`freshUserDocLoaded` gate** — `AuthContext` flips this true on every `onSnapshot` of `users/{uid}`. `<ProtectedRoute>` waits for `loading || (isAuthenticated && !freshUserDocLoaded)` before rendering, so a disabled doc snapshot kicks the user out before any content paints.
4. **30-min idle timeout** — `bzt-lastActiveAt` localStorage key updated on activity; on resume, if older than 30 min, force re-auth.
5. **`<RequireActive>` route wrapper** — sits on `/library`, `/workouts`, `/checkin`, `/messages`, `/community`, `/workouts/day/:n`, `/workouts/program/:id`. Redirects disabled accounts even if they get past the rest.

Plus:
- **ToS modal** (`src/components/shared/TosModal.tsx`) blocks render until user accepts. Writes `tosAcceptedAt: serverTimestamp()` and `tosVersion: 'v1'`.
- **Video watermark** (`src/components/shared/VideoWatermark.tsx`) — tiled, drifting display of `user.email` over every video player. Web cannot prevent screen recording, but per-user attribution makes leaks traceable.

Service worker bumped to `v17` then `v18` over the day.

### Phase B — The worktree incident (the regression)

Mid-afternoon, I launched parallel `isolation: "worktree"` subagents for the Day 1/Day 2
work. **Mistake:** I did not commit a checkpoint of the working tree first. The agents
branched off `master` HEAD (which was 6 commits behind my working tree). When they
finished, I ran `git checkout <agent-branch> -- <files>` to merge their work in.
That command silently overwrote my uncommitted edits with the agents' stale-base versions.

**What was lost:**
- Academy / Zero-to-Hero `src/pages/VideoLibrary.tsx` (834 lines) → reverted to a 460-line flat-video grid.
- ~190 translation keys in `src/i18n/translations.ts`.
- Sidebar nav strings (rendered as raw `navCommunity` / `navSettings` because the keys were missing and `t()` falls back to the literal key).

**Recovery path:**
- `~/.claude/file-history/<session-id>/` had cached versions. The Academy VideoLibrary was at hash `2a91aa2f9423526f@v10`. Identified by content (`grep -l "Zero to Hero"`). Restored verbatim.
- 192 missing translation keys reconstructed and added.
- `t()` fallback logic kept (returns the key string when missing) — useful for catching future drift.

**Lessons logged in `~/.claude/projects/.../memory/`:**
- `feedback_worktree_subagents.md` — always commit before parallel worktree subagents.
- `feedback_translation_fallback.md` — run the missing-keys diff before any deploy.
- `reference_file_history_recovery.md` — `~/.claude/file-history/` is the last-resort recovery path.

### Phase C — The deleteUser cascade (5 layers, all blocked)

Coach reported "internal error" when trying to delete a client. Each layer surfaced a
different blocker; debugging required peeling them in order.

| Layer | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Modal closed, "nothing changed" | Frontend swallowed Cloud Function errors with `console.error` only | Added `deleteError` state + red banner in confirm modal so server errors are visible |
| 2 | "Refused to connect... CSP" | `connect-src` whitelisted `*.googleapis.com` but not `*.cloudfunctions.net` | Added `https://*.cloudfunctions.net https://*.run.app` to `connect-src` in `firebase.json` |
| 3 | New CSP not picked up | `Cache-Control: max-age=3600` on HTML — browser was replaying old CSP from cache | Set `Cache-Control: no-cache, no-store, must-revalidate` on `/` and `/index.html` |
| 4 | "Internal" error / CORS preflight 403 | Cloud Run service didn't have `allUsers` invoker IAM grant. Firebase 2nd-gen functions don't always set this automatically. | Added `invoker: 'public'` to all `onCall` configs + manually granted `allUsers` → `Cloud Run Invoker` on each of the 4 services in Cloud Console |
| 5 | `auth/insufficient-permission` in function logs | Compute Engine SA (`51844467480-compute@developer.gserviceaccount.com`) lacked `Firebase Authentication Admin` role | Granted role in Cloud Console IAM |
| 6 | `firestore: Missing or insufficient permissions` | Same SA also lacked `Cloud Datastore User` for Admin SDK Firestore reads | Granted role in Cloud Console IAM |

After all six fixes, delete works end-to-end — verified by user.

**Other small fixes layered into this phase:**
- `script-src` widened to allow `https://apis.google.com` and `https://www.gstatic.com` (Firebase Auth loads `apis.google.com/js/api.js` for some flows).
- Added `<meta name="mobile-web-app-capable">` alongside the deprecated `apple-mobile-web-app-capable`.
- Removed the external Discord `<a>` from sidebar; replaced with in-app `<SidebarItem to="/community">` and a gold-gradient CTA on the Community page.

### Memory snapshot at end of session

Saved to `~/.claude/projects/.../memory/`:

- `project_launch_and_trust_boundary.md` — sprint context, deployed functions, custom-claim auto-bootstrap, SW versioning, Stripe-last.
- `project_academy_zero_to_hero.md` — `VideoLibrary.tsx` IS the academy host page, do not downgrade.
- `feedback_worktree_subagents.md` — checkpoint before parallel worktree subagents.
- `feedback_translation_fallback.md` — run missing-keys diff before deploy.
- `reference_file_history_recovery.md` — file-history as last-resort recovery.

---

## Codex's hardening review (queued, not yet implemented)

Codex flagged 4 substantive code changes to do after the immediate fix landed. All
approved in principle; not yet executed:

1. In `deleteUser`: revoke + disable Auth FIRST, cleanup Firestore second, Auth delete LAST. If Auth delete fails, leave `users/{uid}.disabled = true` as backstop.
2. Stop auto-creating `users/{uid}` for normal sign-ins when the doc is missing — should be a hard fail unless this is intentional sign-up flow.
3. Remove the legacy `removeClient` Firestore-only fallback in `src/pages/Clients.tsx` (the `else { await removeClient(...) }` branch). Legacy clients without `userId` should surface "needs account repair / link UID" instead of silently soft-deleting.
4. Add an `isActiveUser()` Firestore rules helper that checks both signed-in AND not disabled. Use it on `videos`, `courses`, `workouts`, community reads instead of bare `isSignedIn()`.

---

## Codex's Community Role Plan (queued, not yet implemented)

Separate workstream — convert community users from a daily-check-in model to a
weekly-self-check-in model. Saves ~85% of Firebase docs/user/year, gives clean
weight-trend metrics, no coach review.

See `PLATFORM_STABILIZATION_PLAN.md` for the full plan. Touch points:
- New baseline fields on `users/{uid}`: `age`, `heightCm`, `goal`, `currentWeightKg`, `targetWeightKg`, `communityProfileStartedAt`.
- Replace daily check-in UI with weekly.
- Lock submitted weekly logs (Firestore rule).
- Real weight chart (no fake "goal = 90% of start").
- Dashboard training card → direct deep-link to `/workouts/day/{todaysDayNumber}`.
- Translation audit so no raw key strings leak ("CTA", `dayLabel`, etc.).

Implementation order (from Codex's plan): finish field decisions → profile UI copy → Week 0 form → `users/{uid}/selfLogs/{weekStart}` storage → lock rules → chart → dashboard nav fix → translation audit → mobile/desktop QA.

**In-flight at handoff (Codex's edits, not to be touched without explicit instruction):**
`src/types/index.ts`, `src/context/AuthContext.tsx`, `src/hooks/useSelfLogs.ts`, `firestore.rules`, `src/components/profile/ProgressPanel.tsx`.

---

## Earlier checkpoints (compressed)

- **2026-04-12** — Workouts overhaul. ExerciseCard + WorkoutEditor + Workouts page rebuild. (Memory: `project_workout_feature.md`.)
- **Pre-sprint baseline** — App was feature-complete on the surface but had no trust boundary. XP/role/access were all client-mutable. This was the gap Phase A closed.

---

## Current deployed state

- Hosting: `https://biozackteam-3d593.web.app`, SW `v18`, HTML cached `no-cache`.
- Functions: `awardXp`, `setUserRole`, `setUserDisabled`, `deleteUser` — all live in `us-central1`, all `invoker: 'public'`.
- Compute Engine SA roles: `Firebase Authentication Admin` + `Cloud Datastore User` (granted manually).
- Cloud Run services: `allUsers` → `Cloud Run Invoker` on all 4 (granted manually).
- Firestore + Storage rules: deployed, locked.

## Open risks before launch

- Codex's hardening points (#1–#4 above) — not blockers, but should land before public traffic.
- Community Role Plan — feature change, schedule separately.
- No automated rules tests yet (Codex Day 1 stub never wired). `@firebase/rules-unit-testing` should cover: client A can't read client B's check-ins, can't read photos, non-coach can't write `coachOnly` fields, deleted user's token rejected.
- Stripe wiring is intentionally last; `deleteUser` has a stub `if (stripeCustomerId) {}` block ready.
