import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { FormErrorMessage } from '@/components/ui/FormErrorMessage';
import { ShakeView } from '@/components/motion';
import { colors, motion, radius, spacing, typography } from '@/theme';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label,
  error,
  containerStyle,
  style,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, {
      duration: motion.duration.fast,
    });
  }, [focused, focusProgress]);

  const borderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        error ? colors.status.error : colors.border.subtle,
        error ? colors.status.error : colors.border.focus,
      ],
    );
    return { borderColor };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <ShakeView trigger={error}>
        <AnimatedView
          style={[
            styles.inputShell,
            borderStyle,
            error ? styles.inputError : null,
            !editable ? styles.inputDisabled : null,
          ]}
        >
          <TextInput
            placeholderTextColor={colors.text.muted}
            editable={editable}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[styles.input, style]}
            {...rest}
            accessibilityLabel={rest.accessibilityLabel ?? label}
          />
        </AnimatedView>
      </ShakeView>
      <FormErrorMessage message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
  },
  inputShell: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    ...typography.body,
  },
  inputError: {
    backgroundColor: colors.background.surface,
  },
  inputDisabled: {
    backgroundColor: colors.background.muted,
  },
});
