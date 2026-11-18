import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionTitle } from '@/features/customer/ui';
import { customer, customerFonts } from '@/theme';

export function SearchEntry() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Search experts, tools and programmes"
      accessibilityHint="Opens search"
      onPress={() => router.push('/search')}
      style={({ pressed }) => [styles.search, pressed && styles.searchPressed]}
    >
      <Ionicons name="search-outline" size={20} color={customer.teal} />
      <Text style={styles.searchPlaceholder} numberOfLines={1}>
        Search experts, tools and programmes
      </Text>
    </Pressable>
  );
}

export function PillButton({
  label,
  onPress,
  tone,
  icon,
  grow,
}: {
  label: string;
  onPress: () => void;
  tone: 'teal' | 'light';
  icon?: keyof typeof Ionicons.glyphMap;
  grow?: boolean;
}) {
  const teal = tone === 'teal';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        teal ? styles.pillTeal : styles.pillLight,
        grow && styles.pillGrow,
        pressed && (teal ? styles.pillTealPressed : styles.pillLightPressed),
      ]}
    >
      <Text style={[styles.pillText, !teal && styles.pillTextDark]} numberOfLines={1}>
        {label}
      </Text>
      {icon ? <Ionicons name={icon} size={16} color={teal ? customer.white : customer.navy} /> : null}
    </Pressable>
  );
}

export function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} action={action} onAction={onAction} />
      {children}
    </View>
  );
}

export function SectionNotice({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{text}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={styles.noticeAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  pillGrow: { flex: 1, alignSelf: 'auto', paddingHorizontal: 12 },
  pillTeal: { backgroundColor: customer.teal },
  pillTealPressed: { backgroundColor: customer.tealDark },
  pillLight: { backgroundColor: customer.white },
  pillLightPressed: { backgroundColor: customer.cream },
  pillText: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.white },
  pillTextDark: { color: customer.navy },

  search: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchPressed: { borderColor: customer.teal },
  searchPlaceholder: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customer.muted,
  },

  section: { gap: 12, marginTop: 10 },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  noticeText: { flex: 1, fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: customer.body },
  noticeAction: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.teal },
});
