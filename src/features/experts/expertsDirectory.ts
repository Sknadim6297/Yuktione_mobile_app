import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import {
  fetchExpert,
  fetchExperts,
  type ApiExpert,
  type ApiExpertCategory,
  type ApiExpertsMeta,
} from '@/services/api/catalog';

export const EXPERTS_LIVE = !FRONTEND_ONLY && isApiConfigured();

export const EXPERTS_PAGE_SIZE = 20;

/** Website search input maxlength (experts.blade.php). */
export const EXPERTS_QUERY_MAX = 100;

const SEARCH_DEBOUNCE_MS = 300;

export type ExpertSort = 'newest' | 'rating' | 'price_asc' | 'price_desc';

export const SORT_LABELS: Record<ExpertSort, string> = {
  newest: 'Newest',
  rating: 'Highest rated',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
};

export type ExpertFilters = { experience: string; sort: ExpertSort };

export const DEFAULT_FILTERS: ExpertFilters = { experience: '', sort: 'newest' };

export function normaliseQuery(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, EXPERTS_QUERY_MAX);
}

export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type DirectoryPage = {
  experts: ApiExpert[];
  categories: ApiExpertCategory[];
  experienceBuckets: Record<string, string>;
  meta: ApiExpertsMeta | null;
};

/**
 * Pages of one (search, category) pair. React Query dedupes identical keys and only
 * the response for the current key is rendered, so slower stale responses never win.
 */
export function useExpertsDirectory(query: string, category: string) {
  return useInfiniteQuery({
    queryKey: ['v1', 'experts', 'directory', query, category],
    queryFn: async ({ pageParam }): Promise<DirectoryPage> => {
      const result = await fetchExperts({
        q: query || undefined,
        category: category || undefined,
        limit: EXPERTS_PAGE_SIZE,
        page: pageParam,
      });
      if (!result.ok) throw new Error(result.message);
      return {
        experts: result.experts,
        categories: result.categories,
        experienceBuckets: result.experienceBuckets,
        meta: result.meta,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta && last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
    enabled: EXPERTS_LIVE,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useExpertDetail(id: string) {
  return useQuery({
    queryKey: ['v1', 'experts', 'detail', id],
    queryFn: async () => {
      const result = await fetchExpert(id);
      if (!result.ok) {
        const error = new Error(result.message) as Error & { status?: number };
        error.status = result.status;
        throw error;
      }
      return result.expert;
    },
    enabled: EXPERTS_LIVE && /^\d+$/.test(id),
    retry: (count, error) => (error as { status?: number }).status !== 404 && count < 2,
  });
}

export function hasReviews(expert: ApiExpert): boolean {
  return expert.review_count > 0 && typeof expert.rating === 'number' && expert.rating > 0;
}

/** Client-side refinement of the loaded results with the API's own experience keys. */
export function refineExperts(experts: ApiExpert[], filters: ExpertFilters): ApiExpert[] {
  const list = filters.experience
    ? experts.filter((expert) => expert.experience_key === filters.experience)
    : [...experts];
  if (filters.sort === 'newest') return list;
  const price = (expert: ApiExpert) =>
    typeof expert.starting_price === 'number' && expert.starting_price > 0 ? expert.starting_price : null;
  return list.sort((a, b) => {
    if (filters.sort === 'rating') {
      return (hasReviews(b) ? (b.rating ?? 0) : -1) - (hasReviews(a) ? (a.rating ?? 0) : -1);
    }
    const pa = price(a);
    const pb = price(b);
    if (pa === null && pb === null) return 0;
    if (pa === null) return 1;
    if (pb === null) return -1;
    return filters.sort === 'price_asc' ? pa - pb : pb - pa;
  });
}

export function activeFilterCount(filters: ExpertFilters): number {
  return (filters.experience ? 1 : 0) + (filters.sort !== DEFAULT_FILTERS.sort ? 1 : 0);
}

/** Service names that add something beyond the specialization line (website card "topics"). */
export function expertTopics(expert: ApiExpert, max = 2): string[] {
  const keyOf = (value: string) => value.trim().toLowerCase().replace(/s$/, '');
  const role = keyOf(expert.specialization ?? '');
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const raw of expert.services) {
    const label = raw.trim();
    const key = keyOf(label);
    if (!label || key === role || seen.has(key)) continue;
    seen.add(key);
    topics.push(label);
    if (topics.length >= max) break;
  }
  return topics;
}

export function expertRole(expert: ApiExpert): string {
  return (expert.specialization ?? '').trim() || (expert.services[0] ?? '').trim();
}

/** Profiles outside the website buckets store raw values such as "4" or "30year". */
export function experienceLabel(label: string | null | undefined): string {
  const value = (label ?? '').trim();
  const bare = value.match(/^(\d+(?:\.\d+)?\+?)\s*(?:years?|yrs?)?$/i);
  if (!bare?.[1]) return value;
  return `${bare[1]} ${bare[1] === '1' ? 'year' : 'years'}`;
}

/** "2–4 years" → "2–4 yrs", as on the website card. */
export function shortExperience(label: string | null | undefined): string {
  return experienceLabel(label).replace(/\s*years?$/i, ' yrs');
}

export function formatPrice(amount: number | null | undefined): string | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Laravel Str::slug equivalent for the profile URL segment. */
function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Website route professionals.details (the expert's public profile URL). */
export function expertWebsitePath(expert: Pick<ApiExpert, 'id' | 'name'>): string {
  const slug = slugify(expert.name);
  return `/professionals/details/${expert.id}${slug ? `/${slug}` : ''}`;
}
