#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$PROJECT_DIR/docs/screenshots"
DEMO_DIR="$PROJECT_DIR/demo"

# ── Check dependencies ─────────────────────────────────────────────
if ! command -v cosmic-screenshot &>/dev/null; then
  echo "Error: 'cosmic-screenshot' not found."
  exit 1
fi

# ── Generate demo folders if missing ──────────────────────────────
if [ ! -d "$DEMO_DIR" ]; then
  echo "Demo folders not found, generating..."
  bash "$SCRIPT_DIR/create-demo.sh"
fi

mkdir -p "$OUT_DIR"

# ── Build the app (frontend + Rust) ───────────────────────────────
echo "Building the app (this may take a while)..."
cd "$PROJECT_DIR"
pnpm tauri build 2>&1 | tail -5

BINARY="$PROJECT_DIR/src-tauri/target/release/diverge"
if [ ! -f "$BINARY" ]; then
  echo "Error: binary not found at $BINARY"
  exit 1
fi

# ── Launch with demo folders ──────────────────────────────────────
echo "Launching Diverge with demo folders..."
"$BINARY" "$DEMO_DIR/origin" "$DEMO_DIR/destination" &
APP_PID=$!

cleanup() {
  echo "Cleaning up..."
  kill "$APP_PID" 2>/dev/null || true
  wait "$APP_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "Waiting for app to start and render..."
sleep 8

# ── Screenshot helper ─────────────────────────────────────────────
# cosmic-screenshot prints the saved path to stdout
take_screenshot() {
  local name="$1"
  local src
  src=$(cosmic-screenshot --interactive=true --notify=false 2>/dev/null)

  if [ -z "$src" ] || [ ! -f "$src" ]; then
    echo "  Warning: screenshot failed or was cancelled"
    return 1
  fi

  mv "$src" "$OUT_DIR/$name"
  echo "  Saved: $OUT_DIR/$name"
}

# ── Screenshot 1: Overview ────────────────────────────────────────
echo ""
echo "==> Screenshot 1/2: Overview"
echo "    Make sure the Diverge window is visible and focused."
read -rp "    Press Enter when ready..."
take_screenshot "01-overview.png"

# ── Screenshot 2: Diff view ──────────────────────────────────────
echo ""
echo "==> Screenshot 2/2: Diff view"
echo "    Select a file with differences (e.g. docker-compose.yml)."
read -rp "    Press Enter when ready..."
take_screenshot "02-diff-view.png"

echo ""
echo "Done! Screenshots saved to $OUT_DIR/"
ls -lh "$OUT_DIR"/*.png 2>/dev/null || true
