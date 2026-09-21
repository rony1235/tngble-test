## TNGBLE INVESTOR APP · SPRINT AUTH-01

## Auth0 integration: registration & account access

A four-day sprint for one React Native developer: wire up react-native-auth0 , ship sign-up, sign-in, sign-out and password reset with sanitized inputs, and back it with a test suite that a compliance reviewer would accept.

4 working days · 1 developer

Epic INV-E02

Depends on decision D06

Bonus: E2E

## 1 Sprint goal

A new user can create an account with an email address and a password, verify that email, sign in, recover a forgotten password, and sign out — through Auth0, on iOS and Android, with credentials held in the platform keystore and every input validated and normalized before it leaves the device. The provider is behind an interface thin enough that swapping it costs a day, not a sprint.

## WHY THE ABSTRACTION MATTERS

The backlog records D06 — Authentication provider as still open: one source names one identity provider, older architecture material names another, and the decision is only required by MVP build. Building directly against useAuth0() everywhere would make that open decision expensive. Everything in this sprint therefore goes through an AuthService port; Auth0 is one adapter behind it.

## 2 Scope, mapped to the backlog

| STORY WHAT IT ASKS FOR SPRINT |
| --- |
| INV-US007 Create an account with email and password In |
| INV-US009 Verify email with a time-limited code or link In INV-US011 Sign in with approved credentials In INV-US012 Clear help after a failed sign-in, without exposing security details In INV-US013 Reset a forgotten password through a verified channel In INV-US014 Log out so another person cannot use the session In INV-US023 Read and accept current terms and privacy notice Hook only INV-US008 Enter and verify a phone number Next sprint INV-US010 Sign up with an approved social account Out — Could / TBD INV-US015–022 |
| MFA, authenticator, biometrics, step-up, session list, lockout Epic INV-E03 |

INV-US023 is a real dependency, not a nicety. Terms acceptance is a Must / MVP story and consent has to be captured with a document version and timestamp (INV-US025). Four days is not enough to build the consent ledger, so this sprint ships the hook: the sign-up flow blocks on a required-consent gate, records the accepted document version locally, and exposes an onConsentAccepted callback for the consent service to implement. Flag this explicitly in sprint review so it does not quietly ship as done.


## 3 Architecture decision: Universal Login

Auth0 offers two shapes for this. The recommendation is Universal Login via authorize() , with branded hosted pages, rather than a fully custom form calling the Authentication API directly.

|   | UNIVERSAL LOGIN (RECOMMENDED) |   |   | CUSTOM UI + AUTHENTICATION API |
| --- | --- | --- | --- | --- |
| How | authorize() | opens | /dbconnections/signup | + password |
|   | ASWebAuthenticationSession | / Chrome | grant from your own screens |   |
|   | Custom Tab |   |   |   |
| MFA later (US015–016) |   | Enable in tenant, no app change | Requires a full MFA challenge flow in- |   |
|   |   |   | app |   |
| Brute-force & breached- | Enforced by Auth0 |   | Partly bypassed; you rebuild the |   |
| password protection |   |   | throttling |   |
| Credential handling |   | Password never touches your code |   | Password crosses your JS runtime — |
|   |   |   | larger audit surface |   |
| Brand control |   | Page templates + Universal Login | Total |   |
|   | customization |   |   |   |
| E2E testing |   | Harder — system browser (see §7) | Easier — native views |   |

## DO NOT USE THE PASSWORD GRANT

The Resource Owner Password Grant is the tempting way to keep a fully custom form. It is disabled by default on new Auth0 tenants, it is discouraged by the OAuth 2.0 Security BCP, and it makes MFA — a Must / MVP story in INV-E03 — structurally awkward. If product insists on pixel-perfect native forms, escalate it as a decision with the security owner; do not let it become an implementation detail chosen on day 2.

Given MFA and step-up authentication for funding and withdrawals (INV-US020) are both Must stories in the next epic, the trade is worth it. The app still owns a small pre-auth screen (email capture, consent gate, marketing copy), which is where the sanitization work in §5 applies.

## 4 Day plan

## DAY 0 — BEFORE THE SPRINT STARTS

None of this is developer work, and all of it blocks day 1. Confirm before the sprint opens: Auth0 tenant access with admin rights (dev + a dedicated -e2e tenant or connection), the bundle identifier / applicationId for both platforms, whether the app is bare React Native or Expo (Expo needs the config plugin and a development build — the flow cannot run in Expo Go), the password policy and session lifetimes product wants, and who owns the email templates for verification and reset.


DAY 1

## Foundation, tenant, and the seam

Done when: a throwaway button triggers Universal Login on a physical iOS and Android device and returns a valid token set, and the unit-test harness runs green in CI.

- Install react-native-auth0 ; pods for iOS, manifestPlaceholders ( auth0Domain , auth0Scheme ) for Android. Expo: add the config plugin and produce a dev build.

