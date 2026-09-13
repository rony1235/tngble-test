import * as SecureStore from 'expo-secure-store';

import { getHasCompletedOnboarding, setHasCompletedOnboarding } from '@/onboarding/storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const setItemAsync = SecureStore.setItemAsync as jest.MockedFunction<
  typeof SecureStore.setItemAsync
>;

describe('onboarding storage', () => {
  beforeEach(() => {
    setItemAsync.mockReset();
    setItemAsync.mockResolvedValue(undefined);
  });

  it('always reports incomplete so onboarding shows every launch', async () => {
    await expect(getHasCompletedOnboarding()).resolves.toBe(false);
  });

  it('can still persist a completion flag for future use', async () => {
    await setHasCompletedOnboarding(true);
    expect(setItemAsync).toHaveBeenCalledWith('tngble.hasCompletedOnboarding', 'true');
    await expect(getHasCompletedOnboarding()).resolves.toBe(false);
  });
});
