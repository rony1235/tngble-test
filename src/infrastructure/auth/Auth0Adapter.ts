import Auth0, {
  parseIdToken,
  type Credentials,
  type WebAuthorizeParameters,
} from 'react-native-auth0';

import type {
  AuthResult,
  AuthService,
  SignInInput,
  SignUpInput,
  SocialProvider,
  User,
} from '@/domain/auth';
import { createAuthError } from '@/domain/auth';
import {
  validateEmail,
  validateName,
  validatePassword,
  validateVerificationCode,
} from '@/domain/sanitization';
import {
  getAuth0RuntimeConfig,
  type Auth0RuntimeConfig,
} from '@/infrastructure/auth/Auth0Config';
import { mapAuth0Error } from '@/infrastructure/auth/auth0Errors';
import {
  inferProviderFromUser,
  mapCredentialsToAuthResult,
  mapSocialConnection,
} from '@/infrastructure/auth/mappers';
import { logger } from '@/infrastructure/logging';
import { clearLegacySession } from '@/infrastructure/storage/clearLegacySession';
import { CredentialsManager } from '@/infrastructure/storage/CredentialsManager';
import {
  secureDelete,
  secureGet,
  secureSet,
} from '@/infrastructure/storage/SecureStorage';

export const AUTH0_DB_CONNECTION = 'Username-Password-Authentication';
export const AUTH0_PASSWORDLESS_EMAIL_CONNECTION = 'email';
export const PASSWORDLESS_OTP_GRANT =
  'http://auth0.com/oauth/grant-type/passwordless/otp';

const AUTH_SESSION_MODE_KEY = 'tngble.auth.sessionMode';
type AuthSessionMode = 'native' | 'browser';

type PendingEmailOtp = {
  email: string;
  /**
   * Kept in memory only until OTP verification completes so we can establish
   * the database session immediately afterwards. Never persist this value.
   */
  password: string;
  provisionalUser: User;
};

type PendingPasswordReset = {
  email: string;
  /** Passwordless ID token proving mailbox control — set after OTP confirm. */
  proofToken?: string;
  /** Access token used for Auth0 My Account password change (no custom API). */
  accessToken?: string;
};

type OAuthTokenResponse = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

type NativeVerificationResponse = {
  email: string;
  userId: string;
  emailVerified: true;
};

export type Auth0ClientLike = {
  webAuth: {
    authorize: (
      parameters?: WebAuthorizeParameters,
      options?: { customScheme?: string },
    ) => Promise<Credentials>;
    /**
     * Android-only: drain credentials recovered after process death during
     * Universal Login / Custom Tabs (Auth0 SDK ≥ 5.8). Resolves null elsewhere.
     */
    resumeSession?: () => Promise<Credentials | null>;
    clearSession: (
      parameters?: { federated?: boolean },
      options?: { customScheme?: string },
    ) => Promise<void>;
  };
  credentialsManager: {
    saveCredentials: (credentials: Credentials) => Promise<void>;
    getCredentials: (
      scope?: string,
      minTtl?: number,
      parameters?: Record<string, unknown>,
      forceRefresh?: boolean,
    ) => Promise<Credentials>;
    clearCredentials: () => Promise<void>;
    hasValidCredentials: (minTtl?: number) => Promise<boolean>;
  };
  auth: {
    resetPassword: (parameters: {
      email: string;
      connection: string;
    }) => Promise<void>;
    createUser: (parameters: {
      email: string;
      password: string;
      connection: string;
      /** Only when the DB connection Requires Username / username signup Required. */
      username?: string;
      given_name?: string;
      family_name?: string;
      name?: string;
      metadata?: Record<string, string>;
    }) => Promise<unknown>;
    passwordRealm: (parameters: {
      username: string;
      password: string;
      realm: string;
      audience?: string;
      scope?: string;
    }) => Promise<Credentials>;
  };
};

export type Auth0AdapterOptions = {
  client?: Auth0ClientLike;
  config?: Auth0RuntimeConfig;
  dbConnection?: string;
  fetchImpl?: typeof fetch;

  /**
   * Optional HTTPS backend endpoint that accepts:
   *   POST { proofToken: <Auth0 passwordless ID token> }
   *
   * The backend verifies the token and uses the Auth0 Management API to set
   * email_verified=true on the matching DATABASE user.
   */
  emailVerificationApiUrl?: string;
};

