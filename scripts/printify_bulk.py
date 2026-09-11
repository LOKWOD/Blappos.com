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
}
DATA_FILES = (Path("daily-data.js"), Path("archive-data.js"))


def field(line, name):
    match = re.search(rf"(?:\{{|,)\s*{name}:'([^']*)'", line)
    return match.group(1) if match else None


def image_for(story):
    if story.get("image"):
        path = Path(story["image"])
        if path.exists():
            return path
    stem = ALIASES.get(story["id"], story["id"])
    for suffix in (".webp", ".jpg", ".jpeg", ".png"):
        path = Path("assets/cards") / f"{stem}{suffix}"
        if path.exists():
            return path
    raise FileNotFoundError(f"No live card artwork found for {story['id']}")


def stories():
    found = []
    seen = set()
    for data_file in DATA_FILES:
        for line in data_file.read_text().splitlines():
            story_id = field(line, "id")
            if not story_id or story_id in seen:
                continue
            seen.add(story_id)
            found.append({
                "id": story_id,
                "title": field(line, "title"),
                "place": field(line, "place"),
                "image": field(line, "image"),
                "file": data_file,
                "linked": "magnetUrl:" in line,
            })
    return found


def add_link(story, url):
    path = story["file"]
    lines = path.read_text().splitlines(keepends=True)
    marker = f"{{id:'{story['id']}'"
    for index, line in enumerate(lines):
        if marker not in line:
            continue
        if "magnetUrl:" in line:
            return
        title_match = re.search(r"title:'[^']*',", line)
        if not title_match:
            raise RuntimeError(f"Could not place magnet link for {story['id']}")
        insert = f"magnetUrl:'{url}',magnetPrice:'$9.99',"
        lines[index] = line[:title_match.end()] + insert + line[title_match.end():]
        path.write_text("".join(lines))
        return
    raise RuntimeError(f"Could not find story {story['id']} in {path}")


def save_progress(story_id, state, paths):
    Path("printify-products.json").write_text(json.dumps(state, indent=2) + "\n")
    subprocess.run(["git", "add", "printify-products.json", *map(str, paths)], check=True)
    if subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode:
        subprocess.run(["git", "commit", "-m", f"Add purchasable magnet for {story_id}"], check=True)
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
