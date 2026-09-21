import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { SignUpScreen } from '@/presentation/screens/SignUpScreen';
import { createTestAuthService, renderAuthUi } from './renderAuthUi';

async function fillValidForm() {
  fireEvent.changeText(screen.getByTestId('register-first-name'), 'Ada');
  fireEvent.changeText(screen.getByTestId('register-last-name'), 'Lovelace');
  fireEvent.changeText(screen.getByTestId('register-email'), 'new@tngble.app');
  fireEvent.changeText(screen.getByTestId('register-password'), 'Secret123!');
  fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'Secret123!');
}

describe('SignUpScreen (FakeAuthAdapter)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  it('renders Figma Create Account chrome without Terms consent', async () => {
    await renderAuthUi(<SignUpScreen />);

    expect(await screen.findByTestId('register-screen')).toBeTruthy();
    expect(screen.getByText('Create Account')).toBeTruthy();
    expect(screen.getByTestId('register-progress')).toBeTruthy();
    expect(screen.getByTestId('register-first-name')).toBeTruthy();
    expect(screen.getByTestId('register-password')).toBeTruthy();
    expect(screen.queryByTestId('register-consent')).toBeNull();
    expect(screen.getByTestId('register-submit').props.accessibilityRole).toBe('button');
    expect(screen.getByText('Send Email Verification Code')).toBeTruthy();
  });

  it('signs up with email and password without prior consent', async () => {
    const service = createTestAuthService({ scenario: 'verificationPending' });
    const spy = jest.spyOn(service, 'signUp');
    await renderAuthUi(<SignUpScreen />, { service });

    await act(async () => {
      await fillValidForm();
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit'));
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        email: 'new@tngble.app',
        password: 'Secret123!',
        firstName: 'Ada',
        lastName: 'Lovelace',
      });
    });
  });

  it('validates name, email, and password before submit', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    const signUpSpy = jest.spyOn(service, 'signUp');
    await renderAuthUi(<SignUpScreen />, { service });

    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit'));
    });
    expect(await screen.findByText('Enter a valid first name')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('register-first-name'), 'Ada');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit'));
    });
    expect(await screen.findByText('Enter a valid last name')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('register-last-name'), 'Lovelace');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit'));
    });
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('register-email'), 'new@tngble.app');
      fireEvent.changeText(screen.getByTestId('register-password'), 'short');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit'));
    });
    expect(await screen.findByText('Password must be at least 8 characters')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('register-password'), 'x'.repeat(129));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit'));
    });
    expect(await screen.findByText('Password is too long')).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('register-password'), 'Secret123!');
      fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'Different1!');
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit'));
    });
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
    expect(signUpSpy).not.toHaveBeenCalled();
  });

  it('navigates back and to login', async () => {
    await renderAuthUi(<SignUpScreen />);

    await act(async () => {
      fireEvent.press(await screen.findByTestId('register-back'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-to-login'));
    });

    expect(screen.getByTestId('register-screen')).toBeTruthy();
  });

  it('shows password strength while typing', async () => {
    await renderAuthUi(<SignUpScreen />);
    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('register-password'), 'short');
    });
    expect(await screen.findByTestId('register-password-strength-label')).toBeTruthy();
    expect(screen.getByText(/Your password is weak/i)).toBeTruthy();
  });
});
