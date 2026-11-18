import { brand } from './brand';

/**
 * App-wide semantic colours, mapped onto the YuktiOne website palette (brand.ts).
 * Legacy key names under `brand` (eucalyptus, lavender, cream, navy) are kept so
 * existing screens compile; they now resolve to plum / lilac / pearl / ink.
 */
export const colors = {
  brand: {
    plum: brand.plum,
    plumDark: brand.plumDark,
    plumSoft: brand.plumSoft,
    magenta: brand.magenta,
    magentaSoft: brand.magentaSoft,
    copper: brand.copper,
    eucalyptus: brand.plum,
    eucalyptusDark: brand.plumDark,
    eucalyptusSoft: brand.plumSoft,
    lavender: '#9C5FB0',
    lavenderSoft: brand.lilacSoft,
    cream: brand.pearl,
    creamDark: brand.pearlDeep,
    navy: brand.ink,
    navyMuted: brand.grey,
  },
  text: {
    primary: brand.ink,
    secondary: '#4A4A57',
    muted: brand.grey,
    inverse: brand.white,
    link: brand.plum,
  },
  background: {
    canvas: brand.pearl,
    surface: brand.white,
    muted: brand.pearlDeep,
    overlay: 'rgba(31, 31, 31, 0.45)',
  },
  border: {
    subtle: '#EDE3E8',
    default: brand.silver,
    focus: brand.plum,
  },
  status: {
    success: '#2E8A5E',
    warning: '#B87333',
    error: '#C4314B',
    info: brand.plum,
    pending: '#9C5FB0',
  },
  interactive: {
    primary: brand.plum,
    primaryPressed: brand.magenta,
    secondary: brand.magenta,
    secondaryPressed: brand.plumDark,
    disabled: '#D9CBD2',
  },
} as const;

export type Colors = typeof colors;
