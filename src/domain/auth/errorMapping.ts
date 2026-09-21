import { AUTH_ERROR_MESSAGES, createAuthError, type AuthError, type AuthErrorCode } from './AuthError';

export type ProviderErrorLike = {
  code?: string;
  name?: string;
  message?: string;
  type?: string;
  status?: number;
  error?: string;
  error_description?: string;
  errorDescription?: string;
  description?: string;
  json?: unknown;
};

type Rule = {
  code: AuthErrorCode;
  match: (error: ProviderErrorLike, haystack: string) => boolean;
};

/**
 * Patterns that must NEVER produce distinct UX (account existence / password proximity / attempts).
 * They always collapse to the generic sign-in failure message.
 */
const SENSITIVE_COLLAPSE =
  /wrong.?email.?or.?password|wrong.?password|invalid.?password|invalid_user_password|invalid.?user|user.?does.?not.?exist|no.?account|unknown.?user|email.?not.?found|user.?not.?found|incorrect.?credentials|invalid.?credentials|password.?is.?incorrect|too.?many.?login|attempt(s)?.?remain|almost.?correct|account.?not.?found/i;

/** Copy that must never appear in UI messages (Auth0 dashboard / eng jargon). */
const UNSAFE_UI_JARGON =
  /Auth0|Username-Password|Passwordless|Grant Types|EXPO_PUBLIC|Post-Login|My Account API|invalid_signup|unauthorized_client|dashboard/i;

const RULES: Rule[] = [
  {
    code: 'cancelled',
    match: (_e, h) =>
      /cancel|cancelled|user_cancelled|a0\.session\.user_cancelled|login.?cancelled/i.test(h),
  },
  {
    code: 'network',
    // Do NOT match bare "connection" — Auth0 DB errors say "connection" constantly.
    match: (_e, h) =>
      /network.?request.?failed|a0\.network|timed.?out|timeout|offline|fetch.?failed|internet|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|dns|socket.?hang|no.?address|unable.?to.?resolve/i.test(
        h,
      ),
  },
  {
    code: 'rateLimited',
    match: (e, h) =>
      e.status === 429 || /rate.?limit|too.?many.?requests|slow.?down/i.test(h),
  },
  {
    /** Auth0 Post-Login Action deny when email not verified (INV-US009). */
    code: 'blocked',
    match: (_e, h) => /email_verification_required|verify.?your.?email.?before.?continuing/i.test(h),
  },
  {
    /** Account blocked/disabled — keep distinct from OAuth access_denied (Actions / grants). */
    code: 'blocked',
    match: (_e, h) => /user.?is.?blocked|\bblocked\b|\bdisabled\b|\bbanned\b/i.test(h),
  },
  {
    code: 'sessionExpired',
    match: (_e, h) =>
      /session.?expired|token.?expired|login.?required|invalid.?grant|refresh.?token/i.test(h),
  },
  {
    code: 'invalidInput',
    match: (_e, h) => /invalid.?request|validation|malformed|invalid.?email/i.test(h),
  },
];

function jsonText(json: unknown): string {
  if (json == null || typeof json !== 'object') {
    return '';
  }
  const body = json as Record<string, unknown>;
  return [
    body.code,
    body.error,
    body.errorCode,
    body.error_description,
    body.errorDescription,
    body.description,
    body.message,
  ]
    .filter((v) => typeof v === 'string' && v.length > 0)
    .join(' ');
}

function haystack(error: ProviderErrorLike): string {
  return [
    error.code,
    error.name,
    error.type,
    error.message,
    error.error,
    error.error_description,
    error.errorDescription,
    error.description,
    jsonText(error.json),
  ]
    .filter(Boolean)
    .join(' ');
}

function compactProviderDetail(like: ProviderErrorLike, text: string): string | undefined {
  const json =
    like.json && typeof like.json === 'object' ? (like.json as Record<string, unknown>) : null;
  const code =
    [like.code, like.error, like.name, json?.code, json?.error, json?.errorCode].find(
      (v) => typeof v === 'string' && v.trim().length > 0,
    ) ?? null;
  const description =
    [
      like.error_description,
      like.errorDescription,
      like.description,
      like.message,
      json?.error_description,
      json?.description,
      json?.message,
    ].find((v) => typeof v === 'string' && v.trim().length > 0) ?? null;

  const parts = [code, description].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  const detail = (parts.length > 0 ? parts.join(' — ') : text).replace(/\s+/g, ' ').trim();
  if (!detail) return undefined;
  return detail.slice(0, 320);
}

function withProviderDetail(
  mapped: AuthError,
  like: ProviderErrorLike,
  text: string,
  options?: { omitDetail?: boolean },
): AuthError {
  if (options?.omitDetail || !text.trim()) return mapped;
  const detail = compactProviderDetail(like, text);
  return detail ? { ...mapped, detail } : mapped;
}

