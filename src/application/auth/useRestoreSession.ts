import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useRestoreSession() {
  const { restoreSession, isBusy, error, isLoading, clearError } = useApplicationAuth();
  return { restoreSession, isBusy, error, isLoading, clearError };
}
