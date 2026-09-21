import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useSignUp() {
  const { signUp, isBusy, error, clearError } = useApplicationAuth();
  return { signUp, isBusy, error, clearError };
}
