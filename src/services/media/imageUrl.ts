import { APP_CONFIG, isApiConfigured } from '@/constants/config';

const ABSOLUTE = /^(https?:\/\/[^/?#]+)([/?#].*)?$/i;
const LOOPBACK_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2)(:\d+)?$/i;

function apiAuthority(): string | null {
  if (!isApiConfigured()) return null;
  return ABSOLUTE.exec(APP_CONFIG.apiBaseUrl)?.[1] ?? null;
}

/**
 * Absolute URL for an image coming from the website or API, or null when it can't be shown.
 *
 * - https/http URLs are kept, except loopback hosts (a server whose APP_URL is localhost),
 *   which are moved onto the configured API host so phones never request their own localhost.
 * - Relative paths resolve against EXPO_PUBLIC_API_BASE_URL (which may include a sub-path).
 * - data:, file: and other schemes, path traversal and private storage paths are rejected.
 */
export function resolveImageUrl(value: string | null | undefined): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;

  const absolute = ABSOLUTE.exec(raw);
  if (absolute) {
    const authority = absolute[1]!;
    const local = apiAuthority();
    if (LOOPBACK_HOST.test(authority) && local && local.toLowerCase() !== authority.toLowerCase()) {
      return `${local}${absolute[2] ?? ''}`;
    }
    return raw;
  }

  if (raw.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  if (raw.includes('..') || /(^|\/)storage\/app\//i.test(raw)) return null;
  if (!isApiConfigured()) return null;

  const path = raw.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
  return `${APP_CONFIG.apiBaseUrl}/${path}`;
}

/** Static images that ship with the website under public/. */
export const WEBSITE_IMAGES = {
  /** Home hero poster (resources/views/frontend/home/partials/hero.blade.php). */
  hero: 'frontend/assets/img/yuktione-hero-poster.jpg',
  /** Experts directory hero (resources/views/frontend/sections/experts.blade.php). */
  experts: 'frontend/assets/img/experts-hero.webp',
  /** Silk ribbon band under the home hero. */
  ribbon: 'frontend/assets/img/yuktione-silk-ribbon.jpg',
  /** Consultation room photo from the home "Why Choose" section (benefits.blade.php). */
  consultation: 'frontend/assets/img/professionals_photos/about-work-section.jpeg',
} as const;

export function websiteImage(key: keyof typeof WEBSITE_IMAGES): string | null {
  return resolveImageUrl(WEBSITE_IMAGES[key]);
}
