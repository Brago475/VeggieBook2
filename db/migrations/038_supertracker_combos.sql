-- SuperTracker2: My Combo. A saved group of foods (like "my usual
-- breakfast") that can be added to a meal at once. Removing a combo sets
-- removed_at; rows are never deleted. Only st2_ tables are created.

BEGIN;

CREATE TABLE st2_combo (
    id          bigserial   PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES app_user (id),
    name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
    created_at  timestamptz NOT NULL DEFAULT now(),
    removed_at  timestamptz
);

CREATE TABLE st2_combo_item (
    id             bigserial    PRIMARY KEY,
    combo_id       bigint       NOT NULL REFERENCES st2_combo (id),
    position       smallint     NOT NULL,
    food_id        integer      NOT NULL REFERENCES st2_food (id),
    vegetable_key  text         REFERENCES st2_vegetable (key),
    portion        text         NOT NULL,
    quantity       numeric(6,2) NOT NULL CHECK (quantity > 0 AND quantity <= 50),
    grams          numeric(8,2) NOT NULL CHECK (grams > 0)
);

CREATE INDEX st2_combo_user_idx ON st2_combo (user_id);
CREATE INDEX st2_combo_item_combo_idx ON st2_combo_item (combo_id);

COMMIT;