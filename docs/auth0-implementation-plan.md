# AUTH-01 Implementation Plan (Full Work)

**Status:** Planning only — no code, no package installs in this document’s approval phase.  
**Sources:** `.github/doc/tngble-auth0-sprint.md` · `.github/doc/implement installation guideline.md` · `docs/auth0-installation-guideline-review.md` · current `tngble-app` codebase  

**Scope decision (this plan):** Adopt the guideline **REQUIRED ARCHITECTURE** with project-specific adaptations, and treat **INV-US010 Social signup (Google / Apple) as IN SCOPE**.

---

## 0. Goals & non-goals

### In scope

| ID | Work |
| --- | --- |
| INV-US007 | Email/password account creation via Auth0 Universal Login |
| INV-US009 | Email verification gate (`email_verified`) + pending UI + resend throttle |
| INV-US010 | **Google and Apple signup/sign-in via Auth0** |
| INV-US011 | Sign in |
| INV-US012 | Safe error taxonomy |
| INV-US013 | Hosted password reset |
| INV-US014 | Sign out (Auth0 session + local wipe) |
| INV-US023 | Consent gate **hook only** (version + timestamp + callback) |
| Platform | iOS + Android, Expo development + release builds |
| Quality | Sanitization module, AuthService port, Fake adapter, unit/component/integration tests, CI gates, README |

### Out of scope (carry-over)

- INV-US008 Phone verification  
- INV-US015–022 MFA, authenticator, **Face ID / biometrics**, step-up, session list, lockout  
- Full consent ledger (INV-US025)  
- Resource Owner Password Grant / custom Authentication API password forms  
- Detox (unless Maestro bonus fails and team explicitly chooses stubbed Detox)

### Hard rules (unchanged)

- Universal Login via `authorize()` — **no Password Grant**  
- Screens/hooks never import Auth0 SDK — only `AuthService`  
- Tokens only in Auth0 credentials manager (Keychain / EncryptedSharedPreferences)  
- Expo Go unsupported — config plugin + dev/release builds  

---

## 1. Target architecture (guideline + required adaptations)

### 1.1 Decision

**Adopt** the guideline’s layered layout (`domain` / `infrastructure` / `application` / `presentation` / providers).  
**Adapt** navigation, entrypoint, theme, shared UI, credential storage, env naming, and social methods so the architecture fits **Expo Router + existing TNGBLE UI**.

### 1.2 Adapted tree (authoritative for implementation)

