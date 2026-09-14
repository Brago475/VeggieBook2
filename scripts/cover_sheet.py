#!/usr/bin/env python3
"""
Build an HTML contact sheet of every recipe photo, per vegetable.

Cards are banner-labeled and clickable. The panel shows the recipe behind
the photo, or, for UNUSED photos, the photo-less recipes for that vegetable
so you can match them by eye. Arrow keys move between photos. The Copy
button copies the photo path plus the recipe text.

    RECOVERED  (green) - repointed by db/fixes/003_img_to_recipe_paths.sql
    MISSING    (red)   - database points here but the server has no image
    UNUSED     (blue)  - file on disk, no recipe in the database uses it
    OK         (gray)  - was working already

Needs _out/recipes.json (exported from the database).

Usage:
    python3 scripts/cover_sheet.py                 # all vegetables
    python3 scripts/cover_sheet.py BROCCOLI        # one vegetable
"""

import html
import json
import os
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = os.environ.get("VB2_BASE", "https://veggiebook2.com")
IMG_PREFIX = "/images/"
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, ".."))
LOCAL_RECIPES = os.path.join(REPO, "images", "recipe")
OUT_DIR = os.path.join(REPO, "_out")
OUT_FILE = os.path.join(OUT_DIR, "cover_sheet.html")
RECIPES_JSON = os.path.join(OUT_DIR, "recipes.json")

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36")

PREFIX = {
    "BROCCOLI": "BR", "CABBAGE": "CB", "CARROT": "CA", "CAULIFLOWER": "CL",
    "GREENBEAN": "GB", "ONION": "ON", "POTATO": "PO", "ROOTVEGETABLE": "RV",
    "SWEETPOTATO": "SW", "ZUCCHINI": "ZU",
}

RECOVERED = {
    "recipe/BR-206/photo1.jpg": "img/Boiled_Brocc.jpg",
    "recipe/BR-208/photo1.jpg": "img/Fried_Brocc_with_Garlic.jpg",
    "recipe/BR-209/photo1.jpg": "img/RoastBroccoli.jpg",
    "recipe/BR-210/photo1.jpg": "img/Brocc_Veg_Marin_Salad.jpg",
    "recipe/BR-211/photo1.jpg": "img/Brocc_and_Carrots.jpg",
    "recipe/BR-213/photo1.jpg": "img/Broccoli_with_Lemon_Topping-Photo.jpg",
    "recipe/BR-215/photo1.jpg": "img/Micro_Brocc.jpg",
    "recipe/CA-209/photo1.jpg": "img/Boiled_Carrots.jpg",
    "recipe/CA-218/photo1.jpg": "img/Micro_Oran_Glazed_Carrots.jpg",
    "recipe/CA-221/photo2.jpg": "img/Carrot_1_P1010704.jpg",
    "recipe/CB-207/photo1.jpg": "img/PotatoCabbageSoup.jpg",
    "recipe/GB-206/photo1.jpg": "img/BoiledGreenBeans.jpg",
    "recipe/GB-219/photo1.jpg": "img/Green_Beans_with_BBQ_Sauce.jpg",
    "recipe/GB-220/photo1.jpg": "img/MustardChickenAndGreenBeans.jpg",
    "recipe/ON-223/photo1.jpg": "img/HoneyBakedOnions.jpg",
    "recipe/PO-208/photo1.jpg": "img/PO-207.jpg",
    "recipe/PO-219/photo2.jpg": "img/OneDishPotatoesChicken.jpg",
    "recipe/ZU-202/photo1.jpg": "img/ZucchiniHamburgerPie.jpg",
    "recipe/ZU-204/photo1.jpg": "img/ZucchiniTomatoCassarole.jpg",
    "recipe/ZU-224/photo1.jpg": "img/Zucchini-3-2012-Photo1.jpg",
}


def request(url):
    return urllib.request.Request(url, method="GET", headers={"User-Agent": UA})


def get_json(path):
    with urllib.request.urlopen(request(BASE + path), timeout=30) as r:
        return json.load(r)


def load_recipes():
    if not os.path.isfile(RECIPES_JSON):
        print("Missing %s, cards will not show recipe details." % RECIPES_JSON)
        return []
    with open(RECIPES_JSON, encoding="utf-8") as f:
        return json.load(f) or []


def local_photos_for(veg):
    pre = PREFIX.get(veg)
    if not pre or not os.path.isdir(LOCAL_RECIPES):
        return []
    found = []
    for code in sorted(os.listdir(LOCAL_RECIPES)):
        if not code.startswith(pre + "-"):
            continue
        folder = os.path.join(LOCAL_RECIPES, code)
        if not os.path.isdir(folder):
            continue
        for fn in sorted(os.listdir(folder)):
            if fn.lower().endswith((".jpg", ".jpeg", ".png")):
                found.append("recipe/%s/%s" % (code, fn))
    return found


