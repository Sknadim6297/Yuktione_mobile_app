import { apiClient } from '@/services/api/client';
import { clearAuthToken, setAuthToken } from '@/services/api/tokenStorage';
import type { ApiResult } from '@/services/api/types';
import { Platform } from 'react-native';

export type ApiCustomerProfile = {
  id: number;
  user_id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  profile_image?: string | null;
};

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  email_verified: boolean;
  registration_completed: boolean;
  registration_status?: string | null;
  customer_profile?: ApiCustomerProfile | null;
};

export type LoginSuccess = {
  status: 'success';
  message: string;
  token: string;
  token_type: string;
  user: ApiUser;
};

export type LoginConfirmLogout = {
  status: 'confirm_logout';
  message: string;
};

export type AuthStatusResponse = {
  status: string;
  message?: string;
  error_type?: string;
  user_id?: number;
  redirect_url?: string;
  registered_email?: string;
};

function deviceName(): string {
  return `YuktiOne Mobile (${Platform.OS})`;
}

function messageFromResult(result: ApiResult<unknown>): string {
  if (result.ok) {
    return 'Unexpected response.';
  }
  if (result.status === 0) {
    return result.error.message ?? 'Network request failed. Check your connection and API URL.';
  }
  if (result.error.message) {
    return result.error.message;
  }
  const firstFieldError = result.error.errors
    ? Object.values(result.error.errors)[0]?.[0]
    : undefined;
  return firstFieldError ?? 'Request failed.';
}

export type LoginOutcome =
  | { kind: 'success'; data: LoginSuccess }
  | { kind: 'confirm_logout'; message: string }
  | { kind: 'error'; message: string; errorType?: string; status: number };

export async function loginCustomer(input: {
  email: string;
  password: string;
  forceLogin?: boolean;
}): Promise<LoginOutcome> {
  const result = await apiClient.post<LoginSuccess | LoginConfirmLogout | AuthStatusResponse>(
    '/auth/login',
    {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      force_login: Boolean(input.forceLogin),
      device_name: deviceName(),
    },
    false,
    'v1',
  );

  if (result.ok && result.data.status === 'success' && 'token' in result.data) {
    await setAuthToken(result.data.token);
    return { kind: 'success', data: result.data };
  }

  if (
    (!result.ok && result.status === 409) ||
    (result.ok && result.data.status === 'confirm_logout')
  ) {
    const body = result.ok
      ? result.data
      : (result.error as LoginConfirmLogout & { message?: string });
    return {
      kind: 'confirm_logout',
      message:
        body.message ??
        'You are currently logged in on another device. Would you like to log out from all other devices?',
    };
  }

  if (!result.ok) {
    const errorType =
      typeof result.error === 'object' && result.error && 'error_type' in result.error
        ? String((result.error as { error_type?: string }).error_type ?? '')
        : undefined;
    return {
      kind: 'error',
      message: messageFromResult(result),
      errorType: errorType || undefined,
      status: result.status,
    };
  }

  return {
    kind: 'error',
    message: (result.data as AuthStatusResponse).message ?? 'Login failed.',
    status: result.status,
  };
}

export async function fetchCurrentUser(): Promise<
  | { ok: true; user: ApiUser }
  | { ok: false; message: string; status: number }
> {
  const result = await apiClient.get<{ status: string; user: ApiUser }>('/me', true, 'v1');
  if (!result.ok) {
    return { ok: false, message: messageFromResult(result), status: result.status };
  }
  return { ok: true, user: result.data.user };
}

export async function logoutCustomer(): Promise<void> {
  try {
    await apiClient.post('/auth/logout', undefined, true, 'v1');
  } catch {
    // Always clear local token even if the network call fails.
  } finally {
    await clearAuthToken();
  }
}

export async function requestPasswordReset(email: string): Promise<
  | { ok: true; message: string }
  | { ok: false; message: string }
> {
  const result = await apiClient.post<AuthStatusResponse>(
    '/auth/forgot-password',
    { email: email.trim().toLowerCase() },
    false,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFromResult(result) };
  }
  return {
    ok: true,
    message: result.data.message ?? 'If an account exists, reset instructions were sent.',
  };
}

export async function saveCustomerLead(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}): Promise<{ ok: true; userId?: number; message: string } | { ok: false; message: string }> {
  const result = await apiClient.post<AuthStatusResponse>(
    '/auth/register/save-lead',
    input,
    false,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFromResult(result) };
  }
  return {
    ok: true,
    userId: result.data.user_id,
    message: result.data.message ?? 'Information saved.',
  };
}

export async function sendRegistrationOtp(email: string): Promise<
  | { ok: true; message: string }
  | { ok: false; message: string }
> {
  const result = await apiClient.post<AuthStatusResponse>(
    '/auth/register/send-otp',
    { email: email.trim().toLowerCase() },
    false,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFromResult(result) };
  }
  return { ok: true, message: result.data.message ?? 'OTP sent.' };
}

export async function verifyRegistrationOtp(input: {
  email: string;
  otp: string;
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const result = await apiClient.post<AuthStatusResponse>(
    '/auth/register/verify-otp',
    {
      email: input.email.trim().toLowerCase(),
      otp: input.otp,
    },
    false,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFromResult(result) };
  }
  return { ok: true, message: result.data.message ?? 'Verified.' };
}

export async function createIncompleteCustomer(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  otp: string;
}): Promise<{ ok: true; userId: number; message: string } | { ok: false; message: string }> {
  const result = await apiClient.post<AuthStatusResponse>(
    '/auth/register/create-incomplete',
    {
      ...input,
      email: input.email.trim().toLowerCase(),
    },
    false,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFromResult(result) };
  }
  if (!result.data.user_id) {
    return { ok: false, message: 'Verification succeeded but user id was missing.' };
  }
  return {
    ok: true,
    userId: result.data.user_id,
    message: result.data.message ?? 'Email verified. Please set your password.',
  };
}

export async function completeCustomerRegistration(input: {
  user_id: number;
  password: string;
  password_confirmation: string;
}): Promise<{ ok: true; message: string; email?: string } | { ok: false; message: string }> {
  const result = await apiClient.post<AuthStatusResponse>(
    '/auth/register/complete',
    input,
    false,
    'v1',
  );
  if (!result.ok) {
    return { ok: false, message: messageFromResult(result) };
  }
  return {
    ok: true,
    message: result.data.message ?? 'Registration completed. Please login.',
    email: result.data.registered_email,
  };
}
