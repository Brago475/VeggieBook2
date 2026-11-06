-- Removes first and last name from accounts. Accounts keep only a username.
--
-- Run only after the API without FirstName/LastName is deployed; the older
-- API reads these columns on every account lookup.
--
-- Postgres keeps a dropped column's old values on disk until the table is
-- rewritten, so the names are cleared first and the table is rewritten after.

BEGIN;

UPDATE app_user SET first_name = NULL, last_name = NULL
WHERE first_name IS NOT NULL OR last_name IS NOT NULL;

ALTER TABLE app_user DROP COLUMN IF EXISTS first_name;
ALTER TABLE app_user DROP COLUMN IF EXISTS last_name;

COMMIT;

-- Outside the transaction: rewrites app_user so no old values remain on disk.
VACUUM FULL app_user;