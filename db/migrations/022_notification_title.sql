-- An admin-only title for each notification, shown on the admin site and in
-- Activity. Participants never see it. Existing messages keep no title.

BEGIN;

ALTER TABLE notification ADD COLUMN title text;

ALTER TABLE notification ADD CONSTRAINT notification_title_length
    CHECK (title IS NULL OR char_length(title) <= 80);

COMMIT;