-- 019: notifications from the admin site, shown inside the main site.
--
-- How it works:
--
--   An admin writes a message in English. The Spanish is filled in by
--   automatic translation (body_es_auto stays true) and can be corrected by
--   hand (body_es_auto becomes false). Addresses starting with https:// in
--   the text become links in the app.
--
--   A message is visible from starts_at until expires_at; the admin sets
--   both and can change them later. With repeat_days set, it shows again
--   every repeat_days days; each showing is a round, numbered from 0.
--   cancelled_at stops a message early.
--
--   Audience: 'all' is every account except the excluded ones; 'selected'
--   is only the included ones. Guests get it only when include_guests is on.
--   Admin accounts never get notifications.
--
-- Tables:
--
--   notification          one row per message
--   notification_target   accounts included or excluded, per message
--   notification_receipt  per account and round: when the pop-up was shown,
--                         and when it was opened, its link clicked, or it
--                         was dismissed. Guest rows go with the guest.
--
-- Research events go to activity_log like every other tracked action.
-- Only adds tables; nothing that exists is changed.

BEGIN;

CREATE TABLE IF NOT EXISTS notification (
    id             serial      PRIMARY KEY,
    body_en        text        NOT NULL CHECK (char_length(body_en) BETWEEN 1 AND 500),
    body_es        text        NOT NULL CHECK (char_length(body_es) BETWEEN 1 AND 1000),
    body_es_auto   boolean     NOT NULL DEFAULT true,
    template_key   text,
    vegetable      text,
    audience       text        NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'selected')),
    include_guests boolean     NOT NULL DEFAULT false,
    starts_at      timestamptz NOT NULL,
    expires_at     timestamptz NOT NULL,
    repeat_days    integer     CHECK (repeat_days IS NULL OR repeat_days BETWEEN 1 AND 365),
    cancelled_at   timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid        REFERENCES app_user (id) ON DELETE SET NULL,
    updated_at     timestamptz,
    updated_by     uuid        REFERENCES app_user (id) ON DELETE SET NULL,
    CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS notification_window
    ON notification (starts_at, expires_at)
    WHERE cancelled_at IS NULL;

CREATE TABLE IF NOT EXISTS notification_target (
    notification_id integer NOT NULL REFERENCES notification (id) ON DELETE CASCADE,
    user_id         uuid    NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    mode            text    NOT NULL CHECK (mode IN ('include', 'exclude')),
    PRIMARY KEY (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS notification_receipt (
    notification_id integer     NOT NULL REFERENCES notification (id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    round           integer     NOT NULL DEFAULT 0 CHECK (round >= 0),
    shown_at        timestamptz NOT NULL DEFAULT now(),
    opened_at       timestamptz,
    clicked_at      timestamptz,
    dismissed_at    timestamptz,
    PRIMARY KEY (notification_id, user_id, round)
);

CREATE INDEX IF NOT EXISTS notification_receipt_user
    ON notification_receipt (user_id);

COMMIT;