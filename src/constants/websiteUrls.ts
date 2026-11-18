/**
 * Verified Laravel web GET paths from routes/web.php + RouteServiceProvider prefixes.
 * Do not invent URLs. Mutating payment POSTs are intentionally omitted.
 */
export const WEBSITE_PATHS = {
  home: '/',
  customerLogin: '/login',
  customerRegister: '/register',
  professionalLogin: '/professional/login',
  professionalRegister: '/professional/register',
  /** Public explore / professional listing. */
  exploreListing: '/gridlisting',
  /**
   * Customer booking page (requires website session).
   * Prefixed by RouteServiceProvider as /user/...
   */
  customerBooking: '/user/booking',
  customerMyBookings: '/user/my-bookings',
  /** Customer panel pages (website session required). */
  customerDashboard: '/user/dashboard',
  customerProfile: '/user/profile',
  customerBilling: '/customer/billing',
  customerReferEarn: '/customer/yukti-points',
  customerSupportChat: '/user/admin-chat',
  customerUpcomingAppointments: '/user/upcoming-appointment',
  customerAllAppointments: '/user/all-appointment',
  customerAdditionalServices: '/user/additional-services',
  /** Dashboard "My Saved Tools" panel (pfm_calculations + ps_tool_results). */
  customerSavedTools: '/user/dashboard#my-saved-tools',
  financeTools: '/tools/pfm',
  wellbeingTools: '/tools/ps',
  /** Psychology tools that save to the customer's account (mood_checkins, digital_journals, gratitude_journals). */
  moodCheckin: '/tools/psychology/mood',
  moodHistory: '/tools/psychology/mood/history',
  journalHistory: '/tools/psychology/journal/history',
  gratitudeHistory: '/tools/psychology/gratitude/history',
  /** Public pages. */
  contact: '/contact',
  help: '/help',
  privacy: '/privacy',
  terms: '/terms',
} as const;

/** WhatsApp support number used by the website customer panel layout. */
export const SUPPORT_WHATSAPP_URL = 'https://wa.me/+919147421560';

export type WebsitePathKey = keyof typeof WEBSITE_PATHS;
