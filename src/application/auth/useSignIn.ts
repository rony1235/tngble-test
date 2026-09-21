import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useSignIn() {
  const { signIn, isBusy, error, clearError } = useApplicationAuth();
  return { signIn, isBusy, error, clearError };
}
