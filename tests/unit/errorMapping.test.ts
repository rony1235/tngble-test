import {
  AUTH_ERROR_MESSAGES,
  isSafeAuthErrorMessage,
  mapProviderError,
} from '@/domain/auth';

describe('mapProviderError', () => {
  it('maps cancelled, network, rate limit, blocked, session, invalid input', () => {
    expect(mapProviderError({ message: 'a0.session.user_cancelled' }).code).toBe('cancelled');
    expect(mapProviderError({ message: 'Network request failed' }).code).toBe('network');
    expect(mapProviderError({ status: 429, message: 'slow down' }).code).toBe('rateLimited');
    expect(mapProviderError({ message: 'user is blocked' }).code).toBe('blocked');
    expect(mapProviderError({ message: 'refresh_token expired' }).code).toBe('sessionExpired');
    expect(mapProviderError({ message: 'invalid_email format' }).code).toBe('invalidInput');
  });

  it('maps nullish and non-object errors to generic', () => {
    expect(mapProviderError(null).code).toBe('generic');
    expect(mapProviderError(undefined).code).toBe('generic');
    expect(mapProviderError(42).code).toBe('generic');
    expect(mapProviderError('plain string boom').code).toBe('generic');
  });

  it('passes through already-mapped AuthError values', () => {
    const existing = {
      code: 'invalidInput' as const,
      message: AUTH_ERROR_MESSAGES.invalidInput,
    };
    const mapped = mapProviderError(existing);
    expect(mapped).toEqual(existing);
    expect(mapped.message).toBe('Check your details and try again.');
  });

  it('collapses account-existence and password proximity leaks to generic', () => {
    const samples = [
      'Wrong email or password',
      'user does not exist',
      'invalid_user_password',
      'Email not found',
      '3 attempts remaining',
      'password is almost correct',
    ];

    for (const message of samples) {
      const mapped = mapProviderError({ message });
      expect(mapped.code).toBe('generic');
      expect(mapped.message).toBe(AUTH_ERROR_MESSAGES.generic);
      expect(isSafeAuthErrorMessage(mapped.message)).toBe(true);
    }
  });

  it('maps Auth0 Post-Login email_verification_required to a verify message', () => {
    const mapped = mapProviderError({
      code: 'access_denied',
      message: 'email_verification_required: Please verify your email before continuing.',
    });
    expect(mapped.code).toBe('blocked');
    expect(mapped.message).toMatch(/verify your email/i);
    expect(isSafeAuthErrorMessage(mapped.message)).toBe(true);
  });

  it('maps bare OAuth access_denied / ACCESS_DENIED to verify guidance', () => {
    const fromCode = mapProviderError({
      name: 'access_denied',
      code: 'access_denied',
      message: 'Access denied.',
      type: 'ACCESS_DENIED',
    });
    expect(fromCode.code).toBe('blocked');
    expect(fromCode.message).toMatch(/verify your email/i);

    const fromJson = mapProviderError({
      code: 'access_denied',
      message: 'Access denied.',
      json: {
        error: 'access_denied',
        error_description: 'email_verification_required',
      },
    });
    expect(fromJson.message).toMatch(/verify your email/i);
  });

  it('maps unauthorized_client to required grant guidance', () => {
    const mapped = mapProviderError({
      code: 'unauthorized_client',
      message: "Grant type 'http://auth0.com/oauth/grant-type/password-realm' is not allowed for the client.",
    });
    expect(mapped.code).toBe('generic');
    expect(mapped.message).toMatch(/enable Password and Passwordless OTP/i);
  });

  it('maps invalid_connection to Email OTP connection guidance', () => {
    const mapped = mapProviderError({
      code: 'invalid_connection',
      message: 'Connection does not support email_otp or phone_otp authentication',
    });
    expect(mapped.code).toBe('generic');
    expect(mapped.message).toMatch(/Passwordless Email is not enabled/i);
  });

  it('maps invalid_signup to DB identifier / Attributes guidance', () => {
    const mapped = mapProviderError({
      code: 'invalid_signup',
      message: 'Invalid sign up',
      status: 400,
    });
    expect(mapped.code).toBe('generic');
    expect(mapped.message).toMatch(/Attributes/i);
    expect(mapped.message).toMatch(/Username/i);
    expect(mapped.message).toMatch(/Email/i);
  });

  it('maps account_linking_required to a recoverable verify message', () => {
    const mapped = mapProviderError({
      code: 'access_denied',
      message: 'account_linking_required',
    });
    expect(mapped.message).toMatch(/code was accepted/i);
    expect(mapped.message).toMatch(/Post-Login linking Action/i);
  });

  it('attaches raw Auth0 detail under the safe customized message', () => {
    const mapped = mapProviderError({
      code: 'unauthorized_client',
      message: "Grant type 'password' is not allowed for the client.",
    });
    expect(mapped.message).toMatch(/Grant Types/i);
    expect(mapped.detail).toMatch(/unauthorized_client/i);
    expect(mapped.detail).toMatch(/password/i);
  });

  it('omits detail for credential-enumeration failures', () => {
    const mapped = mapProviderError({ message: 'Wrong email or password' });
    expect(mapped.message).toBe(AUTH_ERROR_MESSAGES.generic);
    expect(mapped.detail).toBeUndefined();
  });

  it('maps a disabled database connection to application guidance', () => {
    const mapped = mapProviderError({
      code: 'bad.connection',
      message: 'The connection is disabled',
    });
    expect(mapped.code).toBe('generic');
    expect(mapped.message).toMatch(/database connection is disabled/i);
  });

  it('maps email_verified signup gate to Verify email on sign up OFF guidance', () => {
    const mapped = mapProviderError({
      message: '"email_verified" needs to be true for user signups.',
    });
    expect(mapped.code).toBe('generic');
    expect(mapped.message).toMatch(/Verify email on sign up/i);
  });

  it('maps user_exists to duplicate-account guidance', () => {
    const mapped = mapProviderError({
      code: 'user_exists',
      message: 'The user already exists.',
    });
    expect(mapped.code).toBe('generic');
    expect(mapped.message).toMatch(/already exists/i);
  });

  it('keeps true account-blocked messaging distinct from access_denied', () => {
    const mapped = mapProviderError({ message: 'user is blocked' });
    expect(mapped.code).toBe('blocked');
    expect(mapped.message).toBe(AUTH_ERROR_MESSAGES.blocked);
  });

  it('never returns unsafe messages for arbitrary provider text', () => {
    const mapped = mapProviderError({ code: 'something_weird', message: 'boom' });
    expect(mapped.code).toBe('generic');
    expect(isSafeAuthErrorMessage(mapped.message)).toBe(true);
  });
});