```text
app/                                 # KEEP — Expo Router (replaces guideline src/app/navigation/*)
├── _layout.tsx                      # Root: AppProviders + auth-state route protection
├── index.tsx                        # Redirect by auth state
├── (auth)/
│   ├── _layout.tsx
│   ├── onboarding.tsx
│   ├── login.tsx                    # Wires presentation SignIn / social CTAs
│   ├── register.tsx                 # Wires PreAuth / SignUp + consent
│   ├── forgot-password.tsx
│   └── verify-pending.tsx           # NEW route
└── (app)/
    ├── _layout.tsx
    └── index.tsx                    # Home — presentation HomeScreen

src/
├── app/                             # App shell (guideline) — NO App.tsx entry, NO React Navigation stacks
│   └── providers/
│       ├── AuthProvider.tsx         # Wraps Auth0Provider + application AuthContext
│       ├── ConsentProvider.tsx      # Thin; exposes onConsentAccepted hook surface
│       └── AppProviders.tsx         # Composition root used from app/_layout.tsx
│
├── domain/                          # Pure — no React / RN / Auth0 / navigation
│   ├── auth/
│   │   ├── AuthService.ts           # Port (includes social — see §1.4)
│   │   ├── AuthState.ts
│   │   ├── AuthStateMachine.ts
│   │   ├── AuthError.ts
│   │   ├── errorMapping.ts
│   │   ├── User.ts                  # includes emailVerified, optional identities/provider
│   │   ├── types.ts                 # AuthResult, SocialProvider, etc.
│   │   └── index.ts
│   ├── sanitization/                # As guideline §13
│   ├── consent/                     # Consent.ts, ConsentGate.ts, types
│   └── shared/                      # Result.ts, Brand.ts (optional)
│
├── infrastructure/
│   ├── auth/
│   │   ├── Auth0Adapter.ts          # Implements AuthService (email + Google + Apple)
│   │   ├── FakeAuthAdapter.ts
│   │   ├── Auth0Config.ts
│   │   ├── mappers.ts
│   │   ├── auth0Errors.ts
│   │   └── index.ts
│   ├── storage/
│   │   ├── CredentialsManager.ts    # ADAPT: façade over Auth0 credentials manager ONLY
│   │   ├── SecureStorage.ts         # Non-token secrets only (e.g. consent metadata)
│   │   ├── LocalConsentStore.ts
│   │   └── index.ts
│   ├── logging/
│   │   ├── logger.ts
│   │   ├── redaction.ts
│   │   └── index.ts
│   └── config/
│       ├── env.ts                   # EXPO_PUBLIC_AUTH0_* (+ API URL)
│       └── index.ts
│
├── application/
│   ├── auth/
│   │   ├── useSignUp.ts
│   │   ├── useSignIn.ts
│   │   ├── useSocialSignIn.ts       # NEW — Google / Apple
│   │   ├── useSignOut.ts
│   │   ├── usePasswordReset.ts
│   │   ├── useRestoreSession.ts
│   │   ├── useAuthState.ts
│   │   ├── useResendVerification.ts
│   │   ├── AuthContext.tsx
│   │   └── index.ts
│   └── consent/
│       ├── useConsentGate.ts
│       └── index.ts
│
├── presentation/
│   ├── screens/                     # Screen bodies; routes in app/ import these
│   │   ├── PreAuthScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── VerifyPendingScreen.tsx
│   │   └── HomeScreen.tsx
│   ├── components/                  # Auth-specific only
│   │   ├── ErrorBanner.tsx
│   │   ├── ConsentCheckbox.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── Screen.tsx               # Optional layout wrapper
│   │   └── SocialAuthButtons.tsx    # Composes existing SocialAuthButton
│   └── theme/
│       └── index.ts                 # RE-EXPORT src/theme/tokens — do not fork colors/spacing
│
├── components/                      # KEEP existing shared Button, TextField, SocialAuthButton, …
├── theme/                           # KEEP tokens.ts, layout.ts
├── api/                             # KEEP client; token via AuthService.getAccessToken
└── shared/                          # utils / constants / types as needed
    ├── utils/
    ├── constants/
    └── types/

tests/                               # Prefer this layout for AUTH modules (guideline)
├── unit/                            # domain sanitization, state machine, errorMapping, consent
├── component/                       # presentation screens vs FakeAuthAdapter
├── integration/                     # Auth0Adapter vs mocked native module
├── e2e/
│   └── maestro/                     # auth happy paths (email + social where automatable)
└── mocks/

e2e/                                 # KEEP existing Maestro entry; migrate/extend toward tests/e2e/maestro
└── login.yaml                       # Update or replace during Phase 10
```

### 1.3 What changed vs the raw guideline (and why)

| Guideline item | Change | Why |
| --- | --- | --- |
| `src/app/App.tsx` | **Omit** | Entry is `expo-router/entry` |
| `src/app/navigation/*` (AuthStack, AppStack, linking) | **Omit**; use `app/` routes + `Stack.Protected` | Project already Expo Router |
| Duplicate `Button` / `TextField` / theme files | **Reuse** `src/components` + `src/theme`; presentation theme re-exports | Avoid design-system fork |
| `CredentialsManager` as independent token DB | **Façade** over Auth0 credentials manager; no second token copy in SecureStore | Sprint DoD + review Issue 9 |
| Env `AUTH0_*` | **`EXPO_PUBLIC_AUTH0_DOMAIN` / `_CLIENT_ID` / `_AUDIENCE`** | Expo client bundle |
| Social out of docs | **IN SCOPE** — port methods + tenant connections + UI | User decision INV-US010 |
| Face ID sheet | **Out** — remove or disable mock path | INV-E03 biometrics |
| Mock `loginRequest` + password SecureStore session | **Retire** from product path | Universal Login + AuthService |
| React Navigation linking.ts | **Omit** | Expo scheme `tngble` + Auth0 plugin callbacks |

