# AUTH-01 IMPLEMENTATION — TNGBLE INVESTOR APP

You are working on the **TNGBLE Investor App React Native project**.

Your task is to implement the complete **AUTH-01 Registration & Account Access sprint** according to the provided project specification/PDF.

## PRIMARY OBJECTIVE

Implement production-quality authentication for:

* Sign up
* Email verification
* Sign in
* Sign out
* Password reset
* Session restoration
* Required consent gate
* Secure credential storage
* Input sanitization and validation
* Safe error mapping
* Authentication state machine
* Accessibility
* Unit/component/integration tests
* CI coverage gates
* Optional Maestro E2E happy path

Use **Auth0 Universal Login** through `react-native-auth0`.

Do NOT use the Resource Owner Password Grant.

Do NOT build the authentication system around custom password forms calling the Auth0 Authentication API directly.

The native app may have a small pre-auth screen for email capture, consent, and product/marketing content, but authentication itself must go through Auth0 Universal Login.

---

# 1. FIRST: INSPECT THE EXISTING PROJECT

Before changing code:

1. Inspect the complete repository.
2. Determine whether the project uses:

   * Expo
   * Expo Router
   * React Navigation
   * RN CLI
3. Inspect:

   * package.json
   * app.json / app.config.ts
   * babel.config.js
   * metro.config.js
   * tsconfig.json
   * existing navigation
   * existing authentication code
   * existing UI components
   * environment configuration
   * Android configuration
   * iOS configuration
   * existing test configuration
4. Identify existing code that can be reused.
5. Do not blindly overwrite working project code.
6. Preserve the existing design system and application functionality outside AUTH-01.
7. If architecture already exists, refactor incrementally toward the architecture below rather than creating duplicate systems.

Before implementation, create a short internal checklist of:

* existing structure
* existing dependencies
* conflicts
* files that need creation
* files that need modification
* files that should remain unchanged

Then implement.

---

# 2. REQUIRED ARCHITECTURE

Use this architecture as the target architecture.

```text
src/
│
├── app/
│   ├── App.tsx
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ConsentProvider.tsx
│   │   └── AppProviders.tsx
│   │
│   └── navigation/
│       ├── RootNavigator.tsx
│       ├── AuthStack.tsx
│       ├── AppStack.tsx
│       ├── guards.tsx
│       └── linking.ts
│
├── domain/
│   ├── auth/
│   │   ├── AuthService.ts
│   │   ├── AuthState.ts
│   │   ├── AuthStateMachine.ts
│   │   ├── AuthError.ts
│   │   ├── errorMapping.ts
│   │   ├── User.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── sanitization/
│   │   ├── normalizeEmail.ts
│   │   ├── normalizePassword.ts
│   │   ├── normalizeName.ts
│   │   ├── normalizeVerificationCode.ts
│   │   ├── validateEmail.ts
│   │   ├── validatePassword.ts
│   │   ├── validateName.ts
│   │   ├── validateVerificationCode.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   │
│   ├── consent/
│   │   ├── Consent.ts
│   │   ├── ConsentGate.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── shared/
│       ├── Result.ts
│       ├── Brand.ts
│       └── index.ts
│
├── infrastructure/
│   ├── auth/
│   │   ├── Auth0Adapter.ts
│   │   ├── FakeAuthAdapter.ts
│   │   ├── Auth0Config.ts
│   │   ├── mappers.ts
│   │   ├── auth0Errors.ts
│   │   └── index.ts
│   │
│   ├── storage/
│   │   ├── CredentialsManager.ts
│   │   ├── SecureStorage.ts
│   │   ├── LocalConsentStore.ts
│   │   └── index.ts
│   │
│   ├── logging/
│   │   ├── logger.ts
│   │   ├── redaction.ts
│   │   └── index.ts
│   │
│   └── config/
│       ├── env.ts
│       └── index.ts
│
├── application/
│   ├── auth/
│   │   ├── useSignUp.ts
│   │   ├── useSignIn.ts
│   │   ├── useSignOut.ts
│   │   ├── usePasswordReset.ts
│   │   ├── useRestoreSession.ts
│   │   ├── useAuthState.ts
│   │   ├── AuthContext.tsx
│   │   └── index.ts
│   │
│   └── consent/
│       ├── useConsentGate.ts
│       └── index.ts
│
├── presentation/
│   ├── screens/
│   │   ├── PreAuthScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── VerifyPendingScreen.tsx
│   │   └── HomeScreen.tsx
│   │
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── TextField.tsx
│   │   ├── ErrorBanner.tsx
│   │   ├── ConsentCheckbox.tsx
│   │   ├── LoadingOverlay.tsx
│   │   └── Screen.tsx
│   │
│   └── theme/
│       ├── colors.ts
│       ├── spacing.ts
│       ├── typography.ts
│       └── index.ts
│
├── shared/
│   ├── utils/
│   ├── constants/
│   └── types/
│
tests/
├── unit/
├── component/
├── integration/
├── e2e/
│   └── maestro/
└── mocks/
```

