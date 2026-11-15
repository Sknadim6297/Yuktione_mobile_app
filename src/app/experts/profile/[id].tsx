import { useLocalSearchParams } from 'expo-router';

import { ExpertProfileScreen } from '@/features/customer/ExpertScreens';

/** Reference screen 12 — expert profile. */
export default function ExpertProfileRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <ExpertProfileScreen id={id} />;
}
