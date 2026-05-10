# Night Fix Log

> Single-pass overnight execution against the BioZackTeam Overnight Fix Plan.
> Constraint: **no deploys**, only `npm run build` (and `npm --prefix functions run build` if functions touched).
> Document every phase. Mark intentionally-skipped items so morning hand-off is clean.

**Branch:** `master`
**Starting commit:** `e27139e` (Codex Community scaffolding) — safety checkpoint landed before this run.
**Final build:** ✅ `npm run build` passes. `dist/assets/index-G4kTpiws.js` 1.74 MB (gzip 436 KB).
**Functions build:** Not run — no functions touched this session.

---

## Status of plan items at start vs. end

| # | Item | Started | Ended |
|---|---|---|---|
| 1 | Dashboard redesign — calendar strip + combined streak/level/logs/rank panel | Solo cards exist; no calendar | ✅ `WeekStatusPanel` built; replaces 3 metric cards + standing on Community + Client dashboards |
| 2 | Progress CTA card redesign | Generic card | ✅ Mini sparkline + gradient halo; reads "view progress" not "another card" |
| 3 | Community weekly progress (rolling 7-day window) | Was Monday-reset | ✅ Now 7-days-after-last-submission; UI shows "Last submitted X · Next available Y" |
| 4 | Coaching client doesn't get duplicate self-progress | Verified | ✅ Coaching weekly check-in card stays prominent; no daily/weekly self-prompts duplicated |
| 5 | Workout dashboard card | Already done in prior session | ✅ Verified — no raw keys; deep-link to `/workouts/day/{n}` on training days; rest day stays on overview |
| 6 | Login theme + ToS readability | Theme not toggleable pre-login; ToS hardcoded dark | ✅ Sun/Moon toggle next to language switcher; theme persists pre-login → post-login (seeds Firestore on first sign-in if no remote theme); ToS modal restyled with surface tokens for both themes |
| 7 | Arabic + Tajawal | EN/AR keys exist; Tajawal not loaded | ✅ Tajawal loaded; `html[lang="ar"]` selector forces Tajawal across the app via `!important` (overrides inline Inter/Manrope in dashboard primitives). 4 English eyebrows swapped to t() keys. **Partial — see "Remaining risks"** |
| 8 | Coach client count accuracy | `clients.length` raw | ✅ Filtered to active coaching clients only — excludes `accessLevel === 'community'` and orphans without `userId` |
| 9 | Deleted/disabled access verification | 5-layer revocation already in place | ⏸ Not re-tested tonight — see "Manual tests to run tomorrow" |
| 10 | PDF/Storage tier alignment | Coach-only currently | ⏸ Not touched — see "Intentionally not touched" |
| 11 | Design tool rules | N/A | N/A — no Stitch/Figma/Nano usage |
| 12 | Safety + docs | This file | ✅ Maintained throughout; checkpoint commit `e27139e` first |

---

## Phase log

### Phase 1 — Setup + audit
- Read `AGENTS.md` (258 lines) and `PLATFORM_STABILIZATION_PLAN.md` (460 lines).
- `git status`: 16 modified files + 4 new files from earlier session (academy/courses hero images, Week 0 scaffolding). Committed as checkpoint `e27139e`.
- Created this log file.
- Diff'd `t()` / `tx()` calls vs translation keys: only `T` (false positive from `.split('T')`). No real raw keys leaking. `cta` / `ctaDesc` mentioned in plan are mockup placeholders, not actual code.

### Phase 2 — `WeekStatusPanel` (combined panel + calendar strip)
**Files:** `src/components/dashboard/biozackteam/shared.tsx` (+165 lines)
- New component: `WeekStatusPanel` exported from shared.
- Top half: 7-day strip Mon-Sun, today gold-filled circle, dot under days the user has logged something. Date numbers + day initials.
- Bottom half: conic-gradient streak ring (capped at 30 days for visual scale) with current streak number centered; level + private rank in a two-column row; XP bar with `cubic-bezier` ease; meta row with `score · xpPct% to next` and `logs · best streak`.
- Mobile: stacks via `flex-wrap` automatically.
- Coach is the only role that gets a clickable rank → `/leaderboard`. Community/client see read-only rank (privacy: founder rule).
- Rank source: top-100 from `publicProfiles` (matches existing `YourStandingCard`); denominator from `snap.size`.

