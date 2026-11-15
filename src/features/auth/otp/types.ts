import type { AuthRole } from '@/features/auth/types';

/** Why OTP was requested — aligned with website registration (not login). */
export type OtpPurpose =
  | 'customer_registration_email'
  | 'professional_registration_email';

export type OtpFlowContext = {
  role: AuthRole;
  /** Display + verify identifier (website OTP is email-based). */
  email: string;
  purpose: OtpPurpose;
  /** Future API challenge id — never put OTP values here. */
  challengeId?: string;
  /**
   * True only after a real backend confirms a code was dispatched.
   * Drives whether resend cooldown may run.
   */
  codeDispatchConfirmed: boolean;
  /** ISO deadline for resend cooldown when API provides one. */
  resendAvailableAt?: string;
};
