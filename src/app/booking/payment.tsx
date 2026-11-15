import { useLocalSearchParams } from 'expo-router';

import { PaymentScreen } from '@/features/customer/ExpertScreens';

/** Reference screen 14 — payment. A charge is never marked successful here. */
export default function PaymentRoute() {
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const bookingId = typeof params.bookingId === 'string' ? params.bookingId : undefined;
  return <PaymentScreen bookingId={bookingId} />;
}
