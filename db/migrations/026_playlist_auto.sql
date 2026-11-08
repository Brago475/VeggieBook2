-- Automatic playlists: built from meal labels for one vegetable and meal.
-- One automatic playlist per pair; sending it again refreshes its items.
-- Editing it by hand clears both columns and makes it a hand-made playlist.

BEGIN;

ALTER TABLE playlist ADD COLUMN IF NOT EXISTS auto_vegetable varchar(24);
ALTER TABLE playlist ADD COLUMN IF NOT EXISTS auto_meal varchar(12);

ALTER TABLE playlist ADD CONSTRAINT playlist_auto_meal_check
    CHECK (auto_meal IS NULL OR auto_meal IN ('breakfast', 'lunch', 'dinner', 'snack'));

ALTER TABLE playlist ADD CONSTRAINT playlist_auto_pair
    CHECK ((auto_vegetable IS NULL) = (auto_meal IS NULL));

CREATE UNIQUE INDEX IF NOT EXISTS playlist_auto_unique
    ON playlist (auto_vegetable, auto_meal)
    WHERE auto_meal IS NOT NULL;

COMMIT;