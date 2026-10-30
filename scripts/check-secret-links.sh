#!/usr/bin/env bash
# Lists every Secret link with its location and current HTTP status.
# Read-only: queries the database and requests each URL.
# Usage: scripts/check-secret-links.sh [output.tsv]
set -euo pipefail

OUT="${1:-_out/secret-links.tsv}"
DB_CONTAINER="${DB_CONTAINER:-veggiebook-db}"
mkdir -p "$(dirname "$OUT")"

QUERY="
SELECT
  l.id,
  COALESCE(to_jsonb(c)->>'name_en', to_jsonb(c)->>'title_en',
           to_jsonb(c)->>'name', to_jsonb(c)->>'title', c.id::text),
  s.display_number,
  s.id,
  CASE WHEN s.active THEN 'yes' ELSE 'no' END,
  l.language,
  regexp_replace(s.headline_en, '\s+', ' ', 'g'),
  COALESCE(NULLIF(regexp_replace(l.label_en, '\s+', ' ', 'g'), ''), '-'),
  l.url
FROM secret_link l
JOIN secret s ON s.id = l.secret_id
JOIN secret_category c ON c.id = s.category_id
ORDER BY 2, s.display_number, l.language, l.id;
"

ROWS=$(docker exec "$DB_CONTAINER" sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -A -t -F "$2" -c "$1"' sh "$QUERY" $'\t')

printf 'link_id\tcategory\tsecret_no\tsecret_id\tactive\tlanguage\theadline\tlabel\turl\tstatus\tresult\tfinal_url\n' > "$OUT"

total=$(printf '%s\n' "$ROWS" | grep -c . || true)
n=0
while IFS=$'\t' read -r id cat num sid active lang headline label url; do
  [ -z "$id" ] && continue
  n=$((n + 1))
  echo "Checking $n/$total: $url" >&2

  res=$(curl -s -o /dev/null -L --max-time 20 --max-redirs 10 \
    -A "Mozilla/5.0 (VeggieBook2 link check)" \
    -w '%{http_code}\t%{url_effective}' "$url" || true)
  code=${res%%$'\t'*}
  final=${res#*$'\t'}
  [ -z "$code" ] && code="000"

  case "$code" in
    2??) result="OK" ;;
    000) result="No response" ;;
    *)   result="Broken" ;;
  esac
  [ "$final" = "$url" ] && final="-"

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$id" "$cat" "$num" "$sid" "$active" "$lang" "$headline" "$label" "$url" "$code" "$result" "$final" >> "$OUT"
done <<< "$ROWS"

echo "Done: $n links written to $OUT" >&2