def check_image(rel_path):
    url = BASE + IMG_PREFIX + rel_path
    try:
        with urllib.request.urlopen(request(url), timeout=30) as r:
            return rel_path, r.status, r.headers.get("Content-Type", "")
    except urllib.error.HTTPError as e:
        return rel_path, e.code, e.headers.get("Content-Type", "")
    except Exception as e:
        return rel_path, 0, "error: %s" % e


def recipe_dict(r):
    """Trimmed recipe for embedding as JSON in the page."""
    return {
        "id": r.get("id"),
        "code": r.get("display_code") or "",
        "veg": r.get("vegetable_code") or "",
        "title": r.get("title_en") or "",
        "prep": r.get("time_to_prepare_en") or "",
        "cook": r.get("time_to_cook_en") or "",
        "serves": r.get("servings_en") or "",
        "active": bool(r.get("active")),
        "ingredients": [s.strip() for s in (r.get("ingredients") or "").split(";")
                        if s.strip()],
        "photos": [p for p in (r.get("photos") or "").split("|") if p],
    }


def main():
    args = [a.upper() for a in sys.argv[1:]]
    vegetables = args if args else list(PREFIX.keys())

    recipes = load_recipes()
    by_photo = {}
    for r in recipes:
        for p in (r.get("photos") or "").split("|"):
            if p:
                by_photo.setdefault(p, []).append(recipe_dict(r))

    orphans_by_veg = {}
    for r in recipes:
        photos = [p for p in (r.get("photos") or "").split("|") if p]
        working = [p for p in photos if not p.startswith("img/")]
        if r.get("active") and not working:
            orphans_by_veg.setdefault(r.get("vegetable_code"), []).append(
                recipe_dict(r))

    print("Vegetables: %s" % ", ".join(vegetables))

    sections = []
    items = []          # one entry per card, in page order
    total = bad_total = rec_total = unused_total = 0

    for veg in vegetables:
        try:
            covers = get_json("/api/covers?vegetable=%s" % veg)["covers"]
        except Exception as e:
            print("  %-14s FAILED: %s" % (veg, e))
            continue

        in_api = set(covers)
        unused = [p for p in local_photos_for(veg) if p not in in_api]
        all_paths = list(covers) + unused

        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(check_image, all_paths))

        bad = [r for r in results if not r[2].startswith("image/")]
        rec = [r for r in results if r[0] in RECOVERED]
        total += len(results)
        bad_total += len(bad)
        rec_total += len(rec)
        unused_total += len(unused)
        print("  %-14s %3d photos, %3d missing, %2d recovered, %2d unused"
              % (veg, len(results), len(bad), len(rec), len(unused)))

        cards = []
        for rel, status, ctype in results:
            ok = ctype.startswith("image/")
            if not ok:
                cls, label, sub = "bad", "MISSING", str(status)
            elif rel in RECOVERED:
                cls, label, sub = "rec", "RECOVERED", "was " + RECOVERED[rel]
            elif rel in unused:
                cls, label, sub = "unused", "UNUSED", "no recipe in database"
            else:
                cls, label, sub = "ok", "OK", ""

            items.append({
                "path": rel,
                "url": BASE + IMG_PREFIX + rel,
                "kind": cls,
                "label": label,
                "sub": sub,
                "veg": veg,
                "recipes": by_photo.get(rel, []),
                "candidates": orphans_by_veg.get(veg, []) if cls == "unused" else [],
            })
            idx = len(items) - 1

            cards.append(
                '<figure class="card %s" data-i="%d">'
                '<div class="banner">%s</div>'
                '<img src="%s" loading="lazy" alt="">'
                '<figcaption>%s%s</figcaption>'
                "</figure>" % (
                    cls, idx, label, BASE + IMG_PREFIX + rel, html.escape(rel),
                    ('<div class="sub">%s</div>' % html.escape(sub)) if sub else ""))

        sections.append(
            '<section><h2>%s <small>%d photos &middot; '
            '<span class="cr">%d recovered</span> &middot; '
            '<span class="cb">%d missing</span> &middot; '
            '<span class="cu">%d unused</span> &middot; '
            '%d recipes with no photo</small></h2>'
            '<div class="grid">%s</div></section>'
            % (veg, len(results), len(rec), len(bad), len(unused),
               len(orphans_by_veg.get(veg, [])), "".join(cards)))

    data_json = json.dumps(items)

    page = """<!doctype html>
<html><head><meta charset="utf-8"><title>VeggieBook2 cover sheet</title>
<style>
* { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; margin: 24px; background: #fafafa; color: #1a1a1a; }
h2 { margin-top: 32px; border-bottom: 2px solid #ddd; padding-bottom: 6px; }
h2 small { font-weight: normal; color: #666; font-size: 14px; margin-left: 8px; }
.cr { color: #167a3c; font-weight: 700; }
.cb { color: #c00; font-weight: 700; }
.cu { color: #1451b4; font-weight: 700; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; margin-top: 12px; }
.card { margin: 0; background: #fff; border: 3px solid #ddd; border-radius: 6px; overflow: hidden; cursor: pointer; }
.card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.18); }
.card .banner { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-align: center; padding: 4px 0; color: #fff; background: #aaa; }
.card img { width: 100%%; height: 140px; object-fit: cover; background: #eee; display: block; }
figcaption { font-size: 11px; word-break: break-all; padding: 6px 8px 8px; color: #333; }
.sub { margin-top: 3px; font-weight: 600; }
.card.rec { border-color: #167a3c; } .card.rec .banner { background: #167a3c; }
.card.rec figcaption, .card.rec .sub { color: #167a3c; }
.card.bad { border-color: #c00; background: #fff3f3; } .card.bad .banner { background: #c00; }
.card.bad figcaption, .card.bad .sub { color: #c00; }
.card.unused { border-color: #1451b4; background: #f3f7fe; } .card.unused .banner { background: #1451b4; }
.card.unused figcaption, .card.unused .sub { color: #1451b4; }
.summary { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 12px; display: inline-block; }

#overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 50; }
#panel { display: none; position: fixed; top: 3%%; left: 50%%; transform: translateX(-50%%);
         width: min(920px, 94vw); max-height: 94vh; background: #fff; border-radius: 12px;
         z-index: 51; overflow: hidden; flex-direction: column; }
#panel.open { display: flex; }
#phead { display: flex; align-items: center; gap: 12px; padding: 12px 16px;
         border-bottom: 1px solid #e3e3e3; background: #fafafa; }
#pkind { font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #fff;
         background: #aaa; padding: 4px 10px; border-radius: 4px; }
#pkind.rec { background: #167a3c; } #pkind.bad { background: #c00; } #pkind.unused { background: #1451b4; }
#ppath { font-size: 12px; color: #555; word-break: break-all; flex: 1; }
#phead button { border: 1px solid #ccc; background: #fff; border-radius: 6px; cursor: pointer;
                font-size: 14px; padding: 6px 12px; }
#phead button:hover { background: #f0f0f0; }
#pbody { display: flex; gap: 20px; padding: 18px; overflow: auto; }
#pimgwrap { flex: 0 0 340px; }
#pimg { width: 100%%; border-radius: 8px; background: #eee; display: block; }
#pinfo { flex: 1; min-width: 0; }
.rcard { border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px; margin-bottom: 14px; background: #fff; }
.rcard.cand { border-left: 5px solid #1451b4; background: #f7faff; }
.rtitle { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.chip { font-size: 11px; background: #eef0f3; color: #444; padding: 3px 9px; border-radius: 20px; font-weight: 600; }
.chip.code { background: #1451b4; color: #fff; }
.chip.warn { background: #c00; color: #fff; }
.ilist { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; }
.plist { font-size: 12px; color: #666; margin-top: 10px; word-break: break-all; }
.hint { font-size: 13px; font-weight: 700; margin: 4px 0 12px; color: #1451b4; }
#nav { display: flex; align-items: center; gap: 10px; }
#nav button { font-size: 18px; width: 40px; padding: 4px 0; }
#pos { font-size: 12px; color: #666; min-width: 74px; text-align: center; }
#toast { position: fixed; bottom: 26px; left: 50%%; transform: translateX(-50%%);
         background: #167a3c; color: #fff; padding: 10px 20px; border-radius: 8px;
         font-size: 14px; z-index: 60; display: none; }
</style></head><body>
<h1>VeggieBook2 cover sheet</h1>
<p class="summary"><strong>%d</strong> photos checked &middot;
<span class="cr">%d recovered</span> &middot;
<span class="cb">%d missing</span> &middot;
<span class="cu">%d unused</span><br>
<span style="font-size:13px;color:#555">Click a photo to open it. Arrow keys move between photos, Esc closes, C copies.</span></p>
%s

<div id="overlay"></div>
<div id="panel">
  <div id="phead">
    <span id="pkind"></span>
    <span id="ppath"></span>
    <div id="nav">
      <button id="prev" title="Previous (left arrow)">&#8249;</button>
      <span id="pos"></span>
      <button id="next" title="Next (right arrow)">&#8250;</button>
    </div>
    <button id="copy" title="Copy (C)">Copy</button>
    <button id="close" title="Close (Esc)">&times;</button>
  </div>
  <div id="pbody">
    <div id="pimgwrap"><img id="pimg" alt=""></div>
    <div id="pinfo"></div>
  </div>
</div>
<div id="toast"></div>

<script>
var ITEMS = %s;
var cur = 0;
var panel = document.getElementById('panel');
var overlay = document.getElementById('overlay');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function recipeCard(r, isCand) {
  var chips = '';
  chips += '<span class="chip code">' + esc(r.code || 'NO CODE') + '</span>';
  chips += '<span class="chip">' + esc(r.veg) + '</span>';
  if (r.prep)   chips += '<span class="chip">Prep ' + esc(r.prep) + '</span>';
  if (r.cook)   chips += '<span class="chip">Cook ' + esc(r.cook) + '</span>';
  if (r.serves) chips += '<span class="chip">Serves ' + esc(r.serves) + '</span>';
  if (!r.active) chips += '<span class="chip warn">INACTIVE</span>';
  var ing = r.ingredients.length
    ? '<ul class="ilist">' + r.ingredients.map(function (i) {
        return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>'
    : '';
  var ph = r.photos.length
    ? '<div class="plist">Photos: ' + esc(r.photos.join(', ')) + '</div>'
    : '<div class="plist">No photo rows</div>';
  return '<div class="rcard' + (isCand ? ' cand' : '') + '">' +
         '<p class="rtitle">' + esc(r.title) + '</p>' +
         '<div class="chips">' + chips + '</div>' + ing + ph + '</div>';
}

function asText(it) {
  var out = [it.label + '  ' + it.path, it.url, ''];
  var list = it.recipes.length ? it.recipes : it.candidates;
  if (!it.recipes.length && it.candidates.length) {
    out.push('CANDIDATES (photo-less ' + it.veg + ' recipes):', '');
  }
  list.forEach(function (r) {
    out.push((r.code || 'NO CODE') + '  ' + r.title);
    out.push('Prep ' + r.prep + ' | Cook ' + r.cook + ' | Serves ' + r.serves);
    r.ingredients.forEach(function (i) { out.push('  - ' + i); });
    out.push('Photos: ' + (r.photos.join(', ') || 'none'), '');
  });
  return out.join('\\n');
}

function show(i) {
  if (i < 0) i = ITEMS.length - 1;
  if (i >= ITEMS.length) i = 0;
  cur = i;
  var it = ITEMS[i];
  document.getElementById('pkind').textContent = it.label;
  document.getElementById('pkind').className = it.kind;
  document.getElementById('ppath').textContent = it.path + (it.sub ? '  (' + it.sub + ')' : '');
  document.getElementById('pimg').src = it.url;
  document.getElementById('pos').textContent = (i + 1) + ' / ' + ITEMS.length;
  var info = '';
  if (it.recipes.length) {
    info += it.recipes.map(function (r) { return recipeCard(r, false); }).join('');
  } else if (it.candidates.length) {
    info += '<p class="hint">No recipe uses this file. Photo-less ' +
            esc(it.veg) + ' recipes it might belong to:</p>';
    info += it.candidates.map(function (r) { return recipeCard(r, true); }).join('');
  } else {
    info += '<p class="hint">No recipe found for this path.</p>';
  }
  document.getElementById('pinfo').innerHTML = info;
  document.getElementById('pbody').scrollTop = 0;
  panel.classList.add('open');
  overlay.style.display = 'block';
}

function closePanel() {
  panel.classList.remove('open');
  overlay.style.display = 'none';
}

function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(function () { t.style.display = 'none'; }, 1400);
}

function copyCur() {
  var text = asText(ITEMS[cur]);
  navigator.clipboard.writeText(text).then(function () {
    toast('Copied');
  }, function () {
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('Copied');
  });
}

document.querySelectorAll('.card').forEach(function (card) {
  card.addEventListener('click', function () {
    show(parseInt(card.getAttribute('data-i'), 10));
  });
});
document.getElementById('prev').onclick = function () { show(cur - 1); };
document.getElementById('next').onclick = function () { show(cur + 1); };
document.getElementById('copy').onclick = copyCur;
document.getElementById('close').onclick = closePanel;
overlay.onclick = closePanel;
document.addEventListener('keydown', function (e) {
  if (!panel.classList.contains('open')) return;
  if (e.key === 'Escape') closePanel();
  else if (e.key === 'ArrowLeft') show(cur - 1);
  else if (e.key === 'ArrowRight') show(cur + 1);
  else if (e.key === 'c' || e.key === 'C') copyCur();
});
</script>
</body></html>""" % (total, rec_total, bad_total, unused_total,
                     "".join(sections), data_json)

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(page)

    print("\n%d photos checked, %d missing, %d recovered, %d unused"
          % (total, bad_total, rec_total, unused_total))
    print("Wrote %s" % os.path.normpath(OUT_FILE))
    return 0


if __name__ == "__main__":
    sys.exit(main())