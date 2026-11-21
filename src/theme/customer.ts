import { brand } from './brand';

/**
 * Customer UI tokens, mapped onto the YuktiOne website palette (see brand.ts).
 *
 * Legacy key names (teal, navy, mint, …) are kept so every screen keeps compiling.
 * Important: `customer.teal` / `customer.navy` currently resolve to plum / ink so
 * Home, Explore, Mood and Journal stay visually stable. For approved wellness teal
 * (#36877F) and navy (#142B4D) on new premium tools, use `toolPalette` instead.
 * Prefer the semantic keys (primary, ink, primarySoft, accent) in general chrome.
 */
export const customer = {
  // Semantic
  primary: brand.plum,
  primaryDark: brand.plumDark,
  primarySoft: brand.plumSoft,
  accent: brand.magenta,
  accentSoft: brand.magentaSoft,
  copper: brand.copper,
  pearl: brand.pearl,
  ink: brand.ink,
  border: brand.silver,

  // Surfaces & text (legacy names)
  canvas: brand.pearl,
  cream: brand.pearlDeep,
  white: brand.white,
  navy: brand.ink,
  body: '#3E3E4A',
  muted: brand.grey,
  teal: brand.plum,
  tealDark: brand.plumDark,
  mint: brand.plumSoft,
  mintDeep: brand.plumSoftDeep,
  lavender: brand.lilacSoft,
  lavenderInk: '#7A3E8E',
  chip: '#F7EEF2',
  line: '#EDE3E8',

  // Status
  star: '#F5B301',
  free: '#2E8A5E',
  paid: brand.magenta,
  danger: '#C4314B',
  shadow: brand.charcoal,

  // Category accent pairs (soft surface + ink), harmonised with the plum palette
  lilac: brand.lilacSoft,
  lilacInk: '#7A3E8E',
  blue: '#EEF1FB',
  blueInk: '#4A5BB5',
  peach: '#FBF0E6',
  peachInk: brand.copper,
  pink: brand.magentaSoft,
  pinkInk: brand.magenta,
  green: '#EAF6EF',
  greenInk: '#2E8A5E',
  sky: '#EAF4F8',
  skyInk: '#3A8AA5',
  gold: '#FFF6DE',
  goldInk: '#B8860B',
} as const;

/** The website sets every heading and body line in DM Sans. */
export const customerFonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;
