import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { fetchProgrammeEvents } from '@/services/api/catalog';
import { EXPERTS_LIVE } from '@/features/experts/expertsDirectory';

/** Website CategoryHub::DISPLAY_LABELS — keys are ExploreCatalog::CATEGORIES slugs. */
export const CATEGORY_LABELS: Record<string, string> = {
  'mental-health': 'Mental Wellbeing',
  'astrology-tarot': 'Astrology & Tarot',
  relationships: 'Relationships',
  'career-business': 'Career',
  'money-finance': 'Finance',
  'health-wellness': 'Health & Wellness',
  parenting: 'Parenting',
  lifestyle: 'Lifestyle & More',
  spirituality: 'Spirituality',
  creativity: 'Creativity',
  'nutrition-fitness': 'Nutrition & Fitness',
};

/** Website CategoryHub::TAGLINES. */
export const CATEGORY_TAGLINES: Record<string, string> = {
  'mental-health': 'Support for a calmer, stronger you',
  'astrology-tarot': 'Reflective insight for clarity and direction',
  relationships: 'Guidance for healthier, more connected bonds',
  'career-business': 'Clarity for work, growth, and next steps',
  'money-finance': 'Practical support for calmer money decisions',
  'health-wellness': 'Everyday wellness for a brighter balance',
  parenting: 'Support for raising children with confidence',
  lifestyle: 'Inspiration for living with intention',
  spirituality: 'Space for grounding, meaning, and stillness',
  creativity: 'Spark ideas and creative momentum',
  'nutrition-fitness': 'Fuel and movement for a healthier you',
};

export type CategoryTab = 'tools' | 'experts' | 'programmes';

export const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: 'tools', label: 'Tools' },
  { key: 'experts', label: 'Experts' },
  { key: 'programmes', label: 'Programmes' },
];

/** Website CategoryController::show — unknown tabs fall back to Tools. */
export function normaliseTab(raw: string | undefined): CategoryTab {
  return raw === 'experts' || raw === 'programmes' ? raw : 'tools';
}

/** Same destination as the website's home category cards: /categories/{slug}. */
export function openCategory(category: { slug: string; label: string }): void {
  router.push({ pathname: '/categories/[slug]', params: { slug: category.slug, label: category.label } });
}

export function useCategoryProgrammes(slug: string) {
  return useQuery({
    queryKey: ['v1', 'programme-events', 'category', slug],
    queryFn: async () => {
      const result = await fetchProgrammeEvents({ category: slug });
      if (!result.ok) throw new Error(result.message);
      return result.events;
    },
    enabled: EXPERTS_LIVE && slug !== '',
    staleTime: 60_000,
  });
}
