import { useEffect, useRef } from 'react';

import {
  RAZORPAY_SCRIPT,
  checkoutOptions,
  failureFrom,
  type RazorpayCheckoutProps,
} from '@/features/booking/razorpay';

type RazorpayInstance = { open: () => void; on: (event: string, handler: (response: { error?: unknown }) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

let scriptLoad: Promise<RazorpayConstructor> | null = null;

function loadRazorpay(): Promise<RazorpayConstructor> {
  const existing = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  scriptLoad ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => {
      const loaded = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
      if (loaded) resolve(loaded);
      else reject(new Error('Razorpay unavailable'));
    };
    script.onerror = () => {
      scriptLoad = null;
      script.remove();
      reject(new Error('Razorpay unavailable'));
    };
    document.head.appendChild(script);
  });
  return scriptLoad;
}

/** Razorpay Standard Checkout overlay (web build). */
export function RazorpayCheckout({ order, onSuccess, onFailure, onClose }: RazorpayCheckoutProps) {
  const handlers = useRef({ onSuccess, onFailure, onClose });
  useEffect(() => {
    handlers.current = { onSuccess, onFailure, onClose };
  });

  useEffect(() => {
    if (!order) return;
    let settled = false;
    const settle = (reason: 'dismissed' | 'paid' | 'unavailable') => {
      if (settled) return;
      settled = true;
      handlers.current.onClose(reason);
    };

    loadRazorpay()
      .then((Razorpay) => {
        if (settled) return;
        const checkout = new Razorpay({
          ...checkoutOptions(order),
          handler: (response: Parameters<typeof onSuccess>[0]) => {
            if (settled) return;
            handlers.current.onSuccess(response);
            settle('paid');
          },
          modal: { ondismiss: () => settle('dismissed'), confirm_close: true },
        });
        checkout.on('payment.failed', (response) => {
          if (!settled) handlers.current.onFailure(failureFrom(response?.error));
        });
        checkout.open();
      })
      .catch(() => settle('unavailable'));

    return () => {
      settled = true;
    };
  }, [order]);

  return null;
}