function createDefaultClient(config: Auth0RuntimeConfig): Auth0ClientLike {
  return new Auth0({
    domain: config.domain,
    clientId: config.clientId,
  }) as unknown as Auth0ClientLike;
}

function isUserAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as {
    code?: string;
    message?: string;
    error?: string;
    error_description?: string;
  };

  const text = [
    err.code,
    err.message,
    err.error,
    err.error_description,
  ]
    .filter(Boolean)
    .join(' ');

  return /user_exists|already.?exists|user.?already.?exist/i.test(text);
}

function withRequiredScopes(scope: string | undefined): string {
  const scopes = new Set(
    (scope ?? '')
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean),
  );

  scopes.add('openid');
  scopes.add('profile');
  scopes.add('email');

  return [...scopes].join(' ');
}

export class Auth0Adapter implements AuthService {
  private readonly client: Auth0ClientLike;
  private readonly config: Auth0RuntimeConfig;
  private readonly credentials: CredentialsManager;
  private readonly dbConnection: string;
  private readonly fetchImpl: typeof fetch;
  private readonly emailVerificationApiUrl?: string;

  private pendingOtp: PendingEmailOtp | null = null;
  private pendingPasswordReset: PendingPasswordReset | null = null;
  private sessionMode: AuthSessionMode | null = null;

  constructor(options?: Auth0AdapterOptions) {
    this.config = options?.config ?? getAuth0RuntimeConfig();
    this.client = options?.client ?? createDefaultClient(this.config);
    this.credentials = new CredentialsManager(this.client.credentialsManager);
    this.dbConnection = options?.dbConnection ?? AUTH0_DB_CONNECTION;
    this.fetchImpl = options?.fetchImpl ?? fetch.bind(globalThis);
    this.emailVerificationApiUrl =
      options?.emailVerificationApiUrl ??
      process.env.EXPO_PUBLIC_EMAIL_VERIFICATION_API_URL;
  }

  // ============================================================================
  // 1. NATIVE SIGN UP
  // Email + password -> Auth0 DB user created -> Auth0 sends email OTP
  // ============================================================================
  async signUp(input?: SignUpInput): Promise<AuthResult> {
    if (!input) {
      throw createAuthError('invalidInput');
    }

    const emailResult = validateEmail(input.email);
    const passwordResult = validatePassword(input.password);
    const firstNameResult = validateName(input.firstName ?? '');
    const lastNameResult = validateName(input.lastName ?? '');

    if (
      !emailResult.ok ||
      !passwordResult.ok ||
      !firstNameResult.ok ||
      !lastNameResult.ok
    ) {
      throw createAuthError('invalidInput');
    }

    const email = emailResult.value;
    const password = passwordResult.value;
    const firstName = firstNameResult.value;
    const lastName = lastNameResult.value;
    const phone = input.phone?.trim();
    const displayName = `${firstName} ${lastName}`.trim();

    try {
      await this.client.auth.createUser({
        email,
        password,
        connection: this.dbConnection,
        given_name: firstName,
        family_name: lastName,
        name: displayName,
        metadata: phone ? { phone } : undefined,
      });
    } catch (error) {
      // Allows a user to resume an interrupted verification attempt.
      if (!isUserAlreadyExistsError(error)) {
        logger.warn('Auth0 native signUp createUser failed', { error });
        throw mapAuth0Error(error);
      }

      logger.info('Database user already exists; restarting email OTP flow', {
        email,
      });
    }

    const provisionalUser: User = {
      id: `pending|${email}`,
      email,
      emailVerified: false,
      name: displayName,
      provider: 'database',
    };

    try {
      await this.sendEmailOtp(email);

      this.pendingOtp = {
        email,
        password,
        provisionalUser,
      };

      return { user: provisionalUser };
    } catch (error) {
      this.pendingOtp = null;
      logger.warn('Auth0 native sendEmailOtp failed', { error });
      throw mapAuth0Error(error);
    }
  }