### 1.4 AuthService port (extended for social)

Guideline baseline plus INV-US010:

```ts
type SocialProvider = 'google' | 'apple';

interface AuthService {
  signUp(input?: { email?: string }): Promise<AuthResult>;
  signIn(input?: { email?: string }): Promise<AuthResult>;
  signInWithSocial(provider: SocialProvider): Promise<AuthResult>;
  signOut(): Promise<void>;
  requestPasswordReset(email?: string): Promise<void>;
  restoreSession(): Promise<AuthResult | null>;
  getAccessToken(): Promise<string | null>;
  requestEmailVerification(email?: string): Promise<void>;
  refreshUser(): Promise<AuthResult | null>;
}
```

**Adapter behavior (Auth0):**

| Method | Implementation sketch |
| --- | --- |
| `signUp` | `authorize({ screen_hint: 'signup', login_hint?, scope, audience, customScheme })` |
| `signIn` | `authorize({ login_hint?, scope, audience, customScheme })` |
| `signInWithSocial('google')` | `authorize({ connection: 'google-oauth2', … })` |
| `signInWithSocial('apple')` | `authorize({ connection: 'apple', … })` |
| `signOut` | `clearSession` + credentials clear + local auth/consent cache wipe as designed |
| `requestPasswordReset` | Hosted reset / Auth0 password-change ticket flow (no account-existence leak in UI) |
| `requestEmailVerification` | App → TNGBLE backend → Auth0 Management `jobs/verification-email` (never Management token on device) |
| `refreshUser` | Credentials manager force-refresh; re-map `email_verified` |
| `restoreSession` | Credentials manager + map user / `email_verified` |

Scopes: `openid profile email offline_access`. Audience from env.

### 1.5 Auth state machine (unchanged conceptually)

```text
loading/restoring
unauthenticated
pendingVerification
authenticated
expired
```

Transitions include social success paths (same as database login once tokens return). Unverified social users (rare but possible) still hit `pendingVerification`.

### 1.6 Route / guard mapping

```text
AppProviders
  └── app/_layout RootNavigator (Expo Router)
        ├── restoring/loading → BootSplash / null (current pattern)
        ├── unauthenticated → (auth)/*   onboarding, login, register, forgot-password
        ├── pendingVerification → (auth)/verify-pending only
        └── authenticated → (app)/*
```

Guards live as pure helpers under `src/application/auth` or `src/domain/auth` and are applied in `app/_layout.tsx` (not a separate React Navigation `guards.tsx` file unless thin re-exports help tests).

### 1.7 Layer import rules

| Layer | May import | Must not import |
| --- | --- | --- |
| `domain/` | other domain/shared pure modules | React, RN, Auth0, Expo Router, storage impls |
| `infrastructure/` | domain ports/types, RN/Auth0/Expo as needed | presentation screens |
| `application/` | domain + ports; React hooks/context | Auth0 SDK directly |
| `presentation/` | application hooks, domain types, `src/components`, theme | `Auth0Adapter`, `react-native-auth0` |
| `app/` routes | presentation screens + application hooks | Auth0 SDK |

---

## 2. Current → target migration map

