import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, PressableScale } from '@/components/motion';
import { EXPERT_CATEGORIES } from '@/features/experts/expertCategories';
import {
  EXPERT_FILTER_CHIPS,
  MENTAL_WELLBEING_EXPERTS,
  type PreviewExpert,
} from '@/features/experts/previewExperts';
import {
  colors,
  fontFamilies,
  motion,
  radius,
  shadows,
  spacing,
} from '@/theme';

/**
 * Screen 24 — Mental Wellbeing Experts list (PNG Screen_24).
 * Other categories reuse the same layout with empty/short preview until assets arrive.
 */
export function ExpertsListScreen({ categoryId }: { categoryId: string }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<(typeof EXPERT_FILTER_CHIPS)[number]>('All');

  const category = EXPERT_CATEGORIES.find((item) => item.id === categoryId);
  const title = category
    ? `${category.title} Experts`
    : 'Experts';

  const experts = useMemo(() => {
    const source =
      categoryId === 'mental-wellbeing' ? MENTAL_WELLBEING_EXPERTS : [];
    const q = query.trim().toLowerCase();
    return source.filter((expert) => {
      const matchesChip =
        chip === 'All' || expert.tags.includes(chip) || expert.specialties.includes(chip);
      if (!matchesChip) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        expert.name,
        expert.title,
        ...expert.specialties,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [categoryId, chip, query]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            scaleTo={motion.press.in}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/classic/experts');
            }}
            style={styles.backHit}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </PressableScale>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <FadeInView style={styles.hero}>
          <Text style={styles.heroText}>
            Get expert support for your mental wellbeing
          </Text>
          <View style={styles.heroArt}>
            <Ionicons name="heart-outline" size={32} color={colors.brand.lavender} />
          </View>
        </FadeInView>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Ionicons name="search" size={18} color={colors.text.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search experts (e.g. anxiety, stress)"
              placeholderTextColor={colors.text.muted}
              style={styles.searchInput}
              accessibilityLabel="Search experts"
            />
          </View>
          <Pressable style={styles.filtersBtn} accessibilityRole="button">
            <Ionicons name="options-outline" size={16} color={colors.brand.lavender} />
            <Text style={styles.filtersLabel}>Filters</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {EXPERT_FILTER_CHIPS.map((item) => {
            const active = item === chip;
            return (
              <Pressable
                key={item}
                onPress={() => setChip(item)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {experts.length === 0 ? (
            <Text style={styles.empty}>
              No preview experts for this category yet. Mental Wellbeing has the
              Screen 24 sample list.
            </Text>
          ) : (
            experts.map((expert, index) => (
              <FadeInView key={expert.id} delayMs={25 * index}>
                <ExpertCard expert={expert} />
              </FadeInView>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ExpertCard({ expert }: { expert: PreviewExpert }) {
  const initials = expert.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('');

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardMain}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{expert.name}</Text>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.brand.eucalyptus}
            />
          </View>
          <Text style={styles.role}>{expert.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#C9A227" />
            <Text style={styles.metaText}>
              {expert.rating.toFixed(1)} ({expert.reviews})
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="school-outline" size={14} color={colors.text.muted} />
            <Text style={styles.metaText}>{expert.experience}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="pricetag-outline" size={14} color={colors.text.muted} />
            <Text style={styles.metaText}>{expert.specialties.join(', ')}</Text>
          </View>
        </View>
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Book session with ${expert.name}`}
        scaleTo={motion.press.in}
        onPress={() => undefined}
        style={styles.bookBtn}
      >
        <Ionicons name="calendar-outline" size={16} color={colors.brand.lavender} />
        <Text style={styles.bookLabel}>Book Session</Text>
      </PressableScale>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  backHit: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamilies.brandSerif,
    fontSize: 22,
    color: colors.text.primary,
  },
  hero: {
    borderRadius: radius.xl,
    backgroundColor: colors.brand.lavenderSoft,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
    fontFamily: fontFamilies.brandSerif,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text.primary,
  },
  heroArt: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchField: {
    flex: 1,
    minHeight: 46,
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
    fontSize: 13,
    color: colors.text.primary,
    minHeight: 46,
  },
  filtersBtn: {
    minHeight: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.lavenderSoft,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filtersLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.lavender,
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.brand.eucalyptus,
    borderColor: colors.brand.eucalyptus,
  },
  chipText: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.primary,
  },
  chipTextActive: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
  empty: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.eucalyptusSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.eucalyptus,
  },
  cardMain: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  role: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
  },
  bookBtn: {
    alignSelf: 'flex-end',
    minHeight: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.lavenderSoft,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bookLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.lavender,
  },
});