  // ============================================================================
  // 2. NATIVE OTP CONFIRMATION
  // OTP -> Auth0 passwordless proof -> backend marks DB email_verified=true
  // -> native DB login -> continue
  // ============================================================================
  async confirmEmailOtp(code: string): Promise<AuthResult> {
    const validated = validateVerificationCode(code);
    if (!validated.ok) {
      throw createAuthError('invalidInput');
    }

    const pending = this.pendingOtp;
    if (!pending) {
      throw createAuthError('sessionExpired');
    }

    try {
      // Auth0 verifies the OTP and returns tokens for the passwordless `email`
      // identity. This is proof that the user controls the mailbox.
      const otpCredentials = await this.verifyEmailOtp(
        pending.email,
        validated.value,
      );

      if (!otpCredentials.idToken) {
        throw createAuthError(
          'generic',
          'We could not verify that code. Please request a new one and try again.',
        );
      }

      // If backend verification endpoint is configured, patch DB email_verified
      if (this.emailVerificationApiUrl) {
        const verification = await this.confirmDatabaseEmailVerified(
          otpCredentials.idToken,
        );

        if (
          verification.email.trim().toLowerCase() !==
          pending.email.trim().toLowerCase()
        ) {
          throw createAuthError(
            'generic',
            'That code does not match this signup. Start again with your email.',
          );
        }
      }

      // Establish the REAL application session against the database identity.
      const credentials = await this.databaseLogin(
        pending.email,
        pending.password,
      );

      await this.credentials.save(credentials);
      await this.setSessionMode('native');

      const result = this.toResult(
        credentials,
        'database',
        pending.provisionalUser,
      );
      result.user.emailVerified = true;

      this.pendingOtp = null;
      return result;
    } catch (error) {
      logger.warn('Auth0 native confirmEmailOtp failed', { error });
      throw mapAuth0Error(error);
    }
  }

  // ============================================================================
  // 3. NATIVE RESEND OTP
  // ============================================================================
  async requestEmailVerification(email?: string): Promise<void> {
    const raw = email?.trim() || this.pendingOtp?.email || '';
    const validated = validateEmail(raw);

    if (!validated.ok) {
      throw createAuthError(
        this.pendingOtp ? 'invalidInput' : 'sessionExpired',
      );
    }

    try {
      await this.sendEmailOtp(validated.value);
    } catch (error) {
      throw mapAuth0Error(error);
    }
  }

  // ============================================================================
  // 4. EMAIL/PASSWORD LOGIN
  // Native Password Grant when email+password; otherwise Universal Login.
  // ============================================================================
  async signIn(input?: SignInInput): Promise<AuthResult> {
    const loginHint = input?.email?.trim();
    const password = input?.password;

    if (loginHint) {
      const emailResult = validateEmail(loginHint);
      if (!emailResult.ok) {
        throw createAuthError('invalidInput');
      }
    }

    if (password != null && password.length > 0) {
      if (!loginHint) {
        throw createAuthError('invalidInput');
      }

      const passwordResult = validatePassword(password);
      if (!passwordResult.ok) {
        throw createAuthError('invalidInput');
      }

      try {
        const credentials = await this.databaseLogin(loginHint, passwordResult.value);
        this.pendingOtp = null;
        await this.credentials.save(credentials);
        await this.setSessionMode('native');
        return this.toResult(credentials, 'database');
      } catch (error) {
        throw mapAuth0Error(error);
      }
    }

    const parameters: WebAuthorizeParameters = {
      scope: withRequiredScopes(this.config.scope),
      ...(this.config.audience ? { audience: this.config.audience } : {}),
      connection: this.dbConnection,
      ...(loginHint ? { additionalParameters: { login_hint: loginHint } } : {}),
    };

    try {
      const credentials = await this.client.webAuth.authorize(parameters, {
        customScheme: this.config.customScheme,
      });

      this.pendingOtp = null;
      await this.credentials.save(credentials);
      await this.setSessionMode('browser');
      return this.toResult(credentials, 'database');
    } catch (error) {
      const recovered = await this.recoverWebAuthSession('database');
      if (recovered) return recovered;
      throw mapAuth0Error(error);
    }
  }

  // Social providers still use Auth0's authorization flow because OAuth/OIDC
  // providers require their authorization endpoint. Database auth remains native.
  async signInWithSocial(provider: SocialProvider): Promise<AuthResult> {
    return this.authorizeSocial(provider);
  }

  async signOut(): Promise<void> {
    this.pendingOtp = null;
    this.pendingPasswordReset = null;

    // Local logout first so the UI can leave the authenticated shell immediately.
    try {
      await this.credentials.clear();
    } catch (error) {
      logger.warn('Auth0 local credential cleanup failed', {
        error: mapAuth0Error(error).code,
      });
    }
    await clearLegacySession();
    await this.clearSessionMode();

    // Always hit Auth0 `/v2/logout` (Custom Tabs) so the hosted session cookie
    // is cleared — same path for native password and Google / Universal Login.
    try {
      await this.client.webAuth.clearSession(
        {},
        { customScheme: this.config.customScheme },
      );
    } catch (error) {
      logger.info('Auth0 logout request finished with no web session', {
        error: mapAuth0Error(error).code,
      });
    }
  }

