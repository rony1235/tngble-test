import { err, ok, type Result } from '@/domain/shared/Result';
import { VERIFICATION_CODE_LENGTH } from './constants';
import { normalizeVerificationCode } from './normalizeVerificationCode';

export type VerificationCodeValidationError = 'invalid_length' | 'non_numeric';

export function validateVerificationCode(
  raw: string,
): Result<string, VerificationCodeValidationError> {
  const stripped = raw.trim().replace(/[\s-]/g, '');
  if (stripped.length > 0 && /\D/.test(stripped)) {
    return err('non_numeric');
  }

  const normalized = normalizeVerificationCode(raw);
  if (normalized.length !== VERIFICATION_CODE_LENGTH) {
    return err('invalid_length');
  }
  return ok(normalized);
}
