-- Drafts of new playlists and notifications, saved before they are finished.
-- Kept apart from playlist and notification, so nothing unfinished can reach
-- the app. payload is the editor's state as the admin site saved it;
-- finishing a draft creates the real row through the normal checks.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_draft (
    id          serial PRIMARY KEY,
    kind        varchar(16) NOT NULL,
    title       varchar(120),
    payload     jsonb NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid,
    updated_at  timestamptz,
    updated_by  uuid,
    CONSTRAINT admin_draft_kind_check CHECK (kind IN ('playlist', 'notification'))
);

CREATE INDEX IF NOT EXISTS admin_draft_kind ON admin_draft (kind);

COMMIT;