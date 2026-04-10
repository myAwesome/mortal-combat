#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── 1. Server ────────────────────────────────────────────────────────────────
echo "[server] Starting with DB_HOST=${DB_HOST:-localhost} DB_PORT=${DB_PORT:-3306}..."
npm --prefix "$ROOT" start &
SERVER_PID=$!

# ── 2. Client ────────────────────────────────────────────────────────────────
echo "[client] Starting..."
npm --prefix "$ROOT/client" run dev &
CLIENT_PID=$!

# ── Wait ─────────────────────────────────────────────────────────────────────
echo ""
echo "All services running. Press Ctrl+C to stop."
wait "$SERVER_PID" "$CLIENT_PID"