- Configure the tenant: Native application type, callback and logout URLs for both schemes, a Database connection, refresh token rotation on, an API audience so you get a usable access token rather than only an ID token.

- Wrap the app in Auth0Provider . Request openid profile email offline_access .

- Define the port: AuthService with signUp , signIn , signOut , requestPasswordReset , restoreSession , getAccessToken . Write the Auth0 adapter and an in-memory fake adapter — the fake is what the whole test suite runs against.

- Secrets: domain and clientId from build-time config, never committed. Add the redaction rule to the crash/log reporter now, before any token exists to leak.

- CI job: typecheck, lint, unit tests, coverage gate.

## DAY 2

## Sign-up, validation, sanitization, email verification

Done when: a new user completes sign-up end to end, lands on a verification-pending state, and cannot proceed into the app until the address is verified.

- Pre-auth screen: email capture, required-consent gate (INV-US023 hook), accessible labels and error text.

- Implement the sanitization layer from §5 as pure functions in their own module, with unit and property-based tests.

- Sign-up via authorize({ screen_hint: 'signup' }) ; map the returned identity into the app's user model.

- Email verification (INV-US009): read email_verified from the ID token, build the pending-verification screen, wire a resend action with client-side throttling.

- Route guard: unverified users reach the pending screen and nothing else.

- Cancellation is a first-class path — a user who dismisses the browser sheet returns to a clean form, not a spinner.


DAY 3

## Sign-in, session lifecycle, failure paths

Done when: sign in, kill the app, reopen it, and the session is still there; sign out, reopen, and it is gone.

- Sign-in (INV-US011) through the same adapter.

- Credentials in the built-in credentials manager — Keychain and EncryptedSharedPreferences. Never AsyncStorage, never Redux persist, never a log line.

- Silent session restore on cold start; refresh-token rotation; a single well-tested path for "refresh failed → sign the user out cleanly".

- Sign-out (INV-US014): clearSession plus a local wipe of credentials and cached user state. Verify the browser session is gone, not just the app state.

- Password reset (INV-US013) through the hosted flow.

- Error taxonomy (INV-US012): map every failure to one of a small set of user-facing messages that never reveal whether an address is registered, whether a password was close, or how many attempts remain. Network, cancelled, rate-limited, blocked account, and generic-failure each get distinct recovery guidance without distinct security information.

## DAY 4

## Hardening, accessibility, test completion, demo

Done when: the definition of done in §8 is fully satisfied and the sprint is demonstrable on both platforms

from a clean install.

- Close coverage gaps; add the negative-path tests that were deferred while building.

- Accessibility pass: labels, focus order, error announcement, 200% text scaling, contrast.

- Security sweep: no tokens or PII in logs or crash reports, screenshot protection considered for the pending-verification screen, deep-link handling reviewed for callback hijacking, release build verified (a debug-only scheme that works locally and fails signed is the classic day-5 surprise).

- Bonus E2E happy path (§7). Time-boxed — if it is not green by mid-afternoon, land the harness and the mocked- adapter run, and carry the real-browser test into the next sprint rather than shipping a flaky suite.

- Write the README section: tenant setup, environment variables, how to run each test layer, and the list of things deliberately not done.

## 5 Input sanitization rules

Validation rejects; sanitization normalizes. Both run in the same pure module, both are unit-tested, and neither is the only line of defence — Auth0 and the backend validate independently.


| FIELD NORMALIZE REJECT Email Trim; strip zero-width and bidi control characters; Longer than 254 characters; no @ ; Unicode NFKC; lowercase the domain only (the local whitespace or control characters after part is case-sensitive per RFC, even though most trimming; mixed-script domain that fails |
| --- |
| providers ignore it) a confusable check |
| Password Do not trim and do not normalize — you would Length only, client-side. Strength, silently change the secret. Pass the exact code dictionary and breach checks belong to points through the Auth0 policy so the rules live in one place Name / Trim; collapse internal whitespace; strip control and Anything containing < > & " ' should display zero-width characters; NFKC; cap at a sane length be escaped at render, not stripped at fields input — stripping mangles legitimate names like O'Brien Verification Trim; strip spaces and dashes; digits only Wrong length; non-numeric after code stripping |

## RULES THAT APPLY EVERYWHERE

- Sanitize at the boundary, encode at the sink. One normalization pass on input; correct escaping wherever the value is rendered, logged, or put into a URL. Do not scatter ad-hoc replace() calls through components.

- Length caps on every field before anything else runs, so a pathological input cannot reach a regex.

- No user-controlled string reaches dangerouslySetInnerHTML , a WebView, or a deep-link URL without explicit encoding.

- Trim on blur, not on keystroke — mid-word trimming makes the field feel broken.

- Log nothing. No email addresses, no tokens, no sub claims in analytics or crash reports. Add the redaction rules on day 1.

