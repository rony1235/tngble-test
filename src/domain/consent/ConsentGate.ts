import { isConsentCurrent } from './Consent';
import type { ConsentRecord } from './types';

export type ConsentGateDecision = {
  allowed: boolean;
  reason: 'ok' | 'missing' | 'stale_version' | 'invalid_required_version';
};

/**
 * Signup (email or social that can create an account) must pass this gate.
 * Full consent ledger is out of scope — hook only.
 */
export function evaluateConsentGate(
  accepted: ConsentRecord | null | undefined,
  requiredVersion: string,
): ConsentGateDecision {
  const required = requiredVersion.trim();
  if (!required) {
    return { allowed: false, reason: 'invalid_required_version' };
  }
  if (!accepted) {
    return { allowed: false, reason: 'missing' };
  }
  if (!isConsentCurrent(accepted, required)) {
    return { allowed: false, reason: 'stale_version' };
  }
  return { allowed: true, reason: 'ok' };
}

export function canProceedWithSignup(
  accepted: ConsentRecord | null | undefined,
  requiredVersion: string,
): boolean {
  return evaluateConsentGate(accepted, requiredVersion).allowed;
}

export type OnConsentAccepted = (payload: ConsentRecord) => void;