/**
 * Maps provider/SDK failures to a small safe taxonomy.
 * Safe copy lives in `message` (user-facing only); raw provider text is `detail`
 * for logs/debug — never show `detail` in UI.
 */
export function mapProviderError(error: unknown): AuthError {
  if (error == null) {
    return createAuthError('generic');
  }

  // Already-mapped domain errors must not be remapped (avoids
  // invalidInput → generic with a noisy "invalidInput — …" detail).
  if (typeof error === 'object') {
    const maybe = error as AuthError;
    if (
      typeof maybe.code === 'string' &&
      typeof maybe.message === 'string' &&
      Object.prototype.hasOwnProperty.call(AUTH_ERROR_MESSAGES, maybe.code)
    ) {
      // Guard against older builds / callers that still pass eng jargon as message.
      if (UNSAFE_UI_JARGON.test(maybe.message)) {
        return createAuthError(maybe.code as AuthErrorCode);
      }
      return maybe;
    }
  }

  const like: ProviderErrorLike =
    typeof error === 'string'
      ? { message: error }
      : typeof error === 'object'
        ? (error as ProviderErrorLike)
        : { message: String(error) };

  const text = haystack(like);

  if (SENSITIVE_COLLAPSE.test(text)) {
    return withProviderDetail(
      createAuthError('generic', AUTH_ERROR_MESSAGES.generic),
      like,
      text,
      { omitDetail: true },
    );
  }

  if (/email_verification_required|verify.?your.?email.?before.?continuing/i.test(text)) {
    return withProviderDetail(
      createAuthError(
        'blocked',
        'Please verify your email before continuing. Check your inbox for the verification link.',
      ),
      like,
      text,
    );
  }

  if (/account_linking_required|OTP linking Action/i.test(text)) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'Your code was accepted, but we could not finish setup. Request a new code and try again.',
      ),
      like,
      text,
    );
  }

  if (/email_verified.*needs to be true|needs to be true for user signup/i.test(text)) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'We could not create your account right now. Please try again later.',
      ),
      like,
      text,
    );
  }

  if (
    /unauthorized.?client|password.?realm|passwordless.?otp|resource.?owner|grant.?type.?password/i.test(
      text,
    ) ||
    (/grant.?type/i.test(text) && /not.?allowed|unauthorized|disabled/i.test(text))
  ) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'Sign-in is temporarily unavailable. Please try again later.',
      ),
      like,
      text,
    );
  }

  // passwordRealm / ROPG often returns unauthorized without the words above.
  if (
    /unauthorized/i.test(text) &&
    /client|grant|realm|password/i.test(text)
  ) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'Sign-in is temporarily unavailable. Please try again later.',
      ),
      like,
      text,
    );
  }

  if (/bad\.connection|connection does not exist|connection is disabled/i.test(text)) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'Sign-in is temporarily unavailable. Please try again later.',
      ),
      like,
      text,
    );
  }

  if (
    /invalid.?connection|does not support email_otp|email.?otp|otp.?challenge|otp not configured/i.test(
      text,
    )
  ) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'We could not send a verification code right now. Please try again later.',
      ),
      like,
      text,
    );
  }

  if (/user_exists|already.?exists|user.?already.?exist/i.test(text)) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'An account with this email already exists. Sign in, or register with a different email.',
      ),
      like,
      text,
    );
  }

  // Auth0 invalid_signup: duplicate email (when generic errors are ON), identifier
  // policy, or signup policy — never expose dashboard instructions to users.
  if (/invalid_signup|invalid.?sign.?up/i.test(text)) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'We could not create your account. Try a different email, or sign in if you already have one.',
      ),
      like,
      text,
    );
  }

  if (
    /invalid.?otp|wrong.?code|incorrect.?code|otp.?expired|code.?expired|verification.?code/i.test(
      text,
    )
  ) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'That code is incorrect or expired. If you requested another code, use only the newest email.',
      ),
      like,
      text,
    );
  }

  if (/invalid.?audience|audience/i.test(text) && /invalid|not.?found|not.?allowed|unauthorized/i.test(text)) {
    return withProviderDetail(
      createAuthError(
        'generic',
        'Sign-in is temporarily unavailable. Please try again later.',
      ),
      like,
      text,
    );
  }

  if (like.type === 'ACCESS_DENIED' || /access.?denied|ACCESS_DENIED/i.test(text)) {
    return withProviderDetail(
      createAuthError(
        'blocked',
        'Please verify your email before continuing. Check your inbox for the verification link.',
      ),
      like,
      text,
    );
  }

  for (const rule of RULES) {
    if (rule.match(like, text)) {
      return withProviderDetail(createAuthError(rule.code), like, text);
    }
  }

  return withProviderDetail(createAuthError('generic'), like, text);
}

/** Assert helper for tests: messages must not leak enumeration or eng jargon. */
export function isSafeAuthErrorMessage(message: string): boolean {
  return !SENSITIVE_COLLAPSE.test(message) && !UNSAFE_UI_JARGON.test(message);
}
