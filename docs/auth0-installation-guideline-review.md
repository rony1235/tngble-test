# Auth0 Installation Guideline Review

**Primary source of truth:** `.github/doc/tngble-auth0-sprint.md` (Sprint AUTH-01)  
**Reviewed guideline:** `.github/doc/implement installation guideline.md`  
**Codebase validated against:** TNGBLE Investor App as of this review (Expo SDK 57, Expo Router, `pnpm`)

> This document is analysis and planning only. It does **not** authorize package installs, source changes, or replacement of the existing installation guideline.

---

## 1. Project Requirements Summary

### 1.1 Sprint goal

A new user can create an account with email + password, verify email, sign in, reset a forgotten password, and sign out through **Auth0**, on **iOS and Android**, with credentials in the **platform keystore**, and with every input validated/normalized before it leaves the device. The provider must sit behind an **`AuthService` port** so swapping providers costs a day, not a sprint (decision D06 is still open).

### 1.2 In scope (AUTH-01)

| Story | Requirement |
| --- | --- |
| INV-US007 | Create account with email and password |
| INV-US009 | Verify email (time-limited code or link); gate unverified users |
| INV-US011 | Sign in with approved credentials |
| INV-US012 | Safe failure messaging (no account-existence / proximity / attempt leaks) |
| INV-US013 | Password reset through verified hosted channel |
| INV-US014 | Sign out clears session so another person cannot use it |
| INV-US023 | Terms/privacy consent — **hook only** (local version + timestamp + `onConsentAccepted`) |

### 1.3 Explicitly out of scope

- **INV-US010** Social signup (Google/Apple) — Out / Could / TBD  
- **INV-US008** Phone verification — next sprint  
- **INV-US015–022** MFA, authenticator, biometrics, step-up, session list, lockout — Epic INV-E03  
- Full consent ledger (INV-US025) — carry-over; gate + callback only  

### 1.4 Architecture decisions (non-negotiable)

1. **Universal Login** via `authorize()` (ASWebAuthenticationSession / Chrome Custom Tab).  
2. **Do not use** Resource Owner Password Grant.  
3. **Do not** build custom password forms that call the Authentication API directly.  
4. Native app may own a **small pre-auth surface** (email capture, consent gate, marketing copy).  
5. All provider calls go through **`AuthService`**: `signUp`, `signIn`, `signOut`, `requestPasswordReset`, `restoreSession`, `getAccessToken`.  
6. Auth0 is one adapter; tests run against an **in-memory fake adapter**.  
7. Wrap app in **`Auth0Provider`**; request scopes `openid profile email offline_access`.  
8. Configure an **API audience** so the app receives a usable access token (not only an ID token).  
9. Credentials via Auth0 **credentials manager** (iOS Keychain / Android EncryptedSharedPreferences). **Never** AsyncStorage / Redux persist / log lines for tokens.  
10. Refresh-token **rotation** on; refresh failure → clean local sign-out.  
11. Sign-out: `clearSession` + wipe local credentials and cached user state.  
12. Email verification: read `email_verified` from ID token; pending screen + resend with client-side throttle; route guard blocks the app.  
13. Pure **sanitization/validation** module (email, password length-only, name, verification code) + property-based tests (`fast-check`).  
14. Safe **error taxonomy** + logging **redaction** from day 1.  
15. Expo: config plugin + **development build** — flow **cannot run in Expo Go**.  
16. Definition of done includes physical iOS + Android, release-configuration build, README, carry-over list, a11y, CI coverage gates.

### 1.5 Current project architecture (actual codebase)

