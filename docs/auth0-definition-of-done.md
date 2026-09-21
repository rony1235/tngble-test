# AUTH-01 — Definition of done

Updated 2026-09-19 (Phase 11).  
**In-repo** items are complete. **Manual** items need live Auth0 tenant + device/release builds.

```text
[x] Layered architecture in place (Expo Router adaptation)
[x] AuthService port used everywhere; no screen imports Auth0 SDK (ESLint + boundary tests)
[x] FakeAuthAdapter drives unit/component tests
[x] Universal Login signup/signin (no Password Grant)
[x] Google sign-in/sign-up via Auth0 connection (code path)
[x] Apple sign-in/sign-up via Auth0 connection (code path; iOS device validation pending tenant)
[x] Email verification gate enforced
[x] Password reset hosted flow
[x] Sign-out clears Auth0 + local state (+ legacy SecureStore wipe)
[x] Session restore on cold start; refresh failure logs out cleanly
[x] Credentials only in Auth0 credentials manager
[x] Consent gate hook with version + timestamp + callback (INV-US023 hook only)
[x] Sanitization module pure + tested (incl. fast-check)
[x] Safe error taxonomy (INV-US012)
[x] Redaction on logs
[x] Face ID mock not shipped as working auth
[x] Accessibility pass on auth screens (roles/labels in component tests)
[x] Coverage gates + CI green (`.github/workflows/ci.yml`)
[x] README updated (incl. social / tenant pointers)
[x] Carry-over list documented (`docs/auth.md`)
[ ] Release-configuration verified on physical iOS + Android (tenant-blocked)
```

## Sprint review talking points

- **INV-US010** Google/Apple: delivered in app architecture; console + device matrix still owner-owned.  
- **INV-US023** consent: local hook only — not a full legal ledger.  
- Demo path: [`docs/auth.md`](./auth.md) § Demo script.
