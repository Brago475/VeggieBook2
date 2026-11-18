-- Cleans text left by the original import:
--   soft hyphens (U+00AD), which are invisible and break search
--   double spaces in recipe titles
--   Spanish words split by a hyphen, and one "Crock-Top" typo
-- Safe to run more than once; each change checks before it applies.

BEGIN;

-- Soft hyphens
UPDATE recipe
SET title_en      = replace(title_en, chr(173), ''),
    title_es      = replace(title_es, chr(173), ''),
    story_line_en = replace(story_line_en, chr(173), ''),
    story_line_es = replace(story_line_es, chr(173), '')
WHERE position(chr(173) in title_en) > 0
   OR position(chr(173) in title_es) > 0
   OR position(chr(173) in coalesce(story_line_en, '')) > 0
   OR position(chr(173) in coalesce(story_line_es, '')) > 0;

UPDATE recipe_step
SET text_en = replace(text_en, chr(173), ''),
    text_es = replace(text_es, chr(173), '')
WHERE position(chr(173) in text_en) > 0
   OR position(chr(173) in text_es) > 0;

UPDATE recipe_ingredient
SET text_en = replace(text_en, chr(173), ''),
    text_es = replace(text_es, chr(173), '')
WHERE position(chr(173) in text_en) > 0
   OR position(chr(173) in text_es) > 0;

UPDATE tip_block
SET text_en = replace(text_en, chr(173), ''),
    text_es = replace(text_es, chr(173), '')
WHERE position(chr(173) in text_en) > 0
   OR position(chr(173) in text_es) > 0;

UPDATE tip
SET heading_en = replace(heading_en, chr(173), ''),
    heading_es = replace(heading_es, chr(173), '')
WHERE position(chr(173) in heading_en) > 0
   OR position(chr(173) in heading_es) > 0;

-- Double spaces in titles
UPDATE recipe
SET title_en = regexp_replace(title_en, '\s{2,}', ' ', 'g'),
    title_es = regexp_replace(title_es, '\s{2,}', ' ', 'g')
WHERE title_en ~ '\s{2,}'
   OR title_es ~ '\s{2,}';

-- Spanish words split by a hyphen
UPDATE recipe SET title_es = replace(title_es, 'Gu-iso', 'Guiso')
WHERE display_code = 'RV-215' AND title_es LIKE '%Gu-iso%';

UPDATE recipe SET title_es = replace(replace(title_es, 'Ca-motes', 'Camotes'), 'Crock- Pot', 'Crock-Pot')
WHERE display_code = 'SW-216' AND (title_es LIKE '%Ca-motes%' OR title_es LIKE '%Crock- Pot%');

UPDATE recipe SET title_es = replace(title_es, 'Ca-labacitas', 'Calabacitas')
WHERE display_code = 'ZU-215' AND title_es LIKE '%Ca-labacitas%';

-- Typo
UPDATE recipe SET title_es = replace(title_es, 'Crock-Top', 'Crock-Pot')
WHERE display_code = 'CB-219' AND title_es LIKE '%Crock-Top%';

COMMIT;