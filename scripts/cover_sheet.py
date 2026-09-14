#!/usr/bin/env python3
"""
Build an HTML contact sheet of every cover the API offers per vegetable.

Usage:
    python3 scripts/cover_sheet.py                 # all vegetables
    python3 scripts/cover_sheet.py BROCCOLI        # one vegetable
    python3 scripts/cover_sheet.py BROCCOLI ZUCCHINI

Output: _out/cover_sheet.html
"""

import json
import os
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = os.environ.get("VB2_BASE", "https://veggiebook2.com")
IMG_PREFIX = "/images/"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_out")
OUT_FILE = os.path.join(OUT_DIR, "cover_sheet.html")

# Cloudflare blocks the default Python urllib agent with a 403.
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
)


def request(url, method="GET"):
    return urllib.request.Request(url, method=method, headers={"User-Agent": UA})


def get_json(path):
    with urllib.request.urlopen(request(BASE + path), timeout=30) as r:
        return json.load(r)


def list_vegetables():
    """Return vegetable codes, tolerating a few possible JSON shapes."""
    data = get_json("/api/vegetables")
    if isinstance(data, dict):
        for key in ("vegetables", "items", "data"):
            if key in data:
                data = data[key]
                break
    codes = []
    for item in data:
        if isinstance(item, str):
            codes.append(item)
        elif isinstance(item, dict):
            for key in ("code", "vegetable", "id", "name"):
                if key in item and isinstance(item[key], str):
                    codes.append(item[key])
                    break
    return codes


def check_image(rel_path):
    """Return (rel_path, status, content_type, size)."""
    url = BASE + IMG_PREFIX + rel_path
    try:
        with urllib.request.urlopen(request(url), timeout=30) as r:
            ctype = r.headers.get("Content-Type", "")
            size = r.headers.get("Content-Length", "0")
            return rel_path, r.status, ctype, size
    except urllib.error.HTTPError as e:
        return rel_path, e.code, e.headers.get("Content-Type", ""), "0"
    except Exception as e:
        return rel_path, 0, "error: %s" % e, "0"


def main():
    args = [a.upper() for a in sys.argv[1:]]

    if args:
        vegetables = args
    else:
        try:
            vegetables = list_vegetables()
        except Exception as e:
            print("Could not list vegetables: %s" % e)
            return 1

    if not vegetables:
        print("No vegetables found. Pass codes as arguments, for example BROCCOLI.")
        return 1

    print("Vegetables: %s" % ", ".join(vegetables))

    sections = []
    total = 0
    bad_total = 0

    for veg in vegetables:
        try:
            covers = get_json("/api/covers?vegetable=%s" % veg)["covers"]
        except Exception as e:
            print("  %-14s FAILED: %s" % (veg, e))
            continue

        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(check_image, covers))

        bad = [r for r in results if not r[2].startswith("image/")]
        total += len(results)
        bad_total += len(bad)
        print("  %-14s %3d covers, %3d missing" % (veg, len(results), len(bad)))

        cards = []
        for rel, status, ctype, size in results:
            ok = ctype.startswith("image/")
            cls = "card ok" if ok else "card bad"
            note = "" if ok else '<div class="note">%s / %s</div>' % (status, ctype)
            cards.append(
                '<figure class="%s">'
                '<img src="%s%s%s" loading="lazy" alt="">'
                '<figcaption>%s%s</figcaption>'
                "</figure>" % (cls, BASE, IMG_PREFIX, rel, rel, note)
            )

        sections.append(
            '<section><h2>%s <small>%d covers, %d missing</small></h2>'
            '<div class="grid">%s</div></section>'
            % (veg, len(results), len(bad), "".join(cards))
        )

    html = """<!doctype html>
<html><head><meta charset="utf-8"><title>VeggieBook2 cover sheet</title>
<style>
body { font-family: system-ui, sans-serif; margin: 24px; background: #fafafa; }
h1 { margin-bottom: 4px; }
h2 { margin-top: 32px; border-bottom: 2px solid #ddd; padding-bottom: 6px; }
h2 small { font-weight: normal; color: #666; font-size: 14px; margin-left: 8px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 12px; }
.card { margin: 0; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 8px; }
.card.bad { border-color: #c00; background: #fff3f3; }
.card img { width: 100%%; height: 140px; object-fit: cover; background: #eee; border-radius: 4px; display: block; }
figcaption { font-size: 11px; word-break: break-all; margin-top: 6px; color: #333; }
.note { color: #c00; font-weight: 600; margin-top: 2px; }
.summary { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 12px; display: inline-block; }
</style></head><body>
<h1>VeggieBook2 cover sheet</h1>
<p class="summary"><strong>%d</strong> covers checked, <strong>%d</strong> missing. Red cards are paths the server does not serve as an image.</p>
%s
</body></html>""" % (total, bad_total, "".join(sections))

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_FILE, "w") as f:
        f.write(html)

    print("\n%d covers checked, %d missing" % (total, bad_total))
    print("Wrote %s" % os.path.normpath(OUT_FILE))
    return 0


if __name__ == "__main__":
    sys.exit(main())