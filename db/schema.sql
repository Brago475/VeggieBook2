-- VeggieBook2 schema, PostgreSQL 16
-- Derived from the original app's structure (Dump20201109.sql), rebuilt with
-- inline bilingual columns instead of a central string table.
--
-- Design notes:
--
-- 1. Bilingual text is stored as *_en / *_es column pairs on each entity rather
--    than through a shared strings table. The original used a strings table
--    because content was authored incrementally; our translations are complete
--    and frozen, so inline columns remove a join from every single query.
--
-- 2. Targeting lives in real tables, not application code. A piece of content
--    can carry several requirements. Each requirement is satisfied when the
--    user selected ANY of its attributes. Content matches when ALL of its
--    requirements are satisfied. That is an AND of ORs, and it is expressible
--    as one query (see the bottom of this file).
--
-- 3. Intro strings contain a %s placeholder for the vegetable name.
--    Rendering substitutes it per selected vegetable.

BEGIN;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

CREATE TABLE vegetable (
    code         varchar(24) PRIMARY KEY,   -- BROCCOLI, CABBAGE, ...
    short_code   varchar(4)  NOT NULL,      -- BR, CB, ... matches image folders
    name_en      text        NOT NULL,
    name_es      text        NOT NULL,
    image_path   text,
    active       boolean     NOT NULL DEFAULT true,
    sort_order   int         NOT NULL DEFAULT 0
);

CREATE TABLE attribute (
    name         varchar(64) PRIMARY KEY    -- HasMicrowave, AgreeSoup, ...
);

-- ---------------------------------------------------------------------------
-- Self-profiling questions
-- ---------------------------------------------------------------------------

CREATE TABLE question (
    id             int         PRIMARY KEY,
    mnemonic       varchar(32) NOT NULL UNIQUE,
    phase          varchar(8)  NOT NULL,
    qtype          char(1)     NOT NULL,   -- Z = multi-select, H = hidden
    order_priority int         NOT NULL,
    intro_en       text,
    intro_es       text,
    sub_intro_en   text,
    sub_intro_es   text,
    is_hidden      boolean     NOT NULL DEFAULT false
);

CREATE TABLE question_choice (
    id             int         PRIMARY KEY,
    question_id    int         NOT NULL REFERENCES question(id),
    attribute      varchar(64) NOT NULL REFERENCES attribute(name),
    text_en        text        NOT NULL,
    text_es        text        NOT NULL,
    is_default     boolean     NOT NULL DEFAULT false,
    sort_order     int         NOT NULL DEFAULT 0
);

CREATE INDEX ON question_choice (question_id);

-- ---------------------------------------------------------------------------
-- Targeting rules
-- ---------------------------------------------------------------------------

-- A requirement is a named OR group. It is satisfied when the user has
-- selected at least one of its attributes.
CREATE TABLE requirement (
    id           int PRIMARY KEY,
    note         text            -- optional human label, for admin clarity
);

CREATE TABLE requirement_attribute (
    requirement_id int         NOT NULL REFERENCES requirement(id) ON DELETE CASCADE,
    attribute      varchar(64) NOT NULL REFERENCES attribute(name),
    PRIMARY KEY (requirement_id, attribute)
);

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------

CREATE TABLE recipe (
    id              int         PRIMARY KEY,
    code            varchar(16) NOT NULL UNIQUE,  -- BR-201, CA-215, ...
    vegetable_code  varchar(24) NOT NULL REFERENCES vegetable(code),
    title_en        text        NOT NULL,
    title_es        text        NOT NULL,
    servings_en     text,
    servings_es     text,
    active          boolean     NOT NULL DEFAULT true
);

CREATE INDEX ON recipe (vegetable_code);

CREATE TABLE recipe_ingredient (
    id          bigserial PRIMARY KEY,
    recipe_id   int  NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    position    int  NOT NULL,
    text_en     text NOT NULL,
    text_es     text NOT NULL
);

CREATE INDEX ON recipe_ingredient (recipe_id, position);

CREATE TABLE recipe_step (
    id          bigserial PRIMARY KEY,
    recipe_id   int  NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    position    int  NOT NULL,
    text_en     text NOT NULL,
    text_es     text NOT NULL
);

CREATE INDEX ON recipe_step (recipe_id, position);

CREATE TABLE recipe_photo (
    id          bigserial PRIMARY KEY,
    recipe_id   int  NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    position    int  NOT NULL,
    image_path  text NOT NULL
);

CREATE INDEX ON recipe_photo (recipe_id, position);

-- A recipe shows only when ALL of its requirements are satisfied.
CREATE TABLE recipe_requirement (
    recipe_id      int NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    requirement_id int NOT NULL REFERENCES requirement(id),
    PRIMARY KEY (recipe_id, requirement_id)
);

-- ---------------------------------------------------------------------------
-- Tips
-- ---------------------------------------------------------------------------

-- 121 rows: roughly 12 per vegetable, one per topic.
CREATE TABLE tip (
    id              int         PRIMARY KEY,
    vegetable_code  varchar(24) NOT NULL REFERENCES vegetable(code),
    requirement_id  int         NOT NULL REFERENCES requirement(id),
    heading_en      text        NOT NULL,
    heading_es      text        NOT NULL,
    fs_index        int         NOT NULL   -- order within the vegetable
);

