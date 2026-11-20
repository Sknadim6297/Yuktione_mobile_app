import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthShell, PrimaryButton } from '@/components/brand';
import { PressableScale } from '@/components/motion';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { AuthNotice, AuthSteps } from '@/features/auth/AuthParts';
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

type Notice = { tone: 'error' | 'success' | 'info'; message: string };

/**
 * Registration step 2 — enter the 6-digit code emailed to the customer.
 * Submits automatically once all six digits are in.
 */
export function OtpVerificationScreen() {
  const [context, setContext] = useState<OtpFlowContext | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<Notice | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setContext(getOtpFlowContext());
      setCode('');
      setError(undefined);
      setNotice(undefined);
      return () => {
        setCode('');
      };
    }, []),
  );

  const countdown = useCountdownDeadline(
    context?.codeDispatchConfirmed ? context.resendAvailableAt : null,
  );

  const handleBack = () => {
    setCode('');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const role = context?.role ?? getSelectedAuthRole();
    router.replace(role === 'professional' ? '/professional/register' : '/auth/sign-up');
  };

  const handleVerify = async (value: string) => {
    if (verifying) return;
    if (!context || value.length !== 6) {
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
    setNotice(undefined);

    try {
      const result = await requestOtpVerify({ context, code: value });
      if (!result.ok) {
        if (result.unavailable) {
          setNotice({ tone: 'error', message: result.message });
        } else {
          setError(result.message);
          setCode('');
        }
        return;
      }

      setCode('');
      clearOtpFlowContext();
      router.replace('/auth/set-password');
    } catch {
      setNotice({ tone: 'error', message: 'Could not verify the code. Please try again.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!context || resending) return;
    if (FRONTEND_ONLY) {
      setCode('');
      return;
    }
    if (context.codeDispatchConfirmed && countdown.isRunning) return;

    setResending(true);
    setNotice(undefined);
    setError(undefined);
    try {
      const result = await requestOtpResend(context);
      if (!result.ok) {
        setNotice({ tone: 'error', message: result.message });
        return;
      }
      setContext(
        updateOtpFlowContext({
          codeDispatchConfirmed: true,
          challengeId: result.data.challengeId,
          resendAvailableAt: result.data.resendAvailableAt,
        }),
      );
      setCode('');
      setNotice({ tone: 'success', message: 'A new code is on its way to your email.' });
    } catch {
      setNotice({ tone: 'error', message: 'Could not resend the code. Please try again.' });
    } finally {
      setResending(false);
    }
  };

  if (!context) {
    return (
      <AuthShell
        badge="VERIFICATION"
        title="Verification expired"
        lead="Your sign-up session is no longer active. Start again to get a fresh code."
        onBack={() => router.replace('/auth')}
      >
        <PrimaryButton label="Start sign-up again" onPress={() => router.replace('/auth/sign-up')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      badge="VERIFY EMAIL"
      title="Enter 6-digit code"
      lead="We've emailed a verification code to"
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
              disabled={verifying || resending}
              scaleTo={motion.press.in}
              onPress={() => {
                void handleResend();
              }}
              style={styles.resendHit}
            >
              <Text style={styles.resendAction}>{resending ? 'Sending…' : "Didn't get it? Resend code"}</Text>
            </PressableScale>
          )}
        </View>
      }
    >
      <AuthSteps current={2} />

      <View style={styles.emailRow}>
        <Text style={styles.email} numberOfLines={1} accessibilityLabel={`Email ${context.email}`}>
          {context.email}
        </Text>
        <Text style={styles.change} accessibilityRole="link" onPress={handleBack}>
          Change
        </Text>
      </View>

      <OtpCodeInput
        value={code}
        onChange={(next) => {
          setCode(next);
          if (error) setError(undefined);
          if (notice) setNotice(undefined);
          if (next.length === 6) void handleVerify(next);
        }}
        disabled={verifying}
        error={error}
        autoFocus
      />

      {notice ? <AuthNotice tone={notice.tone} message={notice.message} /> : null}

      <PrimaryButton
        label={verifying ? 'Verifying…' : 'Verify & continue'}
        loading={verifying}
        disabled={code.length !== 6 || verifying}
        onPress={() => {
          void handleVerify(code);
        }}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: -6,
  },
  email: {
    flexShrink: 1,
    fontFamily: customerFonts.bold,
    fontSize: 15.5,
    lineHeight: 22,
    color: brand.plum,
    textAlign: 'center',
  },
  change: { fontFamily: customerFonts.semibold, fontSize: 13, color: brand.grey, textDecorationLine: 'underline' },
  resendWrap: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  resendHit: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  resendText: { fontFamily: customerFonts.regular, fontSize: 14, color: brand.grey },
  resendAccent: { fontFamily: customerFonts.bold, color: brand.plum },
  resendAction: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.plum },
});
