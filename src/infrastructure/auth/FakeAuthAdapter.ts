import type {
  AuthResult,
  AuthService,
  SignInInput,
  SignUpInput,
  SocialProvider,
  User,
} from '@/domain/auth';
import { createAuthError } from '@/domain/auth';
import { validatePassword, validateVerificationCode } from '@/domain/sanitization';
import { clearLegacySession } from '@/infrastructure/storage/clearLegacySession';

export type FakeAuthScenario =
  | 'success'
  | 'verificationPending'
  | 'networkFailure'
  | 'cancelled'
  | 'rateLimited'
  | 'blocked'
  | 'expiredSession'
  | 'refreshFailure'
  | 'socialSuccessGoogle'
  | 'socialSuccessApple'
  | 'socialCancelled';

export type FakeAuthAdapterOptions = {
  scenario?: FakeAuthScenario;
  user?: Partial<User>;
};

/** Deterministic OTP accepted by FakeAuthAdapter.confirmEmailOtp in tests. */
export const FAKE_EMAIL_OTP = '123456';

function baseUser(overrides?: Partial<User>): User {
  return {
    id: 'fake|user',
    email: 'dev@tngble.app',
    emailVerified: true,
    name: 'Dev User',
    provider: 'database',
    ...overrides,
  };
}

/**
 * Deterministic in-memory AuthService for unit/component tests.
 */
export class FakeAuthAdapter implements AuthService {
  scenario: FakeAuthScenario;
  private session: AuthResult | null = null;
  private accessToken: string | null = null;
  private pendingEmail: string | null = null;
  private pendingPasswordResetEmail: string | null = null;
  private passwordResetOtpVerified = false;
  private readonly userOverrides: Partial<User>;
  private verifiedOnNextRefresh = false;
  resendCount = 0;
  resetCount = 0;
  confirmOtpCount = 0;
  completePasswordResetCount = 0;

  constructor(options: FakeAuthAdapterOptions = {}) {
    this.scenario = options.scenario ?? 'success';
    this.userOverrides = options.user ?? {};
  }

  setScenario(scenario: FakeAuthScenario): void {
    this.scenario = scenario;
  }

  /** Next `refreshUser` will flip `emailVerified` to true (link-click simulation). */
  simulateEmailVerifiedOnRefresh(): void {
    this.verifiedOnNextRefresh = true;
  }

  async signUp(input?: SignUpInput): Promise<AuthResult> {
    this.throwIfFailureScenario();
    if (!input?.email?.trim()) {
      throw createAuthError('invalidInput');
    }
    const name = [input.firstName, input.lastName].filter(Boolean).join(' ').trim();
    const email = input.email.trim();
    this.pendingEmail = email;
    this.accessToken = null;
    this.session = {
      user: baseUser({
        ...this.userOverrides,
        id: `pending|${email}`,
        email,
        name: name || this.userOverrides.name || 'Dev User',
        emailVerified: false,
        provider: 'database',
      }),
    };
    return this.session;
  }

  async signIn(input?: SignInInput): Promise<AuthResult> {
    this.throwIfFailureScenario();
    this.pendingEmail = null;
    return this.storeSession({
      user: baseUser({
        ...this.userOverrides,
        email: input?.email?.trim() || this.userOverrides.email || 'dev@tngble.app',
        emailVerified: this.resolveEmailVerified(),
        provider: 'database',
      }),
    });
  }

  async signInWithSocial(provider: SocialProvider): Promise<AuthResult> {
    if (this.scenario === 'socialCancelled' || this.scenario === 'cancelled') {
      throw createAuthError('cancelled');
    }
    this.throwIfFailureScenario();
    this.pendingEmail = null;

    const resolved: SocialProvider =
      this.scenario === 'socialSuccessGoogle'
        ? 'google'
        : this.scenario === 'socialSuccessApple'
          ? 'apple'
          : provider;

    return this.storeSession({
      user: baseUser({
        ...this.userOverrides,
        id: resolved === 'google' ? 'google-oauth2|user' : 'apple|user',
        provider: resolved,
        emailVerified: this.resolveEmailVerified(true),
      }),
    });
  }

  async signOut(): Promise<void> {
    this.session = null;
    this.accessToken = null;
    this.pendingEmail = null;
    this.pendingPasswordResetEmail = null;
    this.passwordResetOtpVerified = false;
    await clearLegacySession();
  }

