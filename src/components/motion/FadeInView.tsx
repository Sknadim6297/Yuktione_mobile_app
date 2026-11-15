import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from '@/theme';

export type FadeInViewProps = {
  children: ReactNode;
  delayMs?: number;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
};

/** Soft opacity + translateY entrance. No-ops when reduce-motion is on. */
export function FadeInView({
  children,
  delayMs = 0,
  offsetY = motion.offset.soft,
  style,
}: FadeInViewProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: motion.duration.entrance,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delayMs, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: (1 - progress.value) * offsetY,
      },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
