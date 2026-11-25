-- SuperTracker2: an optional calorie goal from a doctor, used in place of
-- the estimate when set. Existing profiles keep it empty.

BEGIN;

ALTER TABLE st2_profile
    ADD COLUMN calorie_goal smallint CHECK (calorie_goal BETWEEN 1000 AND 5000);

COMMIT;