  async requestPasswordReset(email?: string): Promise<void> {
    this.throwIfFailureScenario();
    const validated = email?.trim();
    if (!validated) {
      throw createAuthError('invalidInput');
    }
    this.pendingPasswordResetEmail = validated.toLowerCase();
    this.passwordResetOtpVerified = false;
    this.resetCount += 1;
  }

  async confirmPasswordResetOtp(code: string): Promise<void> {
    this.throwIfFailureScenario();
    const validated = validateVerificationCode(code);
    if (!validated.ok) {
      throw createAuthError('invalidInput');
    }
    if (!this.pendingPasswordResetEmail) {
      throw createAuthError('sessionExpired');
    }
    if (validated.value !== FAKE_EMAIL_OTP) {
      throw createAuthError('generic');
    }
    this.passwordResetOtpVerified = true;
    this.confirmOtpCount += 1;
  }

  async completePasswordReset(password: string): Promise<void> {
    this.throwIfFailureScenario();
    const validated = validatePassword(password);
    if (!validated.ok) {
      throw createAuthError('invalidInput');
    }
    if (!this.pendingPasswordResetEmail || !this.passwordResetOtpVerified) {
      throw createAuthError('sessionExpired');
    }
    this.completePasswordResetCount += 1;
    this.pendingPasswordResetEmail = null;
    this.passwordResetOtpVerified = false;
  }

  async requestEmailVerification(email?: string): Promise<void> {
    this.throwIfFailureScenario();
    const target = email?.trim() || this.pendingEmail || this.session?.user.email;
    if (!target) {
      throw createAuthError('sessionExpired');
    }
    this.pendingEmail = target;
    this.resendCount += 1;
  }

  async confirmEmailOtp(code: string): Promise<AuthResult> {
    this.throwIfFailureScenario();
    const validated = validateVerificationCode(code);
    if (!validated.ok) {
      throw createAuthError('invalidInput');
    }
    if (!this.pendingEmail && !this.session?.user.email) {
      throw createAuthError('sessionExpired');
    }
    if (validated.value !== FAKE_EMAIL_OTP) {
      throw createAuthError('generic');
    }
    this.confirmOtpCount += 1;
    const email = this.pendingEmail ?? this.session!.user.email;
    const name = this.session?.user.name;
    this.pendingEmail = null;
    return this.storeSession({
      user: baseUser({
        ...this.userOverrides,
        email,
        name,
        emailVerified: true,
        provider: 'database',
      }),
    });
  }

  async restoreSession(): Promise<AuthResult | null> {
    if (this.scenario === 'refreshFailure' || this.scenario === 'expiredSession') {
      this.session = null;
      this.accessToken = null;
      throw createAuthError('sessionExpired');
    }
    if (!this.accessToken) {
      return null;
    }
    return this.session;
  }

  async refreshUser(): Promise<AuthResult | null> {
    if (this.scenario === 'refreshFailure' || this.scenario === 'expiredSession') {
      this.session = null;
      this.accessToken = null;
      throw createAuthError('sessionExpired');
    }
    if (!this.session || !this.accessToken) return null;
    if (this.verifiedOnNextRefresh) {
      this.verifiedOnNextRefresh = false;
      this.session = {
        user: { ...this.session.user, emailVerified: true },
      };
    }
    return this.session;
  }

  async getAccessToken(): Promise<string | null> {
    if (this.scenario === 'refreshFailure') {
      this.session = null;
      this.accessToken = null;
      return null;
    }
    return this.accessToken;
  }

  seedSession(result: AuthResult, token = 'fake-access-token'): void {
    this.session = result;
    this.accessToken = token;
    if (!result.user.emailVerified) {
      this.pendingEmail = result.user.email;
    } else {
      this.pendingEmail = null;
    }
  }

  private resolveEmailVerified(defaultVerified = true): boolean {
    if (this.userOverrides.emailVerified !== undefined) {
      return this.userOverrides.emailVerified;
    }
    if (this.scenario === 'verificationPending') {
      return false;
    }
    return defaultVerified;
  }

  private storeSession(result: AuthResult): AuthResult {
    this.session = result;
    this.accessToken = 'fake-access-token';
    return result;
  }

  private throwIfFailureScenario(): void {
    switch (this.scenario) {
      case 'networkFailure':
        throw createAuthError('network');
      case 'cancelled':
      case 'socialCancelled':
        throw createAuthError('cancelled');
      case 'rateLimited':
        throw createAuthError('rateLimited');
      case 'blocked':
        throw createAuthError('blocked');
      case 'expiredSession':
      case 'refreshFailure':
        throw createAuthError('sessionExpired');
      default:
        break;
    }
  }
}
