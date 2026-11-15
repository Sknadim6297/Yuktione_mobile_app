import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Button, Input, Screen } from '@/components/ui';
import { startOtpVerificationFlow } from '@/features/auth/otp/startOtpVerificationFlow';
import {
  fieldErrorsFromZod,
  registerEmailSchema,
} from '@/features/professional/setup/schema';
import { colors, spacing, typography } from '@/theme';

export default function ProfessionalRegisterScreen() {
  const [email, setEmail] = useState('priya@email.com');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onContinue = () => {
    const parsed = registerEmailSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setErrors({});
    startOtpVerificationFlow({
      role: 'professional',
      email: parsed.data.email,
      purpose: 'professional_registration_email',
      codeDispatchConfirmed: false,
    });
  };

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <AppHeader title="Create account" subtitle="Step 1 · Verify email" />

      <View style={styles.form}>
        <Input
          label="Email address"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="you@example.com"
        />
      </View>

      <Button title="Continue" onPress={onContinue} />

      <Pressable onPress={() => router.push('/professional/login')} style={styles.linkWrap}>
        <Text style={styles.link}>Already registered? Sign in</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  linkWrap: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.brand.eucalyptus,
  },
});
