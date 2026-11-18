import { apiClient } from '@/services/api/client';
import type { ApiResult } from '@/services/api/types';

/** Read-only My Space data from /api/v1/my/* — the customer's own website records. */

export type PageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type StatusTone = 'success' | 'warning' | 'error' | 'neutral';

export type MyBooking = {
  id: number;
  service_name: string | null;
  sub_service_name: string | null;
  plan_type: string | null;
  session_type: string | null;
  booking_date: string | null;
  time_slot: string | null;
  status: string;
  status_tone: StatusTone;
  payment_status: string | null;
  paid_status: string | null;
  amount: number | null;
  currency: string;
  created_at: string | null;
  professional: {
    id: number;
    name: string;
    specialization: string | null;
    photo_url: string | null;
  } | null;
  sessions: { id: number; date: string | null; time_slot: string; status: string }[];
  sessions_total: number;
  sessions_completed: number;
  next_session: { date: string | null; time_slot: string | null } | null;
};

export type BookingScope = 'upcoming' | 'past' | 'all';

export type MyBookingsPage = {
  bookings: MyBooking[];
  counts: { all: number; upcoming: number; past: number };
  meta: PageMeta;
};

export type ActivityRange = { from: string; to: string; timezone: string };

export type MoodTone = 'positive' | 'neutral' | 'difficult';

export type ActivitySummary = {
  range: ActivityRange;
  mood: {
    count: number;
    active_days: number;
    distribution: { key: string; label: string; tone: MoodTone; count: number }[];
    daily: { date: string; count: number; mood_key: string }[];
    latest: { key: string; label: string | null; checked_in_at: string } | null;
  };
  journal: { count: number };
  gratitude: { count: number };
  all_time: { mood: number; journal: number; gratitude: number };
};

export type MoodEntry = {
  id: number;
  mood_key: string;
  mood_label: string | null;
  emotions: { key: string; label: string; tone: MoodTone }[];
  reflection: string | null;
  checked_in_at: string;
};

export type JournalEntry = {
  id: number;
  prompt_key: string | null;
  prompt_label: string | null;
  title: string | null;
  excerpt: string;
  written_at: string;
};

export type GratitudeEntry = {
  id: number;
  answers: { key: string; label: string; excerpt: string }[];
  written_at: string;
};

export type MyNotification = {
  id: string;
  title: string;
  message: string | null;
  kind: string | null;
  priority: string | null;
  service_name: string | null;
  booking_id: number | null;
  read: boolean;
  read_at: string | null;
  created_at: string | null;
};

export type MyNotificationsPage = {
  notifications: MyNotification[];
  unread_count: number;
  meta: PageMeta;
};

export class MySpaceRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function fail(result: ApiResult<unknown>): never {
  if (result.ok) throw new MySpaceRequestError('Unexpected response.', 0);
  const firstField = result.error.errors ? Object.values(result.error.errors)[0]?.[0] : undefined;
  throw new MySpaceRequestError(firstField ?? result.error.message ?? 'Request failed.', result.status);
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export async function fetchMyBookings(params: {
  scope: BookingScope;
  page?: number;
  perPage?: number;
}): Promise<MyBookingsPage> {
  const result = await apiClient.get<MyBookingsPage & { status: string }>(
    `/my/bookings${query({ scope: params.scope, page: params.page, per_page: params.perPage })}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function fetchActivitySummary(range: { from: string; to: string }): Promise<ActivitySummary> {
  const result = await apiClient.get<ActivitySummary & { status: string }>(
    `/my/activity/summary${query(range)}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

type EntriesPage<T> = { range: ActivityRange; entries: T[]; meta: PageMeta };

async function fetchEntries<T>(
  path: string,
  params: { from: string; to: string; page?: number; perPage?: number },
): Promise<EntriesPage<T>> {
  const result = await apiClient.get<EntriesPage<T> & { status: string }>(
    `${path}${query({ from: params.from, to: params.to, page: params.page, per_page: params.perPage })}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export const fetchMoodEntries = (params: { from: string; to: string; page?: number; perPage?: number }) =>
  fetchEntries<MoodEntry>('/my/mood-checkins', params);

export const fetchJournalEntries = (params: { from: string; to: string; page?: number; perPage?: number }) =>
  fetchEntries<JournalEntry>('/my/journal-entries', params);

export const fetchGratitudeEntries = (params: { from: string; to: string; page?: number; perPage?: number }) =>
  fetchEntries<GratitudeEntry>('/my/gratitude-entries', params);

export type PsychologyOptions = {
  mood: {
    open: boolean;
    moods: { key: string; label: string; caption: string; tone: MoodTone }[];
    emotion_groups: { tone: MoodTone; emotions: { key: string; label: string }[] }[];
    min_emotions: number;
    max_emotions: number;
    reflection_max: number;
  };
  journal: {
    open: boolean;
    prompts: { key: string; label: string; question: string | null }[];
    title_max: number;
    body_max: number;
  };
  gratitude: {
    open: boolean;
    cards: { key: string; label: string; hint: string | null; question: string | null }[];
    min_answered: number;
    answer_max: number;
  };
};

export type SaveResult<T> = { created: boolean; entry: T };

export async function fetchPsychologyOptions(): Promise<PsychologyOptions> {
  const result = await apiClient.get<PsychologyOptions & { status: string }>('/my/psychology/options');
  if (!result.ok) fail(result);
  return result.data;
}

async function saveEntry<T>(path: string, body: Record<string, unknown>): Promise<SaveResult<T>> {
  const result = await apiClient.post<SaveResult<T> & { status: string }>(path, body);
  if (!result.ok) fail(result);
  return { created: result.data.created, entry: result.data.entry };
}

/** completion_key is generated once per entry so a retry never saves (or rewards) twice. */
export const saveMoodCheckin = (input: {
  completion_key: string;
  mood: string;
  emotions: string[];
  reflection?: string;
}) => saveEntry<MoodEntry>('/my/mood-checkins', input);

export const saveJournalEntry = (input: {
  completion_key: string;
  prompt_key: string;
  title?: string;
  body: string;
}) => saveEntry<JournalEntry>('/my/journal-entries', input);

export const saveGratitudeEntry = (input: { completion_key: string; answers: Record<string, string> }) =>
  saveEntry<GratitudeEntry>('/my/gratitude-entries', input);

export async function fetchMyNotifications(params: {
  page?: number;
  perPage?: number;
  filter?: 'all' | 'unread';
}): Promise<MyNotificationsPage> {
  const result = await apiClient.get<MyNotificationsPage & { status: string }>(
    `/my/notifications${query({ page: params.page, per_page: params.perPage, filter: params.filter })}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function markNotificationRead(
  id: string,
): Promise<{ notification: MyNotification; unread_count: number }> {
  const result = await apiClient.post<{ status: string; notification: MyNotification; unread_count: number }>(
    `/my/notifications/${encodeURIComponent(id)}/read`,
  );
  if (!result.ok) fail(result);
  return result.data;
}
