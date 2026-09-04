# VeggieBook content export

Extracted from `database/Dump20201109.sql` in `VeggieBookOpenSource/veggiebook-backend`.
The original schema stores every piece of user-facing text in a separate `qhmobile_string`
table keyed by id, with `en` and `es` columns. This export resolves those joins, so every
text field below is an object shaped `{"en": "...", "es": "..."}`.

Soft hyphens (U+00AD) and non-breaking spaces from the original data have been stripped.

## Files

| file | contents |
|---|---|
| `recipes.json` | 258 recipes, fully nested |
| `secrets.json` | 79 Secrets (the SecretsBook content) |
| `secret-categories.json` | the 5 Secrets categories with display colors and order |
| `vegetables.json` | the 10 vegetables recipes are organized around |
| `strings.json` | the raw i18n table, 6,133 entries, if you need anything not resolved above |
| `recipes.csv` | flattened English view for spreadsheets |
| `secrets.csv` | same for Secrets |

## Recipe shape

```json
{
  "id": 3,
  "code": "10204",
  "vegetable": "BROCCOLI",
  "active": true,
  "title": { "en": "...", "es": "..." },
  "storyline": { "en": "...", "es": "..." },
  "timeToPrepare": { "en": "25 minutes", "es": "25 minutos" },
  "timeToCook": { "en": "...", "es": "..." },
  "servings": { "en": "6-8", "es": "6-8" },
  "canBeMadeAhead": { "en": "...", "es": "..." },
  "canBeFrozen": { "en": "...", "es": "..." },
  "goodForLeftovers": { "en": "...", "es": "..." },
  "ingredients": [ { "en": "...", "es": "..." } ],
  "steps": [ { "en": "...", "es": "..." } ],
  "notes": [ { "en": "...", "es": "..." } ],
  "photos": [ "recipe/BR-204/photo1.jpg" ],
  "attributeGroups": [ ["ALL_USERS"], ["HasCrockPot"] ]
}
```

`ingredients`, `steps`, and `notes` are in their original display order.

`photos` paths are relative to the root of the images bundle, so
`recipe/BR-204/photo1.jpg` resolves against `veggiebook-images/`.
Note the photo directory prefix (`BR-`, `CA-`, etc.) is the vegetable, and does not
always match the numeric `code` field. Use the `photos` array rather than deriving paths.

`attributeGroups` is the targeting logic the original app used to pick recipes for a
user. Each inner array is an OR group, and all groups must match (AND across groups).
`ALL_USERS` means unconditional.

## Coverage

All 258 recipes have a title, ingredients, steps, at least one photo, and complete
Spanish translations. 1,626 ingredient lines and 1,430 preparation steps total.

The `qhmobile_tipdoc` and `qhmobile_orderabletip` tables were empty in the dump, so
there is no tips JSON. The tip artwork itself is present under `tip/` in the images
bundle if you want to rebuild that feature.

## License

Source repositories are GPL-3.0. The USDA SNAP-Ed listing states the app code and
documentation were released in full as open source so any entity can adapt it,
including changing recipes and Secrets, without license, fee, or permission.
