import * as fc from 'fast-check';

import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  normalizeEmail,
  normalizeName,
  normalizePassword,
  normalizeVerificationCode,
  validateEmail,
  validateName,
  validatePassword,
  validateVerificationCode,
  VERIFICATION_CODE_LENGTH,
} from '@/domain/sanitization';

describe('normalizeEmail / validateEmail', () => {
  it('trims, strips zero-width, NFKC, lowercases domain only', () => {
    expect(normalizeEmail('  Alex\u200B@Example.COM  ')).toBe('Alex@example.com');
  });

  it('accepts a normal address', () => {
    const result = validateEmail('dev@tngble.app');
    expect(result).toEqual({ ok: true, value: 'dev@tngble.app' });
  });

  it('rejects missing @, too long, whitespace after normalize, confusable domain', () => {
    expect(validateEmail('nope').ok).toBe(false);
    expect(validateEmail('a'.repeat(250) + '@x.com').ok).toBe(false);
    expect(validateEmail('a b@x.com').ok).toBe(false);
    // Latin "a" + Cyrillic "а" mixed in label
    expect(validateEmail('user@ex\u0430mple.com').ok).toBe(false);
  });

  it('is idempotent (property)', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (raw) => {
        const once = normalizeEmail(raw);
        const twice = normalizeEmail(once);
        expect(twice).toBe(once);
        expect(once.length).toBeLessThanOrEqual(EMAIL_MAX_LENGTH);
      }),
      { numRuns: 50 },
    );
  });
});

describe('normalizePassword / validatePassword', () => {
  it('does not trim or alter code points', () => {
    const raw = '  secrèt\u0301  ';
    expect(normalizePassword(raw)).toBe(raw);
  });

  it('enforces length only', () => {
    expect(validatePassword('short').ok).toBe(false);
    expect(validatePassword('longenough').ok).toBe(true);
    expect(validatePassword('x'.repeat(200)).ok).toBe(false);
  });
});

describe('normalizeName / validateName', () => {
  it('collapses whitespace and keeps apostrophes', () => {
    expect(normalizeName('  O\'Brien\u200B  ')).toBe("O'Brien");
    expect(validateName("O'Brien")).toEqual({ ok: true, value: "O'Brien" });
  });

  it('caps length and rejects empty', () => {
    expect(validateName('   ').ok).toBe(false);
    expect(normalizeName('a'.repeat(NAME_MAX_LENGTH + 20)).length).toBeLessThanOrEqual(
      NAME_MAX_LENGTH,
    );
  });

  it('idempotent and no control chars (property)', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (raw) => {
        const once = normalizeName(raw);
        expect(normalizeName(once)).toBe(once);
        expect(once.length).toBeLessThanOrEqual(NAME_MAX_LENGTH);
        expect(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(once)).toBe(false);
      }),
      { numRuns: 50 },
    );
  });
});

describe('verification code', () => {
  it('strips spaces/dashes and requires exact digit length', () => {
    expect(normalizeVerificationCode(' 12-34 56 ')).toBe('123456');
    expect(validateVerificationCode('12-34-56')).toEqual({ ok: true, value: '123456' });
    expect(validateVerificationCode('12345').ok).toBe(false);
    expect(validateVerificationCode('12a456').ok).toBe(false);
  });

  it('output length never exceeds cap (property)', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (raw) => {
        const value = normalizeVerificationCode(raw);
        expect(value.length).toBeLessThanOrEqual(VERIFICATION_CODE_LENGTH);
        expect(/^\d*$/.test(value)).toBe(true);
      }),
      { numRuns: 50 },
    );
  });
});
