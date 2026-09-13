#!/usr/bin/env python3
"""Collect safe provider, variant, print-area, and US shipping options for the Core 8."""

import json
import os
import urllib.error
import urllib.request
from pathlib import Path


API = "https://api.printify.com/v1"
OUTPUT = Path("printify-merch-options.json")
BLUEPRINTS = {
    "unisex_tshirt": 12,
    "hoodie": 77,
    "crewneck_sweatshirt": 49,
    "trucker_hat": 1735,
    "ceramic_mug": 635,
    "sticker": 600,
    "tumbler": 1507,
}


def request(path):
    req = urllib.request.Request(
        f"{API}{path}",
        headers={
            "Authorization": f"Bearer {os.environ['PRINTIFY_API_TOKEN']}",
            "User-Agent": "Blappos-Merch-Options/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")
        raise RuntimeError(f"Printify GET {path} failed ({error.code}): {detail}") from error


def variant_list(payload):
    return payload.get("variants", payload) if isinstance(payload, dict) else payload


def summarize_provider(blueprint_id, provider):
    provider_id = provider["id"]
    variants = variant_list(request(
        f"/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json"
    ))
    shipping = request(
        f"/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping.json"
    )

    colors = sorted({str(v.get("options", {}).get("color")) for v in variants if v.get("options", {}).get("color")})
    sizes = sorted({str(v.get("options", {}).get("size")) for v in variants if v.get("options", {}).get("size")})
    costs = [v.get("cost") for v in variants if isinstance(v.get("cost"), int)]
    print_areas = {}
    for variant in variants:
        for placeholder in variant.get("placeholders", []):
            key = (placeholder.get("position"), placeholder.get("decoration_method"))
            if key not in print_areas:
                print_areas[key] = {
                    "position": placeholder.get("position"),
                    "decoration_method": placeholder.get("decoration_method"),
                    "width": placeholder.get("width"),
                    "height": placeholder.get("height"),
                }

    us_profiles = []
    for profile in shipping.get("profiles", []):
        if "US" in profile.get("countries", []):
            us_profiles.append({
                "first_item": profile.get("first_item"),
                "additional_items": profile.get("additional_items"),
            })

    result = {
        "id": provider_id,
        "title": provider.get("title"),
        "decoration_methods": provider.get("decoration_methods", []),
        "in_stock_variant_count": len(variants),
        "colors": colors,
        "sizes": sizes,
        "print_areas": list(print_areas.values()),
        "handling_time": shipping.get("handling_time"),
        "us_shipping": us_profiles,
    }
    if costs:
        result["variant_cost_range"] = {"min": min(costs), "max": max(costs), "currency": "USD cents"}
    return result


def main():
    result = {"source": "Printify catalog", "products": {}}
    for category, blueprint_id in BLUEPRINTS.items():
        blueprint = request(f"/catalog/blueprints/{blueprint_id}.json")
        providers = request(f"/catalog/blueprints/{blueprint_id}/print_providers.json")
        result["products"][category] = {
            "blueprint": {
                "id": blueprint_id,
                "title": blueprint.get("title"),
                "brand": blueprint.get("brand"),
                "model": blueprint.get("model"),
            },
            "providers": [summarize_provider(blueprint_id, provider) for provider in providers],
        }
        print(category, len(providers), "providers")

    OUTPUT.write_text(json.dumps(result, indent=2) + "\n")


if __name__ == "__main__":
    main()
