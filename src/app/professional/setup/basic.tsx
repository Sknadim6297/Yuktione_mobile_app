import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { OptionChips } from '@/components/common/OptionChips';
import { StepProgress } from '@/components/common/StepProgress';
import { Button, Input, Screen } from '@/components/ui';
import { CITY_OPTIONS, SETUP_STEPS } from '@/features/professional/constants';
import { useSetupForm } from '@/features/professional/setup/SetupFormContext';
import {
  basicDetailsSchema,
  fieldErrorsFromZod,
} from '@/features/professional/setup/schema';
import { spacing } from '@/theme';

export default function SetupBasicScreen() {
  const { values, updateValues, emailReadyForSetup } = useSetupForm();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onNext = () => {
    const parsed = basicDetailsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setErrors({});
    router.push('/professional/setup/qualifications');
  };

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <AppHeader title="Professional setup" />
      <StepProgress steps={[...SETUP_STEPS]} currentIndex={0} />

      {!emailReadyForSetup ? (
        <InfoBanner
          tone="warning"
          title="Start from email verification"
          message="Email should come from the OTP flow. You can still fill fields for UI review."
        />
      ) : null}

      <View style={styles.form}>
        <Input
          label="First name"
          value={values.first_name}
          onChangeText={(first_name) => updateValues({ first_name })}
          error={errors.first_name}
          autoComplete="given-name"
        />
        <Input
          label="Last name"
          value={values.last_name}
          onChangeText={(last_name) => updateValues({ last_name })}
          error={errors.last_name}
          autoComplete="family-name"
        />
        <Input
          label="Email"
          value={values.email}
          onChangeText={(email) => updateValues({ email })}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!emailReadyForSetup}
        />
        <Input
          label="Phone"
          value={values.phone}
          onChangeText={(phone) => updateValues({ phone })}
          error={errors.phone}
          keyboardType="phone-pad"
        />
        <Input
          label="Password"
          value={values.password}
          onChangeText={(password) => updateValues({ password })}
          error={errors.password}
          secureTextEntry
        />
        <Input
          label="Confirm password"
          value={values.password_confirmation}
          onChangeText={(password_confirmation) =>
            updateValues({ password_confirmation })
          }
          error={errors.password_confirmation}
          secureTextEntry
        />
        <OptionChips
          label="Location (city)"
          options={CITY_OPTIONS.map((city) => ({ label: city, value: city }))}
          value={values.address || undefined}
          onChange={(address) => updateValues({ address })}
          error={errors.address}
        />
      </View>

      <Button title="Continue" onPress={onNext} />
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
});
