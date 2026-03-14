#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
  docker compose -f "$ROOT/docker-compose.yml" stop
}
trap cleanup EXIT INT TERM

# ── 1. DB ────────────────────────────────────────────────────────────────────
echo "[db] Starting MySQL..."
docker compose -f "$ROOT/docker-compose.yml" up -d

echo "[db] Waiting for MySQL to be ready..."
until docker compose -f "$ROOT/docker-compose.yml" exec -T db \
    mysqladmin ping -uroot -proot --silent 2>/dev/null; do
  sleep 1
done
echo "[db] Ready."

# ── 2. Server ────────────────────────────────────────────────────────────────
echo "[server] Starting..."
npm --prefix "$ROOT" start &
SERVER_PID=$!

# ── 3. Client ────────────────────────────────────────────────────────────────
echo "[client] Starting..."
npm --prefix "$ROOT/client" run dev &
CLIENT_PID=$!

# ── Wait ─────────────────────────────────────────────────────────────────────
echo ""
echo "All services running. Press Ctrl+C to stop."
wait "$SERVER_PID" "$CLIENT_PID"
