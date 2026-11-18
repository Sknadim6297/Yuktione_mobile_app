import { apiClient } from '@/services/api/client';
import type { ApiResult } from '@/services/api/types';

export type ApiToolCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  display_order: number;
};

export type ApiTool = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon?: string | null;
  /** Website tool illustration (absolute URL), null when the website has none. */
  image_url?: string | null;
  access_type: 'free' | 'paid' | string;
  status: string;
  status_label?: string;
  display_order: number;
  module_key?: string;
  is_implemented: boolean;
  can_launch_web: boolean;
  mobile_ready: boolean;
  mobile_message?: string | null;
  category?: { id: number; name: string; slug: string } | null;
  route_name?: string;
};

export type ApiExpert = {
  id: number;
  name: string;
  specialization?: string | null;
  experience?: string | null;
  experience_key?: string | null;
  education?: string | null;
  bio?: string | null;
  starting_price?: number | null;
  currency?: string;
  rating?: number | null;
  review_count: number;
  photo_url?: string | null;
  services: string[];
  verified: boolean;
  status: string;
  active: boolean;
  session_rates?: {
    id: number;
    session_type: string;
    num_sessions: number;
    rate_per_session: number;
    final_rate: number;
    duration: string;
  }[];
};

export type ApiProgrammeEvent = {
  id: number;
  heading: string;
  mini_heading: string;
  short_description: string;
  date: string;
  time?: string | null;
  starting_fees?: number | null;
  currency: string;
  show_on_homepage: boolean;
  card_image?: string | null;
  card_image_url?: string | null;
  kind: 'website_event';
  enrolment_supported: boolean;
  progress_supported: boolean;
  mobile_note: string;
  professional?: { id: number; name: string } | null;
};

function messageFrom(result: ApiResult<unknown>): string {
  if (result.ok) return 'Unexpected response.';
  if (result.status === 0) {
    return result.error.message ?? 'Network request failed.';
  }
  return result.error.message ?? 'Request failed.';
}

export async function fetchToolCategories(): Promise<
  | { ok: true; categories: ApiToolCategory[] }
  | { ok: false; message: string }
> {
  const result = await apiClient.get<{ status: string; categories: ApiToolCategory[] }>(
    '/tool-categories',
    false,
    'v1',
  );
  if (!result.ok) return { ok: false, message: messageFrom(result) };
  return { ok: true, categories: result.data.categories ?? [] };
}

export async function fetchTools(params?: {
  q?: string;
  category?: string;
}): Promise<{ ok: true; tools: ApiTool[] } | { ok: false; message: string }> {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category) search.set('category', params.category);
  const qs = search.toString();
  const result = await apiClient.get<{ status: string; tools: ApiTool[] }>(
    `/tools${qs ? `?${qs}` : ''}`,
    false,
    'v1',
  );
  if (!result.ok) return { ok: false, message: messageFrom(result) };
  return { ok: true, tools: result.data.tools ?? [] };
}

export async function fetchTool(
  identifier: string | number,
): Promise<{ ok: true; tool: ApiTool } | { ok: false; message: string; status: number }> {
  const result = await apiClient.get<{ status: string; tool: ApiTool }>(
    `/tools/${identifier}`,
    false,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFrom(result), status: result.status };
  }
  return { ok: true, tool: result.data.tool };
}

/** Website "Explore by Need" category (ExploreCatalog::CATEGORIES). */
export type ApiExpertCategory = {
  slug: string;
  label: string;
  image_url?: string | null;
};

export async function fetchExperts(params?: {
  q?: string;
  specialty?: string;
  /** ApiExpertCategory slug, filtered with the website's category rules. */
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<
  | { ok: true; experts: ApiExpert[]; categories: ApiExpertCategory[] }
  | { ok: false; message: string }
> {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.specialty) search.set('specialty', params.specialty);
  if (params?.category) search.set('category', params.category);
  if (params?.featured) search.set('featured', '1');
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const result = await apiClient.get<{
    status: string;
    experts: ApiExpert[];
    categories?: ApiExpertCategory[];
  }>(`/experts${qs ? `?${qs}` : ''}`, false, 'v1');
  if (!result.ok) return { ok: false, message: messageFrom(result) };
  return { ok: true, experts: result.data.experts ?? [], categories: result.data.categories ?? [] };
}

export async function fetchExpert(
  id: number | string,
): Promise<{ ok: true; expert: ApiExpert } | { ok: false; message: string; status: number }> {
  const result = await apiClient.get<{ status: string; expert: ApiExpert }>(
    `/experts/${id}`,
    false,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFrom(result), status: result.status };
  }
  return { ok: true, expert: result.data.expert };
}

export async function fetchProgrammeEvents(params?: {
  homepage?: boolean;
  /** ApiExpertCategory slug, matched with the website's programme keywords. */
  category?: string;
}): Promise<
  | {
      ok: true;
      events: ApiProgrammeEvent[];
      dayBasedProgrammesAvailable: boolean;
    }
  | { ok: false; message: string }
> {
  const search = new URLSearchParams();
  if (params?.homepage) search.set('homepage', '1');
  if (params?.category) search.set('category', params.category);
  const qs = search.toString() ? `?${search.toString()}` : '';
  const result = await apiClient.get<{
    status: string;
    events: ApiProgrammeEvent[];
    day_based_programmes_available: boolean;
  }>(`/programme-events${qs}`, false, 'v1');
  if (!result.ok) return { ok: false, message: messageFrom(result) };
  return {
    ok: true,
    events: result.data.events ?? [],
    dayBasedProgrammesAvailable: Boolean(result.data.day_based_programmes_available),
  };
}
