#!/usr/bin/env python3
"""Verify that Product Model v2 mirrors the current legacy product sources."""

from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

from product_model_v2 import ProductModelV2Error, load_product_model_v2


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def assert_equivalence() -> None:
    model = load_product_model_v2()
    cards = load_json(model.source_path("cardContract"))["cards"]
    profiles = load_json(model.source_path("deviceProfiles"))["devices"]
    assert model.card_type in cards, "Product Model v2 sample card must exist in the legacy card contract"
    assert model.device_slug in profiles, "Product Model v2 sample device must exist in the legacy manifest"

    # Canonical JSON makes this a byte-for-byte comparison of the selected
    # legacy payload and the Product Model adapter view used by later generators.
    legacy_card = json.dumps(cards[model.card_type], sort_keys=True, separators=(",", ":"))
    adapter_card = json.dumps(model.sample_card(), sort_keys=True, separators=(",", ":"))
    legacy_device = json.dumps(profiles[model.device_slug], sort_keys=True, separators=(",", ":"))
    adapter_device = json.dumps(model.sample_device(), sort_keys=True, separators=(",", ":"))
    assert legacy_card == adapter_card, "selected card differs from its Product Model adapter view"
    assert legacy_device == adapter_device, "selected device differs from its Product Model adapter view"


def run_self_test() -> None:
    assert_equivalence()
    model_path = Path(__file__).resolve().parent.parent / "product" / "model_v2.json"
    data = load_json(model_path)
    invalid = copy.deepcopy(data)
    invalid["sources"].pop("icons")
    with TemporaryDirectory() as directory:
        path = Path(directory) / "model.json"
        path.write_text(json.dumps(invalid), encoding="utf-8")
        try:
            load_product_model_v2(path)
        except ProductModelV2Error as exc:
            assert "sources must define every Product Model v2 source exactly once" in str(exc)
        else:
            raise AssertionError("missing product source must fail validation")
    print("Product Model v2 self-test passed.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="run Product Model v2 validator self-tests")
    args = parser.parse_args()
    try:
        if args.self_test:
            run_self_test()
        else:
            assert_equivalence()
            print("Product Model v2 legacy adapter matches its selected legacy card and device.")
    except (AssertionError, ProductModelV2Error, KeyError) as exc:
        print(f"ERROR: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
