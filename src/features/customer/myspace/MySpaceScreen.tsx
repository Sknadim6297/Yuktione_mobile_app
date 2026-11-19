import { router } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useAccountScope,
  useActivitySummary,
  useBookingOverview,
  useMyNotifications,
} from '@/features/customer/myspace/accountData';
import { profileImageUrl, useProfileQuery } from '@/features/customer/myspace/parts';
import {
  GuestCard,
  LogoutCard,
  MenuCard,
  MenuItem,
  NotificationBell,
  ProfileCard,
  SpaceBackdrop,
  SpaceHeader,
  SpaceNotice,
  SpaceTitle,
  StatCard,
  StatRow,
} from '@/features/customer/myspace/SpaceDesign';
import { Skeleton } from '@/features/customer/home/media';
import { useCustomerState } from '@/features/customer/store';
import { BottomNav, IconButton } from '@/features/customer/ui';
import { useSignOut } from '@/features/customer/useSignOut';
import { openWebsitePath } from '@/services/website/openWebsite';
import { brand, customer } from '@/theme';

const MAX_FRAME = 640;

const goBookings = () => router.push('/(tabs)/bookings');
const goProfile = () => router.push('/account/personal-info');
const goHistory = () => router.push({ pathname: '/account/tool-history', params: { kind: 'moods' } });
const goSettings = () => router.push('/account/settings');
const goHelp = () => router.push('/account/help');

function SpacePage({
  children,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const frame = Math.min(width, MAX_FRAME);
  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
              tintColor={brand.plum}
              colors={[brand.plum]}
            />
          ) : undefined
        }
      >
        <SpaceBackdrop height={insets.top + 270} />
        <View style={[styles.content, { width: frame, paddingTop: Math.max(insets.top, 10) }]}>{children}</View>
      </ScrollView>
      <BottomNav preset="space" active="my-space" />
    </View>
  );
}

export function MySpaceScreen() {
  const state = useCustomerState();
  if (!state.ready) return <LoadingSpace />;
  return state.session ? <SignedInSpace /> : <GuestSpace />;
}

function LoadingSpace() {
  return (
    <SpacePage>
      <SpaceHeader right={null} />
      <SpaceTitle title="My Space" />
      <Skeleton style={styles.skeletonCard} />
      <Skeleton style={styles.skeletonStats} />
      <Skeleton style={styles.skeletonMenu} />
    </SpacePage>
  );
}

/** Website: /user/* is behind auth:user, so guests only see sign-in and public destinations. */
function GuestSpace() {
  const compact = useWindowDimensions().width < 360;
  return (
    <SpacePage>
      <SpaceHeader right={<IconButton icon="settings-outline" label="App settings" onPress={goSettings} />} />
      <SpaceTitle title="My Space" />
      <GuestCard
        compact={compact}
        onSignIn={() => router.push('/auth')}
        onSignUp={() => router.push('/auth/sign-up')}
      />
      <MenuCard>
        <MenuItem
          first
          icon="grid-outline"
          title="Explore Tools"
          subtitle="Wellbeing, career and planning tools"
          onPress={() => router.push('/(tabs)/tools')}
        />
        <MenuItem
          icon="people-outline"
          title="Find an Expert"
          subtitle="Browse verified YuktiOne experts"
          onPress={() => router.push('/(tabs)/experts')}
        />
        <MenuItem icon="help-circle-outline" title="Help & Support" subtitle="Get assistance and FAQs" onPress={goHelp} />
        <MenuItem icon="settings-outline" title="App Settings" subtitle="App details and device data" onPress={goSettings} />
      </MenuCard>
    </SpacePage>
  );
}

