import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'yuktione_auth_token';

/**
 * Secure token storage for Sanctum Bearer tokens.
 * Native: Expo SecureStore (Keychain / Keystore), survives app restarts.
 * Web: localStorage so a browser reload keeps the session (SecureStore is unavailable).
 */
let webMemoryToken: string | null = null;

function webStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webMemoryToken ?? webStorage()?.getItem(TOKEN_KEY) ?? null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryToken = token;
    webStorage()?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryToken = null;
    webStorage()?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
