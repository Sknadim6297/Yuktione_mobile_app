import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AuthShell, FormInput, PrimaryButton } from '@/components/brand';
import { startOtpVerificationFlow } from '@/features/auth/otp/startOtpVerificationFlow';
import {
  fieldErrorsFromZod,
  registerEmailSchema,
} from '@/features/professional/setup/schema';
import { brand, customerFonts } from '@/theme';

export default function ProfessionalRegisterScreen() {
  const [email, setEmail] = useState('');
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
    <AuthShell
      headline="Grow Your"
      accent="Professional Journey"
      points={['Reach new clients', 'Flexible schedule', 'Secure payments']}
      badge="STEP 1 · VERIFY EMAIL"
      title="Create account"
      lead="Enter your email and we'll send a verification code."
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/professional/join'))}
      footer={
        <Pressable onPress={() => router.push('/professional/login')} style={styles.linkWrap}>
          <Text style={styles.link}>Already registered? Sign in</Text>
        </Pressable>
      }
    >
      <FormInput
        label="Email address"
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="you@example.com"
      />
      <PrimaryButton label="Continue" onPress={onContinue} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  linkWrap: { paddingVertical: 8 },
  link: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.plum },
});
