import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BrandGradient, BrandLogo } from '@/components/brand';
import { Skeleton } from '@/features/customer/home/media';
import { Avatar } from '@/features/customer/myspace/parts';
import { IconButton } from '@/features/customer/ui';
import { brand, customer, customerFonts, shadows } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const LEAF = 'M0 0 C 18 -26 58 -30 84 0 C 58 30 18 26 0 0 Z';
const RIB = 'M4 0 L 78 0';

/** Soft brand wash with a light botanical motif behind the header, title and profile card. */
export function SpaceBackdrop({ height }: { height: number }) {
  return (
    <View pointerEvents="none" style={[styles.backdrop, { height }]}>
      <BrandGradient colors={['#F4E3EE', '#F9EEF4', brand.pearl]} angle={180} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="xMaxYMin slice" viewBox="0 0 390 260">
        <Path d="M170 150 C 240 92 300 160 390 96 L 390 0 L 250 0 C 300 40 230 90 170 150 Z" fill={brand.white} opacity={0.45} />
        <Path d="M390 180 C 330 170 300 210 230 214 C 300 236 350 214 390 222 Z" fill={brand.white} opacity={0.5} />
        {[
          { x: 352, y: 110, r: -118, o: 0.16 },
          { x: 356, y: 108, r: -72, o: 0.13 },
          { x: 350, y: 112, r: -150, o: 0.1 },
          { x: 360, y: 106, r: -40, o: 0.09 },
        ].map((leaf) => (
          <Path
            key={leaf.r}
            d={`${LEAF} ${RIB}`}
            fill={brand.plum}
            stroke={brand.plum}
            strokeWidth={0.6}
            opacity={leaf.o}
            transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r})`}
          />
        ))}
      </Svg>
    </View>
  );
}

export function SpaceHeader({ right }: { right: ReactNode }) {
  return (
    <View style={styles.header}>
      <BrandLogo width={120} />
      <View style={styles.headerActions}>{right}</View>
    </View>
  );
}

export function NotificationBell({ unread }: { unread: number }) {
  return (
    <IconButton
      icon="notifications-outline"
      label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      onPress={() => router.push('/notifications')}
      badge={unread > 0}
    />
  );
}

export function SpaceTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Profile card                                                        */
/* ------------------------------------------------------------------ */

export function ProfileCard({
  name,
  email,
  phone,
  photo,
  emailVerified,
  loading,
  onEdit,
  compact,
}: {
  name: string;
  email: string;
  phone: string;
  photo: string | null;
  emailVerified: boolean;
  loading: boolean;
  onEdit: () => void;
  compact: boolean;
}) {
  const size = compact ? 72 : 88;
  return (
    <View style={styles.profileCard}>
      <View style={[styles.photoRing, { borderRadius: size / 2 + 4 }]}>
        {loading && !name ? (
          <Skeleton style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <Avatar name={name || 'YuktiOne'} uri={photo} size={size} />
        )}
      </View>
      <View style={styles.profileText}>
        {loading && !name ? (
          <>
            <Skeleton style={styles.skeletonName} />
            <Skeleton style={styles.skeletonLine} />
          </>
        ) : (
          <>
            <Text style={[styles.profileName, compact && styles.profileNameCompact]} numberOfLines={2}>
              {name}
            </Text>
            {email ? (
              <View style={styles.contactRow}>
                <Text style={styles.contact} numberOfLines={1}>
                  {email}
                </Text>
                {emailVerified ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={brand.plum}
                    accessibilityLabel="Email verified"
                  />
                ) : null}
              </View>
            ) : null}
            {phone ? (
              <Text style={styles.contact} numberOfLines={1}>
                {phone}
              </Text>
            ) : null}
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit Profile"
          onPress={onEdit}
          hitSlop={6}
          style={({ pressed }) => [styles.editButton, pressed && styles.editPressed]}
        >
          <Ionicons name="create-outline" size={15} color={brand.plum} />
          <Text style={styles.editText}>Edit Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function GuestCard({
  onSignIn,
  onSignUp,
  compact,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
  compact: boolean;
}) {
  const { width } = useWindowDimensions();
  // On very narrow phones the avatar + text row is too tight, so stack it.
  const stacked = width < 340;
  const size = compact ? 72 : 88;
  return (
    <View style={[styles.profileCard, stacked && styles.profileCardStacked]}>
      <View style={[styles.photoRing, { borderRadius: size / 2 + 4 }, stacked && { alignSelf: 'center' }]}>
        <View style={[styles.guestPhoto, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="person" size={size * 0.46} color={brand.plum} />
        </View>
      </View>
      <View style={styles.profileText}>
        <Text style={[styles.profileName, compact && styles.profileNameCompact]}>Welcome to YuktiOne</Text>
        <Text style={styles.contact}>Sign in with the same email and password as the website.</Text>
        <View style={[styles.guestButtons, stacked && styles.guestButtonsStacked]}>
          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={({ pressed }) => [styles.signIn, pressed && styles.signInPressed]}
          >
            <Text style={styles.signInText}>Sign in</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSignUp}
            style={({ pressed }) => [styles.editButton, styles.guestSecondary, pressed && styles.editPressed]}
          >
            <Text style={styles.editText}>Create account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Summary cards                                                       */
/* ------------------------------------------------------------------ */

export const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  loading,
  onPress,
}: {
  icon: IconName;
  label: string;
  /** null when the count could not be loaded; never shown as zero. */
  value: string | null;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={loading ? `${label}, loading` : value === null ? `${label}, unavailable` : `${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}
    >
      <Ionicons name={icon} size={22} color={brand.plum} />
      {loading ? (
        <Skeleton style={styles.statSkeleton} />
      ) : (
        <Text style={styles.statValue}>{value ?? '—'}</Text>
      )}
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
});

export function StatRow({ children }: { children: ReactNode }) {
  return <View style={styles.statRow}>{children}</View>;
}

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

export function MenuCard({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <View style={styles.menuWrap}>
      {label ? <Text style={styles.menuLabel}>{label}</Text> : null}
      <View style={styles.menuCard}>{children}</View>
    </View>
  );
}

export const MenuItem = memo(function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  external,
  first,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  external?: boolean;
  first?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={external ? `${title}, opens website` : title}
      accessibilityHint={subtitle}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, !first && styles.menuDivider, pressed && styles.menuPressed]}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={23} color={brand.plum} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.menuSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name={external ? 'open-outline' : 'chevron-forward'} size={external ? 17 : 19} color={brand.ink} />
    </Pressable>
  );
});

