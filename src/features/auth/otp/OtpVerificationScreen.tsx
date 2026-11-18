import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthShell, PrimaryButton } from '@/components/brand';
import { PressableScale } from '@/components/motion';
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
import { brand, customerFonts, motion } from '@/theme';

/**
 * Screen 05 — OTP Verification / Enter 6-digit code.
 * Rendered on the shared website auth layout (AuthShell).
 */
export function OtpVerificationScreen() {
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
      <AuthShell
        headline="Let's start"
        accent="again."
        badge="VERIFICATION"
        title="OTP session missing"
        lead="Start from registration with a valid email so your details can be kept safely. OTP codes are never stored in the link."
        onBack={() => router.replace('/auth')}
      >
        <PrimaryButton label="Back to Sign In / Sign Up" onPress={() => router.replace('/auth')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline="One quick check and you're"
      accent="in."
      points={['Secure verification', 'Code expires in minutes']}
      badge="VERIFY EMAIL"
      title="Enter 6-digit code"
      lead="We've sent it to"
      onBack={handleBack}
      footer={
        <View style={styles.resendWrap}>
          {context.codeDispatchConfirmed && countdown.isRunning ? (
            <Text style={styles.resendText} accessibilityLiveRegion="polite">
              Resend code in <Text style={styles.resendAccent}>{countdown.formatted}</Text>
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
      }
    >
      <Text style={styles.email} accessibilityLabel={`Email ${context.email}`}>
        {context.email}
      </Text>

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

      <PrimaryButton
        label="Continue"
        loading={verifying}
        disabled={!canContinue}
        onPress={() => {
          void handleVerify();
        }}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  email: {
    fontFamily: customerFonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: brand.plum,
    textAlign: 'center',
    marginTop: -10,
  },
  resendWrap: { alignItems: 'center', gap: 4, minHeight: 44, justifyContent: 'center' },
  resendHit: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  resendText: { fontFamily: customerFonts.regular, fontSize: 14, color: brand.grey },
  resendAccent: { fontFamily: customerFonts.bold, color: brand.plum },
  resendAction: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.plum },
  hint: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: brand.grey,
    textAlign: 'center',
    maxWidth: 320,
    marginTop: 4,
  },
});
