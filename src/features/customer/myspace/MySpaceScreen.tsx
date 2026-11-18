import { Ionicons } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { formatWeekdayDate, moodById, toolById } from '@/features/customer/content';
import {
  formatStamp,
  useAccountScope,
  useActivitySummary,
  useMyBookings,
  useMyNotifications,
} from '@/features/customer/myspace/accountData';
import {
  Avatar,
  Card,
  EmptyNote,
  MenuRow,
  QuickActionTile,
  StatTile,
  greetingFor,
  myspace,
  profileCompletion,
  profileImageUrl,
  useProfileQuery,
} from '@/features/customer/myspace/parts';
import { useCustomerState } from '@/features/customer/store';
import { CustomerPage, IconButton, TealButton, TrendChart } from '@/features/customer/ui';
import { useSignOut } from '@/features/customer/useSignOut';
import { fetchExpert } from '@/services/api/catalog';
import { openWebsitePath } from '@/services/website/openWebsite';
import { customer, customerFonts } from '@/theme';

const SAVED_EXPERT_PREVIEW = 4;

export function MySpaceScreen() {
  const state = useCustomerState();
  const signedIn = Boolean(state.session);
  const profileQuery = useProfileQuery(signedIn);
  const { busy: signingOut, confirmSignOut } = useSignOut();

  const savedExpertIds = state.favouriteExpertIds.slice(0, SAVED_EXPERT_PREVIEW);
  const expertQueries = useQueries({
    queries: savedExpertIds.map((id) => ({
      queryKey: ['v1', 'expert-summary', id],
      queryFn: async () => {
        const result = await fetchExpert(id);
        if (!result.ok) throw new Error(result.message);
        return result.expert;
      },
      enabled: signedIn && !FRONTEND_ONLY && isApiConfigured(),
      staleTime: 5 * 60_000,
    })),
  });

  const { enabled: accountLive } = useAccountScope();
  const activity = useActivitySummary(30);
  const upcoming = useMyBookings('upcoming');
  const notifications = useMyNotifications(3);
  const upcomingCount = upcoming.data?.pages[0]?.counts.upcoming ?? null;
  const nextBooking = upcoming.data?.pages[0]?.bookings[0];
  const nextSlot = nextBooking?.next_session ?? (nextBooking
    ? { date: nextBooking.booking_date, time_slot: nextBooking.time_slot }
    : null);
  const unreadCount = notifications.data?.pages[0]?.unread_count ?? 0;
  const latestNotifications = notifications.data?.pages[0]?.notifications ?? [];

  const header = (
    <>
      <View>
        <IconButton
          icon="notifications-outline"
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          onPress={() => router.push('/notifications')}
        />
        {unreadCount > 0 ? <View style={styles.bellDot} pointerEvents="none" /> : null}
      </View>
      <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/account/settings')} />
    </>
  );

  if (!state.ready) {
    return (
      <CustomerPage nav="space" active="my-space">
        <ActivityIndicator color={customer.teal} style={{ marginTop: 48 }} />
      </CustomerPage>
    );
  }

  if (!signedIn) {
    return (
      <CustomerPage nav="space" active="my-space">
        <View style={styles.signedOut}>
          <View style={styles.signedOutIcon}>
            <Ionicons name="person-circle-outline" size={44} color={customer.teal} />
          </View>
          <Text style={styles.signedOutTitle}>Your space is waiting</Text>
          <Text style={[myspace.body, styles.center]}>
            Sign in with the same email and password you use on the YuktiOne website to see your
            profile, bookings and saved items.
          </Text>
          <TealButton label="Sign in" icon="log-in-outline" onPress={() => router.push('/auth')} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/auth/sign-up')} hitSlop={8}>
            <Text style={styles.link}>New to YuktiOne? Create an account</Text>
          </Pressable>
        </View>
      </CustomerPage>
    );
  }

  const profile = profileQuery.data;
  const name = profile?.name || state.session?.name || 'YuktiOne member';
  const email = profile?.email || state.session?.email || '';
  const phone = profile?.customer_profile?.phone || profile?.phone || state.session?.phone || '';
  const completion = profile ? profileCompletion(profile) : null;
  const location = [profile?.customer_profile?.city, profile?.customer_profile?.state]
    .filter(Boolean)
    .join(', ');

  const savedTools = state.savedToolIds
    .map((id) => toolById(id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
  const moods = state.moodHistory.slice(-7);
  const latestMood = state.moodHistory[state.moodHistory.length - 1];
  const averageMood = moods.length
    ? (moods.reduce((sum, point) => sum + point.score, 0) / moods.length).toFixed(1)
    : null;

  return (
    <CustomerPage nav="space" active="my-space" right={header}>
      <View style={styles.profile}>
        <View style={styles.profileTop}>
          <Avatar name={name} uri={profileImageUrl(profile)} size={64} />
          <View style={styles.profileText}>
            <Text style={styles.greeting}>{greetingFor(new Date())},</Text>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {email ? <Text style={styles.contact} numberOfLines={1}>{email}</Text> : null}
            {phone ? <Text style={styles.contact} numberOfLines={1}>{phone}</Text> : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => router.push('/account/personal-info')}
            style={styles.editButton}
            hitSlop={6}
          >
            <Ionicons name="create-outline" size={18} color={customer.white} />
          </Pressable>
        </View>
        {completion !== null ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/account/personal-info')}
            style={styles.completion}
          >
            <View style={styles.completionRow}>
              <Text style={styles.completionLabel}>Profile completion</Text>
              <Text style={styles.completionValue}>{completion}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${completion}%` }]} />
            </View>
            <Text style={styles.completionHint}>
              {completion < 100
                ? 'Add your address and contact details to complete your profile.'
                : location || 'Your profile is complete.'}
            </Text>
          </Pressable>
        ) : null}
        {profileQuery.isLoading ? <ActivityIndicator color={customer.white} /> : null}
        {profileQuery.isError ? (
          <Text style={styles.profileError}>
            Could not load your latest profile. {profileQuery.error.message}
          </Text>
        ) : null}
      </View>

      <Card
        title="Your activity · last 30 days"
        source="account"
        action="Details"
        onAction={() => router.push('/progress')}
      >
        {!accountLive ? (
          <EmptyNote
            icon="cloud-offline-outline"
            title="Not connected to your account"
            body="Account activity appears here when the app is signed in to the YuktiOne server."
          />
        ) : activity.isLoading || upcoming.isLoading ? (
          <ActivityIndicator color={customer.teal} />
        ) : activity.isError ? (
          <EmptyNote
            icon="cloud-offline-outline"
            title="Could not load your activity"
            body={activity.error.message}
            actionLabel="Try again"
            onAction={() => void activity.refetch()}
          />
        ) : (
          <>
            <View style={myspace.grid}>
              <StatTile
                icon="calendar-outline"
                value={upcomingCount === null ? '–' : String(upcomingCount)}
                label="Upcoming sessions"
                tint={customer.mint}
                ink={customer.teal}
              />
              <StatTile
                icon="happy-outline"
                value={String(activity.data?.mood.count ?? 0)}
                label="Mood check-ins"
                tint={customer.green}
                ink={customer.greenInk}
              />
              <StatTile
                icon="book-outline"
                value={String(activity.data?.journal.count ?? 0)}
                label="Journal entries"
                tint={customer.lavender}
                ink={customer.lavenderInk}
              />
              <StatTile
                icon="sunny-outline"
                value={String(activity.data?.gratitude.count ?? 0)}
                label="Gratitude entries"
                tint={customer.gold}
                ink={customer.goldInk}
              />
            </View>
            {nextBooking ? (
              <Pressable
                accessibilityRole="button"
                style={styles.savedRow}
                onPress={() => router.push('/(tabs)/bookings')}
              >
                <Avatar
                  name={nextBooking.professional?.name ?? 'Expert'}
                  uri={nextBooking.professional?.photo_url}
                  size={42}
                />
                <View style={styles.savedText}>
                  <Text style={myspace.strong} numberOfLines={1}>
                    Next: {nextBooking.professional?.name ?? nextBooking.service_name ?? 'Session'}
                  </Text>
                  <Text style={myspace.meta} numberOfLines={1}>
                    {[
                      nextSlot?.date ? formatWeekdayDate(nextSlot.date) : null,
                      nextSlot?.time_slot,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Date to be confirmed'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={customer.muted} />
              </Pressable>
            ) : null}
            {activity.data?.mood.latest ? (
              <Text style={myspace.meta}>
                Latest mood check-in: {activity.data.mood.latest.label ?? 'Recorded'} ·{' '}
                {formatStamp(activity.data.mood.latest.checked_in_at)}
              </Text>
            ) : null}
            <Text style={myspace.meta}>
              Mood, journal and gratitude entries saved in the app or on the website.
            </Text>
          </>
        )}
      </Card>

      <Card title="On this device" source="device">
        <View style={myspace.grid}>
          <StatTile
            icon="happy-outline"
            value={String(state.moodHistory.length)}
            label="Quick mood taps"
            tint={customer.green}
            ink={customer.greenInk}
          />
          <StatTile
            icon="bookmark-outline"
            value={String(state.savedToolIds.length)}
            label="Saved tools"
            tint={customer.mint}
            ink={customer.teal}
          />
          <StatTile
            icon="heart-outline"
            value={String(state.favouriteExpertIds.length)}
            label="Saved experts"
            tint={customer.pink}
            ink={customer.pinkInk}
          />
          <StatTile
            icon="book-outline"
            value={String(state.journal.length)}
            label="Journal notes"
            tint={customer.lavender}
            ink={customer.lavenderInk}
          />
        </View>
        <Text style={myspace.meta}>Kept only on this phone and not shared with your account.</Text>
      </Card>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
      </View>
      <View style={myspace.grid}>
        <QuickActionTile
          icon="calendar-outline"
          label="My Bookings"
          hint="Sessions with experts"
          tint={customer.mint}
          ink={customer.teal}
          onPress={() => router.push('/(tabs)/bookings')}
        />
        <QuickActionTile
          icon="leaf-outline"
          label="My Tools"
          hint="Tools you saved"
          tint={customer.green}
          ink={customer.greenInk}
          onPress={() => router.push('/my-tools')}
        />
        <QuickActionTile
          icon="layers-outline"
          label="Programmes"
          hint="Guided journeys"
          tint={customer.lavender}
          ink={customer.lavenderInk}
          onPress={() => router.push('/programmes')}
        />
        <QuickActionTile
          icon="stats-chart-outline"
          label="My Progress"
          hint="Mood and goals"
          tint={customer.sky}
          ink={customer.skyInk}
          onPress={() => router.push('/progress')}
        />
        <QuickActionTile
          icon="bar-chart-outline"
          label="Reports"
          hint="Your mood insights"
          tint={customer.peach}
          ink={customer.peachInk}
          onPress={() => router.push('/reports')}
        />
        <QuickActionTile
          icon="gift-outline"
          label="Refer & Earn"
          hint="Yukti Points"
          tint={customer.gold}
          ink={customer.goldInk}
          external
          onPress={() => void openWebsitePath('customerReferEarn')}
        />
      </View>

      <Card title="Saved & favourites" source="device">
        {savedTools.length === 0 && savedExpertIds.length === 0 ? (
          <EmptyNote
            icon="bookmark-outline"
            title="Nothing saved yet"
            body="Tap the bookmark on a tool or the heart on an expert profile to keep it here."
            actionLabel="Browse experts →"
            onAction={() => router.push('/(tabs)/experts')}
          />
        ) : null}
        {savedExpertIds.map((id, index) => {
          const expert = expertQueries[index]?.data;
          const loading = expertQueries[index]?.isLoading;
          return (
            <Pressable
              key={`expert-${id}`}
              accessibilityRole="button"
              style={styles.savedRow}
              onPress={() => router.push({ pathname: '/experts/profile/[id]', params: { id } })}
            >
              {expert?.photo_url ? (
                <Image source={{ uri: expert.photo_url }} style={styles.savedPhoto} />
              ) : (
                <Avatar name={expert?.name ?? 'Expert'} size={42} />
              )}
              <View style={styles.savedText}>
                <Text style={myspace.strong} numberOfLines={1}>
                  {expert?.name ?? (loading ? 'Loading expert…' : `Expert #${id}`)}
                </Text>
                <Text style={myspace.meta} numberOfLines={1}>
                  {expert?.specialization ?? 'Saved expert'}
                </Text>
              </View>
              <Ionicons name="heart" size={16} color={customer.pinkInk} />
            </Pressable>
          );
        })}
        {state.favouriteExpertIds.length > SAVED_EXPERT_PREVIEW ? (
          <Text style={myspace.meta}>
            +{state.favouriteExpertIds.length - SAVED_EXPERT_PREVIEW} more saved experts
          </Text>
        ) : null}
        {savedTools.slice(0, 4).map((tool) => (
          <Pressable
            key={`tool-${tool.id}`}
            accessibilityRole="button"
            style={styles.savedRow}
            onPress={() => router.push({ pathname: '/tools/[id]', params: { id: tool.id } })}
          >
            <View style={[styles.savedToolIcon, { backgroundColor: tool.tint }]}>
              <Ionicons name={tool.icon} size={18} color={tool.ink} />
            </View>
            <View style={styles.savedText}>
              <Text style={myspace.strong} numberOfLines={1}>{tool.name}</Text>
              <Text style={myspace.meta} numberOfLines={1}>{tool.blurb}</Text>
            </View>
            <Ionicons name="bookmark" size={16} color={customer.teal} />
          </Pressable>
        ))}
      </Card>

      <Card
        title="Mood trend on this device"
        source="device"
        tone="lavender"
        action={moods.length ? 'Open →' : undefined}
        onAction={() => router.push('/reports')}
      >
        {moods.length >= 2 ? (
          <>
            <View style={styles.insightRow}>
              <View>
                <Text style={myspace.meta}>Average mood (last {moods.length} taps)</Text>
                <Text style={styles.insightValue}>{averageMood}/10</Text>
              </View>
              {latestMood ? (
                <View style={styles.moodPill}>
                  <Text style={styles.moodEmoji}>{moodById(latestMood.mood).emoji}</Text>
                  <Text style={styles.moodText}>{moodById(latestMood.mood).label}</Text>
                </View>
              ) : null}
            </View>
            <TrendChart
              values={moods.map((point) => point.score)}
              labels={moods.map((point) => point.date.slice(8))}
            />
          </>
        ) : (
          <EmptyNote
            icon="pulse-outline"
            title={moods.length === 1 ? 'One mood tap so far' : 'No mood taps on this device yet'}
            body="The trend appears after two quick mood taps from Home."
            actionLabel="Check in now →"
            onAction={() => router.push('/(tabs)/home')}
          />
        )}
      </Card>

      <Card
        title={unreadCount > 0 ? `Notifications · ${unreadCount} unread` : 'Notifications'}
        source="account"
        action={latestNotifications.length ? 'See all' : undefined}
        onAction={() => router.push('/notifications')}
      >
        {!accountLive ? (
          <EmptyNote
            icon="cloud-offline-outline"
            title="Not connected to your account"
            body="Notifications load from your YuktiOne account once the app is connected."
          />
        ) : notifications.isLoading ? (
          <ActivityIndicator color={customer.teal} />
        ) : notifications.isError ? (
          <EmptyNote
            icon="cloud-offline-outline"
            title="Could not load notifications"
            body={notifications.error.message}
            actionLabel="Try again"
            onAction={() => void notifications.refetch()}
          />
        ) : latestNotifications.length === 0 ? (
          <EmptyNote
            icon="notifications-off-outline"
            title="You're all caught up"
            body="Booking updates from YuktiOne will show here. Confirmations also arrive by email."
          />
        ) : (
          latestNotifications.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              style={styles.savedRow}
              onPress={() => router.push('/notifications')}
            >
              <View style={[styles.unreadDot, item.read && styles.readDot]} />
              <View style={styles.savedText}>
                <Text style={myspace.strong} numberOfLines={1}>{item.title}</Text>
                <Text style={myspace.meta} numberOfLines={1}>
                  {item.message ?? formatStamp(item.created_at)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </Card>

      <Card title="Account">
        <View>
          <MenuRow
            icon="person-outline"
            label="Personal information"
            detail="Name, contact and address"
            onPress={() => router.push('/account/personal-info')}
          />
          <MenuRow
            icon="shield-checkmark-outline"
            label="Privacy & security"
            detail="Password, sessions and policies"
            onPress={() => router.push('/account/security')}
          />
          <MenuRow
            icon="help-buoy-outline"
            label="Help & support"
            detail="Contact us, FAQs and WhatsApp"
            onPress={() => router.push('/account/help')}
          />
          <MenuRow
            icon="settings-outline"
            label="Settings"
            detail="App version and device data"
            onPress={() => router.push('/account/settings')}
          />
          <MenuRow
            icon="receipt-outline"
            label="Billing & invoices"
            detail="Payments and invoices on the website"
            external
            last
            onPress={() => void openWebsitePath('customerBilling')}
          />
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        disabled={signingOut}
        onPress={confirmSignOut}
        style={({ pressed }) => [styles.logout, (pressed || signingOut) && { opacity: 0.7 }]}
      >
        <Ionicons name="log-out-outline" size={18} color={customer.danger} />
        <Text style={styles.logoutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  signedOut: {
    marginTop: 32,
    backgroundColor: customer.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 24,
    gap: 14,
    alignItems: 'stretch',
  },
  signedOutIcon: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: customer.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedOutTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 22,
    color: customer.navy,
    textAlign: 'center',
  },
  link: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal, textAlign: 'center' },
  profile: { backgroundColor: customer.navy, borderRadius: 24, padding: 18, gap: 14 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileText: { flex: 1, gap: 1 },
  greeting: { fontFamily: customerFonts.medium, fontSize: 13, color: '#B9C7DA' },
  name: { fontFamily: customerFonts.bold, fontSize: 21, color: customer.white },
  contact: { fontFamily: customerFonts.regular, fontSize: 12.5, color: '#D5DEEA' },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completion: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, gap: 8 },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  completionLabel: { fontFamily: customerFonts.medium, fontSize: 13, color: '#D5DEEA' },
  completionValue: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.white },
  completionHint: { fontFamily: customerFonts.regular, fontSize: 12, color: '#B9C7DA' },
  track: { height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 8, backgroundColor: '#6FC2B8' },
  profileError: { fontFamily: customerFonts.regular, fontSize: 12, color: '#F6C4CC' },
  sectionHead: { marginBottom: -4 },
  sectionTitle: { fontFamily: customerFonts.bold, fontSize: 16, color: customer.navy },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  savedPhoto: { width: 42, height: 42, borderRadius: 21, backgroundColor: customer.mint },
  savedToolIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  savedText: { flex: 1, gap: 2 },
  insightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  insightValue: { fontFamily: customerFonts.bold, fontSize: 24, color: customer.navy },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: customer.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: customer.teal },
  readDot: { backgroundColor: customer.line },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: customer.danger,
    borderWidth: 1.5,
    borderColor: customer.white,
  },
  moodEmoji: { fontSize: 16 },
  moodText: { fontFamily: customerFonts.medium, fontSize: 13, color: customer.navy },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0CDD3',
    backgroundColor: customer.white,
  },
  logoutText: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.danger },
});
