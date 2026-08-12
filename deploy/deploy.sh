#!/usr/bin/env bash
# Hey Jesus — server-side deploy script.
# Run on the server (also invoked by the GitHub Actions deploy workflow).
set -euo pipefail

APP_DIR="/opt/hey-jesus"
cd "$APP_DIR"

echo "==> Pulling latest main"
git fetch origin main
git reset --hard origin/main

echo "==> Rebuilding and restarting containers"
docker compose up -d --build

echo "==> Pruning dangling images"
docker image prune -f >/dev/null

echo "==> Deployed $(git rev-parse --short HEAD) at $(date -u +%FT%TZ)"
