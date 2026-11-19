import { useLocalSearchParams } from 'expo-router';

import { BookSessionFlowScreen } from '@/features/booking/BookSessionFlowScreen';

/** Book an expert — website professionals/details/{id} booking panel and checkout. */
export default function BookExpertRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <BookSessionFlowScreen id={id} />;
}
