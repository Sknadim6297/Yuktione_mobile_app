import { Platform, ViewStyle } from 'react-native';

type ShadowToken = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const softShadow = (elevation: number, opacity: number): ShadowToken => ({
  shadowColor: '#142B4D',
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
  sm: softShadow(3, 0.06),
  md: softShadow(6, 0.08),
  lg: softShadow(10, 0.1),
} as const;

export type Shadows = typeof shadows;
