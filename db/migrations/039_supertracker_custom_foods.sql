-- SuperTracker2: Create My Food. Custom foods are counted by servings, with
-- values per serving and the food group servings one serving counts as.
-- Food log entries and combo items now point to either a USDA food or a
-- custom food, never both. Removing a custom food sets removed_at; rows are
-- never deleted. Only st2_ tables are changed.

BEGIN;

CREATE TABLE st2_custom_food (
    id             bigserial    PRIMARY KEY,
    user_id        uuid         NOT NULL REFERENCES app_user (id),
    name           text         NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    serving        text         NOT NULL CHECK (char_length(serving) BETWEEN 1 AND 40),
    serving_grams  numeric(7,1) CHECK (serving_grams > 0 AND serving_grams <= 5000),
    kcal           numeric(7,1) NOT NULL CHECK (kcal >= 0 AND kcal <= 5000),
    protein_g      numeric(7,1) NOT NULL DEFAULT 0 CHECK (protein_g >= 0 AND protein_g <= 500),
    sat_fat_g      numeric(7,1) NOT NULL DEFAULT 0 CHECK (sat_fat_g >= 0 AND sat_fat_g <= 500),
    sodium_mg      numeric(7,1) NOT NULL DEFAULT 0 CHECK (sodium_mg >= 0 AND sodium_mg <= 20000),
    added_sugar_g  numeric(7,1) NOT NULL DEFAULT 0 CHECK (added_sugar_g >= 0 AND added_sugar_g <= 500),
    fiber_g        numeric(7,1) NOT NULL DEFAULT 0 CHECK (fiber_g >= 0 AND fiber_g <= 200),
    vegetables     numeric(4,2) NOT NULL DEFAULT 0 CHECK (vegetables BETWEEN 0 AND 10),
    fruits         numeric(4,2) NOT NULL DEFAULT 0 CHECK (fruits BETWEEN 0 AND 10),
    dairy          numeric(4,2) NOT NULL DEFAULT 0 CHECK (dairy BETWEEN 0 AND 10),
    whole_grains   numeric(4,2) NOT NULL DEFAULT 0 CHECK (whole_grains BETWEEN 0 AND 10),
    healthy_fats   numeric(4,2) NOT NULL DEFAULT 0 CHECK (healthy_fats BETWEEN 0 AND 10),
    created_at     timestamptz  NOT NULL DEFAULT now(),
    updated_at     timestamptz  NOT NULL DEFAULT now(),
    removed_at     timestamptz
);

CREATE INDEX st2_custom_food_user_idx ON st2_custom_food (user_id);

ALTER TABLE st2_food_entry ALTER COLUMN food_id DROP NOT NULL;
ALTER TABLE st2_food_entry ADD COLUMN custom_food_id bigint REFERENCES st2_custom_food (id);
ALTER TABLE st2_food_entry ADD CONSTRAINT st2_food_entry_one_food
    CHECK ((food_id IS NULL) <> (custom_food_id IS NULL));

ALTER TABLE st2_combo_item ALTER COLUMN food_id DROP NOT NULL;
ALTER TABLE st2_combo_item ADD COLUMN custom_food_id bigint REFERENCES st2_custom_food (id);
ALTER TABLE st2_combo_item ADD CONSTRAINT st2_combo_item_one_food
    CHECK ((food_id IS NULL) <> (custom_food_id IS NULL));

COMMIT;