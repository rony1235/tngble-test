import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from '../../app/(auth)/login';

const mockSignIn = jest.fn(async () => null);
const mockSignInWithSocial = jest.fn(async (_provider?: unknown) => null);
const mockClearError = jest.fn();
const mockSetConsentChecked = jest.fn(async () => undefined);

let mockCanProceed = true;
let mockConsentChecked = true;
let mockSocialError: { code: string; message: string } | null = null;

jest.mock('@/application', () => ({
  useSignIn: () => ({
    signIn: mockSignIn,
    isBusy: false,
    error: null,
    clearError: mockClearError,
  }),
  useSocialSignIn: () => ({
    signInWithSocial: (...args: unknown[]) => mockSignInWithSocial(...args),
    isBusy: false,
    error: mockSocialError,
    clearError: mockClearError,
  }),
  useConsentGate: () => ({
    canProceed: mockCanProceed,
    checked: mockConsentChecked,
    setConsentChecked: mockSetConsentChecked,
    ready: true,
    acceptConsent: jest.fn(),
    decision: { allowed: mockCanProceed, reason: mockCanProceed ? 'ok' : 'missing' },
    accepted: null,
    requiredVersion: 'terms-v1',
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

async function renderLogin() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 44, left: 0, right: 0, bottom: 34 },
      }}
    >
      <LoginScreen />
    </SafeAreaProvider>,
  );
}

describe('LoginScreen social sign-in', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockSignInWithSocial.mockReset();
    mockClearError.mockReset();
    mockSetConsentChecked.mockReset();
    mockSignInWithSocial.mockResolvedValue(null);
    mockCanProceed = true;
    mockConsentChecked = true;
    mockSocialError = null;
  });

  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  it('calls useSocialSignIn for Apple and Google', async () => {
    await renderLogin();
    expect(await screen.findByTestId('login-screen')).toBeTruthy();

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-apple'));
    });
    await waitFor(() => expect(mockSignInWithSocial).toHaveBeenCalledWith('apple'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-google'));
    });
    await waitFor(() => expect(mockSignInWithSocial).toHaveBeenCalledWith('google'));
  }, 15_000);

  it('does not show terms consent on login', async () => {
    mockCanProceed = false;
    mockConsentChecked = false;

    await renderLogin();

    expect(await screen.findByTestId('login-screen')).toBeTruthy();
    expect(screen.queryByTestId('login-consent')).toBeNull();
    expect(screen.queryByText('I agree to TNGBLE Terms and Conditions')).toBeNull();
  }, 15_000);

  it('shows social error message from AuthService', async () => {
    mockSocialError = { code: 'cancelled', message: 'Sign-in was cancelled.' };

    await renderLogin();

    expect(await screen.findByTestId('login-error')).toBeTruthy();
    expect(screen.getByText('Sign-in was cancelled.')).toBeTruthy();
  }, 15_000);
});
