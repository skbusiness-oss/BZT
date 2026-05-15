# PRODUCT.md — BioZackTeam Fitness

> Source-of-truth product context for the impeccable design skill.
> If you are an AI assistant: read this end-to-end before any design work on this codebase.
> Last updated 2026-05-06.

## Register

**product** — this is an app, not a brand site. Design serves the work, doesn't perform.

## What this is

BioZackTeam is a coaching + community fitness PWA. One coach (Coach Zack) runs paid 1:1 coaching for clients alongside a free community tier of self-tracked members. The app is the place where coaching happens between sessions: weekly check-ins, weekly review/feedback, training program assignment, video academy with structured courses, leaderboard activity, and direct messaging.

Built as a React/TypeScript/Vite SPA on Firebase (Auth + Firestore + Storage + Cloud Functions). Bilingual EN/AR with full RTL. Installable PWA with a service worker. Currently in a 4-day pre-launch sprint targeting closed-beta with the first paying clients.

## Users (concrete, not personas)

There are three real human roles plus admin. Design for the first three; admin is functionally a coach with extra.

### 1. Coach (single user: Zack)

Mid-30s competitive bodybuilder running a coaching practice. Handles ~30–50 paying clients across cutting / bulking / pro / health categories, plus a growing community tier. Works from his phone between gym sessions and from a laptop in a kitchen office for review work. Wants to spend less time on tooling and more time on actual coaching. Will not tolerate friction; if a tab takes 4s to load on his phone he stops using it. Reviews check-ins, leaves feedback, adjusts macros, assigns programs, removes/disables clients who stop paying. Speaks English + Arabic; switches in the same day.

### 2. Coaching client (paying)

Has paid for 1:1 coaching. Submits a weekly check-in (weight + macros + photos + reflection). Waits 1–3 days for Zack's review with new targets. Comes back to read the feedback, log daily macros against the new targets, watch academy lessons, hit the workout day. Wants the coach's attention to feel earned, not lost in a generic UI. Spends the most time of any role inside the app — typically 4–7 sessions per week.

### 3. Community member (free)

Found Zack on Discord/Instagram, signed up for the free tier. No coach review, no macro plan. Tracks weight weekly, watches academy content, reads community posts. Wants visible progress over time and the social fabric of the lounge. Hopes to upgrade to coaching eventually, but value must exist before that conversion.

### 4. Admin

Internal/dev only. Same UI as coach with a few extras for setup and audit. Not a design target.

## Product purpose

The product earns its keep when the coach can review a client's week in under 2 minutes and that client opens the app to read clear feedback within 60 seconds of the notification. Everything else is plumbing for that exchange.

## Tone

Premium, not luxury. Editorial, not corporate. Quiet confidence; nothing oversells. The app rewards repeat visits over splash. Photographic imagery (gym, training, coaching) with a gold accent (BioZackTeam brand). Headlines are short. Copy treats users as adults; no encouragement spam, no gamification confetti.

Concrete tone references that fit:
- Whoop app — restrained, dark-first, body-first
- Apple Fitness — typographic clarity, photographic hero
- Stripe Dashboard — quiet density, real product

What we are not:
- No SaaS gradient hero. No animated emoji. No "Welcome back, *Champion!* 🎯" copy.
- Not luxury watch (too cold, too gold-everywhere).
- Not bro fitness (no neon, no shouty caps, no Comic-Sans-energy).

## Anti-references

| Pattern | Why we reject |
|---|---|
| **SaaS gradient hero card** | Already three of these in the wild. Reads "agency template." |
| **Neon-on-black gym aesthetic** | First-order fitness reflex; reads as Crossfit clone. |
| **Bouncy Lottie celebrations** | Treats users as kids. Wrong tone for paid coaching. |
| **Round avatar + first-name greeting in 56pt** | Hero-metric template; says "designer didn't know what else to put." |
| **All-card grids** | Three identical cards in a row. Lazy. |
| **Decorative glassmorphism** | Backdrop-filter blur as default. We use it once or twice with intent or not at all. |
| **Side-stripe accents on cards/notes** | Banned outright. |
| **Gradient text everywhere** | One gradient text element in the whole app, max. Currently the welcome name; that's it. |
| **Encouraging copy** | "Crush it today!" / "Let's go!" — not us. Tone is observational, not performative. |

