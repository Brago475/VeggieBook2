-- Deleting a notification only hides it from the admin site. Its receipts
-- and activity lines stay. Existing messages are not deleted.

BEGIN;

ALTER TABLE notification ADD COLUMN deleted_at timestamptz;
ALTER TABLE notification ADD COLUMN deleted_by uuid;

COMMIT;