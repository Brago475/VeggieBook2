-- 005_fix_207_duplicate.sql
--
-- Corrects an error in 004. Recipe 207 had two img/ photo rows and the
-- UPDATE in 004 rewrote both to the same file, producing a duplicate.
-- Only one replacement photo exists, so the second row is removed.

BEGIN;

DELETE FROM recipe_photo
WHERE recipe_id = 207
  AND position = 2
  AND image_path = 'recipe/BR-207/photo1.jpg';

COMMIT;