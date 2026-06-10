---
name: Bida
description: A smart personal budgeting tool — navy ledger aesthetic, restrained and task-focused
colors:
  bg: "#EFF4FB"
  surface: "#F8FAFF"
  primary: "#1E3A5F"
  primary-pressed: "#162B45"
  accent: "#2563EB"
  accent-pressed: "#1D4ED8"
  text: "#1E3A5F"
  muted: "#6B7A99"
  border: "#D1DCF0"
  placeholder: "#6B7A99"
  positive: "#10B981"
  danger: "#EF4444"
  chip-selected-bg: "#DBEAFE"
  chip-selected-border: "#2563EB"
  on-accent: "#FFFFFF"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  input: "10px"
  card: "10px"
  button: "10px"
  chip: "12px"
  pill: "99px"
spacing:
  page-pad-h: "20px"
  page-pad-v: "24px"
  field-gap: "16px"
  label-gap: "6px"
  nav-height: "56px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.button}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent-pressed}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.button}"
    padding: "16px 24px"
  button-primary-disabled:
    backgroundColor: "#D1D5DB"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.button}"
    padding: "16px 24px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.button}"
    padding: "16px 24px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.input}"
    padding: "14px 16px"
  chip-selected:
    backgroundColor: "{colors.chip-selected-bg}"
    textColor: "{colors.primary}"
    rounded: "{rounded.chip}"
    padding: "12px 14px"
  chip-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.chip}"
    padding: "12px 14px"
  nav-row-active:
    backgroundColor: "{colors.chip-selected-bg}"
    textColor: "{colors.primary}"
    rounded: "{rounded.input}"
    padding: "0px 8px"
---

# Design System: Bida

## Overview

**Creative North Star: "Your wallet patron"**

Bida looks and feels like a calm personal ledger brought into software: navy ink on cool paper, one blue accent for actions, and density only where money math demands it. The interface serves a couple or family sitting down in the evening to understand income, costs, and what is left to spend. It should feel trustworthy and familiar, not like a fintech marketing site or a generic AI workflow tool.

The canonical visual source is `constants/onboarding-theme.js` (`C`, `R`, `T`, `S`). Onboarding, consent, splash screens, and the app sidebar use these tokens directly. Authenticated app tab screens partially use NativeWind (`tailwind.config.js`) with hex values mirrored from the same palette. Gluestack provider tokens in `gluestack-ui.config.js` must stay in sync with `onboarding-theme.js`.

**Key Characteristics:**
- Restrained color strategy: tinted cool neutrals plus blue accent on primary actions and selection only
- Single sans family (Inter) across all UI; fixed px scale, not fluid clamp typography
- Flat surfaces at rest; depth via background tints (`bg` vs `surface` vs `chipSelectedBg`), not decorative shadows
- One question per screen during onboarding; progress bar and fixed continue bar for orientation
- Collapsible left sidebar in the app shell; mobile drawer below 768px breakpoint
- Formal Czech ("vy") and English locale parity on all user-facing copy

## Colors

A cool navy-and-paper palette tuned for household finance clarity.

### Primary
- **Ledger Navy** (`#1E3A5F`): Headings, primary text, selected pill backgrounds, progress fill, brand wordmark. The ink color of the ledger.
- **Pressed Navy** (`#162B45`): Pressed states on navy-adjacent controls.

### Secondary
- **Action Blue** (`#2563EB`): Primary CTA buttons (Continue, Start now), focus borders on inputs, chapter labels, active accents.
- **Pressed Blue** (`#1D4ED8`): Primary button press state.

### Tertiary
- **Positive Green** (`#10B981`): Surplus amounts, success indicators in budget summary.
- **Alert Red** (`#EF4444`): Errors, negative amounts, destructive consent actions.

### Neutral
- **Cool Paper** (`#EFF4FB`): Page background (`C.bg`). Main canvas behind content.
- **Ledger Surface** (`#F8FAFF`): Cards, nav bars, inputs (`C.surface`). Slightly lighter than bg.
- **Slate Muted** (`#6B7A99`): Helper text, field labels, secondary nav labels. Use for placeholders (audit: darken from `#9CA3AF` for 4.5:1 contrast).
- **Blue Mist Border** (`#D1DCF0`): Borders, dividers, table rules, progress track.
- **Selected Chip Wash** (`#DBEAFE`): Active nav rows, selected chips, language badge highlight.
- **On Accent White** (`#FFFFFF`): Text on blue/navy filled buttons and selected pill labels.

### Named Rules
**The One Accent Rule.** Blue accent appears on primary actions, focus rings, and current selection. It is not a decorative wash across layouts.

**The Token Source Rule.** New screens import `C`, `R`, `T`, `S` from `onboarding-theme.js`. Do not hardcode hex in components. If NativeWind is used in app routes, map utilities to the same hex values in `tailwind.config.js`.

## Typography

**Display Font:** Inter (system-ui fallback)
**Body Font:** Inter (system-ui fallback)
**Label Font:** Inter (same family; weight contrast carries hierarchy)

**Character:** Technical clarity without coldness. One family, stepped weights (400/500/600/700), modest size jumps. No display/body pairing.

