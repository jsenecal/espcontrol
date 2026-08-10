#!/usr/bin/env python3
"""Verify that every release-facing artifact declares one compatible contract."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "product" / "release_contract.json"
PRODUCT_MODEL = ROOT / "product" / "model_v2.json"
DEVICE_MANIFEST = ROOT / "devices" / "manifest.json"
WEB_MANIFEST = ROOT / "docs" / "public" / "webserver" / "web-assets.json"
DOCUMENT_HEADER = ROOT / "components" / "espcontrol" / "panel_config_document.h"
CAPABILITIES_HEADER = ROOT / "components" / "espcontrol" / "panel_config_capabilities.h"
COMPATIBILITY_POLICY = ROOT / "components" / "espcontrol" / "configuration_release_policy.h"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def constant(path: Path, name: str) -> int:
    match = re.search(rf"constexpr uint16_t {name} = (\d+);", path.read_text(encoding="utf-8"))
    if not match:
        raise AssertionError(f"{path.relative_to(ROOT)}: missing {name}")
    return int(match.group(1))


def verify() -> None:
    contract = read_json(CONTRACT)
    assert contract["schemaVersion"] == 1, "release contract schema version must be 1"
    product_model = read_json(PRODUCT_MODEL)
    assert product_model["modelVersion"] == contract["productModelVersion"], (
        "Product Model version disagrees with release contract"
    )
    document_version = constant(DOCUMENT_HEADER, "PANEL_CONFIG_DOCUMENT_VERSION")
    capabilities = CAPABILITIES_HEADER.read_text(encoding="utf-8")
    assert "PANEL_CONFIG_DOCUMENT_VERSION" in capabilities, (
        "firmware capabilities do not advertise the PanelConfig document version"
    )
    assert document_version == contract["panelConfigDocumentVersion"], (
        "PanelConfig document version disagrees with release contract"
    )
    capability_web_version = constant(CAPABILITIES_HEADER, "PANEL_CONFIG_WEB_ASSET_VERSION")
    assert capability_web_version == contract["webAssetVersion"], (
        "firmware web-asset version disagrees with release contract"
    )
    device_slugs = list(read_json(DEVICE_MANIFEST)["devices"])
    bundles = read_json(WEB_MANIFEST).get("bundles", [])
    assert len(bundles) == 1, "web-asset manifest must contain one current bundle"
    bundle = bundles[0]
    assert bundle.get("webAssetVersion") == contract["webAssetVersion"], (
        "web-asset version disagrees with release contract"
    )
    assert bundle.get("deviceProfiles") == device_slugs, (
        "web-asset device profiles disagree with generated device manifest"
    )
    compatibility = contract.get("panelConfigCompatibility")
    assert isinstance(compatibility, dict), "release contract lacks PanelConfig compatibility policy"
    assert compatibility.get("phase") in {"dual-write", "read-import-only"}, (
        "PanelConfig compatibility phase is invalid"
    )
    assert compatibility.get("dualWriteStableReleases") == 2, (
        "PanelConfig compatibility policy must retain two dual-write stable releases"
    )
    assert compatibility.get("readImportOnlyStableReleases") == 1, (
        "PanelConfig compatibility policy must retain one read/import-only stable release"
    )
    expected_mode = {
        "dual-write": "LegacyConfigurationMode::DUAL_WRITE",
        "read-import-only": "LegacyConfigurationMode::READ_IMPORT_ONLY",
    }[compatibility["phase"]]
    assert expected_mode in COMPATIBILITY_POLICY.read_text(encoding="utf-8"), (
        "firmware PanelConfig compatibility policy disagrees with release contract"
    )


def self_test() -> None:
    verify()
    original = PRODUCT_MODEL.read_text(encoding="utf-8")
    original_policy = COMPATIBILITY_POLICY.read_text(encoding="utf-8")
    try:
        product_model = json.loads(original)
        product_model["modelVersion"] = int(product_model["modelVersion"]) + 1
        PRODUCT_MODEL.write_text(json.dumps(product_model, indent=2) + "\n", encoding="utf-8")
        try:
            verify()
        except AssertionError as error:
            assert "Product Model version" in str(error)
        else:
            raise AssertionError("mismatched Product Model version was accepted")
    finally:
        PRODUCT_MODEL.write_text(original, encoding="utf-8")
    try:
        COMPATIBILITY_POLICY.write_text(
            original_policy.replace(
                "LegacyConfigurationMode::DUAL_WRITE",
                "LegacyConfigurationMode::READ_IMPORT_ONLY",
            ),
            encoding="utf-8",
        )
        try:
            verify()
        except AssertionError as error:
            assert "firmware PanelConfig compatibility policy" in str(error)
        else:
            raise AssertionError("mismatched PanelConfig compatibility policy was accepted")
    finally:
        COMPATIBILITY_POLICY.write_text(original_policy, encoding="utf-8")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        print("Release contract self-test passed.")
    else:
        verify()
        print("Release contract checks passed.")
