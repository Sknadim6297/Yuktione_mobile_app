import { apiClient } from '@/services/api/client';
import type { ApiResult } from '@/services/api/types';

export type BookableSlot = {
  /** Value the website stores, e.g. "10:00 AM to 10:30 AM". */
  value: string;
  label: string;
  booked: boolean;
};

export type BookableDate = {
  date: string;
  weekday: string;
  slots: BookableSlot[];
};

export type ExpertAvailability = {
  timezone: string;
  session_durations: number[];
  dates: BookableDate[];
};

export type BookingPick = { date: string; time_slot: string };

export type BookingSelection = {
  professional_id: number;
  rate_id: number;
  slots: BookingPick[];
};

export type BookingAmounts = {
  base_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

export type BookingCheckout = {
  professional: { id: number; name: string; specialization: string | null };
  service_name: string | null;
  rate_id: number;
  plan_type: string;
  plan_label: string;
  num_sessions: number;
  session_mode: string;
  bookings: BookingPick[];
  amounts: BookingAmounts;
  currency: string;
  payable: boolean;
  customer: { name: string; email: string; phone: string | null };
};

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  key: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayFailure = {
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  error_code?: string | null;
  error_description?: string | null;
  error_source?: string | null;
  error_step?: string | null;
  error_reason?: string | null;
};

export type ConfirmedBooking = {
  id: number;
  professional: { id: number; name: string | null };
  service_name: string | null;
  plan_type: string;
  sessions: BookingPick[];
  amounts: BookingAmounts;
  payment_id: string;
  has_questions: boolean;
};

export type BookingQuestion = {
  id: number;
  question: string;
  type: 'mcq' | 'text';
  options: string[];
  has_other: boolean;
};

export type BookingAnswer = { mcq_id: number; answer: string; other_answer?: string | null };

export class BookingRequestError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'BookingRequestError';
    this.status = status;
    this.code = code;
  }
}

function unwrap<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  const body = result.error as { message?: string; errors?: Record<string, string[]>; status?: string };
  const firstFieldError = body.errors ? Object.values(body.errors).flat()[0] : undefined;
  const message =
    result.status === 401
      ? 'Please sign in again to continue.'
      : firstFieldError ?? body.message ?? 'Something went wrong. Please try again.';
  throw new BookingRequestError(message, result.status, typeof body.status === 'string' ? body.status : null);
}

export async function fetchExpertAvailability(id: number | string): Promise<ExpertAvailability> {
  const data = unwrap(
    await apiClient.get<ExpertAvailability & { status: string }>(`/experts/${id}/availability`, false, 'v1'),
  );
  return { timezone: data.timezone, session_durations: data.session_durations ?? [], dates: data.dates ?? [] };
}

export async function fetchBookingCheckout(selection: BookingSelection): Promise<BookingCheckout> {
  return unwrap(await apiClient.post<{ checkout: BookingCheckout }>('/bookings/checkout', selection)).checkout;
}

export async function createBookingOrder(selection: BookingSelection, phone: string): Promise<RazorpayOrder> {
  return unwrap(await apiClient.post<{ order: RazorpayOrder }>('/bookings/order', { ...selection, phone })).order;
}

export async function verifyBookingPayment(payment: RazorpaySuccess): Promise<ConfirmedBooking> {
  return unwrap(await apiClient.post<{ booking: ConfirmedBooking }>('/bookings/verify', payment)).booking;
}

/** Best effort: the website logs failed attempts for the support team. */
export async function reportPaymentFailure(failure: RazorpayFailure): Promise<void> {
  await apiClient.post('/bookings/payment-failed', failure);
}

export async function fetchBookingQuestions(bookingId: number): Promise<BookingQuestion[]> {
  return unwrap(await apiClient.get<{ questions: BookingQuestion[] }>(`/bookings/${bookingId}/questions`)).questions ?? [];
}

export async function submitBookingAnswers(bookingId: number, answers: BookingAnswer[]): Promise<string> {
  const data = unwrap(await apiClient.post<{ message?: string }>(`/bookings/${bookingId}/answers`, { answers }));
  return data.message ?? 'Thank you, your answers were shared with your expert.';
}
