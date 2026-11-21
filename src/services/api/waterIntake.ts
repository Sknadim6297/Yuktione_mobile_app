import { apiClient } from '@/services/api/client';
import { MySpaceRequestError } from '@/services/api/mySpace';
import type { ApiResult } from '@/services/api/types';

export type WaterQuickAdd = { ml: number; label: string };

export type WaterEntry = {
  id: number;
  amount_ml: number;
  consumed_at: string;
  idempotency_key: string;
};

export type WaterDashboardSnapshot = {
  date: string;
  total_ml: number;
  goal_ml: number;
  remaining_ml: number;
  percent: number;
  display_unit: string;
  total_label: string;
  goal_label: string;
  remaining_label: string;
};

export type WaterDashboard = WaterDashboardSnapshot & {
  open: boolean;
  quick_adds: WaterQuickAdd[];
  goal_min_ml: number;
  goal_max_ml: number;
  entry_min_ml: number;
  entry_max_ml: number;
  timezone: string;
  is_today: boolean;
  entries: WaterEntry[];
};

export type WaterWeekDay = {
  date: string;
  label: string;
  total_ml: number;
  goal_ml: number;
  has_entries: boolean;
  is_today: boolean;
};

export type WaterWeek = {
  open: boolean;
  end: string;
  timezone: string;
  average_ml: number | null;
  days: WaterWeekDay[];
};

function fail(result: ApiResult<unknown>): never {
  if (result.ok) throw new MySpaceRequestError('Unexpected response.', 0);
  const firstField = result.error.errors ? Object.values(result.error.errors)[0]?.[0] : undefined;
  throw new MySpaceRequestError(firstField ?? result.error.message ?? 'Request failed.', result.status);
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export async function fetchWaterDashboard(date?: string): Promise<WaterDashboard> {
  const result = await apiClient.get<WaterDashboard & { status: string }>(
    `/my/water-intake/dashboard${query({ date })}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function fetchWaterWeek(end?: string): Promise<WaterWeek> {
  const result = await apiClient.get<WaterWeek & { status: string }>(
    `/my/water-intake/week${query({ end })}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function addWaterEntry(input: {
  amount_ml: number;
  idempotency_key: string;
  consumed_at?: string;
}): Promise<{ created: boolean; entry: WaterEntry; dashboard: WaterDashboardSnapshot }> {
  const result = await apiClient.post<{
    status: string;
    created: boolean;
    entry: WaterEntry;
    dashboard: WaterDashboardSnapshot;
  }>('/my/water-intake/entries', input);
  if (!result.ok) fail(result);
  return { created: result.data.created, entry: result.data.entry, dashboard: result.data.dashboard };
}

export async function deleteWaterEntry(
  id: number,
): Promise<{ deleted: boolean; dashboard: WaterDashboardSnapshot }> {
  const result = await apiClient.delete<{
    status: string;
    deleted: boolean;
    dashboard: WaterDashboardSnapshot;
  }>(`/my/water-intake/entries/${id}`);
  if (!result.ok) fail(result);
  return { deleted: result.data.deleted, dashboard: result.data.dashboard };
}

export async function updateWaterSettings(input: {
  daily_goal_ml: number;
  display_unit: 'ml' | 'L';
}): Promise<{
  settings: { daily_goal_ml: number; display_unit: string };
  dashboard: WaterDashboardSnapshot;
}> {
  const result = await apiClient.patch<{
    status: string;
    settings: { daily_goal_ml: number; display_unit: string };
    dashboard: WaterDashboardSnapshot;
  }>('/my/water-intake/settings', input);
  if (!result.ok) fail(result);
  return { settings: result.data.settings, dashboard: result.data.dashboard };
}
