-- Nutrition facts for each VeggieBook vegetable, raw, one serving.
-- Columns follow the FDA "Nutrition Information for Raw Vegetables" chart.
-- source 'fda': copied from that chart. source 'fdc': USDA FoodData Central
-- SR Legacy, scaled to the serving and rounded with FDA label rules, using
-- the same Daily Values as the FDA chart.
-- A vegetable with several kinds (Root Vegetables) has one row per kind,
-- in position order. Safe to run more than once.

BEGIN;

CREATE TABLE IF NOT EXISTS vegetable_nutrition (
    id                serial      PRIMARY KEY,
    vegetable_code    varchar(24) NOT NULL REFERENCES vegetable(code),
    position          integer     NOT NULL DEFAULT 0,
    name_en           text        NOT NULL,
    name_es           text        NOT NULL,
    serving_en        text        NOT NULL,
    serving_es        text        NOT NULL,
    grams             numeric(6,1) NOT NULL,
    ounces            numeric(4,1) NOT NULL,
    calories          integer     NOT NULL,
    calories_from_fat integer     NOT NULL,
    fat_g             numeric(4,1) NOT NULL,
    fat_dv            integer     NOT NULL,
    sodium_mg         integer     NOT NULL,
    sodium_dv         integer     NOT NULL,
    potassium_mg      integer     NOT NULL,
    potassium_dv      integer     NOT NULL,
    carbs_g           integer     NOT NULL,
    carbs_dv          integer     NOT NULL,
    fiber_g           integer     NOT NULL,
    fiber_dv          integer     NOT NULL,
    sugars_g          integer     NOT NULL,
    protein_g         integer     NOT NULL,
    vitamin_a_dv      integer     NOT NULL,
    vitamin_c_dv      integer     NOT NULL,
    calcium_dv        integer     NOT NULL,
    iron_dv           integer     NOT NULL,
    source            varchar(8)  NOT NULL CHECK (source IN ('fda', 'fdc')),
    source_ref        text        NULL,
    source_url        text        NOT NULL,
    UNIQUE (vegetable_code, position)
);

INSERT INTO vegetable_nutrition
    (vegetable_code, position, name_en, name_es, serving_en, serving_es, grams, ounces,
     calories, calories_from_fat, fat_g, fat_dv, sodium_mg, sodium_dv, potassium_mg, potassium_dv,
     carbs_g, carbs_dv, fiber_g, fiber_dv, sugars_g, protein_g,
     vitamin_a_dv, vitamin_c_dv, calcium_dv, iron_dv, source, source_ref, source_url)
VALUES
    ('BROCCOLI', 0, 'Broccoli', 'Brócoli', '1 medium stalk', '1 tallo mediano', 148, 5.3,
     45, 0, 0.5, 1, 80, 3, 460, 13, 8, 3, 3, 12, 2, 4, 6, 220, 6, 6,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('CABBAGE', 0, 'Green Cabbage', 'Repollo verde', '1/12 medium head', '1/12 de cabeza mediana', 84, 3.0,
     25, 0, 0, 0, 20, 1, 190, 5, 5, 2, 2, 8, 3, 1, 0, 70, 4, 2,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('CARROT', 0, 'Carrot', 'Zanahoria', '1 carrot, 7" long, 1 1/4" diameter', '1 zanahoria de 7" de largo y 1 1/4" de diámetro', 78, 2.8,
     30, 0, 0, 0, 60, 3, 250, 7, 7, 2, 2, 8, 5, 1, 110, 10, 2, 2,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('CAULIFLOWER', 0, 'Cauliflower', 'Coliflor', '1/6 medium head', '1/6 de cabeza mediana', 99, 3.5,
     25, 0, 0, 0, 30, 1, 270, 8, 5, 2, 2, 8, 2, 2, 0, 100, 2, 2,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('GREENBEAN', 0, 'Green (Snap) Beans', 'Ejotes', '3/4 cup cut', '3/4 de taza, cortados', 83, 3.0,
     20, 0, 0, 0, 0, 0, 200, 6, 5, 2, 3, 12, 2, 1, 4, 10, 4, 2,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('ONION', 0, 'Onion', 'Cebolla', '1 medium', '1 mediana', 148, 5.3,
     45, 0, 0, 0, 5, 0, 190, 5, 11, 4, 3, 12, 9, 1, 0, 20, 4, 4,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('POTATO', 0, 'Potato', 'Papa', '1 medium', '1 mediana', 148, 5.3,
     110, 0, 0, 0, 0, 0, 620, 18, 26, 9, 2, 8, 1, 3, 0, 45, 2, 6,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('SWEETPOTATO', 0, 'Sweet Potato', 'Camote', '1 medium, 5" long, 2" diameter', '1 mediano de 5" de largo y 2" de diámetro', 130, 4.6,
     100, 0, 0, 0, 70, 3, 440, 13, 23, 8, 4, 16, 7, 2, 120, 30, 4, 4,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('ZUCCHINI', 0, 'Zucchini (summer squash)', 'Calabacita (calabaza de verano)', '1/2 medium', '1/2 mediana', 98, 3.5,
     20, 0, 0, 0, 0, 0, 260, 7, 4, 1, 2, 8, 2, 1, 6, 30, 2, 2,
     'fda', NULL, 'https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables'),
    ('ROOTVEGETABLE', 1, 'Turnips', 'Nabos', '1 cup, cubes', '1 taza en cubos', 130, 4.6,
     35, 0, 0, 0, 85, 4, 250, 7, 8, 3, 2, 8, 5, 1, 0, 45, 4, 2,
     'fdc', '170465', 'https://fdc.nal.usda.gov/food-details/170465/nutrients'),
    ('ROOTVEGETABLE', 2, 'Rutabagas', 'Colinabos', '1 cup, cubes', '1 taza en cubos', 140, 4.9,
     50, 0, 0, 0, 15, 1, 430, 12, 12, 4, 3, 12, 6, 2, 0, 60, 6, 4,
     'fdc', '168454', 'https://fdc.nal.usda.gov/food-details/168454/nutrients'),
    ('ROOTVEGETABLE', 3, 'Parsnips', 'Pastinacas', '1 cup, slices', '1 taza en rodajas', 133, 4.7,
     100, 0, 0, 0, 15, 1, 500, 14, 24, 8, 7, 28, 6, 2, 0, 40, 4, 4,
     'fdc', '170417', 'https://fdc.nal.usda.gov/food-details/170417/nutrients')
ON CONFLICT (vegetable_code, position) DO NOTHING;

COMMIT;