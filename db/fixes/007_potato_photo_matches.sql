-- 007_potato_photo_matches.sql
--
-- Matches the PO-212 orphan pair to recipe 247.
-- Verified 2026-09-16: PO-212 is not a recipe code in the database.
-- Content match, not a path repointing.
--
-- Recipe 247 "Crispy Oven French Fries" (2 potatoes, oil, seasonings)
-- Photos: recipe/PO-212/photo1.jpg (prep) and photo2.jpg (finished)
-- Reason: photo1 shows raw potato sticks coated in seasoning being arranged
-- on an oiled sheet pan; photo2 shows the same sticks baked golden on a
-- plate. The recipe allows "other favorite seasonings," which covers the
-- herb coating. 247 already had exactly two broken photo rows, matching the
-- prep/finished pair. Confidence: high.
--
-- The two UPDATEs run in sequence: after the first, that row no longer
-- matches 'img/%', so the second picks up the remaining broken row.

BEGIN;

UPDATE recipe_photo
SET image_path = 'recipe/PO-212/photo1.jpg', position = 1
WHERE id = (
  SELECT id FROM recipe_photo
  WHERE recipe_id = 247 AND image_path LIKE 'img/%'
  ORDER BY position LIMIT 1
);

UPDATE recipe_photo
SET image_path = 'recipe/PO-212/photo2.jpg', position = 2
WHERE id = (
  SELECT id FROM recipe_photo
  WHERE recipe_id = 247 AND image_path LIKE 'img/%'
  ORDER BY position LIMIT 1
);

COMMIT;

-- NOT MATCHED, deliberately left unassigned:
--
--   recipe/CA-210/photo1.jpg  roasted carrot chunks. No photo-less carrot
--     recipe is a plain roasted carrot side.
--   recipe/PO-207/photo1.jpg  mashed potato with skins and green onion.
--     No photo-less potato recipe is a mash.
--   recipe/GB-210/photo1.jpg  roasted green beans. Closest candidate is 241
--     "Pan-roasted Chicken with Lemon-Garlic Green Beans," but that recipe
--     centers on chicken with potato wedges and lemon, none of which appear
--     in the photo. Held pending review.
--   recipe/BR-201/photo1.jpg  VeggieBook banner logo, 635x150. Never a
--     recipe photo.
--   recipe/ON-212/photo1.jpg  byte-identical duplicate of ON-209.