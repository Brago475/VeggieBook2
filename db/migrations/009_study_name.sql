-- 009: a name for each study.
--
-- Admins can give a study a name ("Fall pilot") on the Studies page. The
-- name is optional: without one the admin site shows "Study 3". The number
-- never changes, so files and exports always keep it.
--
-- Only adds a column; nothing that exists is changed.

BEGIN;

ALTER TABLE study
    ADD COLUMN IF NOT EXISTS name text CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 60);

COMMIT;