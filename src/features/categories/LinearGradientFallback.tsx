import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

/**
 * Soft cream→lavender block without adding expo-linear-gradient dependency.
 * Used for category hero until dedicated artwork assets are supplied.
 */
export function LinearGradientFallback({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.brand.lavenderSoft,
    overflow: 'hidden',
  },
});
