import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type KeyboardTypeOptions } from 'react-native';

import { BrandGradient, Eyebrow, FormInput, PrimaryButton, SecondaryButton } from '@/components/brand';
import {
  Avatar,
  profileCompletion,
  profileImageUrl,
  profileQueryKey,
  useProfileQuery,
} from '@/features/customer/myspace/parts';
import { RowSkeletons, SpaceEmpty } from '@/features/customer/myspace/SpaceParts';
import { customerActions, useCustomerState } from '@/features/customer/store';
import { CustomerPage } from '@/features/customer/ui';
import type { ApiUser } from '@/services/api/auth';
import { updateProfile } from '@/services/api/profile';
import { clearAuthToken } from '@/services/api/tokenStorage';
import { openWebsitePath } from '@/services/website/openWebsite';
import { brand, customerFonts, shadows } from '@/theme';

type FieldKey = 'name' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'zip_code' | 'notes';
type Draft = Record<FieldKey, string>;
type Errors = Partial<Record<FieldKey, string>>;

/** Customer\ProfileController@update and Api\V1\ProfileController rules. */
const RULES: Record<FieldKey, { label: string; required?: boolean; max?: number; email?: boolean }> = {
  name: { label: 'Name', required: true, max: 255 },
  email: { label: 'Email Address', required: true, max: 255, email: true },
  phone: { label: 'Phone Number', max: 20 },
  address: { label: 'Street Address' },
  city: { label: 'City', required: true, max: 100 },
  state: { label: 'State', required: true, max: 100 },
  zip_code: { label: 'Zip Code', required: true, max: 20 },
  notes: { label: 'Notes' },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function draftFromUser(user: ApiUser): Draft {
  const profile = user.customer_profile;
  return {
    name: user.name || profile?.name || '',
    email: user.email || profile?.email || '',
    phone: profile?.phone || user.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    zip_code: profile?.zip_code || '',
    notes: profile?.notes || '',
  };
}

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  for (const key of Object.keys(RULES) as FieldKey[]) {
    const rule = RULES[key];
    const value = draft[key].trim();
    if (rule.required && !value) errors[key] = `The ${rule.label.toLowerCase()} field is required.`;
    else if (rule.max && value.length > rule.max) {
      errors[key] = `The ${rule.label.toLowerCase()} may not be greater than ${rule.max} characters.`;
    } else if (rule.email && value && !EMAIL_PATTERN.test(value)) {
      errors[key] = 'Please enter a valid email address.';
    }
  }
  return errors;
}

function Group({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
        <View style={styles.groupIcon}>
          <Ionicons name={icon} size={17} color={brand.plum} />
        </View>
        <Text style={styles.groupTitle} accessibilityRole="header">{title}</Text>
      </View>
      {children}
    </View>
  );
}

