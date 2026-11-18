import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthShell, FormInput, PrimaryButton } from '@/components/brand';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import {
  clearPendingRegistration,
  getPendingRegistration,
} from '@/features/auth/pendingRegistrationStore';
import { unlockUiPreview } from '@/features/preview/uiPreviewSession';
import { completeCustomerRegistration } from '@/services/api/auth';
import { brand, customerFonts } from '@/theme';

type RuleId = 'length' | 'upper' | 'lower' | 'number';

const RULES: { id: RuleId; label: string; test: (value: string) => boolean }[] = [
  { id: 'length', label: 'Be at least 8 characters', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Include an uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Include a lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Include a number (0–9)', test: (v) => /\d/.test(v) },
];

/**
 * Screen 06 — Set your password (final step of customer registration).
 */
export function SetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ruleState = useMemo(
    () => RULES.map((rule) => ({ ...rule, met: rule.test(password) })),
    [password],
  );

  const allRulesMet = ruleState.every((rule) => rule.met);
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = allRulesMet && passwordsMatch && !submitting;

  const mismatchError =
    touched && confirm.length > 0 && !passwordsMatch ? 'Passwords do not match.' : undefined;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/auth');
  };

  const handleCreateAccount = async () => {
    setTouched(true);
    if (!canSubmit) {
      return;
    }

    if (FRONTEND_ONLY) {
      unlockUiPreview();
      router.replace('/(tabs)/home');
      return;
    }

    if (!isApiConfigured()) {
      Alert.alert(
        'API not configured',
        'Set EXPO_PUBLIC_API_BASE_URL to your Laravel origin. No account was created.',
      );
      return;
    }

    const pending = getPendingRegistration();
    if (!pending?.userId) {
      Alert.alert(
        'Registration incomplete',
        'Verify your email with OTP first, then set your password. No account was completed.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await completeCustomerRegistration({
        user_id: pending.userId,
        password,
        password_confirmation: confirm,
      });
      if (!result.ok) {
        Alert.alert('Could not complete registration', result.message);
        return;
      }
      clearPendingRegistration();
      Alert.alert('Account created', result.message, [
        {
          text: 'Sign in',
          onPress: () => router.replace('/auth'),
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      headline="Almost there. Secure your"
      accent="account."
      points={['Verified email', 'Private & protected']}
      badge="LAST STEP"
      title="Set your password"
      lead="Create a secure password for your account"
      onBack={handleBack}
    >
      <FormInput
        label="Password"
        icon="lock-closed-outline"
        placeholder="Enter password"
        password
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="password-new"
      />
      <FormInput
        label="Confirm password"
        icon="lock-closed-outline"
        placeholder="Confirm password"
        password
        value={confirm}
        onChangeText={setConfirm}
        onBlur={() => setTouched(true)}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="password-new"
        error={mismatchError}
      />

      <View style={styles.rulesCard} accessibilityRole="summary">
        <View style={styles.rulesHeader}>
          <Ionicons name="shield-checkmark" size={18} color={brand.plum} />
          <Text style={styles.rulesTitle}>Password must:</Text>
        </View>
        {ruleState.map((rule) => (
          <View key={rule.id} style={styles.ruleRow}>
            <View
              style={[styles.ruleDot, rule.met && styles.ruleDotMet]}
              accessibilityLabel={rule.met ? 'Met' : 'Not met'}
            >
              {rule.met ? <Ionicons name="checkmark" size={12} color={brand.white} /> : null}
            </View>
            <Text style={[styles.ruleLabel, rule.met && styles.ruleLabelMet]}>{rule.label}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton
        label="Create Account"
        loading={submitting}
        disabled={!canSubmit}
        onPress={() => void handleCreateAccount()}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  rulesCard: {
    backgroundColor: brand.pearl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.divider,
    padding: 14,
    gap: 9,
  },
  rulesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rulesTitle: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.ink },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: brand.silver,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleDotMet: { backgroundColor: brand.plum, borderColor: brand.plum },
  ruleLabel: { fontFamily: customerFonts.regular, fontSize: 13.5, color: brand.grey },
  ruleLabelMet: { color: brand.ink },
});
