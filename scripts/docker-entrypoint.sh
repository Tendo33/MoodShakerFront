#!/bin/sh
# Applies migrations (retrying while the database starts), seeds the classics,
# then starts Next. Migrations are versioned files in ./drizzle — never a schema push.
set -e

attempt=0
until pnpm db:migrate; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "Database still unreachable after $attempt attempts." >&2
    exit 1
  fi
  echo "Waiting for the database ($attempt/30)..."
  sleep 2
done

pnpm db:seed
exec pnpm start
