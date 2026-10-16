-- 007: Activity log for the admin site's Recent activity list.
--
-- Records the things that leave no other trace: a book deleted by its owner
-- and an account deleted by its owner. Books saved and accounts joined are
-- read from their own tables, so they are not logged here.
--
-- Anonymous: only the research ID (copied as text, so the line survives
-- after the account is gone), what happened, when, and for a book which
-- vegetable or Secrets category and how many items it held. No email, name,
-- or account ID. Guests and admins are never logged (see
-- api/Activity/ActivityLog.cs).

CREATE TABLE IF NOT EXISTS activity_log (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    at                  timestamptz NOT NULL DEFAULT now(),
    kind                text NOT NULL CHECK (kind IN ('book_deleted', 'account_deleted')),
    participant_id      text NOT NULL,
    book_kind           text NULL CHECK (book_kind IN ('veggie', 'secrets')),
    vegetable_code      text NULL,
    secret_category_id  integer NULL,
    item_count          integer NULL
);

CREATE INDEX IF NOT EXISTS activity_log_at_idx ON activity_log (at DESC);