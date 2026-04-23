#!/usr/bin/env bash
set -u

ROOT_DIR="/workspace"
SETUP_FLAG="$ROOT_DIR/.devcontainer/.setup-complete"
LOG_PREFIX="[devcontainer post-create]"

mkdir -p "$ROOT_DIR/.devcontainer"

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

echo "$LOG_PREFIX installing workspace dependencies..."
cd "$ROOT_DIR"
npm install

echo "$LOG_PREFIX installing multi-app dependencies..."
npm run install
