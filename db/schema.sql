-- VeggieBook2 schema, PostgreSQL 16
-- Rebuilt from the original app (Dump20201109.sql) with two deliberate changes.
--
-- CHANGE 1: bilingual text inline instead of a central strings table.
--   The original routed every piece of text through qhmobile_string, so a
--   single recipe read joined that table nine times (title, storyLine,
--   timeToPrepare, timeToCook, servings, canBeMadeAhead, canBeFrozen,
--   goodForLeftovers) plus once per ingredient and step. That design fits
--   incremental authoring and translation. Our content is complete and frozen,
--   so inline *_en / *_es columns are correct here.
--   Trade-off: a third language becomes a migration, not just new rows.
--
-- CHANGE 2: the OR-requirement layer is removed.
--   The original had qhmobile_orrequirement (a table with one column, id) and
--   qhmobile_orrequirement_attributes joining it to attributes. All 26
--   requirements wrap exactly one attribute. Not one OR group is used. Content
--   now points at attributes directly.
--   Trade-off: "matches if the user picked A or B" needs a schema change.
--   Given the content never used it and the question set is fixed by the study
--   design, that is the right trade.
--
-- What is NOT changed: the content itself, the 12-tips-per-vegetable grid, and
-- the question structure. Those were validated with pantry clients across
-- several published studies. They are the intervention, not implementation.

BEGIN;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

CREATE TABLE vegetable (
    code         varchar(24) PRIMARY KEY,      -- BROCCOLI, CABBAGE, ...
    short_code   varchar(4)  NOT NULL UNIQUE,  -- BR, CB, ... matches image dirs
    name_en      text        NOT NULL,
    name_es      text        NOT NULL,
    image_path   text,
    active       boolean     NOT NULL DEFAULT true,
    sort_order   int         NOT NULL DEFAULT 0
);

CREATE TABLE attribute (
    name         varchar(64) PRIMARY KEY   -- HasMicrowave, AgreeSoup, Storage...
);

-- ---------------------------------------------------------------------------
-- Self-profiling questions
--
-- 6 questions, 23 choices. One is hidden (mnemonic HIDDEN, qtype H) and
-- supplies ALL_USERS and Serving, which target content shown to everyone.
-- Intro text contains a %s placeholder for the vegetable name.
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

CREATE INDEX ON question_choice (question_id, sort_order);

-- ---------------------------------------------------------------------------
-- Recipes
--
-- 258 rows. Original PK was recipeId; AUTO_INCREMENT sat at 271, so some
-- recipes were deleted over the app's life. Keep the original ids so the
-- published research can be traced back to specific recipes.
-- ---------------------------------------------------------------------------

-- Two identifiers, because the original had two and they do not align.
--   rid           the five-digit internal number (10202, 10203, ...)
--   display_code  the human-readable code (BR-201), which exists only in the
--                 photo paths and is what the image directories are named
--                 after. Recipe rid 10202 lives in folder BR-201.
CREATE TABLE recipe (
    id                    int         PRIMARY KEY,   -- original recipeId
    rid                   varchar(6)  UNIQUE,
    display_code          varchar(12) UNIQUE,
    vegetable_code        varchar(24) NOT NULL REFERENCES vegetable(code),
    active                boolean     NOT NULL DEFAULT true,

    title_en              text NOT NULL,
    title_es              text NOT NULL,
    story_line_en         text,          -- nullable in the original
    story_line_es         text,
    time_to_prepare_en    text NOT NULL,
    time_to_prepare_es    text NOT NULL,
    time_to_cook_en       text NOT NULL,
    time_to_cook_es       text NOT NULL,
    servings_en           text NOT NULL,
    servings_es           text NOT NULL,
    can_be_made_ahead_en  text NOT NULL,
    can_be_made_ahead_es  text NOT NULL,
    can_be_frozen_en      text NOT NULL,
    can_be_frozen_es      text NOT NULL,
    good_for_leftovers_en text NOT NULL,
    good_for_leftovers_es text NOT NULL
);

CREATE INDEX ON recipe (vegetable_code) WHERE active;

CREATE TABLE recipe_ingredient (
    id          bigserial PRIMARY KEY,
    recipe_id   int  NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    position    int  NOT NULL,
    text_en     text NOT NULL,
    text_es     text NOT NULL,
    UNIQUE (recipe_id, position)
);

