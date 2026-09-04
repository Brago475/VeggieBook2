#!/usr/bin/env python3
"""
Convert the original VeggieBook MySQL dump into SQL INSERT statements for the
VeggieBook2 PostgreSQL schema.

Usage:
    python3 seed.py path/to/Dump20201109.sql path/to/output/seed-data.sql

Then load it:
    psql -h localhost -U veggiebook -d veggiebook -f schema.sql
    psql -h localhost -U veggiebook -d veggiebook -f seed-data.sql

ENCODING: the dump is UTF-8. Reading it as latin-1 silently mangles every
accented Spanish character (ninos becomes ni??os and so on) without raising an
error. This script reads UTF-8 strictly and fails loudly if that is wrong.
"""

import re
import sys
from pathlib import Path

SRC_TABLES = [
    "qhmobile_string",
    "qhmobile_foodstuff",
    "qhmobile_photo",
    "qhmobile_attribute",
    "qhmobile_orrequirement_attributes",
    "qhmobile_question",
    "qhmobile_questionchoice",
    "qhmobile_recipe",
    "qhmobile_recipeingredient",
    "qhmobile_recipestep",
    "qhmobile_recipephoto",
    "qhmobile_recipenote",
    "qhmobile_recipe_requirements",
    "qhmobile_recipe_annotations",
    "qhmobile_annotation",
    "qhmobile_foodtip",
    "qhmobile_orderabletip",
    "qhmobile_secret",
    "qhmobile_secretcategory",
    "qhmobile_externallink",
]


# ---------------------------------------------------------------------------
# Dump parsing
# ---------------------------------------------------------------------------

def read_dump(path):
    raw = Path(path).read_bytes()
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError as e:
        raise SystemExit(
            f"Dump is not valid UTF-8 at byte {e.start}. Do not fall back to\n"
            f"latin-1: that corrupts Spanish text silently. Investigate first."
        )


def get_columns(sql, table):
    m = re.search(
        r"CREATE TABLE `" + re.escape(table) + r"` \((.*?)\n\) ENGINE",
        sql, re.S)
    if not m:
        return None
    return [cm.group(1) for cm in
            (re.match(r"`([^`]+)`\s+\w", line.strip())
             for line in m.group(1).split("\n")) if cm]


def split_values(blob):
    rows, i, n = [], 0, len(blob)
    while i < n:
        if blob[i] != "(":
            i += 1
            continue
        i += 1
        row, field, in_str = [], [], False
        while i < n:
            c = blob[i]
            if in_str:
                if c == "\\":
                    nxt = blob[i + 1] if i + 1 < n else ""
                    field.append({"n": "\n", "r": "\r", "t": "\t",
                                  "0": "\0"}.get(nxt, nxt))
                    i += 2
                    continue
                if c == "'":
                    if i + 1 < n and blob[i + 1] == "'":
                        field.append("'")
                        i += 2
                        continue
                    in_str = False
                    i += 1
                    continue
                field.append(c)
                i += 1
                continue
            if c == "'":
                in_str = True
                field.append("\x00STR")
                i += 1
                continue
            if c == ",":
                row.append("".join(field).strip())
                field = []
                i += 1
                continue
            if c == ")":
                row.append("".join(field).strip())
                i += 1
                break
            field.append(c)
            i += 1
        rows.append([clean(v) for v in row])
    return rows


def clean(v):
    if v.startswith("\x00STR"):
        return v[4:]
    if v == "NULL":
        return None
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    return v


def load(sql, table):
    cols = get_columns(sql, table)
    if cols is None:
        raise SystemExit(f"Table not found in dump: {table}")
    out = []
    for m in re.finditer(
            r"INSERT INTO `" + re.escape(table) + r"` VALUES (.*?);\n",
            sql, re.S):
        for r in split_values(m.group(1)):
            if len(r) != len(cols):
                raise SystemExit(
                    f"{table}: expected {len(cols)} columns, got {len(r)}")
            out.append(dict(zip(cols, r)))
    return out


# ---------------------------------------------------------------------------
# SQL emission
# ---------------------------------------------------------------------------

def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def insert(table, columns, rows):
    if not rows:
        return f"-- {table}: no rows\n"
    head = f"INSERT INTO {table} ({', '.join(columns)}) VALUES\n"
    body = ",\n".join("  (" + ", ".join(lit(v) for v in r) + ")" for r in rows)
    return head + body + ";\n\n"


# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    sql = read_dump(sys.argv[1])
    out_path = Path(sys.argv[2])

    print("Parsing dump...")
    t = {name: load(sql, name) for name in SRC_TABLES}
    for name in SRC_TABLES:
        print(f"  {name}: {len(t[name])}")

    # Lookups -----------------------------------------------------------
    S = {r["id"]: (r["en"], r["es"]) for r in t["qhmobile_string"]}
    PHOTO = {r["id"]: r["img"] for r in t["qhmobile_photo"]}

    def en(sid):
        return S[sid][0] if sid in S else None

    def es(sid):
        return S[sid][1] if sid in S else None

    # requirement id -> single attribute name (the OR layer is collapsed)
    REQ = {r["orrequirement_id"]: r["attribute_id"]
           for r in t["qhmobile_orrequirement_attributes"]}

    parts = ["-- Generated by seed.py. Do not edit by hand.\n",
             "BEGIN;\n\n"]

    # vegetable ---------------------------------------------------------
    # NOTE ON CODES. The recipe table's `rid` holds a five-digit internal
    # number (10202, 10203, ...). The human-readable code used for image
    # folders is the last three digits with the vegetable's two-letter prefix:
    #     rid 10202 -> BR-202,  rid 10220 -> BR-220
    # Verified against every recipe that has both a rid and a photo. The
    # two-letter prefix itself comes from the photo paths, which look like
    # recipe/BR-202/photo1.jpg.
    #
    # 66 of 258 recipes have a BLANK rid. They sit in a later id range and
    # appear to have been added after the rid scheme was abandoned. They have
    # no code, no image folder, and no photos. That is a gap in the original
    # content, not a conversion failure.

    prefix = {}   # vegetable code -> BR, CB, ...
    seen_code = {}  # recipe id -> code, where a photo proves it
    for r in t["qhmobile_recipephoto"]:
        m = re.match(r"recipe/([A-Z]{2})-(\d+)/", PHOTO[r["photo_id"]] or "")
        if m:
            seen_code.setdefault(r["recipeId_id"], f"{m.group(1)}-{m.group(2)}")
    veg_of = {r["recipeId"]: r["foodStuff_id"] for r in t["qhmobile_recipe"]}
    for rec_id, c in seen_code.items():
        prefix.setdefault(veg_of[rec_id], c.split("-")[0])

    missing = [r["id"] for r in t["qhmobile_foodstuff"] if r["id"] not in prefix]
    if missing:
        raise SystemExit(f"No short_code derivable for: {missing}")

    # Derive the code for every recipe that has a rid, and check the rule
    # against the recipes where a photo already told us the answer.
    display_code, conflicts = {}, []
    for r in t["qhmobile_recipe"]:
        rid = (r["rid"] or "").strip()
        if not rid:
            continue
        code = f"{prefix[r['foodStuff_id']]}-{rid[-3:]}"
        display_code[r["recipeId"]] = code
        known = seen_code.get(r["recipeId"])
        if known and known != code:
            conflicts.append((r["recipeId"], rid, known, code))
    if conflicts:
        print("  WARNING: derived code disagrees with photo path:")
        for c in conflicts[:10]:
            print(f"    recipe {c[0]} rid={c[1]} photo says {c[2]}, rule says {c[3]}")

    short = prefix
    veg_rows = []
    for i, r in enumerate(t["qhmobile_foodstuff"]):
        veg_rows.append([
            r["id"], short[r["id"]],
            en(r["nameString_id"]), es(r["nameString_id"]),
            PHOTO.get(r["image_id"]), bool(r["active"]), i * 100,
        ])
    parts.append(insert("vegetable",
        ["code", "short_code", "name_en", "name_es",
         "image_path", "active", "sort_order"], veg_rows))

    # attribute ---------------------------------------------------------
    parts.append(insert("attribute", ["name"],
        [[r["name"]] for r in t["qhmobile_attribute"]]))

    # question ----------------------------------------------------------
    q_rows = []
    for r in t["qhmobile_question"]:
        q_rows.append([
            r["id"], r["mnemonic"], r["phase"], r["qtype"], r["orderPriority"],
            en(r["intro_id"]), es(r["intro_id"]),
            en(r["subIntro_id"]) if r["subIntro_id"] else None,
            es(r["subIntro_id"]) if r["subIntro_id"] else None,
            r["qtype"] == "H",
        ])
    parts.append(insert("question",
        ["id", "mnemonic", "phase", "qtype", "order_priority",
         "intro_en", "intro_es", "sub_intro_en", "sub_intro_es",
         "is_hidden"], q_rows))

    qc_rows = []
    by_q = {}
    for r in sorted(t["qhmobile_questionchoice"], key=lambda x: x["id"]):
        pos = by_q.get(r["questionId_id"], 0)
        by_q[r["questionId_id"]] = pos + 1
        qc_rows.append([
            r["id"], r["questionId_id"], r["attribute_id"],
            en(r["content_id"]), es(r["content_id"]),
            bool(r["firstDefault"]), pos * 10,
        ])
    parts.append(insert("question_choice",
        ["id", "question_id", "attribute", "text_en", "text_es",
         "is_default", "sort_order"], qc_rows))

    # recipe ------------------------------------------------------------
    r_rows = []
    for r in t["qhmobile_recipe"]:
        r_rows.append([
            # 66 recipes have a blank rid. Emit NULL, not an empty string:
            # rid is UNIQUE, and Postgres treats '' as a real value that
            # collides, while NULLs are distinct.
            r["recipeId"], (r["rid"] or "").strip() or None,
            display_code.get(r["recipeId"]),
            r["foodStuff_id"], bool(r["isActive"]),
            en(r["title_id"]), es(r["title_id"]),
            en(r["storyLine_id"]) if r["storyLine_id"] else None,
            es(r["storyLine_id"]) if r["storyLine_id"] else None,
            en(r["timeToPrepare_id"]), es(r["timeToPrepare_id"]),
            en(r["timeToCook_id"]), es(r["timeToCook_id"]),
            en(r["servings_id"]), es(r["servings_id"]),
            en(r["canBeMadeAhead_id"]), es(r["canBeMadeAhead_id"]),
            en(r["canBeFrozen_id"]), es(r["canBeFrozen_id"]),
            en(r["goodForLeftovers_id"]), es(r["goodForLeftovers_id"]),
        ])
    parts.append(insert("recipe",
        ["id", "rid", "display_code", "vegetable_code", "active",
         "title_en", "title_es", "story_line_en", "story_line_es",
         "time_to_prepare_en", "time_to_prepare_es",
         "time_to_cook_en", "time_to_cook_es",
         "servings_en", "servings_es",
         "can_be_made_ahead_en", "can_be_made_ahead_es",
         "can_be_frozen_en", "can_be_frozen_es",
         "good_for_leftovers_en", "good_for_leftovers_es"], r_rows))

    # Child rows. position is nullable in the original, so fall back to id
    # order within each parent to keep the sequence stable.
    def child(src, parent_key, extra):
        seen = {}
        rows = []
        for r in sorted(src, key=lambda x: (x[parent_key],
                                            x["position"] if x["position"]
                                            is not None else 1 << 30,
                                            x["id"])):
            p = r[parent_key]
            seen[p] = seen.get(p, 0) + 1
            rows.append([r[parent_key], seen[p]] + extra(r))
        return rows

    parts.append(insert("recipe_ingredient",
        ["recipe_id", "position", "text_en", "text_es"],
        child(t["qhmobile_recipeingredient"], "recipeId_id",
              lambda r: [en(r["content_id"]), es(r["content_id"])])))

    parts.append(insert("recipe_step",
        ["recipe_id", "position", "text_en", "text_es"],
        child(t["qhmobile_recipestep"], "recipeId_id",
              lambda r: [en(r["content_id"]), es(r["content_id"])])))

    parts.append(insert("recipe_photo",
        ["recipe_id", "position", "image_path"],
        child(t["qhmobile_recipephoto"], "recipeId_id",
              lambda r: [PHOTO[r["photo_id"]]])))

    parts.append(insert("recipe_note",
        ["recipe_id", "position", "text_en", "text_es"],
        child(t["qhmobile_recipenote"], "recipeId_id",
              lambda r: [en(r["content_id"]), es(r["content_id"])])))

    # recipe_attribute: dereference the collapsed requirement layer,
    # deduplicating in case two requirements resolved to the same attribute.
    ra = sorted({(r["recipe_id"], REQ[r["orrequirement_id"]])
                 for r in t["qhmobile_recipe_requirements"]})
    parts.append(insert("recipe_attribute",
        ["recipe_id", "attribute"], [list(x) for x in ra]))

    # annotation --------------------------------------------------------
    # en_img_id / es_img_id point into qhmobile_photo but resolve to recipe
    # photos, which is almost certainly wrong in the source data. The colors
    # and text are trustworthy; the image references are not, so they are
    # left NULL rather than seeded with wrong paths.
    ann_rows = []
    for r in t["qhmobile_annotation"]:
        ann_rows.append([
            r["id"], REQ[r["displayedIf_id"]],
            en(r["text_id"]), es(r["text_id"]),
            None, None, r["color"],
        ])
    parts.append(insert("annotation",
        ["id", "displayed_if", "text_en", "text_es",
         "image_path_en", "image_path_es", "color"], ann_rows))

    parts.append(insert("recipe_annotation", ["recipe_id", "annotation_id"],
        sorted([r["recipe_id"], r["annotation_id"]]
               for r in t["qhmobile_recipe_annotations"])))

    # tips --------------------------------------------------------------
    tip_rows = []
    for r in t["qhmobile_foodtip"]:
        tip_rows.append([
            r["id"], r["foodStuff_id"], REQ[r["requirement_id"]],
            en(r["heading_id"]), es(r["heading_id"]), r["fsIndex"],
        ])
    parts.append(insert("tip",
        ["id", "vegetable_code", "attribute",
         "heading_en", "heading_es", "sort_order"], tip_rows))

    blk_rows = []
    for r in t["qhmobile_orderabletip"]:
        blk_rows.append([
            r["id"], r["tipId_id"], r["position"],
            en(r["content_id"]), es(r["content_id"]),
            PHOTO.get(r["photo_id"]) if r["photo_id"] else None,
        ])
    parts.append(insert("tip_block",
        ["id", "tip_id", "position", "text_en", "text_es",
         "image_path"], blk_rows))

    # secrets -----------------------------------------------------------
    cat_rows = []
    for r in t["qhmobile_secretcategory"]:
        cat_rows.append([
            r["id"], en(r["title_id"]), es(r["title_id"]),
            r["image"], r["color"], r["positionIndex"],
        ])
    parts.append(insert("secret_category",
        ["id", "name_en", "name_es", "image_path", "color",
         "sort_order"], cat_rows))

    sec_rows = []
    for r in t["qhmobile_secret"]:
        sec_rows.append([
            r["id"], r["secret_id"], r["category_id"], bool(r["isActive"]),
            en(r["title_id"]), es(r["title_id"]),
            en(r["whyItWorks_id"]), es(r["whyItWorks_id"]),
            r["image"], r["image_es"],
            PHOTO.get(r["coverImage_id"]) if r["coverImage_id"] else None,
            PHOTO.get(r["coverImage_es_id"]) if r["coverImage_es_id"] else None,
            r["attachment_en"], r["attachment_es"],
        ])
    parts.append(insert("secret",
        ["id", "display_number", "category_id", "active",
         "headline_en", "headline_es", "why_it_works_en", "why_it_works_es",
         "image_path_en", "image_path_es", "cover_image_en", "cover_image_es",
         "attachment_en", "attachment_es"], sec_rows))

    link_rows = []
    for r in t["qhmobile_externallink"]:
        link_rows.append([
            r["secret_id"], r["language"], r["url"],
            en(r["linkString_id"]), es(r["linkString_id"]),
        ])
    parts.append(insert("secret_link",
        ["secret_id", "language", "url", "label_en", "label_es"], link_rows))

    parts.append("COMMIT;\n")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("".join(parts), encoding="utf-8")

    # Checks ------------------------------------------------------------
    print(f"\nWrote {out_path} ({out_path.stat().st_size // 1024} KB)")
    print("\nChecks:")
    print(f"  vegetables: {len(veg_rows)}")
    print(f"  recipes: {len(r_rows)} "
          f"({sum(1 for r in r_rows if not r[4])} inactive)")
    nocode = [r[0] for r in r_rows if not r[2]]
    print(f"  recipes with no display code: {len(nocode)}"
          + (f" -> ids {nocode[:10]}" if nocode else ""))
    print(f"  recipe_attribute rows: {len(ra)} "
          f"(from {len(t['qhmobile_recipe_requirements'])} source rows)")
    print(f"  tips: {len(tip_rows)}, blocks: {len(blk_rows)}")
    print(f"  secrets: {len(sec_rows)}, links: {len(link_rows)}")

    # Spanish text must have survived intact.
    accented = sum(1 for _, (e, s) in S.items()
                   if s and any(ch in s for ch in "áéíóúñÁÉÍÓÚÑ¿¡"))
    print(f"  strings with Spanish accents: {accented}")
    if accented < 100:
        print("  WARNING: suspiciously few accented strings. Check encoding.")

    empties = [r[0] for r in r_rows if not r[5]]
    if empties:
        print(f"  WARNING: recipes with no English title: {empties}")
    print(f"  short_code map: "
          + ", ".join(f"{k}={v}" for k, v in sorted(short.items())))


if __name__ == "__main__":
    main()
