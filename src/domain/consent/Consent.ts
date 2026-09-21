import type { ConsentRecord } from './types';

export function createConsentAcceptance(
  documentVersion: string,
  now: Date = new Date(),
): ConsentRecord {
  return {
    documentVersion: documentVersion.trim(),
    acceptedAt: now.toISOString(),
  };
}

export function isConsentCurrent(
  accepted: ConsentRecord | null | undefined,
  requiredVersion: string,
): boolean {
  if (!accepted) return false;
  return accepted.documentVersion === requiredVersion.trim();
}
