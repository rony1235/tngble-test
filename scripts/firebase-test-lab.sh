#!/usr/bin/env bash
# Run a Firebase Test Lab Robo smoke test against an Android APK.
#
# Usage:
#   ./scripts/firebase-test-lab.sh [path/to/app.apk]
#   APP_APK=./artifacts/app.apk ./scripts/firebase-test-lab.sh
#   DOWNLOAD_LATEST=1 ./scripts/firebase-test-lab.sh
#
# Required env:
#   FIREBASE_PROJECT_ID  (or GCLOUD_PROJECT / GOOGLE_CLOUD_PROJECT)
#
# Optional env:
#   TESTLAB_DEVICES   comma-separated --device specs (default: one virtual Pixel-class API 34)
#   TESTLAB_TIMEOUT   e.g. 5m (default: 5m)
#   TESTLAB_TYPE      robo | instrumentation (default: robo)
#   EAS_PROFILE       profile used when DOWNLOAD_LATEST=1 (default: testlab)
#   BUILD_IF_MISSING  when DOWNLOAD_LATEST=1, run eas build --wait if none (default: 1)
#   ARTIFACTS_DIR     download/output dir (default: ./.artifacts/testlab)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Load local env if present (does not override vars already set in the shell)
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

PROJECT_ID="${FIREBASE_PROJECT_ID:-${GCLOUD_PROJECT:-${GOOGLE_CLOUD_PROJECT:-}}}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "error: set FIREBASE_PROJECT_ID (or GCLOUD_PROJECT)" >&2
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "error: gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

ARTIFACTS_DIR="${ARTIFACTS_DIR:-$ROOT/.artifacts/testlab}"
mkdir -p "$ARTIFACTS_DIR"

APP_APK="${1:-${APP_APK:-}}"
DOWNLOAD_LATEST="${DOWNLOAD_LATEST:-0}"
BUILD_IF_MISSING="${BUILD_IF_MISSING:-1}"
EAS_PROFILE="${EAS_PROFILE:-testlab}"
TESTLAB_TYPE="${TESTLAB_TYPE:-robo}"
TESTLAB_TIMEOUT="${TESTLAB_TIMEOUT:-5m}"
# Virtual device — cheap default. Override with physical models via TESTLAB_DEVICES.
TESTLAB_DEVICES="${TESTLAB_DEVICES:-model=MediumPhone.arm,version=34,locale=en,orientation=portrait}"

eas_cmd() {
  if command -v eas >/dev/null 2>&1; then
    eas "$@"
  else
    pnpm dlx eas-cli "$@"
  fi
}

latest_finished_build_meta() {
  local list_json
  list_json="$(eas_cmd build:list \
    --platform android \
    --build-profile "$EAS_PROFILE" \
    --status finished \
    --limit 1 \
    --json \
    --non-interactive)"

  node -e '
    const builds = JSON.parse(require("fs").readFileSync(0, "utf8"));
    if (!Array.isArray(builds) || builds.length === 0) process.exit(2);
    const b = builds[0];
    const url = b?.artifacts?.applicationArchiveUrl || b?.artifacts?.buildUrl;
    if (!b.id || !url) process.exit(3);
    process.stdout.write(b.id + "\n" + url);
  ' <<<"$list_json"
}

ensure_eas_apk_build() {
  echo "No finished '$EAS_PROFILE' Android build found — starting EAS build (this can take ~10–20 min)..." >&2
  eas_cmd build \
    --platform android \
    --profile "$EAS_PROFILE" \
    --non-interactive \
    --wait
}

download_latest_eas_apk() {
  local out="$ARTIFACTS_DIR/app.apk"
  echo "Looking up latest finished EAS Android build (profile=$EAS_PROFILE)..." >&2

  local meta build_id build_url
  if ! meta="$(latest_finished_build_meta)"; then
    if [[ "$BUILD_IF_MISSING" != "1" ]]; then
      echo "error: no finished Android build found for profile '$EAS_PROFILE'." >&2
      echo "Run: pnpm dlx eas-cli build --platform android --profile $EAS_PROFILE --wait" >&2
      exit 1
    fi
    ensure_eas_apk_build
    meta="$(latest_finished_build_meta)" || {
      echo "error: EAS build finished but no downloadable Android artifact was found." >&2
      exit 1
    }
  fi

  build_url="$(echo "$meta" | sed -n '2p')"
  build_id="$(echo "$meta" | sed -n '1p')"

  echo "Downloading build $build_id ..." >&2
  curl -fsSL "$build_url" -o "$out"
  # Only the path goes to stdout (captured by resolve_apk)
  printf '%s\n' "$out"
}

resolve_apk() {
  if [[ -n "$APP_APK" ]]; then
    if [[ ! -f "$APP_APK" ]]; then
      echo "error: APK not found: $APP_APK" >&2
      exit 1
    fi
    echo "$APP_APK"
    return
  fi

  if [[ "$DOWNLOAD_LATEST" != "1" ]]; then
    echo "error: pass an APK path, or set DOWNLOAD_LATEST=1 to fetch the latest EAS $EAS_PROFILE Android build" >&2
    exit 1
  fi

  download_latest_eas_apk
}

APK_PATH="$(resolve_apk)"
echo "Using APK: $APK_PATH"
echo "Project:  $PROJECT_ID"
echo "Type:     $TESTLAB_TYPE"
echo "Timeout:  $TESTLAB_TIMEOUT"

DEVICE_ARGS=()
IFS=',' read -r -a DEVICE_SPECS <<< "$TESTLAB_DEVICES"
for spec in "${DEVICE_SPECS[@]}"; do
  spec="${spec#"${spec%%[![:space:]]*}"}"
  spec="${spec%"${spec##*[![:space:]]}"}"
  [[ -z "$spec" ]] && continue
  DEVICE_ARGS+=(--device "$spec")
done

gcloud firebase test android run \
  --project="$PROJECT_ID" \
  --type="$TESTLAB_TYPE" \
  --app="$APK_PATH" \
  --timeout="$TESTLAB_TIMEOUT" \
  --record-video \
  --client-details="matrixLabel=tngble-robo" \
  "${DEVICE_ARGS[@]}"
