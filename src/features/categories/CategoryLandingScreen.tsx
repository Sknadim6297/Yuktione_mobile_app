import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, PressableScale } from '@/components/motion';
import { EmptyState } from '@/components/ui';
import { LinearGradientFallback } from '@/features/categories/LinearGradientFallback';
import { PREVIEW_TOOLS } from '@/features/tools/toolCatalog';
import {
  colors,
  fontFamilies,
  motion,
  radius,
  shadows,
  spacing,
} from '@/theme';

type Segment = 'tools' | 'experts' | 'programmes';

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'tools', label: 'Tools' },
  { id: 'experts', label: 'Experts' },
  { id: 'programmes', label: 'Programmes' },
];

const CATEGORY_COPY: Record<
  string,
  { title: string; hero: string }
> = {
  'mental-wellbeing': {
    title: 'Mental Wellbeing',
    hero: 'Support for a calmer, stronger you.',
  },
};

/**
 * Screen 11 / PNG Screen_15 — Categories Landing (Mental Wellbeing).
 */
export function CategoryLandingScreen({ slug }: { slug: string }) {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('tools');
  const copy = CATEGORY_COPY[slug] ?? {
    title: slug.replace(/-/g, ' '),
    hero: 'Explore this category when catalog APIs are connected.',
  };

  const title = useMemo(
    () => copy.title.replace(/\b\w/g, (c) => c.toUpperCase()),
    [copy.title],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
            router.replace('/classic/home');
          }}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
        </PressableScale>

        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>

        <LinearGradientFallback style={styles.hero}>
          <Text style={styles.heroText}>{copy.hero}</Text>
          <View style={styles.heroArt}>
            <Ionicons name="layers-outline" size={40} color={colors.brand.lavender} />
          </View>
        </LinearGradientFallback>

        <View style={styles.segmentRow} accessibilityRole="tablist">
          {SEGMENTS.map((item) => {
            const active = item.id === segment;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setSegment(item.id)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {segment === 'tools' ? (
          <View style={styles.list}>
            {PREVIEW_TOOLS.map((tool, index) => {
              const paid = tool.access === 'paid';
              return (
                <FadeInView key={tool.id} delayMs={30 * index}>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={tool.title}
                    scaleTo={motion.press.in}
                    onPress={() => router.push(`/tools/${tool.id}`)}
                    style={styles.card}
                  >
                    <View style={[styles.iconWrap, paid && styles.iconWrapPaid]}>
                      <Ionicons
                        name={tool.icon}
                        size={22}
                        color={paid ? colors.status.warning : colors.brand.eucalyptus}
                      />
                    </View>
                    <View style={styles.cardCopy}>
                      <Text style={styles.cardTitle}>{tool.title}</Text>
                      <Text style={styles.cardSubtitle}>{tool.categorySubtitle}</Text>
                    </View>
                    <View style={[styles.badge, paid ? styles.badgePaid : styles.badgeFree]}>
                      <Text style={[styles.badgeText, paid && styles.badgeTextPaid]}>
                        {paid ? 'Paid' : 'Free'}
                      </Text>
                    </View>
                  </PressableScale>
                </FadeInView>
              );
            })}
          </View>
        ) : (
          <EmptyState
            title={
              SEGMENTS.find((s) => s.id === segment)?.label ?? 'Section'
            }
            description="Preview list for this segment will arrive with the matching screen designs."
          />
        )}
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
  backHit: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text.primary,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  heroArt: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.muted,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.background.surface,
    ...shadows.sm,
  },
  segmentLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.secondary,
  },
  segmentLabelActive: {
    color: colors.brand.eucalyptus,
    fontWeight: '700',
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
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.eucalyptusSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPaid: {
    backgroundColor: '#F7EBDD',
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
  cardSubtitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.secondary,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeFree: {
    backgroundColor: colors.brand.eucalyptusSoft,
  },
  badgePaid: {
    backgroundColor: '#F7EBDD',
  },
  badgeText: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.eucalyptus,
  },
  badgeTextPaid: {
    color: colors.status.warning,
  },
});