function SignedInSpace() {
  const state = useCustomerState();
  const compact = useWindowDimensions().width < 360;
  const profileQuery = useProfileQuery(true);
  const { enabled: accountLive } = useAccountScope();
  const overview = useBookingOverview();
  const activity = useActivitySummary(30);
  const notifications = useMyNotifications(3);
  const { busy: signingOut, confirmSignOut } = useSignOut();
  const [refreshing, setRefreshing] = useState(false);

  const profile = profileQuery.data;
  const name = profile?.name || state.session?.name || '';
  const email = profile?.email || state.session?.email || '';
  const phone = profile?.customer_profile?.phone || profile?.phone || state.session?.phone || '';
  const unread = notifications.data?.pages[0]?.unread_count ?? 0;

  const allTime = activity.data?.all_time;
  const historyCount = allTime ? String(allTime.mood + allTime.journal + allTime.gratitude) : null;
  const bookings = overview.data;
  const bookingCount = bookings ? `${bookings.bookingCount}${bookings.partial ? '+' : ''}` : null;
  const upcomingCount = bookings ? String(bookings.upcomingSlots.length) : null;
  const countsFailed = accountLive && (overview.isError || activity.isError);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([profileQuery.refetch(), overview.refetch(), activity.refetch(), notifications.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [profileQuery, overview, activity, notifications]);

  return (
    <SpacePage refreshing={refreshing} onRefresh={accountLive ? () => void refresh() : undefined}>
      <SpaceHeader
        right={
          <>
            {accountLive ? <NotificationBell unread={unread} /> : null}
            <IconButton icon="settings-outline" label="Account settings" onPress={goSettings} />
          </>
        }
      />
      <SpaceTitle title="My Space" />

      <ProfileCard
        compact={compact}
        name={name}
        email={email}
        phone={phone}
        photo={profileImageUrl(profile)}
        emailVerified={profile?.email_verified === true}
        loading={profileQuery.isLoading}
        onEdit={goProfile}
      />
      {profileQuery.isError ? (
        <SpaceNotice
          text="We couldn't refresh your profile. Tap to try again."
          onPress={() => void profileQuery.refetch()}
        />
      ) : null}

      <StatRow>
        <StatCard
          icon="time-outline"
          label="Tool History"
          value={historyCount}
          loading={accountLive && activity.isLoading}
          onPress={goHistory}
        />
        <StatCard
          icon="calendar-outline"
          label="Bookings"
          value={bookingCount}
          loading={accountLive && overview.isLoading}
          onPress={goBookings}
        />
        <StatCard
          icon="alarm-outline"
          label="Upcoming"
          value={upcomingCount}
          loading={accountLive && overview.isLoading}
          onPress={goBookings}
        />
      </StatRow>
      {countsFailed ? (
        <SpaceNotice
          text="Some counts couldn't be loaded. Tap to try again."
          onPress={() => {
            if (overview.isError) void overview.refetch();
            if (activity.isError) void activity.refetch();
          }}
        />
      ) : null}

      <MenuCard>
        <MenuItem
          first
          icon="bookmark-outline"
          title="Saved Tools"
          subtitle="Your saved tool results, kept on the website"
          external
          onPress={() => void openWebsitePath('customerSavedTools')}
        />
        <MenuItem icon="time-outline" title="Tool History" subtitle="Your past tool results" onPress={goHistory} />
        <MenuItem
          icon="calendar-outline"
          title="My Bookings"
          subtitle="Your expert consultations"
          onPress={goBookings}
        />
        <MenuItem icon="people-outline" title="My Profile" subtitle="View and update your profile" onPress={goProfile} />
        <MenuItem
          icon="settings-outline"
          title="Account Settings"
          subtitle="App details, device data and notifications"
          onPress={goSettings}
        />
        <MenuItem
          icon="shield-checkmark-outline"
          title="Privacy & Security"
          subtitle="Password, signed-in device and policies"
          onPress={() => router.push('/account/security')}
        />
        <MenuItem icon="help-circle-outline" title="Help & Support" subtitle="Get assistance and FAQs" onPress={goHelp} />
      </MenuCard>

      <MenuCard label="More on the website">
        <MenuItem
          first
          icon="receipt-outline"
          title="Billing"
          subtitle="Payments and invoices"
          external
          onPress={() => void openWebsitePath('customerBilling')}
        />
        <MenuItem
          icon="gift-outline"
          title="Refer & Earn"
          subtitle="Yukti Points and referrals"
          external
          onPress={() => void openWebsitePath('customerReferEarn')}
        />
        <MenuItem
          icon="chatbubbles-outline"
          title="Message Support"
          subtitle="Chat with the YuktiOne team"
          external
          onPress={() => void openWebsitePath('customerSupportChat')}
        />
        <MenuItem
          icon="add-circle-outline"
          title="Additional Services"
          subtitle="Additional consultation services and payments"
          external
          onPress={() => void openWebsitePath('customerAdditionalServices')}
        />
      </MenuCard>

      <LogoutCard busy={signingOut} onPress={confirmSignOut} />
    </SpacePage>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: customer.canvas },
  scroll: { alignItems: 'center', paddingBottom: 28 },
  content: { paddingHorizontal: 16, gap: 18 },
  skeletonCard: { height: 128, borderRadius: 24 },
  skeletonStats: { height: 92, borderRadius: 18 },
  skeletonMenu: { height: 300, borderRadius: 20 },
});