| Existing | Target action |
| --- | --- |
| `src/auth/AuthProvider.tsx` | Replace/migrate into `src/app/providers` + `application/auth/AuthContext` |
| `src/auth/session.ts` | Remove token persistence; tokens via Auth0 credentials manager |
| `src/auth/loginRequest.ts` | Delete or quarantine behind Fake adapter only (no product password API) |
| `src/auth/types.ts` | Move/evolve into `domain/auth` |
| `src/auth/AuthConfirmationSheet` (mock social) | Replace: real social → `useSocialSignIn`; remove Face ID mock from AUTH-01 path |
| `src/components/SocialAuthButton` | Keep; wire via presentation `SocialAuthButtons` |
| `app/(auth)/login.tsx` | Become thin route → `SignInScreen` (Universal Login + Google/Apple; no password grant) |
| `app/(auth)/register.tsx` | → `SignUpScreen` / `PreAuthScreen` + consent |
| `app/(auth)/forgot-password.tsx` | → `ForgotPasswordScreen` hosted reset |
| `app/(app)/index.tsx` | → `HomeScreen` + sign out |
| `EXPO_PUBLIC_USE_MOCK_AUTH` | Retire for product; tests use `FakeAuthAdapter` |
| `e2e/login.yaml` | Rewrite for Universal Login / stubbed flows |
| Colocated `*.test.tsx` under old `src/auth` | Move or rewrite under `tests/` + new modules |

---

## 3. Phase-by-phase implementation plan

### Phase 0 — Prerequisites & decisions (blocking)

**Status:** **In progress (engineering draft complete)** — see [`docs/auth0-phase-0-prerequisites.md`](./auth0-phase-0-prerequisites.md)  
**Outcomes:** Day 0 checklist complete; social tenant plan approved.

**Completed by engineering (2026-09-19):**

- [x] App identifiers locked (`tngble` / `com.tngble.app`)  
- [x] Callback / logout URL **strategy + templates** documented  
- [x] Env var names locked (`EXPO_PUBLIC_AUTH0_*`)  
- [x] Product/security **proposed defaults** recorded (Universal Login, INV-US010 in, Face ID out, consent hook)  
- [x] Phase 0 prerequisites doc published  

**Still blocked on owners (required before Phase 2 device smoke; Phase 1 may proceed in parallel):**

- [ ] Auth0 tenant admin (dev + dedicated E2E tenant/connection)  
- [ ] Native app: register real callback/logout URLs with tenant domain  
- [ ] API audience name/identifier agreed  
- [ ] Password policy + session/refresh rotation settings agreed  
- [ ] Email verification template owner (link vs code)  
- [ ] Password reset template owner  
- [ ] **Google connection:** OAuth client IDs, enabled on Native app  
- [ ] **Apple connection:** Services ID, key, team ID; Apple capability on `com.tngble.app`  
- [ ] Confirm Universal Login branding; app uses `connection` param for social (hosted social optional)  
- [ ] Product/security **sign-off** on §4 decisions in the Phase 0 doc  
- [ ] Consent `documentVersion` string agreed  

**Exit:** Written checklist signed off in `docs/auth0-phase-0-prerequisites.md` §12.

---

### Phase 1 — Project preparation & scaffolding

**Status:** **Complete** (2026-09-19)  
**Outcomes:** Folder skeleton + env placeholders + lint readiness; no Auth0 runtime yet.

- [x] Create `src/domain`, `src/infrastructure`, `src/application`, `src/presentation`, `src/app/providers`, `src/shared`, `tests/{unit,component,integration,e2e/maestro,mocks}`  
- [x] Add `.env.example` keys `EXPO_PUBLIC_AUTH0_*`; deprecate `EXPO_PUBLIC_USE_MOCK_AUTH` in comments  
- [x] Add `src/infrastructure/config/env.ts` (+ unit test under `tests/unit`)  
- [x] Add ESLint (`eslint-config-expo`) + scripts `lint`, `test:coverage`  
- [x] Document Expo Go unsupported / dev-build requirement in README  
- [x] Barrel `index.ts` modules (domain logic remains Phase 3)  

**Exit:** Tree exists; typecheck/tests green on scaffold; legacy app untouched at runtime.

---

### Phase 2 — Auth0 tenant & Expo native configuration

