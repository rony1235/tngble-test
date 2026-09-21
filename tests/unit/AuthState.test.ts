import {
  canAccessApp,
  canAccessAuthStack,
  canAccessVerifyPending,
  initialAuthState,
  isAuthenticatedStatus,
} from '@/domain/auth';

describe('AuthState helpers', () => {
  it('starts loading and gates stacks by status', () => {
    expect(initialAuthState()).toEqual({ status: 'loading' });
    expect(isAuthenticatedStatus('authenticated')).toBe(true);
    expect(isAuthenticatedStatus('pendingVerification')).toBe(false);
    expect(canAccessApp('authenticated')).toBe(true);
    expect(canAccessApp('pendingVerification')).toBe(false);
    expect(canAccessAuthStack('unauthenticated')).toBe(true);
    expect(canAccessAuthStack('expired')).toBe(true);
    expect(canAccessAuthStack('authenticated')).toBe(false);
    expect(canAccessVerifyPending('pendingVerification')).toBe(true);
    expect(canAccessVerifyPending('authenticated')).toBe(false);
  });
});
