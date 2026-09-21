import * as SecureStore from 'expo-secure-store';

/**
 * Legacy mock-auth session key (pre-AUTH-01).
 * Auth0 credentials live only in Auth0 Credentials Manager — never here.
 */
const LEGACY_SESSION_KEY = 'tngble.session';

/**
 * Delete any leftover pre-Auth0 session blob from SecureStore.
 * Call on sign-out. Do not read or write tokens here.
 */
export async function clearLegacySession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(LEGACY_SESSION_KEY);
  } catch {
    // Best-effort cleanup.
  }
}
