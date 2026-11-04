-- 014: keep research data when a book or account is deleted.
--
-- A deleted account is wiped of personal details and marked with deleted_at.
-- It can never sign in again. Its research ID, tracking history, and books
-- saved while tracking was on are kept.
--
-- A deleted book saved while tracking was on is marked with deleted_at and
-- hidden from its owner. Its uploaded cover photo is erased; had_upload
-- records that it had one. Books saved while tracking was off are erased.
--
-- Only adds columns, an index, and a check. No existing data is changed.
--
-- Run once on the server, before the API code that uses it:
--
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/migrations/014_keep_research_on_delete.sql

BEGIN;

ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- A deleted account never keeps an email address.
ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_deleted_no_email_check;
ALTER TABLE app_user
    ADD CONSTRAINT app_user_deleted_no_email_check
    CHECK (deleted_at IS NULL OR email IS NULL);

ALTER TABLE book_session
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
    ADD COLUMN IF NOT EXISTS had_upload boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS book_session_deleted_idx
    ON book_session (deleted_at)
    WHERE deleted_at IS NOT NULL;

COMMIT;