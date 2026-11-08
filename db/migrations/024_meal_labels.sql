-- Meal labels: Breakfast, Lunch, Dinner, Snack, for recipes and tips. Used
-- by playlists, both automatic and hand-picked. Stored in their own table;
-- recipe and tip tables are not changed. item_id is recipe.id or tip.id.

BEGIN;

CREATE TABLE IF NOT EXISTS meal_label (
    kind       varchar(8)  NOT NULL CHECK (kind IN ('tip', 'recipe')),
    item_id    int         NOT NULL,
    meal       varchar(12) NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    PRIMARY KEY (kind, item_id, meal)
);

CREATE INDEX IF NOT EXISTS meal_label_by_meal ON meal_label (meal, kind);

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
    'meal_labels_changed'
));

COMMIT;