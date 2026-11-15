import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ONBOARDING_COMPLETE_KEY = 'yuktione_onboarding_complete';

let webMemoryFlag: string | null = null;

export async function isOnboardingComplete(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return webMemoryFlag === '1';
  }
  const value = await SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY);
  return value === '1';
}

export async function setOnboardingComplete(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryFlag = '1';
    return;
  }
  await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, '1');
}

export async function clearOnboardingComplete(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryFlag = null;
    return;
  }
  await SecureStore.deleteItemAsync(ONBOARDING_COMPLETE_KEY);
}
