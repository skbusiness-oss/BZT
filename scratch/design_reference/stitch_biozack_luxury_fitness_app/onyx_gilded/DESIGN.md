# Design System Document: The Performance Atelier

## 1. Overview & Creative North Star: "The Performance Atelier"
This design system is built on the philosophy of "The Performance Atelier"—a space where high-precision athletic coaching meets the bespoke luxury of a private lounge. We are moving away from the "loud" neon aesthetics of typical fitness apps and toward the quiet, authoritative power of a luxury automotive cockpit. 

The interface must feel like a series of layered, illuminated surfaces floating in a deep-space void. We achieve this through **Intentional Asymmetry** (breaking the grid to highlight key performance metrics), **Tonal Depth** (using color shifts instead of lines), and **Editorial Typography** (high-contrast scales that prioritize readability and prestige).

---

## 2. Colors: Deep Space & Liquid Gold
The palette is rooted in a deep, nocturnal navy (`background: #0e1322`) contrasted against the warmth of precious metal (`primary: #e6c364`).

*   **The "No-Line" Rule:** To maintain a premium feel, 1px solid borders are prohibited for sectioning. Boundaries must be defined through background color shifts. For example, a workout module sitting in a `surface-container-low` section on a `surface` background creates a sophisticated edge without the "cheapness" of a stroke.
*   **Surface Hierarchy & Nesting:** Treat the UI as a physical stack of frosted glass.
    *   **Level 0 (Base):** `surface` (#0e1322) - The vast background.
    *   **Level 1 (Sections):** `surface-container-low` (#161b2b) - Large layout blocks.
    *   **Level 2 (Cards):** `surface-container` (#1a1f2f) - Interactive components.
    *   **Level 3 (Pop-ups/Floating):** `surface-bright` (#343949) - Elements requiring maximum focus.
*   **The Glass & Gradient Rule:** Interactive surfaces should utilize Glassmorphism. Use semi-transparent variants of `surface_container` with a `backdrop-blur` of 20px–40px. 
*   **Signature Textures:** Primary CTAs must use a linear gradient from `primary` (#e6c364) to `primary_container` (#c9a84c) at a 135-degree angle to mimic the sheen of polished gold.

---

## 3. Typography: Editorial Authority
We use a dual-font system to balance technical precision with luxury.
*   **Display & Headlines (Manrope):** These are our "Statement" pieces. Use `display-lg` (3.5rem) for high-impact motivation or key metrics. The geometric nature of Manrope conveys engineering excellence.
*   **Body & Labels (Inter/SF Pro Style):** Use Inter for all functional text. It provides the "Apple-style" clarity required for complex training data.
*   **Hierarchy as Identity:** Create "breath" by pairing a `display-md` headline with a `label-md` uppercase sub-header. The massive jump in scale creates an editorial, high-end magazine feel.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too heavy for this aesthetic. We use light and transparency to define space.

*   **The Layering Principle:** Depth is achieved by "stacking." Place a `surface-container-lowest` element on top of a `surface-container-high` to create a "recessed" look, or vice-versa for "lift."
*   **Ambient Shadows:** If a card must float, use a shadow with a 40px blur, 0% spread, and 8% opacity. The color should be derived from the `on-surface` token to ensure the shadow feels like a natural light occlusion rather than a "grey smudge."
*   **The "Ghost Border" Glow:** For high-end cards, apply a 1px border using the `primary` token at 15% opacity. This creates a "gold glow" effect that feels like fiber-optic lighting in a luxury vehicle.
*   **Glassmorphism Specs:**
    *   **Fill:** `surface_container_highest` at 60% opacity.
    *   **Blur:** 24px Backdrop Blur.
    *   **Edge:** 1px "Ghost Border" (as defined above).

---

## 5. Components: The Bespoke Toolkit

### Buttons: High-Performance Triggers
*   **Primary:** Pill-shaped (`rounded-full`), using the Gold Gradient. Text must be `on-primary_fixed` (#241a00) for maximum legibility against the gold.
*   **Secondary:** Ghost style. No fill, `outline` token at 30% opacity, with `primary` colored text.
*   **States:** On hover, the "Ghost Border" opacity should increase from 15% to 50%, simulating a "powering up" effect.

### Chips & Pill Tags
*   **Style:** `rounded-full`, `surface-container-highest` background.
*   **Usage:** Use for "Workout Category" or "Muscle Group." Gold text (`primary`) should be used only for active/selected states.

### Input Fields: Minimalist Precision
*   **Structure:** Forgo the four-sided box. Use a `surface-container-low` background with a `rounded-sm` (0.5rem) corner and a subtle bottom-only accent in `outline_variant`.
*   **Focus State:** Transition the bottom accent to `primary` (Gold) with a subtle outer glow.

### Cards: The Glass Gallery
*   **Requirement:** No divider lines. Separate content using the Spacing Scale (Vertical rhythm).
*   **Layout:** Use `padding: 2rem` (`xl` scale) to ensure the content "breathes." A cramped card is a "budget" card.

### Progress Visualizers (App Specific)
*   **The Gold Gauge:** Use `primary` gradients for progress bars. The "track" of the bar should be `surface-container-highest` to feel recessed into the glass.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Whitespace as a Luxury:** Give elements more room than you think they need. Space is the ultimate signifier of premium design.
*   **Use Tonal Transitions:** Separate the "Header" from the "Body" by shifting from `surface` to `surface-container-low`.
*   **Prioritize Legibility:** Gold text is for accents and CTAs. Large blocks of body text should always be `on-surface` (#dee1f7) for eye comfort.

### Don’t:
*   **Never use 100% Black:** Avoid `#000000`. Use the `surface` tokens to maintain the "Deep Navy" atmosphere.
*   **Avoid Rigid Grids:** Occasionally offset a headline or an image by 8px–16px to create a custom, "tailored" look.
*   **No High-Contrast Borders:** Never use a 100% opaque border. It breaks the illusion of "The Performance Atelier" and makes the UI feel like a standard template.