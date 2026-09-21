# AUTH-01 Phase 0 — Prerequisites & Decisions

**Phase:** 0 (blocking)  
**Status:** Checklist drafted — **awaiting owner sign-off** on open items  
**Related plan:** [`docs/auth0-implementation-plan.md`](./auth0-implementation-plan.md)  
**Date opened:** 2026-09-19  

> Phase 0 does not install packages or change application code. It locks identifiers, URL strategy, and product decisions so Phase 1+ can proceed without rework.

---

## Sign-off summary

| Area | Status | Notes |
| --- | --- | --- |
| App identifiers (scheme / bundle / package) | **Locked from repo** | See §1 |
| Callback / logout URL strategy | **Proposed — needs Auth0 admin confirm** | See §2 |
| Env var names | **Locked for implementation** | See §3 |
| Product UX (Universal Login, social, Face ID, consent) | **Proposed defaults — needs product/security sign-off** | See §4 |
| Auth0 tenant / E2E tenant | **Blocked — needs owner** | See §5 |
| API audience + password/session policy | **Blocked — needs owner** | See §6 |
| Email templates (verify + reset) | **Blocked — needs owner** | See §7 |
| Google OAuth connection | **Blocked — needs owner** | See §8 |
| Apple Sign In connection | **Blocked — needs owner** | See §9 |

**Phase 0 exit criteria:** Every row above is either *Locked* or *Signed off*, and §10 checklist is complete.

---

## 1. Locked from repository (no decision needed)

Verified in `app.json` / Expo config:

| Item | Value |
| --- | --- |
| App name | TNGBLE |
| Expo slug | `tngble` |
| URL scheme | `tngble` |
| iOS bundle identifier | `com.tngble.app` |
| Android applicationId / package | `com.tngble.app` |
| Platforms | android, ios, web (auth native focus: iOS + Android) |
| Runtime | Expo SDK 57, Expo Router, `expo-dev-client` present |
| Package manager | `pnpm` |
| EAS project | `2ff09bdf-727e-4355-b185-4359bb9795c9` (owner `tngble`) |
| Native folders | Not committed (`android/` / `ios/` generated via prebuild/EAS) |

**Implication:** Auth0 Expo `customScheme` should be **`tngble`** (lowercase, no special characters) and must match `authorize` / `clearSession`.

---

## 2. Callback / logout URL strategy (proposed)

Use Auth0’s Expo / `react-native-auth0` URL shape with scheme `tngble`:

### Allowed Callback URLs

```text
tngble://{AUTH0_DOMAIN}/ios/com.tngble.app/callback
tngble://{AUTH0_DOMAIN}/android/com.tngble.app/callback
```

### Allowed Logout URLs

```text
tngble://{AUTH0_DOMAIN}/ios/com.tngble.app/callback
tngble://{AUTH0_DOMAIN}/android/com.tngble.app/callback
```

(Replace `{AUTH0_DOMAIN}` with the real tenant domain, e.g. `tngble-dev.us.auth0.com` — **no** `https://` prefix in the host segment of these custom-scheme URLs.)

### Allowed Web Origins

Typically empty or minimal for a native-only app; confirm in Auth0 dashboard if the SDK docs for the chosen SDK version require any. Prefer **not** adding unrelated web origins.

### Application type

**Native** application in Auth0.

### Same scheme for debug and release

**Decision (proposed, locked unless blocked):** Use the same `tngble` scheme for development and production builds to avoid “works in debug, fails signed” failures.

| Owner action | Done? |
| --- | --- |
| Paste real domain into the URL templates above in the tenant | [ ] |
| Register callbacks + logout URLs on the Native app | [ ] |
| Confirm no alternate debug-only scheme | [ ] |

---

## 3. Environment variables (locked for Phase 1+)

Public client config (safe to ship in the app binary; still do not commit production `.env`):

