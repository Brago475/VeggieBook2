#!/usr/bin/env python3
"""
Compare the original AND/OR requirement model against the flattened
recipe_attribute table.

The original schema:
    qhmobile_recipe_requirements      recipe -> many requirements   (AND)
    qhmobile_orrequirement_attributes requirement -> many attributes (OR)

A recipe matched when EVERY one of its requirements was satisfied by at
least one selected attribute.

VeggieBook2 flattened this to recipe_attribute, which is a plain OR: any
single matching attribute pulls the recipe in. For a recipe with one real
requirement plus ALL_USERS the two are equivalent. For a recipe with two
or more real requirements they are not, and the flattened version shows
the recipe too often.

Reads the dump only. Writes nothing.

Usage:
    python3 scripts/check_requirements.py
"""

import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, ".."))
DUMP = os.path.join(REPO, "_source", "database", "Dump20201109.sql")

TUPLE = re.compile(r"\(([^()]*)\)")


def rows_for(sql, table):
    """Every VALUES tuple for INSERT INTO `table`, as lists of strings."""
    out = []
    for line in sql.splitlines():
        if "INSERT INTO `%s`" % table not in line:
            continue
        for m in TUPLE.finditer(line[line.index("VALUES"):]):
            parts = [p.strip().strip("'") for p in m.group(1).split(",")]
            out.append(parts)
    return out


def main():
    if not os.path.isfile(DUMP):
        print("Dump not found at %s" % DUMP)
        return 1

    with open(DUMP, encoding="utf-8", errors="replace") as f:
        sql = f.read()

    # requirement id -> set of attribute names
    req_attrs = defaultdict(set)
    for parts in rows_for(sql, "qhmobile_orrequirement_attributes"):
        if len(parts) >= 3:
            req_attrs[parts[1]].add(parts[2])

    # recipe id -> set of requirement ids
    recipe_reqs = defaultdict(set)
    for parts in rows_for(sql, "qhmobile_recipe_requirements"):
        if len(parts) >= 3:
            recipe_reqs[parts[1]].add(parts[2])

    print("requirements defined: %d" % len(req_attrs))
    print("recipes with requirements: %d" % len(recipe_reqs))
    print()

    # A requirement is "real" if it is not the always-true ALL_USERS one.
    def is_all_users(rid):
        return req_attrs.get(rid) == {"ALL_USERS"}

    by_real_count = defaultdict(list)
    for rid, reqs in recipe_reqs.items():
        real = [r for r in reqs if not is_all_users(r)]
        by_real_count[len(real)].append((rid, real))

    print("recipes by number of real (non-ALL_USERS) requirements:")
    for n in sorted(by_real_count):
        print("  %d requirement(s): %d recipes" % (n, len(by_real_count[n])))
    print()

    divergent = []
    for n in sorted(by_real_count):
        if n < 2:
            continue
        divergent.extend(by_real_count[n])

    if not divergent:
        print("No divergence. Flattening to recipe_attribute is equivalent.")
        return 0

    print("DIVERGENT: %d recipes require ALL of several attributes." % len(divergent))
    print("In VeggieBook2 these appear when ANY one is selected.")
    print()
    for rid, real in sorted(divergent, key=lambda x: int(x[0])):
        names = sorted(a for r in real for a in req_attrs.get(r, set()))
        print("  recipe %-5s needs ALL of: %s" % (rid, " + ".join(names)))

    return 0


if __name__ == "__main__":
    sys.exit(main())