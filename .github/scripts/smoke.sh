#!/usr/bin/env bash
# Post-deploy smoke test for the web app (SRS 10.1 steps 3 and 5): the pages, and an API call
# through the web origin (ADR-0002 rewrite). Uses no credentials and creates no data.
#   smoke.sh <web-url>
set -euo pipefail

web="${1%/}"

check() {
  local name="$1" url="$2" want="$3" status
  status=$(curl -sS -o /tmp/smoke-body -w '%{http_code}' --max-time 15 "$url" || echo 000)
  if [ "$status" != "$want" ]; then
    echo "::error::${name}: ${url} answered ${status}, expected ${want}"
    return 1
  fi
  echo "ok  ${name} (${status})"
}

check "Web home" "${web}/" 200
check "Web login page" "${web}/login" 200
# Signed out, /auth/me is a 401 error envelope from the API behind the rewrite.
check "API through the web origin" "${web}/api/v1/auth/me" 401
jq -e '.error.code == "UNAUTHENTICATED" and (.error.requestId | length > 0)' /tmp/smoke-body >/dev/null
echo "Smoke test passed"
