import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { Screen } from '@/components/ui';
import { BottomNav } from '@/features/professional/dashboard/BottomNav';
import { DashboardTile } from '@/features/professional/dashboard/DashboardTile';
import { colors, radius, shadows, spacing, typography } from '@/theme';

/**
 * Explicitly labeled development preview.
 * Not reachable as an authenticated / accepted professional dashboard.
 */
export default function ProfessionalDashboardPreviewScreen() {
  return (
    <View style={styles.root}>
      <Screen scroll padded contentStyle={styles.content} edges={['top', 'left', 'right']}>
        <AppHeader title="Dashboard preview" subtitle="Development only" />

        <View style={styles.devBadge}>
          <Text style={styles.devBadgeText}>DEVELOPMENT PREVIEW — NOT LIVE DATA</Text>
        </View>

        <Text style={styles.greeting}>Hello, Professional</Text>
        <Text style={styles.subcopy}>
          Visual shell for Screen 30. Greeting name, stats, clients, and earnings
          stay unavailable until authenticated APIs return real values.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today at a glance</Text>
          <InfoBanner
            tone="warning"
            title="Summary unavailable"
            message="Bookings, clients, and earnings are not invented for this preview."
          />
        </View>

        <View style={styles.grid}>
          <DashboardTile
            icon="calendar-outline"
            title="Manage Availability"
            subtitle="Unavailable without API"
          />
          <DashboardTile
            icon="people-outline"
            title="My Clients"
            subtitle="Unavailable without API"
          />
          <DashboardTile
            icon="bar-chart-outline"
            title="Earnings & Reports"
            subtitle="Unavailable without API"
          />
          <DashboardTile
            icon="person-outline"
            title="My Profile"
            subtitle="Unavailable without API"
          />
          <DashboardTile
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Unavailable without API"
          />
        </View>
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  devBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.lavenderSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  devBadgeText: {
    ...typography.caption,
    color: colors.brand.lavender,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  greeting: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subcopy: {
    ...typography.body,
    color: colors.text.secondary,
  },
  summaryCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.sm,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
