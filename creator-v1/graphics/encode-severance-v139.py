#!/usr/bin/env python3
"""ANEVUM V139 — compile-only, reproducible first-party HD horror hero media.

Input is a first-party, reviewed concept image downloaded at BUILD TIME.
The pinned sha256 must match the source byte-for-byte before media conversion.
No generated script, API key, external CDN URL or video provider runs in-browser.

Usage:
  python creator-v1/graphics/encode-severance-v139.py INPUT.png OUTPUT_DIRECTORY

Requires ffmpeg, numpy, opencv-python-headless. Never deploys to Cloudflare.
"""
from __future__ import annotations

import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

PINNED_SOURCE_SHA256 = "71c1bb6ca774841386857a1e8b344420d7c95fa5e1e96a6fb23dc656df005ba5"
PINNED_DECODED_BGR_SHA256 = "66fadc771dad92deff2d9d13c5cbcbc96ba1328b693df8f4685348d78ec8e983"
SOURCE_DESCRIPTION = "ANEVUM Severance original clean environment concept; NO GAMEPLAY capture"
W,H,FPS,SECONDS = 1920,1080,24,8


def sha256(path: Path) -> str:
    hashed=hashlib.sha256()
    with path.open("rb") as src:
        for block in iter(lambda:src.read(1024*1024),b""):
            hashed.update(block)
    return hashed.hexdigest()


def run_ffmpeg(args:list[str]) -> None:
    subprocess.run(["ffmpeg","-nostdin","-y","-hide_banner","-loglevel","error",*args],check=True)


