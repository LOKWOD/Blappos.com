#!/usr/bin/env python3
"""Find strong Printify catalog candidates for the first Blappos merch drop."""

import json
import os
import urllib.error
import urllib.request
from pathlib import Path


API = "https://api.printify.com/v1"
OUTPUT = Path("printify-merch-catalog.json")

TARGETS = {
    "unisex_tshirt": {
        "include": ("t-shirt", "tee"),
        "prefer": ("unisex", "jersey", "short sleeve", "heavy cotton"),
        "exclude": ("kids", "youth", "baby", "toddler", "women's", "women’s"),
    },
    "hoodie": {
        "include": ("hoodie", "hooded sweatshirt"),
        "prefer": ("unisex", "heavy blend", "pullover"),
        "exclude": ("kids", "youth", "baby", "toddler", "zip"),
    },
    "crewneck_sweatshirt": {
        "include": ("sweatshirt", "crewneck"),
        "prefer": ("unisex", "heavy blend", "crewneck"),
        "exclude": ("hood", "kids", "youth", "baby", "toddler"),
    },
    "trucker_hat": {
        "include": ("trucker",),
        "prefer": ("cap", "hat", "foam"),
        "exclude": ("kids", "youth"),
    },
    "ceramic_mug": {
        "include": ("ceramic mug", "accent coffee mug", "coffee mug"),
        "prefer": ("11oz", "15oz", "ceramic"),
        "exclude": ("travel", "enamel", "ornament"),
    },
    "sticker": {
        "include": ("sticker",),
        "prefer": ("kiss-cut", "die-cut", "vinyl"),
        "exclude": ("sheet", "bumper"),
    },
    "tumbler": {
        "include": ("tumbler",),
        "prefer": ("20oz", "stainless", "vacuum"),
        "exclude": ("wine", "sippy", "kids"),
    },
}


def request(path):
    req = urllib.request.Request(
        f"{API}{path}",
        headers={
            "Authorization": f"Bearer {os.environ['PRINTIFY_API_TOKEN']}",
            "User-Agent": "Blappos-Merch-Discovery/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")
        raise RuntimeError(f"Printify GET {path} failed ({error.code}): {detail}") from error


def score(blueprint, rules):
    haystack = " ".join(
        str(blueprint.get(key, "")) for key in ("title", "brand", "model", "description")
    ).lower()
    if not any(term in haystack for term in rules["include"]):
        return None
    if any(term in haystack for term in rules["exclude"]):
        return None
    points = sum(3 for term in rules["include"] if term in haystack)
    points += sum(2 for term in rules["prefer"] if term in haystack)
    return points


def safe_blueprint(blueprint):
    return {
        "id": blueprint.get("id"),
        "title": blueprint.get("title"),
        "brand": blueprint.get("brand"),
        "model": blueprint.get("model"),
    }


def main():
    blueprints = request("/catalog/blueprints.json")
    result = {"source": "Printify catalog", "categories": {}}

    for category, rules in TARGETS.items():
        ranked = []
        for blueprint in blueprints:
            points = score(blueprint, rules)
            if points is not None:
                ranked.append((points, blueprint))
        ranked.sort(key=lambda item: (-item[0], str(item[1].get("title", ""))))
        result["categories"][category] = [safe_blueprint(item[1]) for item in ranked[:8]]

    OUTPUT.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({name: len(items) for name, items in result["categories"].items()}))


if __name__ == "__main__":
    main()
