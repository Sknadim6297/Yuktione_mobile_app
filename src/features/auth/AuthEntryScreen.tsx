import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, ShakeView } from '@/components/motion';
import { Button, FormErrorMessage } from '@/components/ui';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { RoleSelector } from '@/features/auth/RoleSelector';
import { SocialAuthButton } from '@/features/auth/SocialAuthButton';
import { setOtpFlowContext } from '@/features/auth/otp/otpContextStore';
import { setSelectedAuthRole } from '@/features/auth/roleStore';
import type { AuthRole } from '@/features/auth/types';
import { validateAuthIdentifier } from '@/features/auth/validation';
import {
  colors,
  fontFamilies,
  motion,
  radius,
  shadows,
  spacing,
} from '@/theme';

/** Official website logo (public_html/frontend/assets/Yuktione_logo.png). */
const BRAND_LOGO = require('../../../assets/brand/yuktione-logo-light.png');
const TOP_ART = require('../../../assets/illustrations/auth-top-botanicals.jpg');
const BOTTOM_ART = require('../../../assets/illustrations/auth-bottom-landscape.jpg');

const AnimatedField = Animated.createAnimatedComponent(View);

/**
 * Screen 04 — shared Login / Sign Up entry.
 * UI-first: no fake OTP, social, or Sanctum success.
 */
export function AuthEntryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [role, setRoleState] = useState<AuthRole>('customer');
  const [identifier, setIdentifier] = useState('');
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    setSelectedAuthRole('customer');
  }, []);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, {
      duration: motion.duration.fast,
    });
  }, [focused, focusProgress]);

  const setRole = (next: AuthRole) => {
    setRoleState(next);
    setSelectedAuthRole(next);
  };

  const validation = useMemo(
    () => validateAuthIdentifier(identifier),
    [identifier],
  );
  const showError = touched && !validation.ok;
  const canContinue = validation.ok && !submitting;

  const fieldBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        showError ? colors.status.error : colors.brand.navy,
        showError ? colors.status.error : colors.border.focus,
      ],
    );
    return { borderColor };
  });

  const handleSocialUnavailable = (provider: 'Google' | 'Apple') => {
    Alert.alert(
      `${provider} sign-in unavailable`,
      `${provider} authentication is not configured. No fake login was performed.`,
    );
  };

  const handleContinue = () => {
    setTouched(true);
    const result = validateAuthIdentifier(identifier);
    if (!result.ok) {
      return;
    }

    if (FRONTEND_ONLY) {
      // Frontend tour: Continue → OTP with the typed email (no API).
      setOtpFlowContext({
        role,
        email:
          result.kind === 'email'
            ? result.normalized
            : 'priya@email.com',
        purpose:
          role === 'professional'
            ? 'professional_registration_email'
            : 'customer_registration_email',
        codeDispatchConfirmed: false,
      });
      router.push('/auth/verify-otp');
      return;
    }

    setSubmitting(true);

    const phoneNote =
      result.kind === 'phone'
        ? '\n\nNote: website login currently requires email (not mobile as the primary credential).'
        : '';

    Alert.alert(
      'Sign-in API not connected',
      role === 'professional'
        ? `Professional accounts use a separate guard (email + password). After login, access depends on status: pending, accepted, or rejected. Mobile /api/v1 Sanctum endpoints are not available — nothing was authenticated.${phoneNote}`
        : `Customer accounts use the user guard (email + password, min 6). OTP is part of registration on the website, not day-to-day login. A password step will be required once mobile APIs exist — nothing was authenticated.${phoneNote}`,
      [
        {
          text: 'OK',
          onPress: () => setSubmitting(false),
        },
        {
          text: 'Open password step (UI)',
          onPress: () => {
            setSubmitting(false);
            router.push({
              pathname: '/auth/password',
              params: {
                role,
                identifier: result.normalized,
                kind: result.kind,
              },
            });
          },
        },
      ],
    );
  };

  const handleCreateAccount = () => {
    if (role === 'professional') {
      router.push('/professional/join');
      return;
    }
    router.push('/customer/register');
  };

  const openTerms = () => {
    Alert.alert(
      'Terms & Privacy Policy',
      'Legal documents will open from YuktiOne once mobile links are configured. Website files were not modified.',
    );
  };

  const bottomArtHeight = Math.min(140, Math.round(width * 0.32));

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, spacing.md) + spacing.md,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <FadeInView style={styles.brandBlock}>
            <Image
              source={BRAND_LOGO}
              style={[styles.logo, { width: Math.min(width * 0.72, 260) }]}
              resizeMode="contain"
              accessibilityLabel="YuktiOne — Guidance for a brighter you"
            />
          </FadeInView>

          <FadeInView delayMs={60}>
            <Text style={styles.welcome} accessibilityRole="header">
              Welcome back
            </Text>
          </FadeInView>

          <FadeInView delayMs={90} style={styles.socialStack}>
            <SocialAuthButton
              provider="google"
              disabled
              onPress={() => handleSocialUnavailable('Google')}
            />
            <SocialAuthButton
              provider="apple"
              disabled
              onPress={() => handleSocialUnavailable('Apple')}
            />
          </FadeInView>

          <View style={styles.dividerRow} accessibilityElementsHidden>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.fieldWrap}>
            <ShakeView trigger={showError ? validation.error : undefined}>
              <AnimatedField
                style={[
                  styles.field,
                  fieldBorderStyle,
                  showError ? styles.fieldError : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.brand.navy}
                  style={styles.fieldIcon}
                  importantForAccessibility="no"
                />
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    setTouched(true);
                  }}
                  placeholder="Email or Mobile number"
                  placeholderTextColor={colors.text.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="username"
                  accessibilityLabel="Email or mobile number"
                  style={styles.fieldInput}
                />
              </AnimatedField>
            </ShakeView>
            <FormErrorMessage
              message={showError ? validation.error : undefined}
            />
          </View>

          <Button
            title="Continue"
            loading={submitting}
            disabled={!canContinue}
            onPress={handleContinue}
          />

          <Pressable
            onPress={openTerms}
            accessibilityRole="link"
            accessibilityLabel="Terms and Privacy Policy"
            style={styles.termsWrap}
          >
            <Text style={styles.terms}>
              By continuing, you agree to our{'\n'}
              <Text style={styles.termsLink}>Terms & Privacy Policy.</Text>
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCreateAccount}
            accessibilityRole="link"
            accessibilityLabel={
              role === 'professional'
                ? 'Create a professional account'
                : 'Create a customer account'
            }
            style={styles.createWrap}
          >
            <Text style={styles.createText}>
              New here? <Text style={styles.createLink}>Create an account</Text>
            </Text>
          </Pressable>

          <View style={styles.roleBlock}>
            <RoleSelector value={role} onChange={setRole} />
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
    height: 160,
    opacity: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
    flexGrow: 1,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: spacing.md,
    zIndex: 1,
  },
  logo: {
    height: 78,
  },
  welcome: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  socialStack: {
    gap: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 13,
    color: colors.text.secondary,
  },
  fieldWrap: {
    gap: spacing.xs,
  },
  field: {
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brand.navy,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  fieldError: {
    borderColor: colors.status.error,
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
  termsWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  terms: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.brand.eucalyptus,
    fontWeight: '700',
  },
  createWrap: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  createText: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    color: colors.text.primary,
  },
  createLink: {
    color: colors.brand.eucalyptus,
    fontWeight: '700',
  },
  roleBlock: {
    marginTop: spacing.xs,
  },
  bottomArtWrap: {
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  bottomArt: {
    alignSelf: 'center',
  },
});
