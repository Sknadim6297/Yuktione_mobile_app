import { useLocalSearchParams } from 'expo-router';

import { ExpertsListScreen } from '@/features/experts/ExpertsListScreen';

/**
 * Previous category expert list (e.g. /experts/mental-wellbeing).
 * The reference browse UI remains at /experts/browse.
 */
export default function ExpertsCategoryListRoute() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category =
    typeof params.category === 'string' ? params.category : 'mental-wellbeing';
  return <ExpertsListScreen categoryId={category} />;
}
