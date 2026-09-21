# AUTH-01 Phase 2 — Auth0 tenant & Expo native setup

**Status:** Engineering configuration **complete**; device smoke **blocked** until Phase 0 tenant values are filled.  
**Related:** [`auth0-phase-0-prerequisites.md`](./auth0-phase-0-prerequisites.md) · [`auth0-implementation-plan.md`](./auth0-implementation-plan.md)

---

## What landed in the repo

| Item | Location |
| --- | --- |
| `react-native-auth0` ^5.x | `package.json` |
| Expo config plugin + `customScheme: tngble` | `app.config.ts` |
| Runtime config helpers | `src/infrastructure/auth/Auth0Config.ts` |
| Temporary Universal Login smoke helper | `src/infrastructure/auth/auth0Smoke.ts` (optional; Home smoke panel removed in Phase 9) |

**Expo Go is unsupported.** After this plugin, create a new **development build**:

```bash
# Set Auth0 env in .env first (see below)
pnpm exec expo prebuild --clean   # optional local natives
pnpm android                      # or: pnpm ios
# or EAS:
pnpm dlx eas-cli build --profile development --platform android
pnpm dlx eas-cli build --profile development --platform ios
```

Rebuild whenever the Auth0 plugin domain/scheme changes.

---

## Local `.env` (required for smoke)

```text
EXPO_PUBLIC_AUTH0_DOMAIN=your-tenant.us.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your_native_client_id
# Optional if you have no backend API:
# EXPO_PUBLIC_AUTH0_AUDIENCE=https://your-api-identifier
```

Copy from `.env.example`. Do not commit real values.

If `EXPO_PUBLIC_AUTH0_DOMAIN` is unset at prebuild time, `app.config.ts` uses placeholder `YOUR_AUTH0_DOMAIN.auth0.com` so tooling does not crash — **never ship that placeholder**.

---

## Auth0 dashboard checklist (owner)

### 1. Native application

- Application type: **Native**
- Note **Domain** and **Client ID**

### 2. Allowed Callback URLs / Logout URLs

Replace `{DOMAIN}` with the tenant domain (no `https://`):

```text
tngble://{DOMAIN}/ios/com.tngble.app/callback
tngble://{DOMAIN}/android/com.tngble.app/callback
```

Same URLs for **Allowed Logout URLs**.

### 3. API (audience) — optional

Only needed when a backend API must receive Auth0 access tokens. For a React Native app with **no backend**, skip this and leave `EXPO_PUBLIC_AUTH0_AUDIENCE` unset.

If you do have an API:

- Create an API; copy **Identifier** → `EXPO_PUBLIC_AUTH0_AUDIENCE`
- Authorize the Native app for this API
- Enable **offline_access** / refresh tokens as required by the API settings

### 4. Database connection

- Enable **Username-Password-Authentication** (or your DB connection) on the Native app
- **Refresh Token Rotation**: ON
- Password policy: per product/security

### 5. Social (INV-US010)

- Enable **google-oauth2** on the Native app (Google Cloud OAuth clients configured)
- Enable **apple** on the Native app (Services ID, key, Team ID; Sign In with Apple on App ID `com.tngble.app`)

### 6. Email templates

- Signup OTP (Passwordless Email + identity linking) + password reset — assign owners (Phase 0)

### 7. Post-Login linking Action (required)

The custom native UI uses classic Passwordless Email to verify ownership, then the Action links that identity into the database user so only one Auth0 row remains.

- Script: [`auth0/actions/post-login-require-email-verified.js`](../auth0/actions/post-login-require-email-verified.js)  
- Deployment steps: [`auth0-post-login-email-verified.md`](./auth0-post-login-email-verified.md)

### 8. Register — DB password + Passwordless Email OTP (INV-US007 / INV-US009)

The flow temporarily creates an `email|…` OTP identity and immediately links it into the `auth0|…` primary user.

**Required tenant settings:**

On the **Username-Password-Authentication** connection:

1. **Attributes** (Flexible Identifiers) — this app signs up with **email + password only** (no username field):
   - **Email**
     - **Use Email as Identifier** ON  
     - **Allow Signup with Email** → **Required**  
     - **Verify email on sign up: OFF**  
   - **Username**
     - **Use Username as Identifier** OFF  
     - or **Allow Signup with Username** → **Off**  
     - Do **not** leave Username signup **Required** — Auth0 returns `400 invalid_signup` / “Invalid sign up” when the app omits `username`.  
   - **Phone** — leave off unless product adds a phone identifier later  
2. **Authentication Methods**  
   - Enable **Password**  
3. Connection enabled for the Native application; **Disable Sign Ups** must be OFF  

If signup still returns `invalid_signup` for an email that already exists, check **Tenant Settings → Advanced → Use a generic response in public signup API error message** (ON masks `user_exists` as `invalid_signup`).

Under **Authentication → Passwordless → Email**:

1. Enable Passwordless Email and configure it to send a code.
2. Enable the connection for the Native application.

On the Native application → **Settings → Advanced → Grant Types**:

1. Enable **Password** and **Passwordless OTP** → Save  

Create an M2M application authorized for the Auth0 Management API with `read:users` and `update:users`, then deploy the required Action with its three secrets.

App flow: form → `createUser` → `/passwordless/start` → Verify UI → `/oauth/token` → link identities → `passwordRealm` → home.

---

## EAS environment

Set project / profile env (EAS dashboard or `eas env`) for profiles that need Auth0:

- `EXPO_PUBLIC_AUTH0_DOMAIN`
- `EXPO_PUBLIC_AUTH0_CLIENT_ID`
- `EXPO_PUBLIC_AUTH0_AUDIENCE`

`eas.json` does **not** hard-code secrets. `development` / `preview` / `production` should inherit these from EAS env. Mock-auth profiles (`appetize`, `testlab`) may keep `EXPO_PUBLIC_USE_MOCK_AUTH=true` until Auth0 E2E replaces them.

---

## How to run the Phase 2 smoke

1. Complete dashboard checklist above.  
2. Fill `.env` and rebuild the **dev client** (not Expo Go).  
3. Sign in with legacy mock auth to reach Home (until Auth0 owns login).  
4. In `__DEV__`, tap **Auth0 authorize smoke**.  
5. Complete Universal Login in the system browser.  
6. Confirm the panel shows `access=yes` / `id=yes` / `refresh=yes` (refresh depends on tenant).  

**Do not** log raw tokens. The smoke helper only returns presence flags.

Cancel/dismiss of the browser sheet should show a cancelled state.

---

## Exit criteria

| Criterion | Status |
| --- | --- |
| SDK + config plugin in repo | Done |
| Callback URL strategy documented | Done |
| EAS/env wiring documented | Done |
| Throwaway authorize returns tokens on physical iOS + Android | **Pending tenant + rebuild** |

When smoke passes on both platforms, check this box and proceed to Phase 3 (domain can also start in parallel):

- [ ] Android physical: authorize smoke OK  
- [ ] iOS physical: authorize smoke OK  
