#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Uniprix CMS Worker deploy"
echo

if ! npx wrangler whoami >/dev/null 2>&1; then
  echo "Not logged in to Cloudflare."
  echo "Run: npx wrangler login"
  echo "Then run this script again."
  exit 1
fi

echo "Cloudflare account:"
npx wrangler whoami
echo

echo "Deploying worker..."
npx wrangler deploy

echo
echo "Done. Copy the workers.dev URL above into admin/config.json as apiUrl, then rebuild and push the site."
