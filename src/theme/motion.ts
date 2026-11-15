/**
 * YuktiOne motion tokens — restrained, premium micro-interactions.
 * Prefer transform + opacity. Respect reduced-motion (see useReducedMotion).
 * Timing guidance from UI UX Pro Max: ~150–350ms microinteractions.
 */
export const motion = {
  duration: {
    instant: 100,
    fast: 160,
    normal: 240,
    slow: 320,
    entrance: 420,
  },
  /** Screen / block entrance vertical offset (px). */
  offset: {
    subtle: 8,
    soft: 12,
    medium: 16,
  },
  /** Pressable scale feedback. */
  press: {
    in: 0.97,
    deep: 0.94,
  },
  spring: {
    snappy: { damping: 18, stiffness: 280, mass: 0.7 },
    soft: { damping: 16, stiffness: 180, mass: 0.85 },
  },
  /** Expo Router / stack-friendly fade timing feel (documentation). */
  navigation: {
    fadeMs: 220,
  },
} as const;

export type Motion = typeof motion;
