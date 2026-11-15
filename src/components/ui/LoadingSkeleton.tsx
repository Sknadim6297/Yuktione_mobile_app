import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius, spacing } from '@/theme';

export type LoadingSkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Soft pulse placeholder. Static under reduce-motion. */
export function LoadingSkeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.md,
  style,
}: LoadingSkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 900,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
        animatedStyle,
      ]}
    />
  );
}

export type SkeletonBlockProps = {
  lines?: number;
  style?: StyleProp<ViewStyle>;
};

/** Compact multi-line skeleton block for list/card placeholders. */
export function SkeletonBlock({ lines = 3, style }: SkeletonBlockProps) {
  return (
    <View style={[styles.block, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <LoadingSkeleton
          key={`sk-${index}`}
          width={index === lines - 1 ? '72%' : '100%'}
          height={index === 0 ? 20 : 14}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.muted,
  },
  block: {
    gap: spacing.sm,
    width: '100%',
  },
});