  async requestPasswordReset(email?: string): Promise<void> {
    const validated = validateEmail(email ?? '');
    if (!validated.ok) {
      throw createAuthError('invalidInput');
    }

    // Passwordless Email OTP — same code email as signup — not Auth0's
    // change_password link ticket (`resetPassword` / Change Password template).
    try {
      await this.sendEmailOtp(validated.value);
      this.pendingPasswordReset = { email: validated.value };
    } catch (error) {
      const mapped = mapAuth0Error(error);

      if (mapped.code === 'network' || mapped.code === 'rateLimited') {
        throw mapped;
      }

      // Avoid account enumeration. UI can always advance to the OTP screen.
      this.pendingPasswordReset = { email: validated.value };
    }
  }

  async confirmPasswordResetOtp(code: string): Promise<void> {
    const validated = validateVerificationCode(code);
    if (!validated.ok) {
      throw createAuthError('invalidInput');
    }

    const pending = this.pendingPasswordReset;
    if (!pending?.email) {
      throw createAuthError('sessionExpired');
    }

    try {
      // Prefer a My Account API token so Screen 3 can set the password in-app.
      // Fall back to a normal Passwordless token if the tenant has not enabled
      // `https://{domain}/me/` yet — OTP verify must still succeed.
      let credentials: Credentials;
      try {
        credentials = await this.verifyEmailOtp(pending.email, validated.value, {
          audience: `https://${this.config.domain}/me/`,
          extraScopes: 'create:me:authentication_methods',
        });
      } catch (meError) {
        logger.info('My Account OTP audience unavailable; using standard Passwordless token', {
          error: mapAuth0Error(meError).code,
        });
        credentials = await this.verifyEmailOtp(pending.email, validated.value);
      }
      if (!credentials.idToken || !credentials.accessToken) {
        throw createAuthError(
          'generic',
          'We could not verify that code. Please request a new one and try again.',
        );
      }
      this.pendingPasswordReset = {
        email: pending.email,
        proofToken: credentials.idToken,
        accessToken: credentials.accessToken,
      };
    } catch (error) {
      throw mapAuth0Error(error);
    }
  }

