/**
 * Shared API envelope types.
 * Response shapes will mirror Laravel /api/v1 once those endpoints exist.
 * Do not invent production payloads here.
 */

export type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: ApiErrorBody; status: number };

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  path: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};
