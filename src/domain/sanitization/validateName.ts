import { err, ok, type Result } from '@/domain/shared/Result';
import { NAME_MAX_LENGTH } from './constants';
import { normalizeName } from './normalizeName';

export type NameValidationError = 'empty' | 'too_long';

export function validateName(raw: string): Result<string, NameValidationError> {
  if (raw.length > NAME_MAX_LENGTH * 4) {
    // Pathological input: reject before heavy normalize work
    return err('too_long');
  }

  const normalized = normalizeName(raw);
  if (!normalized) {
    return err('empty');
  }
  if (normalized.length > NAME_MAX_LENGTH) {
    return err('too_long');
  }
  return ok(normalized);
}
