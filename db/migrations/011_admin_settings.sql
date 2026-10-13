-- 011: site settings and daily guest counts.
--
-- app_setting   one row per setting, changed from the admin site
-- guest_daily   how many guest visits started each day (Eastern). A count
--               only: no account or guest ID is stored.

BEGIN;

CREATE TABLE IF NOT EXISTS app_setting (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS guest_daily (
  day     date PRIMARY KEY,
  started integer NOT NULL DEFAULT 0 CHECK (started >= 0)
);

INSERT INTO app_setting (key, value) VALUES ('guests_allowed', 'true')
ON CONFLICT (key) DO NOTHING;

COMMIT;