import {
  AUTH0_CUSTOM_SCHEME,
  AUTH0_SCOPES,
  getAuth0CallbackUrls,
  getAuth0RuntimeConfig,
} from '@/infrastructure/auth/Auth0Config';

describe('Auth0Config', () => {
  const keys = [
    'EXPO_PUBLIC_AUTH0_DOMAIN',
    'EXPO_PUBLIC_AUTH0_CLIENT_ID',
    'EXPO_PUBLIC_AUTH0_AUDIENCE',
  ] as const;
  const snapshot: Partial<Record<(typeof keys)[number], string | undefined>> = {};

  beforeAll(() => {
    for (const key of keys) {
      snapshot[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      const value = snapshot[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('builds runtime config with scheme and scopes (audience optional)', () => {
    process.env.EXPO_PUBLIC_AUTH0_DOMAIN = 'tngble-dev.us.auth0.com';
    process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID = 'client_abc';
    delete process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

    expect(getAuth0RuntimeConfig()).toEqual({
      domain: 'tngble-dev.us.auth0.com',
      clientId: 'client_abc',
      customScheme: AUTH0_CUSTOM_SCHEME,
      scope: AUTH0_SCOPES,
    });
    expect(AUTH0_CUSTOM_SCHEME).toBe('tngble');
    expect(AUTH0_SCOPES).toContain('offline_access');
  });

  it('builds callback URLs for iOS and Android', () => {
    const urls = getAuth0CallbackUrls('tngble-dev.us.auth0.com');
    expect(urls.ios).toBe('tngble://tngble-dev.us.auth0.com/ios/com.tngble.app/callback');
    expect(urls.android).toBe(
      'tngble://tngble-dev.us.auth0.com/android/com.tngble.app/callback',
    );
  });
});
