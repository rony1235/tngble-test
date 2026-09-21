const SENSITIVE_KEYS = [
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'idToken',
  'id_token',
  'password',
  'authorization',
  'Authorization',
  'email',
  'sub',
  'code',
  'otp',
  'verificationCode',
] as const;

const SENSITIVE_VALUE_PATTERN =
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|Bearer\s+\S+|refresh_[A-Za-z0-9._-]+/gi;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function redactKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((k) => lower === k.toLowerCase() || lower.includes(k.toLowerCase()));
}

function redactString(value: string): string {
  return value.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]').replace(SENSITIVE_VALUE_PATTERN, '[REDACTED_TOKEN]');
}

/**
 * Deep-redact objects/strings before logging or crash reporting.
 * Never log tokens, emails, sub, passwords, or auth codes.
 */
export function redact(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = redactKey(key) ? '[REDACTED]' : redact(entry);
    }
    return out;
  }
  return String(value);
}

export function redactMessage(message: string): string {
  return redactString(message);
}
