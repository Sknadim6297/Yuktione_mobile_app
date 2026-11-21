import { apiClient } from '@/services/api/client';
import { MySpaceRequestError } from '@/services/api/mySpace';
import type { ApiResult } from '@/services/api/types';

export type TarotCategory = {
  key: string;
  label: string;
  lens: string;
  examples: string[];
  tone: string;
  emoji: string;
  blurb: string;
};

export type TarotSpread = {
  key: string;
  label: string;
  subtitle: string;
  count: number;
  positions: { key: string; label: string; prompt: string }[];
};

export type TarotOptions = {
  open: boolean;
  login_required: boolean;
  fan_size: number;
  question_min: number;
  question_max: number;
  draft_ttl_minutes: number;
  duration_label: string;
  categories: TarotCategory[];
  spreads: TarotSpread[];
  disclaimer: string;
  reversed_default: boolean;
};

export type TarotFan = {
  tokens: string[];
  needed: number;
  picked: number;
  positions: { key: string; label: string }[];
  nonce: string;
  selected_tokens: string[];
};

export type TarotCardReveal = {
  card_id: string;
  card_name: string;
  arcana: string;
  suit: string | null;
  number: string | null;
  position: string;
  position_label: string;
  position_order: number;
  is_reversed: boolean;
  orientation_label: string;
  core_meaning: string;
  insight: string;
  glyph: string;
  image_path: string | null;
};

export type TarotReading = {
  id?: number;
  completion_key?: string;
  category: string | null;
  category_label: string | null;
  question: string | null;
  spread_type: string;
  spread_label: string;
  reversed_enabled: boolean;
  overall_reflection: string | null;
  reflection_prompt: string;
  disclaimer: string;
  cards: TarotCardReveal[];
  created_at?: string | null;
};

export type TarotHistoryItem = {
  id: number;
  category: string;
  category_label: string;
  question: string;
  spread_type: string;
  spread_label: string;
  cards_count: number;
  created_at: string | null;
};

function fail(result: ApiResult<unknown>): never {
  if (result.ok) throw new MySpaceRequestError('Unexpected response.', 0);
  const firstField = result.error.errors ? Object.values(result.error.errors)[0]?.[0] : undefined;
  throw new MySpaceRequestError(firstField ?? result.error.message ?? 'Request failed.', result.status);
}

export async function fetchTarotOptions(): Promise<TarotOptions> {
  const result = await apiClient.get<TarotOptions & { status: string }>('/tarot/options', false);
  if (!result.ok) fail(result);
  return result.data;
}

export async function startTarotReading(completionKey?: string): Promise<{
  completion_key: string;
  step: string;
  expires_at: string;
}> {
  const result = await apiClient.post<{
    status: string;
    completion_key: string;
    step: string;
    expires_at: string;
  }>('/my/tarot/start', completionKey ? { completion_key: completionKey } : {});
  if (!result.ok) fail(result);
  return result.data;
}

export async function storeTarotCategory(input: {
  completion_key: string;
  category: string;
}): Promise<void> {
  const result = await apiClient.post('/my/tarot/category', input);
  if (!result.ok) fail(result);
}

export async function storeTarotQuestion(input: {
  completion_key: string;
  question: string;
}): Promise<{ question: string }> {
  const result = await apiClient.post<{ status: string; question: string }>(
    '/my/tarot/question',
    input,
  );
  if (!result.ok) fail(result);
  return { question: result.data.question };
}

export async function storeTarotSpread(input: {
  completion_key: string;
  spread_type: string;
  reversed_enabled?: boolean;
}): Promise<void> {
  const result = await apiClient.post('/my/tarot/spread', input);
  if (!result.ok) fail(result);
}

export async function fetchTarotFan(completionKey: string): Promise<TarotFan> {
  const result = await apiClient.post<{ status: string; fan: TarotFan }>('/my/tarot/fan', {
    completion_key: completionKey,
  });
  if (!result.ok) fail(result);
  return result.data.fan;
}

export async function pickTarotCard(input: {
  completion_key: string;
  slot_token: string;
  draw_nonce: string;
}): Promise<{ fan: TarotFan; complete: boolean }> {
  const result = await apiClient.post<{ status: string; fan: TarotFan; complete: boolean }>(
    '/my/tarot/pick',
    input,
  );
  if (!result.ok) fail(result);
  return { fan: result.data.fan, complete: result.data.complete };
}

export async function revealTarotReading(completionKey: string): Promise<{
  saved: boolean;
  reading: TarotReading;
  saved_reading_id: number | null;
}> {
  const result = await apiClient.post<{
    status: string;
    saved: boolean;
    reading: TarotReading;
    saved_reading_id: number | null;
  }>('/my/tarot/reveal', { completion_key: completionKey });
  if (!result.ok) fail(result);
  return {
    saved: result.data.saved,
    reading: result.data.reading,
    saved_reading_id: result.data.saved_reading_id,
  };
}

export async function saveTarotReading(completionKey: string): Promise<{
  created: boolean;
  reading: TarotReading;
}> {
  const result = await apiClient.post<{
    status: string;
    created: boolean;
    reading: TarotReading;
  }>('/my/tarot/save', { completion_key: completionKey });
  if (!result.ok) fail(result);
  return { created: result.data.created, reading: result.data.reading };
}

export async function fetchTarotHistory(page = 1): Promise<{
  readings: TarotHistoryItem[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const result = await apiClient.get<{
    status: string;
    readings: TarotHistoryItem[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }>(`/my/tarot/history?page=${page}`);
  if (!result.ok) fail(result);
  return { readings: result.data.readings, meta: result.data.meta };
}

export async function fetchTarotReading(id: number): Promise<TarotReading> {
  const result = await apiClient.get<{ status: string; reading: TarotReading }>(
    `/my/tarot/readings/${id}`,
  );
  if (!result.ok) fail(result);
  return result.data.reading;
}
