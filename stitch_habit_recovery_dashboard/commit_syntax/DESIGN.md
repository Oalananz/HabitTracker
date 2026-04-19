# Design System Specification: Editorial Terminalism

## 1. Overview & Creative North Star
### The Creative North Star: "The Sovereign Console"
This design system rejects the "bubbly" consumer web in favor of a high-end, editorialized command center. It blends the utility of a developer’s terminal with the sophisticated spacing of a premium digital journal. We are moving away from generic dashboards toward a **Sovereign Console**—an interface that feels engineered, authoritative, and intentionally sparse.

The system breaks the "template" look through **intentional asymmetry**. We do not center everything; we lean into left-aligned "command" structures and use dramatic typography scales to create a sense of information hierarchy that feels like a redacted intelligence report.

---

## 2. Colors & Surface Architecture
The palette is rooted in deep obsidian tones, utilizing the Material Design 3 surface-tiering logic to create depth without relying on antiquated shadows.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for structural sectioning. Boundaries must be defined through **Background Shift Strategy**. For example, a `surface-container-low` (#181c22) module should sit directly on a `background` (#10141a) floor. The shift in hex value is the boundary. 

### Surface Hierarchy
*   **Background / Surface:** `#10141a` – The base floor of the application.
*   **Surface-Container-Lowest:** `#0a0e14` – Used for "sunken" terminal inputs or code blocks.
*   **Surface-Container-Low:** `#181c22` – The standard secondary panel color.
*   **Surface-Container-Highest:** `#31353c` – Used for elevated modal-like terminal windows.

### Accent Roles
*   **Primary (Success/Streak):** `#6cdd81` (derived from `#2ea44f`) – Used for terminal prompts and positive growth metrics.
*   **Secondary (Info):** `#a2c9ff` – Used for system-level notifications.
*   **Tertiary (Warning):** `#fabc45` – High-contrast alerts.

### The "Glass & Gradient" Rule
To elevate the "flat" terminal look, use a **Subtle Scanline Gradient** on primary CTAs: a linear-gradient (180deg) from `primary` (#6cdd81) to `primary-container` (#2fa550). This adds a "lithium-ion" glow characteristic of high-end hardware.

---

## 3. Typography
We utilize a dual-font strategy to balance technical precision with editorial readability.

*   **The Technical Voice (Headings/Labels):** `Space Grotesk` (or `JetBrains Mono` for raw data). All headlines and system labels use this to mimic a terminal’s header.
    *   *Display-LG:* 3.5rem – Used for hero stats (e.g., "STREAK: 42").
    *   *Label-MD:* 0.75rem – Used for terminal prefixes like `> system/status`.
*   **The Narrative Voice (Body):** `Inter`. Used for all descriptive text and documentation.
    *   *Body-MD:* 0.875rem – The workhorse for all content.

**Hierarchy Note:** Always prefix section headers with a monospace caret (`> `) set in `primary` color to anchor the terminal aesthetic.

---

## 4. Elevation & Depth
In this system, depth is **Tonal**, not structural.

*   **The Layering Principle:** Stack your containers. An "Active Task" card should be `surface-container-low`, while the "Sidebar" is `surface-container-lowest`. This creates a natural "docked" feeling.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` (#3e4a3e) at **15% opacity**. It should be felt, not seen.
*   **Ambient Shadows:** Floating elements (modals) use a `24px` blur with 4% opacity of the `on-surface` color. It should mimic a soft atmospheric glow from the screen rather than a drop shadow.

---

## 5. Components

### Terminal Panels (The Core Component)
Replace "Cards." A Terminal Panel consists of a `label-sm` header (e.g., `> logs/history`) sitting atop a container with `0.25rem` (4px) corners. No dividers.
*   **Container:** `surface-container-low`
*   **Header:** `on-surface-variant` typography.

### Buttons
*   **Primary:** Sharp corners (`0px` or `2px`). Background: `primary`. Text: `on-primary` (Deep Green).
*   **Secondary/Ghost:** `outline-variant` at 20% opacity with `primary` text. No fill.

### Inputs
*   **Terminal Input:** `surface-container-lowest` background. Prefix with a blinking cursor block or a `>` character. Use `body-md` (Inter) for typing, but `label-sm` (Space Grotesk) for the field label.

### Lists & Arrays
*   **Constraint:** Forbid the use of divider lines. 
*   **Separation:** Use `8px` of vertical whitespace. Highlight the "Hover" state by shifting the background to `surface-container-high`.

### Signature Component: The "Status Ribbon"
A thin, 2px vertical strip on the left edge of a container using `primary`, `error`, or `tertiary` to denote the state of that data block (Success, Failure, Warning).

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme letter-spacing (-0.02em) on `display` headings for a tighter, "printed" look.
*   **Do** use `0.25rem` (4px) radius as the absolute maximum. Sharp corners are preferred for a "hard-tech" feel.
*   **Do** leverage `surface-bright` for hover states on dark backgrounds to create a "backlit" effect.

### Don't
*   **Don't** use pure black (#000) or pure white (#FFF). It breaks the sophisticated tonal balance of the obsidian palette.
*   **Don't** use icons without labels. In a terminal system, text is the primary affordance.
*   **Don't** use "Soft" UI elements like heavy rounded corners, colorful drop shadows, or playful illustrations. The vibe is **Utility + Luxury.**