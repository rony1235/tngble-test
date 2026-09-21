import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from '../../app/(auth)/login';

const mockSignIn = jest.fn(async (_input?: unknown) => null);
const mockSignInWithSocial = jest.fn(async (_provider?: unknown) => null);
const mockClearError = jest.fn();
const mockPush = jest.fn();
const mockSetConsentChecked = jest.fn(async () => undefined);

let mockCanProceed = true;
let mockConsentChecked = true;

jest.mock('@/application', () => ({
  useSignIn: () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
    isBusy: false,
    error: null,
    clearError: mockClearError,
  }),
  useSocialSignIn: () => ({
    signInWithSocial: (...args: unknown[]) => mockSignInWithSocial(...args),
    isBusy: false,
    error: null,
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

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    useRouter: () => ({ push: mockPush, replace: jest.fn() }),
    Link: ({ children, testID }: { children: React.ReactNode; testID?: string }) =>
      React.createElement(Text, { accessibilityRole: 'link', testID }, children),
  };
});

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

describe('LoginScreen (Figma 507:552)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  beforeEach(() => {
    mockSignIn.mockReset();
    mockSignInWithSocial.mockReset();
    mockClearError.mockReset();
    mockPush.mockReset();
    mockSetConsentChecked.mockReset();
    mockSignIn.mockResolvedValue(null);
    mockSignInWithSocial.mockResolvedValue(null);
    mockCanProceed = true;
    mockConsentChecked = true;
  });

  it('renders logo, email, password, Face ID, social actions and signup', async () => {
    await renderLogin();

    expect(await screen.findByTestId('login-screen')).toBeTruthy();
    expect(screen.getByTestId('login-logo')).toBeTruthy();
    expect(screen.getByTestId('login-email')).toBeTruthy();
    expect(screen.getByTestId('login-password')).toBeTruthy();
    expect(screen.getByTestId('login-face-id', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('login-submit')).toBeTruthy();
    expect(screen.getByTestId('login-apple')).toBeTruthy();
    expect(screen.getByTestId('login-google')).toBeTruthy();
    expect(screen.getByText('Welcome')).toBeTruthy();
    expect(screen.getByText('Sign up.')).toBeTruthy();
  });

  it('accepts optional email input', async () => {
    await renderLogin();
    const email = await screen.findByTestId('login-email');

    await act(async () => {
      fireEvent.changeText(email, 'dev@tngble.app');
    });

    await waitFor(() => {
      expect(screen.getByTestId('login-email').props.value).toBe('dev@tngble.app');
    });
  });

  it('shows validation error for invalid email', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('login-email'), 'not-an-email');
    });
    await waitFor(() => {
      expect(screen.getByTestId('login-email').props.value).toBe('not-an-email');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-submit'));
    });

    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('requires password when email is filled', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('login-email'), 'dev@tngble.app');
    });
    await waitFor(() => {
      expect(screen.getByTestId('login-email').props.value).toBe('dev@tngble.app');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-submit'));
    });

    expect(await screen.findByText('Enter your password')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls native signIn with email and password', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('login-email'), 'dev@tngble.app');
      fireEvent.changeText(await screen.findByTestId('login-password'), 'Secret123!');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-submit'));
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'dev@tngble.app',
        password: 'Secret123!',
      });
    });
  });

  it('requires email and password instead of hosted web login', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-submit'));
    });

    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('places Forgot Password right-aligned under the password field', async () => {
    await renderLogin();

    const link = await screen.findByTestId('login-forgot-password');
    expect(link).toBeTruthy();
    expect(screen.getByText('Forgot Password?')).toBeTruthy();
    expect(link.props.style).toEqual(
      expect.objectContaining({
        width: 323,
        height: 20,
        alignSelf: 'flex-start',
      }),
    );
  });

  it('routes forgot password and sign up', async () => {
    await renderLogin();
    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-forgot-password'));
    });
    expect(mockPush).toHaveBeenCalledWith('/(auth)/forgot-password');

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-signup'));
    });
    expect(mockPush).toHaveBeenCalledWith('/(auth)/register');
  });

  it('prevents duplicate submit while loading', async () => {
    let resolveSignIn: () => void = () => undefined;
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = () => resolve(null);
        }),
    );

    // isBusy stays false in mock — submittingRef still guards duplicates within same tick
    await renderLogin();
    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('login-email'), 'dev@tngble.app');
      fireEvent.changeText(screen.getByTestId('login-password'), 'Secret123!');
    });
    await waitFor(() => {
      expect(screen.getByTestId('login-email').props.value).toBe('dev@tngble.app');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-submit'));
      fireEvent.press(screen.getByTestId('login-submit'));
    });

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
    await act(async () => {
      resolveSignIn();
    });
  });
});
