# AUTH-01 — Signed Android standalone build

Dev Client (`development` profile) is **not** a release binary.

## Profiles (`eas.json`)

| Profile | Dev Client? | Signed standalone? | Mock auth |
| --- | --- | --- | --- |
| `development` | Yes | No | true |
| `preview` | No | Yes (internal APK) | true |
| `standalone` | No | Yes (internal APK) | **false** (needs Auth0 env in EAS) |
| `production` | No | Yes (store/release) | false |

## Generate (owner account with EAS project access)

Logged-in Expo user must be a member of project `2ff09bdf-727e-4355-b185-4359bb9795c9` (`tngble`).

```bash
eas whoami
eas build --platform android --profile standalone --non-interactive
```

Or mock-auth smoke APK:

```bash
eas build --platform android --profile preview --non-interactive
```

Set EAS project secrets / env for `EXPO_PUBLIC_AUTH0_DOMAIN` and `EXPO_PUBLIC_AUTH0_CLIENT_ID` on `standalone` / `production`.

## Status

| Item | Status |
| --- | --- |
| Profile `standalone` added | Done |
| Build submitted from this machine | **Blocked** — Expo user lacks READ on AppEntity (need `eas login` as project member) |
