# AUTH-01 — Signed Android standalone build

Dev Client (`development` profile) is **not** a release binary. Current device work uses Dev Client on `iv8h955t4tbiizee`; generate a signed APK with the `standalone` (or `production`) profile when validating Auth0 without Metro.

## Profiles (`eas.json`)

| Profile | Dev Client? | Signed standalone? | Mock auth |
| --- | --- | --- | --- |
| `development` | Yes | No | true |
| `preview` | No | Yes (internal APK) | true |
| `standalone` | No | Yes (internal APK) | **false** (needs Auth0 env in EAS) |
| `production` | No | Yes (store/release) | false |

## Generate (owner account with EAS project access)

```bash
eas whoami
# Set EAS env for this profile first (see below)
eas build --platform android --profile standalone --non-interactive
```

Or mock-auth smoke APK:

```bash
eas build --platform android --profile preview --non-interactive
```

### EAS env (required for Auth0 standalone)

On the Expo project, set for profile `standalone` / `production`:

- `EXPO_PUBLIC_AUTH0_DOMAIN`
- `EXPO_PUBLIC_AUTH0_CLIENT_ID`
- `EXPO_PUBLIC_AUTH0_AUDIENCE` (optional)
- `EXPO_PUBLIC_USE_MOCK_AUTH=false` (already in `eas.json` for these profiles)

Install the resulting APK on device; no Metro required.

## Status

| Item | Status |
| --- | --- |
| Profile `standalone` in `eas.json` | Done |
| Auth0 env wired in EAS dashboard | Owner action |
| Signed APK generated / installed | Owner — run `eas build --profile standalone` when logged in as project member |
