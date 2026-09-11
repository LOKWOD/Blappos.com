#!/usr/bin/env python3
"""Create missing Printify magnets and add their URLs to Blappos story data."""

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ALIASES = {
    "jan-caracas": "caracas",
    "jan-minnesota": "minneapolis",
    "feb-shutdown": "washington",
    "may-longview": "longview",
    "sep-typhoon": "coastal-china",
    "sep-nepal": "nepal",
    # Sep. 11 reused the already-rendered tall-horse art for its Printify product.
    "sep11-tallest-horse": "sep10-tallest-horse",
}
DATA_FILES = (Path("daily-data.js"), Path("archive-data.js"))
RASTER_SUFFIXES = {".webp", ".jpg", ".jpeg", ".png"}
ID_PATTERN = re.compile(r'(?:^|[,{]\s*)(?:"id"|\'id\'|id)\s*:\s*(["\'])(.*?)\1', re.MULTILINE)


def field(block, name):
    """Read a JS object string field from single- or double-quoted object syntax."""
    pattern = rf'(?:^|[{{,]\s*)(?:"{re.escape(name)}"|\'{re.escape(name)}\'|{re.escape(name)})\s*:\s*(["\'])(.*?)\1'
    match = re.search(pattern, block, re.DOTALL | re.MULTILINE)
    return match.group(2) if match else None


def matching_brace(text, start):
    """Return index just after the matching object brace, ignoring braces inside strings."""
    depth = 0
    quote = None
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in ("'", '"'):
            quote = char
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index + 1
    raise RuntimeError("Unbalanced story object in data file")


def story_blocks(text):
    """Yield each story object, including multi-line const objects and one-line array entries."""
    used = set()
    for match in ID_PATTERN.finditer(text):
        start = text.rfind("{", 0, match.start() + 1)
        if start < 0 or start in used:
            continue
        end = matching_brace(text, start)
        block = text[start:end]
        story_id = field(block, "id")
        if not story_id:
            continue
        used.add(start)
        yield start, end, block


def image_for(story):
    # Physical products must use raster card art, never an SVG wrapper/placeholder.
    if story.get("image"):
        path = Path(story["image"])
        if path.exists() and path.suffix.lower() in RASTER_SUFFIXES:
            return path
        if path.suffix.lower() == ".svg":
            raster = path.with_suffix(".webp")
            if raster.exists():
                return raster

    stem = ALIASES.get(story["id"], story["id"])
    for suffix in (".webp", ".jpg", ".jpeg", ".png"):
        path = Path("assets/cards") / f"{stem}{suffix}"
        if path.exists():
            return path
    raise FileNotFoundError(f"No live raster card artwork found for {story['id']}")


def stories():
    found = []
    seen = set()
    for data_file in DATA_FILES:
        text = data_file.read_text()
        for _, _, block in story_blocks(text):
            story_id = field(block, "id")
            if not story_id or story_id in seen:
                continue
            seen.add(story_id)
            title = field(block, "title")
            place = field(block, "place")
            if not title or not place:
                print(f"Skipping malformed story {story_id}: missing title/place", file=sys.stderr)
                continue
            found.append({
                "id": story_id,
                "title": title,
                "place": place,
                "image": field(block, "image"),
                "file": data_file,
                "linked": bool(re.search(r'(?:"magnetUrl"|\'magnetUrl\'|magnetUrl)\s*:', block)),
            })
    return found


def add_link(story, url):
    path = story["file"]
    text = path.read_text()
    for start, end, block in story_blocks(text):
        if field(block, "id") != story["id"]:
            continue
        if re.search(r'(?:"magnetUrl"|\'magnetUrl\'|magnetUrl)\s*:', block):
            return

        title_match = re.search(
            r'(?:"title"|\'title\'|title)\s*:\s*(["\'])(.*?)\1\s*,',
            block,
            re.DOTALL,
        )
        if not title_match:
            raise RuntimeError(f"Could not place magnet link for {story['id']}")

        double_style = bool(re.search(r'"id"\s*:', block))
        insert = (
            f'"magnetUrl":"{url}","magnetPrice":"$9.99",'
            if double_style
            else f"magnetUrl:'{url}',magnetPrice:'$9.99',"
        )
        insert_at = start + title_match.end()
        path.write_text(text[:insert_at] + insert + text[insert_at:])
        return
    raise RuntimeError(f"Could not find story {story['id']} in {path}")


def save_progress(story_id, state, paths):
    Path("printify-products.json").write_text(json.dumps(state, indent=2) + "\n")
    subprocess.run(["git", "add", "printify-products.json", *map(str, paths)], check=True)
    if subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode:
        subprocess.run(["git", "commit", "-m", f"Add purchasable magnet for {story_id}"], check=True)
        # Other Blappos automations may finish while Printify is rendering. Rebase
        # their small generated commits before pushing so a harmless race cannot
        # strand a newly published product URL.
        subprocess.run(["git", "pull", "--rebase", "origin", "main"], check=True)
        subprocess.run(["git", "push"], check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shop-id", required=True)
    parser.add_argument("--template-id", required=True)
    parser.add_argument("--limit", type=int, default=0, help="0 creates every missing magnet")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    state_path = Path("printify-products.json")
    state = json.loads(state_path.read_text()) if state_path.exists() else {"products": {}}
    products = state.setdefault("products", {})
    all_stories = stories()

    if not args.dry_run:
        for story in all_stories:
            known = products.get(story["id"])
            if known and not story["linked"]:
                add_link(story, known["product_url"])
        save_progress("existing-products", state, DATA_FILES)

    queue = [s for s in all_stories if not s["linked"] and s["id"] not in products]
    if args.limit:
        queue = queue[:args.limit]
    print(f"Missing magnets selected: {len(queue)}")

    if args.dry_run:
        for story in queue:
            print(story["id"], image_for(story))
        return

    for number, story in enumerate(queue, 1):
        image = image_for(story)
        result_path = Path(".printify-current-result.json")
        command = [
            sys.executable, "scripts/printify_sync.py",
            "--shop-id", args.shop_id,
            "--template-id", args.template_id,
            "--story-id", story["id"],
            "--title", story["title"],
            "--place", story["place"],
            "--image", str(image),
            "--result", str(result_path),
        ]
        print(f"[{number}/{len(queue)}] Creating {story['id']} from {image}", flush=True)
        subprocess.run(command, check=True)
        result = json.loads(result_path.read_text())
        if not result.get("product_url"):
            raise RuntimeError(f"Printify did not return a storefront URL for {story['id']}")
        products[story["id"]] = result
        add_link(story, result["product_url"])
        save_progress(story["id"], state, DATA_FILES)
        time.sleep(2)


if __name__ == "__main__":
    main()
