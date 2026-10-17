/**
 * ANEVUM V062 / Continuance Institute native miniature engine.
 *
 * One shared WebGL1 context for every visible Evolution specimen. Both the
 * mesh deformation and the material/lighting GLSL come from V059 itself.
 * A compact bloom/aura/dust shader composites native 3D into DOM-sized
 * viewports; no canvas per post, fake level, or new account write exists.
 */
type ScenePart={name:string;mat:string;motion:number;speed:number;phase:number;axis:number[];pivot:number[];vertices:string;indices:string};
type Scene={level:number;parts:ScenePart[]};
type Material=[number[],number,number,number,number,number];
type Runtime={version:string;vertex:string;fragment:string;bloomVertex:string;materials:Record<string,Material>;height:string;albedo:string;accents:string[]};
type GPUPart={mat:string;motion:number;speed:number;phase:number;axis:number[];pivot:number[];vertex:WebGLBuffer;index:WebGLBuffer;count:number};
type Slot={element:HTMLElement;level:number;visible:boolean};
const root='/evolution/';
const number=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const toBytes=(str:string)=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
const PFX=String.raw`precision highp float;
varying vec2 vScreen;
uniform sampler2D uScene;
uniform vec2 uPixel;
uniform float uTime,uSeed,uDust;
uniform vec3 uTint;
float rand(float s){return fract(sin(s*91.181+uSeed*37.33)*43758.54);}
void main(){
 vec2 uv=vScreen;
 vec4 core=texture2D(uScene,uv);
 vec3 luminous=vec3(0.0);
 float bloomAlpha=0.0;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 offset=vec2(float(x),float(y));
  float weight=exp(-dot(offset,offset)*.60);
  vec4 sampleColor=texture2D(uScene,uv+offset*uPixel*7.5);
  float shine=max(max(sampleColor.r,sampleColor.g),sampleColor.b);
  float bloom=max(0.0,shine-.43)*sampleColor.a*weight*.105;
  luminous+=sampleColor.rgb*bloom;
  bloomAlpha+=bloom*.21;
 }
 float radius=length((uv-.5)*vec2(1.0,1.0));
 float radial=exp(-pow(radius/.34,3.1));
 float aura=radial*(.020+.013*(.5+.5*sin(uTime*.75+uSeed)))*uDust;
 float dust=0.0;
 for(int i=0;i<9;i++){
  float fi=float(i)+1.0;
  vec2 particle=vec2(.11+.78*rand(fi*3.2),.12+.76*rand(fi*4.9));
  particle+=.024*vec2(sin(uTime*(.22+fi*.013)+fi*1.72),cos(uTime*(.18+fi*.017)+fi*2.27));
  float d=length((uv-particle)*vec2(1.0,1.0));
  float flicker=.55+.45*sin(uTime*(.65+fi*.13)+fi*2.4);
  dust+=exp(-pow(d/.009,2.0))*(.055+.11*flicker);
 }
 dust*=uDust;
 vec3 color=clamp(core.rgb+luminous*.70+uTint*(aura+dust*.70),0.0,1.0);
 float alpha=clamp(core.a+bloomAlpha+aura*.65+dust*.42,0.0,1.0);
 gl_FragColor=vec4(color,alpha);
}`;
class MiniStage {
 private slots=new Map<HTMLElement,Slot>();
 private observer:IntersectionObserver;
 private reduced:MediaQueryList;
 private canvas:HTMLCanvasElement|null=null;
 private gl:WebGLRenderingContext|null=null;
 private program:WebGLProgram|null=null;
 private post:WebGLProgram|null=null;
 private config:Runtime|null=null;
 private mesh=new Map<number,GPUPart[]>();
 private lastUsed=new Map<number,number>();
 private generation=0;
 private requests=new Map<number,Promise<void>>();
 private failures=new Set<number>();
 private attrib:Record<string,number>={};
 private uniforms=new Map<string,WebGLUniformLocation|null>();
 private quad:WebGLBuffer|null=null;
 private quadLocation=-1;
 private fbo:WebGLFramebuffer|null=null;
 private frameTexture:WebGLTexture|null=null;
 private depth:WebGLRenderbuffer|null=null;
 private offscreenSize=0;
 private booting:Promise<void>|null=null;
 private ready=false;
 private failed=false;
 private raf=0;
 private last=0;
 private clock=0;
 private renderedFrames=0;
 private activeLast=new Set<HTMLElement>();
 private mobile=window.matchMedia('(max-width: 720px)');
 private maxFPS=30;
 private saveData=false;
 constructor(){
  this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection=navigator as Navigator & {connection?:{saveData?:boolean}};
  this.saveData=Boolean(connection.connection?.saveData);
  this.maxFPS=this.mobile.matches||this.saveData?18:30;
  this.observer=new IntersectionObserver(entries=>{
    for(const result of entries){
      const slot=this.slots.get(result.target as HTMLElement);
      if(slot)slot.visible=result.isIntersecting&&result.intersectionRatio>0;
    }
    this.schedule(true);
  },{rootMargin:'50px 0px',threshold:[0,.01,.35]});
  this.reduced.addEventListener('change',()=>this.schedule(true));
  document.addEventListener('visibilitychange',()=>this.schedule(true));
  window.addEventListener('scroll',()=>this.schedule(true),{passive:true});
  window.addEventListener('resize',()=>this.schedule(true),{passive:true});
 }
 register(element:HTMLElement,level:number){
  if(!Number.isInteger(level)||level<1||level>30)return ()=>{};
  const slot:Slot={element,level,visible:false};
  element.dataset.live='false';
  element.dataset.nativeSpecimen=String(level);
  this.slots.set(element,slot);
  this.observer.observe(element);
  this.schedule(true);
  return ()=>{
    this.observer.unobserve(element);
    element.dataset.live='false';
    this.slots.delete(element);
    if(this.slots.size===0)this.sleep();
    else this.schedule(true);
  };
 }
 private sleep(){
  cancelAnimationFrame(this.raf);this.raf=0;
  if(this.canvas)this.canvas.hidden=true;
  this.activeLast.clear();
 }
 private markIdle(){
  for(const old of this.activeLast)old.dataset.live='false';
  this.activeLast.clear();
 }
 private schedule(force=false){
  if(document.hidden||this.slots.size===0){this.sleep();this.markIdle();return;}
  if(force)this.last=0;
  if(!this.raf)this.raf=requestAnimationFrame(time=>this.frame(time));
 }
 private shader(gl:WebGLRenderingContext,type:number,code:string){
  const shader=gl.createShader(type);if(!shader)throw Error('Shader allocation unavailable');
  gl.shaderSource(shader,code);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Native shader error: '+gl.getShaderInfoLog(shader));
  return shader;
 }
 private link(gl:WebGLRenderingContext,vertex:string,fragment:string){
  const program=gl.createProgram();if(!program)throw Error('Program allocation unavailable');
  const v=this.shader(gl,gl.VERTEX_SHADER,vertex),f=this.shader(gl,gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
  gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Link failed: '+gl.getProgramInfoLog(program));
  return program;
 }
 private async setTexture(slot:number,path:string,uniformName:string){
  const gl=this.gl!,program=this.program!;
  const image=new Image();image.decoding='async';image.src=path;
  await image.decode();
  const tex=gl.createTexture();if(!tex)throw Error('Texture unavailable');
  gl.useProgram(program);gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  gl.uniform1i(gl.getUniformLocation(program,uniformName),slot);
 }
 private async boot(){
  if(this.ready||this.failed)return;
  if(this.booting)return this.booting;
  this.booting=(async()=>{
   if(typeof DecompressionStream==='undefined')throw Error('Native scene decompression unsupported');
   const result=await fetch(root+'mini-runtime.json',{credentials:'omit'});
   if(!result.ok)throw Error('Native miniature manifest unavailable');
   const config=await result.json() as Runtime;
   if(config.version!=='anevum.mini-native.v062'||config.accents.length!==30)throw Error('Unexpected miniature shader registry');
   this.config=config;
   const canvas=document.createElement('canvas');
   canvas.className='av62-native-stage';
   canvas.setAttribute('aria-hidden','true');
   Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'30',pointerEvents:'none',background:'transparent',contain:'strict',display:'block'});
   canvas.hidden=true;document.body.appendChild(canvas);this.canvas=canvas;
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.ready=false;this.markIdle();this.sleep();});
   canvas.addEventListener('webglcontextrestored',()=>{
     this.generation++;this.mesh.clear();this.lastUsed.clear();this.requests.clear();this.program=null;this.post=null;this.gl=null;
     this.canvas?.remove();this.canvas=null;this.offscreenSize=0;this.uniforms.clear();
     this.ready=false;this.booting=null;void this.boot().then(()=>this.schedule(true)).catch(()=>{this.failed=true;this.markIdle();});
   });
   const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:false,powerPreference:'low-power'});
   if(!gl)throw Error('WebGL disabled');this.gl=gl;
   this.program=this.link(gl,config.vertex,config.fragment);
   this.post=this.link(gl,config.bloomVertex,PFX);
   for(const key of ['aPosition','aNormal','aUV'])this.attrib[key]=gl.getAttribLocation(this.program,key);
   this.quadLocation=gl.getAttribLocation(this.post,'aQuad');
   const quad=gl.createBuffer();if(!quad)throw Error('Quad allocation failed');this.quad=quad;
   gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   this.fbo=gl.createFramebuffer();this.frameTexture=gl.createTexture();this.depth=gl.createRenderbuffer();
   if(!this.fbo||!this.frameTexture||!this.depth)throw Error('Glow buffers unavailable');
   gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);
   gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
   await Promise.all([this.setTexture(0,config.height,'uTexture'),this.setTexture(1,config.albedo,'uAlbedo')]);
   this.ready=true;
   canvas.hidden=false;this.schedule(true);
  })().catch(()=>{
   this.failed=true;this.ready=false;this.markIdle();
   if(this.canvas)this.canvas.hidden=true;
  }).finally(()=>{this.booting=null;});
  return this.booting;
 }
 private async request(level:number){
  if(this.mesh.has(level)||this.requests.has(level)||this.failures.has(level)||this.requests.size>=2)return;
  const promised=(async()=>{
   const response=await fetch(root+'assets/level-'+String(level).padStart(2,'0')+'-scene.gz',{credentials:'omit'});
   if(!response.ok)throw Error('Scene unavailable');
   const binary=await response.arrayBuffer();
   if(binary.byteLength>3500000)throw Error('Specimen exceeds GPU scene budget');
   const decompressed=new Blob([binary]).stream().pipeThrough(new DecompressionStream('gzip'));
   const scene=JSON.parse(await new Response(decompressed).text()) as Scene;
   if(scene.level!==level||!Array.isArray(scene.parts)||scene.parts.length===0||scene.parts.length>120)throw Error('Invalid scene geometry');
   const gl=this.gl;if(!gl||!this.ready)return;
   const sceneGeneration=this.generation;
   const mesh=scene.parts.map(p=>{
    if(!this.config?.materials[p.mat])throw Error('Unknown native material');
    const vertex=gl.createBuffer(),index=gl.createBuffer();
    if(!vertex||!index)throw Error('Buffer allocation unavailable');
    const coordinates=toBytes(p.vertices),indices=toBytes(p.indices);
    if(coordinates.length%32!==0||indices.length%2!==0)throw Error('Invalid native geometry buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,coordinates,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    return {mat:p.mat,motion:p.motion,speed:p.speed,phase:p.phase,axis:p.axis,pivot:p.pivot,vertex,index,count:indices.length/2};
   });
   mesh.sort((a,b)=>Number((this.config?.materials[a.mat][4]??1)<1)-Number((this.config?.materials[b.mat][4]??1)<1));
   if(sceneGeneration!==this.generation){for(const part of mesh){gl.deleteBuffer(part.vertex);gl.deleteBuffer(part.index);}return;}
   this.mesh.set(level,mesh);this.lastUsed.set(level,performance.now());this.trimCache();this.schedule(true);
  })().catch(()=>{this.failures.add(level);}).finally(()=>{this.requests.delete(level);});
  this.requests.set(level,promised);
 }
 private trimCache(){
  const gl=this.gl;if(!gl)return;
  const budget=this.mobile.matches||this.saveData?6:10;
  if(this.mesh.size<=budget)return;
  const visible=new Set([...this.slots.values()].filter(s=>s.visible).map(s=>s.level));
  const candidates=[...this.mesh.keys()].filter(level=>!visible.has(level))
   .sort((a,b)=>(this.lastUsed.get(a)||0)-(this.lastUsed.get(b)||0));
  for(const level of candidates){
   if(this.mesh.size<=budget)break;
   const parts=this.mesh.get(level)||[];
   for(const part of parts){gl.deleteBuffer(part.vertex);gl.deleteBuffer(part.index);}
   this.mesh.delete(level);this.lastUsed.delete(level);
  }
 }
 private resize(){
  const canvas=this.canvas!,gl=this.gl!;
  const dpr=Math.min(devicePixelRatio||1,1.5);
  const width=Math.max(1,Math.round(innerWidth*dpr)),height=Math.max(1,Math.round(innerHeight*dpr));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
  return dpr;
 }
 private bindFrame(side:number){
  const gl=this.gl!;
  if(this.offscreenSize===side)return;
  this.offscreenSize=side;
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.frameTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,side,side,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.frameTexture,0);
  gl.bindRenderbuffer(gl.RENDERBUFFER,this.depth);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,side,side);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.depth);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Native postprocess unavailable');
 }
 private uniform(name:string,...values:number[]){
  const gl=this.gl!,program=this.program!;
  if(!this.uniforms.has(name))this.uniforms.set(name,gl.getUniformLocation(program,name));
  const loc=this.uniforms.get(name)!;
  if(values.length===3)gl.uniform3f(loc,values[0],values[1],values[2]);
  else gl.uniform1f(loc,values[0]??0);
 }
 private draw(slot:Slot,rect:DOMRect,dpr:number){
  const gl=this.gl!,config=this.config!,canvas=this.canvas!,model=this.mesh.get(slot.level)!;
  this.lastUsed.set(slot.level,performance.now());
  const side=number(Math.ceil(Math.max(rect.width,rect.height)*dpr*1.8),96,180);
  this.bindFrame(side);
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);
  gl.disable(gl.SCISSOR_TEST);
  gl.viewport(0,0,side,side);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.useProgram(this.program);
  this.uniform('uTime',this.clock+slot.level*.31);
  this.uniform('uYaw',-.16+Math.sin(this.clock*.085+slot.level)*.09);
  this.uniform('uPitch',.08+Math.sin(this.clock*.11+slot.level)*.03);
  this.uniform('uZoom',1.01);
  this.uniform('uExpressive',.40);
  for(const p of model){
   const mat=config.materials[p.mat];if(!mat)continue;
   const [color,roughness,metallic,emission,alpha,family]=mat;
   this.uniform('uColor',...color);
   this.uniform('uRoughness',roughness);
   this.uniform('uMetallic',metallic);
   this.uniform('uEmission',emission);
   this.uniform('uOpacity',alpha);
   this.uniform('uFamily',family);
   this.uniform('uMode',p.motion);
   this.uniform('uSpeed',p.speed);
   this.uniform('uPhase',p.phase);
   this.uniform('uAxis',...p.axis);
   this.uniform('uPivot',...p.pivot);
   gl.bindBuffer(gl.ARRAY_BUFFER,p.vertex);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,p.index);
   for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,12],['aUV',2,24]] as const){
    const attr=this.attrib[name];if(attr<0)continue;
    gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,size,gl.FLOAT,false,32,offset);
   }
   gl.depthMask(alpha>=.99);gl.drawElements(gl.TRIANGLES,p.count,gl.UNSIGNED_SHORT,0);
  }
  gl.depthMask(true);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const x=Math.floor(rect.left*dpr),y=Math.floor((innerHeight-rect.bottom)*dpr);
  const w=Math.ceil(rect.width*dpr),h=Math.ceil(rect.height*dpr);
  if(x>=canvas.width||y>=canvas.height||x+w<=0||y+h<=0)return;
  const scX=number(x,0,canvas.width),scY=number(y,0,canvas.height);
  const scW=Math.min(x+w,canvas.width)-scX,scH=Math.min(y+h,canvas.height)-scY;
  if(scW<1||scH<1)return;
  gl.viewport(x,y,w,h);gl.enable(gl.SCISSOR_TEST);gl.scissor(scX,scY,scW,scH);
  gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.useProgram(this.post);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.frameTexture);
  gl.uniform1i(gl.getUniformLocation(this.post!,'uScene'),2);
  gl.uniform2f(gl.getUniformLocation(this.post!,'uPixel'),1/side,1/side);
  gl.uniform1f(gl.getUniformLocation(this.post!,'uTime'),this.clock);
  gl.uniform1f(gl.getUniformLocation(this.post!,'uSeed'),slot.level*3.171);
  gl.uniform1f(gl.getUniformLocation(this.post!,'uDust'),slot.level>25?1.15:.86);
  const tint=config.accents[slot.level-1]||'#c8b5d4';
  const rgb=[1,3,5].map(i=>parseInt(tint.slice(i,i+2),16)/255);
  gl.uniform3f(gl.getUniformLocation(this.post!,'uTint'),rgb[0],rgb[1],rgb[2]);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.enableVertexAttribArray(this.quadLocation);
  gl.vertexAttribPointer(this.quadLocation,2,gl.FLOAT,false,8,0);
  for(const attr of Object.values(this.attrib))if(attr>=0&&attr!==this.quadLocation)gl.disableVertexAttribArray(attr);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  gl.disable(gl.SCISSOR_TEST);
 }
 private frame(now:number){
  this.raf=0;
  if(document.hidden||!this.slots.size){this.sleep();this.markIdle();return;}
  if(this.last&&now-this.last<1000/this.maxFPS){this.schedule();return;}
  const delta=this.last?Math.min((now-this.last)/1000,.12):0;
  this.last=now;if(!this.reduced.matches)this.clock+=delta;
  const visible=[...this.slots.values()].filter(s=>s.visible&&s.element.isConnected);
  if(!visible.length){this.sleep();this.markIdle();return;}
  if(!this.ready){void this.boot();this.schedule();return;}
  const canvas=this.canvas!,gl=this.gl!;
  canvas.hidden=false;
  const dpr=this.resize(),max=this.mobile.matches?3:5;
  const select=visible.map(s=>{
   const r=s.element.getBoundingClientRect();
   const x=r.left+r.width/2,y=r.top+r.height/2;
   const top=document.elementFromPoint(number(x,0,innerWidth-1),number(y,0,innerHeight-1));
   const unobstructed=!!top&&(s.element.contains(top)||top===s.element);
   const priority=s.element.closest('.av61-identity,.ms-level,.av61-profile-level')?100:10;
   return {slot:s,rect:r,priority:priority+Math.max(0,100-Math.abs(innerHeight/2-y)/10),unobstructed};
  }).filter(v=>v.unobstructed&&v.rect.width>8&&v.rect.height>8&&v.rect.top<innerHeight&&v.rect.bottom>0).sort((a,b)=>b.priority-a.priority).slice(0,max);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.SCISSOR_TEST);
  gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const live=new Set<HTMLElement>();
  for(const v of select){
   if(!this.mesh.has(v.slot.level)){
    void this.request(v.slot.level);
    continue;
   }
   try{this.draw(v.slot,v.rect,dpr);live.add(v.slot.element);}
   catch{this.failures.add(v.slot.level);}
  }
  if(++this.renderedFrames%90===0)this.trimCache();
  for(const old of this.activeLast)if(!live.has(old))old.dataset.live='false';
  for(const el of live)el.dataset.live='true';
  this.activeLast=live;
  if(this.reduced.matches)return;
  this.schedule();
 }
}
let shared:MiniStage|null=null;
export function registerAnimatedSpecimen(element:HTMLElement,level:number):()=>void{
 if(typeof window==='undefined'||!('IntersectionObserver' in window))return ()=>{};
 if(!shared)shared=new MiniStage();
 return shared.register(element,level);
}
