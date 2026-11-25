-- SuperTracker2: the setup profile and Terms acceptance.
-- Separate from VeggieBook and not part of research data.
-- Height and weight are stored in metric; the app converts for display.

BEGIN;

CREATE TABLE st2_profile (
    user_id     uuid PRIMARY KEY REFERENCES app_user (id),
    age         smallint     NOT NULL CHECK (age BETWEEN 18 AND 120),
    sex         text         NOT NULL CHECK (sex IN ('female', 'male')),
    height_cm   numeric(5,1) NOT NULL CHECK (height_cm BETWEEN 100 AND 250),
    weight_kg   numeric(5,1) NOT NULL CHECK (weight_kg BETWEEN 30 AND 350),
    activity    text         NOT NULL CHECK (activity IN ('sedentary', 'moderate', 'active')),
    units       text         NOT NULL DEFAULT 'us' CHECK (units IN ('us', 'metric')),
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE st2_terms_acceptance (
    id           bigserial PRIMARY KEY,
    user_id      uuid        NOT NULL REFERENCES app_user (id),
    version      text        NOT NULL,
    accepted_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, version)
);

COMMIT;