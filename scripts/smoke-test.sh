#!/usr/bin/env bash
# Smoke test: is the guestbook at BASE_URL up and doing its job? Checks the
# health endpoint, the page, a validation error, and posts an entry and reads
# it back. CI runs it against the images in the runner (lesson 5.2); the deploy
# workflows run it against staging and production.
#   scripts/smoke-test.sh http://localhost:8080
#   READ_ONLY=1 scripts/smoke-test.sh https://guestbook.example.com   # no POST
#   EXPECT_VERSION=<sha> …   # health must report this version (after a deploy)
set -euo pipefail

BASE_URL="${1:?usage: scripts/smoke-test.sh <base-url>}"
BASE_URL="${BASE_URL%/}"
body=$(mktemp)
trap 'rm -f "$body"' EXIT

fail() { echo "FAIL: $*" >&2; [ -s "$body" ] && cat "$body" >&2 && echo >&2; exit 1; }
pass() { echo "ok   $*"; }

# request METHOD PATH [JSON]: prints the status code, leaves the body in $body.
request() {
  local args=(-s -o "$body" -w '%{http_code}' -X "$1" "$BASE_URL$2")
  [ $# -ge 3 ] && args+=(-H 'content-type: application/json' -d "$3")
  curl "${args[@]}" || true   # -w already printed 000 if it could not connect
}

# The app may still be starting: retry health for up to 30 s.
version="\"version\":\"${EXPECT_VERSION:-}"
for i in $(seq 1 15); do
  status=$(request GET /api/health)
  [ "$status" = 200 ] && grep -q "$version" "$body" && break
  sleep 2
done
[ "$status" = 200 ] || fail "GET /api/health returned $status"
grep -q '"db":"up"' "$body" || fail "health does not report db up"
grep -q "$version\"" "$body" || [ -z "${EXPECT_VERSION:-}" ] ||
  fail "health does not report version $EXPECT_VERSION"
pass "GET /api/health  $(cat "$body")"

status=$(request GET /)
[ "$status" = 200 ] || fail "GET / returned $status"
grep -qi '<html' "$body" || fail "GET / is not an HTML page"
pass "GET /            200, HTML"

status=$(request POST /api/entries '{"name":"","message":""}')
[ "$status" = 400 ] || fail "invalid POST returned $status, expected 400"
grep -q '"code":"VALIDATION_FAILED"' "$body" || fail "invalid POST has no VALIDATION_FAILED"
pass "POST invalid     400 VALIDATION_FAILED"

if [ "${READ_ONLY:-0}" = 1 ]; then
  status=$(request GET /api/entries)
  [ "$status" = 200 ] || fail "GET /api/entries returned $status"
  pass "GET /api/entries 200"
else
  message="Smoke test $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  status=$(request POST /api/entries "{\"name\":\"Smoke test\",\"message\":\"$message\"}")
  [ "$status" = 201 ] || fail "POST /api/entries returned $status, expected 201"
  pass "POST /api/entries 201"
  status=$(request GET /api/entries)
  [ "$status" = 200 ] || fail "GET /api/entries returned $status"
  grep -q "$message" "$body" || fail "the new entry is not in GET /api/entries"
  pass "GET /api/entries 200, has the new entry"
fi

echo "smoke test passed: $BASE_URL"
