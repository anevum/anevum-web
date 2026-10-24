#!/usr/bin/env python3
"""ANEVUM / CONTINUANCE INSTITUTE original authored Blender world.
Offline CPU rendering. Run with:
 blender --background --python creator-v1/graphics/author-cinematic-institute-v136.py -- --out /tmp/anevum-cinema --quality preview --frames 8
Full source render: --quality master --frames 48 (expensive, intentionally NOT automatic).
The scene is an original high-detail architectural FIRST MASTER, not pixel-matched governing board output.
Never emits fake UI text, member identities or creator artwork.
"""
import argparse
import json
import math
import os
import random
import sys
from mathutils import Vector
import bpy

arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument("--out", required=True)
parser.add_argument("--quality", choices=["preview", "master"], default="preview")
parser.add_argument("--frames", type=int, default=8)
opts = parser.parse_args(arguments)
if not 4 <= opts.frames <= 180:
    parser.error("Frame count must be 4..180")
root = os.path.abspath(opts.out)
os.makedirs(root, exist_ok=True)
random.seed(136014)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras):
    for b in list(datablocks):
        if b.users == 0:
            datablocks.remove(b)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 12 if opts.quality == "preview" else 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 960 if opts.quality == "preview" else 3072
scene.render.resolution_y = 540 if opts.quality == "preview" else 1728
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = False
scene.render.filepath = root + "/"
scene.view_settings.view_transform = "AgX"
scene.render.film_transparent = False
world = bpy.data.worlds.new("The Continuance Void")
scene.world = world
world.use_nodes = True
world_bg = world.node_tree.nodes.get("Background")
world_bg.inputs["Color"].default_value = (0.002, 0.006, 0.022, 1)
world_bg.inputs["Strength"].default_value = 0.6

