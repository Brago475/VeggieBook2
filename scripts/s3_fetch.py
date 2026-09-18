#!/usr/bin/env python3
"""Download a list of bucket keys, verifying each file against its ETag.

Reads _out/audit_recoverable.txt, which audit_media.py wrote: the paths the
database references that are absent from disk but present in the bucket.

Files land in an originals folder OUTSIDE the repo. These are 4 MB camera
originals and they do not belong in git. A later step makes web-sized
copies from them; this one only fetches and verifies.

The manifest records each object's ETag, which for a normally uploaded S3
object is the MD5 of its contents. Every download is checked against it,
so a truncated or corrupted transfer is caught here rather than showing up
as a broken image on the site later. A file that already exists and passes
its checksum is skipped, so the script is safe to rerun after an
interruption.

Run on the server:  python3 scripts/s3_fetch.py
Override the destination with VB_ORIGINALS_DIR if you want it elsewhere.
Uses only the Python standard library.
"""

import csv
import hashlib
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BUCKET_URL = "https://quickhelp.s3.amazonaws.com/"

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(REPO_ROOT, "_out")
MANIFEST_CSV = os.path.join(OUT_DIR, "s3_manifest.csv")
WANTED_TXT = os.path.join(OUT_DIR, "audit_recoverable.txt")

DEST_DIR = os.environ.get(
    "VB_ORIGINALS_DIR",
    os.path.expanduser("~/veggiebook-media/originals"))


def load_expected():
    """Return {key: (size, etag)} for the keys we intend to download."""
    if not os.path.exists(WANTED_TXT):
        sys.exit(f"Missing {WANTED_TXT}. Run scripts/audit_media.py first.")
    if not os.path.exists(MANIFEST_CSV):
        sys.exit(f"Missing {MANIFEST_CSV}. Run scripts/s3_manifest.py first.")

    wanted = []
    for line in open(WANTED_TXT):
        key = line.strip()
        if key:
            wanted.append(key)

    sizes = {}
    with open(MANIFEST_CSV, newline="") as handle:
        for row in csv.DictReader(handle):
            sizes[row["key"]] = (int(row["size"]), row["etag"])

    missing = [k for k in wanted if k not in sizes]
    if missing:
        sys.exit("These keys are not in the manifest, which should be "
                 "impossible:\n  " + "\n  ".join(missing))

    return [(k, sizes[k][0], sizes[k][1]) for k in wanted]


def md5_of(path):
    digest = hashlib.md5()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def already_good(path, size, etag):
    """True when the file on disk matches what the bucket says it should be."""
    if not os.path.exists(path):
        return False
    if os.path.getsize(path) != size:
        return False
    # A multipart upload's ETag ends in -N and is not a plain MD5, so in
    # that case size is the only check available.
    if "-" in etag:
        return True
    return md5_of(path) == etag


def download(key, target):
    # Each path segment is quoted separately so slashes survive but spaces
    # and other awkward characters in filenames are encoded properly.
    quoted = "/".join(urllib.parse.quote(part) for part in key.split("/"))
    request = urllib.request.Request(
        BUCKET_URL + quoted, headers={"User-Agent": "veggiebook2-fetch"})

    os.makedirs(os.path.dirname(target), exist_ok=True)
    partial = target + ".part"
    with urllib.request.urlopen(request, timeout=120) as response:
        with open(partial, "wb") as handle:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                handle.write(chunk)
    os.replace(partial, target)


def main():
    expected = load_expected()
    total_bytes = sum(size for _key, size, _etag in expected)

    print(f"Files to fetch: {len(expected)}")
    print(f"Total size:     {total_bytes / 1_048_576:.1f} MB")
    print(f"Destination:    {DEST_DIR}")
    print()

    fetched = skipped = failed = 0

    for index, (key, size, etag) in enumerate(expected, start=1):
        target = os.path.join(DEST_DIR, key)
        label = f"[{index}/{len(expected)}] {key}"

        if already_good(target, size, etag):
            print(f"  skip  {label}")
            skipped += 1
            continue

        try:
            download(key, target)
        except (urllib.error.HTTPError, urllib.error.URLError, OSError) as error:
            print(f"  FAIL  {label}  ({error})")
            failed += 1
            continue

        if not already_good(target, size, etag):
            print(f"  FAIL  {label}  (checksum or size mismatch)")
            failed += 1
            continue

        print(f"  ok    {label}  {size / 1_048_576:.1f} MB")
        fetched += 1

    print()
    print(f"Fetched {fetched}, skipped {skipped}, failed {failed}.")
    if failed:
        print("Rerun to retry the failures. Verified files are not refetched.")
        sys.exit(1)


if __name__ == "__main__":
    main()