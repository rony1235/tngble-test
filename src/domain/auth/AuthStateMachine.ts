import type { User } from './types';
import { type AuthState, type AuthStatus } from './AuthState';

export type AuthEvent =
  | { type: 'RESTORE_START' }
  | { type: 'RESTORE_EMPTY' }
  | { type: 'RESTORE_SUCCESS'; user: User }
  | { type: 'SIGN_IN_SUCCESS'; user: User }
  | { type: 'EMAIL_VERIFIED' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SIGN_OUT' }
  | { type: 'RESET_TO_UNAUTHENTICATED' };

export type AuthTransitionResult = {
  state: AuthState;
  /** True when the event is not allowed from the current status. */
  invalid: boolean;
};

function statusForUser(user: User): AuthStatus {
  return user.emailVerified ? 'authenticated' : 'pendingVerification';
}

const ALLOWED: Record<AuthStatus, ReadonlySet<AuthEvent['type']>> = {
  loading: new Set([
    'RESTORE_START',
    'RESTORE_EMPTY',
    'RESTORE_SUCCESS',
    'SIGN_OUT',
    'RESET_TO_UNAUTHENTICATED',
  ]),
  unauthenticated: new Set([
    'RESTORE_START',
    'SIGN_IN_SUCCESS',
    'SIGN_OUT',
    'RESET_TO_UNAUTHENTICATED',
  ]),
  pendingVerification: new Set([
    'EMAIL_VERIFIED',
    'SIGN_IN_SUCCESS',
    'SESSION_EXPIRED',
    'SIGN_OUT',
    'RESET_TO_UNAUTHENTICATED',
    'RESTORE_START',
  ]),
  authenticated: new Set([
    'SESSION_EXPIRED',
    'SIGN_OUT',
    'RESET_TO_UNAUTHENTICATED',
    'RESTORE_START',
  ]),
  expired: new Set([
    'SIGN_IN_SUCCESS',
    'SIGN_OUT',
    'RESET_TO_UNAUTHENTICATED',
    'RESTORE_START',
  ]),
};

function apply(status: AuthStatus, event: AuthEvent): AuthStatus {
  switch (event.type) {
    case 'RESTORE_START':
      return 'loading';
    case 'RESTORE_EMPTY':
      return 'unauthenticated';
    case 'RESTORE_SUCCESS':
    case 'SIGN_IN_SUCCESS':
      return statusForUser(event.user);
    case 'EMAIL_VERIFIED':
      return 'authenticated';
    case 'SESSION_EXPIRED':
      return 'expired';
    case 'SIGN_OUT':
    case 'RESET_TO_UNAUTHENTICATED':
      return 'unauthenticated';
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

/**
 * Pure auth state machine. Impossible transitions leave state unchanged and set `invalid`.
 */
export function transitionAuthState(state: AuthState, event: AuthEvent): AuthTransitionResult {
  if (!ALLOWED[state.status].has(event.type)) {
    return { state, invalid: true };
  }

  // EMAIL_VERIFIED only makes sense from pendingVerification (already gated by ALLOWED).
  return {
    state: { status: apply(state.status, event) },
    invalid: false,
  };
}

export function transitionAuthStatus(status: AuthStatus, event: AuthEvent): AuthTransitionResult {
  return transitionAuthState({ status }, event);
}
