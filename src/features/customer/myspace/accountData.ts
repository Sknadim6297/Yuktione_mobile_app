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
  type MyNotificationsPage,
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
