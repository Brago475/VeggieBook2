#!/usr/bin/env bash
# Post-deploy smoke check for VeggieBook2. Run on the server from the repo root.
# Exits non-zero if any check fails.

set -u

UA="VeggieBook2-smoke"
fails=0

pass() { printf "PASS  %-24s %s\n" "$1" "$2"; }
fail() { printf "FAIL  %-24s %s\n" "$1" "$2"; fails=$((fails + 1)); }

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

echo "API container"
check "questions" "http://127.0.0.1:5000/api/questions?lang=en" "200"

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