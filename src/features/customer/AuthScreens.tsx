import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthShell, FormInput, PrimaryButton } from '@/components/brand';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { AuthNotice, AuthSteps, AuthSwitch } from '@/features/auth/AuthParts';
import { startOtpVerificationFlow } from '@/features/auth/otp/startOtpVerificationFlow';
import { leaveAuthAfterSignIn, skipSignIn, wantsReturn } from '@/features/auth/postAuthRoute';
import {
  clearPendingRegistration,
  setPendingRegistration,
  splitFullName,
} from '@/features/auth/pendingRegistrationStore';
import { validateAuthIdentifier } from '@/features/auth/validation';
import { customerActions } from '@/features/customer/store';
import {
  loginCustomer,
  requestPasswordReset,
  saveCustomerLead,
  sendRegistrationOtp,
} from '@/services/api/auth';
import { openWebsitePath } from '@/services/website/openWebsite';
import { brand, customerFonts } from '@/theme';

const NO_API = 'The app is not connected to the YuktiOne server yet. Please try again later.';

function goBackToAuth() {
  if (router.canGoBack()) router.back();
  else router.replace('/auth');
}

type Notice = { tone: 'error' | 'info'; message: string; action?: { label: string; onPress: () => void } };

export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [notice, setNotice] = useState<Notice>();
  const [busy, setBusy] = useState(false);

  const attempt = async (forceLogin: boolean) => {
    setBusy(true);
    setNotice(undefined);
    try {
      const outcome = await loginCustomer({
        email: email.trim().toLowerCase(),
        password,
        forceLogin,
      });

      if (outcome.kind === 'success') {
        customerActions.signInFromApi(outcome.data.user);
        leaveAuthAfterSignIn();
        return;
      }

      if (outcome.kind === 'confirm_logout') {
        setNotice({
          tone: 'info',
          message: outcome.message,
          action: { label: 'Log out other devices and continue', onPress: () => void attempt(true) },
        });
        return;
      }

      setNotice({ tone: 'error', message: outcome.message });
    } catch {
      setNotice({ tone: 'error', message: 'Something went wrong while signing in. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (busy) return;
    const identity = validateAuthIdentifier(email);
    let ok = true;
    if (!identity.ok || identity.kind !== 'email') {
      setEmailError(
        identity.ok
          ? 'Sign in with the email address on your YuktiOne account.'
          : (identity.error ?? 'Enter a valid email address.'),
      );
      ok = false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      ok = false;
    }
    if (!ok) return;

    if (FRONTEND_ONLY) {
      customerActions.signIn(email.trim().toLowerCase());
      router.replace('/(tabs)/home');
      return;
    }
    if (!isApiConfigured()) {
      setNotice({ tone: 'error', message: NO_API });
      return;
    }
    void attempt(false);
  };

  return (
    <AuthShell
      onBack={wantsReturn() ? goBackToAuth : undefined}
      badge="CUSTOMER ACCOUNT"
      title="Welcome back"
      lead="Sign in to continue to your YuktiOne account."
      footer={
        <View style={styles.footerStack}>
          <AuthSwitch prompt="New to YuktiOne?" action="Create an account" onPress={() => router.push('/auth/sign-up')} />
          <Pressable accessibilityRole="button" onPress={skipSignIn} hitSlop={8} style={styles.guest}>
            <Text style={styles.guestText}>Continue as guest</Text>
            <Ionicons name="arrow-forward" size={14} color={brand.grey} />
          </Pressable>
        </View>
      }
    >
      <FormInput
        label="Email address"
        icon="mail-outline"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setEmailError(undefined);
          setNotice(undefined);
        }}
        error={emailError}
        placeholder="you@example.com"
        keyboardType="email-address"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <FormInput
        label="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setPasswordError(undefined);
          setNotice(undefined);
        }}
        error={passwordError}
        placeholder="Enter your password"
        password
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Pressable
        style={styles.forgotWrap}
        onPress={() => router.push('/auth/forgot-password')}
        hitSlop={8}
        accessibilityRole="link"
      >
        <Text style={styles.forgot}>Forgot password?</Text>
      </Pressable>

      {notice ? <AuthNotice tone={notice.tone} message={notice.message} action={notice.action} /> : null}

      <PrimaryButton label="Sign In" icon="arrow-forward" iconPosition="end" onPress={submit} loading={busy} />
    </AuthShell>
  );
}

