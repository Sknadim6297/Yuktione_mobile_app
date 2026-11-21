/**
 * YuktiOne website brand tokens — single source of truth for the app.
 * Mirrors public_html/public/frontend/assets/css/yuktione-brand.css (:root --y1-*)
 * and the hero / auth gradients in yuktione-hero.css and login/register.blade.php.
 */
export const brand = {
  plum: '#8A0F4D',
  plumDark: '#6E0B3C',
  plumDeep: '#5A0932',
  magenta: '#C3196B',
  pearl: '#FFF8FB',
  pearlDeep: '#FFF1F6',
  silver: '#D9D9DE',
  divider: '#EFE7EC',
  lilac: '#D8B4E2',
  copper: '#B87333',
  charcoal: '#1F1F1F',
  ink: '#1A1A22',
  grey: '#6B6B7A',
  white: '#FFFFFF',
  plumSoft: '#F8EAF1',
  plumSoftDeep: '#F0D4E2',
  magentaSoft: '#FCE8F1',
  lilacSoft: '#F6EEF9',
  /** Website hero section cream (yk-hero--soft). */
  heroCream: '#F8F3F1',
  heroPearl: '#F5F1EB',
  /** Accent underline used under highlighted words on the website. */
  underline: '#F4A0C6',

  /**
   * Wellness / psychology-tool accents (approved for premium native tools).
   * Kept separate from plum customer chrome so Home/Explore stay brand-plum.
   */
  wellnessTeal: '#36877F',
  wellnessTealDark: '#2C6E68',
  wellnessTealSoft: '#E8F3F1',
  wellnessTealSoftDeep: '#D5EBE7',
  wellnessNavy: '#142B4D',
  wellnessCream: '#F7F3EC',
  wellnessLavender: '#EDE8F6',
  wellnessLavenderInk: '#5B4B8A',
} as const;

/** Gradient stops as used on the website (CSS linear-gradient equivalents). */
export const brandGradients = {
  /** .yk-hero__btn--primary — 90deg */
  button: ['#8D1F52', '#6F143F', '#5C1035'] as const,
  /** .yk-signup__brand background — 145deg */
  panel: ['#7A0D44', '#8A0F4D', '#A0145C'] as const,
  /** .yk-signup__brand-overlay over photography — 180deg */
  photoOverlay: [
    'rgba(90, 8, 48, 0.78)',
    'rgba(122, 12, 68, 0.62)',
    'rgba(138, 15, 77, 0.42)',
    'rgba(90, 8, 48, 0.55)',
  ] as const,
  /** .yk-hero--soft page background — 180deg */
  heroSoft: ['#F8F3F1', '#F5F1EB', '#F2EDE4'] as const,
} as const;

export type BrandColor = keyof typeof brand;
