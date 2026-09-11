#!/usr/bin/env python3
"""Refresh existing Printify magnets when their approved card artwork changes."""

import json
import re
import subprocess
import sys
from pathlib import Path

from printify_bulk import DATA_FILES, field, story_blocks


def changed_card_ids():
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD^", "HEAD", "--", "assets/cards"],
        check=True, capture_output=True, text=True,
    )
    return {
        Path(line).stem for line in result.stdout.splitlines()
        if Path(line).suffix.lower() in {".webp", ".png", ".jpg", ".jpeg"}
    }


def story_records():
    records = {}
    for data_file in DATA_FILES:
        text = data_file.read_text()
        for _, _, block in story_blocks(text):
            story_id = field(block, "id")
            if story_id:
                records[story_id] = {
                    "id": story_id,
                    "title": field(block, "title"),
                    "place": field(block, "place"),
                    "image": field(block, "image"),
                }
    return records


def main():
    if len(sys.argv) != 4:
        raise SystemExit("usage: printify_refresh_changed.py SHOP_ID TEMPLATE_ID STATE_JSON")
    shop_id, template_id, state_path = sys.argv[1:]
    products = json.loads(Path(state_path).read_text()).get("products", {})
    changed = changed_card_ids()
    refreshed = 0
    for story in story_records().values():
        image = story.get("image")
        product = products.get(story["id"])
        if not image or Path(image).stem not in changed or not product:
            continue
        product_id = product.get("printify_product_id")
        if not product_id:
            continue
        subprocess.run([
            sys.executable, "scripts/printify_sync.py",
            "--shop-id", shop_id, "--template-id", template_id,
            "--story-id", story["id"], "--title", story["title"],
            "--place", story["place"], "--image", image,
            "--update-id", product_id,
            "--result", f".printify-refresh-{story['id']}.json",
        ], check=True)
        Path(f".printify-refresh-{story['id']}.json").unlink(missing_ok=True)
        refreshed += 1
    print(f"Refreshed existing magnets: {refreshed}")


if __name__ == "__main__":
    main()
