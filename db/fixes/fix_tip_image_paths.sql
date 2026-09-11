-- Fix: tip illustration paths.
--
-- The original data stored tip pictures as img/<VEG>/<file>, for example
-- img/BR/S10-T1.jpg. The files live under tip/<VEG>/<file> in images/, so
-- every tip picture pointed at a folder that does not exist.
-- Found 2026-09-11: 19 paths, and every one exists under tip/.
--
-- Only paths with a vegetable folder change. Recipe photos stored as
-- img/<file>, with no folder, are a different problem: those files were
-- never received, and are waiting on the original owner's media folder.
--
-- Safe to run more than once: after the first run, no tip path starts
-- with img/.
--
-- Run on the server:
--   docker compose exec -T db sh -c \
--     'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
--     < db/fixes/fix_tip_image_paths.sql

BEGIN;

UPDATE tip_block
SET image_path = 'tip/' || substr(image_path, 5)
WHERE image_path ~ '^img/[A-Z]{2}/';

COMMIT;