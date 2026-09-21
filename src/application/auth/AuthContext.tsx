import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuthService } from '@/application/auth/AuthServiceProvider';
import type {
  AuthError,
  AuthEvent,
  AuthResult,
  AuthState,
  AuthStatus,
  SignInInput,
  SignUpInput,
  SocialProvider,
  User,
} from '@/domain/auth';
import {
  createAuthError,
  initialAuthState,
  mapProviderError,
  transitionAuthState,
} from '@/domain/auth';
import { EMAIL_VERIFICATION_RESEND_COOLDOWN_MS } from '@/shared/constants';

export type ApplicationAuthContextValue = {
  status: AuthStatus;
  authState: AuthState;
  user: User | null;
  error: AuthError | null;
  isBusy: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPendingVerification: boolean;
  /**
   * After signup email OTP succeeds, force the Terms gate even if this device
   * already has a prior local consent record — then Accept → sign out → login.
   */
  requiresTermsAcceptance: boolean;
  /** Milliseconds remaining before another resend is allowed. */
  resendCooldownRemainingMs: number;
  clearError: () => void;
  /** Clear the post-OTP Terms requirement (after Accept + sign-out, or abandon). */
  clearRequiresTermsAcceptance: () => void;
  signUp: (input?: SignUpInput) => Promise<AuthResult | null>;
  signIn: (input?: SignInInput) => Promise<AuthResult | null>;
  signInWithSocial: (provider: SocialProvider) => Promise<AuthResult | null>;
  signOut: (options?: { redirectTo?: '/(auth)/login' | '/(auth)' }) => Promise<void>;
  /** Consumed by the auth stack after sign-out (e.g. Terms Accept → login). */
  redirectAfterSignOut: '/(auth)/login' | '/(auth)' | null;
  clearRedirectAfterSignOut: () => void;
  requestPasswordReset: (email?: string) => Promise<boolean>;
  confirmPasswordResetOtp: (code: string) => Promise<boolean>;
  /** Set new password in-app after OTP (Auth0 My Account API). */
  completePasswordReset: (password: string) => Promise<boolean>;
  restoreSession: () => Promise<void>;
  resendVerification: (email?: string) => Promise<boolean>;
  /** Exchange signup email OTP for a verified session. */
  confirmEmailOtp: (code: string) => Promise<boolean>;
  /** Force-refresh ID token claims; promotes to authenticated when verified. */
  refreshVerificationStatus: () => Promise<boolean>;
  markEmailVerified: () => void;
  getAccessToken: () => Promise<string | null>;
};

const ApplicationAuthContext = createContext<ApplicationAuthContextValue | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** When false, skip cold-start restore and start unauthenticated (tests). */
  autoRestore?: boolean;
};

