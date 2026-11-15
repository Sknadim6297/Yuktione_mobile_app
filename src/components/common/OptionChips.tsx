import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export type Option<T extends string = string> = {
  label: string;
  value: T;
};

export type OptionChipsProps<T extends string = string> = {
  label?: string;
  options: Option<T>[];
  value?: T;
  onChange: (value: T) => void;
  error?: string;
};

export function OptionChips<T extends string = string>({
  label,
  options,
  value,
  onChange,
  error,
}: OptionChipsProps<T>) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.brand.eucalyptus,
    borderColor: colors.brand.eucalyptus,
  },
  pressed: {
    opacity: 0.85,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.text.inverse,
  },
  error: {
    ...typography.caption,
    color: colors.status.error,
  },
});
