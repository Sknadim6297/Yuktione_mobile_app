/**
 * YuktiOne brand palette — eucalyptus, lavender, cream, navy.
 * Aligns with the 30-screen design reference.
 */
export const colors = {
  brand: {
    eucalyptus: '#2F6F5E',
    eucalyptusDark: '#245748',
    eucalyptusSoft: '#E4F0EB',
    lavender: '#8B7BB8',
    lavenderSoft: '#EFEAF7',
    cream: '#F7F4EF',
    creamDark: '#EFE9E0',
    navy: '#1C2A3A',
    navyMuted: '#4A5A6A',
  },
  text: {
    primary: '#1C2A3A',
    secondary: '#4A5A6A',
    muted: '#7A8794',
    inverse: '#FFFFFF',
    link: '#2F6F5E',
  },
  background: {
    canvas: '#F7F4EF',
    surface: '#FFFFFF',
    muted: '#EFE9E0',
    overlay: 'rgba(28, 42, 58, 0.45)',
  },
  border: {
    subtle: '#E6E0D6',
    default: '#D9D2C7',
    focus: '#2F6F5E',
  },
  status: {
    success: '#2F6F5E',
    warning: '#C48A3A',
    error: '#C45C5C',
    info: '#5B6FA8',
    pending: '#8B7BB8',
  },
  interactive: {
    primary: '#2F6F5E',
    primaryPressed: '#245748',
    secondary: '#8B7BB8',
    secondaryPressed: '#7463A3',
    disabled: '#C8CFD6',
  },
} as const;

export type Colors = typeof colors;
