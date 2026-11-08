#!/usr/bin/env bash
# Post-deploy smoke check for VeggieBook2. Run on the server from the repo root.
# Waits up to WAIT_SECONDS for the API to start, then runs every check.
# Also fails when the API has logged activity log lines it could not save
# since it last started. Run it again later to catch those.
# Exits non-zero if any check fails.

set -u

UA="VeggieBook2-smoke"
WAIT_SECONDS=30
API_CONTAINER="veggiebook-api"
API_PROBE="http://127.0.0.1:5000/api/questions?lang=en"
fails=0

pass() { printf "PASS  %-24s %s\n" "$1" "$2"; }
fail() { printf "FAIL  %-24s %s\n" "$1" "$2"; fails=$((fails + 1)); }

status_of() {
  curl -s -o /dev/null -m 5 -A "$UA" -w "%{http_code}" "$1"
}

check() {
  local name="$1" url="$2" expected="$3"
  local code
  code=$(curl -s -o /dev/null -m 10 -A "$UA" -w "%{http_code}" "$url")
  if [[ " $expected " == *" $code "* ]]; then
    pass "$name" "$code"
  else
    fail "$name" "$code (expected $expected)"
  fi
}

# A freshly restarted API needs a few seconds before it answers.
echo "Waiting for the API (up to ${WAIT_SECONDS}s)"
waited=0
until [ "$(status_of "$API_PROBE")" = "200" ]; do
  if [ "$waited" -ge "$WAIT_SECONDS" ]; then
    echo "API did not answer within ${WAIT_SECONDS}s. Running the checks anyway."
    break
  fi
  sleep 1
  waited=$((waited + 1))
done
if [ "$waited" -lt "$WAIT_SECONDS" ]; then
  echo "API ready after ${waited}s"
fi

echo
echo "API container"
check "questions" "$API_PROBE" "200"

echo
echo "Main site, local nginx"
check "home page" "http://127.0.0.1:8080/" "200"
check "questions" "http://127.0.0.1:8080/api/questions?lang=en" "200"
check "vegetables" "http://127.0.0.1:8080/api/vegetables?lang=en" "200"
check "auth me" "http://127.0.0.1:8080/api/auth/me" "200 204 401"
check "recovery questions" "http://127.0.0.1:8080/api/auth/recovery/questions" "200"
check "admin api blocked" "http://127.0.0.1:8080/api/admin/overview" "404"

echo
echo "Admin site, local nginx"
check "home page" "http://127.0.0.1:8081/" "200"
check "admin api" "http://127.0.0.1:8081/api/admin/overview" "401"

# Activity log writes fail quietly by design (the main action still works),
# so a missing database rule only shows in the API log. Any such warning
# since the API last started fails this check.
echo
echo "Activity log, since the API started"
started=$(docker inspect -f '{{.State.StartedAt}}' "$API_CONTAINER" 2>/dev/null)
if [ -z "$started" ]; then
  fail "activity log writes" "container $API_CONTAINER not found"
else
  log=$(docker logs --since "$started" "$API_CONTAINER" 2>&1)
  problems=$(printf '%s\n' "$log" | grep -c "Activity log: could not")
  if [ "$problems" -eq 0 ]; then
    pass "activity log writes" "no failures"
  else
    fail "activity log writes" "$problems failed"
    printf '%s\n' "$log" | grep -o "could not [^.]*line" | sort | uniq -c | sed 's/^/        /'
  fi
fi

# Cloudflare challenges curl from this server, so the public addresses cannot
# be tested from here. The local checks cover the origin; this covers the tunnel.
echo
echo "Cloudflare tunnel"
state=$(systemctl is-active cloudflared 2>/dev/null)
if [ "$state" = "active" ]; then
  pass "cloudflared service" "$state"
else
  fail "cloudflared service" "${state:-not found}"
fi

echo
if [ "$fails" -gt 0 ]; then
  echo "$fails check(s) failed"
  exit 1
fi
echo "All checks passed"