**Status:** **Engineering complete** (2026-09-19); **device smoke pending** Phase 0 tenant credentials  
**Doc:** [`docs/auth0-phase-2-tenant-setup.md`](./auth0-phase-2-tenant-setup.md)

**Outcomes:** Tenant + plugin configured; throwaway authorize works on device builds.

**Tenant** (owner — still open; see Phase 0)

- [ ] Native application type  
- [ ] Application grant to API (audience)  
- [ ] Database connection enabled  
- [ ] Refresh token rotation **on**  
- [ ] Allowed Callback / Logout URLs for `tngble` + `com.tngble.app`  
- [ ] Connections enabled: **Username-Password-Authentication**, **google-oauth2**, **apple**  

**App (done in repo)**

- [x] Install `react-native-auth0` via `expo install` (**v5**)  
- [x] `app.config.ts` config plugin (`domain` from env, `customScheme: tngble`)  
- [x] Runtime `Auth0Config` + callback URL helpers  
- [x] Temporary `runAuth0AuthorizeSmoke` + `__DEV__` home smoke panel  
- [x] Jest mock for `react-native-auth0`  
- [x] EAS profiles documented; Auth0 public env via EAS project env / `.env` (not committed)  
- [ ] Produce **development builds** iOS + Android with real domain (owner env)  
- [ ] Smoke: authorize returns token set on physical devices  

**Exit:** Day-1 “throwaway button returns tokens” — blocked on tenant; engineering path ready.

---

### Phase 3 — Domain layer (pure)

**Status:** **Complete** (2026-09-19)  
**Outcomes:** Ports, state machine, errors, user model, sanitization — fully unit-testable.

- [x] `AuthService` interface (+ social)  
- [x] `User` / `AuthResult` / `AuthState` / `AuthError`  
- [x] `AuthStateMachine` with explicit invalid-transition handling  
- [x] `errorMapping` table (provider → safe UX); no account-existence leak  
- [x] Sanitization module per sprint §5 (email, password length-only, name, verification code)  
- [x] Consent domain types + gate rules (`documentVersion`, `acceptedAt`, required before signup)  
- [x] `tests/unit` + `fast-check` properties  

**Exit:** Domain tests green; no Auth0 import in `domain/`.

---

### Phase 4 — Infrastructure (Auth0 + fake + storage + logging)

**Status:** **Complete** (2026-09-19)  
**Outcomes:** Real and fake adapters; redaction live before tokens in prod paths.

- [x] `Auth0Config` from env (Phase 2 + runtime helpers)  
- [x] `Auth0Adapter` implementing full port including `signInWithSocial`  
- [x] `FakeAuthAdapter` scripted scenarios (incl. social success/cancel)  
- [x] `mappers` / `auth0Errors`  
- [x] `CredentialsManager` façade → Auth0 credentials manager only  
- [x] `LocalConsentStore` via SecureStorage (non-token)  
- [x] `logger` + `redaction`  
- [x] `tests/integration` for scopes, audience, `screen_hint`, social `connection`, credential clear on refresh failure  

**Exit:** Adapter integration tests green; Fake adapter usable by application/presentation tests.

---

### Phase 5 — Application layer (hooks + context)

**Status:** **Complete** (2026-09-19)  
**Outcomes:** UI talks only to hooks/context.

- [x] `AuthContext` / `ApplicationAuthProvider` holding state machine state + user  
- [x] Hooks: sign up/in/out, social sign-in, password reset, restore session, auth state, resend verification, consent gate  
- [x] `AuthServiceProvider` injection (Auth0 via `createAuthService`; Fake via `createFakeAuthService`)  
- [x] Double-submit / in-flight guards at provider level  
- [x] Cancellations map to idle (busy cleared, status unchanged)  
- [x] Component tests against FakeAuthAdapter  

**Exit:** Component tests can drive Fake adapter through hooks without screens knowing Auth0.

---

### Phase 6 — Providers & Expo Router integration

