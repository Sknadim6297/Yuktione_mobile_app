import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { APP_CONFIG, isApiConfigured } from '@/constants/config';
import { SUPPORT_WHATSAPP_URL } from '@/constants/websiteUrls';
import {
  formatStamp,
  useAccountScope,
  useMarkNotificationRead,
  useMyNotifications,
} from '@/features/customer/myspace/accountData';
import {
  Avatar,
  Card,
  EmptyNote,
  MenuRow,
  SourceTag,
  myspace,
  profileCompletion,
  profileImageUrl,
  profileQueryKey,
  useProfileQuery,
} from '@/features/customer/myspace/parts';
import { customerActions, useCustomerState } from '@/features/customer/store';
import { CustomerPage, TealButton } from '@/features/customer/ui';
import { useSignOut } from '@/features/customer/useSignOut';
import type { ApiUser } from '@/services/api/auth';
import { requestPasswordReset } from '@/services/api/auth';
import type { MyNotification } from '@/services/api/mySpace';
import { updateProfile } from '@/services/api/profile';
import { openWebsitePath } from '@/services/website/openWebsite';
import { customer, customerFonts } from '@/theme';

function PageIntro({ title, intro }: { title: string; intro: string }) {
  return (
    <View style={styles.intro}>
      <Text style={myspace.pageTitle}>{title}</Text>
      <Text style={myspace.pageIntro}>{intro}</Text>
    </View>
  );
}

function SignInRequired() {
  return (
    <CustomerPage onBack={() => router.back()}>
      <EmptyNote
        icon="lock-closed-outline"
        title="Sign in required"
        body="Sign in with your YuktiOne account to manage this section."
        actionLabel="Sign in →"
        onAction={() => router.push('/auth')}
      />
    </CustomerPage>
  );
}

type ProfileDraft = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

