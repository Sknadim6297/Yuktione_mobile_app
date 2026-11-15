/**
 * Public runtime config. Only EXPO_PUBLIC_* values are readable in the client.
 * Never store secrets, DB credentials, or private API keys here.
 *
 * EXPO_PUBLIC_API_BASE_URL must be the Laravel web origin (no /api suffix), e.g.:
 * - Android emulator → host machine: http://10.0.2.2/tazen_web/public_html/public
 * - iOS simulator: http://localhost/tazen_web/public_html/public
 * - Physical device: http://<LAN-IP>/tazen_web/public_html/public
 *
 * Public availability routes live under /api/...
 * Sanctum customer auth routes live under /api/v1/...
 */
const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '';

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '');
}

export const APP_CONFIG = {
  appName: 'YuktiOne',
  /** Laravel public origin only — no trailing slash, no /api path. */
  apiBaseUrl: normalizeOrigin(rawBaseUrl),
  /** Confirmed live public API prefix (availability). */
  publicApiPrefix: '/api',
  /** Sanctum mobile auth APIs. */
  apiVersionPath: '/api/v1',
} as const;

export function isApiConfigured(): boolean {
  return APP_CONFIG.apiBaseUrl.length > 0;
}

/** Absolute URL for a path on the Laravel origin (must start with /). */
export function buildOriginUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_CONFIG.apiBaseUrl}${normalizedPath}`;
}

/** Absolute URL under the public /api prefix. */
export function buildPublicApiUrl(pathWithinApi: string): string {
  const suffix = pathWithinApi.startsWith('/')
    ? pathWithinApi
    : `/${pathWithinApi}`;
  return buildOriginUrl(`${APP_CONFIG.publicApiPrefix}${suffix}`);
}

/** Absolute URL under /api/v1. */
export function buildVersionedApiUrl(pathWithinV1: string): string {
  const suffix = pathWithinV1.startsWith('/')
    ? pathWithinV1
    : `/${pathWithinV1}`;
  return buildOriginUrl(`${APP_CONFIG.apiVersionPath}${suffix}`);
}
