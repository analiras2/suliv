import { Platform } from 'react-native';

export const colors = {
  moss50: '#F1F5EC',
  moss100: '#E1EBD6',
  moss200: '#C4D6B0',
  moss300: '#9EBB83',
  moss400: '#6F9458',
  moss500: '#4C7438',
  moss600: '#3B5B2C',
  moss700: '#2D4522',
  moss800: '#1F3017',

  sage50: '#F2F5EF',
  sage100: '#E4EADE',
  sage200: '#C8D3BF',
  sage300: '#A8B69E',
  sage500: '#7A8A72',

  sand25: '#FDFBF6',
  sand50: '#FAF6ED',
  sand100: '#F3ECDD',
  sand200: '#E9DFC8',
  sand300: '#D9CAA9',

  clay100: '#F3E4D3',
  clay200: '#E8CBA9',
  clay400: '#C79273',
  clay500: '#B4714D',
  clay600: '#8E5233',
  clay700: '#6B3C24',

  olive300: '#BFB480',
  olive500: '#8A7F46',
  olive700: '#544D28',

  ink50: '#F7F4EE',
  ink100: '#EAE5D9',
  ink200: '#D4CCBB',
  ink300: '#B0A697',
  ink500: '#6F675C',
  ink700: '#3A362F',
  ink800: '#26231E',
  ink900: '#15130F',

  success100: '#DEEAD0',
  success500: '#5E8B45',
  warning100: '#F2E2BE',
  warning500: '#C58A3A',
  danger100: '#F1D7D3',
  danger500: '#B0524E',

  white: '#FFFFFF',
  black: '#0B0A08',
} as const;

export const semanticColors = {
  brand: colors.moss500,
  brandStrong: colors.moss700,
  brandSoft: colors.moss100,
  brandMuted: colors.moss50,
  brandOn: colors.sand25,

  accent: colors.clay500,
  accentSoft: colors.clay100,
  accentStrong: colors.clay700,

  bg: colors.sand50,
  bgSubtle: colors.sand100,
  surface: colors.sand25,
  surfaceRaised: colors.white,
  surfaceInverse: colors.ink900,
  surfaceTint: colors.moss50,
  surfaceWarm: colors.clay100,

  fg: colors.ink900,
  fgSecondary: colors.ink500,
  fgTertiary: colors.ink300,
  fgInverse: colors.sand25,
  fgBrand: colors.moss700,
  fgAccent: colors.clay700,
  fgDisabled: colors.ink300,

  border: colors.ink200,
  borderStrong: colors.ink500,
  borderBrand: colors.moss300,

  success: colors.success500,
  successSoft: colors.success100,
  warning: colors.warning500,
  warningSoft: colors.warning100,
  danger: colors.danger500,
  dangerSoft: colors.danger100,

  favorite: colors.clay600,
  favoriteSoft: colors.clay200,
  overlayScrim: 'rgba(21, 19, 15, 0.48)',
  overlaySoft: 'rgba(21, 19, 15, 0.14)',
  tabBarTranslucent: 'rgba(253, 251, 246, 0.92)',
} as const;

export const fontFamilies = Platform.select({
  ios: {
    display: 'Fraunces_500Medium',
    displayItalic: 'Fraunces_400Regular_Italic',
    editorial: 'InstrumentSerif_400Regular_Italic',
    sans: 'InterTight_400Regular',
    sansMedium: 'InterTight_500Medium',
    sansSemibold: 'InterTight_600SemiBold',
  },
  default: {
    display: 'Fraunces_500Medium',
    displayItalic: 'Fraunces_400Regular_Italic',
    editorial: 'InstrumentSerif_400Regular_Italic',
    sans: 'InterTight_400Regular',
    sansMedium: 'InterTight_500Medium',
    sansSemibold: 'InterTight_600SemiBold',
  },
})!;

export const typography = {
  displayXl: { fontSize: 48, lineHeight: 50, letterSpacing: -0.4 },
  displayLg: { fontSize: 40, lineHeight: 44, letterSpacing: -0.4 },
  displayMd: { fontSize: 32, lineHeight: 36, letterSpacing: -0.3 },
  displaySm: { fontSize: 30, lineHeight: 33, letterSpacing: -0.3 },
  displayXs: { fontSize: 22, lineHeight: 25, letterSpacing: -0.2 },

  titleXl: { fontSize: 28, lineHeight: 32, letterSpacing: -0.2 },
  titleLg: { fontSize: 24, lineHeight: 30, letterSpacing: -0.15 },
  titleMd: { fontSize: 20, lineHeight: 26, letterSpacing: -0.1 },

  bodyLg: { fontSize: 18, lineHeight: 28 },
  bodyMd: { fontSize: 16, lineHeight: 24 },
  bodySm: { fontSize: 14, lineHeight: 20 },

  labelLg: { fontSize: 15, lineHeight: 19 },
  labelMd: { fontSize: 13, lineHeight: 16, letterSpacing: 0.05 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: { fontSize: 11, lineHeight: 13, letterSpacing: 1.5 },
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  xxxxl: 64,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  pill: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.ink700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.ink700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.ink700,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export const motion = {
  durationFast: 120,
  durationNormal: 180,
  durationSlow: 260,
  durationEmphasized: 320,
  pressScale: 0.98,
} as const;

export const layout = {
  tabBarClearance: 110,
} as const;

export const recipeGradients = {
  clay: [colors.clay400, colors.clay600] as const,
  moss: [colors.moss300, colors.moss500] as const,
  sand: [colors.clay200, colors.clay500] as const,
  olive: [colors.olive300, colors.olive700] as const,
  peach: [colors.clay100, colors.clay400] as const,
  brick: [colors.clay200, colors.danger500] as const,
  heroMoss: [colors.moss500, colors.moss800] as const,
};
