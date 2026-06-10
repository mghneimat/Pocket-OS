import { Platform } from 'react-native';

/**
 * Onboarding UI design tokens — single source of truth for all inline styles
 * used across onboarding question screens, splash screens, and shared components.
 *
 * Updated to match the blue/navy design system from UI Examples (Screens 2, 5, 6).
 * Gluestack provider tokens mirror these values in gluestack-ui.config.js — keep both in sync.
 *
 * Rule: No onboarding component may hardcode a colour, radius, font size, or
 * spacing value that is defined here. Import from this file instead.
 *
 * @see gluestack-ui.config.js
 */

// ── Colour palette ──────────────────────────────────────────────────────────
export const C = {
  bg:              '#EFF4FB',        // Light blue-gray background (UI Examples)
  surface:         '#F8FAFF',        // Very light blue surface (UI Examples)
  primary:         '#1E3A5F',        // Dark navy primary (UI Examples)
  primaryPressed:  '#162B45',        // Darker navy on press
  accent:          '#2563EB',        // Blue accent (blue-600 from UI Examples)
  accentPressed:   '#1D4ED8',        // Darker blue on press
  positive:        '#10B981',        // Green for success
  danger:          '#EF4444',        // Red for errors
  text:            '#1E3A5F',        // Dark navy text (UI Examples)
  muted:           '#6B7A99',        // Slate gray for secondary text (UI Examples)
  border:          '#D1DCF0',        // Light blue border (UI Examples)
  divider:         '#D1DCF0',        // Light blue divider (UI Examples)
  placeholder:     '#6B7A99',        // Muted placeholder (≥4.5:1 on surface)
  disabled:        '#D1D5DB',        // Light gray disabled

  // Chip / pill states
  chipSelectedBg:  '#DBEAFE',        // Light blue background
  chipSelectedBorder: '#2563EB',     // Blue border

  // Overlay states (for PillToggle)
  overlaySelected: 'rgba(30,58,95,0.1)',
  overlayHover:    'rgba(30,58,95,0.05)',
  overlayPressed:  'rgba(30,58,95,0.08)',
  overlaySelectedDarker: 'rgba(30,58,95,0.15)',
  overlayHoverDarker:    'rgba(30,58,95,0.08)',
  overlayPressedDarker:  'rgba(30,58,95,0.12)',

  // Validation / info banners
  dangerBg:        '#FEE2E2',
  dangerBorder:    '#FCA5A5',
  infoBg:          '#DBEAFE',
  infoBorder:      '#93C5FD',
  infoText:        '#1E40AF',

  // Add-another button
  addBorder:       '#2563EB',        // Blue dashed border (UI Examples)
  addText:         '#2563EB',        // Blue text (UI Examples)
  addPressed:      '#EFF4FB',

  // Progress bar
  progressTrack:   '#D1DCF0',        // Light blue track (UI Examples)
  progressFill:    '#1E3A5F',        // Navy fill (UI Examples)

  // Frequency pills
  pillSelectedBg:  '#1E3A5F',        // Navy bg when selected (UI Examples)
  pillSelectedText:'#FFFFFF',        // White text when selected
  pillUnselectedBg:'#EFF4FB',        // Light bg when unselected (UI Examples)
  pillUnselectedBorder: '#D1DCF0',  // Light border when unselected
  pillUnselectedText: '#6B7A99',    // Muted text when unselected
};

// ── Radius ───────────────────────────────────────────────────────────────────
export const R = {
  input:   10,   // TextInput, OptionCard, pill group container
  card:    10,   // Repeating item cards
  button:  10,   // Continue / primary button
  pill:    99,   // Progress bar fill, rounded pills
  chip:    12,   // Suggestion chips (subscriptions, other-costs)
};

