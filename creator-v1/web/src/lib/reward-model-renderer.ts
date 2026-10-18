/**
 * ANEVUM V075 / focused earned-model inspector.
 * One WebGL canvas lives INSIDE an opened reward dialog. The original V059
 * geometry and shaders are fetched only via the member-authorized media API.
 * No fixed viewport overlay, sitewide idle loop or unearned scene prefetch.
 */
type Material=[number[],number,number,number,number,number];
type Runtime={
 version:string;vertex:string;fragment:string;
 materials:Record<string,Material>;height:string;albedo:string;accents:string[]
};
type Part={
 mat:string;motion:number;speed:number;phase:number;
 axis:number[];pivot:number[];vertices:string;indices:string
};
type Scene={level:number;parts:Part[]};
type BufferPart=Omit<Part,'vertices'|'indices'> & {vertex:WebGLBuffer;index:WebGLBuffer;count:number};
const bounded=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,n));
function bytes(base64:string){
 if(typeof base64!=='string'||base64.length>2400000)throw Error('Invalid geometry encoding');
 const binary=atob(base64);
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
export function rewardModelBase(level:number,handle?:string|null){
 if(!Number.isSafeInteger(level)||level<1||level>30)throw Error('Invalid earned specimen');
 if(handle&&!/^[a-z][a-z0-9_]{2,29}$/.test(handle))throw Error('Invalid public identity');
 return handle?
  '/api/v1/members/'+handle+'/rewards/levels/'+level:
  '/api/v1/member/rewards/levels/'+level;
}
function compile(gl:WebGLRenderingContext,type:number,source:string){
 const shader=gl.createShader(type);
 if(!shader)throw Error('Native shader allocation unavailable');
 gl.shaderSource(shader,source);gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
  const detail=gl.getShaderInfoLog(shader)||'native material could not load';
  gl.deleteShader(shader);throw Error(detail.slice(0,150));
 }
 return shader;
}
function program(gl:WebGLRenderingContext,v:string,f:string){
 const shader=gl.createProgram();if(!shader)throw Error('Native model unavailable');
 const a=compile(gl,gl.VERTEX_SHADER,v),b=compile(gl,gl.FRAGMENT_SHADER,f);
 gl.attachShader(shader,a);gl.attachShader(shader,b);gl.linkProgram(shader);
 gl.deleteShader(a);gl.deleteShader(b);
 if(!gl.getProgramParameter(shader,gl.LINK_STATUS)){
  gl.deleteProgram(shader);throw Error('Native model could not initialize');
 }
 return shader;
}
async function loadTexture(gl:WebGLRenderingContext,program:WebGLProgram,url:string,unit:number,signal:AbortSignal){
 if(signal.aborted)throw Error('Cancelled');
 const image=new Image();
 image.decoding='async';
 image.referrerPolicy='same-origin';
 image.src=url;
 await image.decode();
 if(signal.aborted)throw Error('Cancelled');
 const texture=gl.createTexture();if(!texture)throw Error('Native material unavailable');
 gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
 gl.uniform1i(gl.getUniformLocation(program,unit===0?'uTexture':'uAlbedo'),unit);
 return texture;
}
async function media(url:string,signal:AbortSignal){
 const res=await fetch(url,{method:'GET',mode:'same-origin',
  credentials:'same-origin',cache:'no-store',redirect:'error',
  referrerPolicy:'same-origin',headers:{Accept:'application/json, application/gzip'},signal});
 if(!res.ok||/text\/html/i.test(res.headers.get('content-type')||''))throw Error('Earned model not available');
 return res;
}
export class RewardModelRenderer{
 private gl:WebGLRenderingContext;
 private shader:WebGLProgram|null=null;
 private runtime:Runtime|null=null;
 private parts:BufferPart[]=[];
 private textures:WebGLTexture[]=[];
 private raf=0;
 private last=0;
 private elapsed=0;
 private moving=false;
 private reduced=false;
 private yaw=-.16;
 private pitch=.08;
 private zoom=1;
 private active=false;
 constructor(private readonly canvas:HTMLCanvasElement){
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,
   depth:true,premultipliedAlpha:false,powerPreference:'high-performance'});
  if(!gl)throw Error('WebGL is unavailable in this browser');
  this.gl=gl;
  this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 }
 async load(base:string,level:number,signal:AbortSignal){
  const [runtimeRes,sceneRes]=await Promise.all([
   media(base+'/runtime',signal),media(base+'/scene',signal)]);
  if(signal.aborted)throw Error('Cancelled');
  const runtime=await runtimeRes.json() as Runtime;
  if(runtime.version!=='anevum.mini-native.v062'||
   typeof runtime.vertex!=='string'||typeof runtime.fragment!=='string'||
   !runtime.materials||!Array.isArray(runtime.accents)||runtime.accents.length!==1)
   throw Error('Invalid earned model runtime');
  const packed=await sceneRes.arrayBuffer();
  if(packed.byteLength<20||packed.byteLength>3500000||typeof DecompressionStream==='undefined')
   throw Error('Native scene unavailable in this browser');
  const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'));
  const scene=await new Response(stream).json() as Scene;
  if(scene.level!==level||!Array.isArray(scene.parts)||scene.parts.length<1||scene.parts.length>120)
   throw Error('Invalid earned model');
  this.runtime=runtime;
  const gl=this.gl;
  const shader=program(gl,runtime.vertex,runtime.fragment);
  this.shader=shader;gl.useProgram(shader);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const textures=await Promise.all([
   loadTexture(gl,shader,runtime.height,0,signal),
   loadTexture(gl,shader,runtime.albedo,1,signal)]);
  if(signal.aborted)throw Error('Cancelled');
  this.textures=textures;
  this.parts=scene.parts.map(part=>{
   if(!runtime.materials[part.mat])throw Error('Unknown model material');
   const vertices=bytes(part.vertices),indices=bytes(part.indices);
   if(vertices.byteLength%32!==0||indices.byteLength%2!==0||
    vertices.byteLength>1600000||indices.byteLength>1800000)
    throw Error('Invalid model mesh');
   const vertex=gl.createBuffer(),index=gl.createBuffer();
   if(!vertex||!index)throw Error('Native mesh could not load');
   gl.bindBuffer(gl.ARRAY_BUFFER,vertex);
   gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
   return {mat:part.mat,motion:part.motion,speed:part.speed,phase:part.phase,
    axis:part.axis,pivot:part.pivot,vertex,index,count:indices.byteLength/2};
  }).sort((a,b)=>Number(runtime.materials[a.mat][4]<1)-Number(runtime.materials[b.mat][4]<1));
  this.active=true;
  this.draw();
  this.play();
 }
 private uniform(name:string,...values:number[]){
  const gl=this.gl,location=gl.getUniformLocation(this.shader!,name);
  if(values.length===3)gl.uniform3f(location,values[0],values[1],values[2]);
  else gl.uniform1f(location,values[0]??0);
 }
 draw(){
  if(!this.active||!this.shader||!this.runtime)return;
  const canvas=this.canvas,gl=this.gl,runtime=this.runtime;
  const side=bounded(Math.round(Math.max(canvas.clientWidth,canvas.clientHeight,220)*
    Math.min(window.devicePixelRatio||1,1.6)),256,1250);
  if(canvas.width!==side||canvas.height!==side){canvas.width=side;canvas.height=side}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.viewport(0,0,side,side);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);
  gl.useProgram(this.shader);
  this.uniform('uTime',this.elapsed);this.uniform('uYaw',this.yaw);
  this.uniform('uPitch',this.pitch);this.uniform('uZoom',this.zoom);
  this.uniform('uExpressive',0);
  for(const part of this.parts){
   const [color,rough,metal,emission,alpha,family]=runtime.materials[part.mat];
   this.uniform('uColor',...color);this.uniform('uRoughness',rough);
   this.uniform('uMetallic',metal);this.uniform('uEmission',emission);
   this.uniform('uOpacity',alpha);this.uniform('uFamily',family);
   this.uniform('uMode',part.motion);this.uniform('uSpeed',part.speed);
   this.uniform('uPhase',part.phase);this.uniform('uAxis',...part.axis);
   this.uniform('uPivot',...part.pivot);
   gl.bindBuffer(gl.ARRAY_BUFFER,part.vertex);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,part.index);
   for(const [name,count,offset] of [
    ['aPosition',3,0],['aNormal',3,12],['aUV',2,24]] as const){
    const attribute=gl.getAttribLocation(this.shader,name);
    if(attribute<0)continue;
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute,count,gl.FLOAT,false,32,offset);
   }
   gl.depthMask(alpha>=.99);
   gl.drawElements(gl.TRIANGLES,part.count,gl.UNSIGNED_SHORT,0);
  }
  gl.depthMask(true);
 }
 rotate(dx:number,dy:number){
  this.yaw+=bounded(dx,-120,120)*.008;
  this.pitch=bounded(this.pitch+bounded(dy,-120,120)*.005,-1.15,1.15);
  this.draw();
 }
 setZoom(next:number){this.zoom=bounded(next,.7,1.5);this.draw()}
 getZoom(){return this.zoom}
 reset(){this.yaw=-.16;this.pitch=.08;this.zoom=1;this.draw()}
 pause(){this.moving=false;cancelAnimationFrame(this.raf);this.raf=0}
 play(){
  if(this.reduced||this.moving||!this.active)return;
  this.moving=true;this.last=0;
  const tick=(now:number)=>{
   if(!this.moving)return;
   if(this.last)this.elapsed+=Math.min(.08,(now-this.last)/1000);
   this.last=now;
   this.draw();
   this.raf=requestAnimationFrame(tick);
  };
  this.raf=requestAnimationFrame(tick);
 }
 destroy(){
  this.pause();this.active=false;
  const gl=this.gl;
  for(const p of this.parts){gl.deleteBuffer(p.vertex);gl.deleteBuffer(p.index)}
  for(const t of this.textures)gl.deleteTexture(t);
  if(this.shader)gl.deleteProgram(this.shader);
  this.parts=[];this.textures=[];this.shader=null;
 }
}
