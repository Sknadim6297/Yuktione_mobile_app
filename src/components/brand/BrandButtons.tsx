import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BrandGradient } from '@/components/brand/BrandGradient';
import { brand, brandGradients, customerFonts, shadows } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
};

/** Website primary CTA — plum gradient pill (.yk-hero__btn--primary / .y1-btn). */
export function PrimaryButton({
  label,
  onPress,
  icon,
  iconPosition = 'start',
  disabled,
  loading,
  compact,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;
  const iconNode = icon ? <Ionicons name={icon} size={18} color={brand.white} /> : null;
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        !inactive && shadows.brand,
        pressed && !inactive && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      <BrandGradient colors={brandGradients.button} angle={90} style={styles.fill} />
      {loading ? (
        <ActivityIndicator color={brand.white} />
      ) : (
        <View style={styles.row}>
          {iconPosition === 'start' ? iconNode : null}
          <Text style={[styles.primaryText, compact && styles.compactText]} numberOfLines={1}>
            {label}
          </Text>
          {iconPosition === 'end' ? iconNode : null}
        </View>
      )}
    </Pressable>
  );
}

/** Website secondary CTA — white pill with plum outline (.y1-btn--secondary). */
export function SecondaryButton({
  label,
  onPress,
  icon,
  iconPosition = 'start',
  disabled,
  loading,
  compact,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;
  const iconNode = icon ? <Ionicons name={icon} size={18} color={brand.plum} /> : null;
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles.secondary,
        compact && styles.compact,
        pressed && !inactive && styles.secondaryPressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={brand.plum} />
      ) : (
        <View style={styles.row}>
          {iconPosition === 'start' ? iconNode : null}
          <Text style={[styles.secondaryText, compact && styles.compactText]} numberOfLines={1}>
            {label}
          </Text>
          {iconPosition === 'end' ? iconNode : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    overflow: 'hidden',
    backgroundColor: brand.plum,
  },
  fill: { borderRadius: 999 },
  compact: { minHeight: 42, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  inactive: { opacity: 0.55 },
  primaryText: { color: brand.white, fontFamily: customerFonts.bold, fontSize: 16, letterSpacing: 0.1 },
  compactText: { fontSize: 14 },
  secondary: {
    backgroundColor: brand.white,
    borderWidth: 1.5,
    borderColor: brand.plum,
  },
  secondaryPressed: { backgroundColor: brand.plumSoft, borderColor: brand.magenta },
  secondaryText: { color: brand.plum, fontFamily: customerFonts.bold, fontSize: 15 },
});
