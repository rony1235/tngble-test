import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from '../../app/(auth)/login';

const mockSignIn = jest.fn(async (_credentials?: unknown) => {});
const mockPush = jest.fn();

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
    signOut: jest.fn(),
    user: null,
    isLoading: false,
    isAuthenticated: false,
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

describe('LoginScreen auth sheets', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSignIn.mockReset();
    mockPush.mockReset();
    mockSignIn.mockImplementation(async () => {});
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
      cleanup();
    });
    jest.useRealTimers();
  });

  it('opens Apple sheet with account card and Connect', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-apple'));
    });

    expect(await screen.findByTestId('auth-sheet-apple')).toBeTruthy();
    expect(screen.getByText('Sign in with Apple')).toBeTruthy();
    expect(screen.getByText('Connect with apple id')).toBeTruthy();
    expect(screen.getByText('Sign in to TNGBLE using your Apple account')).toBeTruthy();
    expect(screen.getByTestId('auth-sheet-account')).toBeTruthy();
    expect(screen.getByText('Mr. Zabbar Khan')).toBeTruthy();
    expect(screen.getByText('name@example.com')).toBeTruthy();
    expect(screen.getByTestId('auth-sheet-connect')).toBeTruthy();
    expect(screen.getByTestId('auth-sheet-provider-icon')).toBeTruthy();
  });

  it('runs Apple mock connect flow through success into AuthProvider', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-apple'));
    });

    await act(async () => {
      fireEvent.press(await screen.findByTestId('auth-sheet-connect'));
    });

    expect(screen.getByTestId('auth-sheet-connect')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(700);
    });

    expect(await screen.findByTestId('auth-sheet-signing-in')).toBeTruthy();
    expect(screen.getByText('Signing in')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'name@example.com',
        password: 'social-mock',
      });
    });
  });

  it('prevents duplicate Connect while Apple sheet is connecting', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-apple'));
    });

    const connect = await screen.findByTestId('auth-sheet-connect');
    await act(async () => {
      fireEvent.press(connect);
      fireEvent.press(connect);
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });

  it('opens Google sheet and completes mock signing-in', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-google'));
    });

    expect(await screen.findByTestId('auth-sheet-google')).toBeTruthy();
    expect(screen.getByText('Sign in with Google')).toBeTruthy();
    expect(screen.getByText('Connect with google id')).toBeTruthy();
    expect(screen.getByTestId('auth-sheet-provider-icon')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-sheet-connect'));
    });

    await act(async () => {
      jest.advanceTimersByTime(700);
    });

    expect(await screen.findByTestId('auth-sheet-signing-in')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'name@example.com',
        password: 'social-mock',
      });
    });
  });

  it('opens Face ID sheet and auto-progresses to signing-in', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-face-id'));
    });

    expect(await screen.findByTestId('auth-sheet-faceId')).toBeTruthy();
    expect(screen.getByText('Sign in with Face ID')).toBeTruthy();
    expect(screen.getByText('Connecting with your device')).toBeTruthy();
    expect(screen.getByTestId('auth-sheet-provider-icon')).toBeTruthy();
    expect(screen.queryByTestId('auth-sheet-connect')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(screen.getByTestId('auth-sheet-provider-icon')).toBeTruthy();
    expect(screen.queryByTestId('auth-sheet-connecting')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(await screen.findByTestId('auth-sheet-signing-in')).toBeTruthy();
    expect(screen.getByTestId('auth-sheet-provider-icon')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });

  it('dismisses sheet via overlay and preserves login form values', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('login-email'), 'keep@tngble.app');
      fireEvent.changeText(screen.getByTestId('login-password'), 'keeppass');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-apple'));
    });

    expect(await screen.findByTestId('auth-sheet-apple')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-sheet-overlay'));
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('auth-sheet-apple')).toBeNull();
    });

    expect(screen.getByTestId('login-email').props.value).toBe('keep@tngble.app');
    expect(screen.getByTestId('login-password').props.value).toBe('keeppass');
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
