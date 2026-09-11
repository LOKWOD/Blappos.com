#!/usr/bin/env python3
"""Create Blappos Core 8 logo merch in Printify and emit storefront data.

This script is intentionally conservative: it rate-limits catalog calls, retries 429s,
reuses products already recorded in merch-products.json, and only exposes products
once Printify returns a live external storefront id.
"""

import base64
import json
import os
import time
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path

API = "https://api.printify.com/v1"
SHOP_ID = "28900389"
LOGO_PATH = Path("assets/blappos-logo.png")
STATE_PATH = Path("merch-products.json")
JS_PATH = Path("merch/merch-data.js")

PRODUCTS = [
    {
        "key": "logo-tee",
        "label": "Blappos Logo Tee",
        "category": "T-Shirt",
        "blueprint": 12,
        "price": 2499,
        "scale": 0.64,
        "y": 0.36,
        "colors": ("black", "navy", "red", "white", "dark grey", "dark gray", "heather"),
        "sizes": ("s", "m", "l", "xl", "2xl", "3xl"),
        "max_variants": 30,
        "provider_preferences": ("monster digital", "swiftpod", "drive fulfillment"),
        "blurb": "The Blappos logo on a proper everyday tee. Bad news, breathable cotton.",
    },
    {
        "key": "logo-hoodie",
        "label": "Blappos Logo Hoodie",
        "category": "Hoodie",
        "blueprint": 77,
        "price": 4999,
        "scale": 0.62,
        "y": 0.40,
        "colors": ("black", "navy", "dark heather", "sport grey", "sport gray", "red"),
        "sizes": ("s", "m", "l", "xl", "2xl", "3xl"),
        "max_variants": 28,
        "provider_preferences": ("monster digital", "swiftpod", "drive fulfillment"),
        "blurb": "Heavy logo hoodie for weather, bad headlines, and questionable decisions.",
    },
    {
        "key": "logo-crewneck",
        "label": "Blappos Logo Crewneck",
        "category": "Crewneck",
        "blueprint": 49,
        "price": 3999,
        "scale": 0.62,
        "y": 0.34,
        "colors": ("black", "navy", "dark heather", "sport grey", "sport gray", "red"),
        "sizes": ("s", "m", "l", "xl", "2xl", "3xl"),
        "max_variants": 28,
        "provider_preferences": ("monster digital", "swiftpod", "drive fulfillment"),
        "blurb": "Old-school crewneck. New-school bad news.",
    },
    {
        "key": "logo-trucker",
        "label": "Blappos Trucker Hat",
        "category": "Hat",
        "blueprint": 1735,
        "price": 2499,
        "scale": 0.72,
        "colors": ("black", "navy", "red", "white", "black/white", "navy/white", "red/white"),
        "sizes": (),
        "max_variants": 12,
        "provider_preferences": (),
        "blurb": "Foam-front trucker hat for broadcasting poor judgment from a distance.",
    },
    {
        "key": "logo-mug",
        "label": "Blappos Coffee Mug",
        "category": "Mug",
        "blueprint": 635,
        "price": 1699,
        "scale": 0.78,
        "colors": ("black", "navy", "red", "blue"),
        "sizes": ("11oz", "15oz", "11 oz", "15 oz"),
        "max_variants": 12,
        "provider_preferences": ("district photo",),
        "blurb": "Coffee tastes more responsible when the mug clearly is not.",
    },
    {
        "key": "logo-sticker",
        "label": "Blappos Logo Sticker",
        "category": "Sticker",
        "blueprint": 600,
        "price": 599,
        "scale": 0.90,
        "colors": (),
        "sizes": ("3", "4"),
        "max_variants": 6,
        "provider_preferences": (),
        "blurb": "Put Blappos on laptops, coolers, toolboxes, or anything else with standards to lower.",
    },
    {
        "key": "logo-tumbler",
        "label": "Blappos 20oz Tumbler",
        "category": "Tumbler",
        "blueprint": 1507,
        "price": 2799,
        "scale": 0.78,
        "colors": ("black", "navy", "white", "stainless"),
        "sizes": ("20oz", "20 oz"),
        "max_variants": 10,
        "provider_preferences": ("district photo",),
        "blurb": "Twenty ounces of hydration wrapped in the visual equivalent of a bad idea.",
    },
]


def request(method, path, payload=None, attempts=8):
    token = os.environ["PRINTIFY_API_TOKEN"]
    data = None if payload is None else json.dumps(payload).encode()
    delay = 2
    for attempt in range(attempts):
        req = urllib.request.Request(
            f"{API}{path}",
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "User-Agent": "Blappos-Core-8-Merch/1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                body = response.read()
                time.sleep(0.8)
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")
            if error.code == 429 and attempt < attempts - 1:
                print(f"Printify rate limit on {path}; sleeping {delay}s", flush=True)
                time.sleep(delay)
                delay = min(delay * 2, 45)
                continue
            raise RuntimeError(f"Printify {method} {path} failed ({error.code}): {detail}") from error


def load_state():
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text())
    return {"products": {}, "updated_at": None}