**Status:** **Complete** (2026-09-19)  
**Outcomes:** App boots with restore + correct stacks.

- [x] `AppProviders` (`Auth0Provider` → AuthService → ApplicationAuth → Consent)  
- [x] Mount from `app/_layout.tsx`; legacy `useAuth` is a thin compat facade  
- [x] Cold start restore via `ApplicationAuthProvider`; BootSplash waits on `isLoading`  
- [x] `Stack.Protected`: authenticated → `(app)`; pendingVerification → `(verify)`; unauthenticated/expired → `(auth)`  
- [x] Expo Router `Stack.Protected` entry (no root index redirect; `(auth)/index` onboarding)
- [x] `api/client.ts` uses AuthService token accessor  
- [x] Minimal `(verify)` pending screen (full UI in Phase 7)  

**Exit:** Session restore on cold start; unverified users cannot open home.

---

### Phase 7 — Presentation screens & existing UI migration

**Status:** **Complete** (2026-09-19)  
**Outcomes:** Designed TNGBLE screens behave per AUTH-01 + social.

**Build presentation screens** (reuse Button, TextField, SocialAuthButton, tokens):

| Screen | Responsibilities |
| --- | --- |
| PreAuth / SignUp | **Figma Create Account** (node `523:1347`): name, email, password, confirm, phone, strength meter, consent; Auth0 `createUser` + Passwordless Email OTP + identity linking; CTA “Send Email Verification Code”; link to login |
| SignIn | Optional email; Login CTA → Universal Login; **Continue with Apple/Google**; forgot password; link to signup; **no password field submitting to API** |
| ForgotPassword | Email sanitize; hosted reset; safe success copy |
| VerifyPending | Messaging, resend + throttle, sign out |
| Home | Signed-in shell + sign out |

**INV-US007 / Figma:** SignUp uses the pixel Create Account artboard. Email+password leave the device only via Auth0 Authentication API (`/dbconnections/signup` + password-realm). Tenant must allow **Password** / **Password Realm** grant on the Native app. Sign-in remains Universal Login. Phone is collected for UX; verification is INV-US008.

- [x] `SignInScreen` / `SignUpScreen` (`PreAuthScreen` alias) / `ForgotPasswordScreen` / `VerifyPendingScreen` / `HomeScreen`
- [x] `ConsentCheckbox`, `ErrorBanner`, `SocialAuthButtons`
- [x] Thin `app/(auth|verify|app)/*` route wrappers
- [x] Social via `useSocialSignIn`; consent before social on login if none stored; always on register
- [x] Face ID / password field / `AuthConfirmationSheet` removed from SignIn path
- [x] Login/social screen tests + Maestro yaml updated for Universal Login

**Exit:** Manual walkthrough on simulator/dev build for email + Google + Apple happy paths (platform-appropriate) — blocked until Auth0 tenant (Phase 2) is live.

---

### Phase 8 — Email verification & password reset completion

**Status:** **Complete** (2026-09-19)  
**Outcomes:** INV-US009 / INV-US013 done.

- [x] Pending screen only path for unverified (`Stack.Protected` + Figma Verify Account OTP UI)
- [x] Resend action via backend proxy `POST /auth/email-verification/resend` + client throttle UI (“Resend Code in Xs”)
- [x] `refreshUser` / “I’ve verified” / OTP complete force-refreshes claims and promotes when verified
- [x] Hosted reset from ForgotPassword with sanitized email; success copy never enumerates accounts
- [x] Social verified skip pending; unverified social still gated
- [x] Cancellation / network / rate-limit taxonomy on reset, resend, and refresh

**Flow (INV-US009):** Register (Figma name/password) → Auth0 `createUser` → classic Passwordless Email OTP → required Post-Login identity link/verification → `passwordRealm` DB session → `(app)`. Tenant: Verify email on sign up OFF; classic Passwordless Email enabled; Password + Passwordless OTP grants; linking Action deployed (phase 2).

