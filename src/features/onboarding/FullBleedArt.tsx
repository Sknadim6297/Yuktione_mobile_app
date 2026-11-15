import { Image, StyleSheet, useWindowDimensions, type ImageSourcePropType } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  label?: string;
};

/**
 * Full-screen hero art used by splash + every onboarding step.
 * Anchored to the bottom so sky stays clear for logo/headlines.
 */
export function FullBleedArt({ source, label = 'Background illustration' }: Props) {
  const { width, height } = useWindowDimensions();

  return (
    <Image
      source={source}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        width,
        height: Math.round(height * 1.08),
      }}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
      accessibilityLabel={label}
    />
  );
}

export const HERO_ART = require('../../../assets/illustrations/onboarding-01.jpg');

export const fullBleedRoot = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
}).root;
