-- 004_unused_photo_matches.sql
--
-- Matches orphaned photo files to photo-less recipes.
--
-- IMPORTANT: unlike 003, these are NOT mechanical path repointings.
-- Verified 2026-09-16: none of the folder codes below exist as recipes in
-- the database, so the folder name does not identify the recipe. Each match
-- here was made by looking at the image and the recipe text together.
-- The reasoning is recorded above each statement so it can be audited or
-- reversed.
--
-- Each block updates an existing img/ photo row if one is present, and
-- inserts a row if the recipe has none. Both are guarded so re-running
-- the file is safe.

BEGIN;

-- Recipe 206 "Broccoli, Meat, and Noodles Casserole"
-- Photo: recipe/BR-214/photo1.jpg
-- Reason: shows broccoli with wide egg noodles. Of the eight photo-less
-- broccoli recipes, 206 is the only one containing noodles. No meat is
-- visible in the shot; the recipe lists cooked meat stirred in, so this
-- is likely a plainer version that was photographed.
UPDATE recipe_photo
SET image_path = 'recipe/BR-214/photo1.jpg'
WHERE recipe_id = 206 AND image_path LIKE 'img/%';

INSERT INTO recipe_photo (recipe_id, position, image_path)
SELECT 206, 1, 'recipe/BR-214/photo1.jpg'
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_photo WHERE recipe_id = 206
);

-- Recipe 207 "Broccoli Stir-Fry with Meat or Chicken"
-- Photo: recipe/BR-207/photo1.jpg
-- Reason: sauteed broccoli, carrots, green bell pepper and onion, cut for
-- high-heat cooking. 207 is the only stir-fry among the photo-less
-- broccoli recipes. Meat is not visible, same caveat as above.
-- Confidence: moderate. Revisit if the original owner's media arrives.
UPDATE recipe_photo
SET image_path = 'recipe/BR-207/photo1.jpg'
WHERE recipe_id = 207 AND image_path LIKE 'img/%';

INSERT INTO recipe_photo (recipe_id, position, image_path)
SELECT 207, 1, 'recipe/BR-207/photo1.jpg'
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_photo WHERE recipe_id = 207
);

-- recipe/BR-201/photo1.jpg is EXCLUDED, not matched.
-- It is 635x150, the VeggieBook banner logo, not a recipe photo.
-- It sits in an orphaned recipe folder and should never be assigned.

COMMIT;