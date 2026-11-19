import { useQuery } from '@tanstack/react-query';

import { EXPERTS_LIVE } from '@/features/experts/expertsDirectory';
import { fetchExpertAvailability, type BookableDate } from '@/services/api/booking';
import type { ApiSessionRate } from '@/services/api/catalog';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useExpertAvailability(id: string | number) {
  return useQuery({
    queryKey: ['v1', 'experts', 'availability', String(id)],
    queryFn: () => fetchExpertAvailability(id),
    enabled: EXPERTS_LIVE && /^\d+$/.test(String(id)),
    staleTime: 30_000,
  });
}

/** Dates on which at least one time is still open. */
export function openDates(dates: BookableDate[] | undefined): BookableDate[] {
  return (dates ?? []).filter((day) => day.slots.some((slot) => !slot.booked));
}

function parts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return { y: y ?? 1970, m: (m ?? 1) - 1, d: d ?? 1 };
}

/** Calendar day of a YYYY-MM-DD string; never shifted by the device timezone. */
export function weekdayOf(date: string): number {
  const { y, m, d } = parts(date);
  return new Date(Date.UTC(y, m, d)).getUTCDay();
}

/** "Thu, 20 Nov" */
export function shortDate(date: string): string {
  const { m, d } = parts(date);
  return `${WEEKDAYS[weekdayOf(date)]}, ${d} ${MONTHS[m]}`;
}

/** "Thursday, 20 November 2026" for screen readers. */
export function longDate(date: string): string {
  const { y, m, d } = parts(date);
  const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekdayOf(date)];
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
  return `${day}, ${d} ${month} ${y}`;
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function monthTitle(key: string): string {
  const { y, m } = parts(`${key}-01`);
  return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m]} ${y}`;
}

export function shiftMonth(key: string, by: number): string {
  const { y, m } = parts(`${key}-01`);
  const next = new Date(Date.UTC(y, m + by, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Calendar cells for a month, Monday first; null pads the leading/trailing gaps. */
export function monthCells(key: string): (string | null)[] {
  const { y, m } = parts(`${key}-01`);
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(`${key}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const CALENDAR_HEADINGS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** ₹944 or ₹944.50 — the checkout shows paise only when there are some. */
export function rupees(amount: number): string {
  const whole = Math.abs(amount - Math.round(amount)) < 0.005;
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function planTitle(rate: Pick<ApiSessionRate, 'session_type'>): string {
  const value = rate.session_type.trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Session';
}

export function sessionsLabel(count: number): string {
  return `${count} ${count === 1 ? 'session' : 'sessions'}`;
}

/** Razorpay's smallest payment is ₹1; free plans can't go through checkout. */
export function isPayable(rate: Pick<ApiSessionRate, 'final_rate'>): boolean {
  return rate.final_rate >= 1;
}
