#!/usr/bin/env python3
"""Reconcile the database, the images on disk, and the S3 bucket.

Three sources have to agree for a photo to actually appear on the site:

  the database   a row points at a relative path like recipe/BR-214/photo1.jpg
  the disk       images/<that path> exists and nginx can serve it
  the bucket     the original file the owner kept in S3

This script builds all three sets and reports where they disagree, in both
directions. The reverse direction matters as much as the forward one: a
file sitting in the bucket that no database row references is content the
rebuild is currently missing, and nobody has looked for those yet.

Run this on the server, where the database and the images both live:

    python3 scripts/audit_media.py

Requires _out/s3_manifest.csv, so run scripts/s3_manifest.py first.
Uses only the Python standard library, and talks to the database through
the same docker compose command you would type by hand.
"""

import csv
import os
import subprocess
import sys
from collections import defaultdict

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(REPO_ROOT, "_out")
MANIFEST_CSV = os.path.join(OUT_DIR, "s3_manifest.csv")
IMAGES_DIR = os.path.join(REPO_ROOT, "images")

DB_USER = os.environ.get("VB_DB_USER", "veggiebook")
DB_NAME = os.environ.get("VB_DB_NAME", "veggiebook")

# Every column in the schema that holds a path to a file. Taken from
# information_schema, not from memory, so nothing is quietly skipped.
# book_session.cover_path is deliberately absent: that is our own user
# data, not original VeggieBook content.
PATH_COLUMNS = [
    ("annotation", "image_path_en"),
    ("annotation", "image_path_es"),
    ("recipe_photo", "image_path"),
    ("secret", "image_path_en"),
    ("secret", "image_path_es"),
    ("secret", "cover_image_en"),
    ("secret", "cover_image_es"),
    ("secret", "attachment_en"),
    ("secret", "attachment_es"),
    ("secret_category", "image_path"),
    ("tip_block", "image_path"),
    ("vegetable", "image_path"),
]

# Folders that are framework assets or participant-generated content.
# Counted in the summary, never listed file by file.
BULK_PREFIXES = (
    "pdf/",
    "coverPhoto/",
    "cache/",
    "admin/",
    "django_extensions/",
    "relatedwidget/",
)


def normalize(path):
    """Put a database path into the same shape as a bucket key.

    Bucket keys look like recipe/BR-214/photo1.jpg. Database values should
    match, but tolerate a leading slash or an images/ prefix in case any
    row was written differently.
    """
    path = path.strip().replace("\\", "/")
    while path.startswith("/"):
        path = path[1:]
    if path.startswith("images/"):
        path = path[len("images/"):]
    return path


