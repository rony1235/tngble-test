import { VERIFICATION_CODE_LENGTH } from './constants';

/**
 * Trim; remove spaces and dashes; keep digits only. Cap to expected length.
 */
export function normalizeVerificationCode(raw: string): string {
  const digits = raw.trim().replace(/[\s-]/g, '').replace(/\D/g, '');
  return digits.slice(0, VERIFICATION_CODE_LENGTH);
}
