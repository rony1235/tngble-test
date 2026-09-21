import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { FAKE_EMAIL_OTP } from '@/infrastructure/auth/FakeAuthAdapter';
import { VerifyPendingScreen } from '@/presentation/screens/VerifyPendingScreen';
import { createTestAuthService, renderAuthUi } from './renderAuthUi';

describe('VerifyPendingScreen (FakeAuthAdapter)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  it('renders Figma Verify Account chrome centered without I’ve verified CTA', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    service.seedSession({
      user: {
        id: 'fake|pending',
        email: 'pending@tngble.app',
        emailVerified: false,
        provider: 'database',
      },
    });

    await renderAuthUi(<VerifyPendingScreen />, { service, autoRestore: true });

    expect(await screen.findByTestId('verify-pending-screen', {}, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByText('Verify Account')).toBeTruthy();
    expect(screen.getByText(/We’ve sent a verification code to/)).toBeTruthy();
    expect(screen.getByText(/pending@tngble.app/)).toBeTruthy();
    expect(screen.getByTestId('verify-code')).toBeTruthy();
    expect(screen.getByTestId('verify-progress')).toBeTruthy();
    expect(screen.getByTestId('verify-resend').props.accessibilityRole).toBe('button');
    expect(screen.getByText(/Resend Code in \d+s/)).toBeTruthy();
    expect(screen.queryByTestId('verify-check-status')).toBeNull();
    expect(screen.queryByText(/I’ve verified/)).toBeNull();
  });

  it('submits OTP automatically when six digits are entered', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    service.seedSession({
      user: {
        id: 'fake|pending',
        email: 'pending@tngble.app',
        emailVerified: false,
        provider: 'database',
      },
    });
    const confirmSpy = jest.spyOn(service, 'confirmEmailOtp');

    await renderAuthUi(<VerifyPendingScreen />, { service, autoRestore: true });
    expect(await screen.findByTestId('verify-pending-screen', {}, { timeout: 10_000 })).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('verify-code-input'), FAKE_EMAIL_OTP);
    });

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(FAKE_EMAIL_OTP);
    });
  });

  it('resends with local cooldown after countdown ends', async () => {
    jest.useFakeTimers();
    const service = createTestAuthService({ scenario: 'success' });
    service.seedSession({
      user: {
        id: 'fake|pending',
        email: 'pending@tngble.app',
        emailVerified: false,
        provider: 'database',
      },
    });

    await renderAuthUi(<VerifyPendingScreen />, { service, autoRestore: true });
    expect(await screen.findByTestId('verify-pending-screen', {}, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByTestId('verify-resend').props.accessibilityState?.disabled).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(26_000);
    });

    expect(screen.getByText('Resend Code')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('verify-resend'));
    });
    await waitFor(() => expect(service.resendCount).toBe(1));
    expect(await screen.findByTestId('verify-resend-success')).toBeTruthy();
    jest.useRealTimers();
  });
});
