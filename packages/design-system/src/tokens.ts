// ─── Primitive Colors ────────────────────────────────────────────────────────

const primitiveColors = {
  // Moss — sophisticated primary green (replaces generic green)
  moss: {
    50:  "#F1F5EC",
    100: "#E1EBD6",
    200: "#C4D6B0",
    300: "#9EBB83",
    400: "#6F9458",
    500: "#4C7438",
    600: "#3B5B2C",
    700: "#2D4522",
    800: "#1F3017",
  },
  // Sage — cool, soft secondary surfaces & tags
  sage: {
    50:  "#F2F5EF",
    100: "#E4EADE",
    200: "#C8D3BF",
    300: "#A8B69E",
    500: "#7A8A72",
  },
  // Sand — warm base (replaces generic whites/cool greys)
  sand: {
    25:  "#FDFBF6",
    50:  "#FAF6ED",
    100: "#F3ECDD",
    200: "#E9DFC8",
    300: "#D9CAA9",
  },
  // Clay — terracotta warmth for accents, favorites, editorial
  clay: {
    100: "#F3E4D3",
    200: "#E8CBA9",
    400: "#C79273",
    500: "#B4714D",
    600: "#8E5233",
    700: "#6B3C24",
  },
  // Olive — natural note between moss and clay
  olive: {
    300: "#BFB480",
    500: "#8A7F46",
    700: "#544D28",
  },
  // Ink — rich warm neutrals (replaces stone + old ink)
  ink: {
    50:  "#F7F4EE",
    100: "#EAE5D9",
    200: "#D4CCBB",
    300: "#B0A697",
    500: "#6F675C",
    700: "#3A362F",
    800: "#26231E",
    900: "#15130F",
  },
  // Feedback
  success: {
    100: "#DEEAD0",
    500: "#5E8B45",
  },
  warning: {
    100: "#F2E2BE",
    500: "#C58A3A",
  },
  danger: {
    100: "#F1D7D3",
    500: "#B0524E",
  },
  white: "#FFFFFF",
  black: "#0B0A08",
} as const;

// ─── Semantic Colors ──────────────────────────────────────────────────────────

