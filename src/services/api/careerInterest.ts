import { apiClient } from '@/services/api/client';
import { MySpaceRequestError } from '@/services/api/mySpace';
import type { ApiResult } from '@/services/api/types';

export type CareerChoice = { key: string; label: string };

export type CareerScaleOption = { value: number; label: string; emoji: string };

export type CareerQuestion = { id: string; category: string; text: string };

export type CareerCategory = {
  key: string;
  label: string;
  kicker: string;
  description: string;
  step: number;
};

export type CareerOptions = {
  open: boolean;
  assessment_version: string;
  scoring_version: string;
  question_count: number;
  duration_label: string;
  category_count: number;
  categories: CareerCategory[];
  category_order: string[];
  questions: CareerQuestion[];
  scale: CareerScaleOption[];
  about: {
    age_groups: CareerChoice[];
    education: CareerChoice[];
    situations: CareerChoice[];
    geographies: CareerChoice[];
  };
  disclaimer: string;
};

export type CareerRanked = {
  key: string;
  label: string;
  description: string;
  percent: number;
  order: number;
};

export type CareerRecommendationItem = {
  id: string;
  title: string;
  summary: string;
  why: string;
  match_score: number;
};

export type CareerResult = {
  assessment_version: string;
  scoring_version: string;
  about: {
    age_group: string;
    education: string;
    situation: string;
    geography: string;
    age_group_label: string;
    education_label: string;
    situation_label: string;
    geography_label: string;
  };
  percentages: Record<string, number>;
  totals: Record<string, number>;
  ranked: CareerRanked[];
  top_categories: string[];
  interpretation: string;
  recommendations: {
    catalogue_version: string | null;
    disclaimer: string | null;
    items: CareerRecommendationItem[];
  };
};

export type CareerAttempt = CareerResult & {
  id: number;
  completion_key: string;
  completed_at: string | null;
  catalogue_version: string | null;
};

export type CareerHistoryItem = {
  id: number;
  completed_at: string | null;
  top_categories: string[];
  top_labels: string[];
  interpretation: string | null;
};

export type CareerAssessmentInput = {
  age_group: string;
  education: string;
  situation: string;
  geography: string;
  answers: Record<string, number>;
  completion_key?: string;
};

function fail(result: ApiResult<unknown>): never {
  if (result.ok) throw new MySpaceRequestError('Unexpected response.', 0);
  const firstField = result.error.errors ? Object.values(result.error.errors)[0]?.[0] : undefined;
  throw new MySpaceRequestError(firstField ?? result.error.message ?? 'Request failed.', result.status);
}

export async function fetchCareerOptions(): Promise<CareerOptions> {
  const result = await apiClient.get<CareerOptions & { status: string }>(
    '/career-interest/options',
    false,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function previewCareerAssessment(
  input: CareerAssessmentInput,
): Promise<{ saved: boolean; result: CareerResult }> {
  const result = await apiClient.post<{ status: string; saved: boolean; result: CareerResult }>(
    '/career-interest/preview',
    input,
    false,
  );
  if (!result.ok) fail(result);
  return { saved: result.data.saved, result: result.data.result };
}

export async function completeCareerAssessment(
  input: CareerAssessmentInput & { completion_key: string },
): Promise<{ created: boolean; attempt: CareerAttempt }> {
  const result = await apiClient.post<{
    status: string;
    created: boolean;
    attempt: CareerAttempt;
  }>('/my/career-interest/complete', input);
  if (!result.ok) fail(result);
  return { created: result.data.created, attempt: result.data.attempt };
}

export async function fetchCareerHistory(page = 1): Promise<{
  attempts: CareerHistoryItem[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const result = await apiClient.get<{
    status: string;
    attempts: CareerHistoryItem[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }>(`/my/career-interest/history?page=${page}`);
  if (!result.ok) fail(result);
  return { attempts: result.data.attempts, meta: result.data.meta };
}

export async function fetchCareerAttempt(id: number): Promise<CareerAttempt> {
  const result = await apiClient.get<{ status: string; attempt: CareerAttempt }>(
    `/my/career-interest/attempts/${id}`,
  );
  if (!result.ok) fail(result);
  return result.data.attempt;
}

export async function deleteCareerAttempt(id: number): Promise<void> {
  const result = await apiClient.delete<{ status: string; deleted: boolean }>(
    `/my/career-interest/attempts/${id}`,
  );
  if (!result.ok) fail(result);
}
