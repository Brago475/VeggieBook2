-- 027: Admin actions in the activity log.
--
-- admin_id is the admin who did the action. Empty on participant lines and
-- on lines written before this migration. No foreign key: the line must
-- survive if that account is later deleted or erased.
--
-- The kind list keeps every kind from 024 and adds the admin kinds.

BEGIN;

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS admin_id uuid NULL;

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
    'notification_stopped',
    'playlist_created',
    'playlist_edited',
    'playlist_archived',
    'playlist_opened',
    'playlist_kept',
    'playlist_skipped',
    'playlist_removed',
    'playlist_item_opened',
    'user_playlist_created',
    'user_playlist_edited',
    'user_playlist_deleted',
    'meal_labels_changed',
    'admin_role_given',
    'admin_role_removed',
    'recovery_unlocked',
    'guest_mode_changed',
    'signed_out_everywhere',
    'admin_download'
));

COMMIT;