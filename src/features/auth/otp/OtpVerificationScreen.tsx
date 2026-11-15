import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView, PressableScale } from '@/components/motion';
import { Button } from '@/components/ui';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { OtpCodeInput } from '@/features/auth/otp/OtpCodeInput';
import {
  clearOtpFlowContext,
  getOtpFlowContext,
  updateOtpFlowContext,
} from '@/features/auth/otp/otpContextStore';
import { requestOtpResend, requestOtpVerify } from '@/features/auth/otp/otpApi';
import type { OtpFlowContext } from '@/features/auth/otp/types';
import { useCountdownDeadline } from '@/features/auth/otp/useCountdownDeadline';
import { getSelectedAuthRole } from '@/features/auth/roleStore';
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

/**
 * Screen 05 — OTP Verification / Enter 6-digit code.
 * Pixel reference: yukti-mobile-app/Screens/Screen_05.png
 */
export function OtpVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [context, setContext] = useState<OtpFlowContext | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [unavailableHint, setUnavailableHint] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      const current = getOtpFlowContext();
      setContext(current);
      setCode('');
      setError(undefined);
      setUnavailableHint(undefined);
      return () => {
        setCode('');
      };
    }, []),
  );

  const countdown = useCountdownDeadline(
    context?.codeDispatchConfirmed ? context.resendAvailableAt : null,
  );

  const canContinue = code.length === 6 && !verifying;
  const bottomArtHeight = Math.min(150, Math.round(width * 0.34));

  const handleBack = () => {
    setCode('');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const role = context?.role ?? getSelectedAuthRole();
    if (role === 'professional') {
      router.replace('/professional/register');
      return;
    }
    router.replace('/auth');
  };

  const handleVerify = async () => {
    if (!context || code.length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    if (FRONTEND_ONLY) {
      setCode('');
      router.push('/auth/set-password');
      return;
    }

    setVerifying(true);
    setError(undefined);
    setUnavailableHint(undefined);

    try {
      const result = await requestOtpVerify({ context, code });
      if (!result.ok) {
        if (result.unavailable) {
          setUnavailableHint(result.message);
          Alert.alert('Verification unavailable', result.message, [
            { text: 'OK' },
            {
              text: 'Open Set Password UI',
              onPress: () => {
                setCode('');
                router.push('/auth/set-password');
              },
            },
          ]);
        } else {
          setError(result.message);
        }
        return;
      }

      setCode('');
      clearOtpFlowContext();
      router.replace('/auth/set-password');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!context) {
      return;
    }

    if (FRONTEND_ONLY) {
      setCode('');
      return;
    }

    if (context.codeDispatchConfirmed && countdown.isRunning) {
      return;
    }

    setUnavailableHint(undefined);
    const result = await requestOtpResend(context);

    if (!result.ok) {
      setUnavailableHint(result.message);
      Alert.alert('Resend unavailable', result.message);
      return;
    }

    const next = updateOtpFlowContext({
      codeDispatchConfirmed: true,
      challengeId: result.data.challengeId,
      resendAvailableAt: result.data.resendAvailableAt,
    });
    setContext(next);
    setCode('');
  };

  if (!context) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.missingWrap}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>OTP session missing</Text>
          <Text style={styles.body}>
            Start from registration with a valid email so role and identifier
            context can be preserved. OTP codes are never stored in the URL.
          </Text>
          <Button title="Back to Login / Sign Up" onPress={() => router.replace('/auth')} />
        </ScrollView>
      </View>
    );
  }

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
              paddingBottom: Math.max(insets.bottom, spacing.md) + bottomArtHeight * 0.35,
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
              Enter 6-digit code
            </Text>
            <Text style={styles.sentLabel}>We&apos;ve sent it to</Text>
            <Text
              style={styles.email}
              accessibilityLabel={`Email ${context.email}`}
            >
              {context.email}
            </Text>
          </FadeInView>

          <FadeInView delayMs={70} style={styles.otpBlock}>
            <OtpCodeInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (error) {
                  setError(undefined);
                }
                if (unavailableHint) {
                  setUnavailableHint(undefined);
                }
              }}
              disabled={verifying}
              error={error}
              autoFocus
            />
          </FadeInView>

          <View style={styles.resendWrap}>
            {context.codeDispatchConfirmed && countdown.isRunning ? (
              <Text style={styles.resendText} accessibilityLiveRegion="polite">
                Resend code in{' '}
                <Text style={styles.resendAccent}>{countdown.formatted}</Text>
              </Text>
            ) : (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Resend code"
                disabled={verifying}
                scaleTo={motion.press.in}
                onPress={() => {
                  void handleResend();
                }}
                style={styles.resendHit}
              >
                <Text style={styles.resendAction}>Resend code</Text>
              </PressableScale>
            )}
            {!FRONTEND_ONLY && unavailableHint ? (
              <Text style={styles.hint} accessibilityLiveRegion="polite">
                {unavailableHint}
              </Text>
            ) : null}
          </View>

          <View style={styles.continueWrap}>
            <Button
              title="Continue"
              loading={verifying}
              disabled={!canContinue}
              onPress={() => {
                void handleVerify();
              }}
              style={styles.continueButton}
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
    opacity: 1,
  },
  scroll: {
    paddingHorizontal: spacing.xxl,
    flexGrow: 1,
  },
  missingWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  backHit: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
    marginBottom: spacing.xs,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    height: 72,
  },
  copyBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxxl,
  },
  heading: {
    fontFamily: fontFamilies.brandSerif,
    fontSize: 30,
    lineHeight: 38,
    color: colors.text.primary,
    textAlign: 'center',
  },
  sentLabel: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  email: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  otpBlock: {
    marginBottom: spacing.lg,
  },
  resendWrap: {
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  resendHit: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  resendText: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    color: colors.text.secondary,
  },
  resendAccent: {
    color: colors.brand.eucalyptus,
    fontWeight: '700',
  },
  resendAction: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 14,
    color: colors.brand.eucalyptus,
    fontWeight: '700',
  },
  hint: {
    fontFamily: fontFamilies.bodySans,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.muted,
    textAlign: 'center',
    maxWidth: 320,
    marginTop: spacing.xs,
  },
  continueWrap: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  continueButton: {
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
