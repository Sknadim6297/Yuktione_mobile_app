import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/motion';
import type { AuthRole } from '@/features/auth/types';
import { colors, motion, radius, shadows, spacing, typography } from '@/theme';

type RoleSelectorProps = {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
};

const OPTIONS: {
  role: AuthRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { role: 'customer', label: "I'm a Customer", icon: 'person-outline' },
  { role: 'professional', label: "I'm a Professional", icon: 'briefcase-outline' },
];

function RoleChip({
  selected,
  label,
  icon,
  onPress,
}: {
  selected: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: motion.duration.normal,
    });
  }, [progress, selected]);

  const selectedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border.subtle, colors.brand.eucalyptus],
    ),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.background.surface, colors.brand.eucalyptusSoft],
    ),
  }));

  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      scaleTo={motion.press.in}
      onPress={onPress}
      style={styles.chipPress}
    >
      <Animated.View style={[styles.chip, selectedStyle]}>
        <Ionicons
          name={icon}
          size={18}
          color={selected ? colors.brand.eucalyptus : colors.text.secondary}
        />
        <Text
          style={[styles.label, selected && styles.labelSelected]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {label}
        </Text>
        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
          </View>
        ) : (
          <View style={styles.checkSpacer} />
        )}
      </Animated.View>
    </PressableScale>
  );
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((option) => (
        <RoleChip
          key={option.role}
          selected={option.role === value}
          label={option.label}
          icon={option.icon}
          onPress={() => onChange(option.role)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipPress: {
    flex: 1,
  },
  chip: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  label: {
    ...typography.caption,
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.brand.eucalyptusDark,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.eucalyptus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSpacer: {
    width: 20,
    height: 20,
  },
});
