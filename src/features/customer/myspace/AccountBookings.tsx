import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatInr, formatWeekdayDate } from '@/features/customer/content';
import { useAccountScope, useMyBookings } from '@/features/customer/myspace/accountData';
import { Avatar, Card, EmptyNote, myspace } from '@/features/customer/myspace/parts';
import { ChipRow } from '@/features/customer/ui';
import type { MyBooking, StatusTone } from '@/services/api/mySpace';
import { openWebsitePath } from '@/services/website/openWebsite';
import { customer, customerFonts } from '@/theme';

const TONE: Record<StatusTone, { bg: string; ink: string }> = {
  success: { bg: customer.green, ink: customer.greenInk },
  warning: { bg: customer.gold, ink: customer.goldInk },
  error: { bg: customer.pink, ink: customer.danger },
  neutral: { bg: customer.chip, ink: customer.body },
};

function humanize(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  const spaced = text.replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function paymentTone(status: string | null): StatusTone {
  const value = status?.toLowerCase() ?? '';
  if (['paid', 'success', 'captured', 'completed'].includes(value)) return 'success';
  if (['failed', 'refunded', 'cancelled', 'canceled'].includes(value)) return 'error';
  if (value) return 'warning';
  return 'neutral';
}

function Badge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <View style={[styles.badge, { backgroundColor: TONE[tone].bg }]}>
      <Text style={[styles.badgeText, { color: TONE[tone].ink }]}>{label}</Text>
    </View>
  );
}

function AccountBookingCard({ booking }: { booking: MyBooking }) {
  const expertName = booking.professional?.name ?? 'YuktiOne professional';
  const when = booking.next_session ?? { date: booking.booking_date, time_slot: booking.time_slot };
  const service = [booking.service_name, humanize(booking.plan_type), humanize(booking.session_type)]
    .filter(Boolean)
    .join(' · ');
  const payment = humanize(booking.payment_status ?? booking.paid_status);

  return (
    <View style={styles.booking}>
      <View style={styles.bookingTop}>
        <Avatar name={expertName} uri={booking.professional?.photo_url} size={44} />
        <View style={styles.bookingWho}>
          <Text style={myspace.strong} numberOfLines={1}>{expertName}</Text>
          {booking.professional?.specialization ? (
            <Text style={myspace.meta} numberOfLines={1}>{booking.professional.specialization}</Text>
          ) : null}
        </View>
        <Badge label={humanize(booking.status) ?? 'Unknown'} tone={booking.status_tone} />
      </View>
      {service ? <Text style={myspace.body}>{service}</Text> : null}
      {when.date || when.time_slot ? (
        <View style={styles.line}>
          <Ionicons name="calendar-outline" size={15} color={customer.teal} />
          <Text style={styles.lineText}>
            {booking.next_session ? 'Next: ' : ''}
            {[when.date ? formatWeekdayDate(when.date) : null, when.time_slot].filter(Boolean).join(' · ')}
          </Text>
        </View>
      ) : null}
      {booking.sessions_total > 1 ? (
        <View style={styles.line}>
          <Ionicons name="layers-outline" size={15} color={customer.teal} />
          <Text style={styles.lineText}>
            {booking.sessions_completed} of {booking.sessions_total} sessions completed
          </Text>
        </View>
      ) : null}
      <View style={styles.payRow}>
        <Text style={styles.amount}>
          {booking.amount !== null ? formatInr(booking.amount) : 'Amount not recorded'}
        </Text>
        {payment ? <Badge label={`Payment: ${payment}`} tone={paymentTone(booking.payment_status)} /> : null}
      </View>
    </View>
  );
}

/** Bookings made on the YuktiOne website, read from GET /api/v1/my/bookings. */
export function AccountBookings() {
  const { enabled } = useAccountScope();
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const query = useMyBookings(scope);
  const pages = query.data?.pages ?? [];
  const bookings = pages.flatMap((page) => page.bookings);
  const counts = pages[0]?.counts;

  if (!enabled) {
    return (
      <Card title="Your bookings" source="account">
        <EmptyNote
          icon="log-in-outline"
          title="Sign in to see your bookings"
          body="Sessions you book on the YuktiOne website appear here once you sign in with the same account."
          actionLabel="Sign in"
          onAction={() => router.push('/auth')}
        />
      </Card>
    );
  }

  return (
    <Card
      title="Your bookings"
      source="account"
      action="Manage on website"
      onAction={() => void openWebsitePath('customerMyBookings')}
    >
      <ChipRow
        options={[
          { id: 'upcoming', label: counts ? `Upcoming (${counts.upcoming})` : 'Upcoming', icon: 'calendar-outline' },
          { id: 'past', label: counts ? `Past & cancelled (${counts.past})` : 'Past & cancelled', icon: 'time-outline' },
        ]}
        value={scope}
        onChange={setScope}
      />
      {query.isLoading ? (
        <ActivityIndicator color={customer.teal} style={styles.loader} />
      ) : query.isError ? (
        <EmptyNote
          icon="cloud-offline-outline"
          title="Could not load your bookings"
          body={query.error.message}
          actionLabel="Try again"
          onAction={() => void query.refetch()}
        />
      ) : bookings.length === 0 ? (
        <EmptyNote
          icon="calendar-clear-outline"
          title={scope === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
          body={
            scope === 'upcoming'
              ? 'When you book a session with a YuktiOne expert, it will show here.'
              : 'Completed and cancelled sessions will be listed here.'
          }
          actionLabel={scope === 'upcoming' ? 'Find an expert' : undefined}
          onAction={scope === 'upcoming' ? () => router.push('/(tabs)/experts') : undefined}
        />
      ) : (
        <>
          {bookings.map((booking) => (
            <AccountBookingCard key={booking.id} booking={booking} />
          ))}
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
                <Text style={styles.moreText}>Load more</Text>
              )}
            </Pressable>
          ) : null}
          <Text style={myspace.meta}>
            Joining, rescheduling and documents are handled on the website for now.
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  loader: { paddingVertical: 16 },
  booking: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.cream,
    padding: 12,
    gap: 8,
  },
  bookingTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookingWho: { flex: 1, gap: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontFamily: customerFonts.bold, fontSize: 11 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lineText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 13, color: customer.navy },
  payRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  amount: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.navy },
  more: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customer.teal,
  },
  moreText: { fontFamily: customerFonts.bold, fontSize: 13, color: customer.teal },
});