const semanticColors = {
  brand: {
    primary:       primitiveColors.moss[500],
    primaryStrong: primitiveColors.moss[700],
    primarySoft:   primitiveColors.moss[100],
    primaryMuted:  primitiveColors.moss[50],
    secondary:     primitiveColors.sage[500],
    accentWarm:    primitiveColors.clay[500],
    accentSoft:    primitiveColors.clay[100],
    accentStrong:  primitiveColors.clay[700],
  },
  surface: {
    base:    primitiveColors.sand[50],
    subtle:  primitiveColors.sand[100],
    card:    primitiveColors.sand[25],
    elevated: primitiveColors.white,
    inverse: primitiveColors.ink[900],
    tint:    primitiveColors.moss[50],
    warm:    primitiveColors.clay[100],
  },
  text: {
    primary:   primitiveColors.ink[900],
    secondary: primitiveColors.ink[500],
    tertiary:  primitiveColors.ink[300],
    inverse:   primitiveColors.sand[25],
    brand:     primitiveColors.moss[700],
    accent:    primitiveColors.clay[700],
    disabled:  primitiveColors.ink[300],
  },
  border: {
    subtle:  primitiveColors.ink[200],
    default: primitiveColors.ink[200],
    strong:  primitiveColors.ink[500],
    brand:   primitiveColors.moss[300],
  },
  feedback: {
    success:     primitiveColors.success[500],
    successSoft: primitiveColors.success[100],
    warning:     primitiveColors.warning[500],
    warningSoft: primitiveColors.warning[100],
    error:       primitiveColors.danger[500],
    errorSoft:   primitiveColors.danger[100],
  },
  overlay: {
    scrim: "rgba(21, 19, 15, 0.48)",
    soft:  "rgba(21, 19, 15, 0.14)",
  },
  special: {
    favoriteActive: primitiveColors.clay[600],
    favoriteSoft:   primitiveColors.clay[200],
    editorialAccent: primitiveColors.clay[400],
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

const fontFamily = {
  // UI sans — Inter Tight
  regular:       "InterTight_400Regular",
  regularItalic: "InterTight_400Regular_Italic",
  medium:        "InterTight_500Medium",
  semibold:      "InterTight_600SemiBold",
  bold:          "InterTight_700Bold",
  // Display — Fraunces (expressive, warm)
  displayRegular:  "Fraunces_400Regular",
  displayItalic:   "Fraunces_400Regular_Italic",
  displayMedium:   "Fraunces_500Medium",
  displaySemibold: "Fraunces_600SemiBold",
  // Editorial — Instrument Serif (lighter alternative)
  editorialRegular: "InstrumentSerif_400Regular",
  editorialItalic:  "InstrumentSerif_400Regular_Italic",
  // Legacy aliases
  base:    "InterTight_400Regular",
  display: "Fraunces_400Regular",
  mono:    "monospace",
} as const;

const fontWeight = {
  regular:  "400",
  medium:   "500",
  semibold: "600",
  bold:     "700",
} as const;

const typographyScale = {
  display: {
    "2xl": { fontSize: 64, lineHeight: 66, fontFamily: fontFamily.displayRegular, fontWeight: fontWeight.regular, letterSpacing: -1.6 },
    xl:    { fontSize: 48, lineHeight: 51, fontFamily: fontFamily.displayRegular, fontWeight: fontWeight.regular, letterSpacing: -1.06 },
    lg:    { fontSize: 40, lineHeight: 44, fontFamily: fontFamily.displayRegular, fontWeight: fontWeight.regular, letterSpacing: -0.8 },
    md:    { fontSize: 32, lineHeight: 36, fontFamily: fontFamily.displayRegular, fontWeight: fontWeight.regular, letterSpacing: -0.58 },
  },
  title: {
    xl: { fontSize: 28, lineHeight: 32, fontFamily: fontFamily.semibold, fontWeight: fontWeight.semibold, letterSpacing: -0.34 },
    lg: { fontSize: 24, lineHeight: 30, fontFamily: fontFamily.semibold, fontWeight: fontWeight.semibold, letterSpacing: -0.24 },
    md: { fontSize: 20, lineHeight: 26, fontFamily: fontFamily.semibold, fontWeight: fontWeight.semibold, letterSpacing: -0.12 },
  },
  body: {
    lg: { fontSize: 18, lineHeight: 28, fontFamily: fontFamily.regular, fontWeight: fontWeight.regular },
    md: { fontSize: 16, lineHeight: 24, fontFamily: fontFamily.regular, fontWeight: fontWeight.regular },
    sm: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular, fontWeight: fontWeight.regular },
  },
  label: {
    lg: { fontSize: 15, lineHeight: 19, fontFamily: fontFamily.medium, fontWeight: fontWeight.medium },
    md: { fontSize: 13, lineHeight: 16, fontFamily: fontFamily.medium, fontWeight: fontWeight.medium, letterSpacing: 0.065 },
  },
  caption: {
    md: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.medium, fontWeight: fontWeight.medium, letterSpacing: 0.24 },
  },
  overline: {
    md: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.semibold, fontWeight: fontWeight.semibold, letterSpacing: 1.54 },
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

const space = {
  "2xs": 4,
  xs:    8,
  sm:    12,
  md:    16,
  lg:    24,
  xl:    32,
  "2xl": 40,
  "3xl": 48,
  "4xl": 64,
  "5xl": 96,
} as const;

// ─── Radius ───────────────────────────────────────────────────────────────────

const radius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  "2xl": 36,
  pill: 999,
} as const;

// ─── Elevation — warm-tinted, never hard black ────────────────────────────────

const shadowColor = primitiveColors.ink[700]; // #3A362F warm neutral

const elevation = {
  none: {
    shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 28,
    elevation: 5,
  },
  xl: {
    shadowColor,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.14,
    shadowRadius: 56,
    elevation: 8,
  },
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────────

const motion = {
  fast:       120,
  normal:     180,
  slow:       260,
  emphasized: 320,
} as const;

// ─── Export ───────────────────────────────────────────────────────────────────

export const tokens = {
  color: {
    primitive: primitiveColors,
    semantic:  semanticColors,
  },
  typography: {
    family: fontFamily,
    weight: fontWeight,
    scale:  typographyScale,
    // Legacy aliases preserved during migration.
    fontSizes: {
      sm: typographyScale.body.sm.fontSize,
      md: typographyScale.body.md.fontSize,
      lg: typographyScale.body.lg.fontSize,
      xl: typographyScale.title.lg.fontSize,
    },
    fontWeights: fontWeight,
  },
  space,
  radius,
  elevation,
  motion,

  // Legacy aliases preserved during migration.
  colors: {
    primary:     semanticColors.brand.primary,
    background:  semanticColors.surface.base,
    textPrimary: semanticColors.text.primary,
    error:       semanticColors.feedback.error,
    surface:     semanticColors.surface.elevated,
  },
  spacing: {
    xs:    space["2xs"],
    sm:    space.xs,
    md:    space.sm,
    lg:    space.md,
    xl:    space.lg,
    "2xl": space.xl,
    "3xl": space["3xl"],
  },
  borderRadius: {
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
  },
} as const;

export type Tokens = typeof tokens;
