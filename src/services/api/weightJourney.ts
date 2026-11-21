import { apiClient } from '@/services/api/client';
import { MySpaceRequestError } from '@/services/api/mySpace';
import type { ApiResult } from '@/services/api/types';

export type WeightDirection = { key: string; label: string };

export type WeightGoal = {
  id: number;
  direction: string;
  direction_label: string;
  starting_weight_kg: string;
  target_weight_kg: string | null;
  starting_label: string;
  target_label: string | null;
  target_date: string | null;
  display_unit: string;
  status: string;
};

export type WeightMeasurement = {
  id: number;
  weight_kg: string;
  label: string;
  recorded_at: string;
  note: string | null;
  display_unit: string;
  idempotency_key: string;
};

export type WeightProgress = {
  percent: number | null;
  meaningful: boolean;
  reason?: string;
};

export type WeightChart = {
  points: { date: string; weight_kg: string; label: string }[];
  period: string;
  days: number;
  aggregation: string;
  start: string;
  end: string;
};

export type WeightSummary = {
  open: boolean;
  timezone: string;
  unit: string;
  weight_min_kg: string;
  weight_max_kg: string;
  note_max: number;
  directions: WeightDirection[];
  periods: string[];
  display_units: string[];
  goal: WeightGoal | null;
  starting: string | null;
  latest: string | null;
  target: string | null;
  net_kg: string | null;
  distance_kg: string | null;
  goal_starting: string | null;
  starting_label: string | null;
  latest_label: string | null;
  net_label: string | null;
  target_label: string | null;
  distance_label: string | null;
  goal_starting_label: string | null;
  progress: WeightProgress | null;
  latest_change: { kg: string; label: string | null } | null;
  latest_recorded_at: string | null;
  recent: WeightMeasurement[];
  chart: WeightChart;
};

export type WeightCompactSummary = {
  unit: string;
  starting: string | null;
  latest: string | null;
  target: string | null;
  net_kg: string | null;
  distance_kg: string | null;
  starting_label: string | null;
  latest_label: string | null;
  net_label: string | null;
  target_label: string | null;
  distance_label: string | null;
  progress: WeightProgress | null;
  goal: WeightGoal | null;
};

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

export async function fetchWeightSummary(): Promise<WeightSummary> {
  const result = await apiClient.get<WeightSummary & { status: string }>('/my/weight-journey/summary');
  if (!result.ok) fail(result);
  return result.data;
}

export async function fetchWeightChart(period: string): Promise<WeightChart> {
  const result = await apiClient.get<{ status: string; chart: WeightChart }>(
    `/my/weight-journey/chart${query({ period })}`,
  );
  if (!result.ok) fail(result);
  return result.data.chart;
}

export async function fetchWeightMeasurements(page = 1): Promise<{
  measurements: WeightMeasurement[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  unit: string;
}> {
  const result = await apiClient.get<{
    status: string;
    unit: string;
    measurements: WeightMeasurement[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }>(`/my/weight-journey/measurements${query({ page })}`);
  if (!result.ok) fail(result);
  return {
    measurements: result.data.measurements,
    meta: result.data.meta,
    unit: result.data.unit,
  };
}

export async function addWeightMeasurement(input: {
  weight: string | number;
  unit: string;
  idempotency_key: string;
  recorded_at?: string;
  note?: string;
}): Promise<{
  created: boolean;
  measurement: WeightMeasurement;
  summary: WeightCompactSummary;
}> {
  const result = await apiClient.post<{
    status: string;
    created: boolean;
    measurement: WeightMeasurement;
    summary: WeightCompactSummary;
  }>('/my/weight-journey/measurements', input);
  if (!result.ok) fail(result);
  return {
    created: result.data.created,
    measurement: result.data.measurement,
    summary: result.data.summary,
  };
}

export async function deleteWeightMeasurement(id: number): Promise<{
  deleted: boolean;
  summary: WeightCompactSummary;
}> {
  const result = await apiClient.delete<{
    status: string;
    deleted: boolean;
    summary: WeightCompactSummary;
  }>(`/my/weight-journey/measurements/${id}`);
  if (!result.ok) fail(result);
  return { deleted: result.data.deleted, summary: result.data.summary };
}

export async function saveWeightGoal(input: {
  direction: string;
  starting_weight: string | number;
  target_weight?: string | number | null;
  target_date?: string | null;
  display_unit: string;
}): Promise<{ goal: WeightGoal; summary: WeightCompactSummary }> {
  const result = await apiClient.post<{
    status: string;
    goal: WeightGoal;
    summary: WeightCompactSummary;
  }>('/my/weight-journey/goal', input);
  if (!result.ok) fail(result);
  return { goal: result.data.goal, summary: result.data.summary };
}