| Area | Current state |
| --- | --- |
| Framework | **Expo SDK ~57**, React Native 0.86.3, React 19.2.3 |
| Routing | **Expo Router** (`main`: `expo-router/entry`), file routes under `app/` |
| Auth UI | `app/(auth)/login.tsx` — **custom email + password form**; Google / Apple / Face ID sheets (mock) |
| Register / forgot | Placeholders (“later release”) |
| Session | `src/auth/session.ts` via **`expo-secure-store`**; mock login in `loginRequest.ts` |
| Auth context | `src/auth/AuthProvider.tsx` — `signIn(credentials)` / `signOut`; binary `isAuthenticated` |
| Guards | Expo Router `Stack.Protected` on `(app)` vs `(auth)` — **no** `pendingVerification` state |
| Scheme / IDs | `scheme: "tngble"`; iOS/Android id `com.tngble.app` |
| Native projects | **No checked-in `android/` or `ios/`** (managed + prebuild / EAS) |
| Dev client | `expo-dev-client` already installed; EAS `development` profile exists |
| Env | `.env.example`: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_USE_MOCK_AUTH` — **no Auth0 vars** |
| Package manager | **pnpm** (not npm/yarn) |
| Tests | Colocated `*.test.ts(x)` + Jest/jest-expo; Maestro `e2e/login.yaml` assumes password form |
| Lint / CI auth gates | **No ESLint config**; no typecheck/lint/coverage CI workflow for AUTH-01 (only Firebase Test Lab workflow) |
| Auth0 SDK | **Not installed** |

---

## 2. Existing Installation Guideline Analysis

`.github/doc/implement installation guideline.md` is a comprehensive implementation brief that correctly captures many AUTH-01 *product and security* requirements:

- Universal Login + ban on Password Grant  
- `AuthService` port + Auth0 + Fake adapters  
- Consent gate hook (not full ledger)  
- Email verification pending gate  
- Sanitization rules aligned with sprint §5  
- Secure credential storage principles  
- Session restore / sign-out / password reset / error taxonomy / redaction  
- Unit / component / integration layers + Maestro bonus  
- Coverage gates and carry-over documentation  

What it is **trying** to implement: a **greenfield clean-architecture tree** (`domain` / `infrastructure` / `application` / `presentation`) plus **React Navigation stacks** (`AuthStack` / `AppStack` / `RootNavigator`), with new UI primitives and a top-level `tests/` layout.

What it does **not** do well: map those requirements onto **this repository’s existing Expo Router app, mock auth path, designed login UI, env conventions, package manager, or CI reality**. Several steps are correct for AUTH-01 in the abstract but **incorrect or unsafe if followed literally** in `tngble-app`.

---

## 3. Issues Identified

### Issue 1 — Greenfield folder layout conflicts with the real app

- **Location/step:** §2 Required Architecture (`src/domain`, `src/infrastructure`, `src/application`, `src/presentation`, `src/app/App.tsx`, React Navigation files).  
- **Why incorrect/incomplete:** The app already uses Expo Router (`app/`), `src/auth/`, `src/components/`, `src/theme/`. There is no `src/app/App.tsx` entry; entry is `expo-router/entry`.  
- **Related requirement:** Sprint requires an `AuthService` port and adapters — **not** a mandatory folder taxonomy.  
- **Impact:** Blind adoption duplicates providers, screens, and navigation; high rewrite risk; breaks existing tests/testIDs.  
- **Required correction:** Keep Expo Router + evolve `src/auth/` (or introduce ports under `src/auth/` / `src/domain/auth/` **incrementally**). Do not invent a parallel app shell.

### Issue 2 — Assumes React Navigation stacks instead of Expo Router

- **Location/step:** §2 navigation tree; §10 Navigation / Guards (`AuthStack`, `AppStack`, `guards.tsx`, `linking.ts`).  
- **Why incorrect:** Root auth gating already uses `Stack.Protected` in `app/_layout.tsx`. Linking is handled by Expo Router + `scheme: "tngble"`.  
- **Related requirement:** Auth-state-driven routing including `pendingVerification`.  
- **Impact:** Replacing Expo Router would be out of sprint scope and regress onboarding/login/home.  
- **Required correction:** Extend Expo Router groups/guards for `restoring` → `unauthenticated` → `pendingVerification` → `authenticated`. Keep `testID`s Maestro relies on.

### Issue 3 — Ignores conflict between current password UI and Universal Login

- **Location/step:** §11 Pre-auth; §30 Step 10 (SignUp/SignIn screens); overall “do not collect passwords” note is weak relative to existing UI.  
- **Why incomplete:** `app/(auth)/login.tsx` collects **password** and calls `signIn({ email, password })`. Sprint forbids Password Grant and custom Authentication API password forms. Universal Login means the hosted page owns the password.  
- **Related requirement:** §3 Universal Login; “DO NOT USE THE PASSWORD GRANT”.  
- **Impact:** Following the guideline without redesigning login will either (a) keep an illegal password path or (b) leave dead password fields that confuse users and E2E.  
- **Required correction:** Plan an explicit UI migration: pre-auth (email + consent) → `authorize()`; remove or demote in-app password fields; update Maestro accordingly. Escalate to product/security if design insists on native password fields.

### Issue 4 — Social / Face ID UI exists; sprint marks social out of scope

- **Location/step:** Guideline §28 correctly lists social as NOT implemented; but never addresses existing Google/Apple/Face ID UI (`SocialAuthButton`, `AuthConfirmationSheet`).  
- **Why incomplete:** Login currently offers mock social and Face ID paths that call the same credential `signIn`. Sprint: INV-US010 Out; biometrics in INV-E03.  
- **Related requirement:** Scope table; carry-over list.  
- **Impact:** Implementers may wire social into Auth0 early, or leave mock social that bypasses Universal Login / AuthService rules.  
- **Required correction:** Explicit AUTH-01 policy: disable, hide, or leave non-functional with clear messaging; do **not** implement Google/Apple Auth0 connections in this sprint unless product re-opens INV-US010.

### Issue 5 — Environment variable names incompatible with Expo

- **Location/step:** §6 Auth0 Configuration (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`).  
- **Why incorrect for this project:** Client-visible Expo config must use `EXPO_PUBLIC_*` (or `app.config` `extra` + `expo-constants`). Bare `AUTH0_*` is not available in the JS bundle the way the guideline implies.  
- **Related requirement:** Secrets from build-time config, never committed.  
- **Impact:** Misconfigured builds; empty domain/clientId at runtime.  
- **Required correction:** Use e.g. `EXPO_PUBLIC_AUTH0_DOMAIN`, `EXPO_PUBLIC_AUTH0_CLIENT_ID`, `EXPO_PUBLIC_AUTH0_AUDIENCE` (plus document which values are public vs tenant-only). Update `.env.example`. Keep real secrets out of git; client IDs/domain are public identifiers but still not hard-coded.