/** Website: /user/profile (view) + /user/profile/{id}/edit ("Update Your Information"). */
export function PersonalInfoScreen() {
  const state = useCustomerState();
  const signedIn = Boolean(state.session);
  const queryClient = useQueryClient();
  const profileQuery = useProfileQuery(signedIn);
  const [edits, setEdits] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const profile = profileQuery.data;
  const saved = profile ? draftFromUser(profile) : null;
  const draft = edits ?? saved;
  const dirty = Boolean(edits && saved && (Object.keys(saved) as FieldKey[]).some((key) => edits[key] !== saved[key]));

  if (state.ready && !signedIn) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <SpaceEmpty
          icon="lock-closed-outline"
          title="Sign in required"
          body="Sign in with your YuktiOne account to view and edit your profile."
          actionLabel="Sign in"
          onAction={() => router.push('/auth')}
        />
      </CustomerPage>
    );
  }

  const field = (key: FieldKey, options: { keyboardType?: KeyboardTypeOptions; multiline?: boolean; icon?: keyof typeof Ionicons.glyphMap } = {}) => {
    const rule = RULES[key];
    return (
      <FormInput
        label={rule.required ? `${rule.label} *` : rule.label}
        accessibilityLabel={rule.label}
        icon={options.icon}
        value={draft?.[key] ?? ''}
        onChangeText={(value) => {
          if (!draft) return;
          setEdits({ ...draft, [key]: value });
          if (errors[key]) setErrors({ ...errors, [key]: undefined });
          setBanner(null);
        }}
        placeholder={rule.label}
        keyboardType={options.keyboardType}
        autoCapitalize={key === 'email' ? 'none' : key === 'zip_code' ? 'characters' : 'sentences'}
        autoComplete={key === 'email' ? 'email' : key === 'phone' ? 'tel' : key === 'name' ? 'name' : undefined}
        multiline={options.multiline}
        numberOfLines={options.multiline ? 3 : undefined}
        textAlignVertical={options.multiline ? 'top' : 'center'}
        maxLength={rule.max}
        error={errors[key]}
        editable={!saving}
      />
    );
  };

  const cancel = () => {
    setEdits(null);
    setErrors({});
    setBanner(null);
  };

  const save = async () => {
    if (!draft || saving) return;
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      setBanner({ tone: 'error', text: 'Please correct the highlighted fields.' });
      return;
    }
    setSaving(true);
    setBanner(null);
    try {
      const result = await updateProfile({
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || undefined,
        address: draft.address.trim() || undefined,
        notes: draft.notes.trim() || undefined,
        city: draft.city.trim(),
        state: draft.state.trim(),
        zip_code: draft.zip_code.trim(),
      });
      if (!result.ok) {
        if (result.status === 401) {
          await clearAuthToken();
          customerActions.signOut();
          router.replace('/auth');
          return;
        }
        const serverErrors: Errors = {};
        for (const [key, messages] of Object.entries(result.errors ?? {})) {
          if (key in RULES && messages[0]) serverErrors[key as FieldKey] = messages[0];
        }
        setErrors(serverErrors);
        setBanner({
          tone: 'error',
          text: result.status === 0 ? 'No connection. Your changes were not saved.' : result.message,
        });
        return;
      }
      customerActions.signInFromApi(result.user);
      queryClient.setQueryData(profileQueryKey(result.user.id), result.user);
      setEdits(null);
      setErrors({});
      setBanner({ tone: 'success', text: result.message });
    } finally {
      setSaving(false);
    }
  };

  const name = profile?.name || state.session?.name || '';
  const completion = profile ? profileCompletion(profile) : null;

  return (
    <CustomerPage
      onBack={() => router.back()}
      dismissKeyboardOnDrag
      refreshing={profileQuery.isRefetching}
      onRefresh={dirty ? undefined : () => void profileQuery.refetch()}
    >
      <View style={styles.intro}>
        <Eyebrow label="Account" />
        <Text style={styles.title} accessibilityRole="header">My Profile</Text>
        <Text style={styles.lead}>View and update your profile.</Text>
      </View>

      {!draft ? (
        profileQuery.isError ? (
          <SpaceEmpty
            icon="cloud-offline-outline"
            title="Could not load your profile"
            body={profileQuery.error.message}
            actionLabel="Try again"
            onAction={() => void profileQuery.refetch()}
          />
        ) : (
          <View style={styles.group}>
            <RowSkeletons count={4} />
          </View>
        )
      ) : (
        <>
          <View style={styles.overview}>
            <BrandGradient colors={['#F4E3EE', '#F9EEF4', brand.white]} angle={180} style={StyleSheet.absoluteFill} />
            <View style={styles.overviewTop}>
              <View style={styles.avatarRing}>
                <Avatar name={name || 'Y'} uri={profileImageUrl(profile)} size={96} />
              </View>
              <Text style={styles.overviewName} numberOfLines={2}>{name}</Text>
              <View style={styles.emailRow}>
                <Text style={styles.overviewEmail} numberOfLines={1}>{profile?.email}</Text>
                {profile?.email_verified ? (
                  <Ionicons name="checkmark-circle" size={15} color={brand.plum} accessibilityLabel="Email verified" />
                ) : null}
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Customer</Text>
              </View>
            </View>
            {completion !== null ? (
              <View style={styles.completion}>
                <View style={styles.completionRow}>
                  <Text style={styles.completionLabel}>Profile completion</Text>
                  <Text style={styles.completionValue}>{completion}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${completion}%` }]} />
                </View>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile photo on the website"
              onPress={() => void openWebsitePath('customerProfile')}
              style={({ pressed }) => [styles.photoLink, pressed && styles.pressed]}
            >
              <Ionicons name="camera-outline" size={16} color={brand.plum} />
              <Text style={styles.photoLinkText}>Profile photo is changed on the website</Text>
              <Ionicons name="open-outline" size={14} color={brand.grey} />
            </Pressable>
          </View>

          <Group title="Contact Details" icon="person-outline">
            {field('name', { icon: 'person-outline' })}
            {field('email', { keyboardType: 'email-address', icon: 'mail-outline' })}
            {field('phone', { keyboardType: 'phone-pad', icon: 'call-outline' })}
          </Group>

          <Group title="Address" icon="home-outline">
            {field('address', { multiline: true })}
            <View style={styles.pair}>
              <View style={styles.pairItem}>{field('city')}</View>
              <View style={styles.pairItem}>{field('state')}</View>
            </View>
            {field('zip_code')}
          </Group>

          <Group title="Additional Notes" icon="document-text-outline">
            {field('notes', { multiline: true })}
          </Group>

          {banner ? (
            <View
              style={[styles.banner, banner.tone === 'success' ? styles.bannerSuccess : styles.bannerError]}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              <Ionicons
                name={banner.tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={banner.tone === 'success' ? '#23744D' : '#B22742'}
              />
              <Text style={[styles.bannerText, { color: banner.tone === 'success' ? '#23744D' : '#B22742' }]}>
                {banner.text}
              </Text>
            </View>
          ) : null}

          <View style={styles.buttons}>
            <SecondaryButton label="Cancel" onPress={cancel} disabled={!dirty || saving} style={styles.button} />
            <PrimaryButton
              label="Save Changes"
              icon="checkmark"
              onPress={() => void save()}
              disabled={!dirty}
              loading={saving}
              style={styles.button}
            />
          </View>
          <Text style={styles.footnote}>
            Fields marked * are required. Changes update your YuktiOne account on the website too.
          </Text>
        </>
      )}
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  intro: { gap: 6 },
  title: { fontFamily: customerFonts.bold, fontSize: 28, lineHeight: 33, letterSpacing: -0.7, color: brand.ink },
  lead: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: brand.grey },

  overview: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: brand.white,
    padding: 18,
    gap: 14,
    ...shadows.md,
    shadowColor: brand.plum,
    shadowOpacity: 0.1,
  },
  overviewTop: { alignItems: 'center', gap: 4 },
  avatarRing: { padding: 4, borderRadius: 56, backgroundColor: brand.white, marginBottom: 8, ...shadows.sm },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' },
  overviewName: { fontFamily: customerFonts.bold, fontSize: 21, lineHeight: 26, color: brand.ink, textAlign: 'center' },
  overviewEmail: { flexShrink: 1, fontFamily: customerFonts.regular, fontSize: 13.5, color: brand.grey },
  roleBadge: {
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 2,
    backgroundColor: brand.plumSoft,
  },
  roleText: { fontFamily: customerFonts.semibold, fontSize: 11, color: brand.plum },
  completion: { gap: 7 },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  completionLabel: { fontFamily: customerFonts.medium, fontSize: 13, color: brand.ink },
  completionValue: { fontFamily: customerFonts.bold, fontSize: 13, color: brand.plum },
  track: { height: 8, borderRadius: 8, backgroundColor: brand.plumSoftDeep, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 8, backgroundColor: brand.plum },
  photoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  photoLinkText: { flex: 1, fontFamily: customerFonts.semibold, fontSize: 13, color: brand.ink },

  group: {
    backgroundColor: brand.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: brand.divider,
    padding: 16,
    gap: 14,
    ...shadows.sm,
  },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: brand.plumSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: { fontFamily: customerFonts.bold, fontSize: 16.5, color: brand.ink },
  pair: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pairItem: { flexGrow: 1, flexBasis: 140 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  bannerSuccess: { backgroundColor: '#E7F5EE', borderColor: '#BFE3CF' },
  bannerError: { backgroundColor: '#FDECEF', borderColor: '#F3C3CD' },
  bannerText: { flex: 1, fontFamily: customerFonts.semibold, fontSize: 13, lineHeight: 18 },

  buttons: { flexDirection: 'row', gap: 10 },
  button: { flex: 1 },
  footnote: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 17, color: brand.grey, textAlign: 'center' },
});
