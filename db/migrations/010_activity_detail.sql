-- 010: admin study actions in the activity log.
--
-- Adds a free-text detail column and allows rows with no participant
-- (admin actions). Any existing CHECK constraint on kind or participant_id
-- is replaced so the new kinds (book_saved, study_renamed, study_deleted)
-- are accepted. Existing rows are unchanged.

BEGIN;

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS detail text;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'activity_log'::regclass
      AND contype = 'c'
      AND (pg_get_constraintdef(oid) ILIKE '%kind%' OR pg_get_constraintdef(oid) ILIKE '%participant_id%')
  LOOP
    EXECUTE format('ALTER TABLE activity_log DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE activity_log
  ADD CONSTRAINT activity_log_kind_check CHECK (kind IN (
    'book_saved', 'book_deleted', 'account_deleted', 'study_renamed', 'study_deleted'
  ));

COMMIT;