### Issue 6 — Missing concrete Expo Auth0 plugin / callback URI instructions

- **Location/step:** §7 Expo Compatibility (high-level only).  
- **Why incomplete:** Official Auth0 Expo setup requires the `react-native-auth0` config plugin with `domain` + lowercase `customScheme`, development builds, and callback URLs of the form:

  `{scheme}://{domain}/ios/{bundleId}/callback`  
  `{scheme}://{domain}/android/{package}/callback`

  For this app that implies scheme **`tngble`** (or a dedicated auth scheme), domain from tenant, ids **`com.tngble.app`**. Same scheme must be passed to `authorize` / `clearSession`. Logout URLs must also be registered.  
- **Related requirement:** Day 1 tenant + Expo config plugin + physical device smoke.  
- **Impact:** Day-1 native config failure (classic sprint risk).  
- **Required correction:** Add a project-specific Auth0 dashboard checklist and `app.json` plugin snippet; require `eas build` / `expo run:*` dev client; state Expo Go is unsupported.

### Issue 7 — RN CLI / pods / manifestPlaceholders presented as peer path

- **Location/step:** §7; echoes sprint Day 1 wording.  
- **Why mismatched:** This repo has **no** committed native projects; Android/iOS are generated via prebuild/EAS. Manually editing Gradle placeholders/Pods is the wrong primary path.  
- **Related requirement:** Expo needs config plugin + dev build.  
- **Impact:** Developers may `prebuild` and hand-edit natives that EAS regenerates, causing drift.  
- **Required correction:** Primary path = Expo config plugin + EAS/dev client. Mention native placeholders only as “what the plugin generates,” not as manual install steps.

### Issue 8 — Package manager and install command omitted / wrong by default

- **Location/step:** §30 Step 2 (“Install/configure required dependencies”).  
- **Why incomplete:** Project uses **`pnpm`**. Correct approach is `pnpm dlx expo install react-native-auth0` (or equivalent) to align with Expo 57. Sprint + Expo require **react-native-auth0 v5.x** (Expo 53+, RN ≥ 0.78, React 19).  
- **Related requirement:** Install `react-native-auth0`.  
- **Impact:** Wrong major version or npm lockfile pollution.  
- **Required correction:** Pin to Auth0 RN SDK v5 via Expo-compatible install; document `pnpm`; forbid ad-hoc major downgrades.

### Issue 9 — Custom CredentialsManager / SecureStorage vs Auth0 credentials manager vs existing SecureStore session

- **Location/step:** §2 `infrastructure/storage/CredentialsManager.ts`, `SecureStorage.ts`; §15 Secure Credential Storage.  
- **Why incomplete/conflicting:** Sprint says use the **built-in Auth0 credentials manager**. The app already stores a JSON `Session` (including `accessToken`) in `expo-secure-store`. A second parallel token store invites bugs and DoD violations.  
- **Related requirement:** Keychain/Keystore via Auth0 manager; no token in logs; `getAccessToken` on port.  
- **Impact:** Duplicate sources of truth; refresh/sign-out races; possible token copies outside Auth0 manager.  
- **Required correction:** Auth0 credentials manager owns tokens. Migrate `session.ts` / `api/client.ts` to `AuthService.getAccessToken()`. Local store may keep non-secret UI/consent metadata only — never a second copy of refresh tokens.

