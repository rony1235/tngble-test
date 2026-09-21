import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useSocialSignIn() {
  const { signInWithSocial, isBusy, error, clearError } = useApplicationAuth();
  return { signInWithSocial, isBusy, error, clearError };
}
