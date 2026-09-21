import {
  BIDI_CONTROL_PATTERN,
  CONTROL_CHARS_PATTERN,
  EMAIL_MAX_LENGTH,
  ZERO_WIDTH_PATTERN,
} from './constants';

function stripInvisible(value: string): string {
  return value
    .replace(ZERO_WIDTH_PATTERN, '')
    .replace(BIDI_CONTROL_PATTERN, '')
    .replace(CONTROL_CHARS_PATTERN, '');
}

/**
 * Normalize email at the boundary.
 * - Length-cap first
 * - Trim; strip zero-width / bidi / controls
 * - Unicode NFKC
 * - Lowercase **domain only** (local part case preserved)
 */
export function normalizeEmail(raw: string): string {
  if (raw.length > EMAIL_MAX_LENGTH) {
    raw = raw.slice(0, EMAIL_MAX_LENGTH);
  }

  let value = stripInvisible(raw).normalize('NFKC').trim();

  const at = value.lastIndexOf('@');
  if (at <= 0 || at === value.length - 1) {
    return value;
  }

  const local = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();
  return `${local}@${domain}`;
}