## 6 Test strategy

"Tested to the highest standard" here means: the logic that can be tested fast is tested exhaustively, the integration seam is tested against a fake, and one thin end-to-end path proves the wiring. It does not mean chasing 100% line coverage through

the Auth0 SDK.

## LAYER 1 — UNIT (JEST)

- Every sanitization and validation function, including property-based tests with fast-check : normalizing twice equals normalizing once, output never contains control characters, output length never exceeds the cap.

- The error-mapping function: assert the full table of provider errors → user-facing messages, and assert that no output message distinguishes "unknown account" from "wrong password".

- The auth state machine: unauthenticated → pending verification → authenticated → expired → unauthenticated. Every transition, including the impossible ones.

## LAYER 2 — COMPONENT (REACT NATIVE TESTING LIBRARY)

- Render against the fake adapter. Query by accessible role and label, never by testID alone — it makes the a11y requirement structural instead of aspirational.

- Loading, disabled, error and success states; double-submit protection; browser-cancelled path.

- Snapshot tests are for structure, not behaviour. Keep them few.

## LAYER 3 — INTEGRATION

- Mock the native module and assert the adapter calls it with the right scopes, audience and screen_hint , and translates every response and error shape correctly.


- Credential-manager behaviour: stored on success, cleared on sign-out, cleared on refresh failure.

## GATES

- Coverage ≥ 90% on the auth and sanitization modules, ≥ 80% overall for the touched code. Gate in CI so it cannot drift.

- Zero new lint or type errors. No .only , no skipped tests merged.

## 7 Bonus: end-to-end

## READ THIS BEFORE ESTIMATING THE BONUS

Universal Login opens the system browser, not a view inside your app. Detox drives your app's view hierarchy and cannot reliably interact with ASWebAuthenticationSession or a Chrome Custom Tab. This is the single reason E2E on Auth0 flows takes longer than people expect, and it is why it is a bonus rather than a commitment.

Recommended approach — Maestro. It drives the OS rather than the app, so it can type into the hosted login page. One flow: launch clean, tap sign up, fill the hosted form with a generated address, accept consent, land on the verification screen. Run it against a dedicated E2E tenant or connection with a disposable user, seeded and torn down by the flow.

Fallback — Detox with a stubbed adapter. Build a test flavour where the AuthService port resolves to a scripted fake. You lose coverage of the Auth0 hop and keep coverage of every screen, guard and state transition after it. This is a legitimate result for a four-day sprint: say so plainly in the demo rather than presenting it as full end-to-end.

- Never run E2E against the production tenant, and never with a real investor's credentials.

- Test users come from environment variables, not the repository.

- If the browser step proves flaky, quarantine it out of the merge gate immediately. A flaky auth test that everyone learns to re-run is worse than no test.

## 8 Definition of done

- Sign-up, email verification, sign-in, password reset and sign-out all work on a physical iOS device and a physical Android device, from a clean install, in a release-configuration build.

- Credentials are in Keychain / Keystore; no token, email address or user identifier appears in any log, analytics event or crash report.

- Every provider call goes through AuthService ; no screen or component imports the Auth0 SDK directly.

- Failed sign-in reveals nothing about account existence, password proximity, or attempt count.

- Sanitization module is pure, isolated, and covered by unit plus property-based tests.

- Coverage gates pass in CI; the pipeline is green on a fresh clone.

- Accessibility: every field labelled, errors announced, layout holds at 200% text scale.

- README documents tenant setup, environment variables, and how to run each test layer.

- Carry-over list written and reviewed: consent ledger, phone verification, MFA, biometrics, lockout handling.

## 9 Risks


| RISK | MITIGATION |   |   |
| --- | --- | --- | --- |
| D06 reopens and the provider | The | AuthService | port is the whole mitigation. Keep it honest — review |
| changes | on day 4 that nothing bypassed it. |   |   |
| Native configuration eats day 1 | Day 0 checklist. If the Expo question is unresolved on Monday morning, |   |   |
| (schemes, pods, Gradle placeholders, | the sprint is already short. |   |   |
| Expo dev build) |   |   |   |
| E2E browser automation does not | Time-boxed, with the stubbed-adapter fallback pre-agreed as an |   |   |
| stabilize | acceptable outcome. |   |   |
| Consent requirements arrive mid- | Shipping the gate and the callback, not the ledger. Agreed in sprint |   |   |
| sprint | planning, restated at review. |   |   |
| Four days is tight for one developer | Cut in this order: E2E first, then password reset UI polish, then resend- |   |   |
|   | throttling refinement. Never cut the sanitization tests or the credential- |   |   |
|   | storage work. |   |   |

Sprint AUTH-01 · Epic INV-E02 — Registration & Account Access · Prepared for TNGBLE Investor App, scope per product backlog of 22 August 2026.
