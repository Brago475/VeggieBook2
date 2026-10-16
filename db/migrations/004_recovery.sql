-- Migration 004: account recovery with a PIN and a security question.
--
-- Forgot password works in two steps, each limited to 3 wrong tries a day:
--   1. The 6-digit recovery PIN.
--   2. The security question.
-- After 3 wrong answers, password reset is locked for that account until the
-- admin unlocks it. Signing in with the password still works while locked.
--
-- Only adds columns. No existing data is changed or removed.
--
-- Run once on the server, only together with the API code that uses it:
--
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/migrations/004_recovery.sql

BEGIN;

ALTER TABLE app_user
    -- The PIN and the answer are stored scrambled, like the password.
    ADD COLUMN recovery_pin_hash         text,
    ADD COLUMN security_question_id      int,
    ADD COLUMN security_answer_hash      text,

    -- Wrong tries in the current 24 hours, for each step.
    ADD COLUMN pin_failed_count          int          NOT NULL DEFAULT 0,
    ADD COLUMN pin_fail_window_start     timestamptz,
    ADD COLUMN answer_failed_count       int          NOT NULL DEFAULT 0,
    ADD COLUMN answer_fail_window_start  timestamptz,

    -- Set when password reset is locked. Cleared by the admin, or by the
    -- owner setting a new PIN and question while signed in.
    ADD COLUMN recovery_locked_at        timestamptz;

-- The admin site lists locked accounts.
CREATE INDEX app_user_recovery_locked_idx ON app_user (recovery_locked_at)
    WHERE recovery_locked_at IS NOT NULL;

COMMIT;