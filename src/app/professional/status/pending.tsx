import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { Button, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

export default function ProfessionalPendingScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader title="Application status" subtitle="pending" />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>status: pending</Text>
      </View>

      <Text style={styles.heading}>Your profile is under review</Text>
      <Text style={styles.copy}>
        On YuktiOne, newly registered professionals remain pending until an admin
        accepts the application. Dashboard access is only allowed when status is
        accepted.
      </Text>

      <InfoBanner
        tone="pending"
        title="No dashboard access yet"
        message="This screen does not unlock bookings, earnings, or the live dashboard. That requires Sanctum auth plus status === accepted."
      />

      <View style={styles.actions}>
        <Button title="Back to Professional join" onPress={() => router.replace('/professional/join')} />
        <Button
          title="View rejected status screen"
          variant="ghost"
          onPress={() => router.push('/professional/status/rejected')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.lavenderSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.lavender,
  },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
  },
  copy: {
    ...typography.body,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
