import {
  APP_CONFIG,
  buildOriginUrl,
  buildVersionedApiUrl,
  isApiConfigured,
} from '@/constants';
import { getAuthToken } from '@/services/api/tokenStorage';
import type { ApiErrorBody, ApiResult, RequestOptions } from '@/services/api/types';

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

  try {
    const response = await fetch(resolveUrl(options), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
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
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        error: { message: 'Request cancelled' },
      };
    }

    const message =
      error instanceof Error ? error.message : 'Network request failed';

    return {
      ok: false,
      status: 0,
      error: { message },
    };
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