**Exit:** Unverified DB user blocked; verified user reaches `(app)`; reset does not leak account existence. Device smoke still needs live Auth0 tenant + backend resend route.

---

### Phase 9 — Security hardening

**Status:** **Complete (in-repo)** (2026-09-19); **release smoke pending** live tenant  
**Outcomes:** Sprint Day-4 security sweep.

- [x] Grep / ESLint: no Auth0 SDK outside `infrastructure/auth` (`Auth0AppProvider`)
- [x] Grep: logger redacts tokens / emails / `sub`; no credential AsyncStorage / redux-persist
- [x] Legacy SecureStore session is delete-only (`clearLegacySession` on sign-out)
- [x] Deep-link review documented — no custom Linking handlers; SDK owns `tngble://…/callback`
- [x] Screenshot protection on verify-pending (`expo-screen-capture`)
- [x] Same `customScheme` (`tngble`) for debug and release (consistency test)
- [x] D06 honesty: screens → application hooks → AuthService; smoke panel removed from Home
- [x] Checklist: [`docs/auth0-phase-9-security-checklist.md`](./auth0-phase-9-security-checklist.md)
- [ ] Manual: Apple/Google console callbacks + release iOS/Android smoke (tenant-blocked)

**Exit:** Security checklist signed for engineering sweep; release-config smoke planned (manual).

---

### Phase 10 — Testing completion

**Status:** **Complete** (2026-09-19)  
**Outcomes:** Coverage gates + layers complete.

**Unit (`tests/unit`)**

- [x] Sanitization + fast-check  
- [x] Error mapping full table (incl. nullish / non-object)  
- [x] State machine including social → pending/authenticated  
- [x] Consent gate  
- [x] AuthState helpers, createAuthService factory, security boundaries, scheme consistency  

**Component (`tests/component`)**

- [x] SignIn / SignUp / Forgot / VerifyPending / Home against Fake  
- [x] Social cancel/error + consent blocking signup/social  
- [x] A11y: button roles / labels on primary CTAs  

**Integration (`tests/integration`)**

- [x] Auth0Adapter: `screen_hint`, `connection: google-oauth2|apple`, scopes, audience, credential lifecycle, reset/resend/refresh  

**E2E (bonus, time-boxed)**

- [x] Maestro flow moved to `tests/e2e/maestro/login.yaml` (stub retained at `e2e/login.yaml`)  
- [x] Social E2E deferred (component/integration + Phase 9 manual matrix)  
- [x] Documented: never production tenant / real investor credentials  

**Coverage / CI**

- [x] ≥90% `domain/auth` + `domain/sanitization`; ≥80% global (statements/lines) via Jest `coverageThreshold`  
- [x] GitHub Action `.github/workflows/ci.yml`: typecheck, lint, `test:no-only`, `test:coverage` + coverage artifact  
- [x] `pnpm quality` local mirror

**Exit:** CI green on fresh clone; coverage report uploaded as CI artifact.

---

### Phase 11 — CI, docs, demo readiness

**Status:** **Complete** (2026-09-19)  
**Outcomes:** DoD documentation + demo script.

- [x] GitHub Action CI: typecheck, lint, test:no-only, test:coverage (Phase 10; retained)
- [x] README: tenant/env/callbacks, Google/Apple pointers, test layers, Expo dev build
- [x] `docs/auth.md` — operator hub (tenant + social + demo + carry-over)
- [x] Carry-over list (phone, MFA, Face ID, lockout, consent ledger, session list, …)
- [x] Sprint review notes: INV-US023 **hook only**; INV-US010 **delivered** (in-repo)
- [x] Demo script in `docs/auth.md`
- [x] DoD checklist: [`docs/auth0-definition-of-done.md`](./auth0-definition-of-done.md)

**Exit:** Definition of done can be ticked for engineering; release device verification remains manual/tenant-blocked.

---

## 4. Cross-cutting workstreams (parallelizable)

