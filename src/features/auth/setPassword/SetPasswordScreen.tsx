import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, PressableScale } from '@/components/motion';
import { Button } from '@/components/ui';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import {
  clearPendingRegistration,
  getPendingRegistration,
} from '@/features/auth/pendingRegistrationStore';
import { unlockUiPreview } from '@/features/preview/uiPreviewSession';
import { completeCustomerRegistration } from '@/services/api/auth';
import {
  colors,
  fontFamilies,
  motion,
  radius,
  spacing,
} from '@/theme';

const BRAND_LOGO = require('../../../../assets/brand/yuktione-logo-light.png');
const TOP_ART = require('../../../../assets/illustrations/auth-top-botanicals.jpg');
const BOTTOM_ART = require('../../../../assets/illustrations/auth-bottom-landscape.jpg');

type RuleId = 'length' | 'upper' | 'lower' | 'number';

const RULES: { id: RuleId; label: string; test: (value: string) => boolean }[] = [
  { id: 'length', label: 'Be at least 8 characters', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Include an uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Include a lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Include a number (0–9)', test: (v) => /\d/.test(v) },
];

/**
 * Screen 06 — Set your password.
 * Pixel reference: Screens/Screen_06.png
 * Does not create accounts — mobile register API is unavailable.
 */
export function SetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ruleState = useMemo(
    () =>
      RULES.map((rule) => ({
        ...rule,
        met: rule.test(password),
      })),
    [password],
  );

  const allRulesMet = ruleState.every((rule) => rule.met);
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = allRulesMet && passwordsMatch && !submitting;

  const mismatchError =
    touched && confirm.length > 0 && !passwordsMatch
      ? 'Passwords do not match.'
      : undefined;

  const bottomArtHeight = Math.min(140, Math.round(width * 0.32));

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
    <View style={styles.root}>
      <Image
        source={TOP_ART}
        style={styles.topArt}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Math.max(insets.top, spacing.md) + spacing.xs,
              paddingBottom: Math.max(insets.bottom, spacing.md) + bottomArtHeight * 0.3,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            scaleTo={motion.press.in}
            onPress={handleBack}
            style={styles.backHit}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </PressableScale>

          <FadeInView style={styles.brand}>
            <Image
              source={BRAND_LOGO}
              style={[styles.logo, { width: Math.min(width * 0.58, 220) }]}
              resizeMode="contain"
              accessibilityLabel="YuktiOne — Guidance for a brighter you"
            />
          </FadeInView>

          <FadeInView delayMs={40} style={styles.copyBlock}>
            <Text style={styles.heading} accessibilityRole="header">
              Set your password
            </Text>
            <Text style={styles.subtitle}>
              Create a secure password for your account
            </Text>
          </FadeInView>

          <FadeInView delayMs={70} style={styles.fields}>
            <PasswordField
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              visible={showPassword}
              onToggleVisible={() => setShowPassword((v) => !v)}
              accessibilityLabel="Password"
            />
            <PasswordField
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm password"
              visible={showConfirm}
              onToggleVisible={() => setShowConfirm((v) => !v)}
              accessibilityLabel="Confirm password"
              onBlur={() => setTouched(true)}
            />
            {mismatchError ? (
              <Text style={styles.error}>{mismatchError}</Text>
            ) : null}
          </FadeInView>

          <View style={styles.rulesCard} accessibilityRole="summary">
            <View style={styles.rulesHeader}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.brand.eucalyptus}
              />
              <Text style={styles.rulesTitle}>Password must:</Text>
            </View>
            {ruleState.map((rule) => (
              <View key={rule.id} style={styles.ruleRow}>
                <View
                  style={[styles.ruleDot, rule.met && styles.ruleDotMet]}
                  accessibilityLabel={rule.met ? 'Met' : 'Not met'}
                >
                  {rule.met ? (
                    <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
                  ) : null}
                </View>
                <Text style={[styles.ruleLabel, rule.met && styles.ruleLabelMet]}>
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaWrap}>
            <Button
              title="Create Account"
              loading={submitting}
              disabled={!canSubmit}
              onPress={() => void handleCreateAccount()}
              style={styles.cta}
            />
          </View>

          <View style={[styles.bottomArtWrap, { width, marginLeft: -spacing.xxl }]}>
            <Image
              source={BOTTOM_ART}
              style={[styles.bottomArt, { width, height: bottomArtHeight }]}
              resizeMode="cover"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PasswordField({
  value,
  onChangeText,
  placeholder,
  visible,
  onToggleVisible,
  accessibilityLabel,
  onBlur,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisible: () => void;
  accessibilityLabel: string;
  onBlur?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Ionicons
        name="lock-closed-outline"
        size={20}
        color={colors.text.muted}
        style={styles.fieldIcon}
        importantForAccessibility="no"
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="password-new"
        accessibilityLabel={accessibilityLabel}
        style={styles.fieldInput}
      />
      <Pressable
        onPress={onToggleVisible}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={10}
        style={styles.eyeHit}
      >
        <Ionicons
          name={visible ? 'eye-outline' : 'eye-off-outline'}
          size={20}
          color={colors.text.muted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  flex: {
    flex: 1,
  },
  topArt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  scroll: {
    paddingHorizontal: spacing.xxl,
    flexGrow: 1,
  },
  backHit: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    height: 72,
  },
  copyBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  heading: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 30,
    lineHeight: 38,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  fields: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  field: {
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    marginRight: spacing.sm,
  },
  fieldInput: {
    flex: 1,
    minHeight: 54,
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    color: colors.text.primary,
  },
  eyeHit: {
    padding: spacing.xs,
  },
  error: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.status.error,
  },
  rulesCard: {
    backgroundColor: colors.brand.eucalyptusSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rulesTitle: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand.eucalyptus,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ruleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.brand.eucalyptus,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ruleDotMet: {
    backgroundColor: colors.brand.eucalyptus,
    borderColor: colors.brand.eucalyptus,
  },
  ruleLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  ruleLabelMet: {
    color: colors.text.primary,
  },
  ctaWrap: {
    marginTop: 'auto',
  },
  cta: {
    borderRadius: radius.full,
    minHeight: 54,
  },
  bottomArtWrap: {
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  bottomArt: {
    alignSelf: 'center',
  },
});
