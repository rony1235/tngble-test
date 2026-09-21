import type { ConsentRecord } from '@/domain/consent';
import { secureDelete, secureGet, secureSet } from './SecureStorage';

const CONSENT_KEY = 'tngble.consent.acceptance';

export async function getLocalConsent(): Promise<ConsentRecord | null> {
  const raw = await secureGet(CONSENT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (
      typeof parsed?.documentVersion !== 'string' ||
      typeof parsed?.acceptedAt !== 'string'
    ) {
      await secureDelete(CONSENT_KEY);
      return null;
    }
    return parsed;
  } catch {
    await secureDelete(CONSENT_KEY);
    return null;
  }
}

export async function setLocalConsent(record: ConsentRecord): Promise<void> {
  await secureSet(CONSENT_KEY, JSON.stringify(record));
}

export async function clearLocalConsent(): Promise<void> {
  await secureDelete(CONSENT_KEY);
}
