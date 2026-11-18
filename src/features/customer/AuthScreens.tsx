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
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { BrandLogo, TealButton } from '@/features/customer/ui';
import {
  loginCustomer,
  requestPasswordReset,
  saveCustomerLead,
  sendRegistrationOtp,
} from '@/services/api/auth';
import { customer, customerFonts } from '@/theme';

const AUTH_BG = require('../../../assets/illustrations/auth-bottom-landscape.jpg');

function Field({
  icon,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboard,
  onToggleSecure,
  secureVisible,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboard?: 'email-address' | 'default';
  onToggleSecure?: () => void;
  secureVisible?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={customer.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AABBA"
        secureTextEntry={secure && !secureVisible}
        keyboardType={keyboard === 'email-address' ? 'email-address' : 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {onToggleSecure ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={secureVisible ? 'Hide password' : 'Show password'}
          onPress={onToggleSecure}
          hitSlop={8}
        >
          <Ionicons
            name={secureVisible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={customer.muted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <View style={styles.root}>
      <Image
        source={AUTH_BG}
        style={[styles.bg, { height: Math.round(height * 1.05) }]}
        resizeMode="cover"
        accessibilityElementsHidden
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          <View style={styles.logoWrap}>
            <BrandLogo width={180} />
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.lead}>Continue your wellness journey</Text>

          <View style={styles.form}>
            <Pressable style={styles.social} onPress={() => social('Google')}>
              <Ionicons name="logo-google" size={18} color="#DB4437" />
              <Text style={styles.socialText}>Continue with Google</Text>
            </Pressable>
            <Pressable style={styles.social} onPress={() => social('Apple')}>
              <Ionicons name="logo-apple" size={18} color={customer.navy} />
              <Text style={styles.socialText}>Continue with Apple</Text>
            </Pressable>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.or}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <Field
              icon="mail-outline"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Email or mobile number"
              keyboard="email-address"
            />
            <Field
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secure
              secureVisible={showPassword}
              onToggleSecure={() => setShowPassword((value) => !value)}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={styles.forgotWrap}
              onPress={() => router.push('/auth/forgot-password')}
            >
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>

            <TealButton
              label={busy ? 'Signing in…' : 'Sign In'}
              icon="arrow-forward"
              iconPosition="end"
              onPress={submit}
              disabled={busy}
            />

            <Text style={styles.switch}>
              Don&apos;t have an account?{' '}
              <Text style={styles.switchLink} onPress={() => router.push('/auth/sign-up')}>
                Sign Up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12),
          paddingHorizontal: 20,
          paddingBottom: 32,
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={customer.teal} />
        </Pressable>
        <BrandLogo width={150} />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.lead}>We&apos;ll verify your email next.</Text>
        <Field icon="person-outline" value={name} onChangeText={setName} placeholder="Full name" />
        <Field
          icon="call-outline"
          value={phone}
          onChangeText={setPhone}
          placeholder="Mobile number"
        />
        <Field
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboard="email-address"
        />
        <Field
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secure
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TealButton label="Continue" onPress={() => void submit()} disabled={busy} />
        <Text style={styles.switch}>
          Already registered?{' '}
          <Text style={styles.switchLink} onPress={() => router.replace('/auth')}>
            Sign In
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const identity = useMemo(() => validateAuthIdentifier(email), [email]);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: Math.max(insets.top, 12), paddingHorizontal: 20, gap: 12 },
      ]}
    >
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={customer.teal} />
      </Pressable>
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.lead}>Enter the email on your account to request a reset.</Text>
      <Field
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboard="email-address"
      />
      {message ? (
        <Text style={success ? styles.success : styles.error}>{message}</Text>
      ) : null}
      <TealButton
        label="Request reset"
        disabled={busy}
        onPress={() => {
          if (!identity.ok || identity.kind !== 'email') {
            setSuccess(false);
            setMessage('Enter the email on your account.');
            return;
          }
          if (FRONTEND_ONLY || !isApiConfigured()) {
            setSuccess(false);
            setMessage(
              FRONTEND_ONLY
                ? 'Password reset requires API mode.'
                : 'API base URL is not configured.',
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
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: customer.canvas,
  },
  flex: {
    flex: 1,
  },
  bg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: customerFonts.bold,
    fontSize: 30,
    color: customer.navy,
    textAlign: 'center',
  },
  lead: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customer.body,
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 4,
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  form: {
    paddingHorizontal: 20,
    gap: 12,
  },
  social: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E0E4',
    backgroundColor: customer.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialText: {
    fontFamily: customerFonts.bold,
    color: customer.navy,
    fontSize: 15,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E8EC',
  },
  or: {
    fontFamily: customerFonts.medium,
    color: customer.muted,
    fontSize: 12,
  },
  field: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E0E4',
    backgroundColor: customer.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customer.navy,
    paddingVertical: 12,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
  },
  forgot: {
    color: customer.teal,
    fontFamily: customerFonts.bold,
    fontSize: 13,
  },
  error: {
    color: customer.danger,
    fontFamily: customerFonts.medium,
    fontSize: 13,
  },
  success: {
    color: customer.teal,
    fontFamily: customerFonts.medium,
    fontSize: 13,
  },
  switch: {
    textAlign: 'center',
    fontFamily: customerFonts.regular,
    color: customer.body,
    fontSize: 14,
    marginTop: 4,
  },
  switchLink: {
    color: customer.teal,
    fontFamily: customerFonts.bold,
  },
});
