import { z } from 'zod';

import type { IdentifierKind } from '@/features/auth/types';

/**
 * Website login (Customer + Professional) requires email + password (min 6).
 * Phone appears mainly in registration / profile (digits, typically 6–15 / max 20).
 * This entry field accepts email OR mobile for the design, then routes to the
 * correct password-based flow once mobile APIs exist.
 */

const emailSchema = z.string().trim().email();

/** Digits only, aligned with professional phone rules (6–15 digits). */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]+$/, 'Enter a valid mobile number.')
  .transform((value) => value.replace(/[^\d]/g, ''))
  .refine((digits) => digits.length >= 6 && digits.length <= 15, {
    message: 'Mobile number must be 6–15 digits.',
  });

export function classifyIdentifier(raw: string): IdentifierKind {
  const value = raw.trim();
  if (!value) {
    return 'empty';
  }
  if (value.includes('@') || /[a-zA-Z]/.test(value)) {
    return emailSchema.safeParse(value).success ? 'email' : 'invalid';
  }
  return phoneSchema.safeParse(value).success ? 'phone' : 'invalid';
}

export function validateAuthIdentifier(raw: string): {
  ok: boolean;
  kind: IdentifierKind;
  normalized: string;
  error?: string;
} {
  const kind = classifyIdentifier(raw);
  const trimmed = raw.trim();

  if (kind === 'empty') {
    return {
      ok: false,
      kind,
      normalized: '',
      error: 'Enter your email or mobile number.',
    };
  }

  if (kind === 'email') {
    return { ok: true, kind, normalized: trimmed.toLowerCase() };
  }

  if (kind === 'phone') {
    const parsed = phoneSchema.safeParse(trimmed);
    if (!parsed.success) {
      return {
        ok: false,
        kind: 'invalid',
        normalized: trimmed,
        error: parsed.error.issues[0]?.message ?? 'Enter a valid mobile number.',
      };
    }
    return { ok: true, kind: 'phone', normalized: parsed.data };
  }

  if (trimmed.includes('@') || /[a-zA-Z]/.test(trimmed)) {
    return {
      ok: false,
      kind: 'invalid',
      normalized: trimmed,
      error: 'Please enter a valid email address.',
    };
  }

  return {
    ok: false,
    kind: 'invalid',
    normalized: trimmed,
    error: 'Enter a valid email or 6–15 digit mobile number.',
  };
}
