import {
  emailValidationMessage,
  optionalLoginHint,
  requireValidEmail,
} from '@/presentation/utils/emailField';

describe('emailField helpers', () => {
  it('requireValidEmail accepts normalized addresses', () => {
    expect(requireValidEmail('  Dev@Example.COM ')).toEqual({
      email: 'Dev@example.com',
    });
  });

  it('requireValidEmail rejects empty', () => {
    expect(requireValidEmail('')).toEqual({ error: 'Email is required' });
  });

  it('optionalLoginHint allows empty', () => {
    expect(optionalLoginHint('')).toEqual({ email: undefined });
    expect(optionalLoginHint('   ')).toEqual({ email: undefined });
  });

  it('optionalLoginHint rejects invalid non-empty', () => {
    expect(optionalLoginHint('nope')).toEqual({
      error: emailValidationMessage('missing_at'),
    });
  });
});
