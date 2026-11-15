import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Button, Input, Screen } from '@/components/ui';
import { startOtpVerificationFlow } from '@/features/auth/otp/startOtpVerificationFlow';
import { colors, spacing, typography } from '@/theme';

/** Customer registration email → OTP (frontend tour). */
export default function CustomerRegisterScreen() {
  const [email, setEmail] = useState('priya@email.com');
  const [error, setError] = useState<string | undefined>();

  const onContinue = () => {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError('Enter a valid email address.');
      return;
    }

    setError(undefined);
    startOtpVerificationFlow({
      role: 'customer',
      email: normalized,
      purpose: 'customer_registration_email',
      codeDispatchConfirmed: false,
    });
  };

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <AppHeader
        title="Create customer account"
        subtitle="Step 1 · Verify email"
        onBack={() => router.replace('/auth')}
      />

      <View style={styles.body}>
        <Text style={styles.heading}>Customer registration</Text>
        <Text style={styles.copy}>
          Enter an email, then continue to the OTP screen.
        </Text>
        <Input
          label="Email address"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          error={error}
          placeholder="you@example.com"
        />
      </View>

      <Button title="Continue" onPress={onContinue} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  body: {
    gap: spacing.md,
    flex: 1,
  },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
  },
  copy: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
