-- SuperTracker2: match VeggieBook's Root Vegetables (Turnips, Rutabagas,
-- Parsnips, in VeggieBook's order) and its Spanish names. Beets was never a
-- VeggieBook kind; its row is kept but marked inactive, so it is no longer
-- offered. Nothing is deleted. Only st2_vegetable is changed.

BEGIN;

ALTER TABLE st2_vegetable ADD COLUMN active boolean NOT NULL DEFAULT true;

UPDATE st2_vegetable SET active = false, position = 99 WHERE key = 'ROOT_BEET';

INSERT INTO st2_vegetable (key, vegetable_code, name_en, name_es, food_id, cup_grams, position)
VALUES ('ROOT_RUTABAGA', 'ROOTVEGETABLE', 'Rutabagas', 'Colinabos', 4169, 140, 9);

UPDATE st2_vegetable SET position = 8,  name_es = 'Nabos'       WHERE key = 'ROOT_TURNIP';
UPDATE st2_vegetable SET position = 10, name_es = 'Pastinacas'  WHERE key = 'ROOT_PARSNIP';
UPDATE st2_vegetable SET name_es = 'Calabacitas'                WHERE key = 'ZUCCHINI';

COMMIT;