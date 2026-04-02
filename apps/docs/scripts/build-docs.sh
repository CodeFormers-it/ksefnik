#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTENT_DIR="$DOCS_DIR/src/content/docs"

# If PRO_REPO_TOKEN is set, clone ksefnik-pro and merge its docs content
if [ -n "${PRO_REPO_TOKEN:-}" ]; then
  echo "🔑 PRO_REPO_TOKEN detected — fetching pro documentation..."
  PRO_TMP=$(mktemp -d)
  trap "rm -rf $PRO_TMP" EXIT

  git clone --depth 1 "https://x:${PRO_REPO_TOKEN}@github.com/CodeFormers-it/ksefnik-pro.git" "$PRO_TMP"

  PRO_CONTENT="$PRO_TMP/docs/content"
  if [ -d "$PRO_CONTENT" ]; then
    echo "📦 Merging pro docs into content directory..."
    cp -r "$PRO_CONTENT"/* "$CONTENT_DIR/"
    echo "✅ Pro docs merged successfully"
  else
    echo "⚠️  No docs/content/ directory found in ksefnik-pro — skipping"
  fi
else
  echo "ℹ️  No PRO_REPO_TOKEN — building public docs only"
fi

# Build Astro site
cd "$DOCS_DIR"
astro build
