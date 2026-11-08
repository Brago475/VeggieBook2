-- Allows notification lines in the activity log. Migration 019 added
-- notifications but not their kinds to activity_log_kind_check, so every
-- notification line was rejected. Existing rows are not changed.

BEGIN;

ALTER TABLE activity_log DROP CONSTRAINT activity_log_kind_check;

ALTER TABLE activity_log ADD CONSTRAINT activity_log_kind_check CHECK (kind IN (
    'book_saved',
    'book_deleted',
    'account_deleted',
    'study_renamed',
    'study_deleted',
    'item_removed',
    'book_printed',
    'book_downloaded',
    'research_erased',
    'notification_shown',
    'notification_opened',
    'notification_link',
    'notification_dismissed',
    'notification_created',
    'notification_edited',
    'notification_stopped'
));

COMMIT;