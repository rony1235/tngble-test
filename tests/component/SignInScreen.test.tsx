import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SignInScreen } from '@/presentation/screens/SignInScreen';
import { createTestAuthService, renderAuthUi } from './renderAuthUi';

describe('SignInScreen (FakeAuthAdapter)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });
  it('renders Universal Login chrome with a11y roles', async () => {
    await renderAuthUi(<SignInScreen />);

    expect(await screen.findByTestId('login-screen')).toBeTruthy();
    expect(screen.getByTestId('login-submit').props.accessibilityRole).toBe('button');
    expect(screen.getByTestId('login-apple').props.accessibilityRole).toBe('button');
    expect(screen.getByTestId('login-google').props.accessibilityRole).toBe('button');
    expect(screen.getByLabelText('Continue with Apple')).toBeTruthy();
    expect(screen.getByLabelText('Continue with Google')).toBeTruthy();
  });

  it('signs in via Fake adapter with email and password', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    const spy = jest.spyOn(service, 'signIn');
    await renderAuthUi(<SignInScreen />, { service });

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('login-email'), 'dev@tngble.app');
      fireEvent.changeText(screen.getByTestId('login-password'), 'Secret123!');
    });
    await waitFor(() => {
      expect(screen.getByTestId('login-email').props.value).toBe('dev@tngble.app');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('login-submit'));
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        email: 'dev@tngble.app',
        password: 'Secret123!',
      });
    });
  });

  it('requires email and password instead of opening web login', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    const spy = jest.spyOn(service, 'signIn');
    await renderAuthUi(<SignInScreen />, { service });

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-submit'));
    });

    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('blocks social until consent when none stored', async () => {
    const service = createTestAuthService({ scenario: 'socialSuccessGoogle' });
    const spy = jest.spyOn(service, 'signInWithSocial');
    await renderAuthUi(<SignInScreen />, { service });

    expect(await screen.findByTestId('login-consent')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-apple'));
    });

    expect(
      await screen.findByText('Accept the terms to continue with social sign-in'),
    ).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps cancelled social after consent', async () => {
    const service = createTestAuthService({ scenario: 'socialCancelled' });
    await renderAuthUi(<SignInScreen />, { service });

    await act(async () => {
      fireEvent.press(await screen.findByTestId('login-consent'));
    });
    await waitFor(() => {
      expect(screen.queryByTestId('login-consent')).toBeNull();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('login-google'));
    });

    expect(await screen.findByTestId('login-error')).toBeTruthy();
    expect(screen.getByText('Sign-in was cancelled.')).toBeTruthy();
  });
});
