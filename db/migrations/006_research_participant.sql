-- 006: anonymous research IDs.
--
-- Every real account gets one random research ID (VB2-K7M4-Q9PX). The
-- admin site's research sheets show this ID instead of the person; email
-- and names never appear there, and the ID never appears on the Accounts
-- page, so the two can't be lined up by looking at them.
--
-- IDs are given by the API the first time an account appears in a research
-- sheet (Research/ParticipantIds.cs), kept forever, and never reused.
-- Deleting an account deletes its ID, the same as its books.
--
-- The 8 characters use only 2-9 and letters other than I, L, and O, so an
-- ID can be read aloud or typed without mix-ups.

BEGIN;

CREATE TABLE IF NOT EXISTS research_participant (
    user_id        uuid        PRIMARY KEY REFERENCES app_user (id) ON DELETE CASCADE,
    participant_id text        NOT NULL UNIQUE
                               CHECK (participant_id ~ '^VB2-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$'),
    created_at     timestamptz NOT NULL DEFAULT now()
);

COMMIT;