### Issue 10 — Proposes recreating UI primitives and theme already present

- **Location/step:** §2 `presentation/components/Button.tsx`, `TextField.tsx`, `theme/*`.  
- **Why unnecessary:** `src/components/Button.tsx`, `TextField.tsx`, `src/theme/tokens.ts` already exist; README forbids parallel kits.  
- **Related requirement:** Preserve existing design system.  
- **Impact:** Design drift; review red flags.  
- **Required correction:** Reuse/extend existing components and tokens.

### Issue 11 — Screen inventory does not match routes or product flow

- **Location/step:** §2 screens (`PreAuthScreen`, `SignUpScreen`, `SignInScreen`, …); §10–§18.  
- **Why incomplete:** Existing routes: onboarding → login / register / forgot-password → `(app)`. Register and forgot are stubs. Guideline names do not map 1:1.  
- **Related requirement:** Pre-auth + hosted signup/signin + verification pending + password reset.  
- **Impact:** Duplicate screens or orphaned routes.  
- **Required correction:** Map sprint screens onto Expo Router files (e.g. evolve `login.tsx` / `register.tsx`, add `verify-pending.tsx`), keep onboarding.

### Issue 12 — Auth state model too weak in current app; guideline state machine not integrated

- **Location/step:** §8 Auth State Machine vs current `AuthProvider`.  
- **Why incomplete:** Guideline correctly requires `unauthenticated | pendingVerification | authenticated | expired | loading/restoring`, but does not specify how to replace binary `isAuthenticated` in `app/_layout.tsx`.  
- **Related requirement:** Day 2–3 session lifecycle + email gate.  
- **Impact:** Unverified users could reach `(app)` if only `isAuthenticated` is checked.  
- **Required correction:** Extend auth context + `Stack.Protected` (or equivalent) for verification and restore/loading.

### Issue 13 — Logging/redaction and CI lint assumed present; they are not

- **Location/step:** §20 Logging; §26 CI Requirements.  
- **Why incomplete:** No crash reporter, analytics redaction hooks, ESLint, or coverage gate CI exist yet. Sprint Day 1 requires redaction rules and CI typecheck/lint/unit/coverage.  
- **Related requirement:** §8 DoD; Day 1 CI job.  
- **Impact:** Definition of done unmet even if Auth0 “works.”  
- **Required correction:** Add lint tooling + CI workflow + redaction module as first-class plan items (not afterthoughts).

### Issue 14 — Test layout and Maestro path diverge from repo conventions

- **Location/step:** §2 `tests/unit|component|integration|e2e/maestro`; §25 `e2e/maestro/auth-happy-path.yaml`.  
- **Why mismatched:** Tests are colocated (`src/**/*.test.tsx`); Maestro already lives at `e2e/login.yaml` and types into password fields.  
- **Related requirement:** Layered tests + bonus Maestro; Detox stub fallback.  
- **Impact:** Parallel test trees; broken E2E after Universal Login.  
- **Required correction:** Prefer colocated unit/component tests; extend or replace `e2e/login.yaml`; Detox is optional fallback only (not installed today).

### Issue 15 — Missing Day 0 prerequisites as blocking checklist

- **Location/step:** Largely absent (sprint §4 Day 0).  
- **Why incomplete:** Tenant admin access, dedicated E2E tenant/connection, password policy, session lifetimes, email template ownership, confirmation of Expo + bundle IDs.  
- **Related requirement:** Day 0 blocks Day 1.  
- **Impact:** Sprint slips on tenant/email template ownership.  
- **Required correction:** Put Day 0 checklist first in any corrected guideline.

### Issue 16 — Auth0Provider / audience / refresh rotation under-specified

- **Location/step:** Scattered across §5–§6; incomplete operational detail.  
- **Why incomplete:** Sprint requires wrapping `Auth0Provider`, audience for API access tokens, refresh token rotation enabled in tenant. Guideline mentions scopes/audience but not the full tenant toggles or provider placement relative to existing `AuthProvider`.  
- **Related requirement:** Day 1 foundation.  
- **Impact:** ID-token-only sessions; refresh bugs.  
- **Required correction:** Document tenant toggles + provider nesting (`Auth0Provider` outside app `AuthProvider` that uses the port).

### Issue 17 — Password / verification-code sanitization vs Universal Login reality

