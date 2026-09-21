import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { ForgotPasswordScreen } from '@/presentation/screens/ForgotPasswordScreen';
import { ForgotPasswordCodeScreen } from '@/presentation/screens/ForgotPasswordCodeScreen';
import { ForgotPasswordNewScreen } from '@/presentation/screens/ForgotPasswordNewScreen';
import { ForgotPasswordSuccessScreen } from '@/presentation/screens/ForgotPasswordSuccessScreen';
import { createTestAuthService, renderAuthUi } from './renderAuthUi';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
let mockEmailParam: string | undefined = 'reset@tngble.app';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
  useLocalSearchParams: () => ({ email: mockEmailParam }),
}));

describe('ForgotPasswordScreen (FakeAuthAdapter)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockReplace.mockReset();
    mockCanGoBack.mockReturnValue(true);
  });

  it('validates email and navigates to code screen on success', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    const spy = jest.spyOn(service, 'requestPasswordReset');
    await renderAuthUi(<ForgotPasswordScreen />, { service });

    expect(await screen.findByTestId('forgot-password-screen')).toBeTruthy();
    expect(screen.getByTestId('forgot-logo')).toBeTruthy();
    expect(screen.getByTestId('forgot-subtitle')).toBeTruthy();
    expect(screen.getByText('Forgot Password?')).toBeTruthy();
    expect(screen.getByText('Reset Password')).toBeTruthy();
    expect(screen.getByTestId('forgot-signup')).toBeTruthy();
    expect(screen.getByTestId('forgot-submit').props.accessibilityRole).toBe('button');

    await act(async () => {
      fireEvent.press(screen.getByTestId('forgot-submit'));
    });
    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('forgot-email'), 'reset@tngble.app');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('forgot-submit'));
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('reset@tngble.app');
    });
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(auth)/forgot-password-code',
      params: { email: 'reset@tngble.app' },
    });
    expect(screen.queryByTestId('forgot-success')).toBeNull();
  });

  it('surfaces network errors without claiming delivery', async () => {
    const service = createTestAuthService({ scenario: 'networkFailure' });
    await renderAuthUi(<ForgotPasswordScreen />, { service });

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('forgot-email'), 'reset@tngble.app');
    });
    await waitFor(() => {
      expect(screen.getByTestId('forgot-email').props.value).toBe('reset@tngble.app');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('forgot-submit'));
    });

    expect(await screen.findByTestId('forgot-error')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('ForgotPasswordCodeScreen (Figma 877:4795)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockReplace.mockReset();
    mockCanGoBack.mockReturnValue(true);
    mockEmailParam = 'reset@tngble.app';
  });

  it('renders header, email copy, OTP cells, and cooldown resend', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    await renderAuthUi(<ForgotPasswordCodeScreen />, { service });

    expect(await screen.findByTestId('forgot-password-code-screen')).toBeTruthy();
    expect(screen.getByText('Forgot Password')).toBeTruthy();
    expect(screen.getByTestId('forgot-code-back')).toBeTruthy();
    expect(screen.getByTestId('forgot-code-message')).toBeTruthy();
    expect(screen.getByText('reset@tngble.app')).toBeTruthy();
    expect(screen.getByTestId('forgot-code')).toBeTruthy();
    expect(screen.getByTestId('forgot-code-resend')).toBeTruthy();
    expect(screen.getByText(/Resend code in \d+s/)).toBeTruthy();
  });

  it('goes back when back is pressed', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    await renderAuthUi(<ForgotPasswordCodeScreen />, { service });

    await act(async () => {
      fireEvent.press(await screen.findByTestId('forgot-code-back'));
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('navigates to new-password screen after OTP', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    await service.requestPasswordReset('reset@tngble.app');
    await renderAuthUi(<ForgotPasswordCodeScreen />, { service });

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('forgot-code-input'), '123456');
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(auth)/forgot-password-new',
        params: { email: 'reset@tngble.app' },
      });
    });
  });
});

describe('ForgotPasswordNewScreen (Figma 877:4816)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockReplace.mockReset();
    mockCanGoBack.mockReturnValue(true);
    mockEmailParam = 'reset@tngble.app';
  });

  it('renders verified copy, password fields, and Proceed', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    await renderAuthUi(<ForgotPasswordNewScreen />, { service });

    expect(await screen.findByTestId('forgot-password-new-screen')).toBeTruthy();
    expect(screen.getByTestId('forgot-new-heading')).toBeTruthy();
    expect(screen.getByText('Email successfully verified')).toBeTruthy();
    expect(screen.getByText('Enter a New Password')).toBeTruthy();
    expect(screen.getByTestId('forgot-new-password')).toBeTruthy();
    expect(screen.getByTestId('forgot-new-confirm')).toBeTruthy();
    expect(screen.getByText('Proceed')).toBeTruthy();
  });

  it('validates passwords before completing reset', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    await service.requestPasswordReset('reset@tngble.app');
    await service.confirmPasswordResetOtp('123456');
    await renderAuthUi(<ForgotPasswordNewScreen />, { service });

    await act(async () => {
      fireEvent.press(await screen.findByTestId('forgot-new-proceed'));
    });
    expect(await screen.findByTestId('forgot-new-error')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('forgot-new-password'), 'Secret123!');
      fireEvent.changeText(screen.getByTestId('forgot-new-confirm'), 'Secret123!');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('forgot-new-proceed'));
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(auth)/forgot-password-success',
        params: { email: 'reset@tngble.app' },
      });
    });
    expect(service.completePasswordResetCount).toBe(1);
  });
});

describe('ForgotPasswordSuccessScreen (Figma 877:4828)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  beforeEach(() => {
    mockPush.mockReset();
    mockBack.mockReset();
    mockReplace.mockReset();
    mockCanGoBack.mockReturnValue(true);
  });

  it('renders success copy, badge, and Login CTA', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    await renderAuthUi(<ForgotPasswordSuccessScreen />, { service });

    expect(await screen.findByTestId('forgot-password-success-screen')).toBeTruthy();
    expect(screen.getByTestId('forgot-success-badge')).toBeTruthy();
    expect(screen.getByText('Password Successfully Reset')).toBeTruthy();
    expect(screen.getByText('You can now log in with your new password')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
  });

  it('navigates to login when Login is pressed', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    await renderAuthUi(<ForgotPasswordSuccessScreen />, { service });

    await act(async () => {
      fireEvent.press(await screen.findByTestId('forgot-success-login'));
    });
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });
});
