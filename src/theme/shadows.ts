import { Platform, ViewStyle } from 'react-native';

type ShadowToken = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/** Website: --yk-shadow-sm 0 8px 22px rgba(31,31,31,.06); hover rgba(138,15,77,.12). */
const softShadow = (elevation: number, opacity: number, color = '#1F1F1F'): ShadowToken => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: Math.max(1, Math.floor(elevation / 2)) },
  shadowOpacity: opacity,
  shadowRadius: elevation,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

/** Subtle elevation tokens — prefer soft shadows over heavy multi-layer stacks. */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies ShadowToken,
  sm: softShadow(4, 0.06),
  md: softShadow(8, 0.08),
  lg: softShadow(14, 0.1),
  /** Plum-tinted lift for primary CTAs and featured cards. */
  brand: softShadow(12, 0.22, '#5C1035'),
} as const;

export type Shadows = typeof shadows;
