#!/usr/bin/env python3
"""Check which broken img/ paths from the database exist in the S3 bucket.

Reads two files, both already produced:

  _out/s3_manifest.csv   every key in the bucket, from s3_manifest.py
  _out/broken_paths.txt  one database image_path per line

A plain "is this key in the bucket" check would answer the question but
hide the interesting cases. A file can be present under a different
capitalization, sitting in another folder, or saved with a different
extension, and each of those is a recoverable photo rather than a lost
one. So misses fall through four progressively looser passes and are
reported by category, with the loose matches labeled clearly so nothing
gets treated as certain when it is not.

Nothing is downloaded and nothing is written except the report files.

Run from anywhere:  python3 scripts/s3_compare.py
Uses only the Python standard library.
"""

import csv
import os
import sys
from collections import defaultdict

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(REPO_ROOT, "_out")
MANIFEST_CSV = os.path.join(OUT_DIR, "s3_manifest.csv")
BROKEN_TXT = os.path.join(OUT_DIR, "broken_paths.txt")
FOUND_TXT = os.path.join(OUT_DIR, "found_in_bucket.txt")
MISSING_TXT = os.path.join(OUT_DIR, "missing_from_bucket.txt")


def load_manifest():
    """Return the bucket rows plus three lookup indexes for loose matching."""
    if not os.path.exists(MANIFEST_CSV):
        sys.exit(f"Missing {MANIFEST_CSV}. Run scripts/s3_manifest.py first.")

    by_key = {}
    by_lower_key = {}
    by_lower_base = defaultdict(list)
    by_lower_stem = defaultdict(list)

    with open(MANIFEST_CSV, newline="") as handle:
        for row in csv.DictReader(handle):
            key = row["key"]
            row["size"] = int(row["size"])
            by_key[key] = row
            by_lower_key[key.lower()] = row

            base = os.path.basename(key)
            by_lower_base[base.lower()].append(row)
            by_lower_stem[os.path.splitext(base)[0].lower()].append(row)

    return by_key, by_lower_key, by_lower_base, by_lower_stem


def load_broken():
    """Return the database paths, ignoring blank lines and duplicates."""
    if not os.path.exists(BROKEN_TXT):
        sys.exit(f"Missing {BROKEN_TXT}. Create it from the psql output.")

    seen = []
    for line in open(BROKEN_TXT):
        path = line.strip()
        if path and path not in seen:
            seen.append(path)
    return seen


def classify(path, by_key, by_lower_key, by_lower_base, by_lower_stem):
    """Match one database path against the bucket, loosening as needed.

    Returns (category, matching_row_or_None, note).
    """
    if path in by_key:
        return "EXACT", by_key[path], ""

    if path.lower() in by_lower_key:
        row = by_lower_key[path.lower()]
        return "CASE", row, f"bucket has {row['key']}"

    base = os.path.basename(path)
    hits = by_lower_base.get(base.lower(), [])
    if hits:
        where = ", ".join(sorted({os.path.dirname(h["key"]) + "/" for h in hits}))
        return "ELSEWHERE", hits[0], f"same filename under {where}"

    stem = os.path.splitext(base)[0].lower()
    hits = by_lower_stem.get(stem, [])
    if hits:
        where = ", ".join(sorted({h["key"] for h in hits}))
        return "OTHER_EXT", hits[0], f"same name, different extension: {where}"

    return "MISSING", None, ""


def main():
    by_key, by_lower_key, by_lower_base, by_lower_stem = load_manifest()
    broken = load_broken()

    results = []
    for path in broken:
        category, row, note = classify(
            path, by_key, by_lower_key, by_lower_base, by_lower_stem)
        results.append((path, category, row, note))

    counts = defaultdict(int)
    for _, category, _, _ in results:
        counts[category] += 1

    recoverable = [r for r in results if r[1] != "MISSING"]
    recoverable_bytes = sum(r[2]["size"] for r in recoverable)

    print(f"Database paths checked: {len(broken)}")
    print()
    for label, meaning in [
        ("EXACT", "found at the same path"),
        ("CASE", "found, capitalization differs"),
        ("ELSEWHERE", "same filename, different folder"),
        ("OTHER_EXT", "same name, different extension"),
        ("MISSING", "not in the bucket at all"),
    ]:
        print(f"  {label:<11}{counts[label]:>4}   {meaning}")

    print()
    print(f"Recoverable:  {len(recoverable)} of {len(broken)}")
    print(f"Download size for those: {recoverable_bytes / 1_048_576:.1f} MB")

    # Anything not an exact hit needs a human eye, so show those inline.
    inexact = [r for r in results if r[1] not in ("EXACT", "MISSING")]
    if inexact:
        print()
        print("Needs review (matched, but not at the exact path):")
        for path, category, _, note in inexact:
            print(f"  [{category}] {path}")
            print(f"      {note}")

    missing = [r[0] for r in results if r[1] == "MISSING"]
    if missing:
        print()
        print("Not in the bucket:")
        for path in missing:
            print(f"  {path}")

    with open(FOUND_TXT, "w") as handle:
        for path, category, row, _ in results:
            if category != "MISSING":
                handle.write(f"{path}\t{category}\t{row['key']}\t{row['size']}\n")

    with open(MISSING_TXT, "w") as handle:
        for path in missing:
            handle.write(path + "\n")

    print()
    print(f"Wrote {FOUND_TXT}")
    print(f"Wrote {MISSING_TXT}")


if __name__ == "__main__":
    main()