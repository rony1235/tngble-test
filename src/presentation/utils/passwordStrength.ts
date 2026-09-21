export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

/**
 * UI-only strength meter for the Figma Create Account artboard.
 * Auth0 enforces the real password policy server-side.
 */
export function assessPasswordStrength(password: string): PasswordStrength {
  const value = password ?? '';
  if (value.length === 0) return 'empty';

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

export function passwordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Your password is weak';
    case 'medium':
      return 'Your password is medium';
    case 'strong':
      return 'Your password is strong';
    default:
      return '';
  }
}

/** How many of the four Figma strength bars are filled. */
export function passwordStrengthFilledBars(strength: PasswordStrength): number {
  switch (strength) {
    case 'weak':
      return 1;
    case 'medium':
      return 2;
    case 'strong':
      return 4;
    default:
      return 0;
  }
}
