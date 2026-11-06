#!/usr/bin/env bash
# Run the journeys against the hosted TEST project (thegallery-test).
#
# Needs: a Supabase access token scoped to thegallery-test, injected for api.supabase.com by the
# environment's network proxy (never in this repository); the app built and started with
# .env.local pointing at the test project and GALLERY_BASE_URL=http://127.0.0.1:3100.
# The helpers refuse the live project and the live site whatever this script is given.
set -euo pipefail
cd "$(dirname "$0")/.."

export NODE_USE_ENV_PROXY=1                      # Node's fetch must go through the proxy that injects the token
export NODE_EXTRA_CA_CERTS="${NODE_EXTRA_CA_CERTS:-/root/.ccr/ca-bundle.crt}"
export GALLERY_BASE_URL="http://127.0.0.1:3100"
export SUPABASE_URL="https://fbgrumcwlnoljkkbiqfe.supabase.co"
export PLAYWRIGHT_CHROMIUM="${PLAYWRIGHT_CHROMIUM:-$(ls /opt/pw-browsers/chromium-*/chrome-linux64/chrome 2>/dev/null | head -1)}"

# Refuse to test a stale server. A previous `next start` can keep the port after its launcher is
# killed; a new start then fails with EADDRINUSE and the old process answers with old page code
# (while public/ CSS is read fresh from disk). It happened on 2026-11-06 (ledger GAL-L0018).
BUILD_ID="$(cat .next/BUILD_ID 2>/dev/null || true)"
if [ -z "$BUILD_ID" ] || ! curl -fsS "$GALLERY_BASE_URL/about" | grep -q "$BUILD_ID"; then
  echo "refusing: the server at $GALLERY_BASE_URL is not serving the current build (${BUILD_ID:-no .next/BUILD_ID})" >&2
  exit 2
fi

node --no-warnings --experimental-strip-types e2e/support/seed-test-project.ts
npx playwright test "$@"