CREATE TABLE recipe_step (
    id          bigserial PRIMARY KEY,
    recipe_id   int  NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    position    int  NOT NULL,
    text_en     text NOT NULL,
    text_es     text NOT NULL,
    UNIQUE (recipe_id, position)
);

CREATE TABLE recipe_photo (
    id          bigserial PRIMARY KEY,
    recipe_id   int  NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    position    int  NOT NULL,
    image_path  text NOT NULL,
    UNIQUE (recipe_id, position)
);

-- 17 rows across 258 recipes. Genuinely occasional notes.
CREATE TABLE recipe_note (
    id          bigserial PRIMARY KEY,
    recipe_id   int  NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    position    int,
    text_en     text NOT NULL,
    text_es     text NOT NULL
);

CREATE INDEX ON recipe_note (recipe_id, position);

-- ---------------------------------------------------------------------------
-- Annotations
--
-- 4 annotations, 167 recipe links. These are the colored badges on a recipe
-- card ("Latino Flavors", "Kid Friendly" in the published screenshots). Each
-- carries its own display condition, so a badge appears only when the user
-- selected the matching attribute. Images differ by language because text is
-- baked into the artwork.
-- ---------------------------------------------------------------------------

CREATE TABLE annotation (
    id              int         PRIMARY KEY,
    displayed_if    varchar(64) NOT NULL REFERENCES attribute(name),
    text_en         text        NOT NULL,
    text_es         text        NOT NULL,
    image_path_en   text,
    image_path_es   text,
    color           char(6)     NOT NULL   -- hex, no leading #
);

CREATE TABLE recipe_annotation (
    recipe_id     int NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    annotation_id int NOT NULL REFERENCES annotation(id),
    PRIMARY KEY (recipe_id, annotation_id)
);

-- A recipe shows only when the user selected EVERY attribute listed here.
-- 360 rows across 258 recipes, roughly 1.4 conditions each.
CREATE TABLE recipe_attribute (
    recipe_id   int         NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    attribute   varchar(64) NOT NULL REFERENCES attribute(name),
    PRIMARY KEY (recipe_id, attribute)
);

CREATE INDEX ON recipe_attribute (attribute);

-- ---------------------------------------------------------------------------
-- Tips
--
-- 121 rows, 12 per vegetable (13 for broccoli). Each carries exactly one
-- attribute, so no join table is needed on this side.
-- ---------------------------------------------------------------------------

CREATE TABLE tip (
    id              int         PRIMARY KEY,
    vegetable_code  varchar(24) NOT NULL REFERENCES vegetable(code),
    attribute       varchar(64) NOT NULL REFERENCES attribute(name),
    heading_en      text        NOT NULL,
    heading_es      text        NOT NULL,
    sort_order      int         NOT NULL,   -- was fsIndex
    UNIQUE (vegetable_code, sort_order)
);

CREATE INDEX ON tip (vegetable_code, attribute);

-- 277 rows. Only 19 carry an image, so tips are text-first.
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

-- 5 rows: Breakfast, Lunch, Dinner, Snacks, Shopping. Each color-coded.
CREATE TABLE secret_category (
    id          int     PRIMARY KEY,
    name_en     text    NOT NULL,
    name_es     text    NOT NULL,
    image_path  text,
    color       char(6) NOT NULL,   -- hex, no leading #
    sort_order  int     NOT NULL DEFAULT 0
);

-- 79 rows. Note that images and attachments are per-language: the Secrets
-- illustrations have text baked into the artwork, so English and Spanish are
-- different files rather than the same file with different captions.
CREATE TABLE secret (
    id                int  PRIMARY KEY,
    display_number    int  NOT NULL,   -- was secret_id, the number within a category
    category_id       int  NOT NULL REFERENCES secret_category(id),
    active            boolean NOT NULL DEFAULT true,

    headline_en       text NOT NULL,
    headline_es       text NOT NULL,
    why_it_works_en   text NOT NULL,
    why_it_works_es   text NOT NULL,

    image_path_en     text,
    image_path_es     text,
    cover_image_en    text,
    cover_image_es    text,
    attachment_en     text,
    attachment_es     text
);

CREATE INDEX ON secret (category_id, display_number);