CREATE INDEX ON tip (vegetable_code, fs_index);

-- 277 rows: ordered body blocks, 19 of which carry an illustration.
CREATE TABLE tip_block (
    id          int  PRIMARY KEY,
    tip_id      int  NOT NULL REFERENCES tip(id) ON DELETE CASCADE,
    position    int,
    text_en     text NOT NULL,
    text_es     text NOT NULL,
    image_path  text
);

CREATE INDEX ON tip_block (tip_id, position);

-- ---------------------------------------------------------------------------
-- Secrets
-- ---------------------------------------------------------------------------

CREATE TABLE secret_category (
    id        int  PRIMARY KEY,
    name_en   text NOT NULL,   -- Breakfast, Lunch, Dinner, Snacks, Shopping
    name_es   text NOT NULL,
    image_path text,
    sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE secret (
    id           int  PRIMARY KEY,
    category_id  int  NOT NULL REFERENCES secret_category(id),
    headline_en  text NOT NULL,
    headline_es  text NOT NULL,
    body_en      text,          -- the "Why It Works" panel
    body_es      text,
    image_path   text,
    sort_order   int  NOT NULL DEFAULT 0
);

CREATE INDEX ON secret (category_id, sort_order);

CREATE TABLE secret_attachment (
    id          bigserial PRIMARY KEY,
    secret_id   int  NOT NULL REFERENCES secret(id) ON DELETE CASCADE,
    file_path   text NOT NULL,
    label_en    text,
    label_es    text
);

CREATE TABLE secret_link (
    id          bigserial PRIMARY KEY,
    secret_id   int  NOT NULL REFERENCES secret(id) ON DELETE CASCADE,
    url         text NOT NULL,
    label_en    text,
    label_es    text
);

-- ---------------------------------------------------------------------------
-- Participant responses
--
-- Kept deliberately thin and free of personal identifiers. The IRB decision on
-- where participant data lives has not been made, so the API writes through an
-- interface and this is only the default implementation. Swapping the store
-- later should not require touching anything above this line.
-- ---------------------------------------------------------------------------

CREATE TABLE book_session (
    id              uuid PRIMARY KEY,
    created_at      timestamptz NOT NULL DEFAULT now(),
    language        char(2)     NOT NULL DEFAULT 'en',
    vegetable_code  varchar(24) REFERENCES vegetable(code)
);

CREATE TABLE book_session_attribute (
    session_id  uuid        NOT NULL REFERENCES book_session(id) ON DELETE CASCADE,
    attribute   varchar(64) NOT NULL REFERENCES attribute(name),
    PRIMARY KEY (session_id, attribute)
);

CREATE TABLE book_session_selection (
    session_id   uuid    NOT NULL REFERENCES book_session(id) ON DELETE CASCADE,
    content_type varchar(8) NOT NULL,   -- 'recipe' | 'tip' | 'secret'
    content_id   int     NOT NULL,
    kept         boolean NOT NULL,
    PRIMARY KEY (session_id, content_type, content_id)
);

COMMIT;

-- ---------------------------------------------------------------------------
-- The matching query
--
-- Given a vegetable and the set of attributes a user selected, return the
-- recipes that match. A recipe matches when every one of its requirements has
-- at least one attribute in the selected set. Recipes with no requirements
-- always match.
--
-- Parameters: $1 = vegetable code, $2 = text[] of selected attribute names
-- ---------------------------------------------------------------------------

-- SELECT r.*
-- FROM recipe r
-- WHERE r.vegetable_code = $1
--   AND r.active
--   AND NOT EXISTS (
--         SELECT 1
--         FROM recipe_requirement rr
--         WHERE rr.recipe_id = r.id
--           AND NOT EXISTS (
--                 SELECT 1
--                 FROM requirement_attribute ra
--                 WHERE ra.requirement_id = rr.requirement_id
--                   AND ra.attribute = ANY($2)
--           )
--   )
-- ORDER BY r.code;

-- The same shape works for tips, which carry exactly one requirement each:
--
-- SELECT t.*
-- FROM tip t
-- WHERE t.vegetable_code = $1
--   AND EXISTS (
--         SELECT 1
--         FROM requirement_attribute ra
--         WHERE ra.requirement_id = t.requirement_id
--           AND ra.attribute = ANY($2)
--   )
-- ORDER BY t.fs_index;

-- ---------------------------------------------------------------------------
-- Still to verify against the dump before the seeder is written
-- ---------------------------------------------------------------------------
--
-- 1. recipe columns. The recipe table above is a reasonable shape but the
--    original qhmobile_recipe columns have not been inspected. Confirm what
--    fields exist (servings? notes? annotations?) before finalizing.
-- 2. qhmobile_recipe_annotations and qhmobile_recipeannotation. Not yet
--    examined. Annotations may be the "see Cutting Tip" cross-references that
--    appear inside ingredient text.
-- 3. qhmobile_secret columns, and how secret attachments and external links
--    attach. qhmobile_externallink exists and has data.
-- 4. Whether short_code (BR, CB) exists in the data or must be derived from
--    the image folder names.
-- 5. FULL vs REDUCED image variants: resolution only, or different content.
