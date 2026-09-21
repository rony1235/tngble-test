import { useConsentContext } from '@/providers/ConsentProvider';

export type UseConsentGateOptions = {
  /** @deprecated Prefer ConsentProvider `documentVersion`. Kept for tests. */
  requiredVersion?: string;
  onConsentAccepted?: never;
};

/**
 * Shared consent gate — state lives in ConsentProvider so RootNavigator and
 * TermsAndConditionsScreen see the same acceptance.
 */
export function useConsentGate(_options: UseConsentGateOptions = {}) {
  return useConsentContext();
}
