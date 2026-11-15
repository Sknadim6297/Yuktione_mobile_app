import { apiRequest } from '@/services/api/client';
import type { ApiResult } from '@/services/api/types';
import type {
  AvailabilityMonthResponse,
  AvailableDatesResponse,
  AvailableSlotsResponse,
} from '@/types/availability';

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertProfessionalId(professionalId: number): void {
  if (!Number.isInteger(professionalId) || professionalId <= 0) {
    throw new Error('A valid professional ID is required.');
  }
}

/**
 * GET /api/professional/{id}/availability?month=YYYY-MM
 * Public — no Bearer token.
 */
export async function fetchProfessionalAvailability(
  professionalId: number,
  month: string,
  signal?: AbortSignal,
): Promise<ApiResult<AvailabilityMonthResponse>> {
  assertProfessionalId(professionalId);
  if (!MONTH_RE.test(month)) {
    throw new Error('Month must be YYYY-MM.');
  }

  return apiRequest<AvailabilityMonthResponse>({
    method: 'GET',
    mode: 'public',
    auth: false,
    path: `/professional/${professionalId}/availability?month=${encodeURIComponent(month)}`,
    signal,
  });
}

/**
 * GET /api/professional/{id}/available-dates?month=YYYY-MM
 */
export async function fetchAvailableDates(
  professionalId: number,
  month: string,
  signal?: AbortSignal,
): Promise<ApiResult<AvailableDatesResponse>> {
  assertProfessionalId(professionalId);
  if (!MONTH_RE.test(month)) {
    throw new Error('Month must be YYYY-MM.');
  }

  return apiRequest<AvailableDatesResponse>({
    method: 'GET',
    mode: 'public',
    auth: false,
    path: `/professional/${professionalId}/available-dates?month=${encodeURIComponent(month)}`,
    signal,
  });
}

/**
 * GET /api/professional/{id}/available-slots?date=YYYY-MM-DD
 */
export async function fetchAvailableSlots(
  professionalId: number,
  date: string,
  signal?: AbortSignal,
): Promise<ApiResult<AvailableSlotsResponse>> {
  assertProfessionalId(professionalId);
  if (!DATE_RE.test(date)) {
    throw new Error('Date must be YYYY-MM-DD.');
  }

  return apiRequest<AvailableSlotsResponse>({
    method: 'GET',
    mode: 'public',
    auth: false,
    path: `/professional/${professionalId}/available-slots?date=${encodeURIComponent(date)}`,
    signal,
  });
}

export function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function shiftMonthKey(month: string, delta: number): string {
  const [ys, ms] = month.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(d);
}

export function formatMonthLabel(month: string): string {
  const [ys, ms] = month.split('-');
  const d = new Date(Number(ys), Number(ms) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
