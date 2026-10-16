-- 008: studies and research tracking.
--
-- How it works:
--
--   Tracking is ON by default for every real account from the moment it
--   accepts the Terms. People can turn it off (and back on) in Settings.
--   An admin can also turn it off for someone. Admins and guests are never
--   tracked or counted.
--
--   Nothing is recorded unless a study is running. An admin switches a study
--   on and off from the admin site; everything from the moment it is
--   switched on until it is switched off belongs to that study. Only one
--   study can run at a time.
--
--   While a study runs, only people who turned tracking off themselves see
--   a notice in the app, and can join or stay out. Everyone else sees
--   nothing. People an admin turned off do not get the notice.
--
-- Tables:
--
--   research_tracking_change  every time someone's tracking is turned off
--                             or on, by them or by an admin. No rows for an
--                             account means tracking is on (the default).
--                             Keeping the history means a study can tell
--                             who was tracked on which day.
--   study                     one row per study: its number and when it was
--                             switched on and off (ended_at is empty while
--                             it runs).
--   study_notice              who saw the notice in each study, and whether
--                             they joined or stayed out.
--
-- Only adds tables; nothing that exists is changed.

BEGIN;

CREATE TABLE IF NOT EXISTS research_tracking_change (
    id          bigserial   PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    tracking_on boolean     NOT NULL,
    changed_by  text        NOT NULL CHECK (changed_by IN ('self', 'admin')),
    admin_id    uuid        REFERENCES app_user (id) ON DELETE SET NULL,
    at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS research_tracking_change_user_at
    ON research_tracking_change (user_id, at DESC);

CREATE TABLE IF NOT EXISTS study (
    id         serial      PRIMARY KEY,
    number     integer     NOT NULL UNIQUE CHECK (number > 0),
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at   timestamptz,
    started_by uuid        REFERENCES app_user (id) ON DELETE SET NULL,
    ended_by   uuid        REFERENCES app_user (id) ON DELETE SET NULL,
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Only one study can be running (ended_at empty) at a time.
CREATE UNIQUE INDEX IF NOT EXISTS study_one_running
    ON study ((ended_at IS NULL))
    WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS study_notice (
    study_id    integer     NOT NULL REFERENCES study (id) ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    shown_at    timestamptz NOT NULL DEFAULT now(),
    answer      text        CHECK (answer IN ('joined', 'stayed_out')),
    answered_at timestamptz,
    PRIMARY KEY (study_id, user_id)
);

COMMIT;