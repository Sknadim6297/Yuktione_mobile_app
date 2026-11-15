import { useLocalSearchParams } from 'expo-router';

import { ProgrammeLearnScreen } from '@/features/customer/ProgrammeScreens';

/** Reference screen 19 — programme content. */
export default function ProgrammeLearnRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <ProgrammeLearnScreen id={id} />;
}
