import {
  ActivityIndicator,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PressableScale } from '@/components/motion';
import { colors, motion, radius, spacing, typography } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={isDisabled}
      scaleTo={motion.press.in}
      onPress={onPress}
      testID={testID}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? colors.brand.eucalyptus : colors.text.inverse}
        />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]}>{title}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    ...typography.button,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.interactive.primary,
  },
  secondary: {
    backgroundColor: colors.interactive.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: colors.text.inverse,
  },
  secondary: {
    color: colors.text.inverse,
  },
  ghost: {
    color: colors.text.primary,
  },
});