def upload_logo():
    raw = LOGO_PATH.read_bytes()
    payload = {
        "file_name": "blappos-logo-merch.png",
        "contents": base64.b64encode(raw).decode(),
    }
    return request("POST", "/uploads/images.json", payload)["id"]


def provider_score(provider, preferences):
    title = str(provider.get("title", "")).lower()
    country = str((provider.get("location") or {}).get("country", "")).upper()
    score = 50 if country == "US" else 0
    for idx, preferred in enumerate(preferences):
        if preferred in title:
            score += 30 - idx * 4
    return score


def variant_options(variant):
    return {str(k).lower(): str(v).lower() for k, v in (variant.get("options") or {}).items()}


def select_variants(variants, config, position, method):
    usable = []
    for variant in variants:
        if not any(p.get("position") == position and p.get("decoration_method") == method for p in variant.get("placeholders", [])):
            continue
        options = variant_options(variant)
        color = options.get("color", "")
        size = options.get("size", "")
        color_ok = not config["colors"] or any(choice in color for choice in config["colors"])
        size_ok = not config["sizes"] or any(choice == size or choice in size for choice in config["sizes"])
        if color_ok and size_ok:
            usable.append(variant)
    if not usable:
        usable = [
            v for v in variants
            if any(p.get("position") == position and p.get("decoration_method") == method for p in v.get("placeholders", []))
        ]
    return usable[: config["max_variants"]]


def choose_provider_and_area(config):
    providers = request("GET", f"/catalog/blueprints/{config['blueprint']}/print_providers.json")
    providers = sorted(providers, key=lambda p: provider_score(p, config["provider_preferences"]), reverse=True)
    best = None
    # Inspect only a handful of providers to stay friendly to Printify's catalog rate limit.
    for provider in providers[:6]:
        try:
            payload = request(
                "GET",
                f"/catalog/blueprints/{config['blueprint']}/print_providers/{provider['id']}/variants.json",
            )
        except RuntimeError as exc:
            print(f"Skipping provider {provider.get('title')}: {exc}", flush=True)
            continue
        variants = payload.get("variants", payload) if isinstance(payload, dict) else payload
        if not variants:
            continue
        areas = Counter()
        for variant in variants:
            for placeholder in variant.get("placeholders", []):
                pos = placeholder.get("position")
                method = placeholder.get("decoration_method")
                if pos and method:
                    bonus = 100 if pos in {"front", "front_large_center", "front_center"} else 0
                    if method in {"dtg", "dtf", "sublimation", "uv"}:
                        bonus += 30
                    areas[(pos, method)] += 1 + bonus
        if not areas:
            continue
        (position, method), _ = areas.most_common(1)[0]
        selected = select_variants(variants, config, position, method)
        if not selected:
            continue
        costs = [v.get("cost") for v in selected if isinstance(v.get("cost"), int)]
        average_cost = sum(costs) / len(costs) if costs else 999999
        score = provider_score(provider, config["provider_preferences"]) + len(selected) * 2 - average_cost / 1000
        candidate = (score, provider, selected, position, method)
        if best is None or candidate[0] > best[0]:
            best = candidate
    if best is None:
        raise RuntimeError(f"No printable provider/variants found for {config['key']}")
    _, provider, selected, position, method = best
    return provider, selected, position, method


