-- 013: record items dropped during Keep/Drop, and items taken out of a saved book.
--
-- book_session_selection.dropped_in_review marks an item dropped while the
-- book was being made (kept = false). Existing rows stay false: they are kept
-- items or items taken out later. A row can never be both kept and dropped.
--
-- activity_log.taken_out_count holds how many items were dropped when a book
-- was saved. The new kind item_removed logs an item taken out of a saved book.

BEGIN;

ALTER TABLE book_session_selection
  ADD COLUMN IF NOT EXISTS dropped_in_review boolean NOT NULL DEFAULT false;

ALTER TABLE book_session_selection
  DROP CONSTRAINT IF EXISTS book_session_selection_dropped_check;

ALTER TABLE book_session_selection
  ADD CONSTRAINT book_session_selection_dropped_check CHECK (NOT (dropped_in_review AND kept));

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS taken_out_count integer;

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_kind_check;

ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_kind_check CHECK (kind IN (
    'book_saved', 'book_deleted', 'account_deleted', 'study_renamed', 'study_deleted', 'item_removed'
  ));

COMMIT;