Respect these architectural boundaries.

---

# 3. ARCHITECTURAL RULES

## Domain

The `domain/` layer must contain pure business/security logic.

It must NOT import:

* React
* React Native
* Auth0 SDK
* navigation libraries
* storage implementations
* platform-specific APIs

The domain must be testable without React Native.

---

# 4. AUTHSERVICE PORT

Create the central abstraction:

```ts
export interface AuthService {
  signUp(email: string): Promise<AuthResult>;
  signIn(): Promise<AuthResult>;
  signOut(): Promise<void>;
  requestPasswordReset(email?: string): Promise<void>;
  restoreSession(): Promise<AuthResult | null>;
  getAccessToken(): Promise<string | null>;
}
```

Adapt the exact signatures to the existing project where appropriate, but maintain the architectural principle.

All authentication provider calls must go through this port.

Screens MUST NOT import Auth0 directly.

Components MUST NOT import Auth0 directly.

Hooks MUST NOT directly depend on the Auth0 SDK.

---

# 5. AUTH0 ADAPTER

Create:

```text
src/infrastructure/auth/Auth0Adapter.ts
```

It implements `AuthService`.

Use `react-native-auth0`.

Use Universal Login.

Sign-up should use:

```ts
authorize({
  screen_hint: 'signup'
})
```

Sign-in should use Universal Login without `screen_hint: 'signup'`.

Use the appropriate:

```text
openid
profile
email
offline_access
```

scopes.

Configure API audience through environment/build configuration.

Do not hardcode tenant secrets.

---

# 6. AUTH0 CONFIGURATION

Create environment-driven configuration.

Required configuration:

```text
AUTH0_DOMAIN
AUTH0_CLIENT_ID
AUTH0_AUDIENCE
```

Use placeholders in `.env.example`.

Never commit:

* real domain credentials where inappropriate
* secrets
* client secrets
* access tokens
* refresh tokens
* test account passwords

The app must support platform-specific callback/logout URL configuration.

---

# 7. EXPO COMPATIBILITY

First determine whether the project is Expo.

If Expo:

* configure `react-native-auth0` correctly
* add the required config plugin
* configure callback URL / scheme
* ensure the flow works in a development build
* do not assume Expo Go can execute the native Auth0 flow

If RN CLI:

* configure Android manifest placeholders
* configure iOS URL schemes
* configure native dependencies properly

Do not add Expo configuration to an RN CLI project unnecessarily.

---

# 8. AUTH STATE MACHINE

Implement a typed auth state machine.

Minimum states:

```text
unauthenticated
pendingVerification
authenticated
expired
loading/restoring
```

Required conceptual transitions:

```text
unauthenticated
    ↓
pendingVerification
    ↓
authenticated
    ↓
expired
    ↓
unauthenticated
```

Also handle impossible/invalid transitions explicitly.

The state machine must be pure and unit tested.

Do not scatter authentication state logic throughout screens.

---

# 9. EMAIL VERIFICATION

After authentication, map:

```text
email_verified
```

from the Auth0 identity into the application user model.

When:

```text
email_verified === false
```

the user must enter:

```text
VerifyPendingScreen
```

They must NOT be allowed into the application.

Implement:

* verification-pending UI
* resend action
* client-side resend throttling
* appropriate loading states
* cancellation handling
* clean recovery

A user dismissing/cancelling the browser authentication session must return to a clean state, not remain stuck in a spinner.

---

# 10. NAVIGATION / GUARDS

Root navigation must be controlled from the auth state.

Conceptually:

```text
RootNavigator
│
├── restoring/loading
│
├── unauthenticated
│   └── AuthStack
│
├── pendingVerification
│   └── Verification screen/stack
│
└── authenticated
    └── AppStack
```

Create:

```text
AuthGuard
EmailVerifiedGuard
```

or equivalent guard logic appropriate to the current navigation architecture.

