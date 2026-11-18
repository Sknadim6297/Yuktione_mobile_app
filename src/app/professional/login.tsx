import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { AuthShell, FormInput, PrimaryButton } from '@/components/brand';
import { InfoBanner } from '@/components/common/InfoBanner';
import {
  fieldErrorsFromZod,
  loginSchema,
} from '@/features/professional/setup/schema';
import { brand, customerFonts } from '@/theme';

export default function ProfessionalLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setErrors({});
    Alert.alert(
      'Sign-in unavailable',
      'Professional login uses the future /api/v1 Sanctum endpoints. The website currently authenticates professionals with session cookies, which mobile cannot reuse. No fake login was performed.',
    );
  };

  return (
    <AuthShell
      headline="Welcome back to your"
      accent="practice."
      points={['Manage sessions & clients', 'Track earnings']}
      badge="PROFESSIONAL"
      title="Professional login"
      lead="Sign in to continue"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/professional/join'))}
      footer={
        <>
          <Pressable onPress={() => router.push('/professional/register')} style={styles.linkWrap}>
            <Text style={styles.link}>New here? Apply to join</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/professional/status/pending')}>
            <Text style={styles.linkMuted}>View pending status screen</Text>
          </Pressable>
        </>
      }
    >
      <InfoBanner
        tone="warning"
        title="API not connected"
        message="Validation matches website rules (email + password min 6). Authentication will not succeed until mobile APIs exist."
      />
      <FormInput
        label="Email"
        icon="mail-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="you@example.com"
      />
      <FormInput
        label="Password"
        icon="lock-closed-outline"
        password
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        placeholder="Minimum 6 characters"
      />
      <PrimaryButton label="Sign in" onPress={onSubmit} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  linkWrap: { paddingVertical: 8 },
  link: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.plum },
  linkMuted: { fontFamily: customerFonts.regular, fontSize: 12.5, color: brand.grey, marginTop: 4 },
});
