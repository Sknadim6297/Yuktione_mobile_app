import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { APP_CONFIG } from '@/constants';
import { openTourScreen, SCREEN_TOUR } from '@/features/preview/screenTour';
import { unlockUiPreview } from '@/features/preview/uiPreviewSession';
import { colors, radius, shadows, spacing, typography } from '@/theme';

/** Frontend-only hub — jump into the screen tour. */
export default function WelcomeScreen() {
  unlockUiPreview();

  return (
    <Screen scroll contentStyle={styles.screenContent}>
      <View style={styles.heroOrb} />
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>{APP_CONFIG.appName}</Text>
        <Text style={styles.tagline}>
          Frontend screen tour — browse every built UI one by one.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend paused</Text>
        <Text style={styles.cardBody}>
          APIs, website handoff, and unavailable alerts are turned off for now
          so you can review layouts only.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Open screen list"
          onPress={() => router.push('/gallery')}
        />
        <Button
          title="Start from Splash"
          variant="secondary"
          onPress={() => {
            const first = SCREEN_TOUR[0];
            if (first) {
              openTourScreen(first);
              router.push(first.href);
            }
          }}
        />
        <Button
          title="Jump to Home"
          variant="ghost"
          onPress={() => router.push('/(tabs)/home')}
        />
        <Button
          title="Previous UI surfaces"
          variant="ghost"
          onPress={() => router.push('/classic/home')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'space-between',
    gap: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  heroOrb: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: radius.full,
    backgroundColor: colors.brand.lavenderSoft,
  },
  brandBlock: {
    gap: spacing.md,
    marginTop: spacing.xxxl,
  },
  brand: {
    ...typography.display,
    color: colors.brand.navy,
  },
  tagline: {
    ...typography.body,
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  cardBody: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
});
