import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useSignOut() {
  const { signOut, isBusy, error, clearError } = useApplicationAuth();
  return { signOut, isBusy, error, clearError };
}