// ── Typography (fixed product scale: 12 / 13 / 15 / 24 / 28 / 40) ───────────
export const T = {
  // Question screen
  questionTitle:   { fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1E3A5F', fontFamily: 'Inter' },
  helper:          { fontSize: 15, lineHeight: 23, color: '#6B7A99', fontFamily: 'Inter' },

  // Splash screen
  splashHeading:   { fontSize: 28, lineHeight: 34, fontWeight: '700', color: '#1E3A5F', fontFamily: 'Inter' },
  splashBody:      { fontSize: 15, lineHeight: 24, color: '#6B7A99', fontFamily: 'Inter' },
  eyebrow:         { fontSize: 12, fontWeight: '500', color: '#6B7A99', fontFamily: 'Inter' },

  // Labels
  fieldLabel:      { fontSize: 13, fontWeight: '500', color: '#6B7A99', fontFamily: 'Inter' },
  sectionLabel:    { fontSize: 12, fontWeight: '500', color: '#6B7A99', fontFamily: 'Inter' },
  caption:         { fontSize: 12, lineHeight: 18, fontFamily: 'Inter' },
  hint:            { fontSize: 12, lineHeight: 18, fontFamily: 'Inter' },

  // Inputs
  inputText:       { fontSize: 17, fontWeight: '400', color: '#1E3A5F', fontFamily: 'Inter' },
  inputLarge:      { fontSize: 28, fontWeight: '600', color: '#1E3A5F', fontFamily: 'Inter' },

  // Buttons
  btnPrimary:      { fontSize: 15, fontWeight: '600', fontFamily: 'Inter' },
  btnSkip:         { fontSize: 13, color: '#6B7A99', fontFamily: 'Inter' },
  btnAdd:          { fontSize: 14, fontWeight: '500', color: '#2563EB', fontFamily: 'Inter' },

  // Pills
  pillLabel:       { fontSize: 13, fontWeight: '500', fontFamily: 'Inter' },
  pillLabelLarge:  { fontSize: 15, fontWeight: '500', fontFamily: 'Inter' },
  pillLabelSmall:  { fontSize: 11, fontFamily: 'Inter' },

  // Nav
  backBtn:         { fontSize: 15, fontWeight: '400', color: '#6B7A99', fontFamily: 'Inter' },
  chapterLabel:    { fontSize: 15, fontWeight: '600', color: '#1E3A5F', fontFamily: 'Inter' },
  progressLabel:   { fontSize: 11, fontWeight: '500', color: '#6B7A99', fontFamily: 'Inter' },

  // Welcome / brand entry
  displayBrand:    { fontSize: 40, lineHeight: 44, color: '#1E3A5F', fontFamily: 'Inter' },
  welcomeTagline:  { fontSize: 18, lineHeight: 26, fontWeight: '500', color: '#1E3A5F', fontFamily: 'Inter' },
  welcomeBody:     { fontSize: 15, lineHeight: 24, color: '#6B7A99', fontFamily: 'Inter' },
};

/** Align currency figures in budget tables */
export const tabularNums = Platform.select({
  web: { fontVariantNumeric: 'tabular-nums' },
  default: { fontVariant: ['tabular-nums'] },
});

// ── Spacing ───────────────────────────────────────────────────────────────────
export const S = {
  pagePadH:        20,   // Horizontal page padding
  pagePadV:        24,   // Vertical page padding (top/bottom of content)
  cardPad:         16,   // Inner padding of repeating item cards
  inputPadH:       16,   // Horizontal padding inside TextInput
  inputPadV:       14,   // Vertical padding inside TextInput
  fieldGap:        16,   // Gap between field groups
  labelGap:        6,    // Gap between label and input
  sectionGap:      24,   // Gap after helper text before input area
  inputGap:        8,    // Gap between stacked inputs inside a card
  pillPadV:        14,   // Vertical padding inside pill toggle
  pillPadVSmall:   10,   // Smaller pill vertical padding (inside cards)
  navHeight:       56,   // Fixed nav bar height
  progressHeight:  3,    // Progress bar track height
  progressPanel:   44,   // Animated progress panel total height
  maxWidth:        560,  // Max content column width
};

// ── Input base style (shared across all TextInput instances) ──────────────────
export const inputBase = {
  backgroundColor: C.surface,
  borderWidth: 1.5,
  borderColor: C.border,
  borderRadius: R.input,
  paddingHorizontal: S.inputPadH,
  paddingVertical: S.inputPadV,
  color: C.text,
  ...T.inputText,
};

// ── Input base style for inputs inside cards (slightly smaller) ───────────────
export const inputCard = {
  backgroundColor: C.bg,
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 15,
  color: C.text,
};

// ── Large numeric input (income, amounts) ─────────────────────────────────────
export const inputLarge = {
  ...inputBase,
  borderRadius: 12,
  ...T.inputLarge,
};

// ── Primary button ────────────────────────────────────────────────────────────
export const btnPrimary = (disabled, pressed) => ({
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: R.button,
  backgroundColor: disabled ? C.disabled : pressed ? C.primaryPressed : C.accent,
  alignItems: 'center',
  justifyContent: 'center',
});

// ── Add-another dashed button ─────────────────────────────────────────────────
export const btnAdd = (pressed) => ({
  paddingVertical: 12,
  borderRadius: R.input,
  borderWidth: 2,
  borderColor: C.addBorder,
  borderStyle: 'dashed',
  alignItems: 'center',
  backgroundColor: pressed ? C.addPressed : 'transparent',
});

// ── SVG illustration palette (splash screens) ───────────────────────────────
/** Maps legacy warm-tone SVG fills to the blue/navy design system. */
export const SVG = {
  primary: C.primary,
  accent: C.accent,
  positive: C.positive,
  surface: C.surface,
  border: C.border,
  bg: C.bg,
};
