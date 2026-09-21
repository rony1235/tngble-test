# TNGBLE

Mobile client for TNGBLE (Expo SDK 57 · React Native · TypeScript).

Identity uses **Auth0 Universal Login** (AUTH-01). Wallet / Circle stays server-side.

## Requirements

- Node.js **22.13+** (see `.nvmrc`)
- [pnpm](https://pnpm.io) 10+ (`corepack enable`)
- iOS Simulator and/or Android Emulator
- **Development build** (`expo-dev-client`) — **Expo Go is not supported** for Auth0

```bash
nvm use
corepack enable
pnpm install
cp .env.example .env
# Fill EXPO_PUBLIC_AUTH0_* (see below), then:
pnpm android   # or: pnpm ios
```

## Auth0 setup (short)

Operator guide: **[`docs/auth.md`](docs/auth.md)** (env, tenant summary, callbacks, Google/Apple, demo).

| What | Value / where |
| --- | --- |
| Scheme / app id | `tngble` / `com.tngble.app` |
| Env | `EXPO_PUBLIC_AUTH0_DOMAIN`, `CLIENT_ID`, optional `AUDIENCE` |
| Callbacks | `tngble://{DOMAIN}/ios\|android/com.tngble.app/callback` |
| DB Attributes | Email identifier Required; Username signup **OFF** (avoids `400 Invalid sign up`) |
| Mock boot | `EXPO_PUBLIC_USE_MOCK_AUTH=true` uses FakeAuth; `standalone` / `production` EAS set `false` |
| Standalone APK | [`docs/android-standalone-build.md`](docs/android-standalone-build.md) — `eas build --profile standalone` |
| 200% text scale | Labels done; device audit checklist [`docs/a11y-200-text-scale.md`](docs/a11y-200-text-scale.md) |

More detail: [phase 0](docs/auth0-phase-0-prerequisites.md) · [phase 2 tenant](docs/auth0-phase-2-tenant-setup.md) · [security](docs/auth0-phase-9-security-checklist.md).

## Quality

```bash
pnpm typecheck
pnpm lint
pnpm test                 # unit + component + integration
pnpm test:coverage        # ≥90% domain auth/sanitization; ≥80% global
pnpm test:no-only
pnpm quality              # all of the above
```

| Layer | Path |
| --- | --- |
| Unit | `tests/unit` |
| Component (FakeAuth) | `tests/component` |
| Integration | `tests/integration` |
| Maestro (E2E tenant only) | `tests/e2e/maestro/login.yaml` |

CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs typecheck, lint, no-only, coverage (uploads `coverage` artifact).

## Structure

```
app/                       Expo Router (thin routes)
src/
  domain/                  Auth port, sanitization, consent
  infrastructure/          Auth0Adapter, Fake, storage, logging
  application/             Hooks + ApplicationAuthProvider
  presentation/            Auth screens / components
  app/providers/           AppProviders composition root
  components/              Shared UI
  theme/tokens.ts
tests/                     unit · component · integration · e2e/maestro
```

Import with `@/` (`@/components/Button`). Screens must use `@/application` hooks — never `react-native-auth0`.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm start` | Metro (after a native Auth0-capable build exists) |
| `pnpm android` / `pnpm ios` | Dev client |
| `pnpm quality` | Typecheck + lint + no-only + coverage |
| `pnpm build:android:testlab` | EAS Android APK for Firebase Test Lab |
| `pnpm testlab:android:latest` | Robo smoke (needs GCP) |
| `pnpm appetize:ios:local` | iOS Simulator build → Appetize |
| `maestro test tests/e2e/maestro/login.yaml` | Auth Maestro (E2E tenant) |

Android Test Lab: [`docs/firebase-test-lab.md`](docs/firebase-test-lab.md).  
iOS Appetize: [`docs/appetize-ios.md`](docs/appetize-ios.md).

## First contribution

Auth screens: `src/presentation/screens/`; routes: `app/(auth)/*`.

1. Auth0 only via `@/application` / `AuthService`.
2. Reuse `Button`, `TextField`, `SocialAuthButton`.
3. Tokens from `src/theme/tokens.ts`.
4. Keep Maestro `testID`s (`login-screen`, `login-email`, `login-submit`, `login-apple`, `login-google`).
5. Safe area + keyboard avoidance.

## Architecture notes

- Plan + DoD: [`docs/auth0-implementation-plan.md`](docs/auth0-implementation-plan.md) · [`docs/auth0-definition-of-done.md`](docs/auth0-definition-of-done.md)
- Do not call Circle (or any custody SDK) from the mobile app.
