#!/usr/bin/env bash
# Builds the guide (site/) and syncs it to the VPS, where Caddy serves
# DEPLOY_DIR directly (no restart or sudo needed).
#
# Server details live in site/.env.prod.local (git-ignored); see site/.env.example.
#   scripts/deploy-site.sh            check, build and upload
#   DRY_RUN=1 scripts/deploy-site.sh  preview the upload without changing anything
set -euo pipefail
cd "$(dirname "$0")/../site"

URL="https://seedhi.pknspace.com"

if [ ! -f .env.prod.local ]; then
  echo "Missing site/.env.prod.local. Copy site/.env.example and fill in the DEPLOY_* values." >&2
  exit 1
fi
# Read KEY=VALUE lines literally; the file is not sourced as shell.
# Surrounding quotes are stripped.
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*) continue ;; esac
  key="${line%%=*}"
  value="${line#*=}"
  value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
  export "$key=$value"
done < .env.prod.local
: "${DEPLOY_HOST:?DEPLOY_HOST is not set in site/.env.prod.local}"
: "${DEPLOY_PORT:?DEPLOY_PORT is not set in site/.env.prod.local}"
: "${DEPLOY_DIR:?DEPLOY_DIR is not set in site/.env.prod.local}"

echo "› Check + build"
npm run check

echo "› Upload"
rsync -avz --delete ${DRY_RUN:+--dry-run} \
  -e "ssh -p $DEPLOY_PORT" \
  dist/ "$DEPLOY_HOST:$DEPLOY_DIR/"

if [ -n "${DRY_RUN:-}" ]; then
  echo "Dry run: nothing was uploaded."
else
  echo "Deployed to $URL"
fi
