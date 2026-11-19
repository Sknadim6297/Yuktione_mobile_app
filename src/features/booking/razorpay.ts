import type { RazorpayFailure, RazorpayOrder, RazorpaySuccess } from '@/services/api/booking';
import { brand } from '@/theme';

export const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

export type CheckoutFailure = Omit<RazorpayFailure, 'razorpay_order_id'>;

export type RazorpayCheckoutProps = {
  /** Opens Razorpay while set; the parent clears it from onClose. */
  order: RazorpayOrder | null;
  onSuccess: (payment: RazorpaySuccess) => void;
  /** A payment attempt failed; Razorpay stays open so the customer can retry. */
  onFailure: (failure: CheckoutFailure) => void;
  /** Checkout closed, by the customer or because it could not load. */
  onClose: (reason: 'dismissed' | 'paid' | 'unavailable') => void;
};

export function checkoutOptions(order: RazorpayOrder) {
  return {
    key: order.key,
    amount: order.amount,
    currency: order.currency,
    name: order.name,
    description: order.description,
    order_id: order.id,
    prefill: order.prefill,
    theme: { color: brand.plum },
  };
}

export function failureFrom(error: unknown): CheckoutFailure {
  const value = (error ?? {}) as {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { payment_id?: string };
  };
  return {
    razorpay_payment_id: value.metadata?.payment_id ?? null,
    error_code: value.code ?? null,
    error_description: value.description ?? null,
    error_source: value.source ?? null,
    error_step: value.step ?? null,
    error_reason: value.reason ?? null,
  };
}
