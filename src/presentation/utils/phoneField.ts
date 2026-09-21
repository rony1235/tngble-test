export type SignupPhoneSource = {
  getValue: () => string;
  getCountryCode: () => string | null;
  isValidNumber: () => boolean;
};

/**
 * National number is required; `isValidNumber` comes from react-native-phone-input.
 */
export function resolveSignupPhone(
  source: SignupPhoneSource | null,
  fallback = '',
): { ok: true; value: string } | { ok: false; message: string } {
  const phoneValue = source?.getValue()?.trim() ?? fallback.trim();
  const dialCode = source?.getCountryCode() ?? '';
  const nationalDigits = phoneValue.replace(/\D/g, '').slice(String(dialCode).length);
  if (!nationalDigits) {
    return { ok: false, message: 'Enter your phone number' };
  }
  if (!source?.isValidNumber()) {
    return { ok: false, message: 'Enter a valid phone number' };
  }
  return { ok: true, value: phoneValue };
}
