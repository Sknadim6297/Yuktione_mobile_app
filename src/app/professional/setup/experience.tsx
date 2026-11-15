import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { OptionChips } from '@/components/common/OptionChips';
import { StepProgress } from '@/components/common/StepProgress';
import { Button, Screen } from '@/components/ui';
import {
  EXPERIENCE_OPTIONS,
  SETUP_STEPS,
} from '@/features/professional/constants';
import { useSetupForm } from '@/features/professional/setup/SetupFormContext';
import {
  experienceSchema,
  fieldErrorsFromZod,
} from '@/features/professional/setup/schema';
import { spacing } from '@/theme';

export default function SetupExperienceScreen() {
  const { values, updateValues } = useSetupForm();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onNext = () => {
    const parsed = experienceSchema.safeParse({ experience: values.experience });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});
    router.push('/professional/setup/services');
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader title="Professional setup" />
      <StepProgress steps={[...SETUP_STEPS]} currentIndex={2} />

      <OptionChips
        label="Professional experience"
        options={[...EXPERIENCE_OPTIONS]}
        value={
          values.experience
            ? (values.experience as (typeof EXPERIENCE_OPTIONS)[number]['value'])
            : undefined
        }
        onChange={(experience) => updateValues({ experience })}
        error={errors.experience}
      />

      <View style={styles.actions}>
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
        <Button title="Continue" onPress={onNext} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
