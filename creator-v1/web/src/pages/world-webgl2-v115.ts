import type {WorldDocument,WorldNode,WorldCamera,Vec3,WorldMaterial} from '../../../world-composer/document.mjs';

/** Real, locally accelerated WebGL2 editor renderer. No external assets or
 * untrusted shaders, no model inference, no server-side GPU and no HTTP calls.
 * The scene-data boundary can later swap to a maintained Three/R3F backend.
 */
type Mesh={vao:WebGLVertexArrayObject;buffer:WebGLBuffer;count:number;mode:number};
export type WorldRenderer={
 render:(scene:WorldDocument,camera:WorldCamera,selected:string|null,width:number,height:number)=>void;
 pick:(scene:WorldDocument,camera:WorldCamera,x:number,y:number,width:number,height:number)=>string|null;
 dispose:()=>void;
};
const vertexShader=[
 '#version 300 es','precision highp float;',
 'layout(location=0) in vec3 aPosition;','layout(location=1) in vec3 aNormal;',
 'uniform mat4 uMVP;','uniform mat4 uModel;','out vec3 vNormal;',
 'void main(){vNormal=mat3(uModel)*aNormal;gl_Position=uMVP*vec4(aPosition,1.0);}'
].join('\n');
const fragmentShader=[
 '#version 300 es','precision highp float;','in vec3 vNormal;',
 'uniform vec3 uColor;','uniform float uIntensity;','uniform float uAlpha;',
 'out vec4 outColor;','void main(){',
 'float light=max(dot(normalize(vNormal),normalize(vec3(.38,.84,.55))),0.0);',
 'float shading=.49+light*.51*max(.15,uIntensity);',
 'outColor=vec4(uColor*shading,uAlpha);','}'
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
 stone:[.47,.56,.64],grass:[.37,.65,.50],gold:[.89,.76,.56],glass:[.72,.88,.95],
 cyan:[.39,.85,1],slate:[.45,.61,.74],violet:[.70,.48,.94],water:[.45,.81,.99]
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
function island(){
 const rock:number[]=[],top:number[]=[],count=10;
 const ring=(i:number,y:number,factor=1):Vertex=>{
  const t=2*Math.PI*i/count;return [Math.cos(t)*2*factor,y,Math.sin(t)*1.6*factor];
 };
 for(let i=0;i<count;i++){
  const j=(i+1)%count;
  triangle(top,[0,.22,0],ring(j,.22),ring(i,.22));
  triangle(rock,ring(i,.21),ring(j,.21),[0,-2.55,0]);
 }
 return {rock,top};
}
function tower(){
 const out:number[]=[],count=8;
 const ring=(i:number,y:number,r:number):Vertex=>{
  const t=2*Math.PI*i/count;return [Math.cos(t)*r,y,Math.sin(t)*r];
 };
 for(let i=0;i<count;i++){
  const j=(i+1)%count;
  quad(out,ring(i,-.25,.65),ring(j,-.25,.65),ring(j,3.0,.4),ring(i,3.0,.4));
  triangle(out,ring(i,3.0,.4),ring(j,3.0,.4),[0,4.5,0]);
 }
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
 if(node.kind==='island')return [{mesh:'islandRock',transform:I,material:'stone'},
  {mesh:'islandTop',transform:I,material:'grass'}];
 if(node.kind==='spire')return [{mesh:'tower',transform:I,material:node.material}];
 if(node.kind==='bridge')return [{mesh:'cube',transform:scaling([10,.2,.75]),material:node.material}];
 if(node.kind==='waterfall')return [{mesh:'cube',transform:scaling([.8,6,.5]),material:'water'}];
 if(node.kind==='light')return [{mesh:'sphere',transform:scaling([.52,.52,.52]),material:'cyan'}];
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
 const gl=canvas.getContext('webgl2',{alpha:true,depth:true,antialias:true,preserveDrawingBuffer:false});
 if(!gl)throw Error('WebGL2 not available');
 const prog=makeProgram(gl,vertexShader,fragmentShader);
 const picker=makeProgram(gl,pickVertex,pickFragment);
 const meshes=new Map<string,Mesh>(),islandParts=island();
 for(const [name,positions,mode] of [
  ['cube',cube(),gl.TRIANGLES],['tower',tower(),gl.TRIANGLES],
  ['sphere',sphere(),gl.TRIANGLES],['islandTop',islandParts.top,gl.TRIANGLES],
  ['islandRock',islandParts.rock,gl.TRIANGLES],['outline',outline(),gl.LINES],
  ['grid',grid(),gl.LINES]] as [string,number[],number][])
  meshes.set(name,makeMesh(gl,positions,mode));
 const mvp=gl.getUniformLocation(prog,'uMVP'),model=gl.getUniformLocation(prog,'uModel'),
  color=gl.getUniformLocation(prog,'uColor'),intensity=gl.getUniformLocation(prog,'uIntensity'),
  alpha=gl.getUniformLocation(prog,'uAlpha'),
  pickMvp=gl.getUniformLocation(picker,'uMVP'),pickColor=gl.getUniformLocation(picker,'uPickColor');
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 gl.disable(gl.CULL_FACE);
 let disposed=false;
 function draw(scene:WorldDocument,camera:WorldCamera,selected:string|null,width:number,height:number,picking=false){
  if(disposed||gl.isContextLost())return;
  const ratio=Math.max(1,Math.min(window.devicePixelRatio||1,width<=680?1.5:2));
  const w=Math.max(1,Math.floor(width*ratio)),h=Math.max(1,Math.floor(height*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const vp=mul(perspective(Math.max(.25,width/Math.max(1,height))),view(camera));
  const lookup=new Map(scene.nodes.map(n=>[n.id,n]));
  gl.useProgram(picking?picker:prog);
  if(picking){gl.disable(gl.DITHER);gl.disable(gl.BLEND);}
  else{gl.uniform1f(intensity,scene.environment.sunIntensity);gl.uniform1f(alpha,1);}
  const drawMesh=(name:string,mat:Float32Array,material:WorldMaterial,index=-1)=>{
   const m=meshes.get(name);if(!m)return;
   gl.uniformMatrix4fv(picking?pickMvp:mvp,false,mul(vp,mat));
   if(picking)gl.uniform3f(pickColor,(index+1)/255,0,0);
   else{gl.uniformMatrix4fv(model,false,mat);gl.uniform3fv(color,COLORS[material]);}
   gl.bindVertexArray(m.vao);gl.drawArrays(m.mode,0,m.count);
  };
  if(!picking){gl.uniform1f(alpha,.17);drawMesh('grid',identity(),'cyan');gl.uniform1f(alpha,1);}
  scene.nodes.forEach((n,index)=>{
   const base=sceneMatrix(n,lookup);
   for(const part of parts(n))drawMesh(part.mesh,mul(base,part.transform),part.material,index);
  });
  if(!picking&&selected){
   const n=lookup.get(selected);
   if(n){
    const bounds:Vec3=n.kind==='island'?[4.3,3.3,3.5]:
      n.kind==='bridge'?[10.4,.7,1.2]:n.kind==='waterfall'?[1.15,6.3,.9]:
      n.kind==='spire'?[1.7,5.2,1.7]:[1.4,1.4,1.4];
    const offset:Vec3=n.kind==='spire'?[0,2.1,0]:[0,0,0];
    const modelOutline=mul(sceneMatrix(n,lookup),mul(translation(offset),scaling(bounds)));
    gl.disable(gl.DEPTH_TEST);
    drawMesh('outline',modelOutline,'cyan');
    gl.enable(gl.DEPTH_TEST);
   }
  }
  gl.bindVertexArray(null);
  if(picking){gl.enable(gl.DITHER);gl.enable(gl.BLEND);}
 }
 return {
  render(scene,camera,selected,width,height){draw(scene,camera,selected,width,height);},
  pick(scene,camera,x,y,width,height){
   if(disposed||gl.isContextLost()||width<=0||height<=0)return null;
   draw(scene,camera,null,width,height,true);
   const pixel=new Uint8Array(4);
   const px=Math.max(0,Math.min(canvas.width-1,Math.floor(x/width*canvas.width)));
   const py=Math.max(0,Math.min(canvas.height-1,Math.floor((height-y)/height*canvas.height)));
   gl.readPixels(px,py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
   draw(scene,camera,null,width,height);
   const index=pixel[0]-1;
   return index>=0&&index<scene.nodes.length?scene.nodes[index].id:null;
  },
  dispose(){
   if(disposed)return;disposed=true;
   if(!gl.isContextLost()){
    for(const m of meshes.values()){gl.deleteVertexArray(m.vao);gl.deleteBuffer(m.buffer);}
    gl.deleteProgram(prog);gl.deleteProgram(picker);
   }
  }
 };
}
