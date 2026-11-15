import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppleIcon } from '@/features/auth/icons/AppleIcon';
import { GoogleIcon } from '@/features/auth/icons/GoogleIcon';
import { colors, motion, radius, shadows, spacing, typography } from '@/theme';

type Provider = 'google' | 'apple';

type SocialAuthButtonProps = {
  provider: Provider;
  onPress: () => void;
  disabled?: boolean;
};

export function SocialAuthButton({
  provider,
  onPress,
  disabled = true,
}: SocialAuthButtonProps) {
  const isGoogle = provider === 'google';
  const label = isGoogle ? 'Continue with Google' : 'Continue with Apple';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={
        disabled ? `${label} — not available yet` : label
      }
      accessibilityHint={
        disabled
          ? 'Social sign-in is not configured for this build'
          : undefined
      }
      disabled={disabled}
      scaleTo={motion.press.in}
      onPress={onPress}
      style={[styles.btn, disabled && styles.disabled]}
    >
      <View style={[styles.iconWrap, disabled && styles.iconMuted]}>
        {isGoogle ? <GoogleIcon size={22} /> : <AppleIcon size={22} />}
      </View>
      <View style={styles.labelCol}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
        {disabled ? (
          <Text style={styles.unavailable}>Coming soon</Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 54,
    borderRadius: radius.xl,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  disabled: {
    backgroundColor: colors.background.muted,
    borderColor: colors.border.subtle,
    opacity: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMuted: {
    opacity: 0.55,
  },
  labelCol: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyStrong,
    color: colors.text.primary,
    fontSize: 16,
  },
  labelDisabled: {
    color: colors.text.secondary,
  },
  unavailable: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 1,
  },
});
