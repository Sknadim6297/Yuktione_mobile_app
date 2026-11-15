import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, PressableScale } from '@/components/motion';
import {
  EXPERT_CATEGORIES,
  type ExpertCategory,
} from '@/features/experts/expertCategories';
import {
  colors,
  fontFamilies,
  motion,
  radius,
  shadows,
  spacing,
} from '@/theme';

const TONE_BG = {
  green: colors.brand.eucalyptusSoft,
  lavender: colors.brand.lavenderSoft,
  peach: '#F8EFE3',
  blue: '#E8EEF8',
} as const;

const TONE_FG = {
  green: colors.brand.eucalyptus,
  lavender: colors.brand.lavender,
  peach: colors.status.warning,
  blue: colors.status.info,
} as const;

/**
 * Screen 23 — Experts category picker (PNG Screen_23).
 */
export function ExpertsCategoryScreen({ showBack = false }: { showBack?: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {showBack ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              scaleTo={motion.press.in}
              onPress={() => router.back()}
              style={styles.backHit}
            >
              <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
            </PressableScale>
          ) : (
            <View style={styles.backHit} />
          )}
          <Text style={styles.headerTitle}>Experts</Text>
          <View style={styles.backHit} />
        </View>

        <FadeInView style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Talk to Trusted Experts</Text>
            <Text style={styles.heroBody}>
              Get personalized guidance from certified professionals.
            </Text>
          </View>
          <View style={styles.heroArt}>
            <Ionicons name="medkit-outline" size={34} color={colors.brand.lavender} />
          </View>
        </FadeInView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Category</Text>
          <Text style={styles.sectionSub}>Find the right expert for your needs.</Text>
        </View>

        <View style={styles.list}>
          {EXPERT_CATEGORIES.map((category, index) => (
            <FadeInView key={category.id} delayMs={30 * index}>
              <CategoryCard category={category} />
            </FadeInView>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CategoryCard({ category }: { category: ExpertCategory }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={category.title}
      scaleTo={motion.press.in}
      onPress={() => router.push(`/experts/${category.id}`)}
      style={styles.card}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: TONE_BG[category.tone] },
        ]}
      >
        <Ionicons
          name={category.icon}
          size={22}
          color={TONE_FG[category.tone]}
        />
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{category.title}</Text>
        <Text style={styles.cardBody}>{category.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
    </PressableScale>
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
    fontSize: 26,
    color: colors.text.primary,
    textAlign: 'left',
  },
  hero: {
    borderRadius: radius.xl,
    backgroundColor: colors.brand.lavenderSoft,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 20,
    lineHeight: 28,
    color: colors.text.primary,
  },
  heroBody: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  heroArt: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionSub: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.secondary,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardBody: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.secondary,
  },
});
