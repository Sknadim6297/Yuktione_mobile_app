import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';

import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import {
  fetchTool,
  fetchTools,
  type ApiExploreCategory,
  type ApiTool,
} from '@/services/api/catalog';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const TOOLS_LIVE = !FRONTEND_ONLY && isApiConfigured();

/** Website catalogue page size (ToolsCatalog::PER_PAGE). */
export const TOOLS_PAGE_SIZE = 12;

/** Website search input maxlength / Str::limit(q, 100). */
export const TOOLS_QUERY_MAX = 100;

export type ToolsCatalogue = { tools: ApiTool[]; exploreCategories: ApiExploreCategory[] };

export class ToolsRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * One cached GET /api/v1/tools for every screen that lists tools (Tools, Home, Explore).
 * Search and category filtering run on this list, exactly as ToolsCatalog::matches does on the website.
 */
export function useToolsCatalogue<T = ToolsCatalogue>(
  options: { select?: (data: ToolsCatalogue) => T; enabled?: boolean } = {},
) {
  const { select, enabled = true } = options;
  return useQuery({
    queryKey: ['v1', 'tools'],
    queryFn: async (): Promise<ToolsCatalogue> => {
      const result = await fetchTools();
      if (!result.ok) throw new ToolsRequestError(result.message, result.status);
      return { tools: result.tools, exploreCategories: result.exploreCategories };
    },
    select,
    enabled: TOOLS_LIVE && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export const selectTools = (data: ToolsCatalogue) => data.tools;

/** GET /api/v1/tools/{id-or-slug}; a 404 means the tool is unknown or not public. */
export function useToolDetail(identifier: string) {
  return useQuery({
    queryKey: ['v1', 'tool', identifier],
    queryFn: async () => {
      const result = await fetchTool(identifier);
      if (!result.ok) throw new ToolsRequestError(result.message, result.status);
      return result.tool;
    },
    enabled: TOOLS_LIVE && identifier !== '',
    retry: (failures, error) =>
      !(error instanceof ToolsRequestError && error.status === 404) && failures < 2,
  });
}

/** Mirrors the website filter normalisation: trim, strip tags, cap at 100 characters. */
export function normaliseQuery(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, TOOLS_QUERY_MAX);
}

/** Tools the website /tools page lists (older APIs without the flag list everything). */
export function websiteListed(tools: ApiTool[]): ApiTool[] {
  return tools.filter((tool) => tool.in_website_catalogue !== false);
}

function haystack(tool: ApiTool): string {
  const description = tool.catalogue_description ?? tool.description ?? '';
  return `${tool.name} ${description} ${tool.explore_category?.label ?? ''}`.toLocaleLowerCase();
}

export function matchesQuery(tool: ApiTool, query: string): boolean {
  if (query === '') return true;
  return haystack(tool).includes(query.toLocaleLowerCase());
}

export function matchesCategory(tool: ApiTool, category: string): boolean {
  return category === '' || tool.explore_category?.slug === category;
}

/** Per-category counts for the current search, ignoring the selected category (ToolsCatalog::counts). */
export function categoryCounts(
  tools: ApiTool[],
  categories: ApiExploreCategory[],
  query: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const category of categories) counts[category.slug] = 0;
  for (const tool of tools) {
    const slug = tool.explore_category?.slug;
    if (slug && slug in counts && matchesQuery(tool, query)) counts[slug] = (counts[slug] ?? 0) + 1;
  }
  return counts;
}

/** "All Tools (n)": the result total with no category, else the sum of category counts (tools-catalog.blade.php). */
export function allToolsCount(
  matchedTotal: number,
  counts: Record<string, number>,
  category: string,
): number {
  if (category === '') return matchedTotal;
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/** Website category icon keys (ExploreCatalog icon) → app icon set. */
const CATEGORY_ICONS: Record<string, IconName> = {
  grid: 'grid-outline',
  lotus: 'flower-outline',
  moon: 'moon-outline',
  heart: 'heart-outline',
  chart: 'trending-up-outline',
  coins: 'cash-outline',
  leaf: 'leaf-outline',
  family: 'people-outline',
  cup: 'cafe-outline',
  spark: 'sparkles-outline',
  bulb: 'bulb-outline',
  fitness: 'barbell-outline',
};

export function categoryIcon(icon: string | null | undefined): IconName {
  return (icon && CATEGORY_ICONS[icon]) || 'leaf-outline';
}

export function cardDescription(tool: ApiTool): string {
  return (
    tool.card_description?.trim() ||
    tool.description?.trim() ||
    'Open this tool for practical guidance and a clearer next step.'
  );
}

export type WebsiteAccessRule = 'guest-try' | 'login-to-use' | 'login-required';

/**
 * Website guest/login rules per tool (Frontend/*Controller guards and the auth:user tarot group).
 * guest-try: anyone can use it, Save and History need login.
 * login-to-use: the tracker dashboard needs a signed-in account.
 * login-required: every step is behind login.
 */
export const WEBSITE_ACCESS: Record<string, WebsiteAccessRule> = {
  'daily-mood-check-in': 'guest-try',
  'digital-journal': 'guest-try',
  'gratitude-journal': 'guest-try',
  'bmi-bmr-calculator': 'guest-try',
  'career-interest-test': 'guest-try',
  'skills-strengths-assessment': 'guest-try',
  'water-intake-tracker': 'login-to-use',
  'weight-journey': 'login-to-use',
  'calorie-nutrition-tracker': 'login-to-use',
  'tarot-reflection': 'login-required',
};

/** Filters survive leaving and re-entering the Tools tab, like the website's query string. */
let rememberedFilters = { query: '', category: '' };

export function getRememberedToolFilters() {
  return rememberedFilters;
}

export function rememberToolFilters(next: { query: string; category: string }) {
  rememberedFilters = next;
}