Unverified users cannot access authenticated application routes.

---

# 11. PRE-AUTH SCREEN

Create/use:

```text
PreAuthScreen.tsx
```

Responsibilities:

* email input
* consent gate
* marketing/product copy
* accessible field labels
* validation errors
* continue/sign-up action

The pre-auth screen may collect the email before launching Universal Login.

Do not collect or process passwords here unless absolutely required by the existing product specification.

---

# 12. CONSENT

Implement the required consent gate.

The current sprint only needs the **hook/gate**, not the full consent ledger backend.

Consent should contain:

```ts
documentVersion
acceptedAt
```

Store the accepted version locally through a storage abstraction.

Expose an acceptance callback such as:

```ts
onConsentAccepted
```

The sign-up action must be blocked until required consent is accepted.

Do not pretend the complete consent ledger is implemented.

Clearly document that the full consent service/ledger is carry-over work.

---

# 13. INPUT SANITIZATION

Create pure functions.

## Email

Normalize:

1. trim
2. strip zero-width characters
3. strip bidi control characters
4. Unicode NFKC
5. lowercase DOMAIN only

Do NOT blindly lowercase the entire email.

Reject:

* > 254 characters
* missing `@`
* whitespace/control characters after normalization
* invalid/confusable mixed-script domains according to the implemented rule

## Password

DO NOT:

* trim
* NFKC normalize
* lowercase
* modify characters

Passwords must preserve exact code points.

Client-side validation should primarily enforce length.

Password strength/breach rules belong to Auth0.

## Name

Normalize:

* trim
* collapse internal whitespace
* strip control characters
* strip zero-width characters
* NFKC
* sane maximum length

Do NOT strip legitimate characters such as apostrophes.

Escape at render/sink rather than mutilating user input.

## Verification Code

Normalize:

* trim
* remove spaces
* remove dashes
* digits only

Reject:

* invalid length
* non-numeric values after normalization

---

# 14. SANITIZATION RULE

Apply sanitization at the boundary.

Do not scatter code such as:

```ts
.replace(...)
.trim(...)
```

through UI components.

Use centralized pure normalization functions.

Use appropriate escaping/encoding at output sinks.

Never pass uncontrolled user strings into:

* dangerouslySetInnerHTML
* WebViews
* deep-link URLs
* unsafe URLs
* logs

---

# 15. SECURE CREDENTIAL STORAGE

Use the Auth0 credentials manager / platform secure storage.

Credentials must reside in:

* iOS Keychain
* Android Keystore / EncryptedSharedPreferences equivalent through the Auth0 credentials manager

Never use:

* AsyncStorage for tokens
* Redux persist for credentials
* plain files
* console logs

Required behaviour:

```text
successful authentication
    → credentials stored securely

sign out
    → credentials cleared

refresh/session failure
    → credentials cleared
    → user signed out cleanly
```

---

# 16. SESSION RESTORATION

Implement:

```text
useRestoreSession
```

On cold launch:

```text
App starts
   ↓
restoreSession()
   ↓
valid session?
   ├── yes → authenticate
   ├── unverified → pendingVerification
   └── no/expired → unauthenticated
```

Refresh token rotation must be respected.

A refresh failure must result in a clean logout path rather than leaving stale auth state.

---

# 17. SIGN OUT

Implement:

```text
useSignOut
```

Sign-out must:

1. clear Auth0 session
2. clear credentials
3. clear cached user/auth state
4. return to unauthenticated state
5. verify that the browser session is also cleared where supported

Do not merely reset React state.

---

# 18. PASSWORD RESET

Password reset must use the hosted Auth0 flow.

Do not create an insecure custom password-reset mechanism.

Support:

```text
ForgotPasswordScreen
```

with appropriate loading/error/success states.

Do not reveal whether a specific email exists in the system.

---

# 19. ERROR TAXONOMY

Create domain-safe error types.

Map provider errors into a small safe taxonomy such as:

```text
network
cancelled
rateLimited
blocked
invalidInput
sessionExpired
generic
```

Exact names can be adapted to the codebase.

User-facing errors MUST NOT reveal:

* whether an account exists
* whether a password was "almost correct"
* attempt counts
* internal Auth0 error codes
* provider internals
* tokens
* claims
* sensitive user information

For example, do not expose raw errors:

```ts
console.log(error);
setError(error.message);
```

Instead:

```text
provider error
      ↓
Auth0 error mapper
      ↓
domain AuthError
      ↓
safe user-facing message
```

