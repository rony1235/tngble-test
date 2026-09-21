import {
  BIDI_CONTROL_PATTERN,
  CONTROL_CHARS_PATTERN,
  NAME_MAX_LENGTH,
  ZERO_WIDTH_PATTERN,
} from './constants';

/**
 * Normalize display names. Does not strip apostrophes (e.g. O'Brien).
 * Escape HTML-sensitive characters at render sinks — not here.
 */
export function normalizeName(raw: string): string {
  let value = raw;
  if (value.length > NAME_MAX_LENGTH) {
    value = value.slice(0, NAME_MAX_LENGTH);
  }

  value = value
    .replace(ZERO_WIDTH_PATTERN, '')
    .replace(BIDI_CONTROL_PATTERN, '')
    .replace(CONTROL_CHARS_PATTERN, '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ');

  if (value.length > NAME_MAX_LENGTH) {
    value = value.slice(0, NAME_MAX_LENGTH).trim();
  }

  return value;
}
