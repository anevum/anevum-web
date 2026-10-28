#!/usr/bin/env python3
"""Original V141 SEVERANCE social + PWA images. Exact ANEVUM orbital silhouette.

Deterministic first-party rendering, no third-party artwork, credentials, network
calls, game footage claims, profile data, or user-published media.
"""
import argparse, io, math, random
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cairosvg

SEED=140069
# The approved original silhouette: elliptical tilted orbit, central vertical
# flare, circular aperture and upper-right satellite. NOT a triangular A mark.
ORBIT='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<ellipse cx="256" cy="256" rx="184" ry="73" transform="rotate(-17 256 256)" fill="none" stroke="white" stroke-width="42" stroke-linecap="round"/>
<path d="M256 62 276 214 326 256 276 298 256 450 236 298 186 256 236 214Z" fill="white"/>
<circle cx="256" cy="256" r="72" fill="white"/>
<circle cx="270" cy="251" r="34" fill="black"/>
<circle cx="391" cy="132" r="22" fill="white"/>
</svg>'''
SERIF='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
SERIF_BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def face(path,size):
    return ImageFont.truetype(path,size)
def tracked(draw,string,x,y,font,fill,space=7):
    for letter in string:
        draw.text((round(x),round(y)),letter,font=font,fill=fill)
        x+=draw.textlength(letter,font=font)+space
def base(w,h,seed,variant):
    rng=np.random.default_rng(seed)
    yy,xx=np.mgrid[:h,:w].astype('float32')
    x=xx/w;y=yy/h
    n=rng.normal(0,1.65,(h,w)).astype('float32')
    if variant=='icon':
        glow=np.exp(-(((x-.5)/.39)**2+((y-.47)/.35)**2)*2)
        lower=np.exp(-(((x-.5)/.43)**2+((y-1)/.26)**2)*2)
        r=5+28*glow+29*lower+n;g=7+6*glow+.5*n;b=12+8*glow+n
    else:
        glow=np.exp(-(((x-.75)/.45)**2+((y-.43)/.5)**2)*2)
        lower=np.exp(-((y-.82)/.17)**2)
        r=6+56*glow+25*lower+n;g=7+9*glow+n*.45;b=13+13*glow+n
    return Image.fromarray(np.clip(np.stack([r,g,b],axis=-1),0,255).astype('uint8'),'RGB').convert('RGBA')

def smog(img,seed,count=23):
    w,h=img.size;r=random.Random(seed)
    veil=Image.new('RGBA',(w,h));d=ImageDraw.Draw(veil)
    for _ in range(count):
        x=r.randrange(w);y=r.randint(int(h*.4),int(h*1.1))
        rx=r.randint(int(w*.1),int(w*.3));ry=r.randint(int(h*.035),int(h*.1))
        d.ellipse((x-rx,y-ry,x+rx,y+ry),fill=(r.randint(75,130),8,19,r.randint(13,36)))
    img.alpha_composite(veil.filter(ImageFilter.GaussianBlur(max(12,w//32))))

def dust(img,seed,count=400):
    r=random.Random(seed);w,h=img.size;d=ImageDraw.Draw(img,'RGBA')
    for _ in range(count):
        x=r.randrange(w);y=r.randrange(h)
        if y<h*.56 and r.random()<.75:continue
        radius=r.choice([1,1,1,2,2,3])
        d.ellipse((x-radius,y-radius,x+radius,y+radius),
                  fill=(r.randint(120,220),r.randint(14,45),22,r.randint(40,135)))
    for _ in range(90):
        x=r.randrange(w);y=r.randrange(h);ln=r.randint(8,max(12,w//12))
        d.line((x,y,x+ln,y-ln*.3),fill=(132,26,29,r.randint(8,34)),width=r.choice([1,1,2]))

def orbit(size,seed):
    rgba=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=ORBIT.encode(),output_width=size,output_height=size))).convert('RGBA')
    mask=rgba.getchannel('A')
    yy,xx=np.mgrid[:size,:size].astype('float32');x=xx/size;y=yy/size
    r=np.random.default_rng(seed)
    shine=np.clip(.69+.22*np.sin((x*.9+y*.6)*16)+.12*np.cos((x-y)*21),.2,1)
    red=np.clip((y-.31)*1.5,0,.66);grit=(r.random((size,size))>.989).astype('float32')
    c=np.clip(np.stack([178+73*shine-39*grit+35*red,
          152+76*shine-105*red-38*grit,
          114+73*shine-85*red-44*grit],axis=-1),0,255).astype('uint8')
    logo=Image.fromarray(c,'RGB').convert('RGBA');logo.putalpha(mask)
    return logo

def put_logo(img,size,xy,seed):
    logo=orbit(size,seed);alpha=logo.getchannel('A')
    haze=Image.new('RGBA',(size,size),(184,15,25,0))
    haze.putalpha(alpha.point(lambda a:int(a*.27)))
    img.alpha_composite(haze.filter(ImageFilter.GaussianBlur(max(10,size//45))),dest=xy)
    dark=Image.new('RGBA',(size,size),(0,0,0,0));dark.putalpha(alpha.point(lambda a:int(a*.65)))
    img.alpha_composite(dark.filter(ImageFilter.GaussianBlur(max(9,size//65))),dest=(xy[0]+8,xy[1]+13))
    img.alpha_composite(logo,dest=xy)

def make_icons(out):
    img=base(1024,1024,SEED,'icon')
    smog(img,SEED+1);dust(img,SEED+2,210)
    d=ImageDraw.Draw(img,'RGBA')
    d.ellipse((70,55,953,968),outline=(152,40,42,29),width=3)
    put_logo(img,900,(62,52),SEED+3)
    r=random.Random(SEED+4)
    for _ in range(60):
        x=r.randint(170,860);y=r.randint(420,800);rd=r.choice([1,2,2,3,4])
        d.ellipse((x-rd,y-rd,x+rd,y+rd),fill=(r.randint(140,220),9,18,r.randint(20,92)))
    for x,y,length in [(220,655,62),(310,710,40),(675,715,63),(754,675,52),(855,615,37)]:
        d.line((x,y,x+3,y+length),fill=(160,13,20,95),width=3)
        d.ellipse((x-2,y+length-3,x+5,y+length+5),fill=(165,17,20,100))
    img=img.convert('RGB')
    for size,name in [(1024,'anevum-severance-icon-v141-1024.png'),
       (512,'anevum-severance-icon-v141-512.png'),
       (192,'anevum-severance-icon-v141-192.png'),
       (180,'anevum-severance-apple-touch-v141-180.png'),
       (64,'anevum-severance-favicon-v141-64.png')]:
        img.resize((size,size),Image.Resampling.LANCZOS).save(out/name,'PNG',optimize=True)
    canvas=base(512,512,SEED+5,'icon')
    canvas.alpha_composite(img.resize((430,430),Image.Resampling.LANCZOS).convert('RGBA'),(41,41))
    canvas.convert('RGB').save(out/'anevum-severance-maskable-v141-512.png','PNG',optimize=True)

def make_social(out):
    w,h=2400,1260;img=base(w,h,SEED+10,'share');d=ImageDraw.Draw(img,'RGBA')
    cx,cy,rad=1835,440,410
    halo=Image.new('RGBA',(w,h));hd=ImageDraw.Draw(halo)
    for s in range(95,0,-1):
        rr=rad+s
        hd.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),outline=(220,34,36,round(34*(1-s/95)**3)),width=5)
    img.alpha_composite(halo.filter(ImageFilter.GaussianBlur(18)))
    d.ellipse((cx-rad,cy-rad,cx+rad,cy+rad),fill=(9,8,17,239),outline=(185,41,30,183),width=7)
    smog(img,SEED+11,32)
    # Receding ruined alien-industrial skyline and crimson wet-ground reflection.
    d=ImageDraw.Draw(img,'RGBA');r=random.Random(SEED+12)
    for plane in range(3):
        y=int(h*(.72+plane*.10));color=(8+plane*4,9+plane*3,14+plane*3,240);x=-30
        while x<w+80:
            bw=r.randint(35,135);bh=r.randint(120,425);top=y-bh
            d.polygon([(x,y),(x,top+20),(x+bw//2,top-15),(x+bw,top+r.randint(0,90)),(x+bw,y)],fill=color)
            for _ in range(r.randint(0,10)):
                qx=x+r.randrange(3,max(4,bw-1));qy=r.randrange(max(0,top+10),max(1,y-10))
                d.line((qx,qy,qx,qy+5),fill=(151,26,26,r.randint(30,110)),width=2)
            x+=bw+r.randint(0,18)
    for _ in range(150):
        x=r.randrange(w);y=r.randrange(1010,h);ln=r.randint(10,130)
        d.line((x,y,x+ln,y),fill=(160,17,21,r.randint(15,80)),width=r.randint(1,4))
    smog(img,SEED+13,16)
    d=ImageDraw.Draw(img,'RGBA')
    d.rounded_rectangle((85,90,955,1075),radius=80,fill=(2,3,8,143),outline=(163,53,48,55),width=3)
    put_logo(img,890,(84,120),SEED+14)
    dust(img,SEED+15,650)
    d=ImageDraw.Draw(img,'RGBA')
    d.rounded_rectangle((932,300,2350,1050),radius=30,fill=(4,5,9,150))
    d.line((991,348,2174,348),fill=(181,72,57,125),width=3)
    d.text((990,389),'ANEVUM',font=face(SERIF,165),fill=(241,230,213,255))
    d.line((995,579,2210,579),fill=(226,193,149,105),width=2)
    tracked(d,'TRANSCOSMIC',1000,628,face(SANS,42),(204,189,173,255),13)
    tracked(d,'SEVERANCE',977,727,face(SERIF_BOLD,118),(221,63,58,255),5)
    tracked(d,'THE WORLD REMEMBERS',1006,895,face(SANS,35),(235,219,200,255),9)
    d.text((1010,968),'SURVIVAL HORROR  /  IN DEVELOPMENT',font=face(SANS,28),fill=(189,180,174,240))
    d.line((110,1145,2284,1145),fill=(215,57,49,115),width=3)
    tracked(d,'ANEVUM.COM',120,1172,face(SANS,31),(221,209,195,255),7)
    d.text((1907,1174),'NO PUBLIC PLAY ACCESS',font=face(SANS,25),fill=(189,178,171,255))
    img.convert('RGB').resize((1200,630),Image.Resampling.LANCZOS).save(
        out/'anevum-severance-share-v141-1200x630.png','PNG',optimize=True)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,required=True)
    args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    make_icons(args.out);make_social(args.out)
    expected={'anevum-severance-icon-v141-1024.png':(1024,1024),
      'anevum-severance-icon-v141-512.png':(512,512),
      'anevum-severance-icon-v141-192.png':(192,192),
      'anevum-severance-apple-touch-v141-180.png':(180,180),
      'anevum-severance-favicon-v141-64.png':(64,64),
      'anevum-severance-maskable-v141-512.png':(512,512),
      'anevum-severance-share-v141-1200x630.png':(1200,630)}
    for path,dims in expected.items():
        f=args.out/path
        assert Image.open(f).size==dims
        print(f.name,f.stat().st_size,dims)
if __name__=='__main__':main()
