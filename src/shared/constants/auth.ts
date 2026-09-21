/** Default consent document version for AUTH-01 hook (replace when legal finalizes). */
export const DEFAULT_CONSENT_DOCUMENT_VERSION = 'terms-privacy-2026-08-22';

/** Client-side resend verification throttle. */
export const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 180_000;

/**
 * Backend path that proxies Auth0 Management API
 * `POST /api/v2/jobs/verification-email` (never call Management API from the app).
 */
export const EMAIL_VERIFICATION_RESEND_PATH = '/auth/email-verification/resend';

