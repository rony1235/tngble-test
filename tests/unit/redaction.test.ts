import { redact, redactMessage } from '@/infrastructure/logging/redaction';

describe('redaction', () => {
  it('redacts emails, tokens, and sensitive keys', () => {
    expect(redactMessage('hello user@tngble.app')).toContain('[REDACTED_EMAIL]');
    expect(redactMessage('Bearer abc.def.ghi')).toContain('[REDACTED_TOKEN]');

    const redacted = redact({
      email: 'a@b.co',
      accessToken: 'secret',
      sub: 'auth0|1',
      nested: { refreshToken: 'r', ok: true },
    }) as Record<string, unknown>;

    expect(redacted.email).toBe('[REDACTED]');
    expect(redacted.accessToken).toBe('[REDACTED]');
    expect(redacted.sub).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).refreshToken).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).ok).toBe(true);
  });
});
