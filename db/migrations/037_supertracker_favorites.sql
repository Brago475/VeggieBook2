-- SuperTracker2: food log entries are hidden instead of deleted, and each
-- account can star favorite foods. Un-starring sets removed_at; rows are
-- never deleted. Only st2_ tables are changed.

BEGIN;

ALTER TABLE st2_food_entry ADD COLUMN deleted_at timestamptz;

CREATE TABLE st2_favorite_food (
    user_id     uuid        NOT NULL REFERENCES app_user (id),
    food_id     integer     NOT NULL REFERENCES st2_food (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    removed_at  timestamptz,
    PRIMARY KEY (user_id, food_id)
);

COMMIT;