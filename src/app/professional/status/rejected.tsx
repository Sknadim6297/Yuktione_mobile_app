import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { Button, EmptyState, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

export default function ProfessionalRejectedScreen() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader title="Application status" subtitle="rejected" />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>status: rejected</Text>
      </View>

      <Text style={styles.heading}>Your application needs updates</Text>
      <Text style={styles.copy}>
        Matching the website flow: rejected professionals can review the reason
        and resubmit profile details. After resubmit, status returns to pending.
      </Text>

      <View style={styles.reasonCard}>
        <Text style={styles.reasonLabel}>Rejection reason</Text>
        <EmptyState
          title="Reason unavailable"
          description="Rejection reasons come from professional_rejections on the server. No invented reason is shown here."
        />
      </View>

      <InfoBanner
        tone="info"
        title="Resubmission"
        message="Website re-submit accepts updated profile fields and documents, then sets status to pending. Mobile resubmit APIs are not ready — open setup only for local form UI."
      />

      <View style={styles.actions}>
        <Button
          title="Review application form (local)"
          onPress={() => router.push('/professional/setup/basic')}
        />
        <Button
          title="Back to pending status"
          variant="ghost"
          onPress={() => router.replace('/professional/status/pending')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8E6E6',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    ...typography.label,
    color: colors.status.error,
  },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
  },
  copy: {
    ...typography.body,
    color: colors.text.secondary,
  },
  reasonCard: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    minHeight: 180,
    overflow: 'hidden',
  },
  reasonLabel: {
    ...typography.label,
    color: colors.text.muted,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
});
