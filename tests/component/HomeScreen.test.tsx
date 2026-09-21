import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { HomeScreen } from '@/presentation/screens/HomeScreen';
import { createTestAuthService, renderAuthUi } from './renderAuthUi';

describe('HomeScreen (FakeAuthAdapter)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });
  it('shows signed-in email and signs out', async () => {
    const service = createTestAuthService({ scenario: 'success' });
    service.seedSession({
      user: {
        id: 'fake|home',
        email: 'home@tngble.app',
        emailVerified: true,
        provider: 'database',
      },
    });
    const spy = jest.spyOn(service, 'signOut');

    await renderAuthUi(<HomeScreen />, { service, autoRestore: true });

    expect(await screen.findByTestId('home-screen', {}, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByText('home@tngble.app')).toBeTruthy();
    expect(screen.getByTestId('sign-out').props.accessibilityRole).toBe('button');

    await act(async () => {
      fireEvent.press(screen.getByTestId('sign-out'));
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
});