  async completePasswordReset(password: string): Promise<void> {
    const passwordResult = validatePassword(password);
    if (!passwordResult.ok) {
      throw createAuthError('invalidInput');
    }

    const pending = this.pendingPasswordReset;
    if (!pending?.email || !pending.accessToken) {
      throw createAuthError('sessionExpired');
    }

    const methodsUrl = `https://${this.config.domain}/me/v1/authentication-methods`;

    let startResponse: Response;
    try {
      startResponse = await this.fetchImpl(methodsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pending.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'password' }),
      });
    } catch (error) {
      throw mapAuth0Error(error);
    }

    const startBody = (await startResponse.json().catch(() => ({}))) as {
      id?: string;
      auth_session?: string;
      error?: string;
      message?: string;
      error_description?: string;
    };

    if (!startResponse.ok) {
      throw createAuthError(
        'generic',
        'We could not start password reset right now. Please try again later.',
        startBody.error_description ?? startBody.message ?? startBody.error,
      );
    }

    const methodId = startBody.id;
    const authSession = startBody.auth_session;
    if (!methodId || !authSession) {
      throw createAuthError(
        'generic',
        'We could not start password reset right now. Please try again later.',
      );
    }

    let verifyResponse: Response;
    try {
      verifyResponse = await this.fetchImpl(`${methodsUrl}/${methodId}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pending.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_session: authSession,
          new_password: passwordResult.value,
        }),
      });
    } catch (error) {
      throw mapAuth0Error(error);
    }

    if (!verifyResponse.ok) {
      const body = (await verifyResponse.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        error_description?: string;
      };
      throw {
        code: body.error ?? `http_${verifyResponse.status}`,
        message:
          body.error_description ??
          body.message ??
          body.error ??
          `Password update failed (${verifyResponse.status})`,
        status: verifyResponse.status,
        json: body,
      };
    }

    this.pendingPasswordReset = null;
  }

  async restoreSession(): Promise<AuthResult | null> {
    try {
      // Xiaomi/MIUI often kills the app while Chrome Custom Tabs is open.
      // Auth0 finishes the code→token exchange on restart; drain it here.
      const recovered = await this.recoverWebAuthSession();
      if (recovered) return recovered;

      const has = await this.credentials.hasValid();
      if (!has) return null;

      const credentials = await this.credentials.get(this.config.scope);
      return this.toResult(credentials as Credentials);
    } catch (error) {
      logger.warn('Session restore failed; clearing credentials', {
        error: mapAuth0Error(error).code,
      });
      await this.credentials.clear();
      throw mapAuth0Error(error);
    }
  }

  async refreshUser(): Promise<AuthResult | null> {
    try {
      const has = await this.credentials.hasValid();
      if (!has) return null;

      const credentials = await this.credentials.get(
        this.config.scope,
        undefined,
        undefined,
        true,
      );

      await this.credentials.save(credentials);
      return this.toResult(credentials as Credentials);
    } catch (error) {
      logger.warn('refreshUser failed; clearing credentials', {
        error: mapAuth0Error(error).code,
      });
      await this.credentials.clear();
      throw mapAuth0Error(error);
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const has = await this.credentials.hasValid();
      if (!has) return null;

      const credentials = await this.credentials.get(this.config.scope);
      return (credentials.accessToken as string | undefined) ?? null;
    } catch {
      await this.credentials.clear();
      return null;
    }
  }

  // ============================================================================
  // Native Auth0 helpers
  // ============================================================================
  private auth0Url(path: string): string {
    return `https://${this.config.domain}${path}`;
  }

  private async databaseLogin(
    email: string,
    password: string,
  ): Promise<Credentials> {
    return this.client.auth.passwordRealm({
      username: email,
      password,
      realm: this.dbConnection,
      ...(this.config.audience ? { audience: this.config.audience } : {}),
      scope: withRequiredScopes(this.config.scope),
    });
  }

  private async sendEmailOtp(email: string): Promise<void> {
    let response: Response;

    try {
      response = await this.fetchImpl(this.auth0Url('/passwordless/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.config.clientId,
          connection: AUTH0_PASSWORDLESS_EMAIL_CONNECTION,
          email,
          send: 'code',
          authParams: {
            scope: withRequiredScopes(this.config.scope),
          },
        }),
      });
    } catch (error) {
      throw mapAuth0Error(error);
    }

    const body = (await response.json().catch(() => ({}))) as OAuthTokenResponse;

    if (!response.ok) {
      throw {
        code: body.error ?? `http_${response.status}`,
        message:
          body.error_description ??
          body.error ??
          `Passwordless start failed (${response.status})`,
        status: response.status,
        json: body,
      };
    }
  }

  private async verifyEmailOtp(
    email: string,
    otp: string,
    options?: { audience?: string; extraScopes?: string },
  ): Promise<Credentials> {
    // Native passwordless OTP is a direct token grant — do not send a platform
    // redirect_uri. An iOS-only callback that is missing from Auth0 Allowed
    // Callback URLs would make registration OTP fail on Appetize/iOS while
    // Android (different callback string) still worked.
    const requestBody: Record<string, string> = {
      grant_type: PASSWORDLESS_OTP_GRANT,
      client_id: this.config.clientId,
      username: email,
      otp,
      realm: AUTH0_PASSWORDLESS_EMAIL_CONNECTION,
      scope: withRequiredScopes(
        [this.config.scope, options?.extraScopes].filter(Boolean).join(' '),
      ),
    };

    const audience = options?.audience ?? this.config.audience;
    if (audience) {
      requestBody.audience = audience;
    }

    let response: Response;

    try {
      response = await this.fetchImpl(this.auth0Url('/oauth/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      throw mapAuth0Error(error);
    }

    const payload = (await response.json().catch(() => ({}))) as OAuthTokenResponse;

    if (!response.ok) {
      throw {
        code: payload.error ?? `http_${response.status}`,
        message:
          payload.error_description ??
          payload.error ??
          `OTP exchange failed (${response.status})`,
        status: response.status,
        json: payload,
      };
    }

    if (!payload.access_token || !payload.id_token) {
      throw createAuthError(
        'generic',
        'We could not verify that code. Please request a new one and try again.',
      );
    }

    const expiresIn =
      typeof payload.expires_in === 'number' ? payload.expires_in : 3600;

    return {
      accessToken: payload.access_token,
      idToken: payload.id_token,
      refreshToken: payload.refresh_token,
      tokenType: payload.token_type ?? 'Bearer',
      expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
      scope: payload.scope ?? withRequiredScopes(this.config.scope),
    };
  }

  private async confirmDatabaseEmailVerified(
    proofToken: string,
  ): Promise<NativeVerificationResponse> {
    if (!this.emailVerificationApiUrl) {
      throw createAuthError(
        'generic',
        'Email verification is temporarily unavailable. Please try again later.',
      );
    }

    let response: Response;

    try {
      response = await this.fetchImpl(this.emailVerificationApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${proofToken}`,
        },
        body: JSON.stringify({ proofToken }),
      });
    } catch (error) {
      throw mapAuth0Error(error);
    }

    const body = (await response.json().catch(() => ({}))) as
      | NativeVerificationResponse
      | { error?: string; message?: string };

    if (!response.ok) {
      const errorBody = body as { error?: string; message?: string };
      throw {
        code: errorBody.error ?? `http_${response.status}`,
        message:
          errorBody.message ??
          `Database email verification failed (${response.status})`,
        status: response.status,
        json: body,
      };
    }

    const verified = body as NativeVerificationResponse;
    if (!verified.email || !verified.userId || verified.emailVerified !== true) {
      throw createAuthError(
        'generic',
        'We could not finish email verification. Please try again.',
      );
    }

    return verified;
  }

  private async authorizeSocial(provider: SocialProvider): Promise<AuthResult> {
    const parameters: WebAuthorizeParameters = {
      scope: withRequiredScopes(this.config.scope),
      ...(this.config.audience ? { audience: this.config.audience } : {}),
      connection: mapSocialConnection(provider),
    };

    try {
      const credentials = await this.client.webAuth.authorize(parameters, {
        customScheme: this.config.customScheme,
      });

      this.pendingOtp = null;
      await this.credentials.save(credentials);
      await this.setSessionMode('browser');
      return this.toResult(credentials, provider);
    } catch (error) {
      // Auth0 dashboard can show Successful login while authorize() rejects if
      // Android regained the callback after the original waiter was lost.
      const recovered = await this.recoverWebAuthSession(provider);
      if (recovered) return recovered;
      logger.warn('Auth0 social authorize failed', {
        provider,
        error: mapAuth0Error(error).code,
        detail: mapAuth0Error(error).detail,
      });
      throw mapAuth0Error(error);
    }
  }

  /**
   * Completes a Web Auth login that Auth0.Android recovered after process death
   * or a Custom Tabs handoff race (common on Xiaomi). Safe no-op when unused.
   */
  private async recoverWebAuthSession(
    provider?: AuthResult['user']['provider'],
  ): Promise<AuthResult | null> {
    const resume = this.client.webAuth.resumeSession;
    if (typeof resume !== 'function') return null;

    try {
      const credentials = await resume.call(this.client.webAuth);
      if (!credentials?.idToken) return null;

      this.pendingOtp = null;
      await this.credentials.save(credentials);
      await this.setSessionMode('browser');
      logger.info('Auth0 webAuth session recovered after handoff', {
        provider: provider ?? 'unknown',
      });
      return this.toResult(credentials, provider);
    } catch (error) {
      logger.warn('Auth0 resumeSession failed', {
        error: mapAuth0Error(error).code,
      });
      return null;
    }
  }

  private toResult(
    credentials: Credentials,
    provider?: AuthResult['user']['provider'],
    provisional?: User,
  ): AuthResult {
    const result = mapCredentialsToAuthResult(credentials, provider);

    if (!result.user.provider && credentials.idToken) {
      result.user.provider = inferProviderFromUser(
        parseIdToken(credentials.idToken),
      );
    }

    const formName = provisional?.name?.trim();
    if (formName) {
      result.user.name = formName;
    }

    return result;
  }

  private async setSessionMode(mode: AuthSessionMode): Promise<void> {
    this.sessionMode = mode;
    try {
      await secureSet(AUTH_SESSION_MODE_KEY, mode);
    } catch {
      // In-memory mode still keeps logout correct for this app process.
    }
  }

  private async getSessionMode(): Promise<AuthSessionMode | null> {
    if (this.sessionMode) return this.sessionMode;
    try {
      const stored = await secureGet(AUTH_SESSION_MODE_KEY);
      return stored === 'native' || stored === 'browser' ? stored : null;
    } catch {
      return null;
    }
  }

  private async clearSessionMode(): Promise<void> {
    this.sessionMode = null;
    try {
      await secureDelete(AUTH_SESSION_MODE_KEY);
    } catch {
      // Credentials were already cleared; metadata cleanup is best-effort.
    }
  }
}
