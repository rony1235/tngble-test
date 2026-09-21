import type { Credentials } from 'react-native-auth0';

import {
  AUTH0_CUSTOM_SCHEME,
  AUTH0_SCOPES,
  Auth0Adapter,
  type Auth0ClientLike,
  type Auth0RuntimeConfig,
} from '@/infrastructure/auth';

const config: Auth0RuntimeConfig = {
  domain: 'tngble-dev.us.auth0.com',
  clientId: 'client_test',
  audience: 'https://api.tngble.app',
  customScheme: AUTH0_CUSTOM_SCHEME,
  scope: AUTH0_SCOPES,
};

function credentials(idToken = 'id-default'): Credentials {
  return {
    idToken,
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    refreshToken: 'refresh-token',
    scope: AUTH0_SCOPES,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

function createMockClient(): Auth0ClientLike & {
  webAuth: {
    authorize: jest.Mock;
    resumeSession: jest.Mock;
    clearSession: jest.Mock;
  };
  credentialsManager: {
    saveCredentials: jest.Mock;
    getCredentials: jest.Mock;
    clearCredentials: jest.Mock;
    hasValidCredentials: jest.Mock;
  };
  auth: {
    resetPassword: jest.Mock;
    createUser: jest.Mock;
    passwordRealm: jest.Mock;
  };
} {
  return {
    webAuth: {
      authorize: jest.fn().mockResolvedValue(credentials()),
      resumeSession: jest.fn().mockResolvedValue(null),
      clearSession: jest.fn().mockResolvedValue(undefined),
    },
    credentialsManager: {
      saveCredentials: jest.fn().mockResolvedValue(undefined),
      getCredentials: jest.fn().mockResolvedValue(credentials()),
      clearCredentials: jest.fn().mockResolvedValue(undefined),
      hasValidCredentials: jest.fn().mockResolvedValue(true),
    },
    auth: {
      resetPassword: jest.fn().mockResolvedValue(undefined),
      createUser: jest.fn().mockResolvedValue({ email: 'dev@tngble.app' }),
      passwordRealm: jest.fn().mockResolvedValue(credentials()),
    },
  };
}

describe('Auth0Adapter (integration)', () => {
  it('creates the DB user and sends Email OTP without opening a browser', async () => {
    const client = createMockClient();
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ _id: 'challenge' }));
    const adapter = new Auth0Adapter({
      client,
      config,
      fetchImpl,
    });

    const result = await adapter.signUp({
      email: 'Dev@Tngble.App',
      password: 'Secret123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '501234567',
    });

    expect(client.auth.createUser).toHaveBeenCalledWith({
      email: 'Dev@tngble.app',
      password: 'Secret123!',
      connection: 'Username-Password-Authentication',
      given_name: 'Ada',
      family_name: 'Lovelace',
      name: 'Ada Lovelace',
      metadata: { phone: '501234567' },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://tngble-dev.us.auth0.com/passwordless/start',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          client_id: 'client_test',
          connection: 'email',
          email: 'Dev@tngble.app',
          send: 'code',
          authParams: {
            scope: 'openid profile email offline_access',
          },
        }),
      }),
    );
    expect(client.webAuth.authorize).not.toHaveBeenCalled();
    expect(client.credentialsManager.saveCredentials).not.toHaveBeenCalled();
    expect(result.user).toMatchObject({
      email: 'Dev@tngble.app',
      emailVerified: false,
      name: 'Ada Lovelace',
    });
  });

  it('verifies OTP, authenticates the DB identity, and saves the final session', async () => {
    const client = createMockClient();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ _id: 'challenge' }))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'otp-access', id_token: 'otp-id' }),
      );
    const adapter = new Auth0Adapter({
      client,
      config,
      fetchImpl,
    });

    await adapter.signUp({
      email: 'dev@tngble.app',
      password: 'Secret123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    const result = await adapter.confirmEmailOtp('123456');

    expect(fetchImpl).toHaveBeenLastCalledWith(
      'https://tngble-dev.us.auth0.com/oauth/token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
          client_id: 'client_test',
          username: 'dev@tngble.app',
          otp: '123456',
          realm: 'email',
          scope: AUTH0_SCOPES,
          audience: config.audience,
        }),
      }),
    );
    expect(client.auth.passwordRealm).toHaveBeenCalledWith({
      username: 'dev@tngble.app',
      password: 'Secret123!',
      realm: 'Username-Password-Authentication',
      audience: config.audience,
      scope: AUTH0_SCOPES,
    });
    expect(client.credentialsManager.saveCredentials).toHaveBeenCalledWith(credentials());
    expect(result.user).toMatchObject({
      id: 'auth0|123',
      emailVerified: true,
      name: 'Ada Lovelace',
    });
  });

  it('resends OTP for the pending native signup', async () => {
    const client = createMockClient();
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ _id: 'challenge' }));
    const adapter = new Auth0Adapter({ client, config, fetchImpl });

    await adapter.signUp({
      email: 'resend@tngble.app',
      password: 'Secret123!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    await adapter.requestEmailVerification('resend@tngble.app');

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      'https://tngble-dev.us.auth0.com/passwordless/start',
    );
  });

  it('signUp validates input before creating user', async () => {
    const client = createMockClient();
    const fetchImpl = jest.fn();
    const adapter = new Auth0Adapter({ client, config, fetchImpl });

    await expect(
      adapter.signUp({
        email: 'invalid-email',
        password: 'Secret123!',
        firstName: 'A',
        lastName: 'B',
      }),
    ).rejects.toMatchObject({ code: 'invalidInput' });
    expect(client.auth.createUser).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('signIn with email+password uses passwordRealm (native session)', async () => {
    const client = createMockClient();
    const adapter = new Auth0Adapter({ client, config });

    await adapter.signIn({ email: 'dev@tngble.app', password: 'Secret123!' });

    expect(client.auth.passwordRealm).toHaveBeenCalledWith({
      username: 'dev@tngble.app',
      password: 'Secret123!',
      realm: 'Username-Password-Authentication',
      audience: config.audience,
      scope: AUTH0_SCOPES,
    });
    expect(client.webAuth.authorize).not.toHaveBeenCalled();
    expect(client.credentialsManager.saveCredentials).toHaveBeenCalled();
  });

  it('signIn without password uses Universal Login', async () => {
    const client = createMockClient();
    const adapter = new Auth0Adapter({ client, config });

    await adapter.signIn({ email: 'dev@tngble.app' });

    expect(client.webAuth.authorize).toHaveBeenCalled();
    expect(client.auth.passwordRealm).not.toHaveBeenCalled();
  });

  it('signInWithSocial(google) passes google-oauth2 connection', async () => {
    const client = createMockClient();
    client.webAuth.authorize.mockResolvedValue(credentials('id-google'));
    const adapter = new Auth0Adapter({ client, config });

    const result = await adapter.signInWithSocial('google');

    expect(client.webAuth.authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        connection: 'google-oauth2',
        audience: config.audience,
        scope: AUTH0_SCOPES,
      }),
      { customScheme: AUTH0_CUSTOM_SCHEME },
    );
    expect(result.user.provider).toBe('google');
  });

  it('signInWithSocial recovers via resumeSession when authorize rejects', async () => {
    const client = createMockClient();
    client.webAuth.authorize.mockRejectedValue({ code: 'a0.network_error' });
    client.webAuth.resumeSession.mockResolvedValue(credentials('id-google'));
    const adapter = new Auth0Adapter({ client, config });

    const result = await adapter.signInWithSocial('google');

    expect(client.webAuth.resumeSession).toHaveBeenCalled();
    expect(client.credentialsManager.saveCredentials).toHaveBeenCalled();
    expect(result.user.provider).toBe('google');
  });

  it('restoreSession prefers resumeSession recovery before stored credentials', async () => {
    const client = createMockClient();
    client.credentialsManager.hasValidCredentials.mockResolvedValue(false);
    client.webAuth.resumeSession.mockResolvedValue(credentials('id-recovered'));
    const adapter = new Auth0Adapter({ client, config });

    const result = await adapter.restoreSession();

    expect(client.webAuth.resumeSession).toHaveBeenCalled();
    expect(client.credentialsManager.saveCredentials).toHaveBeenCalled();
    expect(result).not.toBeNull();
  });

  it('signInWithSocial(apple) passes apple connection', async () => {
    const client = createMockClient();
    client.webAuth.authorize.mockResolvedValue(credentials('id-apple'));
    const adapter = new Auth0Adapter({ client, config });

    const result = await adapter.signInWithSocial('apple');

    expect(client.webAuth.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ connection: 'apple' }),
      { customScheme: AUTH0_CUSTOM_SCHEME },
    );
    expect(result.user.provider).toBe('apple');
  });

  it('signOut clears local credentials and always calls Auth0 logout', async () => {
    const client = createMockClient();
    const adapter = new Auth0Adapter({ client, config });

    await adapter.signOut();

    expect(client.credentialsManager.clearCredentials).toHaveBeenCalled();
    expect(client.webAuth.clearSession).toHaveBeenCalledWith(
      {},
      { customScheme: AUTH0_CUSTOM_SCHEME },
    );
  });

  it('signOut calls Auth0 logout after Universal Login', async () => {
    const client = createMockClient();
    const adapter = new Auth0Adapter({ client, config });

    await adapter.signIn({ email: 'dev@tngble.app' });
    await adapter.signOut();

    expect(client.webAuth.clearSession).toHaveBeenCalledWith(
      {},
      { customScheme: AUTH0_CUSTOM_SCHEME },
    );
    expect(client.credentialsManager.clearCredentials).toHaveBeenCalled();
  });

  it('signOut calls Auth0 logout after native password login', async () => {
    const client = createMockClient();
    const adapter = new Auth0Adapter({ client, config });

    await adapter.signIn({ email: 'dev@tngble.app', password: 'Secret123!' });
    await adapter.signOut();

    expect(client.webAuth.clearSession).toHaveBeenCalledWith(
      {},
      { customScheme: AUTH0_CUSTOM_SCHEME },
    );
    expect(client.credentialsManager.clearCredentials).toHaveBeenCalled();
  });

  it('restoreSession returns null when no credentials', async () => {
    const client = createMockClient();
    client.credentialsManager.hasValidCredentials.mockResolvedValue(false);
    const adapter = new Auth0Adapter({ client, config });

    await expect(adapter.restoreSession()).resolves.toBeNull();
  });

  it('clears credentials when refresh/restore fails', async () => {
    const client = createMockClient();
    client.credentialsManager.hasValidCredentials.mockResolvedValue(true);
    client.credentialsManager.getCredentials.mockRejectedValue({
      message: 'refresh_token expired',
    });
    const adapter = new Auth0Adapter({ client, config });

    await expect(adapter.restoreSession()).rejects.toMatchObject({
      code: 'sessionExpired',
    });
    expect(client.credentialsManager.clearCredentials).toHaveBeenCalled();
  });

  it('maps cancelled authorize errors safely', async () => {
    const client = createMockClient();
    client.webAuth.authorize.mockRejectedValue({
      message: 'a0.session.user_cancelled',
    });
    const adapter = new Auth0Adapter({ client, config });

    await expect(adapter.signIn()).rejects.toMatchObject({ code: 'cancelled' });
    expect(client.credentialsManager.saveCredentials).not.toHaveBeenCalled();
  });

  it('requestPasswordReset sends Passwordless Email OTP (not change-password link)', async () => {
    const client = createMockClient();
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ _id: 'challenge' }));
    const adapter = new Auth0Adapter({ client, config, fetchImpl });

    await expect(adapter.requestPasswordReset('  Dev@Example.COM ')).resolves.toBeUndefined();
    expect(client.auth.resetPassword).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://tngble-dev.us.auth0.com/passwordless/start',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          client_id: 'client_test',
          connection: 'email',
          email: 'Dev@example.com',
          send: 'code',
          authParams: {
            scope: 'openid profile email offline_access',
          },
        }),
      }),
    );
  });

  it('requestPasswordReset surfaces network failures', async () => {
    const client = createMockClient();
    const fetchImpl = jest.fn().mockRejectedValue({ message: 'network timeout' });
    const adapter = new Auth0Adapter({ client, config, fetchImpl });

    await expect(adapter.requestPasswordReset('a@b.co')).rejects.toMatchObject({
      code: 'network',
    });
  });

  it('confirmPasswordResetOtp falls back when My Account audience is rejected', async () => {
    const client = createMockClient();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ _id: 'challenge' }))
      .mockResolvedValueOnce(
        jsonResponse(
          { error: 'invalid_request', error_description: 'Service not enabled' },
          400,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'otp-access', id_token: 'otp-id' }),
      );
    const adapter = new Auth0Adapter({
      client,
      config,
      fetchImpl,
    });

    await adapter.requestPasswordReset('dev@tngble.app');
    await expect(adapter.confirmPasswordResetOtp('123456')).resolves.toBeUndefined();

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      'https://tngble-dev.us.auth0.com/oauth/token',
      expect.objectContaining({
        body: expect.not.stringContaining('/me/'),
      }),
    );
  });

  it('confirmPasswordResetOtp + completePasswordReset uses My Account API', async () => {
    const client = createMockClient();
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ _id: 'challenge' }))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'otp-access', id_token: 'otp-id' }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: 'pwd-method', auth_session: 'session-1' }),
      )
      .mockResolvedValueOnce(jsonResponse({}));
    const adapter = new Auth0Adapter({
      client,
      config,
      fetchImpl,
    });

    await adapter.requestPasswordReset('dev@tngble.app');
    await adapter.confirmPasswordResetOtp('123456');
    await adapter.completePasswordReset('Secret123!');

    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://tngble-dev.us.auth0.com/oauth/token',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('https://tngble-dev.us.auth0.com/me/'),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      'https://tngble-dev.us.auth0.com/me/v1/authentication-methods',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'password' }),
      }),
    );
    expect(fetchImpl).toHaveBeenLastCalledWith(
      'https://tngble-dev.us.auth0.com/me/v1/authentication-methods/pwd-method/verify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          auth_session: 'session-1',
          new_password: 'Secret123!',
        }),
      }),
    );
  });

  it('refreshUser force-refreshes credentials', async () => {
    const client = createMockClient();
    client.credentialsManager.getCredentials.mockResolvedValue(credentials('id-unverified'));
    const adapter = new Auth0Adapter({ client, config });

    const result = await adapter.refreshUser();

    expect(client.credentialsManager.getCredentials).toHaveBeenCalledWith(
      AUTH0_SCOPES,
      undefined,
      undefined,
      true,
    );
    expect(result?.user.emailVerified).toBe(false);
  });
});
