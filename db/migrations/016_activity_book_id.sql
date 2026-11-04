-- 016: link print and download lines to their book.
--
-- activity_log.book_id holds the saved book a print or download line is
-- about, so All Data can count them per book. Lines written before this
-- keep book_id empty and still count in totals. No existing data is changed.
--
-- Run once on the server, before the API code that uses it:
--
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/migrations/016_activity_book_id.sql

BEGIN;

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS book_id uuid;

CREATE INDEX IF NOT EXISTS activity_log_book_idx
    ON activity_log (book_id)
    WHERE book_id IS NOT NULL;

COMMIT;