-- Zucchini nutrition from USDA FoodData Central (SR Legacy, FDC 169291)
-- instead of the FDA "Summer Squash" row: the FDA chart has no zucchini.
-- Scaled to 1 cup, sliced (113 g) and rounded with FDA label rules, using
-- the same Daily Values as the FDA chart. Applies only to the row 012 added.

BEGIN;

UPDATE vegetable_nutrition
SET name_en           = 'Zucchini',
    name_es           = 'Calabacita',
    serving_en        = '1 cup, sliced',
    serving_es        = '1 taza en rodajas',
    grams             = 113,
    ounces            = 4.0,
    calories          = 20,
    calories_from_fat = 0,
    fat_g             = 0,
    fat_dv            = 0,
    sodium_mg         = 10,
    sodium_dv         = 0,
    potassium_mg      = 290,
    potassium_dv      = 8,
    carbs_g           = 4,
    carbs_dv          = 1,
    fiber_g           = 1,
    fiber_dv          = 4,
    sugars_g          = 3,
    protein_g         = 1,
    vitamin_a_dv      = 4,
    vitamin_c_dv      = 35,
    calcium_dv        = 0,
    iron_dv           = 2,
    source            = 'fdc',
    source_ref        = '169291',
    source_url        = 'https://fdc.nal.usda.gov/food-details/169291/nutrients'
WHERE vegetable_code = 'ZUCCHINI'
  AND position = 0
  AND source = 'fda';

COMMIT;