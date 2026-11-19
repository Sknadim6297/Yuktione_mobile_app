import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { customerActions, useCustomerState } from '@/features/customer/store';
import {
  MySpaceRequestError,
  fetchActivitySummary,
  fetchGratitudeEntries,
  fetchJournalEntries,
  fetchMoodEntries,
  fetchMyBookings,
  fetchMyNotifications,
  fetchPsychologyOptions,
  markNotificationRead,
  type BookingScope,
  type GratitudeEntry,
  type JournalEntry,
  type MoodEntry,
  type MyBooking,
  type MyNotificationsPage,
  type PageMeta,
} from '@/services/api/mySpace';
import { clearAuthToken } from '@/services/api/tokenStorage';

export type RangeDays = 7 | 30 | 90;

/** YYYY-MM-DD in India time — the website and /api/v1/my/* count days in Asia/Kolkata. */
function indiaDate(date: Date): string {
  return new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/** "15 Mar, 11:30 am" for API timestamps (sent with an offset). */
export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** YYYY-MM-DD as the website prints session dates ('M d, Y'): "Mar 05, 2026". */
export function formatSlotDate(date: string | null | undefined): string {
  if (!date) return 'Date unavailable';
  const [year, month, day] = date.slice(0, 10).split('-');
  const name = MONTHS[Number(month) - 1];
  return name && day && year ? `${name} ${day}, ${year}` : date;
}

const AGO_UNITS: [string, number][] = [
  ['year', 365 * 86_400],
  ['month', 30 * 86_400],
  ['week', 7 * 86_400],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

/** Carbon diffForHumans() wording used on the website: "3 days ago". */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(1, Math.round(Math.abs(now - then) / 1000));
  const [unit, size] = AGO_UNITS.find(([, length]) => seconds >= length) ?? ['second', 1];
  const count = Math.floor(seconds / size);
  return `${count} ${unit}${count === 1 ? '' : 's'} ${now >= then ? 'ago' : 'from now'}`;
}

export type BadgeTone = 'success' | 'warning' | 'error' | 'neutral';

/** Same mapping and label as the website status badge (components/tazen-v2/panel/status-badge). */
export function statusBadge(status: string | null | undefined): { label: string; tone: BadgeTone } {
  const normalized = (status ?? '').trim().toLowerCase();
  const tone: BadgeTone = ['completed', 'paid', 'confirmed', 'approved', 'success', 'active'].includes(normalized)
    ? 'success'
    : ['pending', 'processing', 'rescheduled'].includes(normalized)
      ? 'warning'
      : ['cancelled', 'canceled', 'failed', 'rejected', 'error'].includes(normalized)
        ? 'error'
        : 'neutral';
  const label = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Unknown';
  return { label, tone };
}

export function rangeForDays(days: RangeDays): { from: string; to: string } {
  const now = new Date();
  return {
    from: indiaDate(new Date(now.getTime() - (days - 1) * 86_400_000)),
    to: indiaDate(now),
  };
}

/**
 * Only a Laravel-backed session reads account data. The user id is part of every
 * cache key so one account never sees another account's cached rows.
 */
export function useAccountScope() {
  const session = useCustomerState().session;
  const userId = session?.source === 'api' ? session.userId : undefined;
  return {
    userId,
    enabled: Boolean(userId) && !FRONTEND_ONLY && isApiConfigured(),
  };
}

async function guarded<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof MySpaceRequestError && error.status === 401) {
      await clearAuthToken();
      customerActions.signOut();
    }
    throw error;
  }
}

const retry = (count: number, error: Error) =>
  !(error instanceof MySpaceRequestError && error.status >= 400 && error.status < 500) && count < 2;

export function useMyBookings(scope: BookingScope) {
  const { userId, enabled } = useAccountScope();
  return useInfiniteQuery({
    queryKey: ['v1', 'my', userId, 'bookings', scope],
    queryFn: ({ pageParam }) => guarded(() => fetchMyBookings({ scope, page: pageParam, perPage: 10 })),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
    enabled,
    retry,
  });
}

