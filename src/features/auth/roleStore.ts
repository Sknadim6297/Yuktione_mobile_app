import type { AuthRole } from '@/features/auth/types';

/**
 * Lightweight in-memory role selection for the auth entry screen.
 * Not persisted as authenticated identity — only UI flow preference.
 */
let selectedAuthRole: AuthRole = 'customer';

export function getSelectedAuthRole(): AuthRole {
  return selectedAuthRole;
}

export function setSelectedAuthRole(role: AuthRole): void {
  selectedAuthRole = role;
}
