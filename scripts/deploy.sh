#!/usr/bin/env bash
set -euo pipefail

# ══════════════════════════════════════════════════════════════
# Deploy ksefnik docs to VPS
# Run on VPS from the deployment directory
#
# Usage:
#   ./scripts/deploy.sh
# ══════════════════════════════════════════════════════════════

DEPLOY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DEPLOY_DIR"

LOG_DIR="${LOG_DIR:-./logs}"
mkdir -p "$LOG_DIR"

# Load env
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

# ── GHCR login ───────────────────────────────────────────────
if [ -n "${REPO_TOKEN_GITHUB_PAT:-}" ]; then
  echo "==> Logging in to GHCR..."
  echo "$REPO_TOKEN_GITHUB_PAT" | docker login ghcr.io -u codeformers-it --password-stdin 2>> "${LOG_DIR}/deploy.log"
fi

# ── Pull images ──────────────────────────────────────────────
echo "==> Pulling latest image..."
docker compose -f docker-compose.prod.yml pull 2>> "${LOG_DIR}/deploy.log"

# ── Start services ───────────────────────────────────────────
echo "==> Starting services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans 2>> "${LOG_DIR}/deploy.log"

# ── Health check ─────────────────────────────────────────────
echo "==> Waiting for health check (10s)..."
sleep 10

echo "==> Service status:"
docker compose -f docker-compose.prod.yml ps

echo "==> Cleaning up old images..."
docker image prune -f >> "${LOG_DIR}/deploy.log" 2>&1

echo "==> Deploy complete!"
