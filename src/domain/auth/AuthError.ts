export type AuthErrorCode =
  | 'network'
  | 'cancelled'
  | 'rateLimited'
  | 'blocked'
  | 'invalidInput'
  | 'sessionExpired'
  | 'generic';

export type AuthError = {
  code: AuthErrorCode;
  /** Safe for UI — never reveals account existence, password proximity, or attempt counts. */
  message: string;
  /** Raw provider/Auth0 signal (shown under the safe message while debugging). */
  detail?: string;
};

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  network: 'Connection problem. Check your network and try again.',
  cancelled: 'Sign-in was cancelled.',
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  blocked: 'This account cannot sign in right now. Contact support if you need help.',
  invalidInput: 'Check your details and try again.',
  sessionExpired: 'Your session expired. Please sign in again.',
  generic: 'Something went wrong. Please try again.',
};

export function createAuthError(
  code: AuthErrorCode,
  message?: string,
  detail?: string,
): AuthError {
  return {
    code,
    message: message ?? AUTH_ERROR_MESSAGES[code],
    ...(detail ? { detail } : {}),
  };
}
