"""Headless OpenGL raster renderer; same GLSL and geometry as the live web app.
Mesa EGL/llvmpipe is sufficient, no external rendering service or browser needed.
"""
import os,ctypes as C,numpy as np,math,json,time,sys,io
from PIL import Image,ImageFilter
from pathlib import Path
from geometry import Scene,MAT,ROOT
os.environ['EGL_PLATFORM']='surfaceless'
def save_image(im,path,**kwargs):
 buffer=io.BytesIO();im.save(buffer,format='WEBP' if path.suffix=='.webp' else 'PNG',**kwargs);raw=buffer.getvalue();Image.open(io.BytesIO(raw)).load();temp=path.with_suffix(path.suffix+'.pending')
 with open(temp,'wb') as f:f.write(raw);f.flush();os.fsync(f.fileno())
 temp.replace(path)

class Renderer:
 def __init__(self,size=2048):
  self.size=size;self.e=C.CDLL('libEGL.so.1');self.g=C.CDLL('libGL.so.1');e=self.e
  e.eglGetDisplay.restype=C.c_void_p;e.eglGetDisplay.argtypes=[C.c_void_p];self.d=e.eglGetDisplay(None)
  e.eglInitialize.argtypes=[C.c_void_p,C.c_void_p,C.c_void_p];a=C.c_int();b=C.c_int();assert e.eglInitialize(self.d,C.byref(a),C.byref(b))
  e.eglBindAPI(0x30A2);attrs=(C.c_int*15)(0x3033,1,0x3040,8,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038)
  e.eglChooseConfig.argtypes=[C.c_void_p,C.c_void_p,C.c_void_p,C.c_int,C.c_void_p];config=C.c_void_p();n=C.c_int();assert e.eglChooseConfig(self.d,attrs,C.byref(config),1,C.byref(n))
  e.eglCreatePbufferSurface.restype=C.c_void_p;e.eglCreatePbufferSurface.argtypes=[C.c_void_p,C.c_void_p,C.c_void_p];pa=(C.c_int*5)(0x3057,size,0x3056,size,0x3038);self.surf=e.eglCreatePbufferSurface(self.d,config,pa)
  e.eglCreateContext.restype=C.c_void_p;e.eglCreateContext.argtypes=[C.c_void_p,C.c_void_p,C.c_void_p,C.c_void_p];ca=(C.c_int*1)(0x3038);self.ctx=e.eglCreateContext(self.d,config,None,ca)
  e.eglMakeCurrent.argtypes=[C.c_void_p,C.c_void_p,C.c_void_p,C.c_void_p];assert e.eglMakeCurrent(self.d,self.surf,self.surf,self.ctx)
  self.fn('glCreateShader',C.c_uint,[C.c_uint]);self.fn('glShaderSource',None,[C.c_uint,C.c_int,C.c_void_p,C.c_void_p]);self.fn('glCompileShader',None,[C.c_uint]);self.fn('glGetShaderiv',None,[C.c_uint,C.c_uint,C.c_void_p]);self.fn('glGetShaderInfoLog',None,[C.c_uint,C.c_int,C.c_void_p,C.c_void_p]);self.fn('glCreateProgram',C.c_uint,[]);self.fn('glAttachShader',None,[C.c_uint,C.c_uint]);self.fn('glLinkProgram',None,[C.c_uint]);self.fn('glUseProgram',None,[C.c_uint]);self.fn('glGetUniformLocation',C.c_int,[C.c_uint,C.c_char_p]);self.fn('glUniform1f',None,[C.c_int,C.c_float]);self.fn('glUniform3f',None,[C.c_int,C.c_float,C.c_float,C.c_float]);self.fn('glGetAttribLocation',C.c_int,[C.c_uint,C.c_char_p]);self.fn('glVertexAttribPointer',None,[C.c_uint,C.c_int,C.c_uint,C.c_ubyte,C.c_int,C.c_void_p]);self.fn('glEnableVertexAttribArray',None,[C.c_uint]);self.fn('glDrawElements',None,[C.c_uint,C.c_int,C.c_uint,C.c_void_p]);self.fn('glClearColor',None,[C.c_float]*4);self.fn('glTexImage2D',None,[C.c_uint,C.c_int,C.c_int,C.c_int,C.c_int,C.c_int,C.c_uint,C.c_uint,C.c_void_p])
  self.program=self.g.glCreateProgram()
  for filename,kind in [('material.vert',0x8B31),('material.frag',0x8B30)]:
   code=('#version 120\n'+(ROOT/'src'/filename).read_text()).encode();shader=self.g.glCreateShader(kind);s=C.c_char_p(code);self.g.glShaderSource(shader,1,C.byref(s),None);self.g.glCompileShader(shader);ok=C.c_int();self.g.glGetShaderiv(shader,0x8B81,C.byref(ok))
   if not ok.value:
    log=C.create_string_buffer(8192);self.g.glGetShaderInfoLog(shader,8192,None,log);raise RuntimeError(log.value.decode())
   self.g.glAttachShader(self.program,shader)
  self.g.glLinkProgram(self.program);self.g.glUseProgram(self.program);self.loc={};self.attrib={n:self.g.glGetAttribLocation(self.program,n.encode()) for n in ['aPosition','aNormal','aUV']}
  self.g.glViewport(0,0,size,size);self.g.glEnable(0x0B71);self.g.glEnable(0x0BE2);self.g.glBlendFuncSeparate(0x0302,0x0303,1,0x0303)
  tex=C.c_uint();self.g.glGenTextures(1,C.byref(tex));self.g.glBindTexture(0x0DE1,tex.value);self.g.glTexParameteri(0x0DE1,0x2801,0x2601);self.g.glTexParameteri(0x0DE1,0x2800,0x2601)
  texture=ROOT/'artwork/textures/mineral-height-4096.png'
  if not texture.exists():texture=ROOT/'artwork/textures/mineral-height-web.png'
  im=np.array(Image.open(texture).convert('RGBA') if texture.exists() else Image.new('RGBA',(64,64),(127,127,127,255)),np.uint8);self.g.glTexImage2D(0x0DE1,0,0x1908,im.shape[1],im.shape[0],0,0x1908,0x1401,im.ctypes.data)
  tex2=C.c_uint();self.g.glGenTextures(1,C.byref(tex2));self.g.glActiveTexture(0x84C1);self.g.glBindTexture(0x0DE1,tex2.value);self.g.glTexParameteri(0x0DE1,0x2801,0x2601);self.g.glTexParameteri(0x0DE1,0x2800,0x2601)
  im=np.array(Image.open(ROOT/'artwork/textures/obsidian-albedo-source.jpg').convert('RGBA'),np.uint8);self.g.glTexImage2D(0x0DE1,0,0x1908,im.shape[1],im.shape[0],0,0x1908,0x1401,im.ctypes.data)
  self.g.glUniform1i(self.g.glGetUniformLocation(self.program,b'uAlbedo'),1);self.g.glActiveTexture(0x84C0)
  self.setup_post()
 def setup_post(self):
  g=self.g;self.scene_program=self.program
  self.fn('glBindFramebuffer',None,[C.c_uint,C.c_uint]);self.fn('glFramebufferTexture2D',None,[C.c_uint,C.c_uint,C.c_uint,C.c_uint,C.c_int]);self.fn('glBindRenderbuffer',None,[C.c_uint,C.c_uint]);self.fn('glRenderbufferStorage',None,[C.c_uint,C.c_uint,C.c_int,C.c_int]);self.fn('glFramebufferRenderbuffer',None,[C.c_uint,C.c_uint,C.c_uint,C.c_uint]);self.fn('glUniform2f',None,[C.c_int,C.c_float,C.c_float])
  self.fbo=C.c_uint();g.glGenFramebuffers(1,C.byref(self.fbo));g.glBindFramebuffer(0x8D40,self.fbo.value);self.scene_texture=C.c_uint();g.glGenTextures(1,C.byref(self.scene_texture));g.glActiveTexture(0x84C2);g.glBindTexture(0x0DE1,self.scene_texture.value);g.glTexImage2D(0x0DE1,0,0x1908,self.size,self.size,0,0x1908,0x1401,None);g.glTexParameteri(0x0DE1,0x2801,0x2601);g.glTexParameteri(0x0DE1,0x2800,0x2601);g.glTexParameteri(0x0DE1,0x2802,0x812F);g.glTexParameteri(0x0DE1,0x2803,0x812F);g.glFramebufferTexture2D(0x8D40,0x8CE0,0x0DE1,self.scene_texture.value,0)
  dep=C.c_uint();g.glGenRenderbuffers(1,C.byref(dep));g.glBindRenderbuffer(0x8D41,dep.value);g.glRenderbufferStorage(0x8D41,0x81A6,self.size,self.size);g.glFramebufferRenderbuffer(0x8D40,0x8D00,0x8D41,dep.value)
  self.post=g.glCreateProgram()
  for filename,kind in [('bloom.vert',0x8B31),('bloom.frag',0x8B30)]:
   code=('#version 120\n'+(ROOT/'src'/filename).read_text()).encode();shader=g.glCreateShader(kind);v=C.c_char_p(code);g.glShaderSource(shader,1,C.byref(v),None);g.glCompileShader(shader);g.glAttachShader(self.post,shader)
  g.glLinkProgram(self.post);g.glUseProgram(self.post);g.glUniform1i(g.glGetUniformLocation(self.post,b'uScene'),2);g.glUniform2f(g.glGetUniformLocation(self.post,b'uPixel'),1/self.size,1/self.size);self.quad=np.array([[-1,-1],[1,-1],[-1,1],[1,1]],np.float32);self.qa=g.glGetAttribLocation(self.post,b'aQuad');g.glBindFramebuffer(0x8D40,0);g.glUseProgram(self.scene_program);g.glActiveTexture(0x84C0)
 def postprocess(self):
  g=self.g;g.glBindFramebuffer(0x8D40,0);g.glDisable(0x0B71);g.glDisable(0x0BE2);g.glUseProgram(self.post);g.glActiveTexture(0x84C2);g.glBindTexture(0x0DE1,self.scene_texture.value);g.glEnableVertexAttribArray(self.qa);g.glVertexAttribPointer(self.qa,2,0x1406,0,8,self.quad.ctypes.data);g.glDrawArrays(5,0,4);g.glEnable(0x0B71);g.glEnable(0x0BE2);g.glUseProgram(self.scene_program);g.glActiveTexture(0x84C0)
 def fn(self,n,rest,args):f=getattr(self.g,n);f.restype=rest;f.argtypes=args
 def u(self,name,*value):
  if name not in self.loc:self.loc[name]=self.g.glGetUniformLocation(self.program,name.encode())
  if len(value)==1:self.g.glUniform1f(self.loc[name],float(value[0]))
  else:self.g.glUniform3f(self.loc[name],*map(float,value))
 def render(self,scene,t=0,yaw=-.16,pitch=.08,expressive=0,zoom=1):
  g=self.g;g.glBindFramebuffer(0x8D40,self.fbo.value);g.glClearColor(0,0,0,0);g.glClear(0x4000|0x100);self.u('uTime',t);self.u('uYaw',yaw);self.u('uPitch',pitch);self.u('uExpressive',expressive);self.u('uZoom',zoom)
  parts=sorted(scene.parts,key=lambda p:(MAT[p['mat']][4]<1,float(p['v'][:,2].mean())))
  for p in parts:
   rgb,rough,metal,em,alpha,fam=MAT[p['mat']];self.u('uColor',*rgb);self.u('uRoughness',rough);self.u('uMetallic',metal);self.u('uEmission',em);self.u('uOpacity',alpha);self.u('uFamily',fam);self.u('uMode',p['motion']);self.u('uSpeed',p['speed']);self.u('uPhase',p['phase']);self.u('uAxis',*p['axis']);self.u('uPivot',*p['pivot'])
   data=np.ascontiguousarray(np.column_stack((p['v'],p['n'],p['uv'])),dtype=np.float32);indices=np.ascontiguousarray(p['f'],dtype=np.uint16)
   for name,count,off in [('aPosition',3,0),('aNormal',3,12),('aUV',2,24)]:
    at=self.attrib[name];g.glEnableVertexAttribArray(at);g.glVertexAttribPointer(at,count,0x1406,0,32,data.ctypes.data+off)
   g.glDepthMask(alpha>=.99);g.glDrawElements(4,indices.size,0x1403,indices.ctypes.data)
  g.glDepthMask(1);self.postprocess();g.glFinish();pix=np.empty((self.size,self.size,4),np.uint8);g.glReadPixels(0,0,self.size,self.size,0x1908,0x1401,pix.ctypes.data_as(C.c_void_p));pix=np.flipud(pix)
  # GL blending yields premultiplied values; PNG requires straight alpha.
  a=pix[:,:,3:4].astype(np.float32)/255;rgb=np.clip(pix[:,:,:3].astype(np.float32)/np.maximum(a,.001),0,255).astype(np.uint8);pix=np.concatenate([rgb,pix[:,:,3:4]],2)
  return Image.fromarray(pix,'RGBA')
if __name__=='__main__':
 ids=list(map(int,sys.argv[1:])) or list(range(1,31));r=Renderer(2048)
 for i in ids:
  begin=time.time();s=Scene(i).build();im=r.render(s,t=0);save_image(im,ROOT/'artwork/masters'/f'level-{i:02}-2048.png')
  for sz in [256,512,1024]:save_image(im.resize((sz,sz),Image.Resampling.LANCZOS),ROOT/'artwork/web'/f'level-{i:02}-{sz}.webp',quality=90,method=4)
  sc=Scene(i,True).build();compact=r.render(sc,zoom=1.07)
  for sz in [32,64,128,256]:save_image(compact.resize((sz,sz),Image.Resampling.LANCZOS),ROOT/'artwork/compact'/f'level-{i:02}-{sz}.png')
  print('RENDER',i,im.getbbox(),round(time.time()-begin,2),flush=True)
