import type { AuthService } from '@/domain/auth';
import { Auth0Adapter } from '@/infrastructure/auth/Auth0Adapter';
import { FakeAuthAdapter, type FakeAuthAdapterOptions } from '@/infrastructure/auth/FakeAuthAdapter';
import { tryGetAuth0PublicConfig } from '@/infrastructure/config/env';

/** Production Auth0-backed service. */
export function createAuthService(): AuthService {
  return new Auth0Adapter();
}

/** Test / storybook Fake service. */
export function createFakeAuthService(options?: FakeAuthAdapterOptions): FakeAuthAdapter {
  return new FakeAuthAdapter(options);
}

/**
 * App boot service selection:
 * - Auth0 when public config is set and mock auth is disabled
 * - Fake otherwise (keeps Expo Go / local boot working until tenant env is ready)
 */
export function createAppAuthService(): AuthService {
  const auth0 = tryGetAuth0PublicConfig();
  const useMock = process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== 'false';
  if (auth0 && !useMock) {
    return createAuthService();
  }
  return createFakeAuthService({ scenario: 'success' });
}
