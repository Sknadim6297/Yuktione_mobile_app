import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { Button, Input, Screen } from '@/components/ui';
import {
  fieldErrorsFromZod,
  loginSchema,
} from '@/features/professional/setup/schema';
import { colors, spacing, typography } from '@/theme';

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
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <AppHeader title="Professional login" subtitle="Welcome back" />

      <InfoBanner
        tone="warning"
        title="API not connected"
        message="Validation matches website rules (email + password min 6). Authentication will not succeed until mobile APIs exist."
      />

      <View style={styles.form}>
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="Minimum 6 characters"
        />
      </View>

      <Button title="Sign in" onPress={onSubmit} />

      <View style={styles.links}>
        <Pressable onPress={() => router.push('/professional/register')}>
          <Text style={styles.link}>New here? Apply to join</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/professional/status/pending')}>
          <Text style={styles.linkMuted}>View pending status screen</Text>
        </Pressable>
      </View>
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
  links: {
    gap: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.brand.eucalyptus,
  },
  linkMuted: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
