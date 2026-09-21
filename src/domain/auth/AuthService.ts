import type { AuthResult, SignInInput, SignUpInput, SocialProvider } from './types';

/**
 * Authentication port. Auth0 is one adapter; screens never import the SDK.
 */
export interface AuthService {
  /**
   * Create DB user + start email OTP challenge.
   * Returns a provisional user (`emailVerified: false`) — no home session until `confirmEmailOtp`.
   */
  signUp(input?: SignUpInput): Promise<AuthResult>;
  signIn(input?: SignInInput): Promise<AuthResult>;
  signInWithSocial(provider: SocialProvider): Promise<AuthResult>;
  signOut(): Promise<void>;
  /**
   * Start forgot-password Email OTP (Passwordless). Does **not** send Auth0’s
   * change-password link email.
   */
  requestPasswordReset(email?: string): Promise<void>;
  /**
   * Verify the forgot-password OTP. Does not open an app session.
   */
  confirmPasswordResetOtp(code: string): Promise<void>;
  /**
   * Set the new database password in-app after a successful reset OTP.
   * Uses Auth0 My Account API (no custom backend).
   */
  completePasswordReset(password: string): Promise<void>;
  restoreSession(): Promise<AuthResult | null>;
  getAccessToken(): Promise<string | null>;
  /**
   * Resend the pending signup code through Auth0 Passwordless Email.
   */
  requestEmailVerification(email?: string): Promise<void>;
  /**
   * Verify the email OTP, consolidate the Auth0 identities, and authenticate
   * the database user without opening Universal Login.
   */
  confirmEmailOtp(code: string): Promise<AuthResult>;
  /**
   * Force-refresh credentials and re-map `email_verified` (edge / restored sessions).
   */
  refreshUser(): Promise<AuthResult | null>;
}
