# DESIGN.md — BioZackTeam Fitness

> Design tokens + component patterns. Pair with PRODUCT.md.
> Source-of-truth for the impeccable polish skill.

## Theme — dark default, light supported

Both themes ship full token coverage. Token values are space-separated `R G B` triplets so Tailwind's `rgb(var(--token) / <alpha-value>)` and inline `rgb(var(--name))` both work.

The token map lives in [src/index.css](src/index.css). Dark and light flip via `data-theme="dark|light"` on `<html>`. ThemeContext seeds the user's choice into Firestore on first sign-in so it persists across devices.

### Dark (default)

| Token | RGB | Use |
|---|---|---|
| `--primary` | `230 195 100` (rich gold) | Single brand accent. CTAs, focus rings, data emphasis. |
| `--primary-container` | `201 168 76` | Gradient-pair with primary. |
| `--on-primary` | `36 26 0` | Text on gold surfaces. |
| `--surface` | `14 19 34` | App background (deep navy). |
| `--surface-container-lowest` | `9 14 28` | Recessed surfaces. |
| `--surface-container-low` | `22 27 43` | Card default. |
| `--surface-container` | `26 31 47` | Standard card. |
| `--surface-container-high` | `37 41 58` | Hovered/pressed cards. |
| `--surface-container-highest` | `47 52 69` | Top-most surface (modals, popovers). |
| `--surface-bright` | `52 57 73` | Bright variant for hero cards. |
| `--on-surface` | `222 225 247` | Body text full contrast. |
| `--on-surface-variant` | `208 197 178` | Secondary text, labels. |
| `--outline` | `153 144 126` | Default border (low-contrast). |
| `--outline-variant` | `77 70 55` | Subtle separators. |

### Light (Performance Atelier — off-white marble)

Primary deepens to `117 91 0` for ≥4.5:1 contrast on white. Surfaces shift to a `255 → 225` ramp. Foreground inverts to `25 28 29` for body, `77 70 55` for variant.

## Color strategy

**Restrained.** Tinted neutrals + one accent (gold) at ≤10% of surface area. Brand identity surfaces (login hero, marketing if any) may bend toward Committed; the in-app product is restrained. No alternate accent palettes per page.

`#000` and `#fff` are not used. Even when overlay text appears white, prefer `rgba(255,255,255,0.92)` over solid white, and rely on `--on-surface` tokens for theme-aware color on real surfaces.

## Typography

Three families:

| Use | Family | Weights |
|---|---|---|
| Display / headlines | **Manrope** | 400, 500, 600, 700, 800 |
| Body / UI | **Inter** | 300–900 |
| Arabic (when `html[lang="ar"]`) | **Tajawal** | 200–900, !important override |

Latin glyphs cascade from Tajawal back to Inter automatically when the document is in Arabic.

### Scale

`clamp()` ramps for hero headlines (`clamp(2rem, 4vw, 3rem)`). Standard scale steps follow `1.25` ratio: 11 / 13 / 15 / 18 / 22 / 28 / 36 / 48 / 60. Eyebrows use 10–11px with `letter-spacing: 0.16em`, uppercase, weight 600.

### Letter spacing

| Use | Value |
|---|---|
| Display headlines | `-0.02em` to `-0.03em` |
| Body | default |
| Eyebrows / labels | `0.12em` to `0.16em`, uppercase |
| Buttons (small caps) | `0.04em` to `0.10em`, uppercase |

### Body line length

Cap at 65–75ch where prose runs (paragraphs, descriptions). Cards and tiles are not bound by this.

## Spacing scale

