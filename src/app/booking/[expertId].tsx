import { useLocalSearchParams } from 'expo-router';

import { BookSessionScreen } from '@/features/customer/ExpertScreens';

/** Reference screen 13 — book a session. */
export default function BookSessionRoute() {
  const params = useLocalSearchParams<{ expertId?: string; session?: string }>();
  const expertId = typeof params.expertId === 'string' ? params.expertId : '';
  const session = typeof params.session === 'string' ? params.session : undefined;
  return <BookSessionScreen expertId={expertId} initialSession={session} />;
}