**Files:** `src/components/dashboard/CommunityBioZackTeam.tsx`, `src/components/dashboard/ClientDashboard.tsx`
- Replaced 3 `MetricCard` + `YourStandingCard` with `<WeekStatusPanel />`.
- Community `loggedDates` derived from `selfLogs.date`.
- Client `loggedDates` derived from `currentWeekData.dailyEntries[].date` where any macro / weight has a value.
- Removed unused imports (`levelFromScore`, `levelProgress`).

### Phase 3 — Rolling 7-day window for community weekly check-in
**Files:** `src/components/profile/ProgressPanel.tsx`
- Renamed locals: `thisWeekStart` → `todayKey`; new derived `lastWeeklyLog`, `lastSubmittedDate`, `nextAvailableAt`, `isWeeklyLocked`.
- New props on `WeeklyCheckIn`: `isWindowLocked`, `lastSubmittedDate`, `nextAvailableAt` — render "Last submitted: X · Next available: Y" inside the card when window is locked.
- Doc id is now today's date (not Monday) — each weekly entry maps cleanly to one calendar date and prior weeks aren't overwritten.
- Server-side lock unchanged: `firestore.rules` still blocks update/delete on `resource.data.locked == true` (Codex's Phase A scaffolding). The `isWindowLocked` flag is a UX hint only; actual immutability is rule-enforced.

### Phase 4 — Progress CTA redesign
**Files:** `src/components/dashboard/biozackteam/shared.tsx`
- New optional prop `weightHistory: number[]` — when ≥ 2 points provided, renders a 140×28 SVG sparkline with a 2-color gradient stroke and a primary-fill dot at the latest point.
- Card now uses gradient surface + radial gold halo top-right. Reads as "view progress" instead of "generic CTA." Whole card is clickable; nested button has `e.stopPropagation()`.
- Wired in `CommunityBioZackTeam.tsx` (selfLogs weight history) and `ClientDashboard.tsx` (latest weight per coaching week).

### Phase 5 — Coach dashboard client count
**Files:** `src/components/dashboard/CoachDashboard.tsx`
- New derived `coachingClients = clients.filter(c => (c.accessLevel ?? 'client') === 'client' && !!c.userId)`.
- All 6 counts (total/needsReview/cutting/bulking/pro/health) + `filteredClients` + the needsReview iteration now read from `coachingClients` instead of raw `clients`.
- Excludes community-tier rows that live in the same collection AND legacy orphans without `userId`. Hard-deletes via `deleteUser` Cloud Function already cascade clients docs, so no `deleted` flag is required.
- Note: a future improvement is a server-side count via Cloud Function so the coach UI doesn't have to download every doc just to count.

### Phase 6 — Login theme toggle + ThemeContext seed + ToS readability
**Files:** `src/pages/Login.tsx`
- Added `useTheme()` hook + Sun/Moon icon button next to the language toggle. Pre-login choice persists in localStorage immediately (existing behavior).

**Files:** `src/context/ThemeContext.tsx`
- On first onSnapshot of `users/{uid}` after sign-in: if remote `theme` is missing, seed it from `localStorage.bzt-theme`. This stops the "user picked light pre-login → got reset to dark on first sign-in" regression. Subsequent snapshots respect remote theme as authoritative (cross-device sync).

**Files:** `src/components/shared/TosModal.tsx`
- Removed hardcoded `navy-950` / `gold-400` / `text-white` Tailwind classes.
- Now uses theme tokens: `bg-surface-container-low`, `text-on-surface`, `border-outline-variant/30`, `rgb(var(--primary) / 0.15)` etc.
- Added gold accent header band, 12×12 icon tile, eyebrow above title, body text bumped to `text-base`/`leading-relaxed` for readability, checkbox is now in a bordered card so it stands out. Submit button uses gradient + shadow when active, muted surface when disabled.
- Reads correctly in both dark and light modes.

### Phase 7 — Arabic + Tajawal
**Files:** `src/index.css`
- Imported Tajawal weights 200–900.
- Added high-specificity selector `html[lang="ar"], html[lang="ar"] *` with `font-family: 'Tajawal', ... !important`. The `!important` is required because dashboard primitives (`shared.tsx`) set `fontFamily` inline, and inline styles win over CSS without it. With this rule, Arabic mode flips the entire app to Tajawal in one place.
- Numbers/Latin glyphs cascade to Inter automatically.

**Files:** `src/i18n/translations.ts`, `src/components/dashboard/CoachDashboard.tsx`, `src/pages/Profile.tsx`, `src/pages/Community.tsx`, `src/pages/Clients.tsx`
- Added 4 eyebrow keys: `coachConsoleEyebrow`, `memberIdentityEyebrow`, `membersLoungeEyebrow`, `managementEyebrow`. Both EN + AR.
- Swapped the 4 hardcoded English eyebrows to `t()` calls.
- Added `ofLabel` for the "of N" rank denominator.

---

## Files changed (summary)

```
src/AppRoutes.tsx                                 (was committed in checkpoint — Week 0 gate)
src/components/dashboard/CoachDashboard.tsx       (count fix + eyebrow)
src/components/dashboard/CommunityBioZackTeam.tsx (WeekStatusPanel + ProgressCTA wiring + real start/target weight)
src/components/dashboard/ClientDashboard.tsx      (WeekStatusPanel + ProgressCTA wiring)
src/components/dashboard/biozackteam/shared.tsx   (+WeekStatusPanel, redesigned ProgressCTA)
src/components/profile/CommunityBaselineForm.tsx  (was committed — Week 0 form)
src/components/profile/ProgressPanel.tsx          (rolling 7-day weekly window + WeeklyCheckIn props)
src/components/shared/TosModal.tsx                (theme-aware restyle)
src/context/ThemeContext.tsx                      (seed Firestore theme on first sign-in)
src/i18n/translations.ts                          (+5 keys: ofLabel, 4 eyebrows)
src/index.css                                     (Tajawal + html[lang="ar"] selector)
src/pages/Clients.tsx                             (managementEyebrow)
src/pages/Community.tsx                           (membersLoungeEyebrow)
src/pages/Login.tsx                               (theme toggle button)
src/pages/Profile.tsx                             (memberIdentityEyebrow)
```

---

## Intentionally not touched

- **Stripe wiring** (out of scope, gated last per launch plan).
- **PDF/Storage tier alignment (#10)** — current rules are coach-only on writes; reads are open to any signed-in user. Plan suggests aligning per-tier (community asset vs client asset). This needs a `accessTier` field on `course-resources/{courseId}/{lessonId}/...` paths or per-doc check, plus Storage rule changes. Risk of breaking existing PDF access. Defer to daylight QA + planning.
- **Deleted/disabled user verification (#9)** — 5-layer revocation chain already deployed (Auth disable + visibilitychange refresh + freshUserDocLoaded gate + idle timeout + RequireActive). Not re-tested without account access. See "Manual tests" below.
- **Codex's hardening review (queued in `SESSION_LOG.md`)** — revoke-first ordering, no auto-create on missing user doc, drop legacy `removeClient` fallback, `isActiveUser()` rules helper. All 4 still queued; none executed tonight.
- **Exercise-name Arabic translation** — `src/data/` has 100+ static program files with English exercise names. Translating each would be a separate migration task with a content owner. Marked for later.
- **Lazy-route splitting** — bundle is 1.74 MB. Code-split would help mobile first-load, but it's a refactor with regression surface. Defer.

---

## Build results

```
✓ tsc -b + vite build, no errors
dist/index.html                      2.96 kB
dist/assets/index-BILyGf4E.css      132.12 kB │ gzip:  18.68 kB
dist/assets/index-G4kTpiws.js     1,735.01 kB │ gzip: 436.46 kB
```

⚠ Bundle size warning persists — known, deferred (see above).

---

## Remaining risks

1. **Arabic UI completeness** — only the most visible eyebrows were swapped. A full pass needs to walk every page (Settings, Workouts editor, ExerciseModal, CheckIn, CoachReview, AdminSetup, Leaderboard) and find any `>English text<` literals that should go through `t()`. Best done with a coach + Arabic speaker QA session.
2. **WeekStatusPanel `loggedDates` for clients** — currently keyed off the active week's `dailyEntries[].date`. If a client logs nothing in the current week, all 7 dots stay empty even when prior weeks have data. Acceptable for v1 since the calendar strip is "this week" anyway, but worth revisiting if founder wants 7-day rolling rather than calendar week.
3. **Tajawal `!important` hammer** — overrides inline `fontFamily: t.body` declarations in dashboard primitives. Works, but if anything in the app relies on a specific `fontFamily` inline (e.g. monospace numbers), it'll be overridden in Arabic mode. Audit needed.
4. **`isWindowLocked` is UX-only** — Firestore rule blocks edits on `resource.data.locked == true` of an existing doc, but a determined attacker could submit a *new* weekly doc with their own date even before `nextAvailableAt`. To gate at the rule level, we'd need to read the user's last weekly log on create — this is an extra rule lookup on every weekly create. Acceptable tradeoff: client respects the window, server prevents edits to past entries.
5. **Login double-login regression** — was reported in plan. Not specifically reproduced or fixed tonight. Theme seed should help (avoids the Firestore-overrides-on-first-snap scenario), but if double-login persists, instrument `signIn` flow to log timing.
6. **Coach client count via Firestore listener** — works, but downloads every `clients` doc. As coaching clients scale beyond ~500, swap to a Cloud Function aggregate. Not urgent for launch.

---

## Manual tests to run tomorrow

### Coach account
- [ ] Open dashboard → counts match active coaching clients only (community rows excluded, orphans excluded)
- [ ] Open `/clients` → still works, both tabs (Coaching + Community) show correct entries
- [ ] Click "Remove client" on a coaching client → modal opens, banner reports any errors
- [ ] Visit `/leaderboard` → still loads (coach-only)
- [ ] Toggle theme on dashboard → all surfaces flip cleanly

### Paid (coaching) client account
- [ ] Dashboard now shows: coach feedback banner → calendar+streak panel → weekly check-in card → academy → today's workout → community feed → progress CTA (with sparkline)
- [ ] Clicking the today's training card with active program → lands on `/workouts/day/{n}` directly
- [ ] Calendar dots fire on days with logged daily entries
- [ ] Progress CTA sparkline renders if ≥ 2 weeks of weight data exist

### Community account (fresh)
- [ ] First sign-in → ToS modal appears (readable in both dark + light)
- [ ] Accept ToS → Week 0 baseline form appears as global gate (any route)
- [ ] Submit baseline → form unmounts, dashboard renders
- [ ] Profile page → Personal info card with values + Edit info button
- [ ] Profile page → ProgressPanel weekly check-in card, NOT daily
- [ ] Submit weekly check-in → "Locked" state shows with last submitted + next available date
- [ ] Refresh → form stays locked
- [ ] Try edit log directly in Firestore console → blocked by rules

### Arabic mode
- [ ] Toggle to Arabic on Login → Tajawal renders for body/headlines
- [ ] Walk Dashboard / Profile / Clients / Community / Settings — verify no raw English keys (camelCase)
- [ ] RTL spacing on cards (especially the WeekStatusPanel left-aligned ring, right-aligned rank)

### Theme persistence
- [ ] Pre-login: toggle theme → close tab → reopen → choice persists
- [ ] Pre-login → choose light → sign in (account with no Firestore theme) → still light
- [ ] Sign in different account that has dark stored → flips to dark
- [ ] Toggle theme post-login → Firestore updates → other devices flip on next snapshot

### Disabled/deleted user (if test account available)
- [ ] Sign in → disabled flag set in Firestore → onSnapshot kicks them out within ~1s
- [ ] Same user refresh → can't re-enter `/library`
- [ ] Idle 30+ min → returns to login
- [ ] Coach deletes user via `/clients` → user gone from all collections; Auth account gone

---

## Build commands

```bash
npm run build                       # ran ✅
npm --prefix functions run build    # not needed — no functions touched
```

## Suggested deploy order (when ready)

1. `firebase deploy --only firestore:rules` — picks up Codex's `selfLogs` lock rule (already in committed firestore.rules).
2. `firebase deploy --only hosting` — bundle + index.html.
3. (Optional) Bump `public/service-worker.js` `VERSION` if cache strategy needs to flush.

---

_Run completed without deploys, as instructed._
