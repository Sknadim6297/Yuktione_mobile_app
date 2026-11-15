import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, PressableScale } from '@/components/motion';
import { MOOD_OPTIONS } from '@/features/home/moodOptions';
import {
  colors,
  fontFamilies,
  motion,
  radius,
  shadows,
  spacing,
} from '@/theme';

const BRAND_LOGO = require('../../../assets/brand/yuktione-logo-light.png');

const QUICK_ACTIONS = [
  {
    id: 'book',
    title: 'Book Consultation',
    icon: 'calendar-outline' as const,
    href: '/(tabs)/experts' as const,
  },
  {
    id: 'articles',
    title: 'Read Articles',
    icon: 'newspaper-outline' as const,
    href: '/(tabs)/explore' as const,
  },
  {
    id: 'track',
    title: 'Track Wellness',
    icon: 'pulse-outline' as const,
    href: '/(tabs)/tools' as const,
  },
  {
    id: 'progress',
    title: 'View Progress',
    icon: 'stats-chart-outline' as const,
    href: '/(tabs)/my-space' as const,
  },
];

/** Screen 07 / PNG Screen_11 — Home Mood Check. */
export function HomeMoodScreen() {
  const insets = useSafeAreaInsets();
  const [moodId, setMoodId] = useState('great');
  const [query, setQuery] = useState('');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.xxl) + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Image
            source={BRAND_LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="YuktiOne"
          />
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={8}
              style={styles.iconBtn}
              onPress={() => {
                /* Notifications API unavailable */
              }}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
              <View style={styles.badgeDot} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              onPress={() => router.push('/(tabs)/my-space')}
              style={styles.avatar}
            >
              <Ionicons name="person" size={18} color={colors.brand.eucalyptus} />
            </Pressable>
          </View>
        </View>

        <FadeInView style={styles.greetingBlock}>
          <Text style={styles.greeting} accessibilityRole="header">
            How are you feeling today?
          </Text>
        </FadeInView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodRow}
        >
          {MOOD_OPTIONS.map((mood) => {
            const selected = mood.id === moodId;
            return (
              <PressableScale
                key={mood.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Mood ${mood.label}`}
                scaleTo={motion.press.in}
                onPress={() => setMoodId(mood.id)}
                style={[styles.moodChip, selected && styles.moodChipSelected]}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>
                  {mood.label}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>

        <View style={styles.searchField}>
          <Ionicons name="search" size={18} color={colors.text.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search experts, services, articles…"
            placeholderTextColor={colors.text.muted}
            accessibilityLabel="Search"
            returnKeyType="search"
            onSubmitEditing={() => router.push('/(tabs)/explore')}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Wellness Journey</Text>
          <Pressable onPress={() => router.push('/classic/categories/mental-wellbeing')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Continue your wellness journey"
          scaleTo={motion.press.in}
          onPress={() => router.push('/classic/categories/mental-wellbeing')}
          style={styles.journeyCard}
        >
          <View style={styles.journeyCopy}>
            <Text style={styles.journeyTitle}>Continue Your Journey</Text>
            <Text style={styles.journeyBody}>
              Explore tools and guidance for a calmer, stronger you.
            </Text>
          </View>
          <View style={styles.journeyArt}>
            <Ionicons name="leaf" size={36} color={colors.brand.lavender} />
          </View>
        </PressableScale>

        <Text style={[styles.sectionTitle, styles.quickTitle]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <PressableScale
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.title}
              scaleTo={motion.press.in}
              onPress={() => router.push(action.href)}
              style={styles.actionCard}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name={action.icon} size={22} color={colors.brand.eucalyptus} />
              </View>
              <Text style={styles.actionLabel}>{action.title}</Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 140,
    height: 44,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.warning,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.eucalyptusSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBlock: {
    gap: spacing.xs,
  },
  greeting: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 26,
    lineHeight: 34,
    color: colors.text.primary,
  },
  moodRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  moodChip: {
    minWidth: 72,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    gap: 4,
  },
  moodChipSelected: {
    borderColor: colors.brand.eucalyptus,
    backgroundColor: colors.brand.eucalyptusSoft,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    color: colors.text.secondary,
  },
  moodLabelSelected: {
    color: colors.brand.eucalyptus,
    fontWeight: '700',
  },
  searchField: {
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    color: colors.text.primary,
    minHeight: 48,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 20,
    color: colors.text.primary,
  },
  seeAll: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.eucalyptus,
  },
  journeyCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.brand.lavenderSoft,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  journeyCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  journeyTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  journeyBody: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  journeyArt: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    marginTop: spacing.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '47%',
    flexGrow: 1,
    minHeight: 100,
    borderRadius: radius.lg,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.eucalyptusSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
