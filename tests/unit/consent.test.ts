import {
  canProceedWithSignup,
  createConsentAcceptance,
  evaluateConsentGate,
  isConsentCurrent,
} from '@/domain/consent';

describe('consent gate', () => {
  const version = 'terms-privacy-2026-08-22';

  it('creates acceptance with version and timestamp', () => {
    const fixed = new Date('2026-09-19T05:00:00.000Z');
    const record = createConsentAcceptance(version, fixed);
    expect(record).toEqual({
      documentVersion: version,
      acceptedAt: '2026-09-19T05:00:00.000Z',
    });
  });

  it('blocks signup when missing or stale', () => {
    expect(canProceedWithSignup(null, version)).toBe(false);
    expect(
      canProceedWithSignup(createConsentAcceptance('old-version'), version),
    ).toBe(false);
    expect(evaluateConsentGate(null, version).reason).toBe('missing');
    expect(evaluateConsentGate(createConsentAcceptance('old'), version).reason).toBe(
      'stale_version',
    );
  });

  it('allows signup when current version accepted', () => {
    const accepted = createConsentAcceptance(version);
    expect(isConsentCurrent(accepted, version)).toBe(true);
    expect(canProceedWithSignup(accepted, version)).toBe(true);
    expect(evaluateConsentGate(accepted, version)).toEqual({
      allowed: true,
      reason: 'ok',
    });
  });

  it('rejects empty required version', () => {
    expect(evaluateConsentGate(createConsentAcceptance(version), '  ').reason).toBe(
      'invalid_required_version',
    );
  });
});
