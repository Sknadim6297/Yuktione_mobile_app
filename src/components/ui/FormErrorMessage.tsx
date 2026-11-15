import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, spacing, typography } from '@/theme';

export type FormErrorMessageProps = {
  message?: string;
  style?: StyleProp<TextStyle>;
};

/** Accessible inline error with gentle appear animation. */
export function FormErrorMessage({ message, style }: FormErrorMessageProps) {
  const reduceMotion = useReducedMotion();

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(180)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(120)}
    >
      <Text
        style={[styles.error, style]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.caption,
    color: colors.status.error,
    marginTop: spacing.xxs,
  },
});
