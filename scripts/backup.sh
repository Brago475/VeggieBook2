#!/usr/bin/env bash
# Encrypted backup of the VeggieBook2 database and server secrets to Cloudflare R2.
# Runs nightly from a systemd timer. Can also be run by hand.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_CONTAINER="veggiebook-db"
API_CONTAINER="veggiebook-api"
PUBKEY="${HOME}/backups/keys/vb2-backup.pub"
LOCAL_DIR="${HOME}/backups/vb2"
KEEP_LOCAL=7
REMOTE="r2:veggiebook2-backups"

STAMP="$(date -u +%Y-%m-%d_%H%M)"
NAME="vb2-${STAMP}.tar.age"

log() { echo "$(date -u '+%Y-%m-%d %H:%M:%S') $*"; }

[[ -r "$PUBKEY" ]] || { log "Missing public key: $PUBKEY"; exit 1; }

WORK="$(mktemp -d)"
chmod 700 "$WORK"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/vb2/secrets" "$LOCAL_DIR"

log "Dumping database"
docker exec "$DB_CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$WORK/vb2/db.dump"
docker exec -i "$DB_CONTAINER" pg_restore --list < "$WORK/vb2/db.dump" > /dev/null
log "Database dump verified"

log "Copying keys and secrets"
docker cp "$API_CONTAINER:/keys" - > "$WORK/vb2/secrets/api-keys.tar"
cp "$REPO_DIR/.env" "$WORK/vb2/secrets/env"
cp /etc/cloudflared/config.yml "$WORK/vb2/secrets/cloudflared-config.yml"
cp -r "$HOME/.cloudflared" "$WORK/vb2/secrets/cloudflared-home"

{
  echo "created_utc=${STAMP}"
  echo "host=$(hostname)"
  echo "git_branch=$(git -C "$REPO_DIR" branch --show-current)"
  echo "git_commit=$(git -C "$REPO_DIR" rev-parse --short HEAD)"
  echo "db_dump_bytes=$(stat -c %s "$WORK/vb2/db.dump")"
} > "$WORK/vb2/manifest.txt"

log "Encrypting"
tar -C "$WORK" -czf - vb2 | age -R "$PUBKEY" > "$LOCAL_DIR/$NAME"

log "Uploading to R2"
rclone copyto "$LOCAL_DIR/$NAME" "$REMOTE/daily/$NAME"
if [[ "$(date -u +%d)" == "01" ]]; then
  rclone copyto "$LOCAL_DIR/$NAME" "$REMOTE/monthly/$NAME"
  log "Monthly copy uploaded"
fi

# Keep only the newest local copies.
ls -1t "$LOCAL_DIR"/vb2-*.tar.age | tail -n +$((KEEP_LOCAL + 1)) | xargs -r rm --

log "Done: $NAME ($(du -h "$LOCAL_DIR/$NAME" | cut -f1))"