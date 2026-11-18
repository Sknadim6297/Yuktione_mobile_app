import { apiClient } from '@/services/api/client';
import type { ApiUser } from '@/services/api/auth';
import type { ApiResult } from '@/services/api/types';

export type ProfileUpdateInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  city: string;
  state: string;
  zip_code: string;
};

function messageFrom(result: ApiResult<unknown>): string {
  if (result.ok) return 'Unexpected response.';
  if (result.status === 0) {
    return result.error.message ?? 'Network request failed.';
  }
  const firstField = result.error.errors
    ? Object.values(result.error.errors)[0]?.[0]
    : undefined;
  return firstField ?? result.error.message ?? 'Request failed.';
}

export async function fetchProfile(): Promise<
  | { ok: true; user: ApiUser }
  | { ok: false; message: string; status: number }
> {
  const result = await apiClient.get<{ status: string; user: ApiUser }>(
    '/profile',
    true,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFrom(result), status: result.status };
  }
  return { ok: true, user: result.data.user };
}

export async function updateProfile(
  input: ProfileUpdateInput,
): Promise<
  | { ok: true; user: ApiUser; message: string }
  | { ok: false; message: string; status: number; errors?: Record<string, string[]> }
> {
  const result = await apiClient.put<{ status: string; message?: string; user: ApiUser }>(
    '/profile',
    input,
    true,
    'v1',
  );
  if (!result.ok) {
    return {
      ok: false,
      message: messageFrom(result),
      status: result.status,
      errors: result.error.errors,
    };
  }
  return {
    ok: true,
    user: result.data.user,
    message: result.data.message ?? 'Profile updated successfully',
  };
}
