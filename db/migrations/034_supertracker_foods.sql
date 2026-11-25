-- SuperTracker2 foods, from the USDA SuperTracker foods database
-- (FNDDS 6.0 and FPED 2011-2012). Read-only reference data, loaded by
-- db/supertracker/foods_fndds_2011.sql. Amounts in st2_food_value are per
-- 100 g: food groups in cup or ounce equivalents (FPED), oils in teaspoons,
-- added sugars and nutrients in grams, milligrams or micrograms.

BEGIN;

CREATE TABLE st2_food (
    id          integer PRIMARY KEY,           -- SuperTracker Food_Item_ID
    food_code   integer NOT NULL,              -- FNDDS food code
    mod_code    integer NOT NULL DEFAULT 0,
    name        text    NOT NULL,
    categories  text[]  NOT NULL DEFAULT '{}'
);

CREATE TABLE st2_food_value (
    food_id         integer PRIMARY KEY REFERENCES st2_food (id),
    veg_total       numeric(9,4) NOT NULL,
    veg_dark_green  numeric(9,4) NOT NULL,
    veg_red_orange  numeric(9,4) NOT NULL,
    veg_starchy     numeric(9,4) NOT NULL,
    veg_other       numeric(9,4) NOT NULL,
    legumes         numeric(9,4) NOT NULL,
    fruit_total     numeric(9,4) NOT NULL,
    fruit_juice     numeric(9,4) NOT NULL,
    dairy_total     numeric(9,4) NOT NULL,
    grain_total     numeric(9,4) NOT NULL,
    grain_whole     numeric(9,4) NOT NULL,
    protein_oz      numeric(9,4) NOT NULL,
    oils_tsp        numeric(9,4) NOT NULL,
    solid_fat_g     numeric(9,4) NOT NULL,
    added_sugar_g   numeric(9,4) NOT NULL,
    kcal            numeric(9,4) NOT NULL,
    protein_g       numeric(9,4) NOT NULL,
    fat_g           numeric(9,4) NOT NULL,
    sat_fat_g       numeric(9,4) NOT NULL,
    carbs_g         numeric(9,4) NOT NULL,
    sugars_g        numeric(9,4) NOT NULL,
    fiber_g         numeric(9,4) NOT NULL,
    sodium_mg       numeric(9,4) NOT NULL,
    potassium_mg    numeric(9,4) NOT NULL,
    calcium_mg      numeric(9,4) NOT NULL,
    iron_mg         numeric(9,4) NOT NULL,
    vitamin_a_mcg   numeric(9,4) NOT NULL,
    vitamin_c_mg    numeric(9,4) NOT NULL,
    vitamin_d_mcg   numeric(9,4) NOT NULL,
    cholesterol_mg  numeric(9,4) NOT NULL
);

-- Other names a food goes by, for search. Priority 1 is the main name.
CREATE TABLE st2_food_name (
    id        serial  PRIMARY KEY,
    food_id   integer NOT NULL REFERENCES st2_food (id),
    name      text    NOT NULL,
    priority  integer NOT NULL
);

CREATE TABLE st2_food_portion (
    id           serial  PRIMARY KEY,
    food_id      integer NOT NULL REFERENCES st2_food (id),
    description  text    NOT NULL,
    grams        numeric(9,4) NOT NULL CHECK (grams > 0),
    increment    numeric(6,4) NOT NULL,
    is_default   boolean NOT NULL DEFAULT false
);

CREATE INDEX st2_food_name_food_idx ON st2_food_name (food_id);
CREATE INDEX st2_food_portion_food_idx ON st2_food_portion (food_id);
CREATE INDEX st2_food_name_lower_idx ON st2_food_name (lower(name) text_pattern_ops);

COMMIT;