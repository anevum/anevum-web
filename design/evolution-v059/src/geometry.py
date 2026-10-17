"""ANEVUM V059 native procedural mesh sources. Units are specimen-relative.
Every scene is independently composed. No V058 artwork is resampled or filtered.
"""
import numpy as np, math, json, base64
from pathlib import Path
TAU=math.tau
ROOT=Path(__file__).resolve().parents[1]

def norm(v):
 v=np.asarray(v,dtype=np.float32);return v/np.maximum(np.linalg.norm(v,axis=-1,keepdims=True),1e-8)
def rot(x=0,y=0,z=0):
 a,b,c=np.cos([x,y,z]);d,e,f=np.sin([x,y,z]);return np.array([[b*c,c*d*e-a*f,a*c*e+d*f],[b*f,a*c+d*e*f,a*e*f-c*d],[-e,b*d,a*b]],np.float32)
def noise(p,seed=0):
 p=np.asarray(p);v=np.zeros(p.shape[:-1]);
 for k in range(5):
  f=2.1**k;v+=np.sin(p[...,0]*f*1.37+np.cos(p[...,2]*f+seed)*1.8+seed)*np.cos(p[...,1]*f*1.17+np.sin(p[...,2]*f*.8))*(.5**k)
 return v/1.8
# base RGB, roughness, metallic, emission, opacity, texture family
MAT={
'obsidian':([.065,.09,.11],.63,.25,0,1,1),'stone':([.33,.37,.38],.82,.08,0,1,1),
'ice':([.48,.76,.84],.16,.18,0,.88,2),'glass':([.28,.55,.67],.13,.44,.04,.66,2),
'pearl':([.63,.75,.78],.27,.25,.03,.75,2),'violet':([.43,.30,.67],.32,.25,.24,.82,2),
'ivory':([.81,.80,.69],.26,.48,0,1,3),'metal':([.24,.37,.43],.23,.82,0,1,3),
'copper':([.67,.32,.14],.32,.84,0,1,3),'gold':([.8,.57,.24],.23,.8,0,1,3),
'plasma':([1,.16,.025],.6,0,1.7,.76,4),'hot':([1,.48,.12],.45,0,2.5,1,4),
'blue':([.12,.50,.85],.4,.1,1.4,.78,4),'coral':([.85,.24,.20],.4,.25,.6,.86,4),
'ocean':([.035,.26,.40],.17,.26,.02,1,5),'life':([.07,.47,.28],.48,.12,.03,1,5),
'membrane':([.33,.68,.49],.26,.12,.08,.76,6),'neural':([.27,.73,.65],.25,.24,.42,.90,6),
'light':([.75,.93,1],.35,0,2.3,1,0),'warm':([1,.65,.28],.4,0,1.8,1,0),
'gas-violet':([.35,.19,.56],.95,0,.9,.18,7),'gas-blue':([.12,.37,.58],.95,0,.9,.16,7),'gas-coral':([.63,.22,.20],.95,0,.8,.12,7),'gas-dark':([.13,.20,.29],.95,0,.2,.19,7),'dust':([.40,.25,.49],.9,0,.12,.5,0),'ink':([.015,.025,.045],.3,.1,0,1,1)
}
class Scene:
 def __init__(self,i,compact=False):self.i=i;self.parts=[];self.rng=np.random.default_rng(7100+i);self.compact=compact
 def add(self,name,v,f,mat='stone',motion=0,speed=.2,phase=0,axis=(0,1,0),pivot=(0,0,0),uv=None):
  v=np.asarray(v,np.float32);f=np.asarray(f,np.uint32).reshape(-1,3)
  normal=np.zeros_like(v);fn=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
  for k in range(3):np.add.at(normal,f[:,k],fn)
  normal=norm(normal)
  if uv is None:uv=np.column_stack((np.arctan2(v[:,2],v[:,0])/TAU+.5,v[:,1]*.3+.5)).astype(np.float32)
  self.parts.append(dict(name=name,mat=mat,motion=motion,speed=speed,phase=phase,axis=axis,pivot=pivot,v=v,n=normal,uv=np.asarray(uv,np.float32),f=f))
 def sphere(self,name,c=(0,0,0),s=(1,1,1),mat='stone',rough=0,seed=0,res=32,**kw):
  if self.compact:res=max(12,res//2)
  a=np.linspace(0,TAU,res+1);b=np.linspace(.0001,math.pi-.0001,max(8,res//2)+1)
  aa,bb=np.meshgrid(a,b);p=np.stack((np.sin(bb)*np.cos(aa),np.cos(bb),np.sin(bb)*np.sin(aa)),axis=-1)
  rad=1+rough*noise(p*2.3,seed);v=(p*rad[...,None]*s+np.asarray(c)).reshape(-1,3)
  f=[];w=res+1
  for j in range(len(b)-1):
   for k in range(res):q=j*w+k;f.extend([(q,q+w,q+1),(q+1,q+w,q+w+1)])
  uv=np.stack((aa/TAU,bb/math.pi),-1).reshape(-1,2)
  self.add(name,v,np.asarray(f)[:,::-1],mat,uv=uv,**kw)
 def tube(self,name,path,r=.025,mat='metal',sides=7,**kw):
  p=np.array(path,np.float32);tan=norm(np.gradient(p,axis=0));guide=np.tile([0,0,1.],(len(p),1));guide[abs(tan[:,2])>.9]=[0,1,0]
  u=norm(np.cross(tan,guide));w=norm(np.cross(tan,u));a=np.linspace(0,TAU,sides+1)
  rad=np.asarray(r) if not np.isscalar(r) else np.full(len(p),r)
  v=(p[:,None,:]+rad[:,None,None]*(u[:,None,:]*np.cos(a)[None,:,None]+w[:,None,:]*np.sin(a)[None,:,None])).reshape(-1,3)
  f=[]
  for j in range(len(p)-1):
   for k in range(sides):q=j*(sides+1)+k;f.extend([(q,q+sides+1,q+1),(q+1,q+sides+1,q+sides+2)])
  uv=np.stack(np.meshgrid(np.linspace(0,1,sides+1),np.linspace(0,1,len(p))),-1).reshape(-1,2)
  self.add(name,v,np.asarray(f)[:,::-1],mat,uv=uv,**kw)
 def arc(self,name,r=1,tilt=(0,0,0),start=0,end=TAU,thick=.02,mat='metal',ratio=1,**kw):
  a=np.linspace(start,end,max(18,int((end-start)*22)));p=np.stack((r*np.cos(a),r*ratio*np.sin(a),np.zeros_like(a)),-1)@rot(*tilt).T
  self.tube(name,p,thick,mat,**kw)
 def sheet(self,name,fun,mat='glass',res=32,**kw):
  if self.compact:res=14
  u,v=np.meshgrid(np.linspace(0,1,res+1),np.linspace(0,1,res+1));p=fun(u,v).reshape(-1,3);f=[]
  for j in range(res):
   for k in range(res):q=j*(res+1)+k;f.extend([(q,q+res+1,q+1),(q+1,q+res+1,q+res+2)])
  self.add(name,p,f,mat,uv=np.stack((u,v),-1).reshape(-1,2),**kw)
 def box(self,name,c,s,mat='ivory',**kw):
  x,y,z=c;w,h,d=np.array(s)/2;v=np.array([[x+a*w,y+b*h,z+e*d] for a,b,e in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]])
  # split faces for sharp architectural normals
  faces=[(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(3,7,6,2),(0,1,5,4)];verts=[];f=[]
  for face in faces:
   q=len(verts);verts.extend(v[list(face)]);f.extend([(q,q+1,q+2),(q,q+2,q+3)])
  self.add(name,verts,f,mat,**kw)
 def mote(self,name,p,r=.02,mat='light',**kw):
  x,y,z=p;v=np.array([[x+r,y,z],[x-r,y,z],[x,y+r,z],[x,y-r,z],[x,y,z+r],[x,y,z-r]])
  self.add(name,v,[(0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)],mat,**kw)
 def particles(self,name,points,radii,mat='light',**kw):
  # One mesh per particle field avoids hundreds of draw calls.
  vs=[];fs=[]
  for p,r in zip(points,radii):
   q=len(vs);x,y,z=p;vs.extend([[x+r,y,z],[x-r,y,z],[x,y+r,z],[x,y-r,z],[x,y,z+r],[x,y,z-r]])
   fs.extend([(q+a,q+b,q+c) for a,b,c in [(0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)]])
  self.add(name,vs,fs,mat,**kw)
 def cloud(self,name,points,radii,mat='gas-violet',**kw):
  vs=[];fs=[];uv=[]
  for p,r in zip(points,radii):
   q=len(vs);x,y,z=p;vs.extend([[x-r,y-r,z],[x+r,y-r,z],[x+r,y+r,z],[x-r,y+r,z]]);fs.extend([(q,q+1,q+2),(q,q+2,q+3)]);uv.extend([[0,0],[1,0],[1,1],[0,1]])
  self.add(name,vs,fs,mat,uv=uv,**kw)
 def build(self):
  i=self.i;rng=self.rng;t=np.linspace(0,1,75);a=np.linspace(0,TAU,130)
  if i==1:
   self.sphere('Unrecorded dark / fractured monolith',s=(.56,.84,.43),rough=.43,res=48,seed=7,mat='obsidian',motion=1,speed=.12)
   path=np.stack((.09*np.sin(t*10)-.06,t*1.4-.65,.44+.04*np.sin(t*15)),-1);self.tube('Single incipient fissure',path,.006,'warm',motion=2,speed=.3)
   p=rng.normal(size=(50,3))*[.24,.4,.15]+[0,0,.38];self.particles('Mica inclusions',p,rng.uniform(.003,.009,50),'metal')
  elif i==2:
   for j in [-1,1]:
    self.sheet('Vacuum interference surface '+str(j),lambda u,v,j=j:np.stack(((u-.5)*1.65*np.sin(v*math.pi)**.35,(v-.5)*1.38*np.sin(u*math.pi)**.35,np.sin(u*5+v*3)*.22+j*.13),-1),'pearl' if j==1 else 'glass',motion=3,speed=.28,phase=j)
   for j in range(5):self.tube('Interference fringe '+str(j),np.stack((t*1.7-.85,.26*np.sin(t*7+j*.4),.18*np.cos(t*5)+.2),-1),.003,'light',motion=4,speed=.2,phase=j)
  elif i==3:
   for j in range(14 if not self.compact else 7):
    p=rng.normal(size=3)*[.42,.45,.25];rr=rng.uniform(.17,.37);self.sphere('Transient vacuum pocket '+str(j),c=p,s=(rr,rr*.88,rr),mat='glass' if j%2 else 'violet',rough=.06,seed=j,motion=5,speed=.55,phase=j*.8,res=24)
  elif i==4:
   for j in [-1,1]:
    self.sheet('Opposing symmetry plane '+str(j),lambda u,v,j=j:np.stack(((u-.5)*1.8*np.sin(v*math.pi)**.4,(v-.5)*1.65,j*(.10+.40*abs(u-.5))+.13*np.cos(v*TAU)),-1),'ivory' if j==1 else 'metal',motion=6,speed=.22,phase=j)
   self.tube('Broken symmetry axis',[[0,-.95,.3],[0,.95,.3]],.008,'coral',motion=2,speed=.4)
  elif i==5:
   self.sheet('Expanding causal membrane',lambda u,v:np.stack((np.cos(u*TAU)*(v*.8+.1),np.sin(u*TAU)*(v*.8+.1),.65*np.cos(v*math.pi)-.18),-1),'copper',motion=7,speed=.35,res=48)
   p=rng.normal(size=(110,3));p=norm(p)*rng.uniform(.65,1,(110,1));self.particles('Released horizon shards',p,rng.uniform(.006,.027,110),'hot',motion=7,speed=.35)
  elif i==6:
   for j in range(11):
    self.sheet('Turbulent charge current '+str(j),lambda u,v,j=j:np.stack((.23*np.sin(v*9+j*.57)+(u-.5)*.17*np.sin(v*math.pi)**.6+(v-.5)*.42,(v-.5)*(1.45+.035*j),.18*np.cos(v*7+j*.57)),axis=-1),'plasma' if j%4 else 'blue',res=40,motion=8,speed=.7,phase=j*.7)
   p=rng.normal(size=(120,3))*[.48,.65,.35];self.particles('Charge scatter',p,rng.uniform(.002,.012,120),'warm',motion=8,speed=.8)
  elif i==7:
   centers=np.array([[-.53,-.28,.15],[.38,-.3,-.12],[.03,.57,.12]])
   for j,c in enumerate(centers):self.sphere('Color charge '+str(j),c=c,s=(.22,.3,.20),mat=['blue','coral','violet'][j],rough=.2,seed=j,motion=9,speed=.7,phase=j*2,res=28)
   for j in range(3):
    p=(1-t[:,None])*centers[j]+t[:,None]*centers[(j+1)%3];p[:,2]+=.22*np.sin(t*math.pi);self.tube('Confined flux tube '+str(j),p,.035,['light','warm','blue'][j],motion=10,speed=.5,phase=j)
  elif i==8:
   for j,c in enumerate([[-.25,-.13,.1],[.29,-.16,-.12],[.04,.31,0]]):self.sphere('Bound proton lobe '+str(j),c=c,s=(.42,.46,.40),mat='stone',rough=.24,seed=5+j,motion=1,speed=.15,res=40)
   for j in range(8):
    p=np.stack((.48*np.sin(t*6+j*.8),t*1.1-.55,.45*np.cos(t*6+j*.8)),-1);self.tube('Confinement seam '+str(j),p,.006,'coral',motion=2,speed=.3,phase=j)
  elif i==9:
   self.sphere('Atomic nucleus',s=(.18,.21,.18),mat='hot',rough=.18,res=24)
   for j in [-1,1]:
    self.sphere('Probability lobe '+str(j),c=(j*.41,j*.29,0),s=(.49,.40,.33),mat='glass',rough=.09,seed=j+4,motion=11,speed=.3,phase=j,res=40)
   for j in range(4):self.arc('Probability contour '+str(j),r=.58+j*.09,tilt=(.6,j*.6,.5),thick=.003,mat='blue',motion=11,speed=.1+j*.03)
  elif i==10:
   self.sheet('Recombination fossil / anisotropy veil',lambda u,v:np.stack(((u-.5)*1.8*np.sin(v*math.pi)**.2,(v-.5)*1.4*np.sin(u*math.pi)**.2,.17*np.sin(u*8)*np.cos(v*5)+.25*np.cos((u-.5)*3)),axis=-1),'copper',res=64,motion=12,speed=.18)
   for j in range(9):self.tube('Redshift isotherm '+str(j),np.stack((t*1.7-.85,np.full_like(t,j*.13-.53),.17*np.sin(t*8)*np.cos((j*.13+.2)*5)+.3),-1),.003,'warm',motion=4,speed=.12,phase=j)
  elif i==11:
   for j in range(4):
    p=rng.normal(size=(55,3))*[.25,.37,.20]+[.1*np.sin(j),j*.18-.28,0];self.cloud('Cold hydrogen density bank '+str(j),p,rng.uniform(.08,.24,55),'gas-dark',motion=13,speed=.13,phase=j)
   p=rng.normal(size=(65,3))*[.37,.5,.24];self.particles('Unlit density knots',p,rng.uniform(.002,.006,65),'metal',motion=2,speed=.12)
  elif i==12:
   self.sheet('Spacetime infall funnel',lambda u,v:np.stack(((.14+v*.76)*np.cos(u*TAU),(.14+v*.76)*np.sin(u*TAU)*.55,.6*(1-v)**2-.2),-1),'metal',res=48,motion=14,speed=.16)
   for j in range(10):
    r=.17+j*.073;self.arc('Curved geodesic '+str(j),r=r,ratio=.55,tilt=(.20,0,0),thick=.003,mat='blue',motion=14,speed=.18)
   self.sphere('Dark focus',c=(0,0,.43),s=(.14,.14,.14),mat='ink',res=24)
  elif i==13:
   self.sphere('Unstable photosphere',s=(.48,.49,.47),mat='hot',rough=.017,seed=13,res=88,motion=15,speed=1.1)
   for j in range(38):
    ang=j*TAU/38;rr=.46+.27*t**.7;tw=ang+.09*np.sin(t*7+j);p=np.stack((np.cos(tw)*rr,np.sin(tw)*rr,.04*np.sin(t*10+j)),axis=-1);self.tube('Coronal streamer '+str(j),p[::2],(.008*(1-t)+.001)[::2],'plasma',sides=4,motion=16,speed=.7,phase=j*.44)
   for j in range(8):
    ang=j*TAU/8;rr=.48+.17*np.sin(t*math.pi);theta=ang+(t-.5)*.36;p=np.stack((np.cos(theta)*rr,np.sin(theta)*rr,.1*np.sin(t*math.pi+j)),-1);self.tube('Magnetic corona arch '+str(j),p,.005,'coral',motion=16,speed=.45,phase=j)
   p=rng.normal(size=(60,3))*[.19,.19,.07];self.cloud('Nascent stellar radiance',p,rng.uniform(.12,.30,60),'gas-coral',motion=15,speed=.5)
  elif i==14:
   self.sphere('Sustained fusion ember',s=(.65,.62,.64),mat='plasma',rough=.042,seed=14,res=80,motion=17,speed=.17)
   for j in range(6):self.arc('Magnetic prominence '+str(j),r=.69+j*.018,tilt=(j*.3,j*.7,0),start=j,end=j+1.4,thick=.017,mat='hot',motion=18,speed=.5,phase=j)
  elif i==15:
   for j in range(6):
    ang=j*2.399;c=np.array([.24*np.cos(ang),.35*np.sin(ang),.10*np.sin(j)]);p=rng.normal(size=(45,3))*[.19,.23,.12]+c
    self.cloud('Ionized nebular plume '+str(j),p,rng.uniform(.07,.23,45),['gas-violet','gas-blue','gas-coral'][j%3],motion=19,speed=.18,phase=j)
   self.sphere('Embedded newborn star',c=(-.15,.04,.20),s=(.028,)*3,mat='hot',res=16)
   p=rng.normal(size=(240,3))*[.38,.42,.20];self.particles('Suspended nebular dust',p,rng.uniform(.001,.004,240),'light',motion=19,speed=.08)
  elif i==16:
   self.sphere('Iron remnant',s=(.33,.38,.30),mat='metal',rough=.26,seed=16,res=40,motion=1,speed=.14)
   for j in range(14):
    ang=j*2.399;d=np.array([np.cos(ang),np.sin(ang),.35*np.sin(j)])
    self.tube('Nucleosynthesis ejecta '+str(j),(.27+t[:,None]*.6)*d,.047*(1-t)+.006,['copper','hot','blue'][j%3],motion=20,speed=.4,phase=j)
   self.sphere('Stellar crucible mantle',s=(.51,.49,.43),rough=.14,mat='coral',res=40,motion=2,speed=.4)
  elif i==17:
   for j in range(5):
    ph=j*TAU/5;rr=.12+t*.7;p=np.stack((rr*np.cos(t*4+ph),rr*np.sin(t*4+ph)*.65,.2*np.sin(t*3+ph)),axis=-1);self.tube('Protogalactic inflow '+str(j),p,.04*(1-t)+.012,'glass',motion=21,speed=.13,phase=j)
   self.sphere('Gathering stellar bulge',s=(.27,.22,.23),mat='warm',rough=.12,res=32,motion=2,speed=.2)
   p=rng.normal(size=(320,3))*[.38,.24,.16];self.particles('First stellar population',p,rng.uniform(.002,.012,320),'light',motion=21,speed=.1)
  elif i==18:
   for j in range(4):
    count=470 if not self.compact else 150;tt=rng.random(count);ang=tt*5.4+j*TAU/4+rng.normal(0,.11,count);rr=.10+tt*.9
    p=np.stack((rr*np.cos(ang),rr*np.sin(ang)*.56,rng.normal(0,.028,count)+.12*np.sin(ang)),-1)
    self.particles('Spiral stellar arm '+str(j),p,rng.uniform(.002,.013,count),'blue' if j%2 else 'light',motion=22,speed=.055)
    self.tube('Dark dust lane '+str(j),np.stack(((.16+t*.75)*np.cos(t*5.4+j*TAU/4),(.16+t*.75)*np.sin(t*5.4+j*TAU/4)*.56,np.full_like(t,.06)),-1),.021,'obsidian',motion=22,speed=.055)
   self.sphere('Galactic central bulge',s=(.20,.12,.13),mat='warm',rough=.02,res=32,motion=22,speed=.055)
  elif i==19:
   nodes=rng.normal(size=(30,3))*[.48,.43,.32]
   for j in range(len(nodes)):
    for k in np.argsort(np.linalg.norm(nodes-nodes[j],axis=1))[1:3]:
     if k<j:continue
     p=(1-t[:,None])*nodes[j]+t[:,None]*nodes[k];p[:,2]+=.07*np.sin(t*math.pi);self.tube('Matter filament %s-%s'%(j,k),p,.008,'violet',motion=23,speed=.35,phase=j)
   self.particles('Galaxy-cluster nodes',nodes,rng.uniform(.025,.05,len(nodes)),'light',motion=2,speed=.45)
  elif i==20:
   self.sphere('System primary',c=(-.13,.05,0),s=(.16,)*3,mat='hot',res=40,motion=17,speed=.12)
   for j,(rr,sz) in enumerate([(.34,.044),(.5,.068),(.70,.10),(.94,.068)]):
    self.arc('Orbital path '+str(j),r=rr,ratio=.52,tilt=(.35,.15,-.2),thick=.003,mat='metal')
    ang=j*1.7;p=np.array([rr*np.cos(ang),rr*.52*np.sin(ang),0])@rot(.35,.15,-.2).T
    self.sphere('Independent orbiting world '+str(j),c=p,s=(sz,)*3,mat=['stone','ocean','copper','ice'][j],res=20,motion=24,speed=[.42,.28,.16,.09][j],axis=(.1,.3,1),phase=j)
   p=np.stack((rng.uniform(-1,1,220),rng.normal(0,.13,220),rng.normal(0,.10,220)),-1);p=p[np.linalg.norm(p,axis=1)>.76];self.particles('Outer debris belt',p,np.full(len(p),.006),'stone',motion=24,speed=.04,axis=(.1,.3,1))
  elif i==21:
   self.sphere('Molten accreting world',s=(.56,.52,.54),mat='stone',rough=.20,seed=21,res=64,motion=25,speed=.12)
   for j in range(13):
    p=rng.normal(size=3);p=norm(p)*rng.uniform(.65,.98);sz=rng.uniform(.028,.10);self.sphere('Infalling planetesimal '+str(j),c=p,s=(sz,sz*.7,sz),mat='stone',rough=.22,seed=j,res=14,motion=26,speed=.3,phase=j)
   for j in range(5):self.tube('Exposed lava fracture '+str(j),np.stack((.5*np.sin(t*2+j),t*.8-.4,.50*np.cos(t*2+j)),-1),.010,'plasma',motion=2,speed=.4,phase=j)
  elif i==22:
   self.sphere('Global liquid ocean',s=(.66,)*3,mat='ocean',rough=.009,res=88,motion=27,speed=.055)
   for j in range(6):
    yy=j*.17-.44;rr=math.sqrt(.66**2-yy**2);ang=np.linspace(j*.7,j*.7+3.6,120);p=np.stack((rr*np.cos(ang),yy+.035*np.sin(ang*3+j),rr*np.sin(ang)),-1);self.tube('Circulating atmospheric band '+str(j),p,.004 if j%2 else .010,'pearl',motion=28,speed=.045+j*.006,axis=(0,1,0))
   self.arc('High atmosphere',r=.695,thick=.006,mat='blue',tilt=(.3,.1,.2),motion=27,speed=.055)
  elif i==23:
   cs=[]
   for j in range(16):
    ang=j*.87;p=np.array([.41*np.cos(ang),j*.095-.70,.28*np.sin(ang)]);cs.append(p);self.sphere('Molecular group '+str(j),c=p,s=(.115,)*3,mat=['life','pearl','copper','ocean'][j%4],res=20,motion=29,speed=.4,phase=j)
    if j:self.tube('Covalent backbone '+str(j),[cs[j-1],p],.027,'ivory',motion=29,speed=.4,phase=j)
    if j%3==0:
     q=p+np.array([.25*np.cos(ang),.05,.25*np.sin(ang)]);self.tube('Reactive side chain '+str(j),[p,q],.02,'metal');self.sphere('Side group '+str(j),c=q,s=(.08,)*3,mat='coral',res=16,motion=2,speed=.4)
  elif i==24:
   for j in [-1,1]:self.sphere('Dividing protocell '+str(j),c=(j*.28,j*.09,0),s=(.48,.54,.38),mat='membrane',rough=.07,seed=j+9,res=64,motion=30,speed=.3,phase=j)
   for j in range(2):
    p=np.stack((.16*np.cos(t*TAU*2+j*math.pi),t*.7-.35,.16*np.sin(t*TAU*2+j*math.pi)+.1),-1);self.tube('Replicating internal strand '+str(j),p,.018,'warm',motion=31,speed=.35,phase=j)
   p=rng.normal(size=(60,3))*[.3,.3,.17];self.particles('Intracellular vesicles',p,rng.uniform(.009,.025,60),'neural',motion=31,speed=.2)
  elif i==25:
   self.sphere('Living world / ocean substrate',s=(.53,.60,.49),mat='ocean',rough=.018,res=64,motion=27,speed=.055)
   for j in range(9):
    ang=j*2.399;p=np.stack((.62*np.cos(t*3+ang)*np.sin(t*math.pi),t*1.3-.65,.51*np.sin(t*3+ang)*np.sin(t*math.pi)),axis=-1);self.tube('Co-evolving canopy '+str(j),p,.022*(1-t)+.008,'life',motion=32,speed=.22,phase=j)
    q=p[45];self.sphere('Photosynthetic frond '+str(j),c=q,s=(.14,.25,.045),mat='membrane',rough=.12,seed=j,res=20,motion=32,speed=.22,phase=j)
  elif i==26:
   self.sphere('Living neural soma',s=(.29,.32,.23),mat='membrane',rough=.1,res=48,motion=33,speed=.4)
   for j in range(11):
    ang=j*2.399;direction=norm([np.cos(ang),np.sin(ang),.33*np.cos(j)]);p=t[:,None]*direction*(.72+.13*np.sin(j));p+=np.stack((.06*np.sin(t*8+j),.05*np.sin(t*11+j),.05*np.sin(t*6)),axis=-1)
    self.tube('Dendritic trunk '+str(j),p,.025*(1-t)+.004,'neural',motion=34,speed=.65,phase=j)
    for k in [30,48,63]:
     start=p[k];end=start+norm([np.cos(ang+1.1),np.sin(ang+1.1),.1])*.18;q=(1-t[:,None])*start+t[:,None]*end;self.tube('Synaptic arbor %s-%s'%(j,k),q[::3],.007*(1-t[::3])+.002,'neural',motion=34,speed=.65,phase=j+k*.1)
    self.mote('Synaptic terminal '+str(j),p[-1],.022,'warm',motion=2,speed=.9,phase=j)
  elif i==27:
   self.box('Signal monolith',(-.17,-.12,0),(.27,1.18,.24),'obsidian');self.box('Ivory resonator',(.13,.03,.1),(.12,1.51,.14),'ivory',motion=35,speed=.15)
   self.arc('Parabolic reception dish',r=.42,ratio=.65,tilt=(.1,.35,.28),start=.2,end=5.8,thick=.025,mat='copper',motion=35,speed=.15)
   self.tube('Signal mast',[[.13,-.72,.1],[.13,.92,.1]],.009,'light',motion=2,speed=.4)
   for j in range(4):self.arc('Outgoing signal wave '+str(j),r=.32+j*.18,ratio=.72,tilt=(0,0,-.2),start=-.6,end=1.45,thick=.008,mat='blue',motion=36,speed=.45,phase=j*1.5)
  elif i==28:
   self.sphere('Basalt city foundation',c=(0,-.58,0),s=(.78,.22,.46),mat='stone',rough=.38,seed=28,res=48)
   for j in range(12):
    x=(j%4-1.5)*.31;z=(j//4-1)*.24;h=.30+.95*rng.random();y=-.5+h/2
    self.box('Inhabited archive tower '+str(j),(x,y,z),(.17,h,.15),'ivory' if j%3 else 'metal')
    self.box('Recessed tower crown '+str(j),(x,y+h/2+.025,z),(.11,.05,.10),'metal')
    for rib in [-1,1]:self.box('Vertical structural rib %s-%s'%(j,rib),(x+rib*.065,y,z+.084),(.012,h,.016),'metal')
    for k in range(int(h/.09)):
     self.box('Communal illumination %s-%s'%(j,k),(x,y-h/2+.06+k*.09,z+.079),(.10,.012,.005),'warm',motion=37,speed=.45,phase=j*.7+k*.9)
   for j in range(3):self.tube('Communication skybridge '+str(j),[[-.46,j*.18-.2,.17],[.46,j*.18-.18,.17]],.012,'glass',motion=38,speed=.4,phase=j)
  elif i==29:
   # An archive instrument, distinct from the ultimate open mark.
   self.box('Blackglass archive plinth',(0,-.64,0),(.95,.12,.55),'obsidian')
   for j in [-1,1]:self.box('Ceramic instrument fork '+str(j),(j*.42,-.1,0),(.10,1.0,.16),'ivory')
   for j in range(3):
    self.arc('Calibrating optical gimbal '+str(j),r=.38+j*.075,tilt=(j*.55,j*.75,.2),start=.15,end=5.8,thick=.025 if j==0 else .013,mat='gold' if j==1 else 'ivory',motion=39,speed=.12+j*.025,axis=(j*.4,1,.2))
   self.sphere('Archive optic',s=(.29,.29,.12),mat='ink',res=48)
   self.tube('Registration beam',[[0,-.49,.16],[0,.65,.16]],.006,'light',motion=2,speed=.25)
   for j in range(8):self.box('Preserved knowledge leaf '+str(j),(-.70+j*.2,-.55,.22),(.12,.03,.22),'copper',motion=40,speed=.3,phase=j)
  elif i==30:
   # Canonical orbit DNA with a genuinely open negative-space aperture.
   self.arc('ANEVUM / open ivory orbit',r=.74,ratio=.46,tilt=(.48,-.37,-.38),start=.17,end=5.91,thick=.046,mat='ivory',motion=41,speed=.12,axis=(.25,.4,1))
   self.arc('ANEVUM / ascending platinum orbit',r=.67,ratio=.42,tilt=(.45,.5,1.17),start=.30,end=5.9,thick=.027,mat='gold',motion=41,speed=-.09,axis=(.5,1,.2))
   for j in range(5):
    ang=j*TAU/5;p=np.stack(((.85-.62*t)*np.cos(ang+t*.8),(.85-.62*t)*np.sin(ang+t*.8),.16*np.sin(t*4+j)),axis=-1)
    self.tube(['Memory of form','Memory of matter','Memory of stars','Memory of worlds','Memory of life'][j],p,.008,['pearl','coral','light','blue','neural'][j],motion=42,speed=.45,phase=j)
   # Physical memories of the earlier chapters, not five interchangeable dots.
   self.sphere('Remembered pre-grain',c=(-.43,.32,.13),s=(.042,.063,.037),mat='obsidian',rough=.36,seed=30,res=16,motion=42,speed=.45,phase=0)
   self.sphere('Remembered charge',c=(.39,.30,.12),s=(.041,.052,.037),mat='coral',rough=.13,res=16,motion=42,speed=.45,phase=1)
   aa=np.linspace(0,math.pi*4,65);rr=np.linspace(.005,.075,65);self.tube('Remembered spiral',np.stack((rr*np.cos(aa)-.48,rr*np.sin(aa)*.6-.22,np.full_like(aa,.15)),-1),.004,'light',sides=4,motion=42,speed=.45,phase=2)
   self.sphere('Remembered ocean',c=(.46,-.27,.12),s=(.061,)*3,mat='ocean',rough=.02,res=24,motion=42,speed=.45,phase=3)
   for j in range(3):
    self.tube('Remembered life branch '+str(j),[[.02,-.30,.14],[.015+j*.02,-.41,.14],[-.04+j*.05,-.50,.14]],.005,'neural',motion=42,speed=.45,phase=4)
   self.mote('Continuance / deliberate new light',(0,0,.12),.074,'light',motion=43,speed=.45)
   self.tube('New outward signal',[[0,.12,.12],[.03,.57,.12],[.06,1.02,.12]],np.array([.018,.008,.001]),'warm',motion=44,speed=.5)
  # Standardize framing without flattening physical depth.
  verts=np.concatenate([p['v'] for p in self.parts]);lo=verts.min(0);hi=verts.max(0);center=(lo+hi)/2;scale=1.82/max(hi[0]-lo[0],hi[1]-lo[1],(hi[2]-lo[2])*.75)
  for p in self.parts:p['v']=(p['v']-center)*scale;p['pivot']=((np.asarray(p['pivot'])-center)*scale).tolist()
  return self

def packed_scene(scene):
 parts=[]
 for p in scene.parts:
  data=np.column_stack((p['v'],p['n'],p['uv'])).astype('<f4')
  parts.append({k:v for k,v in p.items() if k not in ['v','n','uv','f']} | {'vertices':base64.b64encode(data.tobytes()).decode(),'indices':base64.b64encode(p['f'].astype('<u2').tobytes()).decode(),'count':len(p['v'])})
 return dict(level=scene.i,parts=parts)
if __name__=='__main__':
 for i in range(1,31):
  s=Scene(i).build();print(i,len(s.parts),sum(len(p['f']) for p in s.parts),flush=True)
  (ROOT/'artwork/native'/f'level-{i:02}.scene.json').write_text(json.dumps(packed_scene(s),separators=(',',':')))
