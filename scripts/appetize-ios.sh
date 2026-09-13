#!/usr/bin/env bash
# Upload an iOS Simulator build to Appetize.
#
# Usage:
#   ./scripts/appetize-ios.sh [path/to/App.tar.gz|App.zip|App.app]
#   LOCAL=1 ./scripts/appetize-ios.sh
#   DOWNLOAD_LATEST=1 ./scripts/appetize-ios.sh
#
# Required env:
#   APPETIZE_API_TOKEN
#
# Optional env:
#   APPETIZE_PUBLIC_KEY  update this app instead of creating a new one
#   EAS_PROFILE          profile used for local / DOWNLOAD_LATEST (default: appetize)
#   LOCAL                when 1, run eas build --local then upload (preferred on Mac)
#   DOWNLOAD_LATEST      when 1, download latest finished cloud EAS build
#   BUILD_IF_MISSING     when DOWNLOAD_LATEST=1, run eas build --wait if none (default: 1)
#   ARTIFACTS_DIR        download/output dir (default: ./.artifacts/appetize)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

if [[ -z "${APPETIZE_API_TOKEN:-}" ]]; then
  echo "error: set APPETIZE_API_TOKEN (Appetize → Organization → API Token)" >&2
  exit 1
fi

ARTIFACTS_DIR="${ARTIFACTS_DIR:-$ROOT/.artifacts/appetize}"
mkdir -p "$ARTIFACTS_DIR"

APP_FILE="${1:-${APP_FILE:-}}"
LOCAL="${LOCAL:-0}"
DOWNLOAD_LATEST="${DOWNLOAD_LATEST:-0}"
BUILD_IF_MISSING="${BUILD_IF_MISSING:-1}"
EAS_PROFILE="${EAS_PROFILE:-appetize}"
LOCAL_ARTIFACT="${ARTIFACTS_DIR}/app.tar.gz"

eas_cmd() {
  if command -v eas >/dev/null 2>&1; then
    eas "$@"
  elif [[ -x "$ROOT/node_modules/.bin/eas" ]]; then
    pnpm exec eas "$@"
  else
    pnpm dlx eas-cli "$@"
  fi
}

require_local_toolchain() {
  local missing=0
  if ! command -v xcodebuild >/dev/null 2>&1; then
    echo "error: Xcode / xcodebuild not found. Install Xcode from the App Store." >&2
    missing=1
  fi
  if ! command -v pod >/dev/null 2>&1; then
    echo "error: CocoaPods not found. Install with: brew install cocoapods" >&2
    missing=1
  fi
  if ! command -v fastlane >/dev/null 2>&1; then
    echo "error: fastlane not found. Install with: brew install fastlane" >&2
    missing=1
  fi
  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
}

run_local_eas_ios_build() {
  require_local_toolchain
  echo "Building iOS simulator app locally (profile=$EAS_PROFILE)..." >&2
  echo "Output → $LOCAL_ARTIFACT" >&2
  # EAS logs to stdout; keep only the artifact path on stdout for callers.
  eas_cmd build \
    --platform ios \
    --profile "$EAS_PROFILE" \
    --local \
    --non-interactive \
    --output "$LOCAL_ARTIFACT" >&2
  if [[ ! -f "$LOCAL_ARTIFACT" ]]; then
    echo "error: local EAS build finished but artifact missing: $LOCAL_ARTIFACT" >&2
    exit 1
  fi
  printf '%s\n' "$LOCAL_ARTIFACT"
}