- **Location/step:** §13 Input Sanitization (password + verification code).  
- **Why nuanced:** Sprint mandates these pure modules. With Universal Login, **passwords may never enter app JS** (good). Verification may be **link-based** in email templates, so in-app verification-code fields may be unused in AUTH-01.  
- **Related requirement:** §5 sanitization; INV-US009 code **or** link.  
- **Impact:** Wasted UI, or false sense that password sanitization runs on Auth0-hosted fields (it cannot).  
- **Required correction:** Still implement pure modules + tests as required; apply email (and name/consent) sanitization on pre-auth boundaries; document that hosted-page passwords are Auth0’s responsibility; only add in-app code entry if product chooses code verification.

### Issue 18 — `loginRequest` / backend mock path conflicts with Auth0 adapter

- **Location/step:** Guideline never names `src/auth/loginRequest.ts` or `EXPO_PUBLIC_USE_MOCK_AUTH`.  
- **Why incomplete:** Current “backend login” path and README (“talks only to **our** backend”) conflict with Auth0 as identity provider.  
- **Related requirement:** Auth0 adapter behind `AuthService`; fake adapter for tests.  
- **Impact:** Two auth backends in production builds.  
- **Required correction:** Replace mock/API password login with Auth0 adapter; keep FakeAuthAdapter for Jest; retire or sharply scope `EXPO_PUBLIC_USE_MOCK_AUTH`.

### Issue 19 — Documentation sprawl beyond sprint DoD

- **Location/step:** §28 (`docs/architecture.md`, `auth.md`, `consent.md`, `testing.md`, README).  
- **Why partially unnecessary:** Sprint DoD asks for a **README section** (tenant setup, env vars, test layers, deliberate non-goals). Four new architecture docs are optional polish.  
- **Related requirement:** Day 4 README.  
- **Impact:** Time stolen from sanitization/credentials (sprint cut order warns against cutting those).  
- **Required correction:** Prioritize README (+ short auth setup doc if needed); defer encyclopedia docs.

### Issue 20 — Consent modeled as full provider stack

- **Location/step:** §2 `ConsentProvider.tsx`; §12 Consent.  
- **Why overbuilt risk:** Sprint ships gate + local version/timestamp + callback — not a ledger.  
- **Related requirement:** INV-US023 hook.  
- **Impact:** Fake “done” for consent epic.  
- **Required correction:** Minimal gate on sign-up path; document carry-over explicitly for sprint review.

### Issue 21 — Guideline path / naming confusion

- **Location/step:** File lives at `.github/doc/implement installation guideline.md` (spaces, informal name); user references often say `docs/…`.  
- **Why problematic:** Easy to edit the wrong file or assume `docs/` is authoritative.  
- **Related requirement:** Process clarity.  
- **Impact:** Divergent instructions.  
- **Required correction:** After approval, publish a corrected guideline under `docs/` with a stable name (e.g. `docs/auth0-installation-guideline.md`) and leave or deprecate the ChatGPT draft.

### Issue 22 — No guidance on release vs debug callback schemes

- **Location/step:** Missing (sprint Day 4 security sweep).  
- **Why incomplete:** Sprint warns about debug-only schemes that work locally and fail signed builds.  
- **Related requirement:** §8 DoD release-configuration builds on both platforms.  
- **Impact:** Day-5 surprise.  
- **Required correction:** Same scheme/plugin config for debug and release; verify on release builds.

### Issue 23 — API client coupling not addressed

- **Location/step:** Absent.  
- **Why incomplete:** `src/api/client.ts` reads tokens via `getAccessToken()` from SecureStore session.  
- **Related requirement:** `AuthService.getAccessToken`.  
- **Impact:** Authenticated API calls break after Auth0 migration.  
- **Required correction:** Point HTTP client at AuthService (or a thin token accessor used by both).

---

## 4. Missing Requirements

Requirements from `tngble-auth0-sprint.md` that the installation guideline **omits or under-covers**:

1. **Day 0 blocking checklist** (tenant admin, E2E tenant, password policy, session lifetimes, email template owners, Expo vs bare confirmation).  
2. **Project-specific callback/logout URL values** for `tngble` + `com.tngble.app`.  
3. **Explicit migration plan** from existing mock password auth and Maestro password flow.  
4. **Policy for existing Google / Apple / Face ID UI** under social-out-of-scope.  
5. **Expo `EXPO_PUBLIC_*` env naming** and EAS profile env wiring (`development` / `preview` / `production`).  
6. **`Auth0Provider` placement** relative to BootSplash / existing providers.  
7. **Tenant settings:** Database connection, refresh token rotation, API/audience application grant, hosted verification/reset templates.  
8. **Cancellation path** as first-class UX (guideline mentions it; missing concrete mapping to current login loading/sheet states).  
9. **Screenshot protection consideration** for pending-verification (Day 4 security sweep).  
10. **Deep-link / callback hijacking review** steps.  
11. **Physical device + release-configuration** verification (guideline says run on Android/iOS but not release builds / clean install DoD).  
12. **pnpm + `expo install` + Auth0 v5** version constraint for Expo 57.  
13. **CI reality:** introduce lint + coverage workflows (guideline assumes they exist).  
14. **Cut order** if time-boxed (E2E → password-reset polish → resend throttle); never cut sanitization tests or credential storage.  
15. **D06 honesty review** on day 4 (nothing bypasses `AuthService`).  
16. **README carry-over list** called out for sprint review (consent ledger, phone, MFA, biometrics, lockout).  
17. **Interaction with onboarding** (`app/(auth)/onboarding.tsx`) — still the unauthenticated entry after Index redirect.