```text
EXPO_PUBLIC_AUTH0_DOMAIN=
EXPO_PUBLIC_AUTH0_CLIENT_ID=
EXPO_PUBLIC_AUTH0_AUDIENCE=
EXPO_PUBLIC_API_URL=
```

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_AUTH0_DOMAIN` | Tenant domain (e.g. `xxx.us.auth0.com`) |
| `EXPO_PUBLIC_AUTH0_CLIENT_ID` | Auth0 Native application client ID |
| `EXPO_PUBLIC_AUTH0_AUDIENCE` | API identifier so access tokens are issued |
| `EXPO_PUBLIC_API_URL` | Existing TNGBLE backend base URL |

**Deprecated for product auth path:** `EXPO_PUBLIC_USE_MOCK_AUTH` (tests use `FakeAuthAdapter` instead).

**Never commit:** client secrets (Native apps usually have none), refresh/access tokens, E2E user passwords, Apple private key, Google client secrets.

EAS: inject Auth0 public vars per build profile in Phase 2 (`development` / `preview` / `production` as needed).

---

## 4. Product & security decisions (proposed defaults)

These match the approved implementation plan unless product/security overrides them.

| # | Topic | Proposed decision | Sign-off |
| --- | --- | --- | --- |
| D1 | Login UX | **Universal Login** via `authorize()`. In-app password fields do **not** submit passwords (no Password Grant / Authentication API password form). Hosted Auth0 page owns password. | [ ] Product / Security |
| D2 | Pre-auth | App may keep email capture + marketing + consent before opening Universal Login (`login_hint` optional). | [ ] Product |
| D3 | Google / Apple (INV-US010) | **In scope.** App buttons call `AuthService.signInWithSocial` → `authorize({ connection })`. Connections: `google-oauth2`, `apple`. | [ ] Product |
| D4 | Social trigger | Prefer **`connection` param from the app** so Google/Apple work even if hosted UL social buttons are restyled. Hosted social buttons optional. | [ ] Product |
| D5 | Face ID / biometrics | **Out of AUTH-01.** Remove or disable mock Face ID path; carry to INV-E03. | [ ] Product |
| D6 | Consent (INV-US023) | Hook only: required gate before signup (email + social that can create accounts). Store `documentVersion` + `acceptedAt` locally; expose `onConsentAccepted`. No consent ledger. | [ ] Product / Legal |
| D7 | Consent on login social | **Proposed:** Register/pre-auth: always require consent before social. Login: require consent before social if local consent store has no acceptance for current `documentVersion`. | [ ] Product / Legal |
| D8 | Email verification | Read `email_verified` from ID token; unverified users → pending screen only. Prefer **link** verification in Auth0 templates unless product requires in-app code. | [ ] Product |
| D9 | Scopes | `openid profile email offline_access` + API audience | [ ] Security |
| D10 | Credential storage | Auth0 credentials manager only (Keychain / EncryptedSharedPreferences). No AsyncStorage / Redux persist for tokens. | [ ] Security |

### Consent document version (fill in)

| Field | Value |
| --- | --- |
| `documentVersion` | `_TBD_` e.g. `terms-privacy-2026-08-22` |
| Documents covered | Terms of use + Privacy notice (MVP hook) |
| Owner | `_TBD_` |

---

## 5. Auth0 tenants (owner action)

| Item | Value / action | Done? |
| --- | --- | --- |
| Dev tenant domain | `_TBD_` | [ ] |
| Dev Native app name / Client ID | `_TBD_` | [ ] |
| Admin access granted to implementing developer | `_TBD_ people` | [ ] |
| Dedicated E2E tenant **or** isolated E2E Database connection | `_TBD_` | [ ] |
| Production tenant (later; do not run E2E here) | `_TBD_` | [ ] |
| Database connection name | Default `Username-Password-Authentication` unless renamed | [ ] |
| Refresh token rotation | **ON** | [ ] |
| Refresh token reuse detection | Per security policy (recommend enabled) | [ ] |

---

## 6. API audience & session policy (owner action)

| Item | Proposed / TBD | Done? |
| --- | --- | --- |
| Auth0 API name | e.g. `TNGBLE Investor API` | [ ] |
| Auth0 API identifier (audience) | e.g. `https://api.tngble.app` or `https://api.dev.tngble.app` — **must match** `EXPO_PUBLIC_AUTH0_AUDIENCE` | [ ] |
| Authorize Native app for this API | Yes | [ ] |
| Access token lifetime | `_TBD_` (product/security) | [ ] |
| Absolute / idle session expectations | `_TBD_` | [ ] |
| Password policy | Auth0 DB connection policy (length/complexity/breach detection) — **owned in Auth0**, not reimplemented in app | [ ] |

---

## 7. Email templates (owner action)

