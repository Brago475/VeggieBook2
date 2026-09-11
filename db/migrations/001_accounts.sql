-- Migration 001: user accounts.
--
-- A fresh database is built in this order: schema.sql, seed-data.sql,
-- everything in db/fixes, then db/migrations in number order. On the live
-- server each migration is run once by hand:
--
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/migrations/001_accounts.sql
--
-- Passwords are never stored. password_hash holds the output of ASP.NET
-- Core's PasswordHasher: PBKDF2 with a random salt per user, in a
-- self-describing format that allows the algorithm to be upgraded later.
--
-- security_stamp is replaced whenever the password changes. Every session
-- cookie carries the stamp it was issued with, and the API rejects cookies
-- whose stamp no longer matches, which signs out every other device.
--
-- "user" is a reserved word in PostgreSQL, hence app_user.

BEGIN;

CREATE TABLE app_user (
    id                uuid        PRIMARY KEY,
    email             text        NOT NULL,        -- as typed, for display
    email_normalized  text        NOT NULL UNIQUE, -- trimmed and lowercased
    password_hash     text        NOT NULL,
    security_stamp    uuid        NOT NULL,
    failed_sign_ins   int         NOT NULL DEFAULT 0,
    locked_until      timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CHECK (email_normalized = lower(email_normalized))
);

COMMIT;