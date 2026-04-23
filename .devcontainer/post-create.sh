#!/usr/bin/env bash
set -u

ROOT_DIR="/workspace"
SETUP_FLAG="$ROOT_DIR/.devcontainer/.setup-complete"
LOG_PREFIX="[devcontainer post-create]"

mkdir -p "$ROOT_DIR/.devcontainer"

run_with_retry() {
  local label="$1"
  local max_attempts="$2"
  shift 2

  local attempt=1
  local delay=3
  while [ "$attempt" -le "$max_attempts" ]; do
    echo "$LOG_PREFIX $label (attempt $attempt/$max_attempts)..."
    if "$@"; then
      return 0
    fi

    if [ "$attempt" -lt "$max_attempts" ]; then
      echo "$LOG_PREFIX $label failed, retrying in ${delay}s..." >&2
      sleep "$delay"
      delay=$((delay * 2))
    fi
    attempt=$((attempt + 1))
  done

  echo "$LOG_PREFIX $label failed after $max_attempts attempts." >&2
  return 1
}

finalize() {
  local exit_code="$1"
  if [ "$exit_code" -eq 0 ]; then
    echo "$LOG_PREFIX setup finished successfully."
  else
    echo "$LOG_PREFIX setup finished with errors (exit code: $exit_code)." >&2
    echo "$LOG_PREFIX creating setup-complete marker to avoid startup deadlock." >&2
  fi
  touch "$SETUP_FLAG"
}

trap 'finalize $?' EXIT

cd "$ROOT_DIR"
npm config set fetch-retries 5
npm config set fetch-retry-factor 2
npm config set fetch-retry-mintimeout 2000
npm config set fetch-retry-maxtimeout 30000

run_with_retry "installing workspace dependencies" 3 npm install || true
run_with_retry "installing multi-app dependencies" 3 npm run install || true
