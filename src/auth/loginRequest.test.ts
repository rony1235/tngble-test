import { loginRequest } from '@/auth/loginRequest';

describe('loginRequest (mock auth)', () => {
  it('accepts a valid email and password', async () => {
    const session = await loginRequest({
      email: 'dev@tngble.app',
      password: 'secret1',
    });

    expect(session.user.email).toBe('dev@tngble.app');
    expect(session.accessToken).toBeTruthy();
  });

  it('rejects weak credentials', async () => {
    await expect(
      loginRequest({ email: 'nope', password: '123' }),
    ).rejects.toThrow('Invalid email or password');
  });
});
