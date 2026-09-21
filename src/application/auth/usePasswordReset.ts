import { useApplicationAuth } from '@/application/auth/AuthContext';

export function usePasswordReset() {
  const {
    requestPasswordReset,
    confirmPasswordResetOtp,
    completePasswordReset,
    isBusy,
    error,
    clearError,
  } = useApplicationAuth();
  return {
    requestPasswordReset,
    confirmPasswordResetOtp,
    completePasswordReset,
    isBusy,
    error,
    clearError,
  };
}
