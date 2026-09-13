# Firebase Test Lab (Android Robo)

Cloud device smoke testing for TNGBLE. This is **not** a local Android emulator replacement — you still use iOS Simulator / a phone for day-to-day Expo work. Test Lab runs a built APK on Google’s devices and crawls the UI (Robo) looking for crashes.

## One-time setup

### 1. Firebase / GCP project

1. Create (or pick) a project in the [Firebase console](https://console.firebase.google.com/).
2. **Spark (free) is enough** for light use — no Blaze upgrade required. Daily Spark quotas are roughly:
   - **10 virtual-device** test runs / day
   - **5 physical-device** test runs / day  
   (One matrix with N devices counts as N runs.) Upgrade to Blaze only if you need more than that.
3. Enable APIs on the linked GCP project:
   - Cloud Testing API
   - Cloud Tool Results API
4. Note the **project id** (e.g. `tngble-xxxxx`).

### 2. Local `gcloud`

```bash
# https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project YOUR_FIREBASE_PROJECT_ID
```

### 3. EAS Android APK (testlab profile)

```bash
pnpm exec eas build --platform android --profile testlab --wait
```

`eas.json` → `testlab` builds an unsigned APK with mock auth enabled (good for Robo).

## Run locally

Copy `.env.example` → `.env` (if you have not already) and set:

```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
```

The Test Lab script loads `.env` automatically.

```bash
# After an EAS testlab build exists:
pnpm testlab:android:latest

# Or point at an APK you already have:
pnpm testlab:android /path/to/app.apk
```

Optional (in `.env` or the shell):

```bash
TESTLAB_TIMEOUT=8m
TESTLAB_DEVICES=model=MediumPhone.arm,version=34,locale=en,orientation=portrait
# Physical device example (uses Spark physical quota):
# TESTLAB_DEVICES=model=oriole,version=33,locale=en,orientation=portrait
```

List available devices:

```bash
gcloud firebase test android models list
```

Results appear in the terminal and in **Firebase console → Test Lab**.

## GitHub Actions

Workflow: [`.github/workflows/firebase-test-lab.yml`](../.github/workflows/firebase-test-lab.yml) (manual **workflow_dispatch** only).

### Secrets

| Secret | Purpose |
|---|---|
| `FIREBASE_PROJECT_ID` | GCP / Firebase project id |
| `GCP_SA_KEY` | Service account JSON with roles: **Firebase Test Lab Admin**, **Firebase Viewer** (and access to create Tool Results) |
| `EAS_TOKEN` | [Expo access token](https://expo.dev/accounts/[account]/settings/access-tokens) |

### Optional variable

| Variable | Purpose |
|---|---|
| `TESTLAB_DEVICES` | Override device matrix (comma-separated `--device` specs) |

Create a GCP service account key, store the full JSON as `GCP_SA_KEY`, then run **Actions → Firebase Test Lab → Run workflow**.

## Notes

- Robo is a smoke/crawl — it is not a replacement for Maestro flows in `e2e/`.
- Prefer virtual devices (`MediumPhone.arm`, etc.) to stay within Spark’s free daily quota; use physical models sparingly.
- Keep this workflow manual; even on Spark, daily quotas are finite.
