import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ApiExpert, ApiTool, ApiToolCategory } from '@/services/api/catalog';

type IconName = ComponentProps<typeof Ionicons>['name'];

const SLUG_ICONS: Record<string, { icon: IconName; tint: string; ink: string }> = {
  'daily-mood-check-in': { icon: 'leaf-outline', tint: '#F8EAF1', ink: '#8A0F4D' },
  'digital-journal': { icon: 'book-outline', tint: '#F6EEF9', ink: '#7B3F96' },
  'gratitude-journal': { icon: 'heart-outline', tint: '#F8EAF1', ink: '#8A0F4D' },
  'career-interest-test': { icon: 'locate-outline', tint: '#F7EBDD', ink: '#B87333' },
  'skills-strengths-assessment': {
    icon: 'trending-up-outline',
    tint: '#FFF1F6',
    ink: '#C3196B',
  },
  'bmi-bmr-calculator': { icon: 'calculator-outline', tint: '#FFF1F6', ink: '#C3196B' },
  'water-intake-tracker': { icon: 'water-outline', tint: '#FFF1F6', ink: '#C3196B' },
  'weight-journey': { icon: 'speedometer-outline', tint: '#F8EAF1', ink: '#8A0F4D' },
  'calorie-nutrition-tracker': {
    icon: 'nutrition-outline',
    tint: '#FCE8F1',
    ink: '#C3196B',
  },
  'tarot-reflection': { icon: 'moon-outline', tint: '#F6EEF9', ink: '#7B3F96' },
};

const CATEGORY_TINT: Record<string, { tint: string; ink: string }> = {
  psychology: { tint: '#F8EAF1', ink: '#8A0F4D' },
  'career-guidance': { tint: '#F7EBDD', ink: '#B87333' },
  nutrition: { tint: '#FFF1F6', ink: '#C3196B' },
  'astrology-tarot': { tint: '#F6EEF9', ink: '#7B3F96' },
};

export function toolVisual(tool: ApiTool): { icon: IconName; tint: string; ink: string } {
  if (SLUG_ICONS[tool.slug]) return SLUG_ICONS[tool.slug]!;
  const fromCategory = tool.category?.slug
    ? CATEGORY_TINT[tool.category.slug]
    : undefined;
  return {
    icon: 'leaf-outline',
    tint: fromCategory?.tint ?? '#F8EAF1',
    ink: fromCategory?.ink ?? '#8A0F4D',
  };
}

/** Map website tool slug to an existing mobile route when a runner exists. */
/**
 * Mood, journal and gratitude use the account-backed runners (POST /api/v1/my/*).
 * Every other slug opens /tools/{slug}, which renders the native BMI/BMR calculator
 * or the website hand-off screen for tools without a mobile runner yet.
 */
export function toolHref(tool: ApiTool): Href | null {
  switch (tool.slug) {
    case 'daily-mood-check-in':
      return { pathname: '/tools/[id]', params: { id: 'mood-check-in' } };
    case 'digital-journal':
      return { pathname: '/tools/[id]', params: { id: 'journal' } };
    case 'gratitude-journal':
      return { pathname: '/tools/[id]', params: { id: 'gratitude' } };
    default:
      return { pathname: '/tools/[id]', params: { id: tool.slug } };
  }
}

/** Opens the mobile runner, or explains that the tool lives on the website. */
export function openLiveTool(tool: ApiTool): void {
  const href = toolHref(tool);
  if (!href) {
    Alert.alert(
      tool.name,
      tool.mobile_message ??
        'This tool is available on the YuktiOne website. A dedicated mobile experience is not ready yet.',
    );
    return;
  }
  router.push(href);
}

export function expertInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export function expertTint(id: number): string {
  const palette = ['#F8EAF1', '#F6EEF9', '#FFF1F6', '#F7EBDD', '#FCE8F1', '#FFF1F6'];
  return palette[id % palette.length] ?? '#F8EAF1';
}

export function mapExpertCard(expert: ApiExpert) {
  return {
    id: String(expert.id),
    numericId: expert.id,
    name: expert.name,
    title: expert.specialization ?? expert.services[0] ?? 'Expert',
    specialty: expert.specialization ?? expert.services[0] ?? 'General',
    experience: expert.experience ?? '—',
    rating: expert.rating ?? 0,
    reviews: expert.review_count,
    fee: expert.starting_price ?? 0,
    verified: expert.verified,
    initials: expertInitials(expert.name),
    tint: expertTint(expert.id),
    photoUrl: expert.photo_url,
    education: expert.education,
    bio: expert.bio,
    services: expert.services,
    sessionRates: expert.session_rates ?? [],
  };
}

export type LiveExpertCard = ReturnType<typeof mapExpertCard>;

export function categoryLabel(category: ApiToolCategory): string {
  return category.name;
}
