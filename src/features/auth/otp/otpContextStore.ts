import type { OtpFlowContext } from '@/features/auth/otp/types';

/**
 * In-memory OTP flow context (role + email + purpose).
 * Never stores OTP codes or passwords.
 */
let otpFlowContext: OtpFlowContext | null = null;

export function setOtpFlowContext(context: OtpFlowContext): void {
  otpFlowContext = { ...context };
}

export function getOtpFlowContext(): OtpFlowContext | null {
  return otpFlowContext ? { ...otpFlowContext } : null;
}

export function updateOtpFlowContext(
  patch: Partial<OtpFlowContext>,
): OtpFlowContext | null {
  if (!otpFlowContext) {
    return null;
  }
  otpFlowContext = { ...otpFlowContext, ...patch };
  return { ...otpFlowContext };
}

export function clearOtpFlowContext(): void {
  otpFlowContext = null;
}
