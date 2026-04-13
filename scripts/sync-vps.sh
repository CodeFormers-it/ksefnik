#!/usr/bin/env bash
set -euo pipefail

# ══════════════════════════════════════════════════════════════
# Sync deployment files to VPS
# Run from your local machine (not on VPS)
#
# Usage:
#   ./scripts/sync-vps.sh              # sync all files
#   ./scripts/sync-vps.sh --init       # first-time setup
# ══════════════════════════════════════════════════════════════

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-codeformers}"
VPS_DIR="/home/ubuntu/ksefnik.pl"

echo "==> Target: ${VPS_HOST}:${VPS_DIR}"

# Create directory structure
ssh "$VPS_HOST" "mkdir -p ${VPS_DIR}/scripts ${VPS_DIR}/logs"

# Sync deployment files
echo "==> Syncing docker-compose.prod.yml..."
scp "$REPO_ROOT/docker-compose.prod.yml" "${VPS_HOST}:${VPS_DIR}/"

echo "==> Syncing scripts..."
scp "$REPO_ROOT/scripts/deploy.sh" "${VPS_HOST}:${VPS_DIR}/scripts/"
ssh "$VPS_HOST" "chmod +x ${VPS_DIR}/scripts/deploy.sh"

echo "==> Files synced."
echo ""
echo "    NOTE: Nginx configs are managed in ksefnik-pro."
echo "    Run ksefnik-pro/scripts/sync-nginx.sh to deploy nginx changes."

# First-time setup
if [ "${1:-}" = "--init" ]; then
  echo ""
  echo "══════════════════════════════════════════════════════"
  echo "  First-time VPS setup for ksefnik.pl"
  echo "══════════════════════════════════════════════════════"

  # Copy .env if not exists
  ssh "$VPS_HOST" "test -f ${VPS_DIR}/.env" 2>/dev/null || {
    echo "==> Creating .env from template..."
    scp "$REPO_ROOT/.env.prod.example" "${VPS_HOST}:${VPS_DIR}/.env"
    echo "    IMPORTANT: Edit .env on VPS with real values:"
    echo "    ssh ${VPS_HOST} \"nano ${VPS_DIR}/.env\""
  }

  # Login to GHCR
  echo ""
  echo "==> Logging into GHCR on VPS..."
  ssh "$VPS_HOST" "source ${VPS_DIR}/.env 2>/dev/null && \
    echo \"\$REPO_TOKEN_GITHUB_PAT\" | docker login ghcr.io -u codeformers-it --password-stdin" 2>&1 || {
    echo "    GHCR login failed — fill REPO_TOKEN_GITHUB_PAT in .env first"
  }

  echo ""
  echo "══════════════════════════════════════════════════════"
  echo "  Init done. Next steps:"
  echo "  1. ssh ${VPS_HOST} \"nano ${VPS_DIR}/.env\"  (fill REPO_TOKEN_GITHUB_PAT)"
  echo "  2. ssh ${VPS_HOST} \"cd ${VPS_DIR} && ./scripts/deploy.sh\""
  echo "══════════════════════════════════════════════════════"
fi
