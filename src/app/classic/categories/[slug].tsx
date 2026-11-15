import { useLocalSearchParams } from 'expo-router';

import { CategoryLandingScreen } from '@/features/categories/CategoryLandingScreen';

/** Previous category landing with preview tools (preserved). */
export default function ClassicCategoryRoute() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : 'mental-wellbeing';
  return <CategoryLandingScreen slug={slug} />;
}
