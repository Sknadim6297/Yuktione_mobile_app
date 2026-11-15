import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import {
  openTourScreen,
  SCREEN_TOUR,
} from '@/features/preview/screenTour';
import { unlockUiPreview } from '@/features/preview/uiPreviewSession';
import { colors, fontFamilies, radius, spacing } from '@/theme';

/**
 * Frontend-only screen list — tap any row to open that UI.
 */
export default function ScreenGalleryRoute() {
  unlockUiPreview();

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={styles.kicker}>Frontend only</Text>
      <Text style={styles.title} accessibilityRole="header">
        Screen tour
      </Text>
      <Text style={styles.subtitle}>
        Browse screens one by one. No backend calls — local UI preview only.
      </Text>

      <View style={styles.list}>
        {SCREEN_TOUR.map((screen, index) => (
          <Pressable
            key={screen.id}
            accessibilityRole="button"
            accessibilityLabel={`${screen.number} ${screen.title}`}
            onPress={() => {
              openTourScreen(screen);
              router.push(screen.href);
            }}
            style={styles.row}
          >
            <Text style={styles.number}>{screen.number}</Text>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{screen.title}</Text>
              <Text style={styles.rowHref}>{String(screen.href)}</Text>
            </View>
            <Text style={styles.index}>{index + 1}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.massive,
  },
  kicker: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.eucalyptus,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 30,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
  },
  number: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.eucalyptus,
    width: 28,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  rowHref: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 11,
    color: colors.text.muted,
  },
  index: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    color: colors.text.muted,
  },
});
