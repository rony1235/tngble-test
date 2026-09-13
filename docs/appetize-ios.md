# Appetize (iOS Simulator)

Share a clickable iOS Simulator build in the browser. Day-to-day work still uses local Simulator (`pnpm ios`); Appetize is for demos / review links.

Appetize does **not** compile the app. You build a simulator binary (preferably on your Mac with EAS `--local`), then upload it.

## One-time Mac setup

Local EAS iOS builds need:

| Tool | Check | Install |
|---|---|---|
| Xcode | `xcodebuild -version` | App Store → Xcode, then open once |
| CocoaPods | `pod --version` | `brew install cocoapods` |
| fastlane | `fastlane --version` | `brew install fastlane` |
| Expo login | `pnpm dlx eas-cli whoami` | `pnpm dlx eas-cli login` |

Also set in `.env`:

```bash
APPETIZE_API_TOKEN=…          # Appetize → Organization → API Token
# APPETIZE_PUBLIC_KEY=…       # after first upload, reuse the same Appetize URL
```

The `appetize` profile in `eas.json` builds an **unsigned iOS Simulator** app with mock auth (`withoutCredentials` + `ios.simulator: true`). No Apple Developer account required.

## Preferred flow (local Mac)

Build on your machine and upload in one step:

```bash
pnpm appetize:ios:local
```

That runs `eas build --local` → writes `.artifacts/appetize/app.tar.gz` → uploads to Appetize.

Or split the steps:

```bash
pnpm build:ios:appetize
pnpm appetize:ios ./.artifacts/appetize/app.tar.gz
```

Re-upload an existing artifact (no rebuild):

```bash
pnpm appetize:ios ./.artifacts/appetize/app.tar.gz
```

## Cloud fallback

If you are not on a Mac (or want Expo’s builders):

```bash
pnpm build:ios:appetize:cloud   # starts cloud build (add --wait if you want to block)
pnpm appetize:ios:latest        # download latest finished cloud artifact + upload
```

`appetize:ios:latest` only sees **cloud** finished builds. Local `--local` artifacts stay on disk and are not downloadable via `eas build:list`.

## Tips

- After the first upload, put `APPETIZE_PUBLIC_KEY=…` in `.env` so later uploads update the same Appetize URL.
- Rebuild only when the binary should change; otherwise re-upload the existing `.tar.gz`.
- Debug a stuck local build with `EAS_LOCAL_BUILD_SKIP_CLEANUP=1` (see [Expo local builds](https://docs.expo.dev/build-reference/local-builds/)).
