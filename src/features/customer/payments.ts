import { apiRequest } from '@/services/api/client';
import { isApiConfigured } from '@/constants/config';

export type PaymentMethodId = 'upi' | 'card' | 'netbanking' | 'wallet';

export type PaymentAttempt = {
  state: 'unavailable' | 'failed' | 'pending' | 'paid';
  message: string;
  reference?: string;
};

type PaymentPayload = {
  status?: string;
  reference?: string;
  message?: string;
};

/**
 * Asks the reserved mobile payments API to charge a booking.
 * A paid result is returned only when the server explicitly confirms it.
 * This function never invents a successful charge.
 */
export async function requestBookingPayment(input: {
  bookingId: string;
  amount: number;
  method: PaymentMethodId;
}): Promise<PaymentAttempt> {
  if (!isApiConfigured()) {
    return {
      state: 'unavailable',
      message:
        'Payment gateway is not configured. No charge was made. Set EXPO_PUBLIC_API_BASE_URL when the payments API is available.',
    };
  }

  const result = await apiRequest<PaymentPayload>({
    method: 'POST',
    mode: 'v1',
    auth: true,
    path: '/payments/session-bookings',
    body: input,
  });

  if (!result.ok) {
    return {
      state: 'failed',
      message:
        result.error.message ??
        'Payment could not be completed. No success was assumed.',
    };
  }

  const status = result.data?.status?.toLowerCase();
  if (status === 'paid' && result.data?.reference) {
    return {
      state: 'paid',
      message: 'Payment confirmed by the server.',
      reference: result.data.reference,
    };
  }

  return {
    state: 'pending',
    message:
      result.data?.message ??
      'The server did not confirm a successful payment.',
  };
}
