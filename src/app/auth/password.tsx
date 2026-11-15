import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { InfoBanner } from '@/components/common/InfoBanner';
import { FadeInView } from '@/components/motion';
import { AnimatedCard, Button, Input, Screen } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

/**
 * Screen 06 — password step UI.
 * Website Customer/Professional login requires password (min 6) after identifier —
 * mobile APIs are not connected, so this screen does not authenticate.
 */
export default function AuthPasswordPlaceholderScreen() {
  const params = useLocalSearchParams<{
    role?: string;
    identifier?: string;
    kind?: string;
  }>();

  const role = params.role === 'professional' ? 'professional' : 'customer';
  const identifier =
    typeof params.identifier === 'string' ? params.identifier : '';

  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const error = useMemo(() => {
    if (!touched) {
      return undefined;
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters (website rule).';
    }
    return undefined;
  }, [password, touched]);

  const handleContinue = () => {
    setTouched(true);
    if (password.length < 6) {
      return;
    }

    setSubmitting(true);
    Alert.alert(
      'Sign-in API not connected',
      `Password was collected locally for ${role} UI only. No session was created and dashboards were not unlocked.`,
      [
        {
          text: 'OK',
          onPress: () => setSubmitting(false),
        },
        {
          text: 'Back to Login',
          onPress: () => {
            setSubmitting(false);
            router.replace('/auth');
          },
        },
      ],
    );
  };

  return (
    <Screen scroll keyboardAware contentStyle={styles.content}>
      <AppHeader
        title="Enter password"
        subtitle={identifier || 'Development UI'}
        onBack={() => router.replace('/auth')}
      />

      <FadeInView style={styles.body}>
        <Text style={styles.heading} accessibilityRole="header">
          Secure sign-in step
        </Text>
        <Text style={styles.copy}>
          Laravel authenticates {role} accounts with email + password (minimum 6
          characters). This screen matches that requirement visually — it does
          not call a mobile API.
        </Text>

        <AnimatedCard delayMs={40} style={styles.card}>
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched(true)}
            error={error}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="password"
            accessibilityLabel="Password"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={10}
            onPress={() => setVisible((v) => !v)}
            style={styles.visibilityHit}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.text.secondary}
            />
            <Text style={styles.visibilityLabel}>
              {visible ? 'Hide password' : 'Show password'}
            </Text>
          </Pressable>
        </AnimatedCard>

        {identifier ? (
          <InfoBanner
            tone="info"
            title="Identifier captured (local UI only)"
            message={`${identifier} · role: ${role}`}
          />
        ) : (
          <InfoBanner
            tone="warning"
            title="No server call"
            message="No password was checked and no session was created."
          />
        )}
        <InfoBanner
          tone="warning"
          title="No fake authentication"
          message="This screen cannot unlock dashboards. Pending/rejected professionals stay blocked until real status APIs exist."
        />
      </FadeInView>

      <View style={styles.actions}>
        <Button
          title="Continue"
          loading={submitting}
          disabled={submitting}
          onPress={handleContinue}
        />
        <Button
          title="Back to Login / Sign Up"
          variant="ghost"
          onPress={() => router.replace('/auth')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  body: {
    gap: spacing.md,
    flex: 1,
  },
  heading: {
    ...typography.h2,
    color: colors.text.primary,
  },
  copy: {
    ...typography.body,
    color: colors.text.secondary,
  },
  card: {
    gap: spacing.md,
  },
  visibilityHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  visibilityLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.md,
  },
});
