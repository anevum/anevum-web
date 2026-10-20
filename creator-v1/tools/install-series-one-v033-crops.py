#!/usr/bin/env python3
"""Install 60 approved V033 concept crops from the owner-reviewed ZIP.

The 128px files are preview art, not canonical high-resolution masters. Do not
silently upscale or mislabel them. Keeps the existing SVG fallback in place.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
from zipfile import ZipFile
from PIL import Image

ROOT = Path("creator-v1/web/public/assets/levels/series-one-v033")
SOURCE_SHA256 = "894d26408955049e9c0c37b1e66c9972d09a0b826c5770bb600ceb2637801896"

def install(archive, repo):
    with ZipFile(archive) as bundle:
        manifest = json.loads(bundle.read("manifest.json"))
        if manifest.get("source_sha256") != SOURCE_SHA256:
            raise ValueError("Unapproved concept atlas source")
        entries = manifest.get("items", [])
        if len(entries) != 60 or {x["level"] for x in entries} != set(range(1, 61)):
            raise ValueError("Expected all sixty distinct canonical IDs")
        validated = []
        for entry in entries:
            level = entry["level"]
            path = f"concept-crops/level-{level:02d}.webp"
            if entry.get("file") != path:
                raise ValueError("Unexpected filename")
            payload = bundle.read(path)
            if hashlib.sha256(payload).hexdigest() != entry["sha256"]:
                raise ValueError(f"Checksum mismatch at level {level}")
            with Image.open(io.BytesIO(payload)) as im:
                if im.format != "WEBP" or im.size != (128, 128):
                    raise ValueError(f"Unexpected image at level {level}")
                im.verify()
            validated.append((level, payload))
        target = repo / ROOT
        target.mkdir(parents=True, exist_ok=True)
        for level, payload in validated:
            (target / f"level-{level:02d}.webp").write_bytes(payload)
        (target / "manifest.json").write_text(json.dumps(manifest, indent=2)+"\n")
        print("Installed 60 owner-approved V033 preview crops:", target)

if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("archive", type=Path)
    p.add_argument("--repository", type=Path, default=Path("."))
    args = p.parse_args()
    install(args.archive, args.repository)
