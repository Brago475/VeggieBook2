-- Migration 002: saved books belong to accounts.
--
-- Builds on the book_session tables from schema.sql, which mirror the
-- original app's recipe books. They had no rows when this was written, so
-- user_id can be added as NOT NULL without a default.
--
-- Every row a user creates chains back to app_user with ON DELETE CASCADE:
--
--   app_user
--     book_session            (their books)
--       book_session_attribute  (answers to the profiling questions)
--       book_session_selection  (kept recipes, with extra copy counts)
--       book_cover_upload       (their own cover photo, if any)
--
-- so deleting an account removes everything it owns in one statement, and
-- deleting a book removes everything that belongs to that book.
--
-- A book's cover is either a preset (cover_path, e.g. cover/BR.jpg) or an
-- upload (a row in book_cover_upload). The API enforces exactly one.
--
-- Run once on the server:
--
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/migrations/002_books.sql

BEGIN;

ALTER TABLE book_session
    ADD COLUMN user_id    uuid       NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    ADD COLUMN kind       varchar(8) NOT NULL DEFAULT 'veggie'
                          CHECK (kind IN ('veggie', 'secrets')),
    ADD COLUMN cover_path text;

-- The home screen lists one user's books, newest first.
CREATE INDEX book_session_user_created_idx
    ON book_session (user_id, created_at DESC);

-- How many extra printed copies of each kept recipe, like the original's
-- extras field.
ALTER TABLE book_session_selection
    ADD COLUMN extra_copies int NOT NULL DEFAULT 0 CHECK (extra_copies >= 0);

-- Uploaded cover photos. Stored in the database rather than as files so
-- they are private by default, backed up with everything else, and deleted
-- with their book. The size cap is a last line of defense; the API checks
-- first.
CREATE TABLE book_cover_upload (
    session_id    uuid  PRIMARY KEY REFERENCES book_session(id) ON DELETE CASCADE,
    content_type  text  NOT NULL CHECK (content_type = 'image/jpeg'),
    data          bytea NOT NULL CHECK (octet_length(data) <= 409600)
);

COMMIT;