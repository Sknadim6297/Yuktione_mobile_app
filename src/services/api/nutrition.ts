import { apiClient } from '@/services/api/client';
import { MySpaceRequestError } from '@/services/api/mySpace';
import type { ApiResult } from '@/services/api/types';

export type NutritionTotals = {
  calories_kcal: string | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fibre_g: string | null;
};

export type NutritionGoals = {
  track_only: boolean;
  calories_kcal: number | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
};

export type NutritionProgress = {
  meaningful: boolean;
  calories_goal_kcal: number | null;
  percent: number | null;
  ring_percent: number | null;
  remaining_kcal: string | null;
  track_only: boolean;
};

export type NutritionEntry = {
  id: number;
  nutrition_food_id: number | null;
  meal_type: string;
  meal_label: string;
  quantity: string;
  unit: string;
  portion_grams: string | null;
  food_name: string;
  brand: string | null;
  calories_kcal: string | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fibre_g: string | null;
  incomplete_nutrients: boolean;
  consumed_at: string;
  idempotency_key: string;
};

export type NutritionMealBlock = {
  key: string;
  label: string;
  totals: NutritionTotals;
  entry_count: number;
  entries: NutritionEntry[];
};

export type NutritionDashboard = {
  open: boolean;
  timezone: string;
  date: string;
  is_today: boolean;
  prev_date: string;
  next_date: string;
  meals: { key: string; label: string }[];
  catalogue_count: number;
  goals: NutritionGoals;
  totals: NutritionTotals;
  progress: NutritionProgress;
  has_entries: boolean;
  has_incomplete: boolean;
  by_meal: NutritionMealBlock[];
};

export type NutritionFoodServing = {
  id: number;
  label: string;
  quantity: string;
  unit: string;
  grams_equivalent: string | null;
};

export type NutritionFood = {
  id: number;
  name: string;
  brand: string | null;
  variant: string | null;
  preparation_state: string;
  reference_basis: string;
  calories_kcal: string | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fibre_g: string | null;
  category: { id: number; name: string } | null;
  servings: NutritionFoodServing[];
};

export type NutritionSearchResult = {
  q: string;
  catalogue_count: number;
  categories: { id: number; name: string; slug: string }[];
  states: { key: string; label: string }[];
  meals: { key: string; label: string }[];
  foods: NutritionFood[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export type NutritionPortionPreview = {
  portion_grams: string | null;
  calories_kcal: string | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fibre_g: string | null;
  incomplete: boolean;
  missing: string[];
};

export type NutritionInsights = {
  end: string;
  prev_end: string;
  timezone: string;
  goals: NutritionGoals;
  days: {
    date: string;
    label: string;
    calories_kcal: string | null;
    has_entries: boolean;
    incomplete: boolean;
    by_meal: Record<string, string | null>;
  }[];
};

export type NutritionCompactDashboard = {
  date: string;
  totals: NutritionTotals;
  progress: NutritionProgress;
  goals: NutritionGoals;
  has_entries: boolean;
  has_incomplete: boolean;
};

function fail(result: ApiResult<unknown>): never {
  if (result.ok) throw new MySpaceRequestError('Unexpected response.', 0);
  const firstField = result.error.errors ? Object.values(result.error.errors)[0]?.[0] : undefined;
  throw new MySpaceRequestError(firstField ?? result.error.message ?? 'Request failed.', result.status);
}

function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export async function fetchNutritionDashboard(date?: string): Promise<NutritionDashboard> {
  const result = await apiClient.get<NutritionDashboard & { status: string }>(
    `/my/nutrition/dashboard${query({ date })}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function fetchNutritionInsights(end?: string): Promise<NutritionInsights> {
  const result = await apiClient.get<NutritionInsights & { status: string }>(
    `/my/nutrition/insights${query({ end })}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function searchNutritionFoods(input: {
  q?: string;
  category?: string | number;
  state?: string;
  page?: number;
}): Promise<NutritionSearchResult> {
  const result = await apiClient.get<NutritionSearchResult & { status: string }>(
    `/my/nutrition/search${query(input)}`,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function fetchNutritionPortion(input: {
  foodId: number;
  quantity?: string;
  unit?: string;
  serving_id?: number | null;
}): Promise<{ food: NutritionFood; preview: NutritionPortionPreview | null; meals: { key: string; label: string }[] }> {
  const result = await apiClient.get<{
    status: string;
    food: NutritionFood;
    preview: NutritionPortionPreview | null;
    meals: { key: string; label: string }[];
  }>(
    `/my/nutrition/foods/${input.foodId}/portion${query({
      quantity: input.quantity,
      unit: input.unit,
      serving_id: input.serving_id ?? undefined,
    })}`,
  );
  if (!result.ok) fail(result);
  return { food: result.data.food, preview: result.data.preview, meals: result.data.meals };
}

export async function addNutritionEntry(input: {
  food_id: number;
  meal_type: string;
  quantity: string | number;
  unit: string;
  serving_id?: number | null;
  consumed_at?: string;
  idempotency_key: string;
}): Promise<{ created: boolean; entry: NutritionEntry; dashboard: NutritionCompactDashboard }> {
  const result = await apiClient.post<{
    status: string;
    created: boolean;
    entry: NutritionEntry;
    dashboard: NutritionCompactDashboard;
  }>('/my/nutrition/entries', input);
  if (!result.ok) fail(result);
  return {
    created: result.data.created,
    entry: result.data.entry,
    dashboard: result.data.dashboard,
  };
}

export async function updateNutritionEntry(
  id: number,
  input: { quantity: string | number; unit: string; meal_type?: string; serving_id?: number | null },
): Promise<{ entry: NutritionEntry; dashboard: NutritionCompactDashboard }> {
  const result = await apiClient.put<{
    status: string;
    entry: NutritionEntry;
    dashboard: NutritionCompactDashboard;
  }>(`/my/nutrition/entries/${id}`, input);
  if (!result.ok) fail(result);
  return { entry: result.data.entry, dashboard: result.data.dashboard };
}

export async function deleteNutritionEntry(id: number): Promise<{
  deleted: boolean;
  dashboard: NutritionCompactDashboard;
}> {
  const result = await apiClient.delete<{
    status: string;
    deleted: boolean;
    dashboard: NutritionCompactDashboard;
  }>(`/my/nutrition/entries/${id}`);
  if (!result.ok) fail(result);
  return { deleted: result.data.deleted, dashboard: result.data.dashboard };
}

export async function saveNutritionGoals(input: {
  track_only: boolean;
  calories_kcal?: number | null;
  protein_g?: string | number | null;
  carbs_g?: string | number | null;
  fat_g?: string | number | null;
}): Promise<{ goals: NutritionGoals; dashboard: NutritionCompactDashboard }> {
  const result = await apiClient.post<{
    status: string;
    goals: NutritionGoals;
    dashboard: NutritionCompactDashboard;
  }>('/my/nutrition/goals', input);
  if (!result.ok) fail(result);
  return { goals: result.data.goals, dashboard: result.data.dashboard };
}