export type UpcomingSlot = {
  key: string;
  booking: MyBooking;
  date: string;
  time_slot: string;
  status: string;
};

export type BookingOverview = {
  /** Session rows dated today or later with status pending/confirmed, soonest first. */
  upcomingSlots: UpcomingSlot[];
  todayCount: number;
  /** Booking records read (each booking can hold several sessions). */
  bookingCount: number;
  totalSessions: number;
  completedSessions: number;
  /** Five most recently created bookings. */
  recent: MyBooking[];
  /** True when the account has more bookings than the overview reads. */
  partial: boolean;
};

const OVERVIEW_PAGE_SIZE = 20;
const OVERVIEW_MAX_PAGES = 25;

/**
 * Same figures as the website customer dashboard (customer/index.blade.php), which counts
 * session rows (booking_timedates), not bookings: upcoming = date >= today and status
 * pending/confirmed; total = all session rows; completed = rows marked completed.
 */
export function summariseBookings(bookings: MyBooking[], today: string): Omit<BookingOverview, 'partial'> {
  const upcomingSlots: UpcomingSlot[] = [];
  let totalSessions = 0;
  let completedSessions = 0;
  for (const booking of bookings) {
    totalSessions += booking.sessions.length;
    for (const slot of booking.sessions) {
      if (slot.status === 'completed') completedSessions += 1;
      if (slot.date && slot.date >= today && (slot.status === 'pending' || slot.status === 'confirmed')) {
        upcomingSlots.push({
          key: `${booking.id}-${slot.id}`,
          booking,
          date: slot.date,
          time_slot: slot.time_slot,
          status: slot.status,
        });
      }
    }
  }
  upcomingSlots.sort((a, b) => `${a.date} ${a.time_slot}`.localeCompare(`${b.date} ${b.time_slot}`));
  return {
    upcomingSlots,
    todayCount: upcomingSlots.filter((slot) => slot.date === today).length,
    bookingCount: bookings.length,
    totalSessions,
    completedSessions,
    recent: bookings.slice(0, 5),
  };
}

export function useBookingOverview() {
  const { userId, enabled } = useAccountScope();
  return useQuery({
    queryKey: ['v1', 'my', userId, 'bookings', 'overview'],
    queryFn: () =>
      guarded(async (): Promise<BookingOverview> => {
        const bookings: MyBooking[] = [];
        let page = 1;
        let lastPage = 1;
        do {
          const result = await fetchMyBookings({ scope: 'all', page, perPage: OVERVIEW_PAGE_SIZE });
          bookings.push(...result.bookings);
          lastPage = result.meta.last_page;
          page += 1;
        } while (page <= lastPage && page <= OVERVIEW_MAX_PAGES);
        return { ...summariseBookings(bookings, indiaDate(new Date())), partial: lastPage > OVERVIEW_MAX_PAGES };
      }),
    enabled,
    retry,
  });
}

export type HistoryKind = 'moods' | 'journal' | 'gratitude';

type HistoryPage =
  | { kind: 'moods'; entries: MoodEntry[]; meta: PageMeta }
  | { kind: 'journal'; entries: JournalEntry[]; meta: PageMeta }
  | { kind: 'gratitude'; entries: GratitudeEntry[]; meta: PageMeta };

/** The API accepts at most 366 days per request. */
export const HISTORY_DAYS = 366;

/**
 * Newest-first saved entries for one psychology tool. The key's 4th segment matches
 * useSaveEntry's invalidation set, so a new save refreshes this list too.
 */
