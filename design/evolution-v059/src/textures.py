"""Deterministic seamless 4096px height/normal/roughness source maps.
The artist-editable formulas are the native material sources.
"""
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter,zoom
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'artwork/textures';ROOT.mkdir(exist_ok=True)
N=4096;rng=np.random.default_rng(59008)
def field(seed):
 r=np.random.default_rng(seed);v=np.zeros((N,N),np.float32)
 for n,amp in [(8,.36),(16,.23),(32,.15),(64,.10),(128,.07),(256,.045),(512,.025),(1024,.014)]:
  grid=r.random((n,n),dtype=np.float32);up=zoom(grid,N/n,order=1,mode='wrap',prefilter=False);v+=up[:N,:N]*amp
 return (v-v.min())/(v.max()-v.min())
def save(name,h,rough):
 Image.fromarray(np.uint8(h*255)).save(ROOT/f'{name}-height-4096.png',optimize=True)
 dx=(np.roll(h,-1,1)-np.roll(h,1,1))*7;dy=(np.roll(h,-1,0)-np.roll(h,1,0))*7
 n=np.stack((-dx,-dy,np.ones_like(h)),2);n/=np.linalg.norm(n,axis=2,keepdims=True)
 Image.fromarray(np.uint8((n*.5+.5)*255)).save(ROOT/f'{name}-normal-4096.png',optimize=True)
 Image.fromarray(np.uint8(np.clip(rough,0,1)*255)).save(ROOT/f'{name}-roughness-4096.png',optimize=True)
 print('TEXTURE',name,flush=True)
h=field(31);fracture=np.exp(-abs(h-.48)*110);h=np.clip(h*.65-fracture*.15+.2,0,1);save('mineral',h,.62+h*.25)
y,x=np.mgrid[0:N,0:N].astype(np.float32);u=x/N;v=y/N
h=field(44);mem=.55+.16*np.sin(TAU:=np.pi*2*u*11+np.sin(v*np.pi*12)*.7)+h*.16
save('membrane',np.clip(mem,0,1),.24+h*.16)
h=field(66);waves=.5+.10*np.sin(u*np.pi*2*110+np.sin(v*np.pi*2*12)*5)+.08*np.sin(v*np.pi*2*87+np.sin(u*np.pi*2*15)*4)+h*.12;save('aqueous',waves,.14+h*.11)
h=field(89);brush=.5+.13*np.sin(v*np.pi*2*930)+h*.18;save('ceramic-metal',brush,.2+h*.15)
