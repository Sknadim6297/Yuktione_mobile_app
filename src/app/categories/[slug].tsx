import { useLocalSearchParams } from 'expo-router';

import { CategoryScreen } from '@/features/customer/DiscoverScreens';

/** Reference screen 9 — category landing. */
export default function CategoryRoute() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  return <CategoryScreen slug={slug} />;
}
