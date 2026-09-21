/**
 * Passwords must preserve exact code points — never trim or NFKC.
 */
export function normalizePassword(raw: string): string {
  return raw;
}
