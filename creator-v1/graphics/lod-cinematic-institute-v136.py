#!/usr/bin/env python3
"""PARITY V136.016 camera-compatible, original-scene LOD exports.
Runs OFFLINE on the V136.015 Blender source. Never replaces live v136-011 assets.
  blender --background --python creator-v1/graphics/lod-cinematic-institute-v136.py \
    -- --blend INPUT.blend --camera-manifest INPUT/camera-manifest.json --out DIR
The original saved source is not modified. Every exported model uses identical
Blender world coordinates and Blender's native glTF Y-up conversion.
"""
import argparse
import hashlib
import json
import os
import sys
import bpy

args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
p=argparse.ArgumentParser()
p.add_argument("--blend",required=True)
p.add_argument("--camera-manifest",required=True)
p.add_argument("--out",required=True)
o=p.parse_args(args)
source=os.path.realpath(o.blend)
out=os.path.realpath(o.out)
if not os.path.isfile(source) or not os.path.isfile(o.camera_manifest):
    p.error("Missing original editable Blender source or camera manifest")
if os.path.commonpath([source,out]) == source:
    p.error("Output must be separate from input")
os.makedirs(out,exist_ok=True)
with open(o.camera_manifest,encoding="utf8") as f: camera=json.load(f)
assert camera["schema"]=="anevum.cinematic.camera.v1"
assert camera["coordinateSystem"]=="Blender-Z-up-to-glTF-Y-up"
assert camera["geometryExport"]["approvedForRuntime"] is False
assert camera["worldRevision"]=="continuance-atrium-source-v136015-001"

def digest(path):
    d=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            d.update(chunk)
    return d.hexdigest()

source_digest=digest(source)
records={}
for tier in ("desktop","mobile"):
    # Reopen the original packed source for every LOD. Modifiers and joins
    # CANNOT alter the canonical .blend, source geometry or camera metadata.
    bpy.ops.wm.open_mainfile(filepath=source)
    allowed=[]
    culled=0
    for obj in list(bpy.data.objects):
        if obj.type!="MESH":
            continue
        name=obj.name
        if name.startswith("CINEMA / APPROVED") or name.startswith("Aether dust luminous node"):
            culled+=1
            continue
        mobile_drop=(tier=="mobile" and (
            name.startswith("Far citadel")
            or "fractured suspended stone" in name
            or "underbody fin" in name
            or "distal light halo" in name
            or "Cradle signal bead" in name
            or " / window band " in name and name.endswith((".001",".003",".005",".007",".009",".011"))
        ))
        if mobile_drop:
            culled+=1
            continue
        allowed.append(obj)
    assert len(allowed)>=120,"LOD unexpectedly deleted all original architecture"
    bpy.ops.object.select_all(action='DESELECT')
    # A few authoring objects are parented in the scene; world transforms must
    # remain equivalent to the cinematic source after joining.
    for obj in allowed:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=allowed[0]
    # Capture material-granular geometry and build a scene from joined originals.
    material_groups={}
    for obj in allowed:
        signature=tuple(mat.name if mat else "" for mat in obj.data.materials)
        key="|".join(signature)
        material_groups.setdefault(key,[]).append(obj)
    joined=[]
    # Keep Meshopt decode buffers below the existing CSP-safe reference worker's
    # 1 MiB per-accessor ceiling. Material grouping limits real GPU draw calls.
    max_per_batch=32 if tier=="desktop" else 36
    for key,members in material_groups.items():
        for start in range(0,len(members),max_per_batch):
            batch=members[start:start+max_per_batch]
            bpy.ops.object.select_all(action='DESELECT')
            for obj in batch:
                obj.select_set(True)
            bpy.context.view_layer.objects.active=batch[0]
            if len(batch)>1:
                bpy.ops.object.join()
            result=bpy.context.view_layer.objects.active
            result.name="LODV136_"+tier+"_"+hashlib.sha256((key+str(start)).encode()).hexdigest()[:10]
            joined.append(result)
    # Only the merged architectural geometry is included; no camera, matte,
    # fake UI, creator content or uploaded external texture references.
    bpy.ops.object.select_all(action='DESELECT')
    for obj in joined:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=joined[0]
    file="institute-atrium-"+tier+"-source.glb"
    target=os.path.join(out,file)
    bpy.ops.export_scene.gltf(filepath=target,export_format="GLB",use_selection=True,
        export_cameras=False,export_lights=False)
    assert os.path.getsize(target)>25000,"Unexpected empty staged 3D export"
    records[tier]={
        "file":file,"bytes":os.path.getsize(target),"sha256":digest(target),
        "originalObjectCount":len(allowed),
        "joinedMeshCount":len(joined),
        "culledObjectCount":culled,
        "materialGroupCount":len(material_groups),
        "status":"UNREVIEWED_SOURCE_GEOMETRY"
    }
    print(tier,records[tier])
report={
    "schema":"anevum.cinematic.lod-source.v1",
    "sourceWorldRevision":camera["worldRevision"],
    "cameraId":camera["cameraId"],
    "sourceBlendSha256":source_digest,
    "reviewGeometrySha256":camera["geometryExport"]["sha256"],
    "models":records,
    "optimized":False,
    "approvedForProduction":False,
    "cameraMatchedToOldAtrium":False,
    "visualQAPassed":False
}
with open(os.path.join(out,"lod-source-manifest.json"),"w",encoding="utf8") as f:
    json.dump(report,f,indent=2)
print(json.dumps({"status":"LODS_EXPORTED_FOR_REVIEW_ONLY","models":records},indent=2))
