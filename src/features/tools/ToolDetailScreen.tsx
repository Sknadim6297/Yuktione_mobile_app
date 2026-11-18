import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, PressableScale } from '@/components/motion';
import type { PreviewTool } from '@/features/tools/toolCatalog';
import {
  getToolDetailContent,
  type ToolFeature,
} from '@/features/tools/toolDetailContent';
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
  peach: '#F7EBDD',
} as const;

const TONE_FG = {
  green: colors.brand.eucalyptus,
  lavender: colors.brand.lavender,
  peach: colors.status.warning,
} as const;

type Props = {
  tool: PreviewTool;
};

/**
 * Tool detail — Screens 16 (Mood Board), 17 (Guided Questions), 20 (Daily Reset).
 */
export function ToolDetailScreen({ tool }: Props) {
  const insets = useSafeAreaInsets();
  const detail = getToolDetailContent(tool);
  const paid = tool.access === 'paid';

  if (!detail) {
    return null;
  }

  const onCta = () => {
    if (detail.nextHref) {
      router.push(detail.nextHref as Href);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
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
              router.replace('/(tabs)/tools');
            }}
            style={styles.backHit}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </PressableScale>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tool.title}
          </Text>
          <View style={[styles.accessBadge, paid ? styles.badgePaid : styles.badgeFree]}>
            <Text style={[styles.accessText, paid && styles.accessTextPaid]}>
              {paid ? 'Paid' : 'Free'}
            </Text>
          </View>
        </View>

        <FadeInView style={styles.hero}>
          <Text style={styles.heroText}>{detail.hero}</Text>
          <View style={styles.heroArt}>
            <Ionicons
              name={tool.icon}
              size={40}
              color={paid ? colors.status.warning : colors.brand.lavender}
            />
          </View>
        </FadeInView>

        <FadeInView delayMs={40} style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About this tool</Text>
          <Text style={styles.aboutBody}>{detail.about}</Text>
          <View style={styles.divider} />
          <View style={styles.featureList}>
            {detail.features.map((feature) => (
              <FeatureRow key={feature.title} feature={feature} />
            ))}
          </View>
        </FadeInView>

        {paid ? (
          <View style={styles.premiumCard}>
            <View style={styles.premiumIcon}>
              <Ionicons name="diamond-outline" size={20} color={colors.status.warning} />
            </View>
            <View style={styles.premiumCopy}>
              <Text style={styles.premiumTitle}>Premium Tool</Text>
              <Text style={styles.premiumBody}>
                Unlock this tool with a YuktiOne Premium plan.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.ctaBar,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={detail.cta}
          onPress={onCta}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaLabel}>{detail.cta}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text.inverse} />
        </Pressable>
      </View>
    </View>
  );
}

function FeatureRow({ feature }: { feature: ToolFeature }) {
  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.featureIcon,
          { backgroundColor: TONE_BG[feature.tone] },
        ]}
      >
        <Ionicons
          name={feature.icon}
          size={20}
          color={TONE_FG[feature.tone]}
        />
      </View>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
      </View>
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
    textAlign: 'center',
  },
  accessBadge: {
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
  accessText: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.eucalyptus,
  },
  accessTextPaid: {
    color: colors.status.warning,
  },
  hero: {
    borderRadius: radius.xl,
    backgroundColor: colors.brand.lavenderSoft,
    padding: spacing.xl,
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
    fontFamily: fontFamilies.brandSerif,
    fontSize: 22,
    lineHeight: 30,
    color: colors.text.primary,
  },
  heroArt: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.md,
    ...shadows.sm,
  },
  aboutTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  aboutBody: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  featureList: {
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  featureSubtitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.secondary,
  },
  premiumCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: '#FBF3EA',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EBD8C4',
  },
  premiumIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7EBDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCopy: {
    flex: 1,
    gap: 2,
  },
  premiumTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  premiumBody: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.secondary,
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    backgroundColor: colors.background.canvas,
  },
  ctaButton: {
    minHeight: 54,
    borderRadius: radius.full,
    backgroundColor: colors.brand.eucalyptus,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});
