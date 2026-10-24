import type {WorldDocument,WorldNode,WorldCamera,Vec3,WorldMaterial} from '../../../world-composer/document.mjs';
import {createWorldSky} from './world-sky-v115';
import {buildCinematicMeshes} from './world-geometry-v117';

/** Real, locally accelerated WebGL2 editor renderer. No external assets or
 * untrusted shaders, no model inference, no server-side GPU and no HTTP calls.
 * The scene-data boundary can later swap to a maintained Three/R3F backend.
 */
type Mesh={vao:WebGLVertexArrayObject;buffer:WebGLBuffer;count:number;mode:number};
export type WorldRenderer={
 render:(scene:WorldDocument,camera:WorldCamera,selected:string|null,width:number,height:number,timeSeconds?:number)=>void;
 pick:(scene:WorldDocument,camera:WorldCamera,x:number,y:number,width:number,height:number)=>string|null;
 dispose:()=>void;
};
const vertexShader=[
 '#version 300 es','precision highp float;',
 'layout(location=0) in vec3 aPosition;','layout(location=1) in vec3 aNormal;',
 'uniform mat4 uMVP;','uniform mat4 uModel;',
 'out vec3 vNormal;','out vec3 vWorld;',
 'void main(){',
 ' vNormal=mat3(uModel)*aNormal;',
 ' vWorld=(uModel*vec4(aPosition,1.0)).xyz;',
 ' gl_Position=uMVP*vec4(aPosition,1.0);',
 '}'
].join('\n');
const fragmentShader=[
 '#version 300 es','precision highp float;',
 'in vec3 vNormal;','in vec3 vWorld;',
 'uniform vec3 uColor;','uniform float uIntensity;',
 'uniform float uAlpha;','uniform float uWater;',
 'uniform float uNight;','uniform float uTime;',
 'out vec4 outColor;','void main(){',
 ' vec3 n=normalize(vNormal);',
 ' vec3 sun=normalize(vec3(.42,.88,.49));',
 ' float diffuse=max(dot(n,sun),0.0);',
 ' float backlight=max(dot(n,vec3(-.58,.24,-.65)),0.0);',
 ' float bright=.33+.68*diffuse*clamp(uIntensity,.15,2.0);',
 ' vec3 color=uColor*bright;',
 ' color+=uColor*.16*backlight;',
 ' float stratum=.93+.07*sin(vWorld.y*2.43+vWorld.x*.6);',
 ' color*=stratum;',
 ' if(uWater>.5){',
 '  float wave=.5+.5*sin(vWorld.y*3.9+vWorld.x*6.8-uTime*2.7);',
 '  float foam=.5+.5*sin(vWorld.y*7.1-vWorld.z*5.7+uTime*1.9);',
 '  color=mix(uColor*.82,vec3(.72,.94,1.0),.39+.32*wave+.16*foam);',
 '  color+=vec3(.09,.17,.23)*pow(wave,6.0);',
 ' }',
 ' color=mix(color,color*vec3(.65,.76,1.07),uNight*.46);',
 ' color+=vec3(.065,.09,.12)*pow(1.0-abs(n.y),3.0)*(.6+.4*uIntensity);',
 ' outColor=vec4(clamp(color,0.0,1.0),uAlpha*(uWater>.5?.88:1.0));',
 '}'
].join('\n');
const pickVertex=[
 '#version 300 es','precision highp float;','layout(location=0) in vec3 aPosition;',
 'uniform mat4 uMVP;','void main(){gl_Position=uMVP*vec4(aPosition,1.0);}'
].join('\n');
const pickFragment=[
 '#version 300 es','precision highp float;','uniform vec3 uPickColor;',
 'out vec4 outColor;','void main(){outColor=vec4(uPickColor,1.0);}'
].join('\n');
const COLORS:Record<WorldMaterial,[number,number,number]>={
 stone:[.45,.54,.65],grass:[.42,.70,.54],gold:[.96,.82,.60],glass:[.76,.92,.99],
 cyan:[.47,.94,1],slate:[.49,.63,.79],violet:[.76,.53,1],water:[.58,.84,1]
};
function identity(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
function mul(a:Float32Array,b:Float32Array){
 const out=new Float32Array(16);
 for(let c=0;c<4;c++)for(let r=0;r<4;r++){
  let v=0;for(let k=0;k<4;k++)v+=a[4*k+r]*b[4*c+k];out[4*c+r]=v;
 }
 return out;
}
function translation([x,y,z]:Vec3){const m=identity();m[12]=x;m[13]=y;m[14]=z;return m;}
function scaling([x,y,z]:Vec3){const m=identity();m[0]=x;m[5]=y;m[10]=z;return m;}
function rotate([x,y,z]:Vec3){
 const sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y),sz=Math.sin(z),cz=Math.cos(z);
 const rx=new Float32Array([1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1]);
 const ry=new Float32Array([cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1]);
 const rz=new Float32Array([cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1]);
 return mul(mul(rz,ry),rx);
}
const minus=(a:Vec3,b:Vec3):Vec3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a:Vec3,b:Vec3):Vec3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a:Vec3,b:Vec3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function norm(a:Vec3):Vec3{const n=Math.hypot(...a)||1;return [a[0]/n,a[1]/n,a[2]/n];}
function perspective(aspect:number){
 const f=1/Math.tan(52*Math.PI/360),near=.1,far=160,m=new Float32Array(16);
 m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;
 m[14]=2*far*near/(near-far);return m;
}
function view(camera:WorldCamera){
 const {yaw,pitch,distance,target}=camera,cos=Math.cos(pitch);
 const eye:Vec3=[target[0]+Math.sin(yaw)*cos*distance,
  target[1]+Math.sin(pitch)*distance,target[2]+Math.cos(yaw)*cos*distance];
 const z=norm(minus(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x),m=identity();
 m[0]=x[0];m[1]=y[0];m[2]=z[0];
 m[4]=x[1];m[5]=y[1];m[6]=z[1];
 m[8]=x[2];m[9]=y[2];m[10]=z[2];
 m[12]=-dot(x,eye);m[13]=-dot(y,eye);m[14]=-dot(z,eye);
 return m;
}
function sceneMatrix(node:WorldNode,lookup:Map<string,WorldNode>,seen=new Set<string>()):Float32Array{
 const own=mul(mul(translation(node.position),rotate(node.rotation)),scaling(node.scale));
 if(node.parentId===null||seen.has(node.id))return own;
 const parent=lookup.get(node.parentId);if(!parent)return own;
 const next=new Set(seen);next.add(node.id);
 return mul(sceneMatrix(parent,lookup,next),own);
}
type Vertex=[number,number,number];
function triangle(out:number[],a:Vertex,b:Vertex,c:Vertex){
 const n=norm(cross(minus(b,a),minus(c,a)));
 for(const p of [a,b,c])out.push(...p,...n);
}
function quad(out:number[],a:Vertex,b:Vertex,c:Vertex,d:Vertex){
 triangle(out,a,b,c);triangle(out,a,c,d);
}
function cube(){
 const out:number[]=[];
 const a:Vertex=[-.5,-.5,-.5],b:Vertex=[.5,-.5,-.5],c:Vertex=[.5,.5,-.5],d:Vertex=[-.5,.5,-.5];
 const e:Vertex=[-.5,-.5,.5],f:Vertex=[.5,-.5,.5],g:Vertex=[.5,.5,.5],h:Vertex=[-.5,.5,.5];
 quad(out,e,f,g,h);quad(out,b,a,d,c);quad(out,f,b,c,g);
 quad(out,a,e,h,d);quad(out,h,g,c,d);quad(out,a,b,f,e);
 return out;
}
function sphere(){
 const out:number[]=[],rings=10,segments=16;
 const point=(i:number,j:number):Vertex=>{
  const p=Math.PI*i/rings,t=2*Math.PI*j/segments;
  return [Math.sin(p)*Math.cos(t),Math.cos(p),Math.sin(p)*Math.sin(t)];
 };
 for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){
  quad(out,point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1));
 }
 return out;
}
function outline(){
 const c:Vertex[]=[
  [-.53,-.53,-.53],[.53,-.53,-.53],[-.53,.53,-.53],[.53,.53,-.53],
  [-.53,-.53,.53],[.53,-.53,.53],[-.53,.53,.53],[.53,.53,.53]];
 const edges=[[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
 const out:number[]=[];for(const [i,j] of edges)for(const p of [c[i],c[j]])out.push(...p,0,1,0);
 return out;
}
function grid(){
 const out:number[]=[];
 for(let t=-20;t<=20;t+=2){
  for(const p of [[t,-13,-20],[t,-13,20],[-20,-13,t],[20,-13,t]])out.push(...p,0,1,0);
 }
 return out;
}
function parts(node:WorldNode):{mesh:string,transform:Float32Array,material:WorldMaterial}[]{
 const I=identity();
 const at=(point:Vec3,size:Vec3)=>mul(translation(point),scaling(size));
 if(node.kind==='island'){
  const p:{mesh:string,transform:Float32Array,material:WorldMaterial}[]=[
   {mesh:'islandRock',transform:I,material:'stone'},
   {mesh:'islandTop',transform:I,material:node.material}
  ];
  // The same canonical island node owns all decorative foliage and
  // architecture, so click-selection and undo remain deterministic.
  const trees:[number,number,number][]=[
   [-1.35,.19,-.45],[-.84,.19,.78],[.18,.19,-.89],
   [1.19,.19,.47],[1.45,.19,-.55]
  ];
  for(const [i,[x,y,z]] of trees.entries()){
   const size=[.72,.89,.64,.79,.57][i];
   p.push({mesh:'cube',transform:at([x,y+.33*size,z],[.13*size,.7*size,.13*size]),material:'slate'});
   p.push({mesh:'canopy',transform:at([x,y+.98*size,z],[.62*size,.67*size,.59*size]),material:'grass'});
   p.push({mesh:'sphere',transform:at([x,y+1.35*size,z],[.09,.09,.09]),material:'cyan'});
  }
  p.push({mesh:'cube',transform:at([.08,.23,-.06],[1.42,.19,1.32]),material:'stone'});
  p.push({mesh:'gatewayArch',transform:at([.05,.33,-.58],[.27,.34,.27]),material:'gold'});
  for(const z of [-1.1,1.1])p.push({mesh:'cube',transform:at([-.35,.27,z],[.95,.13,.15]),material:'glass'});
  return p;
 }
 if(node.kind==='spire'){
  const p:{mesh:string,transform:Float32Array,material:WorldMaterial}[]=[
   {mesh:'tower',transform:I,material:node.material},
   {mesh:'towerCollar',transform:I,material:'gold'},
   {mesh:'cube',transform:at([0,-.25,0],[1.82,.24,1.82]),material:'stone'},
   {mesh:'cube',transform:at([0,.36,0],[1.52,.12,1.52]),material:'slate'}
  ];
  for(const [x,z] of [[-.53,-.53],[.53,-.53],[-.53,.53],[.53,.53]] as [number,number][]){
   p.push({mesh:'cube',transform:at([x,1.4,z],[.11,2.7,.11]),material:'glass'});
   p.push({mesh:'sphere',transform:at([x,2.78,z],[.13,.13,.13]),material:'cyan'});
  }
  for(const y of [1.04,1.66,2.28,3.09]){
   p.push({mesh:'cube',transform:at([0,y,-.72],[.52,.12,.06]),material:'cyan'});
   p.push({mesh:'cube',transform:at([0,y,.72],[.52,.12,.06]),material:'cyan'});
  }
  p.push({mesh:'sphere',transform:at([0,4.64,0],[.20,.23,.20]),material:'cyan'});
  return p;
 }
 if(node.kind==='bridge'){
  const p:{mesh:string,transform:Float32Array,material:WorldMaterial}[]=[
   {mesh:'cube',transform:at([0,0,0],[10,.25,1.1]),material:'stone'},
   {mesh:'bridgeArch',transform:I,material:node.material}
  ];
  for(const z of [-.56,.56]){
   p.push({mesh:'cube',transform:at([0,.94,z],[10,.12,.10]),material:'gold'});
   for(const x of [-4.75,-3.7,-2.65,-1.60,-.55,.55,1.6,2.65,3.7,4.75])
    p.push({mesh:'cube',transform:at([x,.52,z],[.09,.85,.09]),material:'glass'});
  }
  return p;
 }
 if(node.kind==='waterfall'){
  return [
   {mesh:'waterRibbon',transform:I,material:node.material},
   {mesh:'waterRibbon',transform:at([.42,-.18,-.26],[.36,.95,.82]),material:node.material},
   {mesh:'sphere',transform:at([0,-6.58,0],[1.03,.25,1.0]),material:'cyan'}
  ];
 }
 if(node.kind==='starship'){
  return [
   {mesh:'craftHull',transform:I,material:node.material},
   {mesh:'craftFins',transform:I,material:'slate'},
   {mesh:'sphere',transform:at([-.38,.29,0],[.78,.30,.49]),material:'glass'},
   {mesh:'sphere',transform:at([-1.66,0,-.19],[.15,.15,.15]),material:'cyan'},
   {mesh:'sphere',transform:at([-1.66,0,.19],[.15,.15,.15]),material:'cyan'},
   {mesh:'cube',transform:at([.79,-.09,0],[.73,.09,.9]),material:'gold'}
  ];
 }
 if(node.kind==='light')return [{mesh:'sphere',transform:scaling([.52,.52,.52]),material:node.material}];
 if(node.kind==='sphere')return [{mesh:'sphere',transform:I,material:node.material}];
 return [{mesh:'cube',transform:I,material:node.material}];
}
function compile(gl:WebGL2RenderingContext,kind:number,source:string){
 const shader=gl.createShader(kind);if(!shader)throw Error('No shader allocation');
 gl.shaderSource(shader,source);gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
  const reason=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error('GPU shader: '+reason);
 }
 return shader;
}
function makeProgram(gl:WebGL2RenderingContext,v:string,f:string){
 const p=gl.createProgram();if(!p)throw Error('No GPU program');
 const a=compile(gl,gl.VERTEX_SHADER,v),b=compile(gl,gl.FRAGMENT_SHADER,f);
 gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);
 gl.deleteShader(a);gl.deleteShader(b);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
  const reason=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw Error('GPU link: '+reason);
 }
 return p;
}
function makeMesh(gl:WebGL2RenderingContext,positions:number[],mode:number=gl.TRIANGLES):Mesh{
 const vao=gl.createVertexArray(),buffer=gl.createBuffer();
 if(!vao||!buffer)throw Error('No GPU mesh allocation');
 gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
 gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
 gl.bindVertexArray(null);
 return {vao,buffer,count:positions.length/6,mode};
}
export function createWorldRenderer(canvas:HTMLCanvasElement):WorldRenderer{
 const candidate=canvas.getContext('webgl2',{alpha:true,depth:true,antialias:true,preserveDrawingBuffer:false});
 if(!candidate)throw Error('WebGL2 not available');
 const gl:WebGL2RenderingContext=candidate;
 const prog=makeProgram(gl,vertexShader,fragmentShader);
 const picker=makeProgram(gl,pickVertex,pickFragment);
 const sky=createWorldSky(gl);
 const meshes=new Map<string,Mesh>(),geometry=buildCinematicMeshes();
 for(const [name,positions,mode] of [
  ['cube',cube(),gl.TRIANGLES],['sphere',sphere(),gl.TRIANGLES],
  ...Object.entries(geometry).map(([name,data]):[string,number[],number]=>[name,data,gl.TRIANGLES]),
  ['outline',outline(),gl.LINES],['grid',grid(),gl.LINES]] as [string,number[],number][])
  meshes.set(name,makeMesh(gl,positions,mode));
 const mvp=gl.getUniformLocation(prog,'uMVP'),model=gl.getUniformLocation(prog,'uModel'),
  color=gl.getUniformLocation(prog,'uColor'),intensity=gl.getUniformLocation(prog,'uIntensity'),
  alpha=gl.getUniformLocation(prog,'uAlpha'),water=gl.getUniformLocation(prog,'uWater'),
  time=gl.getUniformLocation(prog,'uTime'),night=gl.getUniformLocation(prog,'uNight'),
  pickMvp=gl.getUniformLocation(picker,'uMVP'),pickColor=gl.getUniformLocation(picker,'uPickColor');
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 gl.disable(gl.CULL_FACE);
 let disposed=false,lastTime=0;
 function draw(scene:WorldDocument,camera:WorldCamera,selected:string|null,width:number,height:number,picking=false,timeSeconds=0){
  if(disposed||gl.isContextLost())return;
  const ratio=Math.max(1,Math.min(window.devicePixelRatio||1,width<=680?1.5:2));
  const w=Math.max(1,Math.floor(width*ratio)),h=Math.max(1,Math.floor(height*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  if(!picking)sky.render(w,h,camera.yaw,scene.environment.sky==='night',scene.environment.sunIntensity,timeSeconds);
  const vp=mul(perspective(Math.max(.25,width/Math.max(1,height))),view(camera));
  const lookup=new Map(scene.nodes.map(n=>[n.id,n]));
  gl.useProgram(picking?picker:prog);
  if(picking){gl.disable(gl.DITHER);gl.disable(gl.BLEND);}
  else{gl.uniform1f(intensity,scene.environment.sunIntensity);gl.uniform1f(alpha,1);
   gl.uniform1f(time,timeSeconds);gl.uniform1f(night,scene.environment.sky==='night'?1:0);}
  const drawMesh=(name:string,mat:Float32Array,material:WorldMaterial,index=-1)=>{
   const m=meshes.get(name);if(!m)return;
   gl.uniformMatrix4fv(picking?pickMvp:mvp,false,mul(vp,mat));
   if(picking)gl.uniform3f(pickColor,(index+1)/255,0,0);
   else{gl.uniformMatrix4fv(model,false,mat);gl.uniform3fv(color,COLORS[material]);
    gl.uniform1f(water,name==='waterRibbon'||material==='water'?1:0);}
   gl.bindVertexArray(m.vao);gl.drawArrays(m.mode,0,m.count);
  };
  if(!picking){gl.uniform1f(alpha,.17);drawMesh('grid',identity(),'cyan');gl.uniform1f(alpha,1);}
  const animatedModel=(n:WorldNode)=>{
   const base=sceneMatrix(n,lookup);
   return n.kind==='starship'?mul(base,translation([0,.12*Math.sin(timeSeconds*.9),0])):base;
  };
  scene.nodes.forEach((n,index)=>{
   const base=animatedModel(n);
   for(const part of parts(n))drawMesh(part.mesh,mul(base,part.transform),part.material,index);
  });
  if(!picking&&selected){
   const n=lookup.get(selected);
   if(n){
    const bounds:Vec3=n.kind==='island'?[4.3,3.3,3.5]:
      n.kind==='bridge'?[10.4,.7,1.2]:n.kind==='waterfall'?[1.15,6.3,.9]:
      n.kind==='spire'?[1.95,5.3,1.95]:n.kind==='starship'?[5.2,1.8,4.8]:[1.4,1.4,1.4];
    const offset:Vec3=n.kind==='spire'?[0,2.1,0]:[0,0,0];
    const modelOutline=mul(animatedModel(n),mul(translation(offset),scaling(bounds)));
    gl.disable(gl.DEPTH_TEST);
    drawMesh('outline',modelOutline,'cyan');
    gl.enable(gl.DEPTH_TEST);
   }
  }
  gl.bindVertexArray(null);
  if(picking){gl.enable(gl.DITHER);gl.enable(gl.BLEND);}
 }
 return {
  render(scene,camera,selected,width,height,timeSeconds=0){lastTime=timeSeconds;draw(scene,camera,selected,width,height,false,timeSeconds);},
  pick(scene,camera,x,y,width,height){
   if(disposed||gl.isContextLost()||width<=0||height<=0)return null;
   draw(scene,camera,null,width,height,true,lastTime);
   const pixel=new Uint8Array(4);
   const px=Math.max(0,Math.min(canvas.width-1,Math.floor(x/width*canvas.width)));
   const py=Math.max(0,Math.min(canvas.height-1,Math.floor((height-y)/height*canvas.height)));
   gl.readPixels(px,py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
   draw(scene,camera,null,width,height,false,lastTime);
   const index=pixel[0]-1;
   return index>=0&&index<scene.nodes.length?scene.nodes[index].id:null;
  },
  dispose(){
   if(disposed)return;disposed=true;
   if(!gl.isContextLost()){
    for(const m of meshes.values()){gl.deleteVertexArray(m.vao);gl.deleteBuffer(m.buffer);}
    sky.dispose();gl.deleteProgram(prog);gl.deleteProgram(picker);
   }
  }
 };
}
