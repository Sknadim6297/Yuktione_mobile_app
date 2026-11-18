import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthShell, FormInput, PrimaryButton } from '@/components/brand';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { validateAuthIdentifier } from '@/features/auth/validation';
import { startOtpVerificationFlow } from '@/features/auth/otp/startOtpVerificationFlow';
import {
  clearPendingRegistration,
  setPendingRegistration,
  splitFullName,
} from '@/features/auth/pendingRegistrationStore';
import { customerActions } from '@/features/customer/store';
import {
  loginCustomer,
  requestPasswordReset,
  saveCustomerLead,
  sendRegistrationOtp,
} from '@/services/api/auth';
import { openWebsitePath } from '@/services/website/openWebsite';
import { brand, customer, customerFonts } from '@/theme';

function SocialButton({
  icon,
  color,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.social, pressed && styles.socialPressed]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.socialText}>{label}</Text>
    </Pressable>
  );
}

function OrDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.orLine} />
      <Text style={styles.or}>or continue with email</Text>
      <View style={styles.orLine} />
    </View>
  );
}

function Notice({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  const error = tone === 'error';
  return (
    <View
      style={[styles.notice, error ? styles.noticeError : styles.noticeSuccess]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={error ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={18}
        color={error ? customer.danger : customer.free}
      />
      <Text style={[styles.noticeText, { color: error ? customer.danger : customer.free }]}>
        {message}
      </Text>
    </View>
  );
}

export function SignInScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const social = (provider: string) => {
    Alert.alert(
      `${provider} sign-in unavailable`,
      `${provider} authentication is not configured. No account was signed in.`,
    );
  };

  const finishLogin = async (forceLogin: boolean) => {
    const identity = validateAuthIdentifier(identifier);
    if (!identity.ok || identity.kind !== 'email') {
      setError(
        identity.ok
          ? 'Website login uses email. Enter the email on your YuktiOne account.'
          : identity.error,
      );
      setBusy(false);
      return;
    }

    const outcome = await loginCustomer({
      email: identity.normalized,
      password,
      forceLogin,
    });

    if (outcome.kind === 'success') {
      customerActions.signInFromApi(outcome.data.user);
      setBusy(false);
      router.replace('/(tabs)/home');
      return;
    }

    if (outcome.kind === 'confirm_logout') {
      setBusy(false);
      Alert.alert('Already signed in elsewhere', outcome.message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue here',
          style: 'destructive',
          onPress: () => {
            setBusy(true);
            finishLogin(true).catch(() => {
              setError('Something went wrong while signing in. Please try again.');
              setBusy(false);
            });
          },
        },
      ]);
      return;
    }

    setError(outcome.message);
    setBusy(false);
  };

  const submit = () => {
    if (busy) return;
    const identity = validateAuthIdentifier(identifier);
    if (!identity.ok) {
      setError(identity.error);
      return;
    }
    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(undefined);
    setBusy(true);
    if (FRONTEND_ONLY) {
      customerActions.signIn(
        identity.kind === 'email' ? identity.normalized : `${identity.normalized}@phone.local`,
      );
      router.replace('/(tabs)/home');
      return;
    }
    if (!isApiConfigured()) {
      setBusy(false);
      setError(
        'API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL to your Laravel origin.',
      );
      return;
    }
    finishLogin(false).catch(() => {
      // Never leave the button stuck in the busy state if something unexpected throws.
      setError('Something went wrong while signing in. Please try again.');
      setBusy(false);
    });
  };

  return (
    <AuthShell
      headline="Your everyday growth partner, right in your"
      accent="pocket."
      points={['Verified professionals', 'Practical everyday tools', 'Private & secure']}
      badge="CUSTOMER ACCOUNT"
      title="Welcome back"
      lead="Sign in to continue to your YuktiOne account."
      fixed
      footer={
        <Text style={styles.switch}>
          Don&apos;t have an account?{' '}
          <Text style={styles.switchLink} onPress={() => router.push('/auth/sign-up')}>
            Create one
          </Text>
        </Text>
      }
    >
      <FormInput
        label="Email address"
        icon="mail-outline"
        value={identifier}
        onChangeText={(value) => {
          setIdentifier(value);
          if (error) setError(undefined);
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
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
          if (error) setError(undefined);
        }}
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

      {error ? <Notice tone="error" message={error} /> : null}

      <PrimaryButton
        label="Sign In"
        icon="arrow-forward"
        iconPosition="end"
        onPress={submit}
        loading={busy}
      />

      <OrDivider />
      <View style={styles.socialRow}>
        <SocialButton icon="logo-google" color="#DB4437" label="Google" onPress={() => social('Google')} />
        <SocialButton icon="logo-apple" color={brand.ink} label="Apple" onPress={() => social('Apple')} />
      </View>
    </AuthShell>
  );
}

