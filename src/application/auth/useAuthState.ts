import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useAuthState() {
  const {
    status,
    authState,
    user,
    error,
    isBusy,
    isLoading,
    isAuthenticated,
    isPendingVerification,
    clearError,
  } = useApplicationAuth();

  return {
    status,
    authState,
    user,
    error,
    isBusy,
    isLoading,
    isAuthenticated,
    isPendingVerification,
    clearError,
  };
}
