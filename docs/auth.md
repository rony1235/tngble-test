# AUTH-01 — Auth (operator guide)

Short hub for tenant setup, social consoles, local runs, and sprint demo.  
Deep checklists: [phase 0](./auth0-phase-0-prerequisites.md) · [phase 2 tenant](./auth0-phase-2-tenant-setup.md) · [phase 9 security](./auth0-phase-9-security-checklist.md) · [full plan](./auth0-implementation-plan.md).

## Sprint inventory (AUTH-01)

| ID | Outcome | Status |
| --- | --- | --- |
| INV-US007 | Email/password Create Account (Figma form → Auth0 `createUser` + Email OTP) | Delivered (in-repo); enable Passwordless Email |
| INV-US009 | Email OTP gate + Figma Verify Account UI + resend throttle | Delivered (in-repo); deploy the required Post-Login linking Action |
| INV-US010 | Google + Apple via Auth0 | Delivered (in-repo); Apple validated on **physical iOS** when tenant ready |
| INV-US011 | Sign-in with approved credentials (Universal Login) | Delivered |
| INV-US012 | Safe errors (no account enumeration) | Delivered |
| INV-US013 | Forgot password Email OTP (Passwordless) + in-app set password | Delivered (in-repo); needs Passwordless Email + backend password proxy |
| INV-US014 | Sign-out clears session | Delivered |
| INV-US023 | Terms / privacy consent | **Hook only** (local version + timestamp + callback) — full ledger is carry-over |

## Env vars

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_AUTH0_DOMAIN` | Tenant domain (no `https://`) |
| `EXPO_PUBLIC_AUTH0_CLIENT_ID` | Native application Client ID |
| `EXPO_PUBLIC_AUTH0_AUDIENCE` | Optional API identifier — omit when there is no backend |
| `EXPO_PUBLIC_API_URL` | Backend base URL (optional legacy helpers); signup OTP uses Auth0 Authentication API |
| `EXPO_PUBLIC_USE_MOCK_AUTH` | `true` → FakeAuthAdapter boot; production / standalone EAS forces `false` |

Copy `.env.example` → `.env`. Never commit secrets. Never ship the Auth0 domain placeholder from `app.config.ts`.

## Auth0 tenant configuration (summary)

Point the Native app at this tenant; full checklist: [phase 2](./auth0-phase-2-tenant-setup.md).

| Area | Required setting |
| --- | --- |
| Application | Type **Native**; Client ID → `EXPO_PUBLIC_AUTH0_CLIENT_ID` |
| Callbacks / Logout | `tngble://{DOMAIN}/android/com.tngble.app/callback` (+ iOS twin) |
| Grants | **Password**, **Passwordless OTP**, **Refresh Token**, **Authorization Code** |
| DB connection | **Username-Password-Authentication** enabled for the app |
| DB Attributes | **Email** identifier + signup **Required**; **Username** identifier/signup **OFF** (email-only Create Account) |
| DB Verify email on sign up | **OFF** (OTP / linking Action owns verification) |
| Passwordless Email | Enabled for the Native app (code delivery) |
| My Account API | Authorize Native app with `create:me:authentication_methods` (forgot-password set password) |
| Post-Login Action | Deploy [`auth0/actions/post-login-require-email-verified.js`](../auth0/actions/post-login-require-email-verified.js) |
| Google / Apple | Connections enabled; **own** OAuth keys (not Auth0 Dev Keys) for native |
| Social | Optional audience omit when no API |

**Live device `400 Invalid sign up`:** almost always Username signup Required / identifier mismatch, or duplicate email under generic signup errors. Fix Attributes first, then retry with a **new** email.

## Callback / logout URLs

Scheme **`tngble`**, app id **`com.tngble.app`**. Replace `{DOMAIN}` with the Auth0 tenant domain:

```text
tngble://{DOMAIN}/ios/com.tngble.app/callback
tngble://{DOMAIN}/android/com.tngble.app/callback
```

Register the same pair under **Allowed Callback URLs** and **Allowed Logout URLs**.  
Helpers: `getAuth0CallbackUrls()` in `src/infrastructure/auth/Auth0Config.ts`.

## Google / Apple (Auth0 connections)

1. Auth0 Native app → enable **google-oauth2** and **apple**.  
2. **Google Cloud:** OAuth client(s) whose redirect URIs match Auth0’s Google connection docs for this tenant.  
3. **Apple:** Services ID, key, Team ID in Auth0; Sign In with Apple capability on App ID `com.tngble.app`.  
4. Rebuild the native app after capability / plugin changes.

App code uses `authorize({ connection: 'google-oauth2' | 'apple' })` only inside `Auth0Adapter` — screens never import the SDK.

