/* eslint-disable @typescript-eslint/no-require-imports */

const { onExecutePostLogin } = require('../../auth0/actions/post-login-require-email-verified');

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('Auth0 Post-Login OTP identity consolidation', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('verifies the DB user and links the Passwordless Email identity', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(response({ access_token: 'management-token' }))
      .mockResolvedValueOnce(
        response([
          {
            user_id: 'auth0|database-user',
            email: 'dev@example.com',
            email_verified: false,
            identities: [
              {
                provider: 'auth0',
                connection: 'Username-Password-Authentication',
                user_id: 'database-user',
              },
            ],
          },
          {
            user_id: 'email|passwordless-user',
            email: 'dev@example.com',
            email_verified: true,
            identities: [
              { provider: 'email', connection: 'email', user_id: 'passwordless-user' },
            ],
          },
        ]),
      )
      .mockResolvedValueOnce(response({ email_verified: true }))
      .mockResolvedValueOnce(response([]));
    global.fetch = fetchMock as typeof fetch;

    const api = {
      authentication: { setPrimaryUser: jest.fn() },
      access: { deny: jest.fn() },
    };
    await onExecutePostLogin(
      {
        connection: { name: 'email', strategy: 'email' },
        user: {
          user_id: 'email|passwordless-user',
          email: 'dev@example.com',
          email_verified: true,
        },
        secrets: {
          AUTH0_DOMAIN: 'tenant.us.auth0.com',
          M2M_CLIENT_ID: 'm2m-client',
          M2M_CLIENT_SECRET: 'm2m-secret',
        },
      },
      api,
    );

    expect(api.access.deny).not.toHaveBeenCalled();
    expect(api.authentication.setPrimaryUser).toHaveBeenCalledWith(
      'auth0|database-user',
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://tenant.us.auth0.com/api/v2/users/auth0%7Cdatabase-user',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ email_verified: true }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://tenant.us.auth0.com/api/v2/users/auth0%7Cdatabase-user/identities',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ provider: 'email', user_id: 'passwordless-user' }),
      }),
    );
  });

  it('denies the OTP transaction when linking is not configured', async () => {
    const api = {
      authentication: { setPrimaryUser: jest.fn() },
      access: { deny: jest.fn() },
    };

    await onExecutePostLogin(
      {
        connection: { name: 'email', strategy: 'email' },
        user: { user_id: 'email|123', email: 'dev@example.com' },
        secrets: {},
      },
      api,
    );

    expect(api.access.deny).toHaveBeenCalledWith('account_linking_required');
    expect(api.authentication.setPrimaryUser).not.toHaveBeenCalled();
  });
});