export function ApplicationAuthProvider({
  children,
  autoRestore = true,
}: ProviderProps) {
  const service = useAuthService();
  const [authState, setAuthState] = useState<AuthState>(() =>
    autoRestore ? initialAuthState() : { status: 'unauthenticated' },
  );
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [requiresTermsAcceptance, setRequiresTermsAcceptance] = useState(false);
  const [redirectAfterSignOut, setRedirectAfterSignOut] = useState<
    '/(auth)/login' | '/(auth)' | null
  >(null);
  const [resendCooldownRemainingMs, setResendCooldownRemainingMs] = useState(0);
  const inFlightRef = useRef(false);
  const lastResendAtRef = useRef(0);

  const dispatch = useCallback((event: AuthEvent) => {
    setAuthState((current) => {
      const result = transitionAuthState(current, event);
      return result.invalid ? current : result.state;
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearRequiresTermsAcceptance = useCallback(() => {
    setRequiresTermsAcceptance(false);
  }, []);
  const clearRedirectAfterSignOut = useCallback(() => {
    setRedirectAfterSignOut(null);
  }, []);

  const beginAction = useCallback((): boolean => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setIsBusy(true);
    setError(null);
    return true;
  }, []);

  const endAction = useCallback(() => {
    inFlightRef.current = false;
    setIsBusy(false);
  }, []);

  const handleAuthSuccess = useCallback(
    (result: AuthResult) => {
      setUser(result.user);
      dispatch({ type: 'SIGN_IN_SUCCESS', user: result.user });
      setError(null);
      return result;
    },
    [dispatch],
  );

  const handleAuthFailure = useCallback(
    (caught: unknown): null => {
      const mapped = mapProviderError(caught);
      if (__DEV__) {
        const like =
          caught && typeof caught === 'object'
            ? (caught as { code?: string; message?: string; error?: string; error_description?: string })
            : {};
        // Helps diagnose Auth0 tenant misconfig when UI only shows a safe message.
        console.warn('[auth] failure', {
          mapped: mapped.code,
          mappedMessage: mapped.message,
          providerCode: like.code ?? like.error,
          providerMessage: like.message,
          providerDescription: like.error_description,
        });
      }
      if (mapped.code === 'cancelled') {
        setError(mapped);
        return null;
      }
      if (mapped.code === 'sessionExpired') {
        setUser(null);
        dispatch({ type: 'SESSION_EXPIRED' });
      }
      setError(mapped);
      return null;
    },
    [dispatch],
  );

  const restoreSession = useCallback(async () => {
    if (!beginAction()) return;
    try {
      dispatch({ type: 'RESTORE_START' });
      const result = await service.restoreSession();
      if (!result) {
        setUser(null);
        dispatch({ type: 'RESTORE_EMPTY' });
        return;
      }
      setUser(result.user);
      dispatch({ type: 'RESTORE_SUCCESS', user: result.user });
    } catch (caught) {
      setUser(null);
      const mapped = mapProviderError(caught);
      setError(mapped.code === 'cancelled' ? null : mapped);
      dispatch({ type: 'RESET_TO_UNAUTHENTICATED' });
    } finally {
      endAction();
    }
  }, [beginAction, dispatch, endAction, service]);

  useEffect(() => {
    if (!autoRestore) return;
    // Cold-start session restore is an external async boundary (AUTH-01).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoreSession performs I/O then setState
    void restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/service restore only; avoid re-entry loops
  }, [autoRestore, service]);

  const signUp = useCallback(
    async (input?: SignUpInput) => {
      if (!beginAction()) return null;
      try {
        const result = await service.signUp(input);
        if (!result.user.emailVerified) {
          // The initial OTP send must also start the cooldown. Otherwise an
          // immediate resend invalidates the code in the first email.
          lastResendAtRef.current = Date.now();
          setResendCooldownRemainingMs(EMAIL_VERIFICATION_RESEND_COOLDOWN_MS);
        }
        return handleAuthSuccess(result);
      } catch (caught) {
        return handleAuthFailure(caught);
      } finally {
        endAction();
      }
    },
    [beginAction, endAction, handleAuthFailure, handleAuthSuccess, service],
  );

  const signIn = useCallback(
    async (input?: SignInInput) => {
      if (!beginAction()) return null;
      try {
        const result = await service.signIn(input);
        return handleAuthSuccess(result);
      } catch (caught) {
        return handleAuthFailure(caught);
      } finally {
        endAction();
      }
    },
    [beginAction, endAction, handleAuthFailure, handleAuthSuccess, service],
  );

  const signInWithSocial = useCallback(
    async (provider: SocialProvider) => {
      if (!beginAction()) return null;
      try {
        const result = await service.signInWithSocial(provider);
        return handleAuthSuccess(result);
      } catch (caught) {
        return handleAuthFailure(caught);
      } finally {
        endAction();
      }
    },
    [beginAction, endAction, handleAuthFailure, handleAuthSuccess, service],
  );

  const signOut = useCallback(async (options?: { redirectTo?: '/(auth)/login' | '/(auth)' }) => {
    if (!beginAction()) return;
    if (options?.redirectTo) {
      setRedirectAfterSignOut(options.redirectTo);
    }
    // Route away from protected content immediately. Provider/browser cleanup
    // continues without keeping the user visibly signed in.
    setUser(null);
    setRequiresTermsAcceptance(false);
    dispatch({ type: 'SIGN_OUT' });
    try {
      await service.signOut();
    } catch (caught) {
      setError(mapProviderError(caught));
    } finally {
      endAction();
    }
  }, [beginAction, dispatch, endAction, service]);

  const requestPasswordReset = useCallback(
    async (email?: string) => {
      if (!beginAction()) return false;
      try {
        await service.requestPasswordReset(email);
        setError(null);
        return true;
      } catch (caught) {
        setError(mapProviderError(caught));
        return false;
      } finally {
        endAction();
      }
    },
    [beginAction, endAction, service],
  );

  const confirmPasswordResetOtp = useCallback(
    async (code: string) => {
      if (!beginAction()) return false;
      try {
        await service.confirmPasswordResetOtp(code);
        setError(null);
        return true;
      } catch (caught) {
        setError(mapProviderError(caught));
        return false;
      } finally {
        endAction();
      }
    },
    [beginAction, endAction, service],
  );

  const completePasswordReset = useCallback(
    async (password: string) => {
      if (!beginAction()) return false;
      try {
        await service.completePasswordReset(password);
        setError(null);
        return true;
      } catch (caught) {
        setError(mapProviderError(caught));
        return false;
      } finally {
        endAction();
      }
    },
    [beginAction, endAction, service],
  );

  const tickResendCooldown = useCallback(() => {
    // Clamp both ends because mobile device clocks can jump after network sync.
    const remaining = Math.min(
      EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
      Math.max(
        0,
        EMAIL_VERIFICATION_RESEND_COOLDOWN_MS -
          (Date.now() - lastResendAtRef.current),
      ),
    );
    setResendCooldownRemainingMs(remaining);
    return remaining;
  }, []);

  useEffect(() => {
    if (resendCooldownRemainingMs <= 0) return;
    const id = setInterval(() => {
      const remaining = tickResendCooldown();
      if (remaining <= 0) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [resendCooldownRemainingMs, tickResendCooldown]);

  const resendVerification = useCallback(
    async (email?: string) => {
      const remaining = tickResendCooldown();
      if (remaining > 0) {
        setError(
          createAuthError('rateLimited', 'Please wait before requesting another email.'),
        );
        return false;
      }
      if (!beginAction()) return false;
      try {
        await service.requestEmailVerification(email ?? user?.email);
        lastResendAtRef.current = Date.now();
        tickResendCooldown();
        setError(null);
        return true;
      } catch (caught) {
        setError(mapProviderError(caught));
        return false;
      } finally {
        endAction();
      }
    },
    [beginAction, endAction, service, tickResendCooldown, user?.email],
  );

  const confirmEmailOtp = useCallback(
    async (code: string) => {
      if (!beginAction()) return false;
      try {
        const result = await service.confirmEmailOtp(code);
        handleAuthSuccess(result);
        // Signup path: Create Account → OTP → Terms → login (never skip to home).
        if (result.user.emailVerified) {
          setRequiresTermsAcceptance(true);
        }
        return result.user.emailVerified;
      } catch (caught) {
        handleAuthFailure(caught);
        return false;
      } finally {
        endAction();
      }
    },
    [beginAction, endAction, handleAuthFailure, handleAuthSuccess, service],
  );

  const refreshVerificationStatus = useCallback(async () => {
    if (!beginAction()) return false;
    try {
      const result = await service.refreshUser();
      if (!result) {
        // Provisional signup (OTP pending) has no credentials yet — stay on verify.
        if (user && !user.emailVerified) {
          return false;
        }
        setUser(null);
        dispatch({ type: 'SESSION_EXPIRED' });
        setError(createAuthError('sessionExpired'));
        return false;
      }
      // Never downgrade a session already marked verified if a refreshed claim is stale.
      const emailVerified = result.user.emailVerified || Boolean(user?.emailVerified);
      const nextUser = { ...result.user, emailVerified };
      setUser(nextUser);
      if (emailVerified) {
        dispatch({ type: 'EMAIL_VERIFIED' });
        // Same post-verify Terms gate as confirmEmailOtp (link / refresh path).
        setRequiresTermsAcceptance(true);
        setError(null);
        return true;
      }
      setError(
        createAuthError(
          'generic',
          'Email not verified yet. Enter the code from your inbox, then try again.',
        ),
      );
      return false;
    } catch (caught) {
      handleAuthFailure(caught);
      return false;
    } finally {
      endAction();
    }
  }, [beginAction, dispatch, endAction, handleAuthFailure, service, user]);

  const markEmailVerified = useCallback(() => {
    setUser((current) => (current ? { ...current, emailVerified: true } : current));
    dispatch({ type: 'EMAIL_VERIFIED' });
    setRequiresTermsAcceptance(true);
  }, [dispatch]);

  const getAccessToken = useCallback(async () => {
    try {
      return await service.getAccessToken();
    } catch (caught) {
      handleAuthFailure(caught);
      return null;
    }
  }, [handleAuthFailure, service]);

  const value = useMemo<ApplicationAuthContextValue>(
    () => ({
      status: authState.status,
      authState,
      user,
      error,
      isBusy,
      isLoading: authState.status === 'loading',
      isAuthenticated: authState.status === 'authenticated',
      isPendingVerification: authState.status === 'pendingVerification',
      requiresTermsAcceptance,
      redirectAfterSignOut,
      resendCooldownRemainingMs,
      clearError,
      clearRequiresTermsAcceptance,
      clearRedirectAfterSignOut,
      signUp,
      signIn,
      signInWithSocial,
      signOut,
      requestPasswordReset,
      confirmPasswordResetOtp,
      completePasswordReset,
      restoreSession,
      resendVerification,
      confirmEmailOtp,
      refreshVerificationStatus,
      markEmailVerified,
      getAccessToken,
    }),
    [
      authState,
      user,
      error,
      isBusy,
      requiresTermsAcceptance,
      redirectAfterSignOut,
      resendCooldownRemainingMs,
      clearError,
      clearRequiresTermsAcceptance,
      clearRedirectAfterSignOut,
      signUp,
      signIn,
      signInWithSocial,
      signOut,
      requestPasswordReset,
      confirmPasswordResetOtp,
      completePasswordReset,
      restoreSession,
      resendVerification,
      confirmEmailOtp,
      refreshVerificationStatus,
      markEmailVerified,
      getAccessToken,
    ],
  );

  return (
    <ApplicationAuthContext.Provider value={value}>
      {children}
    </ApplicationAuthContext.Provider>
  );
}

export function useApplicationAuth(): ApplicationAuthContextValue {
  const context = useContext(ApplicationAuthContext);
  if (!context) {
    throw new Error('useApplicationAuth must be used inside ApplicationAuthProvider');
  }
  return context;
}