latest_finished_build_meta() {
  local list_json
  list_json="$(eas_cmd build:list \
    --platform ios \
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

ensure_eas_ios_build() {
  echo "No finished '$EAS_PROFILE' iOS build found — starting EAS cloud simulator build (this can take ~10–20 min)..." >&2
  echo "Tip: on a Mac prefer LOCAL=1 (pnpm appetize:ios:local) instead." >&2
  eas_cmd build \
    --platform ios \
    --profile "$EAS_PROFILE" \
    --non-interactive \
    --wait
}

download_latest_eas_ios() {
  local out="$ARTIFACTS_DIR/app.tar.gz"
  echo "Looking up latest finished EAS iOS build (profile=$EAS_PROFILE)..." >&2

  local meta build_id build_url
  if ! meta="$(latest_finished_build_meta)"; then
    if [[ "$BUILD_IF_MISSING" != "1" ]]; then
      echo "error: no finished iOS build found for profile '$EAS_PROFILE'." >&2
      echo "Run: pnpm build:ios:appetize:local   # or cloud: pnpm build:ios:appetize:cloud" >&2
      exit 1
    fi
    ensure_eas_ios_build
    meta="$(latest_finished_build_meta)" || {
      echo "error: EAS build finished but no downloadable iOS artifact was found." >&2
      exit 1
    }
  fi

  build_url="$(echo "$meta" | sed -n '2p')"
  build_id="$(echo "$meta" | sed -n '1p')"

  echo "Downloading build $build_id ..." >&2
  curl -fsSL "$build_url" -o "$out"
  printf '%s\n' "$out"
}

prepare_upload() {
  local src="$1"
  local ext="${src##*.}"
  local base
  base="$(basename "$src")"

  if [[ -d "$src" && "$base" == *.app ]]; then
    local zip_path="$ARTIFACTS_DIR/${base%.app}.zip"
    echo "Zipping $src → $zip_path" >&2
    ditto -c -k --keepParent "$src" "$zip_path"
    echo "$zip_path"
    return
  fi

  if [[ ! -f "$src" ]]; then
    echo "error: file not found: $src" >&2
    exit 1
  fi

  case "$ext" in
    zip|gz|tgz)
      echo "$src"
      ;;
    app)
      echo "error: pass a directory ending in .app, or zip it first" >&2
      exit 1
      ;;
    *)
      echo "error: Appetize needs a .zip, .tar.gz, or .app simulator build (got $src)" >&2
      exit 1
      ;;
  esac
}

resolve_app() {
  if [[ -n "$APP_FILE" ]]; then
    prepare_upload "$APP_FILE"
    return
  fi

  if [[ "$LOCAL" == "1" ]]; then
    prepare_upload "$(run_local_eas_ios_build)"
    return
  fi

  if [[ "$DOWNLOAD_LATEST" != "1" ]]; then
    echo "error: pass an iOS simulator build path, or set LOCAL=1 / DOWNLOAD_LATEST=1" >&2
    echo "Example: pnpm appetize:ios:local" >&2
    exit 1
  fi

  prepare_upload "$(download_latest_eas_ios)"
}

UPLOAD_PATH="$(resolve_app)"
echo "Uploading: $UPLOAD_PATH"

ENDPOINT="https://api.appetize.io/v1/apps"
if [[ -n "${APPETIZE_PUBLIC_KEY:-}" ]]; then
  ENDPOINT="https://api.appetize.io/v1/apps/${APPETIZE_PUBLIC_KEY}"
  echo "Updating Appetize app ${APPETIZE_PUBLIC_KEY}"
else
  echo "Creating a new Appetize app"
fi

RESPONSE="$(curl -sS -X POST "$ENDPOINT" \
  -H "X-API-KEY: $APPETIZE_API_TOKEN" \
  -F "file=@${UPLOAD_PATH}" \
  -F "platform=ios")"

node -e '
  const raw = process.argv[1];
  let data;
  try { data = JSON.parse(raw); } catch {
    console.error("error: Appetize returned non-JSON:\n" + raw);
    process.exit(1);
  }
  if (data.error || data.message && !data.publicKey) {
    console.error("error: Appetize upload failed");
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }
  const key = data.publicKey;
  if (!key) {
    console.error("error: no publicKey in Appetize response");
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log("publicKey: " + key);
  console.log("Open:      https://appetize.io/app/" + key);
  console.log("Add APPETIZE_PUBLIC_KEY=" + key + " to .env to reuse this app next time.");
' "$RESPONSE"
