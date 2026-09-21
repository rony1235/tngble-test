import { err, ok, type Result } from '@/domain/shared/Result';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './constants';
import { normalizePassword } from './normalizePassword';

export type PasswordValidationError = 'too_short' | 'too_long';

/**
 * Client-side password checks are length-only. Strength/breach belong to Auth0.
 * Input is not normalized.
 */
export function validatePassword(raw: string): Result<string, PasswordValidationError> {
  const value = normalizePassword(raw);
  if (value.length < PASSWORD_MIN_LENGTH) {
    return err('too_short');
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return err('too_long');
  }
  return ok(value);
}
