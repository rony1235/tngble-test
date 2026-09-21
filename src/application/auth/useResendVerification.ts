import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useResendVerification() {
  const {
    resendVerification,
    isBusy,
    error,
    clearError,
    user,
    resendCooldownRemainingMs,
  } = useApplicationAuth();
  return {
    resendVerification,
    isBusy,
    error,
    clearError,
    email: user?.email,
    resendCooldownRemainingMs,
  };
}
