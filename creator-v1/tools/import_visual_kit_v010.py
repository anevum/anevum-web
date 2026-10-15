#!/usr/bin/env python3
"""Install verified optional V004 ANEVUM art into Creator V1, never the live site.

Usage:
  python creator-v1/tools/import_visual_kit_v010.py \
    /path/to/ANEVUM-Dashboard-V004-Verified-Individual-Files.zip

The source package is a reviewed procedural *supplement*, NOT approval to replace
existing high-fidelity cinematic masters. Only selected decorative files are copied.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile
import argparse

EXPECTED_ZIP_SHA256 = "8d49b528c9b69242ea38aed759bcd15c6a15c7a1ddb6a731042715dff014103b"
PACKAGE_DIR = "ANEVUM.WEB.BUILD.2026-10-14.004.SITEWIDE-DASHBOARD-INTEGRATION"
SELECTED = (
    "backgrounds/hero-atmosphere.webp",
    "backgrounds/explore-atmosphere.webp",
    "backgrounds/community-atmosphere.webp",
    "backgrounds/create-atmosphere.webp",
    "backgrounds/people-atmosphere.webp",
    "backgrounds/notes-atmosphere.webp",
    "category-covers/games-cover.webp",
    "category-covers/apps-cover.webp",
    "category-covers/creative-cover.webp",
    "category-covers/automation-cover.webp",
    "category-covers/learning-cover.webp",
    "category-covers/libraries-cover.webp",
    "category-covers/research-cover.webp",
    "category-covers/other-cover.webp",
    "textures/subtle-grain-alpha.png",
    "textures/stars-alpha.png",
    "textures/scanlines-alpha.png",
    "ornaments/hero-orbit-trails.svg",
    "ornaments/card-light-edge.svg",
    "ornaments/divider-celestial.svg",
    "ornaments/notification-glint.svg",
    "ornaments/profile-ring.svg",
    "ornaments/sidebar-active-rail.svg",
    "ornaments/upload-frame.svg",
    "effects/horizon-haze-1600x900.webp",
    "effects/ambient-stars-1920x1080.png",
    "effects/glow-violet-768.png",
    "effects/glow-coral-768.png",
)
def sha256(data:bytes)->str:
    return hashlib.sha256(data).hexdigest()

def install(package:Path,destination:Path):
    data=package.read_bytes()
    actual=sha256(data)
    if actual!=EXPECTED_ZIP_SHA256:
        raise ValueError("Visual package fingerprint mismatch; refusing unknown media: "+actual)
    destination.mkdir(parents=True,exist_ok=True)
    assets=[]
    with ZipFile(package) as zip_file:
        manifest=json.loads(zip_file.read(PACKAGE_DIR+"/MANIFEST.json"))
        checksums=manifest["files"]
        for relative in SELECTED:
            if relative.startswith("/") or ".." in Path(relative).parts:
                raise ValueError("Invalid relative asset path")
            key="assets-optional/"+relative
            payload=zip_file.read(PACKAGE_DIR+"/"+key)
            meta=checksums.get(key)
            if not meta or meta["sha256"]!=sha256(payload) or meta["bytes"]!=len(payload):
                raise ValueError("Unverified visual media: "+relative)
            target=destination/relative
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(payload)
            assets.append(relative)
    stamp={
        "version":"V010","status":"MOUNTED",
        "source":"ANEVUM-Dashboard-V004-Verified-Individual-Files.zip",
        "source_sha256":actual,
        "source_kind":"verified-optional-procedural-decoration",
        "primary_cinematic_masters_replaced":False,
        "synthetic_community_content":False,
        "assets":assets,
    }
    (destination/"manifest.json").write_text(json.dumps(stamp,indent=2)+"\n")
    print(f"ANEVUM V010 asset mount: {len(assets)} verified files -> {destination}")
    return stamp

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("package",type=Path)
    parser.add_argument("--destination",type=Path,
        default=Path(__file__).resolve().parents[1]/"web/public/assets/anevum-kit")
    options=parser.parse_args()
    install(options.package,options.destination)
