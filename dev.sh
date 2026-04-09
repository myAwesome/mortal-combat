#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
DB_PORT="${DB_PORT:-3306}"

is_port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1
    return
  fi
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$1" >/dev/null 2>&1
    return
  fi
  return 1
}

if is_port_in_use "$DB_PORT"; then
  for candidate in $(seq 3307 3399); do
    if ! is_port_in_use "$candidate"; then
      DB_PORT="$candidate"
      break
    fi
  done
fi

if is_port_in_use "$DB_PORT"; then
  echo "[db] No free MySQL host port found in range 3306-3399."
  exit 1
fi

export DB_PORT

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
  docker compose -f "$ROOT/docker-compose.yml" stop
}
trap cleanup EXIT INT TERM

# ── 1. DB ────────────────────────────────────────────────────────────────────
echo "[db] Starting MySQL on localhost:${DB_PORT}..."
docker compose -f "$ROOT/docker-compose.yml" up -d

echo "[db] Waiting for MySQL to be ready..."
until docker compose -f "$ROOT/docker-compose.yml" exec -T db \
    mysqladmin ping -uroot -proot --silent 2>/dev/null; do
  sleep 1
done
echo "[db] Ready."

# ── 2. Server ────────────────────────────────────────────────────────────────
echo "[server] Starting with DB_PORT=${DB_PORT}..."
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