8-point base. Standard increments: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56`. Avoid one-off values (no random 13px). Use `gap` and `margin-top/bottom` over magic spacers.

Padding bands by surface:
- Tile cards: `16 / 20`
- Standard cards: `24` (Card primitive in `biozackteam/shared.tsx` defaults to this)
- Hero / image cards: `24` outside, edge-to-edge image inside
- Modals: `24 / 32`

## Radius

| Element | Radius |
|---|---|
| Pills, buttons | `999` |
| Inputs, small chips | `12` |
| Standard cards | `14–20` |
| Hero / image cards | `20` |
| Avatars | `50%` |

`rounded-2xl` (16px) is the Tailwind default for cards. Hero cards bump to 20.

## Elevation

Light shadow set:
- Low (chips, inputs): `0 1px 2px rgb(0 0 0 / 0.06)`
- Card resting: `0 4px 12px rgb(0 0 0 / 0.10)`
- Card raised / clickable: `0 8px 40px 0 rgba(0,0,0,0.25)` (used on hero workout/academy cards)
- Modal: `0 24px 64px rgb(0 0 0 / 0.45)`
- Gold CTA: `0 4px 12px rgb(var(--primary) / 0.25)`

## Components (existing, reuse — don't reinvent)

### Card primitive
[`src/components/dashboard/biozackteam/shared.tsx`](src/components/dashboard/biozackteam/shared.tsx) → `Card({ variant: 'default' | 'glass' | 'bright' })`
- `default` — `--surface-container`
- `glass` — `--surface-container-highest / 0.6` + `backdrop-filter: blur(24px)` + outline border + shadow. Use sparingly.
- `bright` — `--surface-bright` + outline. For top-of-fold panels.

### Eyebrow
Uppercase 11px, `letter-spacing: 0.16em`, color `--on-surface-variant`. Always above hero titles.

### WeekStatusPanel
Calendar Mon–Sun strip + streak ring + level + private rank. Lives in `biozackteam/shared.tsx`. Single source for the dashboard streak + level + standing display. Don't add separate `MetricCard` rows for those metrics elsewhere.

### Hero image cards
Three-layer technique: image (`background-image`) → goal-themed gradient (`mix-blend-mode: multiply`, opacity ~0.55) → bottom darkening fade for text legibility. Used by:
- Today's training (battle-rope `/workout-hero.jpg`)
- Continue Academy (classroom `/courses-hero.jpg`)
- Weekly check-in (coach + whiteboard `/checkin-hero.jpg`)

### CTAs (gold pill)
`background: linear-gradient(135deg, --primary, --primary-container)`, color `--on-primary`, `letter-spacing: 0.04em`, `text-transform: uppercase`, weight 600. Boxshadow `0 4px 12px rgb(var(--primary) / 0.25)` on raised CTAs.

### Status pill
Backdrop-blur pill on photo cards: `rgba(255,255,255,0.18)` fill, `backdrop-filter: blur(8px)`, color `#fff`, 11px uppercase 0.10em. Includes leading icon.

## Motion

- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for entrances, slides, expands
- **Standard transition**: 200ms `ease`
- **Slow / showy**: 600–800ms for XP bar fills, mode transitions
- **No bounce, no elastic**
- **No layout-property animations** — use `transform` + `opacity`, not `width/height/top/left`
- **Fade-in keyframe** (`bzt-fade-in`) defined in ProgressPanel; lift to global if reused

## Iconography

`lucide-react` everywhere, sized 13–22 depending on context:
- 13–14: inline pill labels
- 16: button icons
- 18–22: card eyebrow / hero icons

Icons inherit `currentColor` unless an explicit color override is needed for status (e.g. red for delete confirmation).

## RTL / Arabic

When `html[lang="ar"]`, Tajawal becomes the universal font (overrides inline Inter/Manrope via `!important` at the `html *` selector). RTL is handled at the document level via `dir="rtl"` from LanguageContext. Inputs and textareas align right in RTL.

Be careful with directional CSS:
- `padding-left/right` → use `padding-inline-start/end` where possible, or `[isRTL ? 'left' : 'right']: …`
- Icons that imply direction (chevrons, arrows) should mirror in RTL

## Absolute bans (impeccable shared rules)

- **Side-stripe borders** (border-left/right > 1px as a colored accent). Use full borders, leading icons, or quote marks for callouts. The Weekly Check-In feedback note uses a `“` glyph instead of a left stripe.
- **Gradient text everywhere** — exactly one gradient text element in the app (the welcome-name in dashboard headers). No more.
- **Glassmorphism as default** — the `Card variant="glass"` exists but is reserved for hero overlays on photo cards. Don't use it for routine surfaces.
- **Hero metric template** — big number + small label + supporting stats endlessly tiled. The dashboard explicitly consolidated three of these into `WeekStatusPanel` to escape this trap.
- **Identical card grids** — three same-sized cards in a row with icon + heading + text. Use varied widths and content to break the rhythm.
- **Modal as first thought** — most edits should be inline or a separate route, not modal. Modals reserved for ToS gate, confirm-destructive, Week 0 baseline gate.
