import { useLocalSearchParams } from 'expo-router';

import { ProgrammeDetailScreen } from '@/features/customer/ProgrammeScreens';

/** Reference screen 18 — programme detail. */
export default function ProgrammeDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <ProgrammeDetailScreen id={id} />;
}