export function useToolHistory(kind: HistoryKind, perPage = 15) {
  const { userId, enabled } = useAccountScope();
  const now = new Date();
  const range = {
    from: indiaDate(new Date(now.getTime() - (HISTORY_DAYS - 1) * 86_400_000)),
    to: indiaDate(now),
  };
  return useInfiniteQuery({
    queryKey: ['v1', 'my', userId, kind, 'history', range.from, range.to, perPage],
    queryFn: ({ pageParam }): Promise<HistoryPage> =>
      guarded(async () => {
        const params = { ...range, page: pageParam, perPage };
        if (kind === 'moods') {
          const result = await fetchMoodEntries(params);
          return { kind, entries: result.entries, meta: result.meta };
        }
        if (kind === 'journal') {
          const result = await fetchJournalEntries(params);
          return { kind, entries: result.entries, meta: result.meta };
        }
        const result = await fetchGratitudeEntries(params);
        return { kind, entries: result.entries, meta: result.meta };
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
    enabled,
    retry,
  });
}

export function useActivitySummary(days: RangeDays) {
  const { userId, enabled } = useAccountScope();
  const range = rangeForDays(days);
  return useQuery({
    queryKey: ['v1', 'my', userId, 'activity', range.from, range.to],
    queryFn: () => guarded(() => fetchActivitySummary(range)),
    enabled,
    retry,
  });
}

export function useRecentEntries(days: RangeDays, limit = 3) {
  const { userId, enabled } = useAccountScope();
  const range = rangeForDays(days);
  const params = { ...range, perPage: limit };
  const moods = useQuery({
    queryKey: ['v1', 'my', userId, 'moods', range.from, range.to, limit],
    queryFn: () => guarded(() => fetchMoodEntries(params)),
    enabled,
    retry,
  });
  const journal = useQuery({
    queryKey: ['v1', 'my', userId, 'journal', range.from, range.to, limit],
    queryFn: () => guarded(() => fetchJournalEntries(params)),
    enabled,
    retry,
  });
  const gratitude = useQuery({
    queryKey: ['v1', 'my', userId, 'gratitude', range.from, range.to, limit],
    queryFn: () => guarded(() => fetchGratitudeEntries(params)),
    enabled,
    retry,
  });
  return { moods, journal, gratitude };
}

export function usePsychologyOptions() {
  const { userId, enabled } = useAccountScope();
  return useQuery({
    queryKey: ['v1', 'my', userId, 'psychology-options'],
    queryFn: () => guarded(fetchPsychologyOptions),
    enabled,
    retry,
    staleTime: 10 * 60_000,
  });
}

/** Random v4 UUID used as the entry's completion key (idempotency, not a secret). */
export function newCompletionKey(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

const ACTIVITY_KEYS = new Set(['activity', 'moods', 'journal', 'gratitude']);

/** Saves through the website recorders, then refreshes Progress, Reports and My Space. */
export function useSaveEntry<TInput, TResult>(save: (input: TInput) => Promise<TResult>) {
  const { userId } = useAccountScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => guarded(() => save(input)),
    // Offline must fail with "Not saved" rather than pause silently and send later.
    networkMode: 'always',
    onSuccess: () =>
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'v1' &&
          query.queryKey[1] === 'my' &&
          query.queryKey[2] === userId &&
          ACTIVITY_KEYS.has(String(query.queryKey[3])),
      }),
  });
}

export function useMyNotifications(perPage = 20) {
  const { userId, enabled } = useAccountScope();
  return useInfiniteQuery({
    queryKey: ['v1', 'my', userId, 'notifications', perPage],
    queryFn: ({ pageParam }) => guarded(() => fetchMyNotifications({ page: pageParam, perPage })),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
    enabled,
    retry,
  });
}

export function useMarkNotificationRead() {
  const { userId } = useAccountScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => guarded(() => markNotificationRead(id)),
    onSuccess: ({ notification, unread_count }) => {
      queryClient.setQueriesData<{ pages: MyNotificationsPage[]; pageParams: unknown[] }>(
        { queryKey: ['v1', 'my', userId, 'notifications'] },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              unread_count,
              notifications: page.notifications.map((item) =>
                item.id === notification.id ? notification : item,
              ),
            })),
          },
      );
    },
  });
}
