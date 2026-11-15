import { type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function setPressScale(scale: SharedValue<number>, next: number) {
  'worklet';
  scale.value = withSpring(next, motion.spring.snappy);
}

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Pressed scale. Defaults to motion.press.in */
  scaleTo?: number;
};

/** Pressable with Reanimated scale feedback (transform only). */
export function PressableScale({
  children,
  style,
  scaleTo = motion.press.in,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled && !reduceMotion) {
          setPressScale(scale, scaleTo);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!reduceMotion) {
          setPressScale(scale, 1);
        }
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
