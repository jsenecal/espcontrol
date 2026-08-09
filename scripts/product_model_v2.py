#!/usr/bin/env python3
"""Load and validate the Product Model v2 legacy-source adapter.

The model makes current product ownership explicit without moving stable source
files yet. Generators and validators can resolve their inputs through this
module, so later migrations change one declared boundary rather than many
unrelated paths.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
PRODUCT_MODEL_V2_JSON = ROOT / "product" / "model_v2.json"
PRODUCT_MODEL_V2_VERSION = 2
REQUIRED_SOURCES = {
    "cardContract": ("file", "authored"),
    "deviceCatalog": ("file", "authored"),
    "deviceProfiles": ("file", "generated-legacy-adapter"),
    "entityNames": ("file", "authored"),
    "icons": ("file", "authored"),
    "translations": ("glob", "authored"),
    "compatibilityFixtures": ("file", "authored"),
}


class ProductModelV2Error(RuntimeError):
    pass


@dataclass(frozen=True)
class ProductSource:
    identifier: str
    path: Path
    kind: str
    role: str

    def files(self) -> tuple[Path, ...]:
        if self.kind == "file":
            return (self.path,)
        return tuple(sorted(self.path.parent.glob(self.path.name)))


@dataclass(frozen=True)
class ProductModelV2:
    sources: dict[str, ProductSource]
    card_type: str
    device_slug: str

    def source_path(self, identifier: str) -> Path:
        source = self.sources.get(identifier)
        if source is None:
            raise ProductModelV2Error(f"Product Model v2 does not define source {identifier!r}")
        if source.kind != "file":
            raise ProductModelV2Error(f"Product Model v2 source {identifier!r} is not a file")
        return source.path

    def source_directory(self, identifier: str) -> Path:
        source = self.sources.get(identifier)
        if source is None:
            raise ProductModelV2Error(f"Product Model v2 does not define source {identifier!r}")
        return source.path.parent

    def source_json(self, identifier: str) -> dict[str, Any]:
        path = self.source_path(identifier)
        return _load_json(path)

    def sample_card(self) -> dict[str, Any]:
        cards = self.source_json("cardContract").get("cards")
        if not isinstance(cards, dict) or self.card_type not in cards:
            raise ProductModelV2Error("equivalence sample card must exist in cardContract.cards")
        card = cards[self.card_type]
        if not isinstance(card, dict):
            raise ProductModelV2Error("equivalence sample card must be an object")
        return card

    def sample_device(self) -> dict[str, Any]:
        devices = self.source_json("deviceProfiles").get("devices")
        if not isinstance(devices, dict) or self.device_slug not in devices:
            raise ProductModelV2Error("equivalence sample device must exist in deviceProfiles.devices")
        device = devices[self.device_slug]
        if not isinstance(device, dict):
            raise ProductModelV2Error("equivalence sample device must be an object")
        return device


def _reject_duplicate_keys(path: Path, pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ProductModelV2Error(f"{path.relative_to(ROOT)} contains duplicate key {key!r}")
        result[key] = value
    return result


def _load_json(path: Path) -> dict[str, Any]:
    try:
        with path.open(encoding="utf-8") as handle:
            data = json.load(handle, object_pairs_hook=lambda pairs: _reject_duplicate_keys(path, pairs))
    except FileNotFoundError as exc:
        raise ProductModelV2Error(f"{path.relative_to(ROOT)} is missing") from exc
    except json.JSONDecodeError as exc:
        raise ProductModelV2Error(f"{path.relative_to(ROOT)} is not valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ProductModelV2Error(f"{path.relative_to(ROOT)} must contain an object")
    return data


def _source_path(identifier: str, source_data: dict[str, Any]) -> ProductSource:
    expected_kind, expected_role = REQUIRED_SOURCES[identifier]
    if set(source_data) != {"path", "kind", "role"}:
        raise ProductModelV2Error(f"sources.{identifier} must contain path, kind, and role")
    path_value = source_data["path"]
    if not isinstance(path_value, str) or not path_value:
        raise ProductModelV2Error(f"sources.{identifier}.path must be a non-empty string")
    path = (ROOT / path_value).resolve()
    if ROOT not in path.parents and path != ROOT:
        raise ProductModelV2Error(f"sources.{identifier}.path must remain inside the repository")
    if source_data["kind"] != expected_kind:
        raise ProductModelV2Error(f"sources.{identifier}.kind must be {expected_kind!r}")
    if source_data["role"] != expected_role:
        raise ProductModelV2Error(f"sources.{identifier}.role must be {expected_role!r}")
    source = ProductSource(identifier, path, expected_kind, expected_role)
    files = source.files()
    if not files:
        raise ProductModelV2Error(f"sources.{identifier}.path does not match any files")
    if expected_kind == "file" and not path.is_file():
        raise ProductModelV2Error(f"sources.{identifier}.path must name a file")
    return source


def load_product_model_v2(path: Path = PRODUCT_MODEL_V2_JSON) -> ProductModelV2:
    data = _load_json(path)
    if data.get("modelVersion") != PRODUCT_MODEL_V2_VERSION:
        raise ProductModelV2Error(f"modelVersion must be {PRODUCT_MODEL_V2_VERSION}")
    if data.get("stage") != "legacy-adapter":
        raise ProductModelV2Error("stage must be 'legacy-adapter' until source migration begins")
    if not isinstance(data.get("description"), str) or not data["description"].strip():
        raise ProductModelV2Error("description must be a non-empty string")
    sources_data = data.get("sources")
    if not isinstance(sources_data, dict) or set(sources_data) != set(REQUIRED_SOURCES):
        raise ProductModelV2Error("sources must define every Product Model v2 source exactly once")
    if not all(isinstance(value, dict) for value in sources_data.values()):
        raise ProductModelV2Error("every source must be an object")
    sources = {
        identifier: _source_path(identifier, sources_data[identifier])
        for identifier in REQUIRED_SOURCES
    }
    samples = data.get("equivalenceSamples")
    if not isinstance(samples, dict) or set(samples) != {"cardType", "deviceSlug"}:
        raise ProductModelV2Error("equivalenceSamples must define cardType and deviceSlug")
    card_type = samples["cardType"]
    device_slug = samples["deviceSlug"]
    if not isinstance(card_type, str) or not isinstance(device_slug, str) or not device_slug:
        raise ProductModelV2Error("equivalence sample values must be strings, with a non-empty deviceSlug")
    return ProductModelV2(sources, card_type, device_slug)


def source_path(identifier: str) -> Path:
    return load_product_model_v2().source_path(identifier)


def source_directory(identifier: str) -> Path:
    return load_product_model_v2().source_directory(identifier)
