import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/theme';

const ITEMS = [
  { key: 'home', label: 'Home', icon: 'home-outline' as const, active: true },
  { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' as const, active: false },
  { key: 'clients', label: 'Clients', icon: 'people-outline' as const, active: false },
  { key: 'profile', label: 'Profile', icon: 'person-outline' as const, active: false },
];

/** Visual shell only — destinations require authenticated accepted professionals + APIs. */
export function BottomNav() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {ITEMS.map((item) => (
        <View key={item.key} style={styles.item}>
          <Ionicons
            name={item.icon}
            size={22}
            color={item.active ? colors.brand.eucalyptus : colors.text.muted}
          />
          <Text style={[styles.label, item.active && styles.labelActive]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 11,
  },
  labelActive: {
    color: colors.brand.eucalyptus,
    fontWeight: '600',
  },
});
