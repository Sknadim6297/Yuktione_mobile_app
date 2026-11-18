import { TextStyle } from 'react-native';

/**
 * Typography matches the website: DM Sans for headings and body
 * (public_html/resources/css/tazen.css → --font-display: "DM Sans").
 * Weights are carried by the font file so Android does not synthesise bold.
 */
export const fontFamilies = {
  /** Display / heading face (website h1 weight 700–750). */
  brandSerif: 'DMSans_700Bold' as TextStyle['fontFamily'],
  brandSerifRegular: 'DMSans_500Medium' as TextStyle['fontFamily'],
  bodySans: 'DMSans_400Regular' as TextStyle['fontFamily'],
  regular: 'DMSans_400Regular' as TextStyle['fontFamily'],
  medium: 'DMSans_500Medium' as TextStyle['fontFamily'],
  semibold: 'DMSans_600SemiBold' as TextStyle['fontFamily'],
  bold: 'DMSans_700Bold' as TextStyle['fontFamily'],
  extraBold: 'DMSans_800ExtraBold' as TextStyle['fontFamily'],
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
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.display,
    lineHeight: Math.round(fontSizes.display * lineHeights.tight),
    letterSpacing: -0.8,
  },
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxl,
    lineHeight: Math.round(fontSizes.xxl * lineHeights.tight),
    letterSpacing: -0.6,
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl,
    lineHeight: Math.round(fontSizes.xl * lineHeights.snug),
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.lg,
    lineHeight: Math.round(fontSizes.lg * lineHeights.snug),
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    lineHeight: Math.round(fontSizes.md * lineHeights.normal),
  },
  bodyStrong: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.md,
    lineHeight: Math.round(fontSizes.md * lineHeights.normal),
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    lineHeight: Math.round(fontSizes.sm * lineHeights.normal),
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.sm,
    lineHeight: Math.round(fontSizes.sm * lineHeights.snug),
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
    lineHeight: Math.round(fontSizes.md * lineHeights.tight),
    letterSpacing: 0.1,
  },
} as const;

export type Typography = typeof typography;
