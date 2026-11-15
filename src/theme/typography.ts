import { TextStyle } from 'react-native';

/**
 * Typography scale. System fonts for Phase 1;
 * custom brand fonts can be loaded via expo-font later.
 */
export const fontFamilies = {
  /** Loaded via expo-font on splash and future branded screens. */
  brandSerif: 'LibreBaskerville_700Bold' as TextStyle['fontFamily'],
  brandSerifRegular: 'LibreBaskerville_400Regular' as TextStyle['fontFamily'],
  bodySans: 'DMSans_400Regular' as TextStyle['fontFamily'],
  regular: undefined as TextStyle['fontFamily'],
  medium: undefined as TextStyle['fontFamily'],
  semibold: undefined as TextStyle['fontFamily'],
  bold: undefined as TextStyle['fontFamily'],
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const lineHeights = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const typography = {
  display: {
    fontSize: fontSizes.display,
    fontWeight: '700' as const,
    lineHeight: Math.round(fontSizes.display * lineHeights.tight),
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: fontSizes.xxl,
    fontWeight: '700' as const,
    lineHeight: Math.round(fontSizes.xxl * lineHeights.tight),
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: fontSizes.xl,
    fontWeight: '600' as const,
    lineHeight: Math.round(fontSizes.xl * lineHeights.snug),
  },
  h3: {
    fontSize: fontSizes.lg,
    fontWeight: '600' as const,
    lineHeight: Math.round(fontSizes.lg * lineHeights.snug),
  },
  body: {
    fontSize: fontSizes.md,
    fontWeight: '400' as const,
    lineHeight: Math.round(fontSizes.md * lineHeights.normal),
  },
  bodyStrong: {
    fontSize: fontSizes.md,
    fontWeight: '600' as const,
    lineHeight: Math.round(fontSizes.md * lineHeights.normal),
  },
  caption: {
    fontSize: fontSizes.sm,
    fontWeight: '400' as const,
    lineHeight: Math.round(fontSizes.sm * lineHeights.normal),
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600' as const,
    lineHeight: Math.round(fontSizes.sm * lineHeights.snug),
    letterSpacing: 0.2,
  },
  button: {
    fontSize: fontSizes.md,
    fontWeight: '600' as const,
    lineHeight: Math.round(fontSizes.md * lineHeights.tight),
    letterSpacing: 0.2,
  },
} as const;

export type Typography = typeof typography;
