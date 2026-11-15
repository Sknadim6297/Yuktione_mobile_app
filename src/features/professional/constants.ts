/**
 * Options mirrored from the Laravel professional registration views/controllers.
 * specialization catalog is DB-driven on the website; free text until services API exists.
 */

export const EXPERIENCE_OPTIONS = [
  { label: '0–2 years', value: '0-2' },
  { label: '2–4 years', value: '2-4' },
  { label: '4–6 years', value: '4-6' },
  { label: '6–8 years', value: '6-8' },
  { label: '8–10 years', value: '8-10' },
  { label: '10+ years', value: '10+' },
] as const;

export const CITY_OPTIONS = [
  'Mumbai',
  'Kolkata',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Surat',
  'Jaipur',
] as const;

export const SETUP_STEPS = [
  'Basic Details',
  'Qualifications',
  'Experience',
  'Services & Pricing',
  'Review & Submit',
] as const;

export const PROFESSIONAL_JOIN_BENEFITS = [
  {
    icon: 'people-outline' as const,
    title: 'Reach the right clients',
    description: 'Connect with people seeking trusted professional guidance on YuktiOne.',
  },
  {
    icon: 'calendar-outline' as const,
    title: 'Manage your schedule',
    description: 'Set availability, accept bookings, and keep sessions organized.',
  },
  {
    icon: 'wallet-outline' as const,
    title: 'Transparent earnings',
    description: 'Track sessions, invoices, and reports from one professional workspace.',
  },
] as const;
