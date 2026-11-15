import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'yuktione_auth_token';

/**
 * Secure token storage for Sanctum Bearer tokens (wired when mobile APIs land).
 * Uses SecureStore on native; in-memory fallback on web for local testing.
 */
let webMemoryToken: string | null = null;

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webMemoryToken;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryToken = token;
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryToken = null;
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
