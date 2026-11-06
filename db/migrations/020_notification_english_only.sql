-- 020: notifications are written in English only.
--
-- Spanish is stored only for the built-in pilot templates
-- (api/Notifications/NotificationTemplates.cs) sent with their English
-- unchanged. Any other message shows its English to everyone, so body_es
-- becomes optional and body_es_auto (automatic translation) is removed.
--
-- Runs while the notification table is still empty.

BEGIN;

ALTER TABLE notification ALTER COLUMN body_es DROP NOT NULL;
ALTER TABLE notification DROP COLUMN IF EXISTS body_es_auto;

COMMIT;