| Template | Owner | Channel | Decision | Done? |
| --- | --- | --- | --- | --- |
| Verification | `_TBD_` | Auth0 email | Link (preferred) / Code | [ ] |
| Password reset / change | `_TBD_` | Auth0 hosted + email | Hosted flow only from app | [ ] |
| From-address / branding | `_TBD_` | Auth0 email provider | Align with TNGBLE brand | [ ] |

---

## 8. Google connection (INV-US010) — owner action

Auth0 Connection: **`google-oauth2`**, enabled on the Native application.

| Item | Value | Done? |
| --- | --- | --- |
| Google Cloud project | `_TBD_` | [ ] |
| OAuth client (as required by Auth0 Google setup for mobile) | `_TBD_` | [ ] |
| Authorized redirect URIs in Google console | Per Auth0 Google connection docs (Auth0 callback, not only `tngble://`) | [ ] |
| Connection enabled on Auth0 Native app | Yes | [ ] |
| Test Google account for QA (not a real investor) | `_TBD_` | [ ] |

---

## 9. Apple connection (INV-US010) — owner action

Auth0 Connection: **`apple`**, enabled on the Native application.

| Item | Value | Done? |
| --- | --- | --- |
| Apple Team ID | `_TBD_` | [ ] |
| Services ID | `_TBD_` | [ ] |
| Key ID + `.p8` key uploaded to Auth0 (secret — not in git) | `_TBD_` | [ ] |
| App ID `com.tngble.app` has Sign In with Apple capability | Yes | [ ] |
| Auth0 Apple connection configured | Yes | [ ] |
| Connection enabled on Auth0 Native app | Yes | [ ] |
| iOS physical device available for Apple smoke | Yes / No | [ ] |
| Android Apple via Auth0 (web) required for MVP? | **Proposed: Yes if product lists Apple on Android UI** | [ ] Product |

---

## 10. Phase 0 master checklist

### Locked / documented by engineering (this phase)

- [x] Bundle ID / package / scheme recorded  
- [x] Callback/logout URL **templates** drafted  
- [x] Expo env var names locked  
- [x] Product defaults proposed (Universal Login, social in, Face ID out, consent hook)  
- [x] Phase 0 doc published at `docs/auth0-phase-0-prerequisites.md`  

### Must be completed by owners before Phase 2 device smoke (can start Phase 1 scaffolding in parallel)

- [ ] Auth0 dev tenant + admin access  
- [ ] E2E tenant or connection  
- [ ] Native app created; Client ID issued  
- [ ] Callback + logout URLs registered with real domain  
- [ ] API + audience created; app authorized  
- [ ] Refresh token rotation enabled  
- [ ] Password policy set  
- [ ] Verification + reset template owners + link-vs-code choice  
- [ ] Google connection configured + enabled  
- [ ] Apple connection configured + enabled + capability on App ID  
- [ ] Consent `documentVersion` string agreed  
- [ ] Product/security sign-off on §4 decisions D1–D10  

### Explicit non-blockers for Phase 1 (scaffolding only)

Phase 1 (folders, `.env.example`, lint) **may start** with placeholders while tenant consoles are still in progress.  
Phase 2 (real `authorize()` on devices) **must not** start until Auth0 Native app + callbacks + domain/clientId are available.

---

## 11. Owners & contacts (fill in)

| Role | Name | Responsibility |
| --- | --- | --- |
| Auth0 admin | `_TBD_` | Tenant, apps, connections, APIs |
| Apple Developer account | `_TBD_` | Sign In with Apple |
| Google Cloud OAuth | `_TBD_` | Google OAuth clients |
| Product | `_TBD_` | UX decisions D1–D8 |
| Security | `_TBD_` | Password Grant ban, session policy, D9–D10 |
| Email / brand templates | `_TBD_` | Auth0 email templates |
| Implementing developer | `_TBD_` | Execute Phase 1+ |

---

## 12. Sign-off block

| Role | Name | Date | Signature / ack |
| --- | --- | --- | --- |
| Product | | | |
| Security | | | |
| Auth0 admin | | | |
| Engineering lead | | | |

When signed, update **Status** at the top of this file to `Phase 0 complete` and set Phase 1 to in progress in `docs/auth0-implementation-plan.md`.

---

## 13. Next step

**Recommended:** Start **Phase 1 — Project preparation & scaffolding** (folders, env placeholders, lint) in parallel with owner completion of §§5–9.

**Do not start Phase 2 native Auth0 smoke** until §10 “Must be completed by owners” Auth0 rows are done.
