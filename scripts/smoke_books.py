#!/usr/bin/env python3
"""Smoke test for the books API on the live site.

Creates two throwaway accounts at example.com (a domain reserved for
testing), checks every books endpoint, checks that one account cannot reach
the other's books or photos, then deletes both accounts. Deleting an account
removes its books and photos through the database cascade, so the test
leaves nothing behind, even when a check fails partway through.

Run from anywhere:  python3 scripts/smoke_books.py
Uses only the Python standard library.
"""

import base64
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request
import uuid

API = "https://veggiebook2.com/api"
PASSWORD = "smoke-test-" + uuid.uuid4().hex
PHOTO = os.path.join(os.path.dirname(__file__), "..", "images", "cover", "CB.jpg")

failures = 0


def check(label, ok, detail=""):
    global failures
    if ok:
        print("PASS  " + label)
    else:
        failures += 1
        print(f"FAIL  {label}  ({detail})")


class Client:
    """One browser. Each client keeps its own cookies, so two clients are
    two separate people."""

    def __init__(self):
        jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(jar))

    def call(self, method, path, body=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(API + path, data=data, method=method)
        # Cloudflare can block Python's default user agent.
        req.add_header("User-Agent", "VeggieBook2-smoke-test/1.0")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with self.opener.open(req) as res:
                return res.status, res.headers, res.read()
        except urllib.error.HTTPError as err:
            return err.code, err.headers, err.read()

    def json(self, method, path, body=None):
        status, _, raw = self.call(method, path, body)
        if not raw:
            return status, None
        try:
            return status, json.loads(raw)
        except json.JSONDecodeError:
            return status, raw.decode(errors="replace")


def main():
    guest, a, b = Client(), Client(), Client()
    email_a = f"smoke-a-{uuid.uuid4().hex[:8]}@example.com"
    email_b = f"smoke-b-{uuid.uuid4().hex[:8]}@example.com"

    # Real content to build the books from.
    _, match = guest.json("POST", "/match",
                          {"vegetable": "ZUCCHINI", "attributes": []})
    _, questions = guest.json("GET", "/questions")
    recipe_ids = [r["id"] for r in match["recipes"]][:2]
    attribute = questions[0]["choices"][0]["attribute"]
    with open(PHOTO, "rb") as f:
        photo = f.read()

    base = {
        "vegetableCode": "ZUCCHINI",
        "attributes": [attribute],
        "recipes": [
            {"id": recipe_ids[0], "extraCopies": 0},
            {"id": recipe_ids[1], "extraCopies": 1},
        ],
    }
    upload = "data:image/jpeg;base64," + base64.b64encode(photo).decode()
    preset_id = upload_id = None

    try:
        s, _ = a.json("POST", "/auth/register",
                      {"email": email_a, "password": PASSWORD})
        check("create account A", s == 200, s)
        s, _ = b.json("POST", "/auth/register",
                      {"email": email_b, "password": PASSWORD})
        check("create account B", s == 200, s)

        s, _ = guest.json("GET", "/books")
        check("guest cannot list books", s == 401, s)

        # Saving
        s, body = a.json("POST", "/books", {**base, "coverPath": "cover/ZU.jpg"})
        check("A saves a book with a preset cover", s == 201, f"{s} {body}")
        if s == 201:
            preset_id = body["id"]

        s, body = a.json("POST", "/books", {**base, "coverUpload": upload})
        check("A saves a book with an uploaded cover", s == 201, f"{s} {body}")
        if s == 201:
            upload_id = body["id"]

        # Reading back
        s, books = a.json("GET", "/books")
        check("A lists 2 books", s == 200 and len(books) == 2, f"{s} {books}")
        covers = {bk["id"]: bk["cover"] for bk in books} if s == 200 else {}
        check("preset cover comes back as its path",
              covers.get(preset_id) == "cover/ZU.jpg", covers)
        check("uploaded cover comes back as a private API link",
              covers.get(upload_id) == f"/api/books/{upload_id}/cover", covers)

        s, book = a.json("GET", f"/books/{preset_id}")
        check("A opens a book with its answers, recipes, and extra copies",
              s == 200
              and book["attributes"] == [attribute]
              and sorted(r["extraCopies"] for r in book["recipes"]) == [0, 1],
              f"{s} {book}")

        s, headers, raw = a.call("GET", f"/books/{upload_id}/cover")
        check("A gets the uploaded photo back byte for byte",
              s == 200 and raw == photo, f"{s}, {len(raw)} bytes")
        check("the photo is marked never to be cached",
              headers.get("Cache-Control") == "no-store",
              headers.get("Cache-Control"))

        # Privacy: B must not reach anything of A's.
        s, books = b.json("GET", "/books")
        check("B sees no books", s == 200 and books == [], f"{s} {books}")
        s, _ = b.json("GET", f"/books/{preset_id}")
        check("B cannot open A's book", s == 404, s)
        s, _, _ = b.call("GET", f"/books/{upload_id}/cover")
        check("B cannot see A's photo", s == 404, s)
        s, _ = b.json("DELETE", f"/books/{preset_id}")
        check("B cannot delete A's book", s == 404, s)

        # Bad input is refused.
        s, _ = a.json("POST", "/books", {**base, "coverPath": "../../etc/passwd"})
        check("path trick as a cover is refused", s == 400, s)
        s, _ = a.json("POST", "/books", {
            **base,
            "recipes": [{"id": 999999, "extraCopies": 0}],
            "coverPath": "cover/ZU.jpg",
        })
        check("unknown recipe is refused", s == 400, s)
        fake = "data:image/jpeg;base64," + base64.b64encode(b"not a photo").decode()
        s, _ = a.json("POST", "/books", {**base, "coverUpload": fake})
        check("fake photo is refused", s == 400, s)

        # Deleting a book
        s, _ = a.json("DELETE", f"/books/{preset_id}")
        check("A deletes a book", s == 204, s)
        s, books = a.json("GET", "/books")
        check("A now has 1 book", s == 200 and len(books) == 1, f"{s} {books}")

    finally:
        # Always clean up. Deleting an account removes its books and photos.
        for client, label in ((a, "A"), (b, "B")):
            s, _ = client.json("POST", "/auth/delete", {"password": PASSWORD})
            check(f"delete account {label}", s == 204, s)

    print()
    print("All checks passed." if failures == 0
          else f"{failures} check(s) failed.")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()