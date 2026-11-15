import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from '@/theme';

export type ShakeViewProps = {
  children: ReactNode;
  /**
   * When this becomes a non-empty string/number (or changes while truthy),
   * a horizontal shake plays. Prefer passing the error message directly.
   */
  trigger?: string | number | null | false;
  style?: StyleProp<ViewStyle>;
};

/** Horizontal shake for invalid form feedback. Skipped under reduce-motion. */
export function ShakeView({ children, trigger, style }: ShakeViewProps) {
  const reduceMotion = useReducedMotion();
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!trigger || reduceMotion) {
      return;
    }
    translateX.value = withSequence(
      withTiming(-6, { duration: motion.duration.instant }),
      withTiming(6, { duration: motion.duration.instant }),
      withTiming(-4, { duration: motion.duration.instant }),
      withTiming(4, { duration: motion.duration.instant }),
      withTiming(0, { duration: motion.duration.fast }),
    );
  }, [trigger, reduceMotion, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
