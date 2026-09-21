# AUTH-01 Phase 9 — Security checklist

**Date:** 2026-09-19  
**Scope:** Sprint Day-4 security sweep for Auth0 Universal Login.

Engineering items below are implemented or verified in-repo. Items marked **manual** require a device/build or Auth0 console check before release sign-off.

## Automated / in-repo

| Check | Status | Evidence |
| --- | --- | --- |
| No `react-native-auth0` outside `src/infrastructure/auth` | Done | ESLint `no-restricted-imports` + `tests/unit/securityBoundaries.test.ts` |
| Auth0Provider only via infrastructure | Done | `Auth0AppProvider` → `AppProviders` |
| Logger redacts tokens / email / `sub` | Done | `src/infrastructure/logging/redaction.ts` + unit tests |
| No AsyncStorage / redux-persist for credentials | Done | Boundary test; credentials only via Auth0 Credentials Manager |
| Legacy SecureStore session no longer stores tokens | Done | `clearLegacySession` delete-only; called on adapter `signOut` |
| D06 — screens use AuthService / application hooks | Done | Presentation uses `@/application`; no `loginRequest` in screens |
| No custom Linking handlers for Auth0 callbacks | Done | Boundary test; SDK + config plugin own `tngble://…/callback` |
| Same `customScheme` debug + release | Done | `tngble` in `app.config.ts`, `app.json`, `Auth0Config`; consistency test |
| Screenshot protection on verify-pending | Done | `expo-screen-capture` on `VerifyPendingScreen` |
| Phase 2 Auth0 smoke panel removed from Home | Done | Product shell only |

## Deep-link / callback hijacking review

| Topic | Finding |
| --- | --- |
| Callback URL shape | `tngble://{domain}/ios\|android/com.tngble.app/callback` via Auth0 Expo plugin |
| App ownership of tokens in URL | App does not parse Auth0 callback query params; `react-native-auth0` completes the exchange |
| Custom `Linking` listeners | None in `src/` (would risk intercepting auth codes) |
| Scheme collision | Single scheme `tngble` for app + Auth0 (no debug-only alternate) |
| Residual risk | Malicious apps cannot register the same claimed scheme on iOS if Apple associated domains / App ID ownership holds; Android package + intent filters come from the Auth0 plugin at prebuild — verify on **release** APK/AAB |

## Manual / console (before release)

| Check | Owner | Notes |
| --- | --- | --- |
| [ ] Auth0 Allowed Callback URLs match `getAuth0CallbackUrls(domain)` | Eng + Auth0 admin | See `docs/auth0-phase-2-tenant-setup.md` |
| [ ] Auth0 Allowed Logout URLs registered for same scheme | Eng + Auth0 admin | |
| [ ] Apple Developer / Services ID callbacks align with Auth0 Apple connection | Eng | |
| [ ] Google Cloud OAuth redirect URIs align with Auth0 Google connection | Eng | |
| [ ] Release iOS build: Universal Login + logout round-trip | Eng | Same scheme as debug |
| [ ] Release Android build: Universal Login + logout round-trip | Eng | Same scheme as debug |
| [ ] Production EAS profile sets real `EXPO_PUBLIC_AUTH0_*` and `EXPO_PUBLIC_USE_MOCK_AUTH=false` | Eng | Do not ship placeholder Auth0 domain |
| [ ] Backend `POST /auth/email-verification/resend` requires user access token; no Management token in app | Backend | |

## Release-config smoke plan

1. EAS `production` (or internal release) build for iOS and Android with Auth0 env populated.  
2. Cold install → onboarding → Login → Universal Login (email) → land on `(app)` or `(verify)`.  
3. Sign out → confirm Auth0 session cleared and app returns to `(auth)`.  
4. Forgot password → confirm generic success copy (no account enumeration).  
5. (Optional) Google / Apple on the appropriate platform.  
6. Confirm logcat/Xcode console has no access tokens, refresh tokens, or emails from app logger.

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| Engineering (in-repo sweep) | | 2026-09-19 | Complete |
| Engineering (release smoke) | | | Pending tenant + release build |
| Security / tech lead | | | |
