-- Migration 005: the new Create Account form.
--
-- Adds the account profile: first and last name, a username (display_name),
-- the age range, and which version of the Terms the user agreed to and when.
--
-- Accounts made before this keep these empty.
--
-- Only adds columns and an index. No existing data is changed or removed.
--
-- Run once on the server, only together with the API code that uses it:
--
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/migrations/005_profile.sql

BEGIN;

ALTER TABLE app_user
    ADD COLUMN first_name         varchar(50),
    ADD COLUMN last_name          varchar(50),
    ADD COLUMN display_name       varchar(20),
    ADD COLUMN age_range          varchar(10),
    ADD COLUMN terms_version      varchar(10),
    ADD COLUMN terms_accepted_at  timestamptz;

-- Usernames are unique, ignoring capitals: "Cook_Ana" and "cook_ana" are
-- the same name.
CREATE UNIQUE INDEX app_user_display_name_idx ON app_user (lower(display_name))
    WHERE display_name IS NOT NULL;

COMMIT;