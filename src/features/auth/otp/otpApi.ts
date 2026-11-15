import { isApiConfigured } from '@/constants';
import {
  getPendingRegistration,
  updatePendingRegistration,
} from '@/features/auth/pendingRegistrationStore';
import type { OtpFlowContext, OtpPurpose } from '@/features/auth/otp/types';
import type { AuthRole } from '@/features/auth/types';
import {
  createIncompleteCustomer,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from '@/services/api/auth';

export type OtpApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; unavailable?: boolean };

export type OtpSendSuccess = {
  challengeId?: string;
  resendAvailableAt?: string;
  expiresAt?: string;
};

export type OtpVerifySuccess = {
  nextStep: 'set_password' | 'complete_registration' | 'pending_review' | 'unknown';
  message: string;
};

export async function requestOtpSend(input: {
  role: AuthRole;
  email: string;
  purpose: OtpPurpose;
}): Promise<OtpApiResult<OtpSendSuccess>> {
  if (!isApiConfigured()) {
    return {
      ok: false,
      unavailable: true,
      message:
        'OTP send is unavailable. Configure EXPO_PUBLIC_API_BASE_URL first.',
    };
  }

  if (input.role !== 'customer' || input.purpose !== 'customer_registration_email') {
    return {
      ok: false,
      unavailable: true,
      message: 'Only customer registration OTP is connected in Phase 1.',
    };
  }

  const result = await sendRegistrationOtp(input.email);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  const resendAvailableAt = new Date(Date.now() + 60_000).toISOString();
  return {
    ok: true,
    data: {
      resendAvailableAt,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    },
  };
}

export async function requestOtpVerify(input: {
  context: OtpFlowContext;
  /** Caller must not log this value. */
  code: string;
}): Promise<OtpApiResult<OtpVerifySuccess>> {
  if (!isApiConfigured()) {
    return {
      ok: false,
      unavailable: true,
      message:
        'OTP verification is unavailable until EXPO_PUBLIC_API_BASE_URL is set. No code was checked.',
    };
  }

  if (input.context.role !== 'customer') {
    return {
      ok: false,
      unavailable: true,
      message: 'Only customer registration OTP is connected in Phase 1.',
    };
  }

  const pending = getPendingRegistration();
  if (
    pending &&
    pending.email === input.context.email &&
    pending.firstName &&
    pending.phone
  ) {
    const created = await createIncompleteCustomer({
      first_name: pending.firstName,
      last_name: pending.lastName,
      phone: pending.phone,
      email: input.context.email,
      otp: input.code,
    });
    if (!created.ok) {
      return { ok: false, message: created.message };
    }
    updatePendingRegistration({ userId: created.userId });
    return {
      ok: true,
      data: {
        nextStep: 'set_password',
        message: created.message,
      },
    };
  }

  const verified = await verifyRegistrationOtp({
    email: input.context.email,
    otp: input.code,
  });
  if (!verified.ok) {
    return { ok: false, message: verified.message };
  }

  return {
    ok: true,
    data: {
      nextStep: 'set_password',
      message: verified.message,
    },
  };
}

export async function requestOtpResend(
  context: OtpFlowContext,
): Promise<OtpApiResult<OtpSendSuccess>> {
  return requestOtpSend({
    role: context.role,
    email: context.email,
    purpose: context.purpose,
  });
}
