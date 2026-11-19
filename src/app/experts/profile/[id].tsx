import { useLocalSearchParams } from 'expo-router';

import { ExpertProfileDetailScreen } from '@/features/experts/ExpertProfileDetailScreen';

/** Expert profile — website professionals/details/{id}. */
export default function ExpertProfileRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <ExpertProfileDetailScreen id={id} />;
}
