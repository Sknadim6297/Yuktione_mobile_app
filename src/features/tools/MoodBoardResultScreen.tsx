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
  colors,
  fontFamilies,
  motion,
  radius,
  shadows,
  spacing,
} from '@/theme';

const COLLAGE = [
  { id: 'mountains', label: 'Mountains', color: '#C9B8E8' },
  { id: 'coffee', label: 'Coffee', color: '#E8D5C4' },
  { id: 'leaves', label: 'Leaves', color: '#C9DCC8' },
  { id: 'meditate', label: 'Meditate', color: '#D4C4E8' },
];

/**
 * Screen 21 — Mood Board Result (PNG Screen_21).
 * Collage uses colored preview tiles until photo assets are supplied.
 */
export function MoodBoardResultScreen() {
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
              router.replace('/tools/mood-board');
            }}
            style={styles.backHit}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </PressableScale>
          <Text style={styles.headerTitle}>Mood Board Result</Text>
          <View style={styles.headerSpacer} />
        </View>

        <FadeInView style={styles.board}>
          <View style={styles.grid}>
            {COLLAGE.map((tile) => (
              <View
                key={tile.id}
                style={[styles.tile, { backgroundColor: tile.color }]}
              >
                <Text style={styles.tileLabel}>{tile.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.note}>
            <Text style={styles.noteText}>Calm, Focused, Positive</Text>
            <Ionicons name="heart" size={14} color={colors.brand.lavender} />
          </View>
        </FadeInView>

        <FadeInView delayMs={40} style={styles.copyBlock}>
          <Text style={styles.headline}>Your Mood Board is Ready!</Text>
          <Text style={styles.subhead}>
            A visual snapshot of how you’re feeling right now.
          </Text>
        </FadeInView>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons name="flower-outline" size={22} color={colors.brand.eucalyptus} />
          </View>
          <View style={styles.insightCopy}>
            <Text style={styles.insightTitle}>Insight</Text>
            <Text style={styles.insightBody}>
              You seem calm, balanced and positive. Keep nurturing what makes you
              feel this way.
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Edit Board"
            scaleTo={motion.press.in}
            onPress={() => router.replace('/tools/mood-board')}
            style={styles.secondaryBtn}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.text.primary} />
            <Text style={styles.secondaryLabel}>Edit Board</Text>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Share"
            scaleTo={motion.press.in}
            onPress={() => undefined}
            style={styles.shareBtn}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.text.primary} />
            <Text style={styles.secondaryLabel}>Share</Text>
          </PressableScale>
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Save to My Space"
          scaleTo={motion.press.in}
          onPress={() => router.push('/(tabs)/my-space')}
          style={styles.primaryBtn}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
          <Text style={styles.primaryLabel}>Save to My Space</Text>
        </PressableScale>
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
    fontSize: 20,
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  board: {
    backgroundColor: colors.brand.lavenderSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 88,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  note: {
    alignSelf: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    transform: [{ rotate: '-2deg' }],
    ...shadows.sm,
  },
  noteText: {
    fontFamily: fontFamilies.brandSerifRegular,
    fontSize: 16,
    color: colors.text.primary,
  },
  copyBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  headline: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 24,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subhead: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.brand.eucalyptusSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCopy: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  insightBody: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  shareBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.lavenderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  primaryBtn: {
    minHeight: 54,
    borderRadius: radius.full,
    backgroundColor: colors.brand.eucalyptus,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});
