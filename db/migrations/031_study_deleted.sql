-- Deleting a study only hides it, so its notice answers are kept as
-- research data. Existing studies are not deleted.

BEGIN;

ALTER TABLE study ADD COLUMN deleted_at timestamptz;

COMMIT;