---

# 20. LOGGING / REDACTION

Create:

```text
src/infrastructure/logging/redaction.ts
src/infrastructure/logging/logger.ts
```

Never log:

* access tokens
* refresh tokens
* ID tokens
* email addresses
* user IDs
* `sub`
* passwords
* authorization codes

Crash reports and analytics must use the same redaction rules.

Add this protection immediately rather than after the authentication system is finished.

---

# 21. ACCESSIBILITY

All auth screens must support:

* accessibility labels
* logical focus order
* accessible roles
* announced validation errors
* announced async/loading states
* adequate contrast
* 200% text scaling/layout stability
* keyboard-safe layout
* disabled/loading button states

React Native Testing Library tests should prefer:

```text
getByRole
getByLabelText
```

rather than relying only on:

```text
getByTestId
```

---

# 22. DOUBLE SUBMIT PROTECTION

All auth actions must prevent accidental repeated submissions.

Buttons should:

* disable while loading
* show loading state
* avoid duplicate Auth0 calls
* recover correctly after failure

---

# 23. TESTING ARCHITECTURE

Implement three test layers.

## Layer 1 — UNIT

Test:

* email sanitization
* password sanitization/validation
* name sanitization
* verification-code normalization
* validation rules
* property-based sanitization rules
* AuthStateMachine
* error mapping
* consent logic

Use `fast-check` for property-based tests where practical.

Required properties include:

* normalization is idempotent
* output does not contain forbidden control characters
* output does not exceed configured limits

---

## Layer 2 — COMPONENT

Use React Native Testing Library.

Test:

```text
PreAuthScreen
SignInScreen
SignUpScreen
VerifyPendingScreen
ForgotPasswordScreen
```

Cover:

* initial rendering
* validation
* loading
* disabled buttons
* errors
* successful actions
* double-submit protection
* consent blocking
* resend throttling
* accessibility labels
* browser cancellation path

Use the fake auth adapter.

---

## Layer 3 — INTEGRATION

Mock the native Auth0 module.

Verify:

* scopes
* audience
* `screen_hint`
* Universal Login invocation
* response mapping
* user mapping
* error mapping
* credentials storage
* credentials clearing
* refresh failure behaviour

Do not attempt to test the entire real Auth0 SDK implementation with unit tests.

---

# 24. FAKE AUTH ADAPTER

Create:

```text
src/infrastructure/auth/FakeAuthAdapter.ts
```

It must be deterministic.

All unit/component tests that need authentication behaviour should use this adapter instead of real Auth0.

Support scripted scenarios such as:

```text
success
verificationPending
networkFailure
cancelled
rateLimited
blocked
expiredSession
refreshFailure
```

---

# 25. E2E TESTING

Maestro is preferred for the actual Universal Login browser flow.

Create:

```text
e2e/maestro/auth-happy-path.yaml
```

The expected flow is conceptually:

```text
launch clean app
→ tap sign up
→ Universal Login opens
→ fill hosted sign-up form
→ accept consent
→ return to app
→ verification-pending screen
```

Use a dedicated E2E Auth0 tenant/connection.

Never run this against the production tenant.

Never use real investor credentials.

If browser automation is unstable, do not block the whole CI pipeline indefinitely.

A stubbed-adapter Detox/RN test may be used as fallback for native app flow coverage.

---

# 26. CI REQUIREMENTS

CI must run:

```text
typecheck
lint
unit tests
component tests
integration tests
coverage
```

Coverage gates:

```text
auth + sanitization modules >= 90%
overall touched code >= 80%
```

CI must fail on:

* TypeScript errors
* lint errors
* failed tests
* coverage regression
* `.only`
* newly skipped tests where prohibited

---

# 27. FILE / IMPORT BOUNDARIES

Enforce architecture.

Presentation must not import:

```text
infrastructure/auth/Auth0Adapter
```

directly.

Presentation should depend on application/domain abstractions.

Domain must not import React Native/Auth0.

Application may orchestrate domain + ports.

Infrastructure implements ports.

Use ESLint import-boundary rules where practical.

---

# 28. DOCUMENTATION

Update/create:

```text
docs/architecture.md
docs/auth.md
docs/consent.md
docs/testing.md
README.md
```

Document:

* architecture
* Auth0 setup
* environment variables
* callback URLs
* Android configuration
* iOS configuration
* Expo development build requirements if applicable
* how to run unit tests
* how to run component tests
* how to run integration tests
* how to run Maestro
* coverage requirements
* known carry-over items

