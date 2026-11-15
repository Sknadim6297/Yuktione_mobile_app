import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { StepProgress } from '@/components/common/StepProgress';
import { Button, Input, Screen } from '@/components/ui';
import { SETUP_STEPS } from '@/features/professional/constants';
import { useSetupForm } from '@/features/professional/setup/SetupFormContext';
import {
  fieldErrorsFromZod,
  servicesPricingSchema,
} from '@/features/professional/setup/schema';
import { colors, spacing, typography } from '@/theme';

export default function SetupServicesScreen() {
  const { values, updateValues } = useSetupForm();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onNext = () => {
    const parsed = servicesPricingSchema.safeParse({
      specialization: values.specialization,
      starting_price: values.starting_price,
    });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});
    router.push('/professional/setup/review');
  };

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <AppHeader title="Professional setup" />
      <StepProgress steps={[...SETUP_STEPS]} currentIndex={3} />

      <InfoBanner
        tone="info"
        title="Service catalog"
        message="On the website, specialization is chosen from active Service records. Until a mobile services API exists, enter the service name as free text (same field name)."
      />

      <View style={styles.form}>
        <Input
          label="Service you offer"
          value={values.specialization}
          onChangeText={(specialization) => updateValues({ specialization })}
          error={errors.specialization}
          placeholder="e.g. Career counselling"
        />
        <Input
          label="Starting price"
          value={values.starting_price}
          onChangeText={(starting_price) => updateValues({ starting_price })}
          error={errors.starting_price}
          placeholder="e.g. 1500 or 1000-2000"
          keyboardType="numbers-and-punctuation"
        />
        <Text style={styles.help}>
          Enter a fixed price or a price range per session (website rule).
        </Text>
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
  help: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: -spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
});
