import { useCallback, type ReactNode } from 'react';

import { useApplicationAuth } from '@/application/auth/AuthContext';
import type { LoginCredentials, User } from '@/auth/types';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

/**
 * Compatibility facade over ApplicationAuth for legacy callers.
 * Prefer `@/application` hooks — presentation screens use those directly.
 *
 * @deprecated Use useApplicationAuth / useSignIn / useSignOut instead.
 */
export function useAuth(): AuthContextValue {
  const {
    user,
    isLoading,
    isAuthenticated,
    signIn: appSignIn,
    signOut,
    error,
  } = useApplicationAuth();

  const signIn = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await appSignIn({ email: credentials.email });
      if (!result) {
        throw new Error(error?.message ?? 'Sign in failed');
      }
    },
    [appSignIn, error?.message],
  );

  return {
    user: user
      ? {
          id: user.id,
          email: user.email,
        }
      : null,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
  };
}

/** @deprecated Mounted via AppProviders — kept so existing test mocks keep working. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return children;
}
