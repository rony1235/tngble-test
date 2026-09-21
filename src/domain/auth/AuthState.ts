export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'pendingVerification'
  | 'authenticated'
  | 'expired';

export type AuthState = {
  status: AuthStatus;
};

export function initialAuthState(): AuthState {
  return { status: 'loading' };
}

export function isAuthenticatedStatus(status: AuthStatus): boolean {
  return status === 'authenticated';
}

export function canAccessApp(status: AuthStatus): boolean {
  return status === 'authenticated';
}

export function canAccessAuthStack(status: AuthStatus): boolean {
  return status === 'unauthenticated' || status === 'expired';
}

export function canAccessVerifyPending(status: AuthStatus): boolean {
  return status === 'pendingVerification';
}
