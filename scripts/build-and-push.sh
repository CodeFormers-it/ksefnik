#!/usr/bin/env bash
set -euo pipefail

# ══════════════════════════════════════════════════════════════
# Build docs Docker image and push to GHCR
# Run on Mac Mini (arm64 → cross-compile to amd64 for VPS)
#
# Usage:
#   ./scripts/build-and-push.sh
# ══════════════════════════════════════════════════════════════

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="ghcr.io/codeformers-it"
IMAGE="${REGISTRY}/ksefnik-docs"
PLATFORM="linux/amd64"

# Load tokens: check repo .env, then runner home ~/.env.ksefnik
for env_candidate in "$REPO_ROOT/.env" "$HOME/.env.ksefnik"; do
  if [ -f "$env_candidate" ]; then
    [ -z "${REPO_TOKEN_GITHUB_PAT:-}" ] && \
      REPO_TOKEN_GITHUB_PAT=$(grep -E '^REPO_TOKEN_GITHUB_PAT=' "$env_candidate" | cut -d= -f2- || true)
    [ -z "${PRO_REPO_TOKEN:-}" ] && \
      PRO_REPO_TOKEN=$(grep -E '^PRO_REPO_TOKEN=' "$env_candidate" | cut -d= -f2- || true)
  fi
done

if [ -z "${REPO_TOKEN_GITHUB_PAT:-}" ]; then
  echo "ERROR: REPO_TOKEN_GITHUB_PAT not found."
  echo "       Place it in .env (repo root) or ~/.env.ksefnik (runner home)"
  exit 1
fi

GIT_SHA=$(git -C "$REPO_ROOT" rev-parse --short HEAD)

# Configure GHCR auth (bypass macOS osxkeychain)
DOCKER_CONFIG_DIR="$(mktemp -d)"
trap 'rm -rf "$DOCKER_CONFIG_DIR"' EXIT
AUTH_TOKEN=$(printf 'codeformers-it:%s' "$REPO_TOKEN_GITHUB_PAT" | base64)
cat > "$DOCKER_CONFIG_DIR/config.json" << DOCKEREOF
{"auths":{"ghcr.io":{"auth":"${AUTH_TOKEN}"}},"credsStore":""}
DOCKEREOF
if [ -d "$HOME/.docker/cli-plugins" ]; then
  ln -sf "$HOME/.docker/cli-plugins" "$DOCKER_CONFIG_DIR/cli-plugins"
fi
export DOCKER_CONFIG="$DOCKER_CONFIG_DIR"
echo "==> GHCR auth configured (platform: ${PLATFORM})"

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Building: ksefnik-docs (${GIT_SHA})"
echo "══════════════════════════════════════════════════════"

BUILD_ARGS=""
if [ -n "${PRO_REPO_TOKEN:-}" ]; then
  BUILD_ARGS="--build-arg PRO_REPO_TOKEN=${PRO_REPO_TOKEN}"
  echo "==> PRO_REPO_TOKEN provided — pro docs will be included"
else
  echo "==> No PRO_REPO_TOKEN — building public docs only"
fi

docker buildx build \
  --platform "$PLATFORM" \
  --push \
  -f "$REPO_ROOT/docker/docs.Dockerfile" \
  -t "${IMAGE}:latest" \
  -t "${IMAGE}:${GIT_SHA}" \
  $BUILD_ARGS \
  "$REPO_ROOT"

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Pushed: ${IMAGE}:latest | ${IMAGE}:${GIT_SHA}"
echo "══════════════════════════════════════════════════════"
