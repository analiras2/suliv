const primitiveColors = {
  green: {
    100: "#E6F1DD",
    300: "#B8D39E",
    500: "#6FA24D",
    700: "#4E7338",
  },
  sage: {
    100: "#EEF3EA",
    300: "#CAD7C5",
    500: "#91A28E",
  },
  sand: {
    50: "#FBF8F2",
    100: "#F4EFE5",
    300: "#E7DDCC",
  },
  clay: {
    200: "#E8D3C0",
    400: "#C79B77",
    600: "#9D6A48",
  },
  stone: {
    50: "#F7F5F1",
    100: "#EFEBE4",
    300: "#D7D0C5",
    600: "#7C756C",
    900: "#2E2B28",
  },
  ink: {
    700: "#39352F",
    900: "#1E1B18",
  },
  red: {
    500: "#C85A5A",
  },
  amber: {
    500: "#D19A38",
  },
  white: "#FFFFFF",
} as const;

const semanticColors = {
  brand: {
    primary: primitiveColors.green[500],
    primaryStrong: primitiveColors.green[700],
    primarySoft: primitiveColors.green[100],
    secondary: primitiveColors.sage[500],
    accentWarm: primitiveColors.clay[400],
  },
  surface: {
    base: primitiveColors.sand[50],
    subtle: primitiveColors.sand[100],
    elevated: primitiveColors.white,
    highlight: primitiveColors.green[100],
    inverse: primitiveColors.ink[900],
  },
  text: {
    primary: primitiveColors.ink[900],
    secondary: primitiveColors.stone[600],
    tertiary: primitiveColors.stone[300],
    inverse: primitiveColors.white,
    brand: primitiveColors.green[700],
    disabled: primitiveColors.stone[300],
  },
  border: {
    subtle: primitiveColors.sand[100],
    default: primitiveColors.stone[300],
    strong: primitiveColors.stone[600],
    brand: primitiveColors.green[300],
  },
  feedback: {
    success: primitiveColors.green[500],
    successSoft: primitiveColors.green[100],
    warning: primitiveColors.amber[500],
    warningSoft: "#F5E9CB",
    error: primitiveColors.red[500],
    errorSoft: "#F5DDDD",
  },
  overlay: {
    scrim: "rgba(30, 27, 24, 0.48)",
    soft: "rgba(30, 27, 24, 0.16)",
  },
  special: {
    favoriteActive: primitiveColors.clay[600],
    favoriteSoft: primitiveColors.clay[200],
    editorialAccent: primitiveColors.clay[400],
  },
} as const;

const fontFamily = {
  base: "System",
  display: "System",
  mono: "monospace",
} as const;

const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

const typographyScale = {
  display: {
    lg: { fontSize: 40, lineHeight: 44, fontWeight: fontWeight.bold },
    md: { fontSize: 32, lineHeight: 36, fontWeight: fontWeight.bold },
  },
  title: {
    xl: { fontSize: 28, lineHeight: 32, fontWeight: fontWeight.bold },
    lg: { fontSize: 24, lineHeight: 30, fontWeight: fontWeight.bold },
    md: { fontSize: 20, lineHeight: 26, fontWeight: fontWeight.semibold },
  },
  body: {
    lg: { fontSize: 18, lineHeight: 28, fontWeight: fontWeight.regular },
    md: { fontSize: 16, lineHeight: 24, fontWeight: fontWeight.regular },
    sm: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.regular },
  },
  label: {
    lg: { fontSize: 16, lineHeight: 20, fontWeight: fontWeight.medium },
    md: { fontSize: 14, lineHeight: 18, fontWeight: fontWeight.medium },
  },
  caption: {
    md: { fontSize: 12, lineHeight: 16, fontWeight: fontWeight.medium },
  },
} as const;

const space = {
  "2xs": 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
  "4xl": 64,
} as const;

const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

const elevation = {
  none: {
    shadowColor: primitiveColors.ink[900],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: primitiveColors.ink[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: primitiveColors.ink[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: primitiveColors.ink[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

const motion = {
  fast: 120,
  normal: 180,
  slow: 260,
  emphasized: 320,
} as const;

export const tokens = {
  color: {
    primitive: primitiveColors,
    semantic: semanticColors,
  },
  typography: {
    family: fontFamily,
    weight: fontWeight,
    scale: typographyScale,

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
    primary: semanticColors.brand.primary,
    background: semanticColors.surface.base,
    textPrimary: semanticColors.text.primary,
    error: semanticColors.feedback.error,
    surface: semanticColors.surface.elevated,
  },
  spacing: {
    xs: space["2xs"],
    sm: space.xs,
    md: space.sm,
    lg: space.md,
    xl: space.lg,
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
