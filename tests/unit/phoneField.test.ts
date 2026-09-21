import { resolveSignupPhone } from '@/presentation/utils/phoneField';

function source(overrides: Partial<Parameters<typeof resolveSignupPhone>[0]> = {}) {
  return {
    getValue: () => '+971501234567',
    getCountryCode: () => '971',
    isValidNumber: () => true,
    ...overrides,
  };
}

describe('resolveSignupPhone', () => {
  it('accepts a valid international number', () => {
    expect(resolveSignupPhone(source())).toEqual({
      ok: true,
      value: '+971501234567',
    });
  });

  it('rejects country code only', () => {
    expect(
      resolveSignupPhone(
        source({
          getValue: () => '+971',
          isValidNumber: () => false,
        }),
      ),
    ).toEqual({ ok: false, message: 'Enter your phone number' });
  });

  it('rejects an incomplete number', () => {
    expect(
      resolveSignupPhone(
        source({
          getValue: () => '+97112',
          isValidNumber: () => false,
        }),
      ),
    ).toEqual({ ok: false, message: 'Enter a valid phone number' });
  });

  it('uses fallback when the input ref is missing', () => {
    expect(resolveSignupPhone(null, '')).toEqual({
      ok: false,
      message: 'Enter your phone number',
    });
  });
});
