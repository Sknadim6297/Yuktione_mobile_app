import { brand } from './brand';

/**
 * Palette for premium psychology tools (Mood/Journal historically used plum via
 * `customer.teal`). New tool screens should import this so teal/navy are accurate
 * without recoloring Home, Explore, or already-shipped Mood/Journal chrome.
 */
export const toolPalette = {
  teal: brand.wellnessTeal,
  tealDark: brand.wellnessTealDark,
  mint: brand.wellnessTealSoft,
  mintDeep: brand.wellnessTealSoftDeep,
  navy: brand.wellnessNavy,
  cream: brand.wellnessCream,
  lavender: brand.wellnessLavender,
  lavenderInk: brand.wellnessLavenderInk,
  white: brand.white,
  body: '#3E4A52',
  muted: '#6B7A82',
  line: '#E2E8E6',
  danger: '#C4314B',
  shadow: brand.charcoal,
} as const;

export type ToolPalette = typeof toolPalette;
