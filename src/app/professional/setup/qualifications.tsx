import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { StepProgress } from '@/components/common/StepProgress';
import { Button, Input, Screen } from '@/components/ui';
import { SETUP_STEPS } from '@/features/professional/constants';
import { useSetupForm } from '@/features/professional/setup/SetupFormContext';
import {
  fieldErrorsFromZod,
  qualificationsSchema,
} from '@/features/professional/setup/schema';
import { spacing } from '@/theme';

export default function SetupQualificationsScreen() {
  const { values, updateValues } = useSetupForm();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onNext = () => {
    const parsed = qualificationsSchema.safeParse({
      education: values.education,
      education2: values.education2,
      comments: values.comments,
    });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});
    router.push('/professional/setup/experience');
  };

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <AppHeader title="Professional setup" />
      <StepProgress steps={[...SETUP_STEPS]} currentIndex={1} />

      <InfoBanner
        tone="info"
        title="Document uploads deferred"
        message="Website registration requires qualification_document and id_proof_document (and optional photo/gallery/GST files). Sensitive uploads are intentionally not collected until the mobile upload requirements are audited."
      />

      <View style={styles.form}>
        <Input
          label="Education or qualification"
          value={values.education}
          onChangeText={(education) => updateValues({ education })}
          error={errors.education}
          placeholder="Your education or qualification"
        />
        <Input
          label="Additional education (optional)"
          value={values.education2}
          onChangeText={(education2) => updateValues({ education2 })}
          error={errors.education2}
          placeholder="Additional qualification"
        />
        <Input
          label="Comments (optional)"
          value={values.comments}
          onChangeText={(comments) => updateValues({ comments })}
          error={errors.comments}
          multiline
          style={{ minHeight: 96, textAlignVertical: 'top' }}
          placeholder="Anything else reviewers should know"
        />
      </View>

      <View style={styles.actions}>
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
        <Button title="Continue" onPress={onNext} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  form: {
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
});
