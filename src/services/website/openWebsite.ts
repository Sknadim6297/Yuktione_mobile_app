import { Alert, Linking, Platform } from 'react-native';

import {
  APP_CONFIG,
  buildOriginUrl,
  isApiConfigured,
  WEBSITE_PATHS,
  type WebsitePathKey,
} from '@/constants';

export type OpenWebsiteOptions = {
  /** Confirm with the user that the system browser will open. Default true. */
  confirm?: boolean;
  title?: string;
  message?: string;
};

/**
 * Opens a verified website path in the system browser.
 * Prefer this for login, registration, booking, and any session-sensitive flow.
 * Never automates CSRF, cookies, OTP, or payments.
 */
export async function openWebsitePath(
  key: WebsitePathKey,
  options: OpenWebsiteOptions = {},
): Promise<boolean> {
  if (!isApiConfigured()) {
    Alert.alert(
      'Website URL not configured',
      'Set EXPO_PUBLIC_API_BASE_URL to your Laravel origin before opening website pages.',
    );
    return false;
  }

  const path = WEBSITE_PATHS[key];
  const url = buildOriginUrl(path);
  const confirm = options.confirm !== false;

  const proceed = async () => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Unable to open browser', `Cannot open:\n${url}`);
      return false;
    }
    await Linking.openURL(url);
    return true;
  };

  if (!confirm) {
    return proceed();
  }

  // react-native-web's Alert.alert is a no-op, so buttons would never resolve.
  if (Platform.OS === 'web') {
    const ok = globalThis.confirm?.(`${options.title ?? 'Open YuktiOne website'}\n\n${url}`) ?? true;
    return ok ? proceed() : false;
  }

  return new Promise((resolve) => {
    Alert.alert(
      options.title ?? 'Open YuktiOne website',
      options.message ??
        `This opens the existing website in your browser for a secure session.\n\n${url}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Open browser',
          onPress: () => {
            void proceed().then(resolve);
          },
        },
      ],
    );
  });
}

export function getWebsiteOriginLabel(): string {
  return isApiConfigured() ? APP_CONFIG.apiBaseUrl : '(not configured)';
}
