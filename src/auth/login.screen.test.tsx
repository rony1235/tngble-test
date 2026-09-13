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

describe('LoginScreen', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  beforeEach(() => {
    mockSignIn.mockReset();
    mockPush.mockReset();
    mockSignIn.mockImplementation(async () => {});
  });

  it('renders logo, fields, social actions and signup', async () => {
    await renderLogin();

    expect(await screen.findByTestId('login-screen')).toBeTruthy();
    expect(screen.getByTestId('login-logo')).toBeTruthy();
    expect(screen.getByTestId('login-email')).toBeTruthy();
    expect(screen.getByTestId('login-password')).toBeTruthy();
    expect(screen.getByTestId('login-submit')).toBeTruthy();
    expect(screen.getByTestId('login-apple')).toBeTruthy();
    expect(screen.getByTestId('login-google')).toBeTruthy();
    expect(screen.getByTestId('login-face-id')).toBeTruthy();
    expect(screen.getByText('Welcome')).toBeTruthy();
    expect(screen.getByText('Sign up.')).toBeTruthy();
  });

  it('accepts email and password input', async () => {
    await renderLogin();
    const email = await screen.findByTestId('login-email');
    const password = screen.getByTestId('login-password');

    await act(async () => {
      fireEvent.changeText(email, 'dev@tngble.app');
      fireEvent.changeText(password, 'secret1');
    });

    await waitFor(() => {
      expect(screen.getByTestId('login-email').props.value).toBe('dev@tngble.app');
      expect(screen.getByTestId('login-password').props.value).toBe('secret1');
    });
  });

  it('shows validation errors for empty submit', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-submit'));
    });

    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Password is required')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls existing auth signIn with credentials', async () => {
    await renderLogin();

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('login-email'), 'dev@tngble.app');
      fireEvent.changeText(screen.getByTestId('login-password'), 'secret1');
    });

    await waitFor(() => {
      expect(screen.getByTestId('login-email').props.value).toBe('dev@tngble.app');
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-submit'));
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'dev@tngble.app',
        password: 'secret1',
      });
    });
  });

  it('routes forgot password', async () => {
    await renderLogin();
    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-forgot-password'));
    });
    expect(mockPush).toHaveBeenCalledWith('/(auth)/forgot-password');
  });

  it('routes sign up', async () => {
    await renderLogin();
    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-signup'));
    });
    expect(mockPush).toHaveBeenCalledWith('/(auth)/register');
  });

  it('prevents duplicate submit while loading', async () => {
    let resolveSignIn: () => void = () => undefined;
    mockSignIn.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSignIn = resolve;
        }),
    );

    await renderLogin();
    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('login-email'), 'dev@tngble.app');
      fireEvent.changeText(screen.getByTestId('login-password'), 'secret1');
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
