import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ApiExpert, ApiTool, ApiToolCategory } from '@/services/api/catalog';

type IconName = ComponentProps<typeof Ionicons>['name'];

const SLUG_ICONS: Record<string, { icon: IconName; tint: string; ink: string }> = {
  'daily-mood-check-in': { icon: 'leaf-outline', tint: '#E7F8F0', ink: '#1F9D6A' },
  'digital-journal': { icon: 'book-outline', tint: '#F1ECFF', ink: '#6E5BD6' },
  'gratitude-journal': { icon: 'heart-outline', tint: '#E7F8F0', ink: '#1F9D6A' },
  'career-interest-test': { icon: 'locate-outline', tint: '#FFF0E4', ink: '#E08A3C' },
  'skills-strengths-assessment': {
    icon: 'trending-up-outline',
    tint: '#E8F1FF',
    ink: '#3D6FE0',
  },
  'bmi-bmr-calculator': { icon: 'calculator-outline', tint: '#E8F1FF', ink: '#3D6FE0' },
  'water-intake-tracker': { icon: 'water-outline', tint: '#E7F6FB', ink: '#2A9BB5' },
  'weight-journey': { icon: 'speedometer-outline', tint: '#E7F8F0', ink: '#1F9D6A' },
  'calorie-nutrition-tracker': {
    icon: 'nutrition-outline',
    tint: '#FDECEF',
    ink: '#E25B6A',
  },
  'tarot-reflection': { icon: 'moon-outline', tint: '#F1ECFF', ink: '#6E5BD6' },
};

const CATEGORY_TINT: Record<string, { tint: string; ink: string }> = {
  psychology: { tint: '#E7F8F0', ink: '#1F9D6A' },
  'career-guidance': { tint: '#FFF0E4', ink: '#E08A3C' },
  nutrition: { tint: '#E8F1FF', ink: '#3D6FE0' },
  'astrology-tarot': { tint: '#F1ECFF', ink: '#6E5BD6' },
};

export function toolVisual(tool: ApiTool): { icon: IconName; tint: string; ink: string } {
  if (SLUG_ICONS[tool.slug]) return SLUG_ICONS[tool.slug]!;
  const fromCategory = tool.category?.slug
    ? CATEGORY_TINT[tool.category.slug]
    : undefined;
  return {
    icon: 'leaf-outline',
    tint: fromCategory?.tint ?? '#E7F8F0',
    ink: fromCategory?.ink ?? '#1F9D6A',
  };
}

/** Map website tool slug to an existing mobile route when a runner exists. */
export function toolHref(tool: ApiTool): Href | null {
  if (!tool.mobile_ready) return null;
  switch (tool.slug) {
    case 'daily-mood-check-in':
      return { pathname: '/tools/[id]', params: { id: 'mood-check-in' } };
    case 'digital-journal':
      return '/tools/journal';
    case 'gratitude-journal':
      return '/tools/gratitude';
    case 'bmi-bmr-calculator':
      return '/tools/bmi';
    case 'water-intake-tracker':
      return '/tools/water';
    case 'career-interest-test':
      return { pathname: '/tools/[id]', params: { id: tool.slug } };
    case 'skills-strengths-assessment':
      return { pathname: '/tools/[id]', params: { id: tool.slug } };
    case 'weight-journey':
      return { pathname: '/tools/[id]', params: { id: tool.slug } };
    case 'calorie-nutrition-tracker':
      return { pathname: '/tools/[id]', params: { id: tool.slug } };
    case 'tarot-reflection':
      return { pathname: '/tools/[id]', params: { id: tool.slug } };
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
  const palette = ['#E7F8F0', '#F1ECFF', '#E8F1FF', '#FFF0E4', '#FDECEE', '#E7F6FB'];
  return palette[id % palette.length] ?? '#E7F8F0';
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