## Expo development build

Expo Go **cannot** run Auth0. After setting env:

```bash
pnpm install
pnpm android   # or: pnpm ios
# or EAS development profile
pnpm dlx eas-cli build --profile development --platform android
```

Rebuild when `EXPO_PUBLIC_AUTH0_DOMAIN` or the Auth0 config plugin changes.

## Test layers

| Layer | Command / path |
| --- | --- |
| Unit | `pnpm test` → `tests/unit` |
| Component (FakeAuth) | `tests/component` |
| Integration (mocked Auth0 SDK) | `tests/integration` |
| Coverage gates | `pnpm test:coverage` |
| CI mirror | `pnpm quality` |
| Maestro (E2E tenant only) | `maestro test tests/e2e/maestro/login.yaml` |

Never point Maestro or manual demos at the **production** tenant or real investor accounts.

## Signup OTP (native app UI)

No browser opens during signup:

1. `createUser` creates the `auth0|…` database/password identity.
2. `POST /passwordless/start` sends a code through classic Passwordless Email.
3. `POST /oauth/token` verifies the code and runs the Login Action.
4. The Action verifies the database user and links the temporary `email|…` identity into it.
5. `passwordRealm` authenticates the final `auth0|…` user and the app continues.

Tenant: **Verify email on sign up OFF**; classic **Authentication → Passwordless → Email** enabled for the Native app; Native app grants **Password** + **Passwordless OTP**; linking Action deployed (see [phase 2](./auth0-phase-2-tenant-setup.md)).

## Forgot password OTP (native app UI)

1. `requestPasswordReset` → `POST /passwordless/start` (6-digit code email).
2. **Screen 2 (in-app):** user enters the code → `confirmPasswordResetOtp` (requests Auth0 My Account API access token).
3. **Screen 3 (in-app):** user sets a new password → `completePasswordReset` via Auth0 My Account API (`/me/v1/authentication-methods`) — **no custom backend**.
4. Success screen → login.

**Auth0 setup (required for Screen 3):** authorize **Tngble** on **Auth0 My Account API**:

1. Dashboard → **Applications → APIs → Auth0 My Account API**
2. Open **Settings** / **Application Access** (user-delegated access) — not Client Credentials
3. Authorize client `uPy8DhDTmpWsT8xI8kPq83Wg0HSP2Els` (**Tngble**)
4. Allow scope **`create:me:authentication_methods`**
5. Audience must be `https://dev-bf5q33ub1oab51bp.us.auth0.com/me/`

Until that grant exists, Auth0 logs `fepotpft` (“Client is not authorized to access resource server …/me/”), OTP falls back to a normal token, and **Proceed** on Screen 3 fails.

---

## Demo script (sprint review)

**Prep:** Dev/release build with Auth0 env + Fake off (`EXPO_PUBLIC_USE_MOCK_AUTH=false`). Disposable E2E user. iPhone for Apple. Classic Passwordless Email + Password + Passwordless OTP grants enabled.

| Step | Action | Expect |
| --- | --- | --- |
| 1 | Clean install → open app | Onboarding |
| 2 | Sign up → Figma Create Account → consent | OTP email sent; `(verify)` only — no home |
| 3 | Enter OTP from inbox | `(app)` home (`email_verified`) |
| 4 | Sign out | Auth stack; session cleared |
| 5 | Sign in (email UL) | Home (if verified) |
| 6 | Continue with Google | Home / verify per `email_verified` |
| 7 | Continue with Apple (iOS device) | Same |
| 8 | Kill app → relaunch | Session restore |
| 9 | Forgot password → OTP → new password in-app | OTP then Figma Screen 3 → success → login |

Call out in review: **INV-US023 = hook only**; **INV-US010 delivered** in code (device matrix still needs tenant sign-off).

---

## Carry-over (next sprints)

| Item | Notes |
| --- | --- |
| Phone verification (INV-US008) | Explicitly next sprint |
| MFA | Out of AUTH-01 |
| Face ID / biometrics | Removed from SignIn; reintroduce as real factor later |
| Account lockout UX | Rely on Auth0; richer client messaging later |
| Full consent ledger | Persist/server sync beyond local SecureStore hook |
| Session list / remote revoke | Multi-device management |
| Backend Management proxy | Only if product adds non-OTP admin flows |
| Release smoke on physical iOS + Android | Phase 9 checklist manual rows |
| Maestro against dedicated E2E tenant | Optional; social E2E remains deferred |

---

## Definition of done (engineering)

See [`auth0-definition-of-done.md`](./auth0-definition-of-done.md).
