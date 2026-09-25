-- Lets a saved book record which Secrets category it was made from.
--
-- A VeggieBook is tied to a vegetable through vegetable_code; a Secrets
-- Book needs the same link to its category, so the home library can show
-- "Shopping Secrets" on the card. Matches the original app, whose
-- secretbook table had a category_id.
--
-- Adds one empty column. Existing books are not changed: every one of
-- them is a VeggieBook and keeps a null category. Nothing is deleted.

BEGIN;

ALTER TABLE book_session
  ADD COLUMN IF NOT EXISTS secret_category_id integer
  REFERENCES secret_category(id);

-- Check: every existing book should still be a VeggieBook with no category.
SELECT kind, count(*) AS books, count(secret_category_id) AS with_category
FROM book_session
GROUP BY kind;

COMMIT;