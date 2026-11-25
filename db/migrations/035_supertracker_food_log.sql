-- SuperTracker2: the VeggieBook vegetables matched to their USDA foods, and
-- the food log. Root Vegetables is split into its three kinds. cup_grams is
-- the weight of 1 cup chopped (or the USDA cup) for that food.
-- Only st2_ tables are created; VeggieBook content is not changed.

BEGIN;

CREATE TABLE st2_vegetable (
    key             text     PRIMARY KEY,
    vegetable_code  text     NOT NULL,          -- VeggieBook vegetable code
    name_en         text     NOT NULL,
    name_es         text     NOT NULL,
    food_id         integer  NOT NULL REFERENCES st2_food (id),
    cup_grams       numeric(7,2) NOT NULL CHECK (cup_grams > 0),
    position        smallint NOT NULL
);

INSERT INTO st2_vegetable (key, vegetable_code, name_en, name_es, food_id, cup_grams, position) VALUES
    ('BROCCOLI',      'BROCCOLI',      'Broccoli',       'Brócoli',     3959,  88, 1),
    ('CABBAGE',       'CABBAGE',       'Cabbage',        'Repollo',     4136,  89, 2),
    ('CARROT',        'CARROT',        'Carrots',        'Zanahorias',  3979, 128, 3),
    ('CAULIFLOWER',   'CAULIFLOWER',   'Cauliflower',    'Coliflor',    4140, 107, 4),
    ('GREENBEAN',     'GREENBEAN',     'Green beans',    'Ejotes',      5187, 125, 5),
    ('ONION',         'ONION',         'Onions',         'Cebollas',    4159, 160, 6),
    ('POTATO',        'POTATO',        'Potatoes',       'Papas',       5159, 122, 7),
    ('ROOT_BEET',     'ROOTVEGETABLE', 'Beets',          'Betabel',     4133, 136, 8),
    ('ROOT_PARSNIP',  'ROOTVEGETABLE', 'Parsnips',       'Chirivías',   5211, 156, 9),
    ('ROOT_TURNIP',   'ROOTVEGETABLE', 'Turnips',        'Nabos',       4174, 130, 10),
    ('SWEETPOTATO',   'SWEETPOTATO',   'Sweet potatoes', 'Camotes',     5182, 200, 11),
    ('ZUCCHINI',      'ZUCCHINI',      'Zucchini',       'Calabacita',  4173, 124, 12);

-- What each account ate, one row per food added. grams is the total weight
-- eaten, so every amount is the food's per-100 g value times grams / 100.
CREATE TABLE st2_food_entry (
    id             bigserial    PRIMARY KEY,
    user_id        uuid         NOT NULL REFERENCES app_user (id),
    eaten_on       date         NOT NULL,
    meal           text         CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_id        integer      NOT NULL REFERENCES st2_food (id),
    vegetable_key  text         REFERENCES st2_vegetable (key),
    portion        text         NOT NULL,
    quantity       numeric(6,2) NOT NULL CHECK (quantity > 0 AND quantity <= 50),
    grams          numeric(8,2) NOT NULL CHECK (grams > 0),
    created_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX st2_food_entry_user_day_idx ON st2_food_entry (user_id, eaten_on);

COMMIT;