export function SignUpScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; terms?: string }>({});
  const [notice, setNotice] = useState<Notice>();
  const [busy, setBusy] = useState(false);

  const clear = (key: keyof typeof errors) => {
    setErrors((current) => ({ ...current, [key]: undefined }));
    setNotice(undefined);
  };

  const submit = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Enter your name.';
    if (phone.length < 10) next.phone = 'Enter your 10-digit mobile number.';
    const identity = validateAuthIdentifier(email);
    if (!identity.ok || identity.kind !== 'email') next.email = 'Enter a valid email address.';
    if (!acceptedTerms) next.terms = 'Please accept the Terms & Conditions and Privacy Policy.';
    setErrors(next);
    if (Object.keys(next).length || !identity.ok) return;

    if (FRONTEND_ONLY) {
      customerActions.signIn(identity.normalized, name.trim());
      startOtpVerificationFlow({
        role: 'customer',
        email: identity.normalized,
        purpose: 'customer_registration_email',
        codeDispatchConfirmed: false,
      });
      return;
    }
    if (!isApiConfigured()) {
      setNotice({ tone: 'error', message: NO_API });
      return;
    }

    setBusy(true);
    setNotice(undefined);
    try {
      const { firstName, lastName } = splitFullName(name);
      const lead = await saveCustomerLead({
        first_name: firstName,
        last_name: lastName,
        phone,
        email: identity.normalized,
      });
      if (!lead.ok) {
        setNotice(
          /already registered/i.test(lead.message)
            ? {
                tone: 'error',
                message: 'This email is already registered.',
                action: { label: 'Sign in instead', onPress: () => router.replace('/auth') },
              }
            : { tone: 'error', message: lead.message },
        );
        return;
      }

      const otp = await sendRegistrationOtp(identity.normalized);
      if (!otp.ok) {
        setNotice({ tone: 'error', message: otp.message });
        return;
      }

      clearPendingRegistration();
      setPendingRegistration({
        firstName,
        lastName,
        phone,
        email: identity.normalized,
        userId: lead.userId,
      });
      startOtpVerificationFlow({
        role: 'customer',
        email: identity.normalized,
        purpose: 'customer_registration_email',
        codeDispatchConfirmed: true,
        resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
      });
    } catch {
      setNotice({ tone: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      onBack={goBackToAuth}
      badge="CUSTOMER SIGNUP"
      title="Create your account"
      lead="Join YuktiOne to connect with trusted professionals."
      footer={<AuthSwitch prompt="Already registered?" action="Sign In" onPress={() => router.replace('/auth')} />}
    >
      <AuthSteps current={1} />

      <FormInput
        label="Full name"
        icon="person-outline"
        value={name}
        onChangeText={(value) => {
          setName(value);
          clear('name');
        }}
        error={errors.name}
        placeholder="Your full name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
      />
      <FormInput
        label="Mobile number"
        icon="call-outline"
        value={phone}
        onChangeText={(value) => {
          setPhone(value.replace(/\D/g, '').slice(0, 15));
          clear('phone');
        }}
        error={errors.phone}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        inputMode="tel"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
      />
      <FormInput
        label="Email address"
        icon="mail-outline"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clear('email');
        }}
        error={errors.email}
        hint="We'll email a 6-digit code to verify it."
        placeholder="you@example.com"
        keyboardType="email-address"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />

      <View style={styles.termsWrap}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          onPress={() => {
            setAcceptedTerms((value) => !value);
            clear('terms');
          }}
          style={styles.terms}
          hitSlop={6}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxOn, errors.terms && styles.checkboxError]}>
            {acceptedTerms ? <Ionicons name="checkmark" size={14} color={brand.white} /> : null}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink} onPress={() => void openWebsitePath('terms')}>
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text style={styles.termsLink} onPress={() => void openWebsitePath('privacy')}>
              Privacy Policy
            </Text>
            .
          </Text>
        </Pressable>
        {errors.terms ? <Text style={styles.termsError}>{errors.terms}</Text> : null}
      </View>

      {notice ? <AuthNotice tone={notice.tone} message={notice.message} action={notice.action} /> : null}

      <PrimaryButton
        label={busy ? 'Sending code…' : 'Continue'}
        icon="arrow-forward"
        iconPosition="end"
        onPress={() => void submit()}
        loading={busy}
        accessibilityHint="Saves your details and emails a verification code"
      />
      {busy ? (
        <Text style={styles.busyHint}>Sending your verification email. This can take a few seconds.</Text>
      ) : null}
    </AuthShell>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (busy) return;
    const identity = validateAuthIdentifier(email);
    if (!identity.ok || identity.kind !== 'email') {
      setEmailError('Enter the email address on your account.');
      return;
    }
    if (FRONTEND_ONLY || !isApiConfigured()) {
      setResult({ ok: false, message: NO_API });
      return;
    }
    setBusy(true);
    setResult(undefined);
    void requestPasswordReset(identity.normalized)
      .then((response) => setResult({ ok: response.ok, message: response.message }))
      .catch(() => setResult({ ok: false, message: 'Something went wrong. Please try again.' }))
      .finally(() => setBusy(false));
  };

  return (
    <AuthShell
      onBack={goBackToAuth}
      badge="ACCOUNT RECOVERY"
      title="Forgot password"
      lead="Enter the email on your account and we'll send you a secure reset link."
      footer={<AuthSwitch prompt="Remembered it?" action="Back to Sign In" onPress={() => router.replace('/auth')} />}
    >
      <FormInput
        label="Email address"
        icon="mail-outline"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setEmailError(undefined);
          if (result && !result.ok) setResult(undefined);
        }}
        error={emailError}
        placeholder="you@example.com"
        keyboardType="email-address"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      {result ? <AuthNotice tone={result.ok ? 'success' : 'error'} message={result.message} /> : null}
      <PrimaryButton
        label={result?.ok ? 'Send again' : 'Send reset link'}
        icon="mail-outline"
        onPress={submit}
        loading={busy}
      />
      {busy ? <Text style={styles.busyHint}>Sending the email. This can take a few seconds.</Text> : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgot: { color: brand.plum, fontFamily: customerFonts.bold, fontSize: 13 },
  footerStack: { alignItems: 'center', gap: 12 },
  guest: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12 },
  guestText: { fontFamily: customerFonts.semibold, fontSize: 13.5, color: brand.grey },
  termsWrap: { gap: 6 },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: brand.silver,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.white,
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  checkboxError: { borderColor: '#C4314B' },
  termsText: { flex: 1, fontFamily: customerFonts.regular, fontSize: 13, lineHeight: 19, color: '#3E3E4A' },
  termsLink: { fontFamily: customerFonts.bold, color: brand.plum },
  termsError: { fontFamily: customerFonts.medium, fontSize: 12.5, color: '#C4314B' },
  busyHint: { textAlign: 'center', fontFamily: customerFonts.regular, fontSize: 12.5, color: brand.grey },
});