def material(name, color, metal=0.0, rough=0.48, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = tuple(color) + (1,)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = tuple(color) + (1,)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    if emission:
        if "Emission Color" in p.inputs:
            p.inputs["Emission Color"].default_value = tuple(emission) + (1,)
        if "Emission Strength" in p.inputs:
            p.inputs["Emission Strength"].default_value = strength
    return m

void_alloy = material("01 Machined titanium cobalt", (0.026, 0.061, 0.115), .82, .31)
lit_alloy = material("02 Brushed blue-silver", (0.24, 0.39, 0.52), .91, .19)
near_black = material("03 Obsidian carbon", (0.006, 0.014, 0.035), .45, .43)
auric = material("04 Antiqued auric trim", (0.39, 0.25, 0.11), .78, .28)
stone = material("05 Engineered blue basalt", (0.063, 0.095, 0.16), .14, .83)
cyan = material("06 Photonic cyan seams", (0.06, .32, .6), .2, .22, (.09, .72, 1), 3.4)
violet = material("07 Photon-violet alloy", (.21, .1, .42), .23, .25, (.34, .18, .86), 2.4)
teal = material("08 Signal-lattice teal", (.025, .25, .28), .18, .27, (.15, .7, .73), 2.1)
planet = material("09 Planet atmosphere", (.023, .08, .26), .12, .64, (.016, .09, .35), .4)
halo = material("10 Planet rim phosphor", (.015, .14, .49), .1, .22, (.1, .3, .7), 1.1)
star = material("11 Stellar light", (.74, .87, 1), 0, .2, (.4, .7, 1), 1.5)

def apply(obj, mat):
    obj.data.materials.append(mat)
    return obj

def bevel(obj, width=.03, segments=2):
    mod = obj.modifiers.new("machined bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    obj.modifiers.new("weighted corner normals", "WEIGHTED_NORMAL")
    return obj

def cube(name, location, scale, mat, edge=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply(obj, mat)
    if edge:
        bevel(obj, edge)
    return obj

def cylinder(name, loc, radius, depth, mat, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    apply(obj, mat)
    bevel(obj, .035, 2)
    return obj

def sphere(name, loc, radius, mat, segments=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    apply(obj, mat)
    bpy.ops.object.shade_smooth()
    return obj

def torus(name, loc, radius, minor, mat, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=72, minor_segments=8, location=loc, rotation=rotation,
                                     major_radius=radius, minor_radius=minor)
    obj = bpy.context.object
    obj.name = name
    apply(obj, mat)
    return obj

def beam(name, a, b, width, mat):
    midpoint = (Vector(a) + Vector(b)) / 2
    direction = Vector(b) - Vector(a)
    obj = cube(name, midpoint, (width, width, direction.length), mat, min(width/5, .035))
    obj.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
    return obj

def island(name, x, y, z, radius, height):
    cylinder(name + " / structural deck", (x,y,z), radius, height, stone, 12)
    cylinder(name + " / machined perimeter", (x,y,z+height*.49), radius*1.02, .085, lit_alloy, 12)
    torus(name + " / lower photonic halo", (x,y,z-height*.25), radius*.93, .047, cyan, (0,0,0))
    for j in range(12):
        a = 2*math.pi*j/12
        px,pz=x+math.cos(a)*radius*.82,y+math.sin(a)*radius*.82
        beam(name+" / underbody fin", (px,pz,z-height*.4), (x,y,z-height*1.5), .12, void_alloy)

def observatory(name, x, y, z, radius, stories, tone=cyan):
    cylinder(name+" / foundation", (x,y,z), radius*1.4,.3,stone,16)
    for s in range(stories):
        floor=z+.28+s*.9
        cylinder(name+" / ring "+str(s), (x,y,floor), radius, .15,lit_alloy,16)
        cylinder(name+" / interior "+str(s), (x,y,floor+.41),radius*.83,.72,near_black,16)
        torus(name+" / window band "+str(s),(x,y,floor+.63),radius*.94,.023,tone)
        for j in range(12):
            a=2*math.pi*j/12
            px=x+math.cos(a)*radius*.98;py=y+math.sin(a)*radius*.98
            beam(name+" / buttress", (px,py,floor), (px,py,floor+.78), .085,void_alloy)
    peak=z+.28+stories*.9
    cylinder(name+" / observatory crown",(x,y,peak),radius*.69,.42,auric,12)
    for j in range(8):
        a=2*math.pi*j/8
        beam(name+" / spire", (x+math.cos(a)*radius*.68,y+math.sin(a)*radius*.68,peak),
             (x,y,peak+1.75), .065,lit_alloy)
    sphere(name+" / beacon",(x,y,peak+1.68),.16,tone,16,8)

# Wide floating citadel set, all in a common source coordinate system.
island("Primary transit nave", 0, 0, .15, 6.2, 1.15)
for x,y,r,h in [(-9,-3,3.1,1.1),(9,-2.2,3.2,1.2),(-8,6,2.4,.9),(7.3,6.6,2.65,1.0)]:
    island("Suspended platform %+.1f,%+.1f"%(x,y),x,y,h,r,.8)
observatory("Continuance core", 0,.5,1.1, 2.25,5,cyan)
for i,(x,y,h) in enumerate([(-9,-3,1.6),(9,-2.2,1.5),(-8,6,1.25),(7.3,6.6,1.4)]):
    observatory("External outpost "+str(i),x,y,h, .9+i*.08,3+(i%2),teal if i%2 else violet)

for idx,(a,b) in enumerate([
 ((-5.2,-.9,.8),(-7,-2.6,1.1)),((5.2,-.8,.8),(7.1,-2.2,1.1)),
 ((-4.5,3,.9),(-6.7,5.5,1.1)),((4.5,3.2,.9),(6.1,6,1.2))
]):
    beam("Suspended transit bridge %d"%idx,a,b,.33,lit_alloy)
    for side in (-1,1):
        beam("Guide edge", (a[0],a[1]+side*.31,a[2]+.05),(b[0],b[1]+side*.31,b[2]+.05),.038,cyan)
# The Institute orbital observation device above the central cathedral.
sphere("Central reactor celestial pearl",(0,.5,9.3),1.48,planet,48,24)
for i in range(4):
    rotation=(i*.44,math.pi*(i+1)/7, .18+i*.63)
    torus("Armillary structural orbit "+str(i),(0,.5,9.3),2.2+.26*i,.10,lit_alloy,rotation)
    torus("Armillary photonic edge "+str(i),(0,.5,9.3),2.33+.26*i,.027,cyan if i%2 else violet,rotation)
for i in range(12):
    a=2*math.pi*i/12
    x,y=math.cos(a)*4.9,math.sin(a)*4.9
    beam("Cradle aperture brace",(x,y,4.2),(x*.64,y*.64,8.55),.16,void_alloy)
    sphere("Cradle signal bead",(x,y,4.2),.08,cyan,12,6)
# A vast distant moon and atmospheric ring behind the architecture.
sphere("Transcosmic horizon planet",(27,28,22),18,planet,64,32)
torus("Planetary illuminated orbital axis",(27,28,22),19.1,.19,halo,(.35,.2,.8))
torus("Planetary far-field ring",(27,28,22),22.5,.12,violet,(.35,.2,.8))
# Atmospheric structures: distant archways, hidden bridges and dense strata.
for i in range(17):
    angle=2*math.pi*i/17
    r=18+random.random()*12
    x,y=math.cos(angle)*r,math.sin(angle)*r
    z=-2.2+random.random()*2
    radius=.45+random.random()*.65
    cylinder("Far citadel pier", (x,y,z),radius,.6,stone,8)
    cylinder("Far citadel needle", (x,y,z+2.4),radius*.38,5,void_alloy,8)
    torus("Far citadel beacon ring",(x,y,z+4.9),radius*.8,.035,teal)
for i in range(55):
    x=random.uniform(-40,40)
    y=random.uniform(-30,45)
    z=random.uniform(7,31)
    sphere("Aether dust luminous node", (x,y,z),random.uniform(.018,.063),star,8,4)

# Material lights (baked by Cycles; not fake user activity).
def light(name, kind, pos, energy, color, size=6):
    data = bpy.data.lights.new(name,kind)
    data.energy=energy
    data.color=color
    if kind=="AREA":data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location=pos
    return obj
light("Dawn / cold star", "AREA", (3,-20,30), 3000, (.32,.69,1),18)
light("Auric horizon", "AREA",(-15,20,8),1900,(1,.49,.22),18)
light("Violet rim", "AREA",(8,9,21),2400,(.45,.27,1),14)
light("Atrium central soft fill", "POINT",(1,0,8),2200,(.38,.85,1))
# Composition deliberately reserves negative space for real DOM copy on the left.
cam_data=bpy.data.cameras.new("CINEMA_CAMERA_ARRIVAL_014")
cam=bpy.data.objects.new("CINEMA_CAMERA_ARRIVAL_014",cam_data)
bpy.context.collection.objects.link(cam)
scene.camera=cam
cam.data.lens=38
cam.data.sensor_width=36
target=Vector((1.25,7.0,3.5))
def pose(frame,location,look_at):
    scene.frame_set(frame)
    cam.location=Vector(location)
    direction=Vector(look_at)-cam.location
    cam.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
    cam.keyframe_insert(data_path="location",frame=frame)
    cam.keyframe_insert(data_path="rotation_euler",frame=frame)
pose(1, (23,-32,15.4),target)
pose(opts.frames,(15.8,-24.8,12.0),(1.4,6.5,4.2))
scene.frame_start=1
scene.frame_end=opts.frames
def camera_state(frame):
    scene.frame_set(frame)
    return {"position":list(round(v,6) for v in cam.location),
            "rotation_euler":list(round(v,6) for v in cam.rotation_euler),
            "lens_mm":cam.data.lens,
            "vertical_fov_radians":round(cam.data.angle_y,6),
            "horizontal_fov_radians":round(cam.data.angle_x,6)}
camera_manifest={
    "schema":"anevum.cinematic.camera.v1",
    "world":"Continuance Institute Atrium first master",
    "cameraId":"atrium-cinema-014-source-v1",
    "blenderVersion":bpy.app.version_string,
    "renderEngine":scene.render.engine,
    "quality":opts.quality,
    "nativeWidth":scene.render.resolution_x,
    "nativeHeight":scene.render.resolution_y,
    "frames":opts.frames,
    "start":camera_state(1),
    "end":camera_state(opts.frames),
    "handoffStatus":"UNREGISTERED / NOT A SEAMLESS THREE.JS CAMERA MATCH",
    "contentClaims":"Atmospheric original environment only; no real member or publication data",
}
with open(os.path.join(root,"camera-manifest.json"),"w",encoding="utf8") as f:
    json.dump(camera_manifest,f,indent=2)
for i in range(1,opts.frames+1):
    scene.frame_set(i)
    scene.render.filepath=os.path.join(root,"frame-%04d.png"%i)
    bpy.ops.render.render(write_still=True)
print(json.dumps({"status":"ORIGINAL_CINEMATIC_RENDER_COMPLETE_UNREVIEWED", "output":root,
                  "camera":camera_manifest["cameraId"],"frames":opts.frames,
                  "nativeResolution":[scene.render.resolution_x,scene.render.resolution_y]}))
