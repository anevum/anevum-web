#!/usr/bin/env python3
"""Install the exact owner-approved V033 concept atlas for a staging preview.

Does NOT claim the image contains sixty canonical level masters and does not
enable the V032 illustrated-level feature flag.
"""
import argparse
import hashlib
from pathlib import Path
from PIL import Image

EXPECTED_SHA256 = "894d26408955049e9c0c37b1e66c9972d09a0b826c5770bb600ceb2637801896"
EXPECTED_DIMENSIONS = (1536, 1024)
DESTINATION = Path("creator-v1/web/public/assets/levels/series-one-v033-concept-atlas.png")

def install(source: Path, repository: Path) -> Path:
    payload = source.read_bytes()
    actual = hashlib.sha256(payload).hexdigest()
    if actual != EXPECTED_SHA256:
        raise ValueError(f"Atlas SHA-256 mismatch: {actual}")
    with Image.open(source) as image:
        if image.format != "PNG" or image.size != EXPECTED_DIMENSIONS:
            raise ValueError("Expected approved 1536x1024 PNG atlas")
        image.verify()
    destination = repository / DESTINATION
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(payload)
    return destination

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--repository", type=Path, default=Path("."))
    args = parser.parse_args()
    print("Installed verified V033 concept atlas:", install(args.source, args.repository))
