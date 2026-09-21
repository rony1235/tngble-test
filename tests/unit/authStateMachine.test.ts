import {
  initialAuthState,
  transitionAuthState,
  transitionAuthStatus,
  type AuthEvent,
  type User,
} from '@/domain/auth';

const verified: User = {
  id: 'u1',
  email: 'a@b.co',
  emailVerified: true,
};

const unverified: User = {
  id: 'u2',
  email: 'c@d.co',
  emailVerified: false,
};

describe('AuthStateMachine', () => {
  it('restore path: loading → pendingVerification → authenticated → expired → unauthenticated', () => {
    let state = initialAuthState();
    expect(state.status).toBe('loading');

    state = transitionAuthState(state, { type: 'RESTORE_SUCCESS', user: unverified }).state;
    expect(state.status).toBe('pendingVerification');

    state = transitionAuthState(state, { type: 'EMAIL_VERIFIED' }).state;
    expect(state.status).toBe('authenticated');

    state = transitionAuthState(state, { type: 'SESSION_EXPIRED' }).state;
    expect(state.status).toBe('expired');

    state = transitionAuthState(state, { type: 'SIGN_OUT' }).state;
    expect(state.status).toBe('unauthenticated');
  });

  it('sign-in verified lands on authenticated', () => {
    const result = transitionAuthState(
      { status: 'unauthenticated' },
      { type: 'SIGN_IN_SUCCESS', user: verified },
    );
    expect(result.invalid).toBe(false);
    expect(result.state.status).toBe('authenticated');
  });

  it('unverified database or social user lands on pendingVerification', () => {
    const db = transitionAuthState(
      { status: 'unauthenticated' },
      { type: 'SIGN_IN_SUCCESS', user: unverified },
    );
    expect(db.state.status).toBe('pendingVerification');

    const socialUnverified: User = {
      id: 'google-oauth2|1',
      email: 'g@tngble.app',
      emailVerified: false,
      provider: 'google',
    };
    const social = transitionAuthState(
      { status: 'unauthenticated' },
      { type: 'SIGN_IN_SUCCESS', user: socialUnverified },
    );
    expect(social.state.status).toBe('pendingVerification');
  });

  it('verified social user skips pending and authenticates', () => {
    const socialVerified: User = {
      id: 'apple|1',
      email: 'a@tngble.app',
      emailVerified: true,
      provider: 'apple',
    };
    const result = transitionAuthState(
      { status: 'unauthenticated' },
      { type: 'SIGN_IN_SUCCESS', user: socialVerified },
    );
    expect(result.state.status).toBe('authenticated');
  });

  it('marks impossible transitions invalid and keeps state', () => {
    const events: AuthEvent[] = [
      { type: 'EMAIL_VERIFIED' },
      { type: 'SESSION_EXPIRED' },
      { type: 'RESTORE_EMPTY' },
    ];

    for (const event of events) {
      const result = transitionAuthState({ status: 'unauthenticated' }, event);
      expect(result.invalid).toBe(true);
      expect(result.state.status).toBe('unauthenticated');
    }
  });

  it('does not allow EMAIL_VERIFIED from authenticated', () => {
    const result = transitionAuthState({ status: 'authenticated' }, { type: 'EMAIL_VERIFIED' });
    expect(result.invalid).toBe(true);
    expect(result.state.status).toBe('authenticated');
  });

  it('restore empty and transitionAuthStatus helper', () => {
    let state = initialAuthState();
    state = transitionAuthState(state, { type: 'RESTORE_START' }).state;
    expect(state.status).toBe('loading');
    state = transitionAuthState(state, { type: 'RESTORE_EMPTY' }).state;
    expect(state.status).toBe('unauthenticated');

    const viaHelper = transitionAuthStatus('unauthenticated', {
      type: 'SIGN_IN_SUCCESS',
      user: verified,
    });
    expect(viaHelper.state.status).toBe('authenticated');
  });
});
