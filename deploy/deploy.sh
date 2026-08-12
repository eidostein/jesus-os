#!/usr/bin/env bash
# Hey Jesus — server-side deploy script.
# Run on the server (also invoked by the GitHub Actions deploy workflow).
set -euo pipefail

APP_DIR="/opt/hey-jesus"
cd "$APP_DIR"

echo "==> Pulling latest main"
git fetch origin main
git reset --hard origin/main

echo "==> Seeding new knowledge files (never overwriting live edits)"
KNOW_DIR="${KNOWLEDGE_HOST_DIR:-/opt/hey-jesus-data/knowledge}"
mkdir -p "$KNOW_DIR"
cp -n knowledge/* "$KNOW_DIR/" 2>/dev/null || true
# The app container runs as user node (uid 1000) and must be able to write.
chown -R 1000:1000 "$KNOW_DIR"

echo "==> Rebuilding the /os dashboard snapshot"
python3 os/scripts/build.py 2>/dev/null || echo "    (python3 unavailable — keeping committed data.js)"

echo "==> Rebuilding and restarting containers"
docker compose up -d --build

echo "==> Pruning dangling images"
docker image prune -f >/dev/null

echo "==> Deployed $(git rev-parse --short HEAD) at $(date -u +%FT%TZ)"
