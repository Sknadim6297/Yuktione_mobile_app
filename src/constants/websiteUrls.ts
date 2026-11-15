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
} as const;

export type WebsitePathKey = keyof typeof WEBSITE_PATHS;