---

## 5. Conflicts

| Topic | Installation guideline | Sprint / codebase truth | Resolution |
| --- | --- | --- | --- |
| Navigation | React Navigation stacks under `src/app/navigation` | Expo Router `app/` + `Stack.Protected` | Prefer Expo Router |
| Folder architecture | Full clean-architecture rewrite | Existing `src/auth`, components, theme | Incremental ports/adapters; no parallel app |
| Password UX | Soft “don’t collect passwords” | Sprint forbids Password Grant; **UI currently collects passwords** | Redesign to Universal Login; escalate if design conflicts |
| Social auth | Documented as not implemented | Sprint Out; **UI already shows social/Face ID** | Disable/hide for AUTH-01 |
| Env vars | `AUTH0_*` | Expo needs `EXPO_PUBLIC_*` / config extra | Rename for Expo |
| Native setup | Pods / Gradle placeholders as first-class | Managed Expo, no committed natives | Config plugin + prebuild/EAS |
| Credential storage | Custom CredentialsManager + SecureStorage | Auth0 credentials manager; existing SecureStore session | Single token owner: Auth0 manager |
| Package installs | Unspecified tool | `pnpm` + Expo 57 → Auth0 RN **v5** | Specify exact install path |
| Tests layout | Root `tests/` + `e2e/maestro/` | Colocated Jest + `e2e/login.yaml` | Align to repo |
| Backend story | Auth0-centric | README/mock API login | Replace mock password API with Auth0 port |
| Consent | Provider-heavy structure | Hook only | Minimal gate + callback |
| Lint in CI | Required | Not present | Add tooling as plan phase |

**Direct product conflict to escalate:** If product requires the current pixel-perfect native email/password fields to submit passwords from the app, that **conflicts** with sprint §3. That must be a security-owner decision — not an implementation detail.

---

## 6. Recommended Changes

### 6.1 Correct steps to keep (from the guideline)

- Universal Login + no Password Grant  
- `AuthService` port + Auth0Adapter + FakeAuthAdapter  
- Scopes `openid profile email offline_access` + audience  
- Email verification gate from `email_verified`  
- Consent gate hook (local version + timestamp + callback)  
- Sanitization pure module + `fast-check`  
- Safe error taxonomy + redaction  
- Session restore, refresh failure → logout, `clearSession` sign-out  
- Hosted password reset  
- Layered tests + coverage targets  
- Maestro as bonus; stubbed-adapter fallback acceptable  
- Carry-over documentation  

### 6.2 Incorrect / rewrite

- Greenfield `presentation/app/navigation` React Navigation architecture  
- Recreating Button/TextField/theme  
- Bare `AUTH0_*` env names without Expo public prefix  
- Manual RN CLI pod/Gradle steps as primary instructions  
- Parallel SecureStore token cache alongside Auth0 credentials manager  

### 6.3 Missing / add

- Day 0 checklist  
- Expo plugin + exact callback/logout URLs for this app  
- Migration from `loginRequest` / mock auth / Maestro password flow  
- Social/Face ID AUTH-01 handling  
- Auth state machine wired into Expo Router guards  
- Lint + CI introduction  
- `api/client` token integration  
- Release-build verification and scheme consistency  
- pnpm / Auth0 v5 / `expo-dev-client` rebuild requirement  

### 6.4 Unnecessary / defer

- Large multi-doc architecture set beyond README  
- Detox installation (unless Maestro bonus fails and team chooses stubbed Detox)  
- In-app verification-code UI unless product chooses codes over links  
- Full ConsentProvider/ledger  

---

## 7. Implementation Plan

Plan is driven by **sprint requirements + codebase constraints**. No application code in this phase.

### Phase 0 — Prerequisites (Day 0 / blockers)

