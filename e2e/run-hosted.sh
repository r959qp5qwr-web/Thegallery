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

# One run at a time. The journeys share one test project: two runs seed and delete each other's
# rows, and both results are void. It happened on 2026-11-06 (ledger GAL-L0020).
exec 9>"${TMPDIR:-/tmp}/thegallery-journeys.lock"
if ! flock -n 9; then
  echo "refusing: another journey run holds the test project" >&2
  exit 3
fi

node --no-warnings --experimental-strip-types e2e/support/seed-test-project.ts
# A full run (no spec file or -g filter) that exits clean writes a suite receipt per project for the
# gate (scripts/app-sweep-gate.py): the sweep, standard and drill receipts alone do not prove the
# other journeys passed. Any failure, filter or partial run writes no receipt and removes the old one.
full=1; projects=""
for a in "$@"; do
  case "$a" in
    --project=*) projects="$projects ${a#--project=}" ;;
    -g|--grep|--grep=*|-g=*|*.spec.ts|e2e/*) full=0 ;;
  esac
done
[ -z "$projects" ] && projects="phone desktop"
for p in $projects; do rm -f ".doctrine/runtime/suite-$p.json"; done
set +e
npx playwright test "$@"
code=$?
set -e
if [ "$code" -eq 0 ] && [ "$full" -eq 1 ]; then
  for p in $projects; do python3 scripts/app-sweep-gate.py suite-receipt "$p"; done
fi
exit "$code"
