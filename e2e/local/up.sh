#!/usr/bin/env bash
# Start the LOCAL test stack and prepare it exactly as the hosted test project is prepared:
# the product's migrations, the test mail hook (e2e/support/test-project.sql) and the private
# image bucket. Journeys then run with GALLERY_TEST_TARGET=local (e2e/run-hosted.sh).
#
# Why it exists: the hosted test project (thegallery-test) is paused to keep within the Supabase
# Free plan's two active projects (governor, 2026-11-13). Never point anything here at the live
# project; e2e/helpers.ts refuses it whatever it is given.
#
# Needs Docker. Images come from public.ecr.aws (Docker Hub rate-limits shared addresses).
set -euo pipefail
cd "$(dirname "$0")"
REPO="$(cd ../.. && pwd)"
DB="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

docker info >/dev/null 2>&1 || { (dockerd >/tmp/dockerd.log 2>&1 &); sleep 5; }
# PostgREST will not start while an exposed schema is missing, so the product's schema loads with
# the database: generated here from db/migrations on every start, never edited, never committed.
mkdir -p supabase/migrations
rm -f supabase/migrations/*.sql
out=supabase/migrations/00000000000001_gallery.sql
{ for f in "$REPO"/db/migrations/*.sql; do echo "-- ===== $(basename "$f")"; sed 's/@schema@/gallery/g' "$f"; echo; done
  echo "-- ===== e2e/support/test-project.sql"; cat "$REPO/e2e/support/test-project.sql"
  echo "INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-images', 'gallery-images', false)"
  echo "  ON CONFLICT (id) DO UPDATE SET public = false;"
} > "$out"
# Only what the product uses: database, auth, REST, storage, the API gateway and the mail catcher.
npx -y supabase@2.122.1 start \
  -x studio,realtime,edge-runtime,logflare,vector,supavisor,imgproxy,postgres-meta
echo "local test stack ready: SUPABASE_URL=http://127.0.0.1:54321"
