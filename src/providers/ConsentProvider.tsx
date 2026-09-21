import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  canProceedWithSignup,
  createConsentAcceptance,
  evaluateConsentGate,
  type ConsentRecord,
  type OnConsentAccepted,
} from '@/domain/consent';
import {
  clearLocalConsent,
  getLocalConsent,
  setLocalConsent,
} from '@/infrastructure/storage/LocalConsentStore';
import { DEFAULT_CONSENT_DOCUMENT_VERSION } from '@/shared/constants';

type ConsentContextValue = {
  documentVersion: string;
  onConsentAccepted?: OnConsentAccepted;
  ready: boolean;
  accepted: ConsentRecord | null;
  checked: boolean;
  canProceed: boolean;
  decision: ReturnType<typeof evaluateConsentGate>;
  acceptConsent: () => Promise<ConsentRecord>;
  setConsentChecked: (value: boolean) => Promise<void>;
  /** Drop stored + in-memory consent (e.g. before a fresh signup Terms gate). */
  resetConsent: () => Promise<void>;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({
  children,
  documentVersion = DEFAULT_CONSENT_DOCUMENT_VERSION,
  onConsentAccepted,
}: {
  children: ReactNode;
  documentVersion?: string;
  onConsentAccepted?: OnConsentAccepted;
}) {
  const requiredVersion = documentVersion;
  const [accepted, setAccepted] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    getLocalConsent()
      .then((stored) => {
        if (mounted) setAccepted(stored);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const decision = evaluateConsentGate(accepted, requiredVersion);
  const canProceed = canProceedWithSignup(accepted, requiredVersion);

  const acceptConsent = useCallback(async () => {
    const record = createConsentAcceptance(requiredVersion);
    await setLocalConsent(record);
    setAccepted(record);
    setChecked(true);
    onConsentAccepted?.(record);
    return record;
  }, [onConsentAccepted, requiredVersion]);

  const setConsentChecked = useCallback(
    async (value: boolean) => {
      setChecked(value);
      if (value) {
        await acceptConsent();
      }
    },
    [acceptConsent],
  );

  const resetConsent = useCallback(async () => {
    await clearLocalConsent();
    setAccepted(null);
    setChecked(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      documentVersion: requiredVersion,
      onConsentAccepted,
      ready,
      accepted,
      checked: checked || decision.allowed,
      canProceed,
      decision,
      acceptConsent,
      setConsentChecked,
      resetConsent,
    }),
    [
      acceptConsent,
      accepted,
      canProceed,
      checked,
      decision,
      onConsentAccepted,
      ready,
      requiredVersion,
      resetConsent,
      setConsentChecked,
    ],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

/** Config-only read used by hooks that still accept an optional override version. */
export function useConsentConfig(): Pick<
  ConsentContextValue,
  'documentVersion' | 'onConsentAccepted'
> {
  const context = useContext(ConsentContext);
  if (!context) {
    return { documentVersion: DEFAULT_CONSENT_DOCUMENT_VERSION };
  }
  return {
    documentVersion: context.documentVersion,
    onConsentAccepted: context.onConsentAccepted,
  };
}

export function useConsentContext(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsentContext must be used inside ConsentProvider');
  }
  return context;
}
