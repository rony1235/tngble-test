export type { ConsentAcceptedPayload, ConsentRecord } from './types';
export { createConsentAcceptance, isConsentCurrent } from './Consent';
export {
  canProceedWithSignup,
  evaluateConsentGate,
  type ConsentGateDecision,
  type OnConsentAccepted,
} from './ConsentGate';
