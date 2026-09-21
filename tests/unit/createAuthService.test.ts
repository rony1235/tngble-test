import { createAppAuthService, createFakeAuthService } from '@/application/auth/createAuthService';
import { FakeAuthAdapter } from '@/infrastructure/auth/FakeAuthAdapter';

describe('createAuthService factory', () => {
  const originalMock = process.env.EXPO_PUBLIC_USE_MOCK_AUTH;
  const originalDomain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
  const originalClient = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID;
  const originalAudience = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCK_AUTH = originalMock;
    process.env.EXPO_PUBLIC_AUTH0_DOMAIN = originalDomain;
    process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID = originalClient;
    process.env.EXPO_PUBLIC_AUTH0_AUDIENCE = originalAudience;
  });

  it('createFakeAuthService returns FakeAuthAdapter', () => {
    expect(createFakeAuthService({ scenario: 'success' })).toBeInstanceOf(FakeAuthAdapter);
  });

  it('createAppAuthService uses Fake when Auth0 env missing or mock enabled', () => {
    delete process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
    delete process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;
    process.env.EXPO_PUBLIC_USE_MOCK_AUTH = 'true';

    expect(createAppAuthService()).toBeInstanceOf(FakeAuthAdapter);
  });

  it('createAppAuthService uses Auth0 when domain+client set (no audience) and mock false', () => {
    process.env.EXPO_PUBLIC_AUTH0_DOMAIN = 'tngble-dev.us.auth0.com';
    process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID = 'client';
    delete process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;
    process.env.EXPO_PUBLIC_USE_MOCK_AUTH = 'false';

    expect(createAppAuthService()).not.toBeInstanceOf(FakeAuthAdapter);
  });
});
