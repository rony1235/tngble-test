import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useConfirmEmailOtp() {
  const { confirmEmailOtp, isBusy, error, clearError, isPendingVerification } =
    useApplicationAuth();
  return {
    confirmEmailOtp,
    isBusy,
    error,
    clearError,
    isPendingVerification,
  };
}