def db_paths():
    """Return {normalized_path: set_of_source_columns} from the database."""
    parts = [
        "SELECT '{t}.{c}' AS source, {c} AS path FROM {t} "
        "WHERE {c} IS NOT NULL AND {c} <> ''".format(t=table, c=column)
        for table, column in PATH_COLUMNS
    ]
    sql = " UNION ALL ".join(parts)

    # A list of arguments, not a shell string, so nothing in the SQL gets
    # reinterpreted by the shell on its way to psql.
    command = [
        "docker", "compose", "exec", "-T", "db",
        "psql", "-U", DB_USER, "-d", DB_NAME,
        "-A", "-t", "-F", "\t", "-c", sql,
    ]
    result = subprocess.run(
        command, cwd=REPO_ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit("psql failed:\n" + (result.stderr or result.stdout))

    found = defaultdict(set)
    for line in result.stdout.splitlines():
        if "\t" not in line:
            continue
        source, raw = line.split("\t", 1)
        raw = raw.strip()
        # secret_link holds real URLs; these columns should not, but guard.
        if not raw or raw.startswith("http://") or raw.startswith("https://"):
            continue
        found[normalize(raw)].add(source)
    return found


def disk_paths():
    """Return the set of files actually present under images/."""
    if not os.path.isdir(IMAGES_DIR):
        sys.exit(f"No images directory at {IMAGES_DIR}")

    present = set()
    for root, _dirs, files in os.walk(IMAGES_DIR):
        for name in files:
            if name == ".DS_Store":
                continue
            full = os.path.join(root, name)
            present.add(os.path.relpath(full, IMAGES_DIR).replace("\\", "/"))
    return present


def bucket_paths():
    """Return {key: size_in_bytes} for every object in the bucket."""
    if not os.path.exists(MANIFEST_CSV):
        sys.exit(f"Missing {MANIFEST_CSV}. Run scripts/s3_manifest.py first.")

    keys = {}
    with open(MANIFEST_CSV, newline="") as handle:
        for row in csv.DictReader(handle):
            if row["key"].endswith(".DS_Store"):
                continue
            keys[row["key"]] = int(row["size"])
    return keys


def write_list(name, lines):
    target = os.path.join(OUT_DIR, name)
    with open(target, "w") as handle:
        for line in lines:
            handle.write(line + "\n")
    return target


def megabytes(byte_count):
    return byte_count / 1_048_576


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    referenced = db_paths()
    on_disk = disk_paths()
    in_bucket = bucket_paths()

    working = sorted(p for p in referenced if p in on_disk)
    recoverable = sorted(
        p for p in referenced if p not in on_disk and p in in_bucket)
    lost = sorted(
        p for p in referenced if p not in on_disk and p not in in_bucket)
    disk_orphans = sorted(p for p in on_disk if p not in referenced)
    bucket_extra = sorted(
        k for k in in_bucket if k not in referenced and k not in on_disk)

    print("=" * 60)
    print("DATABASE REFERENCES")
    print("=" * 60)
    by_source = defaultdict(int)
    for path, sources in referenced.items():
        for source in sources:
            by_source[source] += 1
    for source in sorted(by_source):
        print(f"  {source:<32}{by_source[source]:>6}")
    print(f"  {'distinct paths':<32}{len(referenced):>6}")

    print()
    print("=" * 60)
    print("FORWARD: what the database asks for")
    print("=" * 60)
    print(f"  working on disk          {len(working):>6}")
    print(f"  missing, in the bucket   {len(recoverable):>6}"
          f"   ({megabytes(sum(in_bucket[p] for p in recoverable)):.1f} MB)")
    print(f"  missing, truly lost      {len(lost):>6}")

    if lost:
        print()
        print("  Not on disk and not in the bucket:")
        for path in lost:
            print(f"    {path}   <- {', '.join(sorted(referenced[path]))}")

    print()
    print("=" * 60)
    print("REVERSE: what exists but nothing references")
    print("=" * 60)

    bulk = defaultdict(lambda: [0, 0])
    content = defaultdict(list)
    for key in bucket_extra:
        if key.startswith(BULK_PREFIXES):
            top = key.split("/")[0] + "/"
            bulk[top][0] += 1
            bulk[top][1] += in_bucket[key]
        else:
            top = key.split("/")[0] + "/" if "/" in key else "(root)/"
            content[top].append(key)

    if bulk:
        print()
        print("  Bulk folders, counted only:")
        for top in sorted(bulk):
            count, size = bulk[top]
            print(f"    {top:<24}{count:>8} files  {megabytes(size):>9.1f} MB")

    print()
    print("  Content folders, unreferenced files:")
    for top in sorted(content):
        keys = content[top]
        size = sum(in_bucket[k] for k in keys)
        print(f"    {top:<24}{len(keys):>8} files  {megabytes(size):>9.1f} MB")

    print()
    print(f"  On disk but unreferenced  {len(disk_orphans):>6}")

    print()
    print("=" * 60)
    reports = [
        write_list("audit_recoverable.txt", recoverable),
        write_list("audit_lost.txt", lost),
        write_list("audit_disk_orphans.txt", disk_orphans),
        write_list("audit_bucket_unreferenced.txt",
                   [k for k in bucket_extra if not k.startswith(BULK_PREFIXES)]),
    ]
    for report in reports:
        print(f"Wrote {report}")


if __name__ == "__main__":
    main()