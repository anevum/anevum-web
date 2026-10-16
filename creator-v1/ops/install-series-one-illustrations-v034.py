#!/usr/bin/env python3
"""Validate private Series One artwork before optional local installation.

Default is read-only. Installation requires an explicit approval flag and only
writes into a local checkout; it never changes accounts, services or deployments.
"""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile

SIZES = (128, 512, 1254)
ARCHIVE_ROOT = "ANEVUM-Series-One/"
DESTINATION = Path("creator-v1/web/public/assets/levels/illustrated")
CATALOGUE = Path("creator-v1/shared/level-artifacts.json")


def validate(archive: Path, repository: Path):
    catalogue = json.loads((repository / CATALOGUE).read_text(encoding="utf-8"))
    canon = {record["level"]: record["name"] for record in catalogue}
    if len(catalogue) != 60 or len(canon) != 60 or set(canon) != set(range(1, 61)):
        raise ValueError("Expected exactly 60 distinct canonical levels")

    verified = {}
    with ZipFile(archive) as package:
        manifest = json.loads(package.read(ARCHIVE_ROOT + "manifest.json"))
        entries = manifest.get("artifacts", [])
        if (manifest.get("levelCount") != 60 or len(entries) != 60 or
                {entry.get("level") for entry in entries} != set(range(1, 61))):
            raise ValueError("Archive does not contain the exact 60-level series")
        for entry in entries:
            level = entry["level"]
            if entry.get("name") != canon[level]:
                raise ValueError(f"Canonical title mismatch at level {level}")
            for size in SIZES:
                rel = f"web-optimized/{size}/level-{level:02d}.webp"
                info = entry.get("webp", {}).get(str(size), {})
                if info.get("path") != rel or not info.get("sha256"):
                    raise ValueError("Missing declared artwork: " + rel)
                data = package.read(ARCHIVE_ROOT + rel)
                if not (100 < len(data) < 2000000 and
                        data[:4] == b"RIFF" and data[8:12] == b"WEBP"):
                    raise ValueError("Invalid WebP payload: " + rel)
                if len(data) != info.get("bytes"):
                    raise ValueError("Artwork length mismatch: " + rel)
                if hashlib.sha256(data).hexdigest() != info["sha256"]:
                    raise ValueError("Artwork SHA-256 mismatch: " + rel)
                verified[(size, level)] = data
    if len(verified) != 180:
        raise ValueError("Expected exactly 180 image variants")
    return verified


def run():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--repository", type=Path, default=Path("."))
    parser.add_argument("--install-approved-art", action="store_true",
                        help="Install only after documented visual and rights approval")
    args = parser.parse_args()
    verified = validate(args.archive, args.repository)
    print("PASS: 60 canonical artifacts; 180 hash-matched responsive WebP images")
    if not args.install_approved_art:
        print("READ-ONLY: no images were written. Approval is still required.")
        return
    for (size, level), data in sorted(verified.items()):
        folder = args.repository / DESTINATION / str(size)
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"level-{level:02d}.webp").write_bytes(data)
    print("Installed 180 local WebP derivatives. Build flag remains OFF by default.")


if __name__ == "__main__":
    run()
