import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { StepProgress } from '@/components/common/StepProgress';
import { Button, Screen } from '@/components/ui';
import { SETUP_STEPS } from '@/features/professional/constants';
import { useSetupForm } from '@/features/professional/setup/SetupFormContext';
import {
  fieldErrorsFromZod,
  professionalSetupSchema,
} from '@/features/professional/setup/schema';
import { colors, radius, spacing, typography } from '@/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

export default function SetupReviewScreen() {
  const { values } = useSetupForm();
  const [errors, setErrors] = useState<string[]>([]);

  const onSubmit = () => {
    const parsed = professionalSetupSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.values(fieldErrorsFromZod(parsed.error)));
      return;
    }

    setErrors([]);
    Alert.alert(
      'Application not submitted',
      'Your details are valid locally, but mobile registration APIs and required document uploads are not available yet. Opening the pending-status screen for UI review only.',
      [
        {
          text: 'View pending status',
          onPress: () => router.replace('/professional/status/pending'),
        },
      ],
    );
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader title="Professional setup" />
      <StepProgress steps={[...SETUP_STEPS]} currentIndex={4} />

      <InfoBanner
        tone="warning"
        title="No server submission"
        message="Website creates professionals with status pending after OTP + documents. This mobile build validates fields only."
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Review your details</Text>
        <Row label="Name" value={`${values.first_name} ${values.last_name}`.trim()} />
        <Row label="Email" value={values.email} />
        <Row label="Phone" value={values.phone} />
        <Row label="City" value={values.address} />
        <Row label="Education" value={values.education} />
        <Row label="Additional education" value={values.education2} />
        <Row label="Experience" value={values.experience} />
        <Row label="Service" value={values.specialization} />
        <Row label="Starting price" value={values.starting_price} />
        <Row label="Comments" value={values.comments} />
        <Row label="Documents" value="Deferred pending upload audit" />
      </View>

      {errors.length > 0 ? (
        <InfoBanner
          tone="error"
          title="Please fix missing fields"
          message={errors.join(' ')}
        />
      ) : null}

      <View style={styles.actions}>
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
        <Button title="Submit application" onPress={onSubmit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  rowValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  actions: {
    gap: spacing.md,
  },
});
