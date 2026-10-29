#!/usr/bin/env bash
# Runs every part's checks (typecheck, lint; the site also builds). Run before
# committing; CI runs the same.
set -euo pipefail
cd "$(dirname "$0")/.."

for dir in \
  examples/react-hono-postgres/backend \
  examples/react-hono-postgres/frontend \
  examples/nextjs-fullstack-postgres \
  site
do
  echo "› $dir"
  npm --prefix "$dir" run check
done

# Both tracks share one database design: their migrations must be identical.
echo "› drizzle/ folders"
diff -r examples/react-hono-postgres/backend/drizzle examples/nextjs-fullstack-postgres/drizzle
echo "identical"
