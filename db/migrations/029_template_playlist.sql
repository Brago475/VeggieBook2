-- Default playlist for each notification template. A template with a
-- vegetable slot has one default per vegetable; others use vegetable ''.

BEGIN;

CREATE TABLE IF NOT EXISTS template_playlist (
    template_key varchar(40) NOT NULL,
    vegetable    varchar(40) NOT NULL DEFAULT '',
    playlist_id  integer     NOT NULL REFERENCES playlist(id) ON DELETE CASCADE,
    updated_at   timestamptz NOT NULL DEFAULT now(),
    updated_by   uuid        NULL,
    PRIMARY KEY (template_key, vegetable)
);

CREATE INDEX IF NOT EXISTS ix_template_playlist_playlist ON template_playlist (playlist_id);

COMMIT;