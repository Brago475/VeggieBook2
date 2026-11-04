-- 015: print and download in the activity log, and drops for older books.
--
-- activity_log gets two kinds, book_printed and book_downloaded, and
-- content_id for the recipe or secret when one item was printed or
-- downloaded. detail holds what was printed: book, extras, recipe, secret.
--
-- book_session.drops_recorded is false for books saved before drop tracking
-- started (the first book_saved line with a taken_out_count), so the admin
-- shows "-" instead of 0 for them. Every other book, and every new one, is
-- true. Only the new column is filled; no existing data is changed.
--
-- Run once on the server, before the API code that uses it:
--
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/migrations/015_print_download_and_drops.sql

BEGIN;

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS content_id integer;

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_kind_check;

ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_kind_check CHECK (kind IN (
    'book_saved', 'book_deleted', 'account_deleted', 'study_renamed', 'study_deleted',
    'item_removed', 'book_printed', 'book_downloaded'
  ));

ALTER TABLE book_session
  ADD COLUMN IF NOT EXISTS drops_recorded boolean NOT NULL DEFAULT true;

UPDATE book_session
SET drops_recorded = false
WHERE created_at < (
  SELECT min(at) FROM activity_log
  WHERE kind = 'book_saved' AND taken_out_count IS NOT NULL
);

COMMIT;