export function LogoutCard({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Logout"
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.logout, (pressed || busy) && styles.menuPressed]}
    >
      <Ionicons name="log-out-outline" size={24} color={customer.danger} />
      <Text style={styles.logoutText}>{busy ? 'Signing out…' : 'Logout'}</Text>
      <Ionicons name="chevron-forward" size={19} color={brand.ink} />
    </Pressable>
  );
}

export function SpaceNotice({ text, onPress }: { text: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={styles.notice}
    >
      <Ionicons name="alert-circle-outline" size={16} color="#9A5B12" />
      <Text style={styles.noticeText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  titleBlock: { gap: 4 },
  title: {
    fontFamily: customerFonts.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
    color: brand.ink,
  },
  subtitle: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: customer.body },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: brand.white,
    ...shadows.md,
    shadowColor: brand.plum,
    shadowOpacity: 0.1,
  },
  photoRing: { padding: 4, backgroundColor: brand.white, ...shadows.sm },
  guestPhoto: { backgroundColor: brand.plumSoft, alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1, minWidth: 0, gap: 3 },
  profileName: { fontFamily: customerFonts.bold, fontSize: 20, lineHeight: 25, letterSpacing: -0.3, color: brand.ink },
  profileNameCompact: { fontSize: 18, lineHeight: 23 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contact: { flexShrink: 1, fontFamily: customerFonts.regular, fontSize: 13.5, lineHeight: 19, color: customer.body },
  skeletonName: { width: '70%', height: 20, borderRadius: 8 },
  skeletonLine: { width: '85%', height: 13, borderRadius: 6, marginTop: 4 },
  editButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: brand.plum,
    backgroundColor: brand.white,
  },
  editPressed: { backgroundColor: brand.plumSoft },
  editText: { fontFamily: customerFonts.bold, fontSize: 13.5, color: brand.plum },
  profileCardStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  guestButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  guestButtonsStacked: { flexDirection: 'column', alignItems: 'stretch' },
  guestSecondary: { marginTop: 0, alignSelf: 'auto', justifyContent: 'center' },
  signIn: {
    minHeight: 38,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: brand.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInPressed: { backgroundColor: brand.plumDark },
  signInText: { fontFamily: customerFonts.bold, fontSize: 13.5, color: brand.white },

  statRow: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
    ...shadows.sm,
  },
  statPressed: { backgroundColor: brand.plumSoft },
  statValue: { fontFamily: customerFonts.bold, fontSize: 20, lineHeight: 25, color: brand.ink },
  statSkeleton: { width: 30, height: 22, borderRadius: 6, marginVertical: 1.5 },
  statLabel: { fontFamily: customerFonts.medium, fontSize: 12.5, color: customer.body },

  menuWrap: { gap: 8 },
  menuLabel: {
    fontFamily: customerFonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: brand.grey,
    paddingHorizontal: 4,
  },
  menuCard: {
    borderRadius: 20,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 62,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: brand.white,
  },
  menuDivider: { borderTopWidth: 1, borderTopColor: brand.divider },
  menuPressed: { backgroundColor: brand.plumSoft },
  menuIcon: { width: 28, alignItems: 'center' },
  menuText: { flex: 1, minWidth: 0, gap: 1 },
  menuTitle: { fontFamily: customerFonts.bold, fontSize: 15.5, color: brand.ink },
  menuSubtitle: { fontFamily: customerFonts.regular, fontSize: 12.5, lineHeight: 17, color: customer.body },

  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 58,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
    ...shadows.sm,
  },
  logoutText: { flex: 1, fontFamily: customerFonts.bold, fontSize: 16, color: customer.danger },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3D6AE',
    backgroundColor: '#FFF6EA',
  },
  noticeText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 12.5, lineHeight: 18, color: '#9A5B12' },
});
