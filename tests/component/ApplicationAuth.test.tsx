import { Pressable, Text, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  ApplicationAuthProvider,
  AuthServiceProvider,
  useApplicationAuth,
  useConsentGate,
  useSignIn,
  useSocialSignIn,
} from '@/application';
import { FakeAuthAdapter } from '@/infrastructure/auth/FakeAuthAdapter';
import { ConsentProvider } from '@/providers/ConsentProvider';

jest.mock('@/infrastructure/storage/LocalConsentStore', () => ({
  getLocalConsent: jest.fn(async () => null),
  setLocalConsent: jest.fn(async () => undefined),
  clearLocalConsent: jest.fn(async () => undefined),
}));

function AuthProbe({ service }: { service: FakeAuthAdapter }) {
  return (
    <AuthServiceProvider service={service}>
      <ApplicationAuthProvider autoRestore={false}>
        <AuthProbeInner />
      </ApplicationAuthProvider>
    </AuthServiceProvider>
  );
}

function AuthProbeInner() {
  const {
    status,
    user,
    error,
    isBusy,
    signUp,
    signOut,
    resendVerification,
    refreshVerificationStatus,
    confirmEmailOtp,
    requiresTermsAcceptance,
    resendCooldownRemainingMs,
  } = useApplicationAuth();
  const { signIn } = useSignIn();
  const { signInWithSocial } = useSocialSignIn();

  return (
    <View>
      <Text testID="status">{`status:${status}`}</Text>
      <Text testID="busy">{`busy:${isBusy ? 'yes' : 'no'}`}</Text>
      <Text testID="user">{`user:${user?.email ?? 'none'}`}</Text>
      <Text testID="verified">{`verified:${user?.emailVerified ? 'yes' : 'no'}`}</Text>
      <Text testID="requiresTerms">{`requiresTerms:${requiresTermsAcceptance ? 'yes' : 'no'}`}</Text>
      <Text testID="error">{`error:${error?.code ?? 'none'}`}</Text>
      <Text testID="cooldown">{`cooldown:${resendCooldownRemainingMs}`}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign up"
        disabled={isBusy}
        onPress={() => {
          void signUp({
            email: 'new@tngble.app',
            password: 'Secret123!',
            firstName: 'New',
            lastName: 'User',
          });
        }}
      >
        <Text>Sign up</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        disabled={isBusy}
        onPress={() => {
          void signIn({ email: 'dev@tngble.app' });
        }}
      >
        <Text>Sign in</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Google"
        disabled={isBusy}
        onPress={() => {
          void signInWithSocial('google');
        }}
      >
        <Text>Google</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Resend"
        onPress={() => {
          void resendVerification();
        }}
      >
        <Text>Resend</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Confirm OTP"
        onPress={() => {
          void confirmEmailOtp('123456');
        }}
      >
        <Text>Confirm OTP</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check verified"
        onPress={() => {
          void refreshVerificationStatus();
        }}
      >
        <Text>Check verified</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => {
          void signOut();
        }}
      >
        <Text>Sign out</Text>
      </Pressable>
    </View>
  );
}

function ConsentProbe() {
  return (
    <ConsentProvider documentVersion="terms-v1">
      <ConsentProbeInner />
    </ConsentProvider>
  );
}

function ConsentProbeInner() {
  const { canProceed, acceptConsent, ready } = useConsentGate();

  return (
    <View>
      <Text testID="ready">{`ready:${ready ? 'yes' : 'no'}`}</Text>
      <Text testID="canProceed">{`canProceed:${canProceed ? 'yes' : 'no'}`}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Accept consent"
        onPress={() => {
          void acceptConsent();
        }}
      >
        <Text>Accept</Text>
      </Pressable>
    </View>
  );
}

