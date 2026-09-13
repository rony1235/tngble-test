# TNGBLE

Mobile client for TNGBLE (Expo SDK 57 · React Native · TypeScript).

The app talks only to **our** backend. Wallet / Circle integration stays server-side.

## Requirements

- Node.js **22.13+** (see `.nvmrc`)
- [pnpm](https://pnpm.io) 10+ (`corepack enable`)
- iOS Simulator and/or Android Emulator

```bash
nvm use
corepack enable
pnpm install
cp .env.example .env
pnpm start
```

Mock auth is on by default. Any email with `@` and password length ≥ 6 signs in.

## Structure

```
app/                  Expo Router screens
  (auth)/login.tsx    Sign-in (design work starts here)
  (app)/index.tsx     Authenticated home
src/
  auth/               Session + AuthProvider
  api/                Backend HTTP client
  components/         Shared UI primitives
  theme/tokens.ts     Colors, spacing, type
e2e/                  Maestro flows
```

Import with the `@/` alias (`@/components/Button`).

## Scripts

| Command | Purpose |
|---|---|
| `pnpm start` | Dev server |
| `pnpm test` | Unit / component tests |
| `pnpm typecheck` | TypeScript |
| `pnpm build:android:testlab` | EAS Android APK for Firebase Test Lab |
| `pnpm testlab:android:latest` | Robo smoke on Test Lab (needs `FIREBASE_PROJECT_ID` + `gcloud`) |
| `pnpm build:ios:appetize` | Local EAS iOS Simulator build (Mac + Xcode) |
| `pnpm appetize:ios:local` | Local EAS build + upload to Appetize |
| `maestro test e2e/login.yaml` | E2E (needs build + Maestro CLI) |

Android cloud smoke (Firebase Test Lab): see [`docs/firebase-test-lab.md`](docs/firebase-test-lab.md).

iOS Appetize (local Mac preferred): see [`docs/appetize-ios.md`](docs/appetize-ios.md).

## First contribution

Implement the login screen UI in `app/(auth)/login.tsx` from the design file you were given.

Constraints:

1. Keep `useAuth().signIn` — do not invent a parallel auth path.
2. Reuse `Button` and `TextField` from `src/components` (extend them if needed).
3. Use tokens from `src/theme/tokens.ts` — no one-off hex colors in the screen.
4. Preserve `testID`s (`login-screen`, `login-email`, `login-password`, `login-submit`) so E2E keeps working.
5. Respect safe area + keyboard avoidance on small devices.

## Architecture notes

- Sessions live in Secure Store (`src/auth/session.ts`).
- Flip `EXPO_PUBLIC_USE_MOCK_AUTH=false` and point `EXPO_PUBLIC_API_URL` at the API when `/auth/login` is ready.
- Do not call Circle (or any custody SDK) from the mobile app.
