import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { FadeInView } from '@/components/motion';
import { colors, radius, shadows, spacing } from '@/theme';

export type AnimatedCardProps = {
  children: ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
};

/** Soft surface card with optional entrance fade. */
export function AnimatedCard({
  children,
  delayMs = 0,
  style,
}: AnimatedCardProps) {
  return (
    <FadeInView delayMs={delayMs} style={[styles.card, style]}>
      {children}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.sm,
  },
});
