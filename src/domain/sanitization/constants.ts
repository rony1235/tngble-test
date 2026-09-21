export const EMAIL_MAX_LENGTH = 254;
export const NAME_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const VERIFICATION_CODE_LENGTH = 6;

/** Zero-width + BOM */
export const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/g;

/** Bidirectional control characters */
export const BIDI_CONTROL_PATTERN = /[\u202A-\u202E\u2066-\u2069]/g;

/** C0 / C1 controls excluding TAB/LF/CR handled via broader strip where needed */
export const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
