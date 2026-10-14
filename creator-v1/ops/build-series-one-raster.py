#!/usr/bin/env python3
"""ANEVUM Series One: render 60 original raster masters into WebP derivatives.

Default mode validates source/identity contracts only. --render requires ALL
sixty rights-cleared, 2048x2048 transparent PNG masters to exist first. It never
synthesizes filler art or claims an achievement has been earned.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "art" / "relic-series-one-production.json"
MASTERS = ROOT / "art" / "masters" / "series-01"
OUTPUT = ROOT / "web" / "public" / "assets" / "artifacts" / "series-01"
GENERATED = ROOT / "web" / "src" / "lib" / "relic-raster-assets.ts"
SIZES = (96, 192, 384, 768)

def contract():
    data = json.loads(CONFIG.read_text(encoding="utf-8"))
    specs = data["specs"]
    if data["schema"] != "anevum.relic-art-direction.v1":
        raise ValueError("Unsupported ANEVUM artifact manifest")
    if data["artSeries"] != 1 or data["requiredMasters"] != 60 or len(specs) != 60:
        raise ValueError("Expected exactly sixty named Series One artifacts")
    canonical = (ROOT / "auth" / "community.mjs").read_text(encoding="utf-8")
    match = re.search(r"const relics=\[([\s\S]*?)\];", canonical)
    if not match:
        raise ValueError("Authoritative relic sequence not found")
    names = re.findall(r"'([^']+)'", match.group(1))
    if len(names) != 60:
        raise ValueError("Authoritative server artifact series changed")
    seen_subjects, seen_keys = set(), set()
    for level, (item, name) in enumerate(zip(specs, names), 1):
        if item["level"] != level or item["name"] != name:
            raise ValueError("Manifest and server disagree at level " + str(level))
        if item["assetRole"] != "presentation-only":
            raise ValueError("Raster art cannot grant authority or XP")
        key = item["renderKey"]
        if not re.fullmatch(r"series-01/[0-9]{2}-[a-z0-9-]+", key):
            raise ValueError("Unapproved or unsafe raster key")
        if key in seen_keys or item["visualSubject"] in seen_subjects:
            raise ValueError("Duplicate relic rendering identity")
        if len(item["visualSubject"]) < 38 or len(item["materials"]) < 18:
            raise ValueError("An art direction lacks sufficient specificity")
        seen_keys.add(key)
        seen_subjects.add(item["visualSubject"])
    print("ANEVUM_RELIC_MANIFEST=PASS count=60 server-authoritative=YES unique-silhouettes=60")
    return specs

def render(specs):
    try:
        from PIL import Image
    except ImportError as e:
        raise RuntimeError("Install Pillow for approved raster generation: python -m pip install Pillow") from e
    masters = []
    fingerprints = set()
    # Validate EVERY master before writing any derivative to the output tree.
    for item in specs:
        stem = item["renderKey"].split("/", 1)[1]
        source = MASTERS / (stem + ".png")
        if not source.is_file():
            raise ValueError("Missing approved master for " + item["name"] + ": " + str(source))
        if source.stat().st_size > 18_000_000:
            raise ValueError("Master image exceeds 18 MB: " + stem)
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if digest in fingerprints:
            raise ValueError("Duplicate artwork file: " + item["name"])
        fingerprints.add(digest)
        with Image.open(source) as im:
            if im.size != (2048, 2048) or im.mode not in ("RGBA", "LA"):
                raise ValueError("Master must be 2048x2048 with actual alpha: " + stem)
            box = im.getchannel("A").getbbox()
            if box is None:
                raise ValueError("Master is fully transparent: " + stem)
            if im.getpixel((0,0))[-1] != 0:
                raise ValueError("Master corners require transparent stage: " + stem)
            if box[0] < 35 or box[1] < 35 or box[2] > 2013 or box[3] > 2013:
                raise ValueError("Master lacks safe transparent margin: " + stem)
        masters.append((item, source, digest))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    assets = []
    for item, source, digest in masters:
        stem = item["renderKey"].split("/",1)[1]
        with Image.open(source) as original:
            im = original.convert("RGBA")
            for size in SIZES:
                thumb = im.resize((size,size), Image.Resampling.LANCZOS)
                output = OUTPUT / (stem + "-" + str(size) + ".webp")
                thumb.save(output, format="WEBP", quality=94, method=6, exact=True)
        assets.append({
            "level":item["level"],"name":item["name"],"stem":stem,"masterSha256":digest
        })
    # This generated TypeScript file is reviewed as source, never mutated during
    # normal CI, and only lists art masters actually present and verified.
    content = ('/** Approved original ANEVUM artifact raster renders (presentation only). */\n'
               'export const relicRasterAssets: Record<number,{name:string;stem:string}> = '
               + json.dumps({str(x["level"]):{"name":x["name"],"stem":x["stem"]} for x in assets},separators=(",",":"))
               + ';\n')
    GENERATED.write_text(content, encoding="utf-8")
    (OUTPUT / "master-provenance.json").write_text(json.dumps(assets, indent=2)+"\n",encoding="utf-8")
    print("ANEVUM_RELIC_RENDER=PASS assets=60 derivatives=240 verified-raster-masters=60")
    print("Manual visual acceptance and code review are REQUIRED before shipping.")

if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--render",action="store_true",help="Requires 60 approved original PNG masters")
    args=p.parse_args()
    try:
        specs=contract()
        if args.render:
            render(specs)
        else:
            print("ANEVUM_RELIC_ART_GATE=BLOCKED until 60 raster masters are supplied, reviewed and --render passes.")
    except Exception as error:
        print("ANEVUM_RELIC_ART=FAIL",str(error),file=sys.stderr)
        sys.exit(1)