### Hierarchy
- **Display** (700, 30px splash / 48px welcome brand split, line-height 1.2): Welcome and splash headlines only. Welcome brand uses 300/700 weight split on "Pocket" / "OS".
- **Headline** (700, 24px, line-height 32px): Question titles on onboarding screens (`T.questionTitle`).
- **Title** (600, 17px): Mobile app header, money input values, table row amounts.
- **Body** (400, 15px, line-height 22–24px): Helpers, descriptions, option card labels. Cap prose blocks at 65–75ch (`S.maxWidth` 560px column).
- **Label** (500, 13px): Field labels (`T.fieldLabel`), export bar labels, sidebar row labels. Sentence case preferred; avoid uppercase eyebrows on every section.

### Named Rules
**The Fixed Scale Rule.** Product UI uses fixed px sizes from `T.*`, not clamp() fluid headings. Sidebar and data tables need predictable sizing.

**The Sentence Case Rule.** Reserve uppercase for short badges (locale codes EN/CS), not section scaffolding on every screen.

## Elevation

Bida is flat-by-default. Depth comes from tonal layering: `bg` page, `surface` panels, `chipSelectedBg` selection, and 1px `border`/`divider` rules. Shadows are rare and should not pair with borders on the same element (no ghost-card pattern).

### Shadow Vocabulary
- **Dropdown lift (web only):** `0 6px 20px rgba(30, 58, 95, 0.12)` on language menu. Prefer border-only treatment when revisiting; do not add wide blur shadows to cards or buttons.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Hover uses `overlayHover` rgba tints (`rgba(30,58,95,0.05)`), not drop shadows.

**The No Ghost-Card Rule.** Never combine `border: 1px` with soft shadows ≥16px blur on the same component. Pick border OR a tight ≤8px shadow.

## Components

### Buttons
- **Shape:** Gently rounded (10px, `R.button`)
- **Primary:** Action Blue fill, white 15px/600 label, 16px vertical / 24px horizontal padding. Full width on onboarding continue bar.
- **Hover / Press:** Opacity 0.92 on hover; `#1D4ED8` on press. Disabled: `#D1D5DB` fill.
- **Outline / Skip:** Transparent fill, 1.5px border `#D1DCF0`, muted 13px label.

### Chips
- **Suggestion chip:** 12px radius, 1.5px border. Selected: navy border + chip wash bg. Unselected: surface bg + border.
- **Frequency pill:** Full pill (`R.pill` 99px). Selected: navy bg + white text. Unselected: bg fill + border.

### Cards / Containers
- **Corner Style:** 10px (`R.card`, `R.input`)
- **Background:** `surface` for cards; `bg` for nested table headers and expanded breakdown rows
- **Border:** 1px `#D1DCF0`; budget summary table uses full grid rules, not side-stripe accents
- **Internal Padding:** 16px card pad (`S.cardPad`); table cells 12–14px vertical

### Inputs / Fields
- **Style:** `surface` fill, 2–2.5px border `#D1DCF0`, 10px radius. Large money inputs: 22px/600 value text.
- **Focus:** Border shifts to Action Blue (`C.accent`). Web: visible focus ring required (do not zero outline without replacement).
- **Error:** Danger border + `#FEE2E2` banner pattern. Helper text 12px below field.

### Navigation
- **Onboarding nav:** 56px bar, back button left, centered chapter label (blue 16px/600), thin 3px progress bar below.
- **App sidebar:** 260px expanded / 68px collapsed rail. Fixed 40px icon column; labels fade on collapse. Active row: chip wash bg. Section labels sentence case preferred.
- **Mobile:** Hamburger trigger in top bar; sidebar slides in as modal drawer with backdrop `rgba(30,58,95,0.35)`.

### Budget Summary Table (signature)
- **Style:** Bordered grid on `surface`, expandable income/cost rows, export chips below table.
- **Amount column:** Right-aligned currency values; positive green / negative default text semantics.
- **Interaction:** Expand/collapse chevrons on rows; "Expand all" control in table header band.

## Do's and Don'ts

### Do:
- **Do** import colors, radius, type, and spacing from `constants/onboarding-theme.js` for all new onboarding and shell UI.
- **Do** keep Gluestack and Tailwind configs synced when changing `C.*` values.
- **Do** wire all user-facing copy through `useI18n()` with EN + CS keys in the same edit.
- **Do** use Action Blue only for primary CTAs, focus, and selected state.
- **Do** preserve sidebar icon column alignment (40px slot) during collapse animation.
- **Do** show loading, validation, and active-route feedback on every interactive flow.

### Don't:
- **Don't** hardcode hex or rgba in components when a token exists in `onboarding-theme.js`.
- **Don't** use uppercase tracked eyebrows on every section (Navigation, Tools, table headers). Use sentence case or spacing for hierarchy.
- **Don't** pair 1px borders with wide soft drop shadows on cards or menus (ghost-card pattern).
- **Don't** use gradient text, glassmorphism, or decorative motion that does not convey state.
- **Don't** mix onboarding inline tokens and NativeWind app screens without mapping to the same hex values (causes handoff drift).
- **Don't** ship icon-only navigation without `accessibilityLabel` and tooltip/expand affordances for collapsed sidebar.
- **Don't** use placeholder gray `#9CA3AF` on light surfaces; use `muted` (`#6B7A99`) for readable placeholder contrast.