function draftFromUser(user: ApiUser): ProfileDraft {
  const profile = user.customer_profile;
  return {
    name: profile?.name || user.name || '',
    email: profile?.email || user.email || '',
    phone: profile?.phone || user.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    zip: profile?.zip_code || '',
    notes: profile?.notes || '',
  };
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={myspace.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[myspace.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={customer.muted}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export function PersonalInfoScreen() {
  const state = useCustomerState();
  const signedIn = Boolean(state.session);
  const queryClient = useQueryClient();
  const profileQuery = useProfileQuery(signedIn);
  const [edits, setEdits] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const profile = profileQuery.data;
  const draft = edits ?? (profile ? draftFromUser(profile) : null);

  if (state.ready && !signedIn) return <SignInRequired />;

  const set = (key: keyof ProfileDraft) => (value: string) =>
    setEdits(draft ? { ...draft, [key]: value } : null);

  const save = async () => {
    if (!draft || saving) return;
    const missing = (
      [
        ['name', 'Full name'],
        ['email', 'Email'],
        ['city', 'City'],
        ['state', 'State'],
        ['zip', 'PIN / ZIP code'],
      ] as const
    ).filter(([key]) => !draft[key].trim());
    if (missing.length) {
      Alert.alert('Missing details', `Please fill in: ${missing.map(([, label]) => label).join(', ')}.`);
      return;
    }
    setSaving(true);
    try {
      const result = await updateProfile({
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || undefined,
        address: draft.address.trim() || undefined,
        notes: draft.notes.trim() || undefined,
        city: draft.city.trim(),
        state: draft.state.trim(),
        zip_code: draft.zip.trim(),
      });
      if (!result.ok) {
        Alert.alert('Could not update profile', result.message);
        return;
      }
      customerActions.signInFromApi(result.user);
      queryClient.setQueryData(profileQueryKey(result.user.id), result.user);
      setEdits(null);
      Alert.alert('Profile updated', 'Your changes are saved to your YuktiOne account and show on the website too.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerPage onBack={() => router.back()}>
      <PageIntro
        title="Personal information"
        intro="These details are shared with the YuktiOne website. Changes here update your account everywhere."
      />
      {profileQuery.isLoading || !draft ? (
        profileQuery.isError ? (
          <EmptyNote
            icon="cloud-offline-outline"
            title="Could not load your profile"
            body={profileQuery.error.message}
            actionLabel="Try again →"
            onAction={() => void profileQuery.refetch()}
          />
        ) : (
          <ActivityIndicator color={customer.teal} />
        )
      ) : (
        <>
          <Card>
            <View style={styles.photoRow}>
              <Avatar name={draft.name || 'Y'} uri={profileImageUrl(profile)} size={56} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={myspace.strong}>Profile photo</Text>
                <Text style={myspace.meta}>
                  {profile ? `Profile ${profileCompletion(profile)}% complete. ` : ''}
                  Photos are changed on the website.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change photo on website"
                onPress={() => void openWebsitePath('customerProfile')}
                hitSlop={6}
              >
                <Ionicons name="open-outline" size={18} color={customer.teal} />
              </Pressable>
            </View>
          </Card>
          <Card title="Contact" source="account">
            <Field label="Full name" value={draft.name} onChangeText={set('name')} required />
            <Field label="Email" value={draft.email} onChangeText={set('email')} keyboardType="email-address" required />
            <Field label="Phone" value={draft.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          </Card>
          <Card title="Address" source="account">
            <Field label="Address" value={draft.address} onChangeText={set('address')} />
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <Field label="City" value={draft.city} onChangeText={set('city')} required />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="State" value={draft.state} onChangeText={set('state')} required />
              </View>
            </View>
            <Field label="PIN / ZIP code" value={draft.zip} onChangeText={set('zip')} keyboardType="number-pad" required />
          </Card>
          <Card title="Notes for your experts" source="account">
            <Field
              label="Notes"
              value={draft.notes}
              onChangeText={set('notes')}
              placeholder="Anything you would like experts to know (optional)"
              multiline
            />
          </Card>
          <TealButton label={saving ? 'Saving…' : 'Save changes'} icon="checkmark" onPress={() => void save()} disabled={saving} />
        </>
      )}
    </CustomerPage>
  );
}

export function SecurityScreen() {
  const state = useCustomerState();
  const { busy, confirmSignOut } = useSignOut();
  const [sending, setSending] = useState(false);

  if (state.ready && !state.session) return <SignInRequired />;
  const email = state.session?.email ?? '';

  const sendReset = async () => {
    if (!email || sending) return;
    setSending(true);
    try {
      const result = await requestPasswordReset(email);
      Alert.alert(result.ok ? 'Check your email' : 'Could not send email', result.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <CustomerPage onBack={() => router.back()}>
      <PageIntro
        title="Privacy & security"
        intro="Your app and website share one account, one password and the same security rules."
      />
      <Card title="Password" source="account">
        <Text style={myspace.body}>
          We will email a secure reset link to <Text style={styles.bold}>{email || 'your email'}</Text>.
          The new password works on both the app and the website.
        </Text>
        <TealButton
          label={sending ? 'Sending…' : 'Email me a reset link'}
          icon="mail-outline"
          onPress={() => void sendReset()}
          disabled={sending || !email}
        />
      </Card>
      <Card title="Signed-in device" source="account">
        <View style={styles.infoRow}>
          <Ionicons name="phone-portrait-outline" size={18} color={customer.teal} />
          <Text style={[myspace.body, { flex: 1 }]}>
            YuktiOne keeps one active session per account. Signing in on another phone or browser
            asks before it signs out this one.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={confirmSignOut}
          style={styles.dangerButton}
        >
          <Ionicons name="log-out-outline" size={18} color={customer.danger} />
          <Text style={styles.dangerText}>{busy ? 'Signing out…' : 'Sign out of this device'}</Text>
        </Pressable>
      </Card>
      <Card title="Policies" source="website">
        <View>
          <MenuRow icon="document-lock-outline" label="Privacy policy" external onPress={() => void openWebsitePath('privacy')} />
          <MenuRow icon="document-text-outline" label="Terms & conditions" external last onPress={() => void openWebsitePath('terms')} />
        </View>
      </Card>
    </CustomerPage>
  );
}

export function HelpScreen() {
  const openWhatsApp = () => {
    void Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() =>
      Alert.alert('Could not open WhatsApp', SUPPORT_WHATSAPP_URL),
    );
  };

  return (
    <CustomerPage onBack={() => router.back()}>
      <PageIntro
        title="Help & support"
        intro="Reach the YuktiOne team through the same channels as the website."
      />
      <Card>
        <View>
          <MenuRow
            icon="logo-whatsapp"
            label="Chat on WhatsApp"
            detail="Quick questions about bookings and payments"
            external
            onPress={openWhatsApp}
          />
          <MenuRow
            icon="chatbubbles-outline"
            label="Message support"
            detail="Your support conversation on the website"
            external
            onPress={() => void openWebsitePath('customerSupportChat')}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Help centre & FAQs"
            detail="Answers to common questions"
            external
            onPress={() => void openWebsitePath('help')}
          />
          <MenuRow
            icon="mail-outline"
            label="Contact us"
            detail="Send a message to the YuktiOne team"
            external
            last
            onPress={() => void openWebsitePath('contact')}
          />
        </View>
      </Card>
      <View style={styles.crisis}>
        <Ionicons name="alert-circle-outline" size={18} color={customer.danger} />
        <Text style={[myspace.body, { flex: 1 }]}>
          YuktiOne is not an emergency service. If you are in crisis or thinking about harming
          yourself, call your local emergency number (112 in India) right away.
        </Text>
      </View>
    </CustomerPage>
  );
}

export function SettingsScreen() {
  const state = useCustomerState();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const clearDeviceData = () => {
    Alert.alert(
      'Clear data on this device?',
      'Mood check-ins, saved tools and experts, journal entries and goals stored on this device will be removed. Your YuktiOne account is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            customerActions.clearDeviceData();
            Alert.alert('Cleared', 'Device data has been removed.');
          },
        },
      ],
    );
  };

  return (
    <CustomerPage onBack={() => router.back()}>
      <PageIntro title="Settings" intro="App details and the data kept on this device." />
      <Card title="About this app">
        <View style={styles.kv}>
          <Text style={myspace.meta}>Version</Text>
          <Text style={myspace.strong}>{version}</Text>
        </View>
        <View style={styles.kv}>
          <Text style={myspace.meta}>Platform</Text>
          <Text style={myspace.strong}>{Platform.OS}</Text>
        </View>
        <View style={styles.kv}>
          <Text style={myspace.meta}>Server</Text>
          <Text style={[myspace.strong, styles.server]} numberOfLines={1}>
            {isApiConfigured() ? APP_CONFIG.apiBaseUrl : 'Not configured'}
          </Text>
        </View>
      </Card>
      <Card title="Device data" source="device">
        <Text style={myspace.body}>
          {state.moodHistory.length} mood check-ins, {state.savedToolIds.length} saved tools,{' '}
          {state.favouriteExpertIds.length} saved experts and {state.journal.length} journal entries are
          kept only on this device. Signing out also clears them.
        </Text>
        <Pressable accessibilityRole="button" onPress={clearDeviceData} style={styles.dangerButton}>
          <Ionicons name="trash-outline" size={18} color={customer.danger} />
          <Text style={styles.dangerText}>Clear data on this device</Text>
        </Pressable>
      </Card>
      <Card title="Notifications">
        <View style={styles.infoRow}>
          <SourceTag kind="account" />
        </View>
        <Text style={myspace.body}>
          Booking updates from your account appear under Notifications in My Space, and emails go to your
          registered address. Push notifications are not available in the app yet.
        </Text>
      </Card>
    </CustomerPage>
  );
}

function NotificationRow({
  item,
  last,
  onPress,
}: {
  item: MyNotification;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.note, !last && styles.noteDivider, pressed && styles.pressed]}
    >
      <View style={[styles.noteDot, item.read && styles.noteDotRead]} />
      <View style={styles.noteBody}>
        <Text style={[styles.noteTitle, !item.read && styles.bold]}>{item.title}</Text>
        {item.message ? <Text style={myspace.body}>{item.message}</Text> : null}
        <Text style={myspace.meta}>
          {[formatStamp(item.created_at), item.booking_id ? 'Booking update' : null].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {item.booking_id ? <Ionicons name="chevron-forward" size={16} color={customer.muted} /> : null}
    </Pressable>
  );
}

export function NotificationsScreen() {
  const state = useCustomerState();
  const { enabled } = useAccountScope();
  const query = useMyNotifications();
  const markRead = useMarkNotificationRead();

  if (state.ready && !state.session) return <SignInRequired />;

  const pages = query.data?.pages ?? [];
  const items = [...new Map(pages.flatMap((page) => page.notifications).map((item) => [item.id, item])).values()];
  const unread = pages[0]?.unread_count ?? 0;

  const open = (item: MyNotification) => {
    if (!item.read) markRead.mutate(item.id);
    if (item.booking_id) router.push('/(tabs)/bookings');
  };

  return (
    <CustomerPage onBack={() => router.back()}>
      <PageIntro title="Notifications" intro="Updates about your bookings, from your YuktiOne account." />
      {!enabled ? (
        <EmptyNote
          icon="cloud-offline-outline"
          title="Not connected to YuktiOne"
          body="Notifications load from your account once the app is connected to the YuktiOne server."
        />
      ) : query.isLoading ? (
        <ActivityIndicator color={customer.teal} style={styles.loader} />
      ) : query.isError ? (
        <EmptyNote
          icon="cloud-offline-outline"
          title="Could not load notifications"
          body={query.error.message}
          actionLabel="Try again"
          onAction={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyNote
          icon="notifications-off-outline"
          title="You're all caught up"
          body="Booking updates from YuktiOne will show here. Confirmations and support replies also arrive by email."
        />
      ) : (
        <Card title={unread > 0 ? `${unread} unread` : 'All read'} source="account">
          <View>
            {items.map((item, index) => (
              <NotificationRow
                key={item.id}
                item={item}
                last={index === items.length - 1}
                onPress={() => open(item)}
              />
            ))}
          </View>
          {query.hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              style={styles.more}
            >
              {query.isFetchingNextPage ? (
                <ActivityIndicator color={customer.teal} />
              ) : (
                <Text style={styles.moreText}>Load older</Text>
              )}
            </Pressable>
          ) : null}
        </Card>
      )}
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 6, marginBottom: 2 },
  field: { gap: 0 },
  required: { color: customer.danger },
  multiline: { minHeight: 96, paddingTop: 12 },
  pair: { flexDirection: 'row', gap: 10 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bold: { fontFamily: customerFonts.bold, color: customer.navy },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F0CDD3',
    backgroundColor: customer.white,
  },
  dangerText: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.danger },
  crisis: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: customer.pink,
    borderRadius: 16,
    padding: 14,
  },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  server: { flexShrink: 1, fontSize: 13 },
  loader: { paddingVertical: 24 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12 },
  noteDivider: { borderBottomWidth: 1, borderBottomColor: customer.line },
  noteDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: customer.teal },
  noteDotRead: { backgroundColor: 'transparent' },
  noteBody: { flex: 1, gap: 3 },
  noteTitle: { fontFamily: customerFonts.medium, fontSize: 14, color: customer.navy },
  pressed: { opacity: 0.75 },
  more: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customer.teal,
  },
  moreText: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal },
});