Explicitly document what is NOT implemented in AUTH-01:

* phone verification
* social login
* MFA
* authenticator
* biometrics
* step-up authentication
* session list
* lockout handling
* complete consent ledger

---

# 29. REQUIRED SECURITY PRINCIPLES

Follow these strictly:

```text
Universal Login
        +
AuthService abstraction
        +
secure credential manager
        +
sanitization at boundaries
        +
safe error mapping
        +
zero sensitive logging
        +
email verification guard
        +
refresh/session lifecycle
```

Never compromise these for convenience.

Do not introduce technical shortcuts such as:

```text
AsyncStorage tokens
Redux-persisted credentials
Password Grant
raw Auth0 errors in UI
tokens in logs
email addresses in analytics
Auth0 SDK imports inside screens
```

---

# 30. IMPLEMENTATION ORDER

Implement in this order:

### Step 1

Inspect existing codebase and identify architecture conflicts.

### Step 2

Install/configure required dependencies only when actually needed.

### Step 3

Create domain models and `AuthService`.

### Step 4

Create Auth0 adapter and fake adapter.

### Step 5

Configure secure credential management.

### Step 6

Implement sanitization and validation.

### Step 7

Implement auth state machine.

### Step 8

Implement AuthContext/application hooks.

### Step 9

Implement navigation guards.

### Step 10

Implement PreAuth, SignUp, SignIn, Verify Pending and Password Reset flows.

### Step 11

Implement safe error mapping and logging redaction.

### Step 12

Write unit tests.

### Step 13

Write component tests.

### Step 14

Write integration tests.

### Step 15

Configure Maestro E2E if feasible.

### Step 16

Configure CI and coverage gates.

### Step 17

Run all available checks and fix failures.

### Step 18

Update documentation.

---

# 31. IMPORTANT CODING RULES

Use:

* TypeScript strict mode
* strong types
* small cohesive modules
* dependency inversion
* explicit interfaces
* predictable state transitions
* reusable UI primitives
* accessible components
* defensive error handling

Avoid:

* `any` unless unavoidable and documented
* giant auth components
* duplicated auth logic
* circular dependencies
* hidden global state
* direct SDK usage inside UI
* unnecessary abstraction layers
* speculative features not required by AUTH-01

Do not over-engineer beyond what this sprint requires.

---

# 32. DEFINITION OF DONE

Do not consider the task complete until the implementation satisfies these checks:

```text
[ ] Sign-up works through Auth0 Universal Login
[ ] Sign-in works
[ ] Sign-out works
[ ] Password reset works
[ ] Email verification state is enforced
[ ] Unverified users cannot access AppStack
[ ] Session restores after app restart
[ ] Refresh/session failure logs the user out cleanly
[ ] Credentials use secure platform storage
[ ] No tokens/PII appear in logs
[ ] Auth0 SDK is hidden behind AuthService
[ ] Sanitization is pure and isolated
[ ] Password is never normalized
[ ] Consent gate blocks sign-up when required
[ ] Safe error taxonomy is implemented
[ ] Double submissions are prevented
[ ] Accessibility requirements are implemented
[ ] Unit tests pass
[ ] Component tests pass
[ ] Integration tests pass
[ ] Coverage gates pass
[ ] TypeScript passes
[ ] ESLint passes
[ ] README/docs are updated
[ ] Carry-over work is documented
```

---

# 33. FINAL VALIDATION

After implementation:

1. Run typecheck.
2. Run lint.
3. Run unit tests.
4. Run component tests.
5. Run integration tests.
6. Run coverage.
7. Run the app on Android.
8. Run the app on iOS when the environment supports it.
9. Test:

   * sign up
   * cancelled login
   * email verification pending
   * verified login
   * sign out
   * cold-start restore
   * password reset
   * network error
   * rate-limit error
   * refresh failure
10. Fix all relevant issues.

At the end, provide a concise implementation report containing:

```text
1. Files created
2. Files modified
3. Dependencies added
4. Auth0 configuration required
5. Tests added
6. Test results
7. Coverage results
8. Known limitations
9. Carry-over items
```

Do not claim a feature is complete unless it is actually implemented and tested.

The priority is:

```text
SECURITY
→ CORRECTNESS
→ ARCHITECTURE
→ TESTABILITY
→ ACCESSIBILITY
→ UX POLISH
```

Preserve the existing application where possible and make the smallest safe changes necessary to integrate AUTH-01.