## Strategic principles (the design must obey these)

1. **The coach is the product.** Every paid client experience must point back to the coach's voice — review feedback, macro adjustments, video presence. Design surfaces that bury the coach lose.
2. **Trust over delight.** A banned/disabled user must not see content, ever. A deleted user must not be able to come back. A client's data is theirs. Polish never compromises this — visual polish on a leaky surface is worse than rough on a tight one.
3. **Bilingual is built-in, not bolted on.** Arabic is not an afterthought — Tajawal font, RTL layout, Arabic exercise names eventually. Every new string ships in both languages or it doesn't ship.
4. **Mobile first, but laptops matter for coaches.** Clients use phones; coaches use both. Don't make the coach review flow phone-only.
5. **Premium feels like restraint.** The product feels expensive when nothing fights you, not when everything sparkles. If a screen has more than 2–3 visual emphases, kill the weakest one.
6. **Speed is a design constraint.** First paint under 1.5s on a mid-tier phone. No surface that takes 600ms+ between tap and visible response.

## What's currently in the app (so polish doesn't fight the architecture)

### Roles + access
- `community` (free, weekly self check-in only)
- `client` (paid, weekly coaching check-in flow)
- `coach`, `admin`

### Major surfaces
- Login (email + password, EN/AR toggle, theme toggle, ToS gate, Week 0 baseline gate for community)
- Dashboard — three role variants (coach console / client / community)
- Profile (with role-aware ProgressPanel: weekly check-in for community, weight chart, body measurements, optional compare-checkins toggle)
- VideoLibrary / Academy (Zero-to-Hero structured courses + flat video grid)
- Workouts (programs + day view + exercise modal)
- CheckIn (weekly form for paid clients)
- CoachReview (coach reviews check-ins, leaves feedback, sets new targets)
- Clients (coach client list — coaching + community tabs)
- Messages (1:1 coach ↔ client)
- Community feed
- Leaderboard (coach-only on full board; private rank visible to all)
- Settings, Profile

### Brand surface elements
- Hero photographic cards on the dashboard (battle-rope for workout, classroom for academy, coach + whiteboard for weekly check-in)
- Gold gradient as the singular brand accent (one CTA color across the app)
- WeekStatusPanel (calendar + streak ring + level + private rank, replaces three separate metric cards)

## Things that are decided (don't redesign)

- Dark is the default theme. Light is supported, fully tokenized.
- BioZackTeam gold (`var(--primary)`) is the only branded color. No alternate accent palettes per page.
- Calendar week strip is Mon–Sun (matches Arabic + European convention).
- Community weekly check-in is rolling 7-day-after-last-submit, not Monday-reset.
- Clients use `/checkin` for daily detail (strength/hunger/energy/cardio + macros). Profile does not duplicate that form.
- Coach's deletion is server-cascaded via `deleteUser` Cloud Function (Auth + Firestore + audit). No soft-deletes on the client side.

## Things still mid-flight (avoid them in polish work)

- Stripe wiring (intentional last)
- Full Arabic walk-through (some surfaces still have English literals)
- Lazy-load route splits
- PDF/Storage tier alignment (community vs client per-asset)

## Quality bar

**MVP-strong**, aiming for **flagship** on the first 5 surfaces a paying client sees on day one:
1. Login + ToS + theme/lang toggle
2. Dashboard hero (welcome + WeekStatusPanel + weekly check-in card)
3. Weekly check-in flow at `/checkin`
4. CoachReview (coach side)
5. Profile + ProgressPanel

Every other surface ships at MVP-strong: clean tokens, working states, no obvious drift.
