# Secrets removed from the original app

The original VeggieBook app showed more secrets than VeggieBook2 does. The
difference is explained below. VeggieBook2 was built from the original
app's final data (the database dump of November 9, 2020), which does not
include them.

## Summary

| Category  | Removed | Switched off | In VeggieBook2 | Original total |
|-----------|--------:|-------------:|---------------:|---------------:|
| Breakfast |       2 |            1 |             18 |             21 |
| Lunch     |       1 |            0 |             12 |             13 |
| Dinner    |    2 or 3 |          0 |             25 |      27 or 28 |
| Snack     |       0 |            0 |             13 |             13 |
| Shopping  |  1 or 2 |            0 |             10 |       11 or 12 |

"Be a dinner planner." is counted under both Dinner and Shopping because
its category was not recorded (see below).

The Breakfast total of 21 matches the count shown in the original app's
demonstration video, which was recorded before the removals.

## Removed secrets

The original team deleted these seven secrets through the original app's
admin site on August 1 and 2, 2019. The deletions are recorded in the
dump's `django_admin_log` table (content type 50, action 3 = delete).

| Original id | Category | Removed | Title |
|---:|---|---|---|
| 3  | Breakfast | 2019-08-01 | Let your child personalize breakfast. |
| 16 | Breakfast | 2019-08-01 | Plan your week's breakfast choices with your family. |
| 25 | Lunch     | 2019-08-01 | Let your child personalize lunch. |
| 42 | Dinner    | 2019-08-01 | Help your family with portion control. |
| 59 | Dinner    | 2019-08-01 | Serving veggies can make you a hero to your family, even if they don't always say so. |
| 83 | Shopping  | 2019-08-01 | Try not to shop when you are hungry. |
| 91 | Not recorded | 2019-08-02 | Be a dinner planner. |

How the category was determined: the original secret ids and title string
ids were assigned in order, one category at a time. Ids 3 and 16 fall in
the Breakfast range (2 to 23), 25 in Lunch (24 to 36), 42 and 59 in Dinner
(37 to 63), and 83 in Shopping (78 to 94). Id 91 falls in the Shopping id
range, but its text was added later (string ids 6078 and 6086), so its
position does not show its category. Its name suggests Dinner.

## Switched off

One secret is still in the data but marked inactive (`active = false`), so
VeggieBook2 does not show it. This matches the original app, which also
hid inactive secrets.

| Id | Category | Title |
|---:|---|---|
| 22 | Breakfast | Be patient in introducing new foods--and keep trying! |

## Where the removed secrets' content is

**Not in the VeggieBook2 database.** The deleted rows were gone from the
original `qhmobile_secret` table before the 2020 dump was made.

**Their text is still in the 2020 dump**, in the `qhmobile_string` table.
Each secret's title, secret text, and "Why It Works" text were stored as
separate strings, in English and Spanish, and those strings were not
deleted with the secret. None of the strings below is used by any
remaining secret.

| Original id | Title string | Other text strings |
|---:|---:|---|
| 3  | 5608 | 5606, 5607 |
| 16 | 5645 | 5646, 5647 |
| 25 | 5672 | 5673, 5674 |
| 42 | 5723 | 5724, 5725 |
| 59 | 5774 | 5775, 5776 |
| 83 | 5846 | 5847, 5848 |
| 91 | 6078 and 6086 (two copies) | 6079, 6080 and 6087, 6088 |

Which of the two other strings is the secret text and which is "Why It
Works" would need to be confirmed by reading them.

Source: repository `VeggieBookOpenSource/veggiebook-backend`, file
`database/Dump20201109.sql`.

**Their pictures were not recorded.** A secret's picture path was stored
on the deleted row itself. These files in the original
`static/secrets/` folder are not used by any remaining secret, and may
include some of the removed secrets' pictures:

- `Dinner-secret-6.jpg`
- `Dinner-secret-16-v1.jpg`
- `Shopping-secret-6.jpg`
- `Snacks-secret-5.jpg`

The same folder also holds files that are not secret pictures
(`DanHead.png`, `IMG_20120405_113210.jpg`, `image001.jpg`,
`rootvegetable.jpg`, `Screen_Shot_2014-04-17_at_6.05.57_PM.png`,
`vblauncher.png`).

## Restoring them

Restoring any of these would mean adding new rows to the `secret` table,
built from the strings above and a chosen picture, as a new numbered file
in `db/fixes/`. The content tables are changed only by a reviewed fix
file, run by hand (see `db/README.md`). Whether to restore them is a
content decision for the project lead.