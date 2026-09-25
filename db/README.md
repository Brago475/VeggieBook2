# Database

PostgreSQL 16. Everything needed to build the database from nothing is in
this folder, and it must be run **in this order**:

1. `schema.sql`: the content tables (vegetables, questions, recipes, tips,
   secrets), mirroring the original app's structure
2. `seed-data.sql`: the original VeggieBook content, from the original
   project's 2020 database dump
3. `migrations/`: the user data tables, in number order
   - `001_accounts.sql`: accounts
   - `002_books.sql`: saved books (builds on the `book_session` tables in
     `schema.sql`)
4. `fixes/`: every correction made since, **in number order**
   (`003_...` through the highest number). The unnumbered ones
   (`fix_veg_images.sql`, `fix_tip_image_paths.sql`) were run earlier and
   are kept for the record.

Skipping step 4 gives a database that looks complete but is not: for
example, the Secrets Book would show every secret without its text.

Every file in `fixes/` is written so it is safe on a fresh database: it
checks before it changes anything, and runs in a single transaction.

## Things that are not what they look like

**`secret.display_number` is not a display number.** The original import
put the ID of each secret's body text in this column, and the comment in
`schema.sql` ("was secret_id, the number within a category") describes what
the importer thought it was, not what it is. The body text itself is in
`secret.body_en` and `secret.body_es`, added by
`fixes/008_add_secret_body.sql`. The IDs rise in the original app's order,
so sorting by `display_number` still gives the original order, and the API
relies on that.

**`book_session.kind`** is `veggie` or `secrets`. A VeggieBook sets
`vegetable_code`; a Secrets Book sets `secret_category_id` (added by
`fixes/009_book_session_secret_category.sql`). Each leaves the other null.

**Removed items are not deleted.** Taking a recipe or secret out of a saved
book sets `book_session_selection.kept` to false, so the study data still
shows it was in the book. Every screen and count reads only kept rows.

## Rules for changing the database

- The content tables (everything from `schema.sql` and `seed-data.sql`)
  are the original data. They are never changed or deleted from except by
  a reviewed file in `fixes/`, run by hand.
- A change is a new numbered file in `fixes/`, never an edit to a file that
  has already been run.
- Prefer additive changes (new columns, new tables). Then older code keeps
  working with the newer database, and rolling back the code is safe.
- Take a backup (`pg_dump`) before running any change on the live database.