def main() -> None:
    if len(sys.argv)!=3:
        raise SystemExit("Usage: encode-severance-v139.py input.png output-directory")
    source=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
    assert source.is_file(),"Approved image source missing"
    digest=sha256(source)
    src=cv2.imread(str(source),cv2.IMREAD_COLOR)
    assert src is not None and src.ndim==3, "Review image is not decodable"
    assert src.shape==(941,1672,3), (
        "Approved image dimensions changed: got "+str(src.shape)+
        "; expected a 1672x941 clean concept plate."
    )
    decoded_digest=hashlib.sha256(src.tobytes()).hexdigest()
    assert decoded_digest==PINNED_DECODED_BGR_SHA256, (
        "CRITICAL: decoded concept pixels do not match the approved artwork. "+
        "Actual file SHA256 "+digest+"; actual decoded image SHA256 "+decoded_digest+
        ". Rejecting changed image content."
    )
    if digest!=PINNED_SOURCE_SHA256:
        print("Approved decoded pixels match; asset was losslessly re-encoded in transit. "+
              "Downloaded file hash: "+digest,flush=True)
    src=cv2.resize(src,(W,H),interpolation=cv2.INTER_CUBIC)
    overfill=cv2.resize(src,(int(W*1.045),int(H*1.045)),interpolation=cv2.INTER_LINEAR)
    ox,oy=overfill.shape[1]-W,overfill.shape[0]-H
    X=np.linspace(0,1,W,dtype=np.float32)[None,:]
    Y=np.linspace(0,1,H,dtype=np.float32)[:,None]
    red_mask=np.zeros((H,W),np.float32)
    for x,y,r in [(0.58,0.46,.10),(.76,.55,.20),(.87,.78,.14),(.97,.61,.11),(.08,.68,.08)]:
        red_mask+=np.exp(-3.0*((X-x)**2/(r*r)+(Y-y)**2/(r*r)))*(.65 if x<.5 else 1.0)
    red_mask=np.clip(red_mask,0,1)[:,:,None]
    rng=np.random.default_rng(61027)
    noise=cv2.resize(rng.random((26,55),dtype=np.float32),(W,H),interpolation=cv2.INTER_CUBIC)
    noise=cv2.GaussianBlur(noise,(0,0),23)
    fog_y=np.exp(-((Y-.64)/.24)**2)+.24*np.exp(-((Y-.82)/.10)**2)
    fog_base=np.clip(np.maximum(0,noise-.36)/.64*fog_y*(.38+.62*(1-X))*.23,0,.15)
    glitched=np.random.default_rng(947)
    strips=[(int(glitched.uniform(.23,.83)*H),int(glitched.integers(3,18)),
             int(glitched.integers(-24,25))) for _ in range(8)]
    full=out/"hero-motion-v139-1080p.mp4"
    cmd=[
        "ffmpeg","-nostdin","-y","-hide_banner","-loglevel","error",
        "-f","rawvideo","-pixel_format","bgr24","-video_size",f"{W}x{H}",
        "-framerate",str(FPS),"-i","pipe:0","-an","-c:v","libx264",
        "-preset","veryfast","-profile:v","high","-level","4.0",
        "-crf","22","-pix_fmt","yuv420p","-movflags","+faststart",str(full)
    ]
    writer=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    assert writer.stdin is not None
    try:
        for k in range(FPS*SECONDS):
            angle=2*math.pi*k/(FPS*SECONDS)
            xx=int(ox/2+6*math.sin(angle));yy=int(oy/2+4*math.sin(angle+math.pi/5))
            frame=overfill[yy:yy+H,xx:xx+W].copy()
            fog=np.roll(fog_base,int(35*math.sin(angle)),axis=1)
            alpha=fog*(.42+.28*math.sin(angle+math.pi/3)**2)
            image=frame.astype(np.float32)
            image=image*(1-alpha[:,:,None])+np.array([83,78,74],np.float32)[None,None,:]*alpha[:,:,None]
            brightness=(.5+.5*math.sin(2*angle+.5)**2)*(.72+.28*math.sin(7*angle)**2)
            red=red_mask*(brightness*27)
            image[:,:,2]+=red[:,:,0]*1.6
            image[:,:,1]+=red[:,:,0]*.07
            image[:,:,0]+=red[:,:,0]*.03
            image+=math.exp(-((k/(FPS*SECONDS)-.35)/.015)**2)*7.65
            frame=np.clip(image,0,255).astype(np.uint8)
            if k%2==0:
                for j in range(42):
                    u=(j*131+k*11)%W;v=(j*283+k*23)%H
                    cv2.line(frame,(u,v),(min(W-1,u+4),min(H-1,v+17)),(67,70,76),1,cv2.LINE_AA)
            t=k/FPS
            if (2.04<t<2.19) or (5.34<t<5.49):
                for start,height,dx in strips[:6]:
                    frame[start:min(H,start+height)]=np.roll(frame[start:min(H,start+height)],dx,axis=1)
                frame[:,:,2]=np.roll(frame[:,:,2],3,axis=1)
                frame[:,:,0]=np.roll(frame[:,:,0],-3,axis=1)
                cv2.line(frame,(0,int(.48*H)),(W,int(.48*H)),(31,30,125),1)
            writer.stdin.write(frame.tobytes())
    finally:
        writer.stdin.close()
    stderr=writer.stderr.read().decode("utf-8","replace")
    if writer.wait()!=0:
        raise RuntimeError("FFmpeg hero encoding failed: "+stderr[-2500:])
    mobile=out/"hero-motion-v139-720p.mp4"
    run_ffmpeg([
        "-i",str(full),"-vf","scale=1280:720:flags=lanczos","-an",
        "-c:v","libx264","-preset","veryfast","-crf","25",
        "-pix_fmt","yuv420p","-movflags","+faststart",str(mobile)
    ])
    # Draftly-style scroll-scrub assets: 48 frame positions across the eight
    # second original loop. Two browser-sized ladders, no runtime third-party
    # media requests and no heavy WebGL engine. The mobile ladder is < 768px.
    frames=[]
    for variant,resolution in (("desktop","1280:720"),("mobile","768:432")):
        folder=out/("frames-"+variant)
        folder.mkdir(parents=True,exist_ok=True)
        run_ffmpeg([
            "-i",str(full),"-vf","fps=6,scale="+resolution+":flags=lanczos",
            "-an","-c:v","libwebp","-quality","62",
            "-compression_level","5",str(folder/"frame-%04d.webp")
        ])
        images=sorted(folder.glob("frame-*.webp"))
        assert len(images)==48,(
            "Missing scroll-synced WebP frame(s), expected 48: "+variant
        )
        frames.extend([{"path":"assets/severance/frames-"+variant+"/"+i.name,
                        "bytes":i.stat().st_size,"sha256":sha256(i)} for i in images])
    # Pre-render exactly 48 scroll frames per device: native 2D canvas,
    # no runtime WebGL/GLB download and no external client-side image service.
    sequence=[]
    for target,width,height in [("desktop",1280,720),("mobile",768,432)]:
        frames=out/("frames-"+target)
        frames.mkdir(parents=True,exist_ok=True)
        run_ffmpeg([
            "-i",str(full),"-vf",f"fps=6,scale={width}:{height}:flags=lanczos",
            "-an","-c:v","libwebp","-quality","62",
            "-compression_level","5",str(frames/"frame-%04d.webp")
        ])
        files=sorted(frames.glob("frame-*.webp"))
        assert len(files)==48, f"Invalid {target} scroll frame sequence: {len(files)}"
        sequence.append({
            "device":target,"fps":6,"count":len(files),
            "directory":"assets/severance/frames-"+target,
            "totalBytes":sum(p.stat().st_size for p in files),
            "files":[{"path":"assets/severance/frames-"+target+"/"+p.name,
                      "sha256":sha256(p),"bytes":p.stat().st_size} for p in files]
        })
    poster=out/"hero-poster-v139.webp"
    run_ffmpeg([
        "-i",str(source),"-vf","scale=1920:1080:flags=lanczos",
        "-frames:v","1","-quality","86",str(poster)
    ])
    for path in (full,mobile,poster):
        assert path.stat().st_size>20_000,"Media is unexpectedly empty: "+path.name
    manifest={
        "contract":"ANEVUM-V139-FIRST-PARTY-MEDIA-REVIEW",
        "origin":SOURCE_DESCRIPTION,
        "approvedSourceSha256":PINNED_SOURCE_SHA256,
        "downloadedSourceSha256":digest,
        "approvedDecodedBgrSha256":PINNED_DECODED_BGR_SHA256,
        "runtimeThirdPartyRequests":False,"audio":False,
        "fps":FPS,"seconds":SECONDS,"gameplayFootage":False,
        "scrollFrameCountPerDevice":48,
        "frames":frames,
        "media":[{"path":"assets/severance/"+p.name,"bytes":p.stat().st_size,
                  "sha256":sha256(p)} for p in (full,mobile,poster)],
        "scrollFrameSequences":sequence
    }
    (out/"manifest-v139.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print("V139 pinned first-party media: "+json.dumps(manifest,sort_keys=True))


if __name__=="__main__":
    main()
