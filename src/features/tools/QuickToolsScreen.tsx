import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, PressableScale } from '@/components/motion';
import { PREVIEW_TOOLS, type PreviewTool } from '@/features/tools/toolCatalog';
import {
  colors,
  fontFamilies,
  motion,
  radius,
  shadows,
  spacing,
} from '@/theme';

const BRAND_LOGO = require('../../../assets/brand/yuktione-logo-light.png');

/**
 * Screen 09 / PNG Screen_13 — Quick Tools.
 */
export function QuickToolsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.xxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Image
            source={BRAND_LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="YuktiOne"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
            <View style={styles.badgeDot} />
          </Pressable>
        </View>

        <FadeInView>
          <Text style={styles.heading} accessibilityRole="header">
            Quick Tools
          </Text>
        </FadeInView>

        <View style={styles.list}>
          {PREVIEW_TOOLS.map((tool, index) => (
            <FadeInView key={tool.id} delayMs={40 * index}>
              <ToolCard tool={tool} />
            </FadeInView>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ToolCard({ tool }: { tool: PreviewTool }) {
  const paid = tool.access === 'paid';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${tool.title}, ${tool.access}`}
      scaleTo={motion.press.in}
      onPress={() => router.push(`/tools/${tool.id}`)}
      style={styles.card}
    >
      <View style={[styles.iconWrap, paid && styles.iconWrapPaid]}>
        <Ionicons
          name={tool.icon}
          size={24}
          color={paid ? colors.status.warning : colors.brand.eucalyptus}
        />
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{tool.title}</Text>
        <Text style={styles.cardSubtitle}>{tool.subtitle}</Text>
      </View>
      <View style={[styles.badge, paid ? styles.badgePaid : styles.badgeFree]}>
        <Text style={[styles.badgeText, paid && styles.badgeTextPaid]}>
          {paid ? 'Paid' : 'Free'}
        </Text>
      </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 140,
    height: 44,
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
  heading: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text.primary,
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
    borderRadius: 24,
    backgroundColor: colors.brand.eucalyptusSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPaid: {
    backgroundColor: '#F8EFE3',
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
    backgroundColor: '#F8EFE3',
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
