import {
  type EmailValidationError,
  validateEmail,
} from '@/domain/sanitization';

const MESSAGES: Record<EmailValidationError, string> = {
  empty: 'Email is required',
  too_long: 'Email is too long',
  missing_at: 'Enter a valid email address',
  invalid_local: 'Enter a valid email address',
  invalid_domain: 'Enter a valid email address',
  whitespace_or_control: 'Enter a valid email address',
  confusable_domain: 'Enter a valid email address',
};

export function emailValidationMessage(code: EmailValidationError): string {
  return MESSAGES[code];
}

/** Required email — returns normalized value or an error message. */
export function requireValidEmail(raw: string): { email: string } | { error: string } {
  const result = validateEmail(raw);
  if (!result.ok) {
    return { error: emailValidationMessage(result.error) };
  }
  return { email: result.value };
}

/**
 * Optional email for Universal Login `login_hint`.
 * Empty → undefined; invalid non-empty → error.
 */
export function optionalLoginHint(
  raw: string,
): { email: string | undefined } | { error: string } {
  if (!raw.trim()) {
    return { email: undefined };
  }
  const result = validateEmail(raw);
  if (!result.ok) {
    return { error: emailValidationMessage(result.error) };
  }
  return { email: result.value };
}
