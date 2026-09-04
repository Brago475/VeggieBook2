#!/usr/bin/env python3
"""
Extract the tips system, questions, and targeting rules from the original
VeggieBook MySQL dump into clean JSON.

Written against the actual column definitions in Dump20201109.sql:

    qhmobile_string                    (id, en, es, needsTranslation)
    qhmobile_foodstuff                 (id, nameString_id, active, image_id)
    qhmobile_photo                     (id, img)
    qhmobile_attribute                 (name)                  <- PK is the name
    qhmobile_orrequirement             (id)                    <- grouping row only
    qhmobile_orrequirement_attributes  (id, orrequirement_id, attribute_id)
    qhmobile_question                  (id, mnemonic, phase, intro_id, qtype,
                                        orderPriority, subIntro_id)
    qhmobile_questionchoice            (id, questionId_id, content_id,
                                        attribute_id, firstDefault)
    qhmobile_foodtip                   (id, heading_id, foodStuff_id,
                                        requirement_id, fsIndex)
    qhmobile_orderabletip              (id, tipId_id, content_id, position,
                                        photo_id)

Usage:
    python3 extract_tips_v2.py /path/to/Dump20201109.sql /path/to/output/dir
"""

import json
import re
import sys
from pathlib import Path

TABLES = [
    "qhmobile_string",
    "qhmobile_foodstuff",
    "qhmobile_photo",
    "qhmobile_attribute",
    "qhmobile_orrequirement",
    "qhmobile_orrequirement_attributes",
    "qhmobile_question",
    "qhmobile_questionchoice",
    "qhmobile_foodtip",
    "qhmobile_orderabletip",
]


def read_dump(path):
    for enc in ("utf-8", "latin-1"):
        try:
            return Path(path).read_text(encoding=enc)
        except UnicodeDecodeError:
            continue
    raise SystemExit("Could not decode the dump file.")


def get_columns(sql, table):
    m = re.search(
        r"CREATE TABLE `" + re.escape(table) + r"` \((.*?)\n\) ENGINE",
        sql, re.S)
    if not m:
        return None
    cols = []
    for line in m.group(1).split("\n"):
        cm = re.match(r"`([^`]+)`\s+\w", line.strip())
        if cm:
            cols.append(cm.group(1))
    return cols


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
    if re.fullmatch(r"-?\d*\.\d+", v):
        return float(v)
    return v


def load_table(sql, table):
    cols = get_columns(sql, table)
    if cols is None:
        return []
    out = []
    for m in re.finditer(
            r"INSERT INTO `" + re.escape(table) + r"` VALUES (.*?);\n",
            sql, re.S):
        for r in split_values(m.group(1)):
            if len(r) == len(cols):
                out.append(dict(zip(cols, r)))
            else:
                print(f"    WARNING {table}: expected {len(cols)} "
                      f"columns, got {len(r)}")
    return out


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)

    print("Reading dump...")
    sql = read_dump(sys.argv[1])

    t = {}
    for name in TABLES:
        t[name] = load_table(sql, name)
        print(f"  {name}: {len(t[name])}")

    # id -> {en, es}
    S = {r["id"]: {"en": r["en"], "es": r["es"]}
         for r in t["qhmobile_string"]}
    # id -> image path
    P = {r["id"]: r["img"] for r in t["qhmobile_photo"]}
    # code -> vegetable
    VEG = {r["id"]: {"code": r["id"],
                     "name": S.get(r["nameString_id"]),
                     "active": bool(r["active"]),
                     "image": P.get(r["image_id"])}
           for r in t["qhmobile_foodstuff"]}

    attributes = sorted(r["name"] for r in t["qhmobile_attribute"])

    # A requirement is satisfied if the user selected ANY of its attributes.
    req_attrs = {}
    for r in t["qhmobile_orrequirement_attributes"]:
        req_attrs.setdefault(r["orrequirement_id"], []).append(r["attribute_id"])
    requirements = [{"id": r["id"],
                     "any_of": sorted(req_attrs.get(r["id"], []))}
                    for r in t["qhmobile_orrequirement"]]

    # Questions and their choices. Each choice maps to one attribute.
    choices = {}
    for r in t["qhmobile_questionchoice"]:
        choices.setdefault(r["questionId_id"], []).append({
            "id": r["id"],
            "text": S.get(r["content_id"]),
            "attribute": r["attribute_id"],
            "default": bool(r["firstDefault"]),
        })
    questions = []
    for r in sorted(t["qhmobile_question"],
                    key=lambda x: (x["phase"], x["orderPriority"])):
        questions.append({
            "id": r["id"],
            "mnemonic": r["mnemonic"],
            "phase": r["phase"],
            "type": r["qtype"],
            "order": r["orderPriority"],
            "intro": S.get(r["intro_id"]),
            "sub_intro": S.get(r["subIntro_id"]),
            "choices": sorted(choices.get(r["id"], []), key=lambda c: c["id"]),
        })

    # Tip content blocks, grouped by parent tip and ordered by position.
    blocks = {}
    for r in t["qhmobile_orderabletip"]:
        blocks.setdefault(r["tipId_id"], []).append({
            "id": r["id"],
            "position": r["position"],
            "text": S.get(r["content_id"]),
            "image": P.get(r["photo_id"]),
        })
    for v in blocks.values():
        v.sort(key=lambda b: (b["position"] is None, b["position"]))

    req_lookup = {r["id"]: r["any_of"] for r in requirements}
    tips = []
    for r in t["qhmobile_foodtip"]:
        tips.append({
            "id": r["id"],
            "vegetable_code": r["foodStuff_id"],
            "vegetable": (VEG.get(r["foodStuff_id"]) or {}).get("name"),
            "index": r["fsIndex"],
            "heading": S.get(r["heading_id"]),
            "requirement_id": r["requirement_id"],
            "requires_any_of": req_lookup.get(r["requirement_id"], []),
            "blocks": blocks.get(r["id"], []),
        })
    tips.sort(key=lambda x: (x["vegetable_code"], x["index"]))

    def write(name, obj):
        (out / name).write_text(json.dumps(obj, indent=2, ensure_ascii=False))
        print(f"  wrote {name}")

    print("Writing...")
    write("tips.json", tips)
    write("questions.json", questions)
    write("attributes.json", attributes)
    write("requirements.json", requirements)
    write("vegetables-full.json", list(VEG.values()))

    # Integrity checks.
    print("\nChecks:")
    used = {a for r in requirements for a in r["any_of"]}
    used |= {c["attribute"] for q in questions for c in q["choices"]}
    print(f"  attributes defined: {len(attributes)}")
    print(f"  attributes referenced: {len(used & set(attributes))}")
    unused = sorted(set(attributes) - used)
    if unused:
        print(f"  never referenced: {unused}")
    missing = sorted(used - set(attributes))
    if missing:
        print(f"  referenced but undefined: {missing}")

    noblocks = [x["id"] for x in tips if not x["blocks"]]
    print(f"  tips with no content blocks: {len(noblocks)}")
    noimg = sum(1 for x in tips for b in x["blocks"] if not b["image"])
    print(f"  content blocks with no image: {noimg} "
          f"of {sum(len(x['blocks']) for x in tips)}")
    print(f"  tips per vegetable: " + ", ".join(
        f"{c}={sum(1 for x in tips if x['vegetable_code'] == c)}"
        for c in sorted(VEG)))


if __name__ == "__main__":
    main()
