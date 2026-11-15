import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Tone = 'info' | 'warning' | 'pending' | 'error';

export type InfoBannerProps = {
  title: string;
  message?: string;
  tone?: Tone;
};

export function InfoBanner({ title, message, tone = 'info' }: InfoBannerProps) {
  return (
    <View style={[styles.base, toneStyles[tone]]}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    ...typography.label,
    color: colors.text.primary,
  },
  message: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

const toneStyles = StyleSheet.create({
  info: {
    backgroundColor: colors.brand.eucalyptusSoft,
  },
  warning: {
    backgroundColor: '#F7EBD8',
  },
  pending: {
    backgroundColor: colors.brand.lavenderSoft,
  },
  error: {
    backgroundColor: '#F8E6E6',
  },
});
