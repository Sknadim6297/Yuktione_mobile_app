import { apiClient } from '@/services/api/client';
import { MySpaceRequestError } from '@/services/api/mySpace';
import type { ApiResult } from '@/services/api/types';

export type SkillsScaleOption = { value: number; label: string; emoji: string };

export type SkillsQuestion = {
  id: string;
  category: string;
  number: number | null;
  text: string;
};

export type SkillsCategory = {
  key: string;
  label: string;
  short: string;
  step: number;
  range_label: string;
};

export type SkillsOptions = {
  open: boolean;
  assessment_version: string;
  scoring_version: string;
  question_count: number;
  duration_label: string;
  category_count: number;
  categories: SkillsCategory[];
  category_order: string[];
  questions: SkillsQuestion[];
  scale: SkillsScaleOption[];
  disclaimer: string;
};

export type SkillsRanked = {
  key: string;
  label: string;
  short: string;
  percent: number;
  order: number;
};

export type SkillsResult = {
  assessment_version: string;
  scoring_version: string;
  percentages: Record<string, number>;
  totals: Record<string, number>;
  ranked: SkillsRanked[];
  strengths: SkillsRanked[];
  develop: SkillsRanked[];
  summary: string;
  meaning: string;
};

export type SkillsAttempt = SkillsResult & {
  id: number;
  completion_key: string;
  completed_at: string | null;
};

export type SkillsHistoryItem = {
  id: number;
  completed_at: string | null;
  strength_labels: string[];
  summary: string | null;
};

function fail(result: ApiResult<unknown>): never {
  if (result.ok) throw new MySpaceRequestError('Unexpected response.', 0);
  const firstField = result.error.errors ? Object.values(result.error.errors)[0]?.[0] : undefined;
  throw new MySpaceRequestError(firstField ?? result.error.message ?? 'Request failed.', result.status);
}

export async function fetchSkillsOptions(): Promise<SkillsOptions> {
  const result = await apiClient.get<SkillsOptions & { status: string }>(
    '/skills-strengths/options',
    false,
  );
  if (!result.ok) fail(result);
  return result.data;
}

export async function previewSkillsAssessment(answers: Record<string, number>): Promise<{
  saved: boolean;
  result: SkillsResult;
}> {
  const result = await apiClient.post<{ status: string; saved: boolean; result: SkillsResult }>(
    '/skills-strengths/preview',
    { answers },
    false,
  );
  if (!result.ok) fail(result);
  return { saved: result.data.saved, result: result.data.result };
}

export async function completeSkillsAssessment(input: {
  completion_key: string;
  answers: Record<string, number>;
}): Promise<{ created: boolean; attempt: SkillsAttempt }> {
  const result = await apiClient.post<{
    status: string;
    created: boolean;
    attempt: SkillsAttempt;
  }>('/my/skills-strengths/complete', input);
  if (!result.ok) fail(result);
  return { created: result.data.created, attempt: result.data.attempt };
}

export async function fetchSkillsHistory(page = 1): Promise<{
  attempts: SkillsHistoryItem[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const result = await apiClient.get<{
    status: string;
    attempts: SkillsHistoryItem[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }>(`/my/skills-strengths/history?page=${page}`);
  if (!result.ok) fail(result);
  return { attempts: result.data.attempts, meta: result.data.meta };
}

export async function fetchSkillsAttempt(id: number): Promise<SkillsAttempt> {
  const result = await apiClient.get<{ status: string; attempt: SkillsAttempt }>(
    `/my/skills-strengths/attempts/${id}`,
  );
  if (!result.ok) fail(result);
  return result.data.attempt;
}

export async function deleteSkillsAttempt(id: number): Promise<void> {
  const result = await apiClient.delete<{ status: string; deleted: boolean }>(
    `/my/skills-strengths/attempts/${id}`,
  );
  if (!result.ok) fail(result);
}