export function SignUpScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (name.trim().length < 2) {
      setError('Enter your name.');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError('Enter a valid phone number (10–15 digits), matching website registration.');
      return;
    }
    const identity = validateAuthIdentifier(email);
    if (!identity.ok || identity.kind !== 'email') {
      setError('Enter a valid email address.');
      return;
    }
    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    setError(undefined);

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
      setError(
        'API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL to your Laravel origin.',
      );
      return;
    }

    setBusy(true);
    const { firstName, lastName } = splitFullName(name);
    const lead = await saveCustomerLead({
      first_name: firstName,
      last_name: lastName,
      phone: phoneDigits,
      email: identity.normalized,
    });
    if (!lead.ok) {
      setBusy(false);
      setError(lead.message);
      return;
    }

    const otp = await sendRegistrationOtp(identity.normalized);
    if (!otp.ok) {
      setBusy(false);
      setError(otp.message);
      return;
    }

    clearPendingRegistration();
    setPendingRegistration({
      firstName,
      lastName,
      phone: phoneDigits,
      email: identity.normalized,
      password: password.trim(),
      userId: lead.userId,
    });

    setBusy(false);
    startOtpVerificationFlow({
      role: 'customer',
      email: identity.normalized,
      purpose: 'customer_registration_email',
      codeDispatchConfirmed: true,
      resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
    });
  };

  const clearError = () => {
    if (error) setError(undefined);
  };

  return (
    <AuthShell
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth'))}
      headline="Find the right expert or grow your professional"
      accent="journey."
      points={['Verified Professionals', 'Easy & Secure Booking', 'Trusted by Thousands']}
      badge="CUSTOMER SIGNUP"
      title="Create your account"
      lead="Join YuktiOne to connect with trusted professionals."
      footer={
        <Text style={styles.switch}>
          Already registered?{' '}
          <Text style={styles.switchLink} onPress={() => router.replace('/auth')}>
            Sign In
          </Text>
        </Text>
      }
    >
      <View style={styles.steps} accessibilityLabel="Step 1 of 2: Personal info">
        <View style={styles.step}>
          <View style={[styles.stepDot, styles.stepDotOn]}>
            <Text style={styles.stepNumOn}>1</Text>
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelOn]}>Personal Info</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.step}>
          <View style={styles.stepDot}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Verify Email</Text>
        </View>
      </View>

      <FormInput
        label="Full name"
        icon="person-outline"
        value={name}
        onChangeText={(value) => {
          setName(value);
          clearError();
        }}
        placeholder="Your full name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
      <FormInput
        label="Mobile number"
        icon="call-outline"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          clearError();
        }}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <FormInput
        label="Email address"
        icon="mail-outline"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clearError();
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        hint="We’ll send a 6-digit code to verify this email."
      />
      <FormInput
        label="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          clearError();
        }}
        placeholder="At least 6 characters"
        password
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        onPress={() => {
          setAcceptedTerms((value) => !value);
          clearError();
        }}
        style={styles.terms}
        hitSlop={6}
      >
        <View style={[styles.checkbox, acceptedTerms && styles.checkboxOn]}>
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

      {error ? <Notice tone="error" message={error} /> : null}

      <PrimaryButton
        label={busy ? 'Sending code…' : 'Continue'}
        icon="arrow-forward"
        iconPosition="end"
        onPress={() => void submit()}
        loading={busy}
        accessibilityHint="Saves your details and emails a verification code"
      />
      {busy ? (
        <Text style={styles.busyHint}>Sending your verification email — this can take a few seconds.</Text>
      ) : null}
    </AuthShell>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const identity = useMemo(() => validateAuthIdentifier(email), [email]);

  const submit = () => {
    if (!identity.ok || identity.kind !== 'email') {
      setSuccess(false);
      setMessage('Enter the email on your account.');
      return;
    }
    if (FRONTEND_ONLY || !isApiConfigured()) {
      setSuccess(false);
      setMessage(
        FRONTEND_ONLY ? 'Password reset requires API mode.' : 'API base URL is not configured.',
      );
      return;
    }
    setBusy(true);
    void requestPasswordReset(identity.normalized)
      .then((result) => {
        setSuccess(result.ok);
        setMessage(result.message);
      })
      .finally(() => setBusy(false));
  };

  return (
    <AuthShell
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth'))}
      headline="It happens to everyone. Let’s get you back"
      accent="in."
      badge="ACCOUNT RECOVERY"
      title="Forgot password"
      lead="Enter the email on your account and we’ll send you a secure reset link."
      footer={
        <Text style={styles.switch}>
          Remembered it?{' '}
          <Text style={styles.switchLink} onPress={() => router.replace('/auth')}>
            Back to Sign In
          </Text>
        </Text>
      }
    >
      <FormInput
        label="Email address"
        icon="mail-outline"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (message && !success) setMessage(undefined);
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      {message ? <Notice tone={success ? 'success' : 'error'} message={message} /> : null}
      <PrimaryButton label="Send reset link" icon="mail-outline" onPress={submit} loading={busy} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  socialRow: { flexDirection: 'row', gap: 10 },
  social: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.silver,
    backgroundColor: brand.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialPressed: { backgroundColor: brand.pearlDeep },
  socialText: { fontFamily: customerFonts.bold, color: brand.ink, fontSize: 14 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: brand.divider },
  or: { fontFamily: customerFonts.medium, color: brand.grey, fontSize: 12 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgot: { color: brand.plum, fontFamily: customerFonts.bold, fontSize: 13 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeError: { backgroundColor: '#FCEBEE' },
  noticeSuccess: { backgroundColor: '#EAF6EF' },
  noticeText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 13, lineHeight: 18 },
  switch: { textAlign: 'center', fontFamily: customerFonts.regular, color: customer.body, fontSize: 14 },
  switchLink: { color: brand.plum, fontFamily: customerFonts.bold },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  step: { alignItems: 'center', gap: 4, width: 96 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: brand.silver,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.white,
  },
  stepDotOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  stepNum: { fontFamily: customerFonts.bold, fontSize: 12, color: brand.grey },
  stepNumOn: { fontFamily: customerFonts.bold, fontSize: 12, color: brand.white },
  stepLabel: { fontFamily: customerFonts.semibold, fontSize: 11.5, color: brand.grey },
  stepLabelOn: { color: brand.plum },
  stepLine: { flex: 1, maxWidth: 60, height: 1.5, backgroundColor: brand.silver, marginBottom: 18 },
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
  termsText: { flex: 1, fontFamily: customerFonts.regular, fontSize: 13, lineHeight: 19, color: customer.body },
  termsLink: { fontFamily: customerFonts.bold, color: brand.plum },
  busyHint: { textAlign: 'center', fontFamily: customerFonts.regular, fontSize: 12.5, color: brand.grey },
});