- Confirm Auth0 tenant admin access (dev + dedicated E2E tenant or connection).  
- Confirm password policy, session lifetimes, refresh rotation policy.  
- Assign owners for verification + reset email templates.  
- Confirm bundle id / application id: `com.tngble.app`, scheme `tngble`.  
- Confirm product stance on **native password fields vs Universal Login** (escalate if conflict).  
- Confirm AUTH-01 treatment of Google/Apple/Face ID UI (hide vs disable).  
- Confirm whether email verification is **link** or **code** for MVP templates.

### Phase 1 — Project preparation

- Add Auth0-related entries to `.env.example` using `EXPO_PUBLIC_AUTH0_DOMAIN`, `EXPO_PUBLIC_AUTH0_CLIENT_ID`, `EXPO_PUBLIC_AUTH0_AUDIENCE`.  
- Plan EAS env injection per build profile.  
- Decide module layout **incrementally**, e.g.:

  ```text
  src/auth/
    AuthService.ts          # port
    AuthStateMachine.ts
    errorMapping.ts
    sanitization/           # pure module
    consent/                # gate hook
  src/auth/adapters/
    Auth0Adapter.ts
    FakeAuthAdapter.ts
  ```

  Keep screens in `app/(auth)/*`; reuse `src/components` + `src/theme`.  
- Introduce ESLint (or project-standard lint) + scripts so CI can gate.  
- Document that Expo Go is unsupported; Auth0 requires a **new development build** after the config plugin is added.

### Phase 2 — Auth0 tenant & Expo configuration

- Create **Native** Auth0 application.  
- Enable Database connection; enable **refresh token rotation**.  
- Create API / audience; authorize the native app.  
- Allowed Callback URLs / Logout URLs / Web Origins per Auth0 Expo docs using `tngble` + `com.tngble.app` + tenant domain.  
- Add `react-native-auth0` via `pnpm` + `expo install` (**v5** for Expo 57).  
- Register Expo config plugin (`domain`, lowercase `customScheme` — align with `tngble` or document a dedicated scheme).  
- Produce iOS + Android **development builds**; smoke `authorize()` on physical devices (sprint Day 1 done-when).  
- Do **not** commit secrets; add log/crash redaction hooks before tokens exist.

### Phase 3 — Domain seam & adapters

- Define `AuthService` port with sprint methods.  
- Implement `Auth0Adapter` using Universal Login:
  - `signUp` → `authorize({ screen_hint: 'signup', ... })`
  - `signIn` → `authorize(...)` without signup hint
  - `signOut` → `clearSession` + credential wipe
  - `requestPasswordReset` → hosted reset flow
  - `restoreSession` / `getAccessToken` via credentials manager  
- Implement deterministic `FakeAuthAdapter` for tests.  
- Map ID token claims → user model including `email_verified`.  
- Nest `Auth0Provider` + app auth context that **only** talks to the port.  
- Remove direct Auth0 imports from screens/components.  
- Retire password `loginRequest` path from the authenticated product flow.

### Phase 4 — Sanitization, errors, consent hook

- Pure sanitization/validation module per sprint §5.  
- Apply at pre-auth boundaries (trim on blur, length caps first).  
- Error mapper → safe taxonomy (network, cancelled, rateLimited, blocked, generic, …) with INV-US012 guarantees.  
- Consent gate: required checkbox/control, store `documentVersion` + `acceptedAt` locally, expose `onConsentAccepted`; block signup until accepted.  
- Logger redaction: tokens, email, `sub`, passwords, codes.

### Phase 5 — Auth state, session lifecycle, navigation guards

- Implement pure auth state machine + unit tests.  
- Cold start: restoring → restoreSession → authenticated / pendingVerification / unauthenticated.  
- Refresh failure → clean logout.  
- Extend Expo Router protection so unverified users only reach verify-pending.  
- Wire BootSplash hide to end of restore (preserve current UX).  
- Update `api/client.ts` to obtain access tokens via AuthService.

### Phase 6 — Screens & flows (evolve existing UI)

- **Onboarding:** keep; entry to login/register.  
- **Register / pre-auth:** email + consent + CTA launching Universal Login signup.  
- **Login:** email (optional login_hint) + CTA launching Universal Login; remove in-app password submission; handle cancel → clean form.  
- **Verify pending:** resend + throttle; no app access.  
- **Forgot password:** hosted reset; no account-existence leak.  
- **Home / app:** sign-out control that clears Auth0 + local state.  
- **Social/Face ID:** per Phase 0 decision (likely hide/disable for AUTH-01).  
- Preserve/repurpose `testID`s carefully; update Maestro expectations.

### Phase 7 — Security & configuration validation