| Stream | Phases | Owner focus |
| --- | --- | --- |
| A — Tenant / Google / Apple consoles | 0, 2, 9 | Auth0 + Apple Dev + Google Cloud |
| B — Domain + tests | 3, 10 | Pure TS |
| C — Adapter + Expo plugin | 2, 4, 6 | Native builds |
| D — UI migration | 7, 8 | Design + a11y |
| E — CI/docs | 1, 10, 11 | Pipeline |

Suggested calendar (4–5 working days if one developer; social adds load):

| Day | Focus |
| --- | --- |
| 0 | Phase 0 |
| 1 | Phases 1–2 + start 3–4 |
| 2 | Phases 3–6 |
| 3 | Phases 7–8 (email + social UI) |
| 4 | Phases 9–11 (harden, test, docs); time-box E2E |

**Cut order if slipping:** Maestro social E2E → Maestro email E2E → resend throttle polish → password-reset UI polish. **Never cut:** sanitization tests, credential manager correctness, AuthService boundary, verification gate, safe errors.

---

## 5. Platform matrix (Google / Apple)

| Platform | Email UL | Google | Apple | Notes |
| --- | --- | --- | --- | --- |
| iOS physical | Required | Required | Required | Apple connection + capability |
| Android physical | Required | Required | Best-effort / required if product mandates | Apple on Android is web-based via Auth0 |
| iOS Simulator | Dev OK | Often OK | Limited | Prefer device for Apple |
| Android Emulator | Dev OK | OK with Google setup | Optional | |
| Expo Go | Unsupported | Unsupported | Unsupported | |

---

## 6. Definition of done (implementation)

Tracked with checkmarks in [`docs/auth0-definition-of-done.md`](./auth0-definition-of-done.md). Summary:

```text
[x] Architecture, AuthService boundary, Fake tests, Universal Login, Google/Apple code paths
[x] Verify gate, hosted reset, sign-out, restore, credentials manager, consent hook
[x] Sanitization + fast-check, safe errors, redaction, no Face ID mock auth
[x] A11y spot-check, coverage gates, CI, README, carry-over, demo script
[ ] Release-configuration verified on physical iOS + Android (manual)
```

---

## 7. Risks specific to this plan

| Risk | Mitigation |
| --- | --- |
| Guideline architecture + Expo Router dual navigation | §1.2 omits React Navigation stacks |
| Social scope expands past 4 days | Phase 0 consoles early; cut E2E first |
| Apple review / capability delays | Start Phase 0 Apple key setup immediately |
| Existing password UI vs Universal Login | Phase 7 removes password submit; escalate if design blocks |
| Duplicate token stores | CredentialsManager façade only |
| Mock social sheet regresses into fake success | Delete mock auth completion path |
| Consent rules for login social ambiguous | Decide in Phase 0; encode in `ConsentGate` |

---

## 8. What happens after this plan is approved

1. Execute phases in order (0 → 11), allowing parallel streams in §4.  
2. Do **not** treat `.github/doc/implement installation guideline.md` as literal file-for-file instructions where §1.3 overrides it.  
3. Optionally rewrite that guideline to match §1.2 in a later docs-only task.  
4. **Coding begins only when explicitly requested** after this plan is accepted.

---

## 9. Document control

| Field | Value |
| --- | --- |
| Plan version | 1.2 |
| Architecture stance | Guideline REQUIRED ARCHITECTURE **adopted** with Expo/social adaptations |
| INV-US010 | **Delivered** in-repo (Google + Apple); device matrix pending tenant |
| INV-US023 | **Hook only** — full consent ledger is carry-over |
| Phases 0–11 | Engineering complete through Phase 11 docs/DoD; device/release smoke tenant-blocked |
| Phase 0 | Engineering draft in `docs/auth0-phase-0-prerequisites.md`; owner sign-off pending |
| Operator hub | `docs/auth.md` |
| DoD | `docs/auth0-definition-of-done.md` |
| Code in Phase 0 | **None** (docs only) |
