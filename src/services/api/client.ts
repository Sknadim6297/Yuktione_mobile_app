import {
  APP_CONFIG,
  buildOriginUrl,
  buildVersionedApiUrl,
  isApiConfigured,
} from '@/constants';
import { getAuthToken } from '@/services/api/tokenStorage';
import type { ApiErrorBody, ApiResult, RequestOptions } from '@/services/api/types';

/** Fail fast with a clear message instead of hanging when the server is unreachable. */
const REQUEST_TIMEOUT_MS = 15_000;

/** The server sends the OTP email synchronously (SMTP can take 15s+), so allow more time. */
export const OTP_REQUEST_TIMEOUT_MS = 90_000;

export class ApiClientError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(message: string, status: number, body: ApiErrorBody = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.body = body;
  }
}

export type ApiRequestMode = 'origin' | 'public' | 'v1';

export type ExtendedRequestOptions = RequestOptions & {
  /**
   * - origin: path is absolute on Laravel origin (e.g. /api/...)
   * - public: path is under /api (availability)
   * - v1: path is under /api/v1 (Sanctum customer auth)
   */
  mode?: ApiRequestMode;
};

function resolveUrl(options: ExtendedRequestOptions): string {
  const path = options.path.startsWith('/') ? options.path : `/${options.path}`;
  const mode = options.mode ?? 'v1';

  if (mode === 'origin') {
    return buildOriginUrl(path);
  }
  if (mode === 'public') {
    return buildOriginUrl(
      path.startsWith('/api/') || path === '/api'
        ? path
        : `${APP_CONFIG.publicApiPrefix}${path}`,
    );
  }
  return path.startsWith('/api/v1')
    ? buildOriginUrl(path)
    : buildVersionedApiUrl(path);
}

/**
 * Centralized HTTP client.
 * Availability: mode "public". Customer Sanctum auth: mode "v1".
 */
export async function apiRequest<T>(
  options: ExtendedRequestOptions,
): Promise<ApiResult<T>> {
  if (!isApiConfigured()) {
    return {
      ok: false,
      status: 0,
      error: {
        message:
          'API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL to your Laravel origin (without /api).',
      },
    };
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  // Without a timeout an unreachable server (wrong IP, firewall, different Wi-Fi)
  // leaves the UI waiting forever, which looks like "nothing happens".
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', onExternalAbort);
    }
  }

  try {
    const response = await fetch(resolveUrl(options), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? ((await response.json()) as unknown) : null;

    if (!response.ok) {
      const errorBody =
        payload && typeof payload === 'object'
          ? (payload as ApiErrorBody)
          : { message: response.statusText || 'Request failed' };

      return {
        ok: false,
        status: response.status,
        error: errorBody,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload as T,
    };
  } catch (error) {
    if (timedOut) {
      return {
        ok: false,
        status: 0,
        error: {
          message: `Cannot reach the YuktiOne server (${APP_CONFIG.apiBaseUrl}). Make sure the backend is running and your phone is on the same Wi-Fi as the computer, then try again.`,
        },
      };
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        error: { message: 'Request cancelled' },
      };
    }

    const rawMessage =
      error instanceof Error ? error.message : 'Network request failed';
    const message = /network request failed|failed to fetch|load failed/i.test(rawMessage)
      ? `Cannot reach the YuktiOne server (${APP_CONFIG.apiBaseUrl}). Make sure the backend is running and your phone is on the same Wi-Fi as the computer.`
      : rawMessage;

    return {
      ok: false,
      status: 0,
      error: { message },
    };
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}

export const apiClient = {
  get: <T>(path: string, auth = true, mode: ApiRequestMode = 'v1') =>
    apiRequest<T>({ method: 'GET', path, auth, mode }),
  post: <T>(
    path: string,
    body?: unknown,
    auth = true,
    mode: ApiRequestMode = 'v1',
  ) => apiRequest<T>({ method: 'POST', path, body, auth, mode }),
  put: <T>(
    path: string,
    body?: unknown,
    auth = true,
    mode: ApiRequestMode = 'v1',
  ) => apiRequest<T>({ method: 'PUT', path, body, auth, mode }),
  patch: <T>(
    path: string,
    body?: unknown,
    auth = true,
    mode: ApiRequestMode = 'v1',
  ) => apiRequest<T>({ method: 'PATCH', path, body, auth, mode }),
  delete: <T>(path: string, auth = true, mode: ApiRequestMode = 'v1') =>
    apiRequest<T>({ method: 'DELETE', path, auth, mode }),
};