- Confirm no tokens/PII in logs, analytics, or crash reports.  
- Review deep-link callback handling for hijacking risks.  
- Consider screenshot protection on verify-pending.  
- Verify debug and release builds share working schemes.  
- Confirm credentials only in Auth0 credentials manager / platform keystore.  
- Day-4 port honesty review: no `useAuth0` / SDK imports outside adapter.

### Phase 8 — Testing & CI

**Unit:** sanitization (+ fast-check), error mapping, state machine, consent gate logic.  
**Component:** RNTL against FakeAuthAdapter; prefer role/label queries; loading/disabled/cancel/consent/double-submit.  
**Integration:** mock native Auth0 module; assert scopes, audience, `screen_hint`, credential store/clear, refresh-failure logout.  
**Coverage gates:** ≥90% auth + sanitization modules; ≥80% touched code.  
**CI:** typecheck, lint, unit/component/integration, coverage; ban `.only` / skipped tests as per policy.  
**Bonus E2E:** Maestro against E2E tenant (time-boxed); else stubbed-adapter flow coverage. Never production tenant / real investor credentials.  
**Manual DoD:** clean install, release config, physical iOS + Android: signup, verify gate, signin, restore, signout, reset, cancel, network/rate-limit messaging.

### Phase 9 — Documentation & sprint review

- README: tenant setup, env vars, callback URLs, how to run each test layer, Expo dev-build notes.  
- Explicit **not done** list: social, phone, MFA, biometrics, lockout, full consent ledger.  
- Flag INV-US023 as hook-only in sprint review.  
- Record D06/port integrity outcome.

---

## 8. Validation / Testing Plan

| Layer | What to verify | Notes |
| --- | --- | --- |
| Unit | Sanitization idempotence, caps, control chars; error map never distinguishes unknown account vs bad password; state machine transitions | `fast-check`; FakeAuthAdapter |
| Component | Pre-auth/login/verify/forgot against fake; a11y labels; double-submit; cancel | Prefer `getByRole` / label |
| Integration | Adapter ↔ native module contracts; credential lifecycle | Mock native module only |
| Manual device | Universal Login round-trip both OS; restore after kill; logout clears browser session where supported | Physical devices; release builds |
| E2E (bonus) | Maestro happy path on E2E tenant | Quarantine if flaky |
| Security | Redaction; no AsyncStorage tokens; no Password Grant | Grep/review |
| CI | Fresh clone green: typecheck, lint, tests, coverage | Add missing jobs |

---

## 9. Final Recommended Installation Guideline Structure

Do **not** replace `.github/doc/implement installation guideline.md` until explicitly instructed. When rewritten, prefer something like `docs/auth0-installation-guideline.md` with this structure:

1. **Purpose & sources of truth** (sprint doc primary; this guideline secondary)  
2. **Day 0 prerequisites checklist**  
3. **Current repository baseline** (Expo Router, existing auth files, what will change vs stay)  
4. **Scope in / out** (including social UI policy for AUTH-01)  
5. **Architecture for *this* repo** (AuthService port locations; Expo Router guards; no greenfield navigation rewrite)  
6. **Dependencies** (`pnpm`, `expo install react-native-auth0@` v5, rebuild dev client)  
7. **Environment variables** (`EXPO_PUBLIC_*`, EAS profiles, `.env.example`)  
8. **Auth0 tenant configuration** (app type, URLs with `tngble`/`com.tngble.app`, DB connection, rotation, audience, templates)  
9. **Expo config plugin & deep linking**  
10. **Implementation order** (seam → adapter → sanitization → state/guards → screens → security → tests → CI → docs)  
11. **Screen mapping table** (existing route → AUTH-01 behavior)  
12. **Migration notes** (remove password grant path, SecureStore session → Auth0 manager, Maestro updates)  
13. **Testing strategy & coverage gates**  
14. **Definition of done checklist** (from sprint §8)  
15. **Carry-over / non-goals**  
16. **Appendix:** common failure modes (Expo Go, wrong scheme, missing audience, release scheme mismatch)

---

## 10. Verdict

| Aspect | Assessment |
| --- | --- |
| Alignment with AUTH-01 *intent* | **Strong** — Universal Login, port, verification gate, sanitization, tests |
| Compatibility with *this codebase* | **Weak** — assumes greenfield React Navigation clean architecture |
| Safe to follow literally | **No** |
| Next action | Use **§7 Implementation Plan** for the coding sprint; rewrite the installation guideline using **§9** before or alongside implementation |

**Only after this review is accepted should implementation (packages, Auth0 wiring, UI migration) begin as a separate task.**
