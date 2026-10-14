#!/usr/bin/env python3
"""ANEVUM cinematic source-art export gate.

Accepts an approved, CLEAN environment master and renders 1x/2x responsive
raster variants. Never enlarges pixels and never rasterizes interactive UI.
This script does NOT synthesize detail missing from a low-resolution source.

python creator-v1/artwork/export_world_art.py \
  --master /path/to/approved/portal-desktop.png --role hero-desktop \
  --name portal-desktop --out creator-v1/web/public/assets/cinematic-v2/world
"""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from pathlib import Path
from PIL import Image, ImageOps, features

PRESETS = {
    "hero-desktop": (3840, 1600, [1600, 2560, 3840]),
    "hero-mobile": (1440, 2560, [720, 1080, 1440]),
    "gateway": (1800, 1050, [400, 800, 1200, 1800]),
    "project-cover": (1800, 1050, [400, 800, 1200, 1800]),
    "artifact": (1024, 1024, [64, 128, 256, 512, 1024]),
}


def export(master:Path, role:str, name:str, out:Path, avif:bool) -> list[dict]:
    if role not in PRESETS:
        raise ValueError(f"Unsupported role: {role}")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
        raise ValueError("Asset name must use lowercase-kebab-case")
    if master.resolve() == (out/name).resolve():
        raise ValueError("Cannot overwrite an original master")
    minw,minh,widths=PRESETS[role]
    with Image.open(master) as original:
        original.load()
        if original.width < minw or original.height < minh:
            raise ValueError(
                f"Insufficient source detail for {role}: {original.width}x{original.height}; "
                f"requires at least {minw}x{minh}. No automated upscaling permitted."
            )
        source=ImageOps.exif_transpose(original)
        has_alpha = "A" in source.getbands() or "transparency" in source.info
        source=source.convert("RGBA" if has_alpha else "RGB")
        out.mkdir(parents=True,exist_ok=True)
        variants=[]
        for width in widths:
            # Never increase either dimension. Preserve aspect ratio and avoid
            # synthetic blank bars; separate responsive hero artwork is required.
            height=round(source.height*width/source.width)
            if width>source.width or height>source.height:
                raise ValueError("Cannot upscale a source master")
            img=source if width==source.width else source.resize((width,height),Image.Resampling.LANCZOS)
            targets=[("webp",88)]
            if avif:
                if not features.check("avif"):
                    raise RuntimeError("Pillow AVIF encoder unavailable: rerun without --avif")
                targets.append(("avif",72))
            for ext,quality in targets:
                dest=out/f"{name}-{width}.{ext}"
                args={"format":ext.upper(),"quality":quality}
                if ext=="webp": args["method"]=4
                if ext=="avif": args["speed"]=6
                img.save(dest,**args)
                digest=hashlib.sha256(dest.read_bytes()).hexdigest()
                variants.append({"file":dest.name,"width":width,"height":height,
                                "sha256":digest,"bytes":dest.stat().st_size,
                                "format":ext,"alpha":has_alpha})
    manifest={"name":name,"role":role,"approved_master":master.name,
              "master_width":source.width,"master_height":source.height,
              "status":"CANDIDATE_UNTIL_OWNER_VISUAL_ACCEPTANCE",
              "variants":variants}
    (out/f"{name}.json").write_text(json.dumps(manifest,indent=2)+"\n")
    return variants


def main()->int:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--master",type=Path,required=True)
    p.add_argument("--role",choices=sorted(PRESETS),required=True)
    p.add_argument("--name",required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--avif",action="store_true",help="Also produce AVIF if encoder exists")
    args=p.parse_args()
    if not args.master.is_file():p.error("Approved source master not found")
    try: variants=export(args.master,args.role,args.name,args.out,args.avif)
    except (ValueError,RuntimeError) as exc:
        print(f"ART_PIPELINE_REJECTED: {exc}",file=sys.stderr)
        return 2
    print(json.dumps({"asset":args.name,"outputs":variants},indent=2))
    return 0


if __name__=="__main__":raise SystemExit(main())