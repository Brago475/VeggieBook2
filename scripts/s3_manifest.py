#!/usr/bin/env python3
"""Read the full key list of the quickhelp S3 bucket into a CSV.

The original VeggieBook media was never uploaded to the web host, but the
owner kept it in S3 and has made the bucket readable. This script only
lists it. Nothing is downloaded here, because we want to see the sizes and
the folder layout before deciding what belongs in the repo.

The listing API returns at most 1000 keys per request and hands back a
continuation token when more remain, so this pages until the bucket says
it is done.

The ETag of a normally uploaded S3 object is the MD5 of its contents. We
record it so a later step can tell which bucket files we already have on
disk and which are genuinely new, without downloading anything twice.

Writes _out/s3_manifest.csv and prints a per-folder summary.

Run from anywhere:  python3 scripts/s3_manifest.py
Uses only the Python standard library.
"""

import csv
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict

BUCKET_URL = "https://quickhelp.s3.amazonaws.com/"
NS = {"s3": "http://s3.amazonaws.com/doc/2006-03-01/"}

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(REPO_ROOT, "_out")
OUT_CSV = os.path.join(OUT_DIR, "s3_manifest.csv")


def text_of(node, tag):
    """Return the text of a child tag, or an empty string if absent."""
    found = node.find("s3:" + tag, NS)
    return "" if found is None or found.text is None else found.text


def fetch_page(token=None):
    """Fetch one page of the bucket listing and return it as parsed XML."""
    params = {"list-type": "2", "max-keys": "1000"}
    if token:
        params["continuation-token"] = token
    url = BUCKET_URL + "?" + urllib.parse.urlencode(params)

    # S3 is fine with any user agent, but naming ourselves makes the
    # request identifiable in the owner's access logs if they ever look.
    req = urllib.request.Request(url, headers={"User-Agent": "veggiebook2-manifest"})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return ET.fromstring(response.read())
    except urllib.error.HTTPError as error:
        body = error.read().decode(errors="replace")[:800]
        sys.exit(f"S3 returned HTTP {error.code}. Body:\n{body}")
    except urllib.error.URLError as error:
        sys.exit(f"Could not reach S3: {error.reason}")


def main():
    rows = []
    token = None
    pages = 0

    while True:
        root = fetch_page(token)
        pages += 1

        for item in root.findall("s3:Contents", NS):
            key = text_of(item, "Key")
            size = int(text_of(item, "Size") or 0)

            # Keys ending in a slash with no bytes are folder placeholders
            # created by the console. They are not files.
            if key.endswith("/") and size == 0:
                continue

            rows.append({
                "key": key,
                "size": size,
                "etag": text_of(item, "ETag").strip('"'),
                "last_modified": text_of(item, "LastModified"),
            })

        truncated = text_of(root, "IsTruncated").lower() == "true"
        if not truncated:
            break
        token = text_of(root, "NextContinuationToken")
        if not token:
            # Truncated but no token means something is wrong upstream.
            # Stop rather than loop forever on the same page.
            print("Warning: listing said truncated but gave no continuation token.")
            break

    rows.sort(key=lambda r: r["key"])

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_CSV, "w", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=["key", "size", "etag", "last_modified"])
        writer.writeheader()
        writer.writerows(rows)

    # Summary grouped by top-level folder, largest first by total bytes.
    folders = defaultdict(lambda: {"count": 0, "bytes": 0})
    for row in rows:
        top = row["key"].split("/")[0] if "/" in row["key"] else "(root)"
        folders[top]["count"] += 1
        folders[top]["bytes"] += row["size"]

    total_bytes = sum(r["size"] for r in rows)

    print(f"Pages read:   {pages}")
    print(f"Files found:  {len(rows)}")
    print(f"Total size:   {total_bytes / 1_048_576:.1f} MB")
    print(f"Manifest:     {OUT_CSV}")
    print()
    print(f"{'folder':<22}{'files':>8}{'size (MB)':>12}")
    print("-" * 42)
    for name in sorted(folders, key=lambda n: -folders[n]["bytes"]):
        info = folders[name]
        print(f"{name + '/':<22}{info['count']:>8}{info['bytes'] / 1_048_576:>12.1f}")


if __name__ == "__main__":
    main()