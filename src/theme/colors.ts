/**
 * YuktiOne brand palette — teal, lavender, cream, navy.
 * Teal #36877F and navy #142B4D are the official brand colours.
 * (Key names kept as "eucalyptus" so existing screens keep compiling.)
 */
export const colors = {
  brand: {
    eucalyptus: '#36877F',
    eucalyptusDark: '#2B6D66',
    eucalyptusSoft: '#E8F3F1',
    lavender: '#8B7BB8',
    lavenderSoft: '#EFEBF8',
    cream: '#F8F5F0',
    creamDark: '#EFE9E0',
    navy: '#142B4D',
    navyMuted: '#4A5A70',
  },
  text: {
    primary: '#142B4D',
    secondary: '#4A5A70',
    muted: '#7A8794',
    inverse: '#FFFFFF',
    link: '#36877F',
  },
  background: {
    canvas: '#F8F5F0',
    surface: '#FFFFFF',
    muted: '#EFE9E0',
    overlay: 'rgba(20, 43, 77, 0.45)',
  },
  border: {
    subtle: '#E6E0D6',
    default: '#D9D2C7',
    focus: '#36877F',
  },
  status: {
    success: '#36877F',
    warning: '#C48A3A',
    error: '#C45C5C',
    info: '#5B6FA8',
    pending: '#8B7BB8',
  },
  interactive: {
    primary: '#36877F',
    primaryPressed: '#2B6D66',
    secondary: '#8B7BB8',
    secondaryPressed: '#7463A3',
    disabled: '#C8CFD6',
  },
} as const;

export type Colors = typeof colors;
