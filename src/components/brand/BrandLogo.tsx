import { Image, type StyleProp, type ImageStyle } from 'react-native';

import { BRAND_ASSETS } from '@/constants/brandAssets';

/**
 * The official website logo (frontend/assets/Yuktione_logo.png), never redrawn.
 * `inverse` renders it white for plum / photo backgrounds — the same treatment
 * the website applies with `filter: brightness(0) invert(1)`.
 */
export function BrandLogo({
  width = 132,
  inverse = false,
  style,
}: {
  width?: number;
  inverse?: boolean;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={BRAND_ASSETS.logo}
      style={[{ width, height: width / 3 }, inverse && { tintColor: '#FFFFFF' }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="YuktiOne"
    />
  );
}