def create_product(config, logo_id):
    provider, variants, position, method = choose_provider_and_area(config)
    variant_ids = [v["id"] for v in variants]
    product_payload = {
        "title": config["label"],
        "description": (
            f"Official Blappos logo {config['category'].lower()}. {config['blurb']} "
            "Printed to order through the Blappos Printify storefront."
        ),
        "blueprint_id": config["blueprint"],
        "print_provider_id": provider["id"],
        "variants": [
            {"id": variant_id, "price": config["price"], "is_enabled": True}
            for variant_id in variant_ids
        ],
        "print_areas": [{
            "variant_ids": variant_ids,
            "placeholders": [{
                "position": position,
                "decoration_method": method,
                "images": [{
                    "id": logo_id,
                    "x": 0.5,
                    "y": config.get("y", 0.5),
                    "scale": config["scale"],
                    "angle": 0,
                }],
            }],
        }],
    }
    product = request("POST", f"/shops/{SHOP_ID}/products.json", product_payload)
    product_id = product["id"]
    request("POST", f"/shops/{SHOP_ID}/products/{product_id}/publish.json", {
        "title": True,
        "description": True,
        "images": True,
        "variants": True,
        "tags": True,
        "keyFeatures": True,
        "shipping_template": True,
    })

    external_id = None
    current = product
    for _ in range(18):
        time.sleep(5)
        current = request("GET", f"/shops/{SHOP_ID}/products/{product_id}.json")
        external_id = (current.get("external") or {}).get("id")
        if external_id:
            break
    if not external_id:
        raise RuntimeError(f"Printify did not return a storefront id for {config['key']}")

    images = current.get("images") or []
    image_url = images[0].get("src") if images else ""
    return {
        "key": config["key"],
        "title": config["label"],
        "category": config["category"],
        "blurb": config["blurb"],
        "price": f"${config['price'] / 100:.2f}",
        "printify_product_id": product_id,
        "external_id": external_id,
        "product_url": f"https://blappos.printify.me/product/{external_id}",
        "image": image_url,
        "provider": provider.get("title"),
        "blueprint_id": config["blueprint"],
        "variant_count": len(variant_ids),
    }


def realign_existing_product(current, config):
    """Keep published apparel art in the visual chest zone, not the print-box center."""
    target_y = config.get("y")
    if target_y is None:
        return current
    print_areas = current.get("print_areas") or []
    changed = False
    for area in print_areas:
        for placeholder in area.get("placeholders") or []:
            # Printify omits ``images`` on unused garment zones in GET responses,
            # but requires the field to be present when the same payload is PUT.
            images = placeholder.setdefault("images", [])
            for image in images:
                if image.get("y") != target_y:
                    image["y"] = target_y
                    changed = True
    if not changed:
        return current
    product_id = current["id"]
    print(f"Realigning {config['key']} artwork to y={target_y:.2f}", flush=True)
    request("PUT", f"/shops/{SHOP_ID}/products/{product_id}.json", {"print_areas": print_areas})
    request("POST", f"/shops/{SHOP_ID}/products/{product_id}/publish.json", {
        "title": False,
        "description": False,
        "images": True,
        "variants": False,
        "tags": False,
        "keyFeatures": False,
        "shipping_template": False,
    })
    # Give Printify time to regenerate mockups before refreshing storefront data.
    time.sleep(8)
    return request("GET", f"/shops/{SHOP_ID}/products/{product_id}.json")


def refresh_existing(record, config):
    product_id = record.get("printify_product_id")
    if not product_id:
        return record
    try:
        current = request("GET", f"/shops/{SHOP_ID}/products/{product_id}.json")
    except RuntimeError:
        return record
    current = realign_existing_product(current, config)
    external_id = (current.get("external") or {}).get("id") or record.get("external_id")
    images = current.get("images") or []
    if external_id:
        record["external_id"] = external_id
        record["product_url"] = f"https://blappos.printify.me/product/{external_id}"
    if images and images[0].get("src"):
        record["image"] = images[0]["src"]
    return record


def save_state(state):
    state["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    ordered = []
    for config in PRODUCTS:
        record = state["products"].get(config["key"])
        if record and record.get("product_url"):
            ordered.append(record)
    payload = {"updated_at": state["updated_at"], "products": ordered}
    STATE_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    JS_PATH.write_text("window.blapposMerchProducts=" + json.dumps(payload, separators=(",", ":")) + ";\n")


def main():
    if not LOGO_PATH.exists():
        raise FileNotFoundError(LOGO_PATH)
    state = load_state()
    if isinstance(state.get("products"), list):
        state["products"] = {item["key"]: item for item in state["products"] if item.get("key")}
    products = state.setdefault("products", {})

    configs = {config["key"]: config for config in PRODUCTS}
    for key in list(products):
        products[key] = refresh_existing(products[key], configs.get(key, {}))
    save_state(state)

    missing = [config for config in PRODUCTS if not products.get(config["key"], {}).get("product_url")]
    print(f"Merch products missing: {len(missing)}", flush=True)
    if not missing:
        return

    logo_id = upload_logo()
    failures = []
    for index, config in enumerate(missing, 1):
        print(f"[{index}/{len(missing)}] Creating {config['label']}", flush=True)
        try:
            products[config["key"]] = create_product(config, logo_id)
            save_state(state)
            print(products[config["key"]]["product_url"], flush=True)
        except Exception as exc:
            failures.append((config["key"], str(exc)))
            print(f"FAILED {config['key']}: {exc}", flush=True)
        time.sleep(3)

    save_state(state)
    if failures:
        print("Some products need a retry:", json.dumps(failures), flush=True)
        # Return success so completed products are committed. A follow-up run will retry only missing products.


if __name__ == "__main__":
    main()
