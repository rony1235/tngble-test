import { FAKE_EMAIL_OTP, FakeAuthAdapter } from '@/infrastructure/auth/FakeAuthAdapter';

describe('FakeAuthAdapter', () => {
  it('supports success and verificationPending', async () => {
    const ok = new FakeAuthAdapter({ scenario: 'success' });
    const signedIn = await ok.signIn({ email: 'a@b.co' });
    expect(signedIn.user.emailVerified).toBe(true);
    expect(await ok.getAccessToken()).toBe('fake-access-token');

    const pending = new FakeAuthAdapter({ scenario: 'verificationPending' });
    const result = await pending.signUp({
      email: 'p@b.co',
      password: 'Secret123!',
      firstName: 'Pat',
      lastName: 'Pending',
    });
    expect(result.user.emailVerified).toBe(false);
    expect(await pending.getAccessToken()).toBeNull();
  });

  it('supports social scenarios', async () => {
    const google = new FakeAuthAdapter({ scenario: 'socialSuccessGoogle' });
    expect((await google.signInWithSocial('apple')).user.provider).toBe('google');

    const apple = new FakeAuthAdapter({ scenario: 'socialSuccessApple' });
    expect((await apple.signInWithSocial('google')).user.provider).toBe('apple');

    const cancelled = new FakeAuthAdapter({ scenario: 'socialCancelled' });
    await expect(cancelled.signInWithSocial('google')).rejects.toMatchObject({
      code: 'cancelled',
    });
  });

  it('gates unverified social users', async () => {
    const adapter = new FakeAuthAdapter({
      scenario: 'verificationPending',
    });
    const result = await adapter.signInWithSocial('google');
    expect(result.user.emailVerified).toBe(false);
    expect(result.user.provider).toBe('google');
  });

  it('resends OTP and confirms with FAKE_EMAIL_OTP', async () => {
    const adapter = new FakeAuthAdapter({ scenario: 'success' });
    await adapter.signUp({
      email: 'p@b.co',
      password: 'Secret123!',
      firstName: 'Pat',
      lastName: 'Pending',
    });
    await adapter.requestEmailVerification();
    expect(adapter.resendCount).toBe(1);

    const confirmed = await adapter.confirmEmailOtp(FAKE_EMAIL_OTP);
    expect(confirmed.user.emailVerified).toBe(true);
    expect(adapter.confirmOtpCount).toBe(1);
    expect(await adapter.getAccessToken()).toBe('fake-access-token');
  });

  it('rejects wrong OTP with generic error', async () => {
    const adapter = new FakeAuthAdapter({ scenario: 'success' });
    await adapter.signUp({
      email: 'p@b.co',
      password: 'Secret123!',
      firstName: 'Pat',
      lastName: 'Pending',
    });
    await expect(adapter.confirmEmailOtp('000000')).rejects.toMatchObject({
      code: 'generic',
    });
  });

  it('clears session on refreshFailure restore', async () => {
    const adapter = new FakeAuthAdapter({ scenario: 'success' });
    await adapter.signIn();
    adapter.setScenario('refreshFailure');
    await expect(adapter.restoreSession()).rejects.toMatchObject({
      code: 'sessionExpired',
    });
    expect(await adapter.getAccessToken()).toBeNull();
  });
});
