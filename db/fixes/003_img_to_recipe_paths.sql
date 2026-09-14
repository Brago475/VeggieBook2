-- 003_img_to_recipe_paths.sql
--
-- 93 recipe_photo rows point at img/, a folder that was never delivered with
-- the original materials. 22 of those rows belong to recipes that have a
-- display_code, and 20 of them have a matching file already on disk under
-- images/recipe/<code>/.
--
-- The photo "position" column and the "photoN.jpg" filenames are independent
-- numbering schemes and do not always agree. In CA-221, PO-219 and GB-220 the
-- two run opposite each other, so every mapping below is explicit rather than
-- derived. A rule like "position 1 maps to photo1.jpg" would point two
-- positions at the same file on those recipes.
--
-- Not fixed here, because no file exists for them:
--   CA-216 position 1  (folder has only photo1.jpg, already used by position 2)
--   ZU-224 position 2  (folder has only photo1.jpg)
-- Those two join the ~73 rows from the 2012 batch that still need the
-- original owner's img/ folder.
--
-- Safe to run more than once: rows already corrected will not match.

BEGIN;

CREATE TEMP TABLE img_path_fix (
    display_code text NOT NULL,
    position     integer NOT NULL,
    new_path     text NOT NULL
) ON COMMIT DROP;

-- Single-photo recipes: position 1 maps to photo1.jpg
INSERT INTO img_path_fix (display_code, position, new_path) VALUES
    ('BR-206', 1, 'recipe/BR-206/photo1.jpg'),
    ('BR-208', 1, 'recipe/BR-208/photo1.jpg'),
    ('BR-209', 1, 'recipe/BR-209/photo1.jpg'),
    ('BR-210', 1, 'recipe/BR-210/photo1.jpg'),
    ('BR-211', 1, 'recipe/BR-211/photo1.jpg'),
    ('BR-213', 1, 'recipe/BR-213/photo1.jpg'),
    ('BR-215', 1, 'recipe/BR-215/photo1.jpg'),
    ('CA-209', 1, 'recipe/CA-209/photo1.jpg'),
    ('CA-218', 1, 'recipe/CA-218/photo1.jpg'),
    ('CB-207', 1, 'recipe/CB-207/photo1.jpg'),
    ('GB-206', 1, 'recipe/GB-206/photo1.jpg'),
    ('GB-219', 1, 'recipe/GB-219/photo1.jpg'),
    ('ON-223', 1, 'recipe/ON-223/photo1.jpg'),
    ('PO-208', 1, 'recipe/PO-208/photo1.jpg'),
    ('ZU-202', 1, 'recipe/ZU-202/photo1.jpg'),
    ('ZU-204', 1, 'recipe/ZU-204/photo1.jpg'),
    ('ZU-224', 1, 'recipe/ZU-224/photo1.jpg');

-- Inverted pairs: the other position already holds the photo whose number
-- would otherwise be assigned here, so these take the remaining file.
INSERT INTO img_path_fix (display_code, position, new_path) VALUES
    ('CA-221', 1, 'recipe/CA-221/photo2.jpg'),
    ('PO-219', 1, 'recipe/PO-219/photo2.jpg'),
    ('GB-220', 2, 'recipe/GB-220/photo1.jpg');

UPDATE recipe_photo p
SET image_path = f.new_path
FROM img_path_fix f
JOIN recipe r ON r.display_code = f.display_code
WHERE p.recipe_id = r.id
  AND p.position = f.position
  AND p.image_path LIKE 'img/%';

-- No recipe should end up with the same photo in two positions.
DO $$
DECLARE
    dupes integer;
BEGIN
    SELECT COUNT(*) INTO dupes
    FROM (
        SELECT recipe_id, image_path
        FROM recipe_photo
        GROUP BY recipe_id, image_path
        HAVING COUNT(*) > 1
    ) d;

    IF dupes > 0 THEN
        RAISE EXCEPTION 'Aborting: % recipe(s) would have a duplicate photo path', dupes;
    END IF;
END $$;

COMMIT;

-- Expected after commit: 73 rows still pointing at img/
SELECT COUNT(*) AS remaining_img_paths
FROM recipe_photo
WHERE image_path LIKE 'img/%';