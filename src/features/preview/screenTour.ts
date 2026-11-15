import { type Href } from 'expo-router';

import { setOtpFlowContext } from '@/features/auth/otp/otpContextStore';
import { unlockUiPreview } from '@/features/preview/uiPreviewSession';

export type TourScreen = {
  id: string;
  number: string;
  title: string;
  href: Href;
  /** Prepare in-memory context before opening (OTP email, preview unlock, etc.). */
  prepare?: () => void;
};

function prepareOtp(): void {
  unlockUiPreview();
  setOtpFlowContext({
    role: 'customer',
    email: 'priya@email.com',
    purpose: 'customer_registration_email',
    codeDispatchConfirmed: false,
  });
}

function prepareHome(): void {
  unlockUiPreview();
}

/** Ordered tour of the screens/ reference set, then the existing auth and professional flows. */
export const SCREEN_TOUR: TourScreen[] = [
  { id: 'splash', number: '00', title: 'Splash', href: '/' },
  { id: 'onboarding-1', number: '01', title: 'Onboarding 1', href: '/onboarding/step-1' },
  { id: 'onboarding-2', number: '02', title: 'Onboarding 2', href: '/onboarding/step-2' },
  { id: 'onboarding-3', number: '03', title: 'Onboarding 3', href: '/onboarding/step-3' },
  { id: 'auth', number: '04', title: 'Sign In', href: '/auth' },
  { id: 'home', number: '05', title: 'Home', href: '/(tabs)/home', prepare: prepareHome },
  { id: 'tools', number: '06', title: 'All Tools', href: '/(tabs)/tools', prepare: prepareHome },
  { id: 'mood', number: '07', title: 'Mood Result', href: '/insights/mood', prepare: prepareHome },
  { id: 'explore', number: '08', title: 'Explore', href: '/(tabs)/explore', prepare: prepareHome },
  {
    id: 'category',
    number: '09',
    title: 'Mental Wellbeing',
    href: '/categories/mental-wellbeing',
    prepare: prepareHome,
  },
  { id: 'experts', number: '10', title: 'Talk to an Expert', href: '/(tabs)/experts', prepare: prepareHome },
  { id: 'experts-browse', number: '11', title: 'Experts & Filters', href: '/experts/browse', prepare: prepareHome },
  {
    id: 'expert-profile',
    number: '12',
    title: 'Expert Profile',
    href: '/experts/profile/ananya',
    prepare: prepareHome,
  },
  { id: 'book', number: '13', title: 'Book a Session', href: '/booking/ananya', prepare: prepareHome },
  { id: 'payment', number: '14', title: 'Payment', href: '/booking/payment', prepare: prepareHome },
  { id: 'confirmed', number: '15', title: 'Booking Result', href: '/booking/confirmed', prepare: prepareHome },
  { id: 'bookings', number: '16', title: 'My Bookings', href: '/(tabs)/bookings', prepare: prepareHome },
  { id: 'programmes', number: '17', title: 'Programmes', href: '/programmes', prepare: prepareHome },
  {
    id: 'programme',
    number: '18',
    title: 'Programme Detail',
    href: '/programmes/stress-relief-7',
    prepare: prepareHome,
  },
  {
    id: 'learn',
    number: '19',
    title: 'Programme Content',
    href: '/programmes/stress-relief-7/learn',
    prepare: prepareHome,
  },
  { id: 'my-space', number: '20', title: 'My Space', href: '/(tabs)/my-space', prepare: prepareHome },
  { id: 'my-tools', number: '21', title: 'My Tools', href: '/my-tools', prepare: prepareHome },
  { id: 'progress', number: '22', title: 'My Progress', href: '/progress', prepare: prepareHome },
  { id: 'reports', number: '23', title: 'Reports', href: '/reports', prepare: prepareHome },
  { id: 'pro-join', number: '24', title: 'Join as a Professional', href: '/professional/join' },
  {
    id: 'otp',
    number: '25',
    title: 'OTP Verification',
    href: '/auth/verify-otp',
    prepare: prepareOtp,
  },
  {
    id: 'set-password',
    number: '26',
    title: 'Set Password',
    href: '/auth/set-password',
    prepare: prepareHome,
  },
  // Previous customer UIs (restored access; primary tour entries above stay the reference set)
  {
    id: 'classic-auth',
    number: '27',
    title: 'Classic Auth Entry',
    href: '/auth/classic',
  },
  {
    id: 'classic-home',
    number: '28',
    title: 'Classic Home (Mood)',
    href: '/classic/home',
    prepare: prepareHome,
  },
  {
    id: 'classic-tools',
    number: '31',
    title: 'Classic Quick Tools',
    href: '/classic/tools',
    prepare: prepareHome,
  },
  {
    id: 'classic-experts',
    number: '32',
    title: 'Classic Experts Directory',
    href: '/classic/experts',
    prepare: prepareHome,
  },
  {
    id: 'classic-category',
    number: '33',
    title: 'Classic Category Landing',
    href: '/classic/categories/mental-wellbeing',
    prepare: prepareHome,
  },
  {
    id: 'classic-experts-list',
    number: '34',
    title: 'Classic Experts by Category',
    href: '/experts/mental-wellbeing',
    prepare: prepareHome,
  },
  { id: 'pro-setup', number: '29', title: 'Professional Setup', href: '/professional/setup/basic' },
  {
    id: 'pro-dash',
    number: '30',
    title: 'Professional Dashboard',
    href: '/professional/dashboard-preview',
  },
];

export function getTourIndex(pathname: string): number {
  const normalized = pathname.replace(/\/$/, '') || '/';

  // Prefer the most specific matching tour entry (longest href).
  let best = -1;
  let bestLen = -1;
  SCREEN_TOUR.forEach((screen, index) => {
    const href = String(screen.href).replace(/\/$/, '') || '/';
    if (href === '/') {
      if (normalized === '/' || normalized === '') {
        if (1 > bestLen) {
          best = index;
          bestLen = 1;
        }
      }
      return;
    }
    if (normalized === href || normalized.startsWith(`${href}/`)) {
      if (href.length > bestLen) {
        best = index;
        bestLen = href.length;
      }
    }
  });
  return best;
}

export function openTourScreen(screen: TourScreen): void {
  screen.prepare?.();
}
