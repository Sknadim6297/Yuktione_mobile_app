import { OtpVerificationScreen } from '@/features/auth/otp/OtpVerificationScreen';

/**
 * Professional OTP entry — same Screen 05 UI as /auth/verify-otp.
 * Prefer startOtpVerificationFlow() so email stays in memory, not URL params.
 */
export default function ProfessionalVerifyOtpRoute() {
  return <OtpVerificationScreen />;
}
