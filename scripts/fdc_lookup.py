"""Look up foods in USDA FoodData Central (SR Legacy).

Prints, for each food: its FDC id and description, the nutrients used by
the nutrition pop-up (per 100 g), and its household portions in grams.

Usage: python3 scripts/fdc_lookup.py "Turnips, raw" "Parsnips, raw"
API key: the FDC_API_KEY environment variable, or DEMO_KEY.
"""

import json
import os
import sys
import urllib.parse
import urllib.request

API = "https://api.nal.usda.gov/fdc/v1"
KEY = os.environ.get("FDC_API_KEY", "DEMO_KEY")

# SR Legacy nutrient numbers shown on the label.
NUTRIENTS = {
    "208": "Calories (kcal)",
    "204": "Total fat (g)",
    "307": "Sodium (mg)",
    "306": "Potassium (mg)",
    "205": "Total carbohydrate (g)",
    "291": "Dietary fiber (g)",
    "269": "Total sugars (g)",
    "203": "Protein (g)",
    "318": "Vitamin A (IU)",
    "401": "Vitamin C (mg)",
    "301": "Calcium (mg)",
    "303": "Iron (mg)",
}

DEFAULT_QUERIES = ["Turnips, raw", "Rutabagas, raw", "Parsnips, raw"]


def get(path, params):
    query = urllib.parse.urlencode(dict(params, api_key=KEY))
    with urllib.request.urlopen(f"{API}/{path}?{query}", timeout=30) as response:
        return json.load(response)


def find(query):
    result = get("foods/search", {"query": query, "dataType": "SR Legacy", "pageSize": 10})
    foods = result.get("foods", [])
    exact = [f for f in foods if f.get("description", "").lower() == query.lower()]
    matches = exact or foods
    return matches[0] if matches else None


def portion_text(p):
    unit = (p.get("measureUnit") or {}).get("name", "")
    parts = [p.get("amount"), "" if unit == "undetermined" else unit, p.get("modifier"), p.get("portionDescription")]
    return " ".join(str(x) for x in parts if x not in (None, "")).strip()


def show(query):
    food = find(query)
    if food is None:
        print(f"\n{query}: no SR Legacy match")
        return

    detail = get(f"food/{food['fdcId']}", {})
    print(f"\n{detail['description']} (FDC {detail['fdcId']}, {detail.get('dataType')})")

    print("Per 100 g:")
    found = {}
    for n in detail.get("foodNutrients", []):
        number = (n.get("nutrient") or {}).get("number")
        if number in NUTRIENTS and "amount" in n:
            found[number] = n["amount"]
    for number, label in NUTRIENTS.items():
        print(f"  {label}: {found.get(number, 'not reported')}")

    print("Portions:")
    for p in detail.get("foodPortions", []):
        print(f"  {portion_text(p)}: {p.get('gramWeight')} g")


if __name__ == "__main__":
    for q in sys.argv[1:] or DEFAULT_QUERIES:
        show(q)