describe('Application auth hooks (component)', () => {
  it('signs in through FakeAuthAdapter and updates status', async () => {
    const service = new FakeAuthAdapter({ scenario: 'success' });
    await render(<AuthProbe service={service} />);

    expect(screen.getByTestId('status').props.children).toBe('status:unauthenticated');

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign in'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('status:authenticated');
      expect(screen.getByTestId('user').props.children).toBe('user:dev@tngble.app');
    });
  });

  it('maps cancelled social login without sticking busy', async () => {
    const service = new FakeAuthAdapter({ scenario: 'socialCancelled' });
    await render(<AuthProbe service={service} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Google'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').props.children).toBe('error:cancelled');
      expect(screen.getByTestId('busy').props.children).toBe('busy:no');
      expect(screen.getByTestId('status').props.children).toBe('status:unauthenticated');
    });
  });

  it('blocks double-submit while busy', async () => {
    const service = new FakeAuthAdapter({ scenario: 'success' });
    let release!: () => void;
    service.signIn = jest.fn(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              user: {
                id: 'fake|user',
                email: 'dev@tngble.app',
                emailVerified: true,
                provider: 'database',
              },
            });
        }),
    );

    await render(<AuthProbe service={service} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign in'));
      fireEvent.press(screen.getByLabelText('Sign in'));
    });

    expect(service.signIn).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('status:authenticated');
    });
  });

  it('moves to signed-out state before provider cleanup finishes', async () => {
    const service = new FakeAuthAdapter({ scenario: 'success' });
    let finishCleanup!: () => void;
    service.signOut = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishCleanup = resolve;
        }),
    );
    await render(<AuthProbe service={service} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign in'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('status:authenticated');
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign out'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe(
        'status:unauthenticated',
      );
      expect(screen.getByTestId('user').props.children).toBe('user:none');
    });

    await act(async () => {
      finishCleanup();
    });
  });

  it('consent gate blocks until accepted', async () => {
    await render(<ConsentProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('ready').props.children).toBe('ready:yes');
    });
    expect(screen.getByTestId('canProceed').props.children).toBe('canProceed:no');

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Accept consent'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('canProceed').props.children).toBe('canProceed:yes');
    });
  });

  it('unverified sign-in lands on pendingVerification and refresh promotes', async () => {
    const service = new FakeAuthAdapter({ scenario: 'verificationPending' });
    await render(<AuthProbe service={service} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign in'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('status:pendingVerification');
      expect(screen.getByTestId('verified').props.children).toBe('verified:no');
    });

    service.simulateEmailVerifiedOnRefresh();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Check verified'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('status:authenticated');
      expect(screen.getByTestId('verified').props.children).toBe('verified:yes');
    });
  });

  it('throttles verification resend client-side', async () => {
    const service = new FakeAuthAdapter({ scenario: 'verificationPending' });
    await render(<AuthProbe service={service} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign in'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('status:pendingVerification');
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Resend'));
    });
    await waitFor(() => {
      expect(service.resendCount).toBe(1);
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Resend'));
    });

    await waitFor(() => {
      expect(service.resendCount).toBe(1);
      expect(screen.getByTestId('error').props.children).toBe('error:rateLimited');
    });
  });

  it('starts the resend cooldown when the initial signup OTP is sent', async () => {
    const service = new FakeAuthAdapter({ scenario: 'success' });
    await render(<AuthProbe service={service} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign up'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe(
        'status:pendingVerification',
      );
      const value = Number(
        String(screen.getByTestId('cooldown').props.children).split(':')[1],
      );
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(180_000);
    });
  });

  it('signup OTP success requires Terms before home', async () => {
    const service = new FakeAuthAdapter({ scenario: 'success' });
    await render(<AuthProbe service={service} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign up'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe(
        'status:pendingVerification',
      );
      expect(screen.getByTestId('requiresTerms').props.children).toBe('requiresTerms:no');
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Confirm OTP'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').props.children).toBe('status:authenticated');
      expect(screen.getByTestId('requiresTerms').props.children).toBe('requiresTerms:yes');
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sign out'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('requiresTerms').props.children).toBe('requiresTerms:no');
      expect(screen.getByTestId('status').props.children).toBe('status:unauthenticated');
    });
  });
});
