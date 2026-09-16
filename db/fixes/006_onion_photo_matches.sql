-- 006_onion_photo_matches.sql
--
-- Matches orphaned onion photos to photo-less onion recipes.
-- Verified 2026-09-16: none of the folder codes exist as recipes, so these
-- are content matches, not path repointings. Reasoning and confidence are
-- recorded above each block.
--
-- NOTE: recipe/ON-212/photo1.jpg is byte-identical to recipe/ON-209/photo1.jpg
-- (md5 b81eace383041d3d1535d2213492414f). ON-209 is used as the canonical
-- path; ON-212 is a duplicate and is left unassigned.
--
-- Updates target a single row by id to avoid the multi-row error made in 004.

BEGIN;

-- Recipe 242 "Baked Onions"  (oil, salt, pepper, 2 onions)
-- Photos: recipe/ON-227/photo1.jpg (prep) and photo2.jpg (finished)
-- Reason: photo1 shows a whole peeled onion being pierced with a fork on a
-- board; photo2 shows that onion baked on a sheet pan with the top cut flat
-- and caramelized juices beneath. Nothing else in the onion set is a whole
-- baked onion. Confidence: high.
UPDATE recipe_photo
SET image_path = 'recipe/ON-227/photo1.jpg', position = 1
WHERE id = (
  SELECT id FROM recipe_photo
  WHERE recipe_id = 242 AND image_path LIKE 'img/%'
  ORDER BY position LIMIT 1
);

INSERT INTO recipe_photo (recipe_id, position, image_path)
SELECT 242, 2, 'recipe/ON-227/photo2.jpg'
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_photo
  WHERE recipe_id = 242 AND image_path = 'recipe/ON-227/photo2.jpg'
);

-- Recipe 243 "Chicken and Onion Soup"
-- Photo: recipe/ON-217/photo1.jpg
-- Reason: thinly sliced onions in dark broth in a bowl. The recipe calls for
-- 4 thinly sliced onions in broth, and it is the only soup among the
-- photo-less onion recipes. Chicken and noodles are not visible in the shot.
-- Confidence: moderate-high.
UPDATE recipe_photo
SET image_path = 'recipe/ON-217/photo1.jpg'
WHERE id = (
  SELECT id FROM recipe_photo
  WHERE recipe_id = 243 AND image_path LIKE 'img/%'
  ORDER BY position LIMIT 1
);

-- Recipe 237 "Beef Stew with Onions"
-- Photo: recipe/ON-209/photo1.jpg
-- Reason: beef pieces with pale onion chunks in a brown pan sauce, in a
-- skillet. Matches the beef, onion chunks, tomato paste, flour and vinegar.
-- Potatoes and carrots are absent, so this reads as the browning step before
-- the water is added. Fajitas (232) ruled out: no bell pepper, corn or
-- olives. Pot roast (269) ruled out: meat is cut, not a whole roast.
-- Confidence: moderate. Revisit if the original owner's media arrives.
UPDATE recipe_photo
SET image_path = 'recipe/ON-209/photo1.jpg'
WHERE id = (
  SELECT id FROM recipe_photo
  WHERE recipe_id = 237 AND image_path LIKE 'img/%'
  ORDER BY position LIMIT 1
);

COMMIT;