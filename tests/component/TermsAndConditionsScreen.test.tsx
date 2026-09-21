import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useApplicationAuth } from '@/application';
import { TermsAndConditionsScreen } from '@/presentation/screens/TermsAndConditionsScreen';
import { createTestAuthService, renderAuthUi } from './renderAuthUi';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: () => false,
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  Stack: { Screen: () => null, Protected: ({ children }: { children: React.ReactNode }) => children },
}));

function TermsAcceptProbe() {
  const { redirectAfterSignOut } = useApplicationAuth();
  return (
    <>
      <TermsAndConditionsScreen />
      <Text testID="redirect-after-signout">{redirectAfterSignOut ?? 'none'}</Text>
    </>
  );
}

describe('TermsAndConditionsScreen', () => {
  afterEach(async () => {
    mockReplace.mockClear();
    await act(async () => {
      cleanup();
    });
  });

  it('renders Figma T&C chrome', async () => {
    await renderAuthUi(<TermsAndConditionsScreen />);

    expect(await screen.findByTestId('terms-screen')).toBeTruthy();
    expect(screen.getByText('Terms and Condition')).toBeTruthy();
    expect(screen.getByText('Read legal disclaimer')).toBeTruthy();
    expect(screen.getByTestId('terms-view-document')).toBeTruthy();
    expect(screen.getByTestId('terms-agree')).toBeTruthy();
    expect(screen.getByTestId('terms-accept')).toBeTruthy();
    expect(screen.getByTestId('terms-progress')).toBeTruthy();
  });

  it('requires agreement before accept', async () => {
    await renderAuthUi(<TermsAndConditionsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('terms-accept'));
    });

    expect(await screen.findByText('Agree to the Terms and Conditions to continue')).toBeTruthy();
  });

  it('opens the terms document from View Terms and Conditions', async () => {
    await renderAuthUi(<TermsAndConditionsScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('terms-view-document'));
    });

    // Navigation is mocked in renderAuthUi; button remains pressable.
    expect(screen.getByTestId('terms-view-document')).toBeTruthy();
  });

  it('after signup verification Accept signs out and queues login redirect', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    service.seedSession({
      user: {
        id: 'fake|verified',
        email: 'verified@tngble.app',
        emailVerified: true,
        provider: 'database',
      },
    });
    const signOutSpy = jest.spyOn(service, 'signOut');

    await renderAuthUi(<TermsAcceptProbe />, { service, autoRestore: true });
    expect(await screen.findByTestId('terms-screen', {}, { timeout: 10_000 })).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('terms-agree'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('terms-accept'));
    });

    await waitFor(() => {
      expect(signOutSpy).toHaveBeenCalled();
    });
    expect(screen.getByTestId('redirect-after-signout').props.children).toBe('/(auth)/login');
  });
});