-- 57 rows. A secret can carry different links per language.
CREATE TABLE secret_link (
    id          bigserial  PRIMARY KEY,
    secret_id   int        NOT NULL REFERENCES secret(id) ON DELETE CASCADE,
    language    char(2)    NOT NULL,
    url         text       NOT NULL,
    label_en    text,
    label_es    text
);

CREATE INDEX ON secret_link (secret_id, language);

-- ---------------------------------------------------------------------------
-- Participant sessions
--
-- Deliberately thin and free of personal identifiers. The IRB decision on
-- where participant data lives is not made, so the API writes through an
-- interface and this is only the default implementation.
-- ---------------------------------------------------------------------------

CREATE TABLE book_session (
    id              uuid        PRIMARY KEY,
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
    session_id   uuid       NOT NULL REFERENCES book_session(id) ON DELETE CASCADE,
    content_type varchar(8) NOT NULL CHECK (content_type IN ('recipe','tip','secret')),
    content_id   int        NOT NULL,
    kept         boolean    NOT NULL,
    PRIMARY KEY (session_id, content_type, content_id)
);

COMMIT;

-- ---------------------------------------------------------------------------
-- The matching engine, now two plain queries
--
-- $1 = vegetable code, $2 = text[] of attributes the user selected
-- (always include 'ALL_USERS' in $2)
-- ---------------------------------------------------------------------------

-- Recipes: every attribute the recipe requires must be in the selected set.
--
-- SELECT r.*
-- FROM recipe r
-- WHERE r.vegetable_code = $1
--   AND r.active
--   AND NOT EXISTS (
--         SELECT 1 FROM recipe_attribute ra
--         WHERE ra.recipe_id = r.id
--           AND NOT (ra.attribute = ANY($2))
--   )
-- ORDER BY r.display_code;

-- Tips: one attribute each, so it is a single membership test.
--
-- SELECT t.*
-- FROM tip t
-- WHERE t.vegetable_code = $1
--   AND t.attribute = ANY($2)
-- ORDER BY t.sort_order;

-- ---------------------------------------------------------------------------
-- Original tables deliberately not carried over
-- ---------------------------------------------------------------------------
--
-- qhmobile_orrequirement, qhmobile_orrequirement_attributes
--     Collapsed into direct attribute references. See CHANGE 2 above.
-- qhmobile_string
--     Inlined as *_en / *_es columns. See CHANGE 1 above.
-- qhmobile_tipdoc
--     Empty in the dump. A document-generation feature that was never used.
-- qhmobile_recipeannotation
--     One row, one column (name). A leftover type marker with no function.
-- qhmobile_booktype, qhmobile_choicequestion, qhmobile_multiplechoicequestion,
-- qhmobile_singlechoicequestion
--     Django model-inheritance scaffolding with no rows of their own.
-- qhmobile_foodpantry, easy_maps_address
--     Pantry locations, part of the original field trial. Out of scope for v1.
-- qhmobile_quickhelpuser, qhmobile_userprofile, auth_*, django_*, celery_*,
-- djcelery_*, south_migrationhistory
--     Framework and account tables from the Django app. Not applicable.
-- qhmobile_viewingdata, qhmobile_librarydata
--     Analytics from the original trial. If faculty want usage analytics,
--     that is a separate design conversation, not a table to port.
-- qhmobile_recipebook*, qhmobile_secretbook*
--     The original booklet-creation feature. Booklet is deferred from v1, and
--     book_session above is the replacement design when it returns.

-- ---------------------------------------------------------------------------
-- Still open
-- ---------------------------------------------------------------------------
--
-- 1. short_code (BR, CB, ...) does not appear in qhmobile_foodstuff, whose PK
--    is the long form (BROCCOLI). The short codes are used in image directory
--    names and recipe rids. Derive them from rid prefixes during seeding and
--    verify all ten map cleanly.
-- 2. FULL vs REDUCED image variants: resolution only, or different content.
--    Compare file sizes and dimensions for one vegetable before deciding
--    whether both need storing.
-- 3. 13 broccoli tips against 12 for every other vegetable. Check whether the
--    extra one is intentional or a duplicate.
-- 4. Secret display_number (original column secret_id) is assumed to be the
--    number within a category. Verify against the image filenames, which run
--    Breakfast-1 through Breakfast-22.
-- 5. The four annotations' displayed_if values need checking. The column is an
--    int FK in the original, pointing at orrequirement; after collapsing, it
--    should resolve to a single attribute name.
