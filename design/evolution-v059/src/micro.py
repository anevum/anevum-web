"""V060 optical micro images from the existing thirty V059 compact 3D scenes.
Requires the same numpy, Pillow and OpenGL / Mesa as the V059 renderer.
Does not change XP, eligibility, history, large native masters or server."""
from pathlib import Path
import json,hashlib,argparse
import numpy as np
from PIL import Image, ImageFilter
from geometry import ROOT,Scene
from render import Renderer

SIZES=(32,48,64,128,192,256)
WEAK={6,11,15,17,18,19,20,26,30}
WIDE={2,4,5,7,9,10,13,16,19,20,25,28,30}

def optical_square(im,level):
 rgba=np.asarray(im.convert('RGBA'),dtype=np.uint8)
 rgb=rgba[:,:,:3].astype(np.float32)/255
 alpha=rgba[:,:,3].astype(np.float32)/255
 lum=.2126*rgb[:,:,0]+.7152*rgb[:,:,1]+.0722*rgb[:,:,2]
 weight=np.power(alpha,1.25)*np.power(.22+lum,.8)
 if not weight.sum():raise RuntimeError(f'Empty artwork {level}')
 wx=weight.sum(axis=0);wy=weight.sum(axis=1)
 def q(v,p):return int(np.searchsorted(np.cumsum(v),float(v.sum())*p))
 x0,x1=q(wx,.016),q(wx,.984);y0,y1=q(wy,.016),q(wy,.984)
 coverage=.84 if level in WIDE else .89
 side=int(min(im.width,max(420,(x1-x0+1)/coverage,(y1-y0+1)/coverage)))
 cx=float((wx*np.arange(im.width)).sum()/wx.sum())
 cy=float((wy*np.arange(im.height)).sum()/wy.sum())
 if level in {17,18,19,20,30}:side=min(im.width,int(side*1.07))
 left=max(0,min(im.width-side,round(cx-side/2)))
 top=max(0,min(im.height-side,round(cy-side/2)))
 crop=im.crop((left,top,left+side,top+side)).convert('RGBA')
 pix=np.asarray(crop,dtype=np.float32).copy()
 color=pix[:,:,:3]/255.
 a=pix[:,:,3]/255.
 color=np.clip(np.power(color,.83 if level in WEAK else .92)*1.08,0,1)
 gray=color[:,:,0]*.2126+color[:,:,1]*.7152+color[:,:,2]*.0722
 color=np.clip(gray[:,:,None]+(color-gray[:,:,None])*1.10,0,1)
 a=np.clip(np.power(a,.79 if level in WEAK else .90)*(1.12 if level in WEAK else 1.04),0,1)
 span=max(8,round(crop.width*.016))
 edge=np.minimum(np.arange(crop.width),np.arange(crop.width)[::-1]).astype(np.float32)/span
 a*=np.clip(np.minimum(edge[:,None],edge[None,:]),0,1)
 pix[:,:,:3]=np.rint(color*255);pix[:,:,3]=np.rint(a*255)
 return Image.fromarray(pix.astype(np.uint8),'RGBA'),{
  'left':int(left),'top':int(top),'side':int(side),
  'weightCoverage':round(float(weight[top:top+side,left:left+side].sum()/weight.sum()),4)}

def make_sizes(source,dest):
 variants=[]
 for size in SIZES:
  image=source.convert('RGBa').resize((size,size),Image.Resampling.LANCZOS)
  image=image.filter(ImageFilter.UnsharpMask(radius=.55 if size<=64 else .65,percent=95 if size<=64 else 115,threshold=3)).convert('RGBA')
  alpha=image.getchannel('A')
  alpha.paste(0,(0,0,size,1));alpha.paste(0,(0,size-1,size,size))
  alpha.paste(0,(0,0,1,size));alpha.paste(0,(size-1,0,size,size))
  image.putalpha(alpha)
  ext='png' if size<=64 else 'webp'
  path=dest.parent/(dest.name+f'-{size}.{ext}')
  if ext=='png':image.save(path,optimize=True)
  else:image.save(path,format='WEBP',quality=96,method=6,alpha_quality=100,exact=True)
  with Image.open(path) as test:
   test.load()
   assert test.size==(size,size) and test.mode=='RGBA'
   assert test.getchannel('A').getbbox()
   assert all(test.getpixel(p)[3]==0 for p in ((0,0),(size-1,0),(0,size-1),(size-1,size-1)))
  variants.append({'path':str(path.relative_to(ROOT)),
   'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'size':size})
 return variants

def build(levels):
 output=ROOT/'artwork/micro';output.mkdir(parents=True,exist_ok=True)
 renderer=Renderer(1024);report=[]
 for n in levels:
  if not (1<=n<=30):raise ValueError('Level must be within 1..30')
  scene=Scene(n,True).build()
  image=renderer.render(scene,t=.65,zoom=1.12)
  cropped,frame=optical_square(image,n)
  variants=make_sizes(cropped,output/f'level-{n:02}')
  report.append({'level':n,'camera':'V059 compact native geometry / 1024px GLSL','frame':frame,'renditions':variants})
  print('MICRO',f'{n:02}',frame,flush=True)
 manifest=ROOT/'docs/MICRO-QA.json'
 existing=json.loads(manifest.read_text()) if manifest.exists() else {'session':'ANEVUM.WEB.BUILD.2026-10-17.009.EVOLUTION-MICRO-BADGES','scenes':[]}
 keyed={i['level']:i for i in existing['scenes']}
 keyed.update({i['level']:i for i in report})
 existing['scenes']=[keyed[i] for i in sorted(keyed)]
 existing.update(total=len(keyed),images=sum(len(i['renditions']) for i in keyed.values()),
  failureCount=0,note='Artistic approval and native iPhone Safari tests pending; no account or XP writes.')
 manifest.write_text(json.dumps(existing,indent=2))
if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('levels',nargs='*',type=int)
 args=parser.parse_args()
 build(args.levels or list(range(1,31)))
