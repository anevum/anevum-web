from __future__ import annotations

import json
import math
import struct
import zlib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public"
OUT.mkdir(parents=True, exist_ok=True)

THEMES = [
    ("jan","Deep Winter",(157,201,232),(217,239,255),(2,7,12)),
    ("feb","Ember",(207,141,145),(240,192,196),(7,5,9)),
    ("mar","Spring Signal",(136,197,163),(200,236,215),(3,9,10)),
    ("apr","Rainlight",(143,183,216),(209,230,247),(3,8,13)),
    ("may","Verdant",(121,189,141),(188,226,198),(3,9,8)),
    ("jun","Solstice",(213,181,111),(240,217,159),(8,8,4)),
    ("jul","Midnight Fire",(185,146,216),(223,200,243),(5,5,10)),
    ("aug","Heat Haze",(208,140,104),(237,185,157),(8,6,4)),
    ("sep","Harvest Shift",(196,154,104),(231,195,155),(7,6,4)),
    ("oct","Spooky Systems",(219,135,63),(255,194,127),(8,5,4)),
    ("nov","Cold Ember",(180,119,88),(215,170,143),(6,5,4)),
    ("dec","Long Night",(127,179,190),(200,231,235),(2,7,8)),
]

now = datetime.now(timezone.utc)
idx = now.month - 1
if now.year == 2026 and now.month == 9 and now.day >= 28:
    idx = 9
key,label,accent,bright,bg = THEMES[idx]

W=H=512
px=bytearray(W*H*4)

def put(x,y,c,a=255):
    if 0 <= x < W and 0 <= y < H:
        i=(y*W+x)*4
        px[i:i+4]=bytes((*c,a))

def blend(x,y,c,a):
    if not (0 <= x < W and 0 <= y < H): return
    i=(y*W+x)*4
    alpha=a/255.0
    for k in range(3):
        px[i+k]=int(px[i+k]*(1-alpha)+c[k]*alpha)
    px[i+3]=255

def circle(cx,cy,r,c,a=255,stroke=0):
    r2=r*r
    inner=(r-stroke)*(r-stroke) if stroke else -1
    for y in range(max(0,cy-r-1),min(H,cy+r+2)):
        dy=y-cy
        for x in range(max(0,cx-r-1),min(W,cx+r+2)):
            d=(x-cx)*(x-cx)+dy*dy
            if d<=r2 and (stroke==0 or d>=inner):
                blend(x,y,c,a)

def ellipse(cx,cy,rx,ry,c,a=255):
    for y in range(max(0,cy-ry-1),min(H,cy+ry+2)):
        for x in range(max(0,cx-rx-1),min(W,cx+rx+2)):
            if ((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1:
                blend(x,y,c,a)

def line(x0,y0,x1,y1,c,a=255,w=1):
    dx=x1-x0; dy=y1-y0
    steps=max(abs(dx),abs(dy),1)
    for n in range(steps+1):
        x=round(x0+dx*n/steps); y=round(y0+dy*n/steps)
        circle(x,y,w,c,a)

for y in range(H):
    for x in range(W):
        d=math.hypot(x-W/2,y-H/2)/(W*.72)
        lift=max(0,1-d)
        c=tuple(min(255,int(bg[k]+accent[k]*0.07*lift)) for k in range(3))
        put(x,y,c,255)

# ambient glow and orbital identity
for r,a in ((184,36),(152,58),(118,38)):
    circle(256,256,r,accent,a,2)
for angle in range(0,360,30):
    rad=math.radians(angle)
    x=int(256+152*math.cos(rad)); y=int(256+152*math.sin(rad))
    circle(x,y,3,bright,92)

circle(256,256,104,(12,10,10),235)
circle(256,256,92,accent,42)
circle(256,256,74,bg,255)

if key == "oct":
    ellipse(256,259,61,52,accent,238)
    ellipse(238,251,18,11,(31,12,4),255)
    ellipse(274,251,18,11,(31,12,4),255)
    line(256,220,256,205,(77,85,44),255,4)
    line(255,205,266,198,(77,85,44),180,2)
    # jagged grin
    pts=[(226,278),(238,286),(248,280),(258,288),(269,280),(281,286),(288,277)]
    for a0,b0 in zip(pts,pts[1:]): line(a0[0],a0[1],b0[0],b0[1],(39,14,5),255,3)
    circle(256,256,92,bright,48,2)
else:
    circle(256,256,54,accent,205)
    circle(256,256,38,bg,255)
    circle(256,256,10,bright,230)
    line(256,202,256,310,bright,120,2)
    line(202,256,310,256,accent,90,1)

# four sparse circuit ticks
for angle in (45,135,225,315):
    rad=math.radians(angle)
    x0=int(256+116*math.cos(rad)); y0=int(256+116*math.sin(rad))
    x1=int(256+134*math.cos(rad)); y1=int(256+134*math.sin(rad))
    line(x0,y0,x1,y1,bright,128,2)

def chunk(kind,data):
    return struct.pack(">I",len(data))+kind+data+struct.pack(">I",zlib.crc32(kind+data)&0xffffffff)

raw=bytearray()
stride=W*4
for y in range(H):
    raw.append(0)
    raw.extend(px[y*stride:(y+1)*stride])

png=b"\x89PNG\r\n\x1a\n"
png+=chunk(b"IHDR",struct.pack(">IIBBBBB",W,H,8,6,0,0,0))
png+=chunk(b"IDAT",zlib.compress(bytes(raw),9))
png+=chunk(b"IEND",b"")

(OUT/"iren-profile-current.png").write_bytes(png)
(OUT/"iren-profile-current.json").write_text(json.dumps({
    "theme":key,
    "label":label,
    "generated_at":now.isoformat(),
    "download_path":"/iren-profile-current.png",
    "upload_note":"Generated automatically with the monthly ANEVUM theme. Slack profile upload remains manual."
},indent=2)+"\n",encoding="utf-8")
print(f"Generated IREN seasonal avatar: {key} / {label}")
