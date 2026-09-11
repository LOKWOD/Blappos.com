#!/usr/bin/env python3
"""Create a Blappos magnet from the approved Printify master product."""

import argparse
import base64
import copy
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.printify.com/v1"


def request(method, path, token, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            body = response.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")
        raise RuntimeError(f"Printify {method} {path} failed ({error.code}): {detail}") from error


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shop-id", required=True)
    parser.add_argument("--template-id", required=True)
    parser.add_argument("--story-id", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--place", required=True)
    parser.add_argument("--image", required=True)
    parser.add_argument("--result", default="printify-test-result.json")
    args = parser.parse_args()

    token = os.environ["PRINTIFY_API_TOKEN"]
    shop_id = args.shop_id
    template = request("GET", f"/shops/{shop_id}/products/{args.template_id}.json", token)

    image_path = Path(args.image)
    upload = request(
        "POST",
        "/uploads/images.json",
        token,
        {
            "file_name": f"{args.story_id}{image_path.suffix}",
            "contents": base64.b64encode(image_path.read_bytes()).decode(),
        },
    )

    print_areas = copy.deepcopy(template["print_areas"])
    for area in print_areas:
        for placeholder in area.get("placeholders", []):
            for image in placeholder.get("images", []):
                image["id"] = upload["id"]

    variants = []
    for variant in template["variants"]:
        variants.append(
            {
                "id": variant["id"],
                "price": 999,
                "is_enabled": bool(variant.get("is_enabled")),
            }
        )

    payload = {
        "title": f"{args.place} Magnet — {args.title}",
        "description": (
            f"A 3-inch square Blappos magnet inspired by the illustrated satire card "
            f"for {args.place}. Rigid, scratch-resistant and printed to order. "
            "Artwork is satirical commentary, not documentary photography."
        ),
        "blueprint_id": template["blueprint_id"],
        "print_provider_id": template["print_provider_id"],
        "variants": variants,
        "print_areas": print_areas,
    }
    product = request("POST", f"/shops/{shop_id}/products.json", token, payload)
    product_id = product["id"]
    request(
        "POST",
        f"/shops/{shop_id}/products/{product_id}/publish.json",
        token,
        {
            "title": True,
            "description": True,
            "images": True,
            "variants": True,
            "tags": True,
            "keyFeatures": True,
            "shipping_template": True,
        },
    )

    external_id = None
    for _ in range(8):
        time.sleep(5)
        current = request("GET", f"/shops/{shop_id}/products/{product_id}.json", token)
        external_id = (current.get("external") or {}).get("id")
        if external_id:
            break

    result = {
        "story_id": args.story_id,
        "printify_product_id": product_id,
        "external_id": external_id,
        "product_url": f"https://blappos.printify.me/product/{external_id}" if external_id else None,
    }
    Path(args.result).write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result))


if __name__ == "__main__":
    main()
