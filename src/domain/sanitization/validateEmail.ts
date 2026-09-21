import { err, ok, type Result } from '@/domain/shared/Result';
import { EMAIL_MAX_LENGTH } from './constants';
import { normalizeEmail } from './normalizeEmail';

const LATIN = /\p{Script=Latin}/u;
const CYRILLIC = /\p{Script=Cyrillic}/u;
const GREEK = /\p{Script=Greek}/u;

/**
 * Reject domains that mix Latin with Cyrillic/Greek in the same label (common confusable pattern).
 */
export function hasMixedScriptConfusableDomain(domain: string): boolean {
  const labels = domain.split('.');
  for (const label of labels) {
    const hasLatin = LATIN.test(label);
    const hasCyrillic = CYRILLIC.test(label);
    const hasGreek = GREEK.test(label);
    const scriptCount = [hasLatin, hasCyrillic, hasGreek].filter(Boolean).length;
    if (scriptCount > 1) return true;
  }
  return false;
}

export type EmailValidationError =
  | 'empty'
  | 'too_long'
  | 'missing_at'
  | 'invalid_local'
  | 'invalid_domain'
  | 'whitespace_or_control'
  | 'confusable_domain';

export function validateEmail(raw: string): Result<string, EmailValidationError> {
  if (raw.length > EMAIL_MAX_LENGTH) {
    return err('too_long');
  }

  const normalized = normalizeEmail(raw);

  if (!normalized) {
    return err('empty');
  }

  if (/\s/.test(normalized) || /[\u0000-\u001F\u007F]/.test(normalized)) {
    return err('whitespace_or_control');
  }

  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at !== normalized.indexOf('@')) {
    return err('missing_at');
  }

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);

  if (!local || local.length > 64) {
    return err('invalid_local');
  }

  if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return err('invalid_domain');
  }

  if (hasMixedScriptConfusableDomain(domain)) {
    return err('confusable_domain');
  }

  return ok(normalized);
}
