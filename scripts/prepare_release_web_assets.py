#!/usr/bin/env python3
"""Add a release tag to the generated web bundle compatibility source."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = ROOT / "scripts" / "build.py"
RELEASE_TAG_RE = re.compile(r"^v\d+\.\d+\.\d+(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?$")
VERSION_LIST_RE = re.compile(
    r"(?ms)^(WEB_ASSET_SUPPORTED_FIRMWARE_VERSIONS = \(\n)(.*?)(^\))"
)


class PrepareReleaseWebAssetsError(RuntimeError):
    pass


def prepare(path: Path, tag: str) -> bool:
    if not RELEASE_TAG_RE.fullmatch(tag):
        raise PrepareReleaseWebAssetsError(
            f"{tag!r} is not a full release tag such as v1.2.3 or v1.2.3-beta.1"
        )
    source = path.read_text(encoding="utf-8")
    match = VERSION_LIST_RE.search(source)
    if not match:
        raise PrepareReleaseWebAssetsError(
            f"Could not find WEB_ASSET_SUPPORTED_FIRMWARE_VERSIONS in {path}"
        )
    versions = re.findall(r'"([^"]+)"', match.group(2))
    if not versions or versions[0] != "dev":
        raise PrepareReleaseWebAssetsError("web asset compatibility list must start with dev")
    if tag in versions:
        return False
    versions.insert(1, tag)
    entries = "".join(f'    "{version}",\n' for version in versions)
    updated = source[:match.start()] + match.group(1) + entries + match.group(3) + source[match.end():]
    path.write_text(updated, encoding="utf-8")
    return True


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tag", help="New release tag, for example v1.2.3")
    parser.add_argument("--build-script", type=Path, default=BUILD_SCRIPT)
    args = parser.parse_args(argv)
    try:
        changed = prepare(args.build_script, args.tag)
    except PrepareReleaseWebAssetsError as exc:
        print(f"::error::{exc}")
        return 1
    if changed:
        print(f"Added {args.tag} to the web asset compatibility list. Run scripts/build.py next.")
    else:
        print(f"{args.tag} is already present in the web asset compatibility list.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
