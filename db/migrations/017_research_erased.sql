-- 017: record participant erases in the activity log.
--
-- Allows the kind research_erased, written when the main admin erases a
-- participant's content, account, or everything (Admin/ParticipantErase.cs).
-- detail holds the level: content, account, or everything. The activity log
-- itself is never erased. No existing data is changed.
--
-- Run once on the server, before the API code that uses it:
--
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/migrations/017_research_erased.sql

BEGIN;

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_kind_check;

ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_kind_check CHECK (kind IN (
    'book_saved', 'book_deleted', 'account_deleted', 'study_renamed', 'study_deleted',
    'item_removed', 'book_printed', 'book_downloaded', 'research_erased'
  ));

COMMIT;