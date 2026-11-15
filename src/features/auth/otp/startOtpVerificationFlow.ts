import { router } from 'expo-router';

import { setSelectedAuthRole } from '@/features/auth/roleStore';
import type { AuthRole } from '@/features/auth/types';
import { setOtpFlowContext } from '@/features/auth/otp/otpContextStore';
import type { OtpPurpose } from '@/features/auth/otp/types';

export type StartOtpVerificationInput = {
  role: AuthRole;
  email: string;
  purpose: OtpPurpose;
  /**
   * Only true after a real backend confirms a code was emailed.
   * Mobile OTP APIs are not available yet — callers must leave this false.
   */
  codeDispatchConfirmed?: boolean;
  challengeId?: string;
  resendAvailableAt?: string;
};

/**
 * Starts Screen 05 with in-memory context (email/role/purpose).
 * Never puts OTP values in the route or URL params.
 */
export function startOtpVerificationFlow(input: StartOtpVerificationInput): void {
  const email = input.email.trim().toLowerCase();
  setSelectedAuthRole(input.role);
  setOtpFlowContext({
    role: input.role,
    email,
    purpose: input.purpose,
    codeDispatchConfirmed: Boolean(input.codeDispatchConfirmed),
    challengeId: input.challengeId,
    resendAvailableAt: input.resendAvailableAt,
  });
  router.push('/auth/verify-otp');
}
