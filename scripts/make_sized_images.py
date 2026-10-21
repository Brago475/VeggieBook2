"""Smaller web copies of the site's photos.

Reads every JPEG and PNG under images/ and writes WebP copies at a few
widths to images/_sized/<width>/<same path>.webp. The originals are only
read, never changed. Book PDFs keep using the originals.

A copy is never larger than its original: when an original is narrower
than a width, that copy keeps the original size. Copies that are newer
than their original are skipped, so running again only does new photos.

Usage, from the repo root on the server:
  python3 scripts/make_sized_images.py                 all photos
  python3 scripts/make_sized_images.py --sample 2      2 per folder, for testing
  python3 scripts/make_sized_images.py --sample 2 --compare
      also writes images/_sized/compare.html, originals beside their copies
"""

import argparse
import html
import os
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path("images")
OUT = ROOT / "_sized"
WIDTHS = (400, 800, 1200)
QUALITY = 82
SOURCES = {".jpg", ".jpeg", ".png"}


def find_photos(sample):
    by_folder = {}
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in SOURCES:
            continue
        if OUT in path.parents:
            continue
        top = path.relative_to(ROOT).parts[0]
        by_folder.setdefault(top, []).append(path)

    photos = []
    for paths in by_folder.values():
        photos.extend(paths[:sample] if sample else paths)
    return photos


def copy_path(photo, width):
    relative = photo.relative_to(ROOT).with_suffix(".webp")
    return OUT / str(width) / relative


def make_copies(photo):
    """Writes the copies for one photo. Returns (original bytes, bytes written)."""
    original_size = photo.stat().st_size
    written = 0
    needed = [w for w in WIDTHS if not is_current(photo, copy_path(photo, w))]
    if not needed:
        return original_size, 0

    with Image.open(photo) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

        for width in needed:
            target = copy_path(photo, width)
            target.parent.mkdir(parents=True, exist_ok=True)
            if image.width > width:
                height = round(image.height * width / image.width)
                resized = image.resize((width, height), Image.LANCZOS)
            else:
                resized = image
            resized.save(target, "WEBP", quality=QUALITY, method=6)
            written += target.stat().st_size

    return original_size, written


def is_current(photo, copy):
    return copy.exists() and copy.stat().st_mtime >= photo.stat().st_mtime


def write_compare(photos):
    """A page with each original beside its copies, at the sizes the site shows them."""
    rows = []
    for photo in photos:
        name = html.escape(str(photo.relative_to(ROOT)))
        original = "/images/" + str(photo.relative_to(ROOT))
        copies = {w: "/images/" + str(copy_path(photo, w).relative_to(ROOT)) for w in WIDTHS}
        rows.append(f"""
<section>
  <h2>{name}</h2>
  <p>Card size (300 px wide). A sharp phone screen gets the 800 copy here.</p>
  <div class="row">
    <figure><img src="{original}" width="300"><figcaption>Original</figcaption></figure>
    <figure><img src="{copies[800]}" width="300"><figcaption>800 copy</figcaption></figure>
    <figure><img src="{copies[400]}" width="300"><figcaption>400 copy</figcaption></figure>
  </div>
  <p>Large photo size (600 px wide). A sharp screen gets the 1200 copy here.</p>
  <div class="row">
    <figure><img src="{original}" width="600"><figcaption>Original</figcaption></figure>
    <figure><img src="{copies[1200]}" width="600"><figcaption>1200 copy</figcaption></figure>
    <figure><img src="{copies[800]}" width="600"><figcaption>800 copy</figcaption></figure>
  </div>
</section>""")

    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Photo copy comparison</title>
<style>
body {{ font-family: system-ui, sans-serif; margin: 24px; color: #1f2a1a; }}
section {{ margin-bottom: 48px; border-bottom: 1px solid #ddd; padding-bottom: 24px; }}
h2 {{ font-size: 16px; }}
.row {{ display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }}
figure {{ margin: 0; }}
img {{ display: block; max-width: 100%; height: auto; border-radius: 8px; }}
figcaption {{ font-size: 13px; color: #6b7069; margin-top: 4px; }}
</style>
</head>
<body>
<h1>Photo copy comparison</h1>
{''.join(rows)}
</body>
</html>
"""
    (OUT / "compare.html").write_text(page, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sample", type=int, default=0, help="only this many photos per folder")
    parser.add_argument("--compare", action="store_true", help="also write images/_sized/compare.html")
    args = parser.parse_args()

    if not ROOT.is_dir():
        raise SystemExit("Run this from the repo root, where the images/ folder is.")

    photos = find_photos(args.sample)
    total_original = 0
    total_written = 0
    for i, photo in enumerate(photos, 1):
        try:
            original, written = make_copies(photo)
        except Exception as error:
            print(f"  skipped {photo}: {error}")
            continue
        total_original += original
        total_written += written
        if i % 25 == 0 or i == len(photos):
            print(f"  {i} of {len(photos)} photos")

    if args.compare:
        write_compare(photos)
        print(f"Comparison page: {OUT / 'compare.html'}")

    mb = 1024 * 1024
    print(f"Photos: {len(photos)}. Originals: {total_original / mb:.1f} MB. "
          f"Copies written this run: {total_written / mb:.1f} MB.")


if __name__ == "__main__":
    os.umask(0o022)
    main()