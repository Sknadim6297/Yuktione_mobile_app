import { useLocalSearchParams } from 'expo-router';

import { BookingConfirmedScreen } from '@/features/customer/ExpertScreens';

/** Reference screen 15 — booking result. Status follows the real payment attempt. */
export default function BookingConfirmedRoute() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : undefined;
  return <BookingConfirmedScreen bookingId={bookingId} />;
}
