import { AuthEntryScreen } from '@/features/auth/AuthEntryScreen';

/**
 * Previous shared Login / Sign Up entry with customer/professional role selector.
 * Primary `/auth` remains the reference Sign In screen.
 */
export default function ClassicAuthEntryRoute() {
  return <AuthEntryScreen />;
}
