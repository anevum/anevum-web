#!/usr/bin/env python3
"""Replace only the static V062 miniature poster fallbacks in a built asset tree.
No live deploy, membership change or database operation.
"""
from pathlib import Path
from io import BytesIO
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "design/evolution-v059/artwork/micro"
TARGET = ROOT / "creator-v1/web/public/evolution/assets"
CATALOG = ROOT / "creator-v1/shared/level-artifacts.json"

def main():
    catalog = json.loads(CATALOG.read_text())
    assert len(catalog) == 30
    assert [x["xp"] for x in catalog] == [75 * (n - 1) ** 2 for n in range(1, 31)]
    assert catalog[-1]["name"] == "ANEVUM" and catalog[-1]["xp"] == 63075
    baseline = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                for p in TARGET.iterdir() if p.is_file()}
    assert len(baseline) == 152, f"Unexpected native asset count {len(baseline)}"
    replacements = []
    for n in range(1, 31):
        name = f"level-{n:02}-compact-128.png"
        original = TARGET / name
        optical = SOURCE / f"level-{n:02}-128.webp"
        assert original.is_file() and optical.is_file()
        assert catalog[n - 1]["icon"] == "/evolution/assets/" + name
        with Image.open(optical) as file:
            specimen = file.convert("RGBA")
        assert specimen.size == (128, 128)
        assert specimen.getchannel("A").getbbox()
        assert all(specimen.getpixel(p)[3] == 0
                   for p in [(0, 0), (0, 127), (127, 0), (127, 127)])
        buffer = BytesIO()
        specimen.save(buffer, "PNG", optimize=True)
        data = buffer.getvalue()
        checksum = hashlib.sha256(data).hexdigest()
        assert checksum != baseline[name], f"Optical poster is identical: {name}"
        replacements.append((original, data, checksum))
    for path, data, _ in replacements:
        path.write_bytes(data)
    final = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
             for p in TARGET.iterdir() if p.is_file()}
    changed = sorted(name for name in baseline if baseline[name] != final[name])
    expected = sorted(f"level-{n:02}-compact-128.png" for n in range(1, 31))
    assert len(final) == 152 and changed == expected, changed
    report = {
        "session": "ANEVUM.WEB.PATCH.2026-10-17.012.OPTICAL-MINIATURE-POSTERS",
        "status": "build-tree-only",
        "replacementCount": 30,
        "unchangedOtherAssets": 122,
        "liveDeployment": False,
        "changed": changed,
        "hashes": {p.name: h for p, _, h in replacements},
    }
    outfile = ROOT / "design/evolution-v059/docs/V064-OPTICAL-ASSET-QA.json"
    outfile.write_text(json.dumps(report, indent=2))
    print("V064_OPTICAL_POSTER_CHECKS=PASS 30 changed / 122 unchanged")

if __name__ == "__main__":
    main()
