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

node --no-warnings --experimental-strip-types e2e/support/seed-test-project.ts
npx playwright test "$@"
