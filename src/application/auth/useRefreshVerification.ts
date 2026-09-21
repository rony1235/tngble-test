import { useApplicationAuth } from '@/application/auth/AuthContext';

export function useRefreshVerification() {
  const {
    refreshVerificationStatus,
    isBusy,
    error,
    clearError,
    isPendingVerification,
  } = useApplicationAuth();
  return {
    refreshVerificationStatus,
    isBusy,
    error,
    clearError,
    isPendingVerification,
  };
}
