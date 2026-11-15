/**
 * In-memory registration draft for the multi-step mobile flow.
 * Never persisted to SecureStore. Cleared after complete or cancel.
 */

export type PendingRegistration = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** Collected on Sign Up; applied on Set Password / complete. */
  password?: string;
  userId?: number;
};

let pending: PendingRegistration | null = null;

export function setPendingRegistration(value: PendingRegistration): void {
  pending = { ...value };
}

export function getPendingRegistration(): PendingRegistration | null {
  return pending ? { ...pending } : null;
}

export function updatePendingRegistration(
  patch: Partial<PendingRegistration>,
): PendingRegistration | null {
  if (!pending) {
    return null;
  }
  pending = { ...pending, ...patch };
  return { ...pending };
}

export function clearPendingRegistration(): void {
  pending = null;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  const first = parts[0] ?? '';
  if (parts.length === 1) {
    return { firstName: first, lastName: first };
  }
  return {
    firstName: first,
    lastName: parts.slice(1).join(' '),
  };
}
