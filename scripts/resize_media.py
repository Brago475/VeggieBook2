#!/usr/bin/env python3
"""Make web-sized copies of the fetched originals.

The originals are 2500 to 3500 pixels wide at 3 to 5 MB each. Photos
already working on the site are 1600 pixels wide at 300 to 500 KB, which
is what the original VeggieBook pipeline produced. This matches that, so
restored photos sit alongside existing ones without looking different.

Three things happen to every file:

  orientation   applied from EXIF and then baked into the pixels, so a
                photo shot sideways is upright everywhere, including in
                viewers that ignore EXIF
  metadata      dropped entirely on save. 2012 camera files can carry GPS
                coordinates, and nothing we publish needs them
  size          longest side capped at 1600, then quality stepped down
                until the file lands under the ceiling

Reads the key list from _out/audit_recoverable.txt so it only touches the
files this import is about. Writes to a staging folder outside the repo;
copy the results into images/ from your Mac and commit them there.

Run on the server:  python3 scripts/resize_media.py
Requires python3-pil.
"""

import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed. Run: sudo apt-get install -y python3-pil")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(REPO_ROOT, "_out")
WANTED_TXT = os.path.join(OUT_DIR, "audit_recoverable.txt")

SRC_DIR = os.environ.get(
    "VB_ORIGINALS_DIR", os.path.expanduser("~/veggiebook-media/originals"))
DEST_DIR = os.environ.get(
    "VB_WEB_DIR", os.path.expanduser("~/veggiebook-media/web"))

MAX_LONG_SIDE = 1600
QUALITY_LADDER = [85, 80, 75, 70]
SIZE_CEILING = 600 * 1024


def resize_one(src, dest):
    """Write a web-sized copy and return (before, after, width, height, quality)."""
    before = os.path.getsize(src)

    with Image.open(src) as image:
        # Bake EXIF orientation into the pixels before anything else.
        image = ImageOps.exif_transpose(image)

        # JPEG cannot hold an alpha channel, and a CMYK source would save
        # with inverted colors, so normalize to RGB first.
        if image.mode != "RGB":
            image = image.convert("RGB")

        width, height = image.size
        longest = max(width, height)
        if longest > MAX_LONG_SIDE:
            scale = MAX_LONG_SIDE / float(longest)
            width = int(round(width * scale))
            height = int(round(height * scale))
            image = image.resize((width, height), Image.LANCZOS)

        os.makedirs(os.path.dirname(dest), exist_ok=True)

        # Step the quality down until the file fits. Saving without an
        # exif argument is what drops the metadata.
        used = QUALITY_LADDER[-1]
        for quality in QUALITY_LADDER:
            image.save(dest, "JPEG", quality=quality,
                       optimize=True, progressive=True)
            used = quality
            if os.path.getsize(dest) <= SIZE_CEILING:
                break

    return before, os.path.getsize(dest), width, height, used


def main():
    if not os.path.exists(WANTED_TXT):
        sys.exit(f"Missing {WANTED_TXT}. Run scripts/audit_media.py first.")

    keys = [line.strip() for line in open(WANTED_TXT) if line.strip()]
    if not keys:
        sys.exit(f"{WANTED_TXT} is empty. Nothing to resize.")

    print(f"Source:      {SRC_DIR}")
    print(f"Destination: {DEST_DIR}")
    print(f"Target:      longest side {MAX_LONG_SIDE}px, "
          f"under {SIZE_CEILING // 1024} KB")
    print()

    done = 0
    missing = []
    total_before = total_after = 0
    biggest = 0

    for index, key in enumerate(keys, start=1):
        src = os.path.join(SRC_DIR, key)
        dest = os.path.join(DEST_DIR, key)

        if not os.path.exists(src):
            print(f"  MISSING  {key}")
            missing.append(key)
            continue

        before, after, width, height, quality = resize_one(src, dest)
        total_before += before
        total_after += after
        biggest = max(biggest, after)
        done += 1

        print(f"  [{index}/{len(keys)}] {width}x{height:<5} "
              f"{before // 1024:>6} KB -> {after // 1024:>4} KB  q{quality}  "
              f"{os.path.basename(key)}")

    print()
    print(f"Resized {done} of {len(keys)}.")
    if missing:
        print(f"Missing sources: {len(missing)}. Run scripts/s3_fetch.py.")
    print(f"Before: {total_before / 1_048_576:.1f} MB")
    print(f"After:  {total_after / 1_048_576:.1f} MB")
    print(f"Largest single file: {biggest // 1024} KB")

    if missing:
        sys.exit(1)


if __name__ == "__main__":
    main()