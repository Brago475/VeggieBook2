-- 012: identity record history.
--
-- One row each time the main admin opens Identity records on the admin site
-- or reveals someone's research ID: what happened, who did it, when, and for
-- a reveal, which account. The research ID itself is never stored here.
--
-- Kept apart from activity_log, so it never appears in the Activity page or
-- in any research download. Rows are permanent. target_user_id has no
-- foreign key, so a line stays after the account is deleted.

BEGIN;

CREATE TABLE IF NOT EXISTS identity_audit (
  id             bigserial PRIMARY KEY,
  at             timestamptz NOT NULL DEFAULT now(),
  action         text NOT NULL CHECK (action IN ('identity_opened', 'research_id_revealed')),
  admin_email    text NOT NULL,
  target_user_id uuid NULL
);

CREATE INDEX IF NOT EXISTS identity_audit_at_idx ON identity_audit (at DESC);

COMMIT;