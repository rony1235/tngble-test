import {
  getAppEnv,
  getAuth0PublicConfig,
  tryGetAuth0PublicConfig,
} from '@/infrastructure/config/env';

const AUTH0_KEYS = [
  'EXPO_PUBLIC_AUTH0_DOMAIN',
  'EXPO_PUBLIC_AUTH0_CLIENT_ID',
  'EXPO_PUBLIC_AUTH0_AUDIENCE',
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_USE_MOCK_AUTH',
] as const;

describe('infrastructure/config/env', () => {
  const snapshot: Partial<Record<(typeof AUTH0_KEYS)[number], string | undefined>> = {};

  beforeAll(() => {
    for (const key of AUTH0_KEYS) {
      snapshot[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of AUTH0_KEYS) {
      const value = snapshot[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('returns null Auth0 config when domain or clientId is missing', () => {
    delete process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
    delete process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

    expect(tryGetAuth0PublicConfig()).toBeNull();
    expect(getAppEnv().auth0).toBeNull();
  });

  it('reads Auth0 public config with domain + clientId (audience optional)', () => {
    process.env.EXPO_PUBLIC_AUTH0_DOMAIN = ' tngble-dev.us.auth0.com ';
    process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID = 'client_abc';
    delete process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

    expect(getAuth0PublicConfig()).toEqual({
      domain: 'tngble-dev.us.auth0.com',
      clientId: 'client_abc',
    });
    expect(getAppEnv().auth0?.domain).toBe('tngble-dev.us.auth0.com');
  });

  it('includes audience when set', () => {
    process.env.EXPO_PUBLIC_AUTH0_DOMAIN = 'tngble-dev.us.auth0.com';
    process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID = 'client_abc';
    process.env.EXPO_PUBLIC_AUTH0_AUDIENCE = 'https://api.tngble.app';

    expect(getAuth0PublicConfig().audience).toBe('https://api.tngble.app');
  });

  it('throws a clear error when required Auth0 keys are missing', () => {
    delete process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
    process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID = 'client_abc';
    delete process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

    expect(() => getAuth0PublicConfig()).toThrow(/EXPO_PUBLIC_AUTH0_DOMAIN/);
  });

  it('defaults apiUrl and treats mock auth as on unless explicitly false', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_USE_MOCK_AUTH;

    const env = getAppEnv();
    expect(env.apiUrl).toBe('http://localhost:3000');
    expect(env.useMockAuth).toBe(true);

    process.env.EXPO_PUBLIC_USE_MOCK_AUTH = 'false';
    expect(getAppEnv().useMockAuth).toBe(false);
  });
});
