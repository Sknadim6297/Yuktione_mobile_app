import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { buildOriginUrl, isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { customerActions, useCustomerState } from '@/features/customer/store';
import type { ApiUser } from '@/services/api/auth';
import { fetchProfile } from '@/services/api/profile';
import { clearAuthToken } from '@/services/api/tokenStorage';
import { customer, customerFonts, shadows } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export class ProfileRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Live customer profile from GET /api/v1/profile (same users + customer_profiles rows as the website). */
export function profileQueryKey(userId: number | undefined) {
  return ['v1', 'profile', userId ?? 'unknown'] as const;
}

export function useProfileQuery(enabled: boolean) {
  const userId = useCustomerState().session?.userId;
  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: async () => {
      const result = await fetchProfile();
      if (!result.ok) {
        if (result.status === 401) {
          await clearAuthToken();
          customerActions.signOut();
        }
        throw new ProfileRequestError(result.message, result.status);
      }
      customerActions.signInFromApi(result.user);
      return result.user;
    },
    enabled: enabled && !FRONTEND_ONLY && isApiConfigured(),
    retry: (count, error) =>
      !(error instanceof ProfileRequestError && error.status === 401) && count < 2,
  });
}

/** Mirrors the website customer dashboard: 8 fields from users + customer_profiles. */
export function profileCompletion(user: ApiUser): number {
  const profile = user.customer_profile;
  const fields = [
    user.name,
    user.email,
    profile?.phone,
    profile?.address,
    profile?.city,
    profile?.state,
    profile?.zip_code,
    profile?.profile_image,
  ];
  const filled = fields.filter((value) => typeof value === 'string' && value.trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

export function profileImageUrl(user: ApiUser | undefined): string | null {
  const path = user?.customer_profile?.profile_image?.trim();
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : buildOriginUrl(path);
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '');
  return letters.toUpperCase() || 'Y';
}

export function Avatar({ name, uri, size = 64 }: { name: string; uri?: string | null; size?: number }) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  const [failedUri, setFailedUri] = useState<string | null>(null);
  if (uri && uri !== failedUri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatarImage, shape]}
        accessibilityLabel={name}
        onError={() => setFailedUri(uri)}
      />
    );
  }
  return (
    <View style={[styles.avatar, shape]} accessibilityLabel={name}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

/** Small pill telling the customer where a number comes from. */
export function SourceTag({ kind }: { kind: 'account' | 'device' | 'website' }) {
  const label =
    kind === 'account' ? 'From your account' : kind === 'device' ? 'Saved on this device' : 'Opens website';
  const icon: IconName =
    kind === 'account' ? 'cloud-done-outline' : kind === 'device' ? 'phone-portrait-outline' : 'open-outline';
  return (
    <View style={[styles.tag, kind === 'device' && styles.tagDevice]}>
      <Ionicons name={icon} size={11} color={kind === 'device' ? customer.lavenderInk : customer.tealDark} />
      <Text style={[styles.tagText, kind === 'device' && styles.tagTextDevice]}>{label}</Text>
    </View>
  );
}

export function Card({
  title,
  source,
  action,
  onAction,
  tone = 'white',
  children,
}: {
  title?: string;
  source?: 'account' | 'device' | 'website';
  action?: string;
  onAction?: () => void;
  tone?: 'white' | 'lavender' | 'mint';
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'lavender' && styles.cardLavender,
        tone === 'mint' && styles.cardMint,
      ]}
    >
      {title ? (
        <View style={styles.cardHead}>
          <View style={styles.cardHeadText}>
            <Text style={styles.cardTitle}>{title}</Text>
            {source ? <SourceTag kind={source} /> : null}
          </View>
          {action && onAction ? (
            <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
              <Text style={styles.cardAction}>{action}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function StatTile({
  icon,
  value,
  label,
  tint,
  ink,
}: {
  icon: IconName;
  value: string;
  label: string;
  tint: string;
  ink: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={16} color={ink} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

export function QuickActionTile({
  icon,
  label,
  hint,
  tint,
  ink,
  external,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  tint: string;
  ink: string;
  external?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={external ? `${label}, opens website` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
    >
      <View style={styles.quickTop}>
        <View style={[styles.quickIcon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={20} color={ink} />
        </View>
        <Ionicons
          name={external ? 'open-outline' : 'chevron-forward'}
          size={15}
          color={customer.muted}
        />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.quickHint} numberOfLines={1}>{hint}</Text>
    </Pressable>
  );
}

export function MenuRow({
  icon,
  label,
  detail,
  external,
  danger,
  last,
  onPress,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  external?: boolean;
  danger?: boolean;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={external ? `${label}, opens website` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? customer.danger : customer.teal} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
        {detail ? <Text style={styles.rowDetail} numberOfLines={2}>{detail}</Text> : null}
      </View>
      {danger ? null : (
        <Ionicons name={external ? 'open-outline' : 'chevron-forward'} size={16} color={customer.muted} />
      )}
    </Pressable>
  );
}

export function EmptyNote({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={20} color={customer.teal} />
      </View>
      <View style={styles.emptyText}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} hitSlop={6}>
            <Text style={styles.emptyAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export const myspace = StyleSheet.create({
  pageTitle: { fontFamily: customerFonts.bold, fontSize: 24, color: customer.navy },
  pageIntro: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: customer.body },
  body: { fontFamily: customerFonts.regular, fontSize: 13, lineHeight: 19, color: customer.body },
  meta: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 17, color: customer.muted },
  strong: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  label: { fontFamily: customerFonts.medium, fontSize: 12, color: customer.body, marginBottom: 4 },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    paddingHorizontal: 14,
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: customer.navy,
  },
});

const styles = StyleSheet.create({
  avatar: { backgroundColor: customer.teal, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { backgroundColor: customer.mint },
  avatarText: { fontFamily: customerFonts.bold, color: customer.white },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: customer.mint,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagDevice: { backgroundColor: customer.lavender },
  tagText: { fontFamily: customerFonts.medium, fontSize: 10.5, color: customer.tealDark },
  tagTextDevice: { color: customer.lavenderInk },
  card: {
    backgroundColor: customer.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 16,
    gap: 12,
    ...shadows.sm,
  },
  cardLavender: { backgroundColor: customer.lavender, borderColor: '#F0D4E2' },
  cardMint: { backgroundColor: customer.mint, borderColor: customer.mintDeep },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardHeadText: { flex: 1, gap: 5 },
  cardTitle: { fontFamily: customerFonts.bold, fontSize: 16, color: customer.navy },
  cardAction: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: customer.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 12,
    gap: 4,
  },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { fontFamily: customerFonts.bold, fontSize: 20, color: customer.navy },
  statLabel: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 16, color: customer.muted },
  quick: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 14,
    gap: 3,
    ...shadows.sm,
  },
  quickTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  quickIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.navy },
  quickHint: { fontFamily: customerFonts.regular, fontSize: 12, color: customer.muted },
  pressed: { opacity: 0.75 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: customer.line },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: customer.mint, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: customer.pink },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: customerFonts.medium, fontSize: 14, color: customer.navy },
  rowDetail: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 16, color: customer.muted },
  dangerText: { color: customer.danger },
  empty: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: customer.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    borderStyle: 'dashed',
    padding: 14,
  },
  emptyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: customer.mint, alignItems: 'center', justifyContent: 'center' },
  emptyText: { flex: 1, gap: 3 },
  emptyTitle: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.navy },
  emptyBody: { fontFamily: customerFonts.regular, fontSize: 12.5, lineHeight: 18, color: customer.body },
  emptyAction: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal, marginTop: 4 },
});
