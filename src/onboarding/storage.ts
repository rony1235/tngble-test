import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'tngble.hasCompletedOnboarding';

export async function getHasCompletedOnboarding(): Promise<boolean> {
  return false;
}

export async function setHasCompletedOnboarding(completed: boolean): Promise<void> {
  const value = completed ? 'true' : 'false';
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(ONBOARDING_KEY, value);
    } catch {
      // ignore quota / private mode
    }
    return;
  }
  await SecureStore.setItemAsync(ONBOARDING_KEY, value);
}
