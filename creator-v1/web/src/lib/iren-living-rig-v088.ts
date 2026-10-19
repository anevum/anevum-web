/**
 * ANEVUM / IREN V088 — articulated 3D field companion.
 *
 * This is a genuine perspective WebGL character with independently articulated
 * head, antennae, hands, shoulders, thrusters, expressive visor and orbital
 * assembly. Unlike the V087 SVG, every feature is real lit 3D geometry.
 *
 * No external engine, remote model CDN, hidden tracking or collectible model
 * assets. One renderer per mounted IREN viewport, automatically disposed.
 */
export type IrenMood="idle"|"greet"|"curious"|"guide"|"travel"|"think"|"notify"|"celebrate"|"rest";
type Mat=Float32Array;
type Geometry={buffer:WebGLBuffer;count:number};
type Finish={color:[number,number,number];metal:number;glow:number;alpha?:number};
type Primitive="sphere"|"tube"|"orbit"|"smile";
const TAU=Math.PI*2;
const clamp=(x:number,min:number,max:number)=>Math.max(min,Math.min(max,x));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
function I():Mat{return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}
function mul(a:Mat,b:Mat):Mat{
 const o=new Float32Array(16);
 for(let c=0;c<4;c++)for(let r=0;r<4;r++)
  o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
 return o;
}
function T(x:number,y:number,z:number):Mat{const m=I();m[12]=x;m[13]=y;m[14]=z;return m}
function S(x:number,y:number,z:number):Mat{const m=I();m[0]=x;m[5]=y;m[10]=z;return m}
function Rx(a:number):Mat{const m=I(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m}
function Ry(a:number):Mat{const m=I(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m}
function Rz(a:number):Mat{const m=I(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m}
function chain(...matrices:Mat[]):Mat{return matrices.reduce((a,b)=>mul(a,b),I())}
function projection(aspect:number):Mat{
 const f=1/Math.tan(Math.PI*42/360),near=.1,far=50;
 const p=new Float32Array(16);p[0]=f/aspect;p[5]=f;
 p[10]=(far+near)/(near-far);p[11]=-1;p[14]=2*far*near/(near-far);
 return mul(p,T(0,0,-4.05));
}
function surface(rings:number,segments:number,position:(u:number,v:number)=>[number,number,number]):Float32Array{
 const data:number[]=[];
 function vertex(p:[number,number,number],u:number,v:number){
  const e=.001,pu=position(Math.min(1,u+e),v),pv=position(u,Math.min(1,v+e));
  const a=[pu[0]-p[0],pu[1]-p[1],pu[2]-p[2]];
  const b=[pv[0]-p[0],pv[1]-p[1],pv[2]-p[2]];
  let nx=a[1]*b[2]-a[2]*b[1],ny=a[2]*b[0]-a[0]*b[2],nz=a[0]*b[1]-a[1]*b[0];
  const length=Math.hypot(nx,ny,nz)||1;
  nx/=length;ny/=length;nz/=length;
  // Outward normals, winding and fixed-function depth are consistent.
  if(nx*p[0]+ny*p[1]+nz*p[2]<0 && Math.abs(ny)<.999){nx=-nx;ny=-ny;nz=-nz}
  data.push(p[0],p[1],p[2],nx,ny,nz);
 }
 for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){
  const u=i/rings,u1=(i+1)/rings,v=j/segments,v1=(j+1)/segments;
  const p=position(u,v),q=position(u1,v),r=position(u,v1),s=position(u1,v1);
  vertex(p,u,v);vertex(q,u1,v);vertex(r,u,v1);
  vertex(q,u1,v);vertex(s,u1,v1);vertex(r,u,v1);
 }
 return new Float32Array(data);
}
function sphere(){
 return surface(18,28,(u,v)=>{
  const latitude=Math.PI*(u-.5),angle=TAU*v,ct=Math.cos(latitude);
  return [ct*Math.cos(angle),Math.sin(latitude),ct*Math.sin(angle)];
 });
}
function tube(){
 return surface(2,20,(u,v)=>{
  const angle=v*TAU,r=.94+(u-.5)*.13;
  return [Math.cos(angle)*r,(u-.5)*2,Math.sin(angle)*r];
 });
}
function orbit(start=0,end=TAU){
 return surface(8,54,(u,v)=>{
  const ring=start+(end-start)*v,minor=u*TAU,radius=1+.038*Math.cos(minor);
  return [Math.cos(ring)*radius,Math.sin(ring)*radius,.038*Math.sin(minor)];
 });
}
/** The existing IREN orbital mark and cobalt/near-black palette are canonical.
 * This is IREN's field embodiment, not a separate helper or authority. */
const palette:Record<string,Finish>={
 ceramic:{color:[.16,.25,.45],metal:.74,glow:0},
 chassis:{color:[.025,.055,.12],metal:.91,glow:0},
 midnight:{color:[.016,.027,.051],metal:.76,glow:0},
 visor:{color:[.024,.058,.12],metal:.69,glow:.016},
 trim:{color:[.431,.631,1.0],metal:.90,glow:.11},
 steel:{color:[.32,.45,.65],metal:.83,glow:.012},
 eye:{color:[.722,.824,1.0],metal:.22,glow:.66},
 cyan:{color:[.196,.435,1.0],metal:.35,glow:.90},
 beacon:{color:[.431,.631,1.0],metal:.27,glow:.92},
 orbit:{color:[.431,.631,1.0],metal:.65,glow:.43,alpha:.93},
 thruster:{color:[.196,.435,1.0],metal:.29,glow:.85,alpha:.77},
 mouth:{color:[.722,.824,1.0],metal:.44,glow:.46},
 shadow:{color:[.06,.21,.50],metal:.16,glow:.16,alpha:.23},
 node:{color:[.722,.824,1.0],metal:.20,glow:.95},
 spine:{color:[.196,.435,1.0],metal:.66,glow:.60},
 armor:{color:[.065,.108,.215],metal:.95,glow:0}
};
const vert=[
 "attribute vec3 aPosition;attribute vec3 aNormal;",
 "uniform mat4 uModel;uniform mat4 uView;",
 "varying vec3 vPosition;varying vec3 vNormal;",
 "void main(){vec4 p=uModel*vec4(aPosition,1.);vPosition=p.xyz;",
 "vNormal=normalize(mat3(uModel)*aNormal);gl_Position=uView*p;}"
].join("\n");
const frag=[
 "precision mediump float;",
 "varying vec3 vPosition;varying vec3 vNormal;",
 "uniform vec3 uColor;uniform float uMetal;uniform float uGlow;uniform float uAlpha;",
 "void main(){",
 "vec3 n=normalize(vNormal);vec3 eye=normalize(vec3(0.,0.,4.)-vPosition);",
 "vec3 key=normalize(vec3(-.45,.92,1.18));vec3 fill=normalize(vec3(.76,-.21,.92));",
 "float diffuse=max(dot(n,key),0.);float bounce=max(dot(n,fill),0.);",
 "vec3 halfV=normalize(key+eye);",
 "float spec=pow(max(dot(n,halfV),0.),mix(21.,135.,uMetal))*(.20+.70*uMetal);",
 "float rim=pow(1.-clamp(dot(n,eye),0.,1.),2.8);",
 "vec3 lit=uColor*(.19+.61*diffuse+.24*bounce)+vec3(.70,.83,1.)*spec;",
 "lit+=uColor*uGlow*(.79+.38*rim)+vec3(.09,.20,.52)*rim*(.08+.38*uMetal);",
 "gl_FragColor=vec4(clamp(lit,0.,1.),uAlpha);}"
].join("\n");
function shader(gl:WebGLRenderingContext,type:number,source:string):WebGLShader{
 const s=gl.createShader(type);if(!s)throw Error("IREN WebGL shader unavailable");
 gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
  const info=gl.getShaderInfoLog(s)||"IREN shader could not compile";gl.deleteShader(s);throw Error(info);
 }
 return s;
}
function program(gl:WebGLRenderingContext){
 const p=gl.createProgram();if(!p)throw Error("IREN WebGL program unavailable");
 const a=shader(gl,gl.VERTEX_SHADER,vert),b=shader(gl,gl.FRAGMENT_SHADER,frag);
 gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);
 gl.deleteShader(a);gl.deleteShader(b);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
  const info=gl.getProgramInfoLog(p)||"IREN 3D lighting unavailable";gl.deleteProgram(p);throw Error(info);
 }
 return p;
}
type Uniforms={
 model:WebGLUniformLocation|null;view:WebGLUniformLocation|null;
 color:WebGLUniformLocation|null;metal:WebGLUniformLocation|null;
 glow:WebGLUniformLocation|null;alpha:WebGLUniformLocation|null
};
export class IrenLivingRig{
 private gl:WebGLRenderingContext;
 private program:WebGLProgram;
 private meshes={} as Record<Primitive,Geometry>;
 private uniforms:Uniforms;
 private attribute:number;
 private request=0;
 private last=0;
 private seconds=0;
 private visible=true;
 private stopped=false;
 private reduced=false;
 private expanded=false;
 private mood:IrenMood="idle";
 private look:[number,number]=[0,0];
 private moodEnergy=0;
 private lightPulse=0;
 private view=I();
 private initialized=false;
 constructor(private readonly canvas:HTMLCanvasElement){
  const gl=canvas.getContext("webgl",{alpha:true,antialias:true,depth:true,
   premultipliedAlpha:false,desynchronized:true,powerPreference:"low-power"});
  if(!gl)throw Error("WebGL is unavailable");
  this.gl=gl;
  this.program=program(gl);
  this.uniforms={
   model:gl.getUniformLocation(this.program,"uModel"),
   view:gl.getUniformLocation(this.program,"uView"),
   color:gl.getUniformLocation(this.program,"uColor"),
   metal:gl.getUniformLocation(this.program,"uMetal"),
   glow:gl.getUniformLocation(this.program,"uGlow"),
   alpha:gl.getUniformLocation(this.program,"uAlpha")
  };
  this.attribute=gl.getAttribLocation(this.program,"aPosition");
  const normal=gl.getAttribLocation(this.program,"aNormal");
  if(this.attribute<0||normal<0)throw Error("IREN model attributes unavailable");
  const build=(key:Primitive,data:Float32Array)=>{
   const buffer=gl.createBuffer();if(!buffer)throw Error("IREN model buffer unavailable");
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
   this.meshes[key]={buffer,count:data.length/6};
  };
  build("sphere",sphere());build("tube",tube());build("orbit",orbit());
  build("smile",orbit(Math.PI*1.12,Math.PI*1.88));
  gl.useProgram(this.program);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  this.initialized=true;
  this.render();
 }
 setMood(mood:IrenMood){if(this.mood!==mood){this.mood=mood;this.moodEnergy=1;this.lightPulse=1;this.render()}}
 setLook(x:number,y:number){this.look=[clamp(x,-1,1),clamp(y,-1,1)];if(this.reduced)this.render()}
 setExpanded(expanded:boolean){this.expanded=expanded;this.render()}
 setReducedMotion(reduced:boolean){this.reduced=reduced;if(reduced)this.pause();this.render();if(!reduced)this.play()}
 setVisible(visible:boolean){this.visible=visible;if(visible){this.render();this.play()}else this.pause()}
 private draw(kind:Primitive,base:Mat,finish:Finish,position:[number,number,number],
  dimensions:[number,number,number],rotation:Mat=I(),brightness=0){
  const gl=this.gl,mesh=this.meshes[kind];
  const model=chain(base,T(...position),rotation,S(...dimensions));
  gl.uniformMatrix4fv(this.uniforms.model,false,model);
  gl.uniform3fv(this.uniforms.color,finish.color);
  gl.uniform1f(this.uniforms.metal,finish.metal);
  gl.uniform1f(this.uniforms.glow,finish.glow+brightness);
  gl.uniform1f(this.uniforms.alpha,finish.alpha??1);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
  gl.vertexAttribPointer(this.attribute,3,gl.FLOAT,false,24,0);
  gl.vertexAttribPointer(gl.getAttribLocation(this.program,"aNormal"),3,gl.FLOAT,false,24,12);
  gl.depthMask((finish.alpha??1)>=.99);
  gl.drawArrays(gl.TRIANGLES,0,mesh.count);
 }
 private frame= (now:number)=>{
  if(this.stopped||!this.visible||this.reduced){this.request=0;return}
  const interval=1000/(this.expanded?60:30);
  if(this.last && now-this.last<interval){this.request=requestAnimationFrame(this.frame);return}
  const delta=this.last?Math.min(.07,(now-this.last)/1000):1/60;
  this.last=now;this.seconds+=delta;
  this.moodEnergy=Math.max(0,this.moodEnergy-delta*.9);
  this.lightPulse=Math.max(0,this.lightPulse-delta*.6);
  this.render();
  this.request=requestAnimationFrame(this.frame);
 };
 play(){
  if(this.request||this.reduced||!this.visible||this.stopped)return;
  this.last=0;this.request=requestAnimationFrame(this.frame);
 }
 pause(){if(this.request)cancelAnimationFrame(this.request);this.request=0;this.last=0}
 render(){
  if(this.stopped||!this.initialized)return;
  const gl=this.gl,canvas=this.canvas,t=this.seconds;
  const width=Math.max(1,canvas.clientWidth||56),height=Math.max(1,canvas.clientHeight||56);
  const dpr=Math.min(window.devicePixelRatio||1,1.65);
  const pw=Math.min(512,Math.max(1,Math.round(width*dpr))),ph=Math.min(512,Math.max(1,Math.round(height*dpr)));
  if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
  gl.viewport(0,0,pw,ph);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(this.program);
  gl.enableVertexAttribArray(this.attribute);
  gl.enableVertexAttribArray(gl.getAttribLocation(this.program,"aNormal"));
  const aspect=pw/ph;
  this.view=projection(aspect);
  gl.uniformMatrix4fv(this.uniforms.view,false,this.view);
  const moving=!this.reduced;
  const pulse=moving?this.lightPulse:0;
  const excited=this.mood==="celebrate";
  const greeting=this.mood==="greet";
  const guiding=this.mood==="guide";
  const thinking=this.mood==="think";
  const curious=this.mood==="curious";
  const notifying=this.mood==="notify";
  const resting=this.mood==="rest";
  const flying=this.mood==="travel";
  const active=excited||greeting||guiding||thinking||curious||notifying||flying;
  const bob=(moving?Math.sin(t*2.4)*(resting?.013:.043)+
    (excited?Math.sin(t*12)*.042:0):0)-(resting?.10:0);
  const yaw= -.13+(moving?Math.sin(t*.5)*.10:0)+this.look[0]*.19+
    (flying?.32:0)+(curious?.14:0);
  const lean=(flying?-.19:.02)+(moving?Math.sin(t*1.2)*.028:0);
  const root=chain(T(0,bob,0),Ry(yaw),Rz(lean));
  // Dual counter-rotating observatory rings, not a decorative static halo.
  const halo=chain(root,T(0,-.11,-.10),Ry(moving?t*.23:.45),Rx(1.12),Rz(.23));
  const counterHalo=chain(root,T(0,-.11,-.12),Ry(moving?-t*.13:-.3),Rx(-.48));
  this.draw("orbit",halo,palette.orbit,[0,0,0],[.86,.86,.86]);
  this.draw("orbit",counterHalo,palette.steel,[0,0,0],[.79,.79,.79]);
  this.draw("sphere",halo,palette.beacon,[.86,0,0],[.063,.063,.063],I(),pulse*.42);
  this.draw("sphere",root,palette.shadow,[0,-1.18,-.12],[.60,.025,.24]);
  // Floating protective shell and genuine 3D IREN coordination mark.
  this.draw("sphere",root,palette.chassis,[0,-.26,0],[.49,.49,.37]);
  this.draw("sphere",root,palette.ceramic,[0,-.20,.12],[.43,.42,.31]);
  this.draw("sphere",root,palette.armor,[0,-.19,.38],[.27,.29,.085]);
  this.draw("sphere",root,palette.midnight,[0,-.19,.451],[.23,.25,.049]);
  this.draw("orbit",root,palette.trim,[0,-.19,.492],[.205,.205,.205],Rx(.08));
  // Central axis + three physical orbital nodes reflect IREN's locked emblem.
  this.draw("tube",root,palette.spine,[0,-.19,.506],[.021,.32,.021],I(),pulse*.4);
  this.draw("sphere",root,palette.node,[0,-.19,.529],[.050,.050,.027],I(),pulse*.5);
  const orbitalPhase=moving?t*(excited?2.5:notifying?1.25:.18):.10;
  for(let index=0;index<3;index++){
   const angle=orbitalPhase+index*TAU/3+Math.PI/2;
   const nx=.164*Math.cos(angle),ny=-.19+.164*Math.sin(angle);
   this.draw("sphere",root,palette.node,[nx,ny,.537],
    [.055,.055,.035],I(),pulse*.5+(excited?.31:0));
   this.draw("sphere",root,palette.cyan,[nx-.012,ny+.014,.565],
    [.017,.017,.011],I(),pulse*.4);
  }
  for(const side of [-1,1] as const){
   // Back stabilizer and articulated shoulder/forearm/hand assembly.
   this.draw("sphere",root,palette.steel,[side*.46,-.22,-.13],[.16,.27,.21],Rz(side*.22));
   const shoulder=chain(root,T(side*.51,-.11,.035));
   const wave=excited?-side*1.2:greeting&&side===1?-1.35:guiding&&side===1?-1.18:
    notifying&&side===1?-1.02:thinking&&side===1?-.66:
    curious&&side===1?-.35:side*.17;
   const swing=moving?Math.sin(t*(active?5:1.8)+side)*.075:0;
   const arm=chain(shoulder,Rz(wave+swing));
   this.draw("sphere",arm,palette.trim,[0,0,0],[.16,.17,.16]);
   this.draw("sphere",arm,palette.ceramic,[side*.035,-.20,.015],[.15,.30,.17],Rz(-side*.15));
   this.draw("sphere",arm,palette.midnight,[side*.05,-.39,.045],[.12,.13,.14]);
   this.draw("sphere",arm,palette.steel,[side*.05,-.40,.115],[.064,.075,.035]);
   // Floating leg-pods, with pulsed true 3D thruster cones.
   const knee=moving?Math.sin(t*2.1+side)*.085:0;
   const leg=chain(root,T(side*.265,-.65,.005),Rz(side*.11+knee));
   this.draw("sphere",leg,palette.chassis,[0,-.12,0],[.17,.27,.17]);
   this.draw("sphere",leg,palette.ceramic,[0,-.29,.028],[.21,.12,.20]);
   this.draw("tube",leg,palette.trim,[0,-.36,0],[.13,.065,.13]);
   const flame=moving?.12*Math.sin(t*6+side):0;
   this.draw("sphere",leg,palette.thruster,[0,-.46,0],[.096,.16+Math.abs(flame),.096],I(),pulse*.35);
  }
  // Independent two-axis head mount; the visor and eyes turn toward the target.
  const glance=moving?Math.sin(t*.95)*.12:0;
  const head=chain(root,T(0,.24,.02),Ry(glance+this.look[0]*.30),
    Rx(-.045-this.look[1]*.21+(thinking?-.16:0)+(curious?-.12:0)),
    Rz(curious?.09:0));
  this.draw("sphere",head,palette.trim,[0,.43,.015],[.65,.56,.49]);
  this.draw("sphere",head,palette.chassis,[0,.43,.026],[.64,.55,.495]);
  this.draw("sphere",head,palette.ceramic,[0,.48,.03],[.59,.51,.468]);
  this.draw("sphere",head,palette.visor,[0,.43,.462],[.505,.385,.085]);
  this.draw("sphere",head,palette.midnight,[0,.43,.529],[.457,.341,.041]);
  const blinking=moving&&(t%5.4>5.17&&t%5.4<5.30);
  const blink=blinking?.10:(resting?.40:1);
  const happy=excited||greeting||notifying;
  for(const side of [-1,1] as const){
   this.draw("sphere",head,palette.steel,[side*.262,.45,.562],[.172,.166,.052]);
   this.draw("sphere",head,palette.eye,[side*.262,.45,.608],[.114,.118*blink,.035],I(),pulse*.65);
   this.draw("sphere",head,palette.cyan,[side*.285,.477,.643],[.042,.04*blink,.017],I(),pulse*.3);
   this.draw("sphere",head,palette.trim,[side*.48,.17,.185],[.09,.09,.09]);
   this.draw("sphere",head,palette.cyan,[side*.48,.17,.257],[.035,.055,.028],I(),pulse*.3);
  }
  this.draw("smile",head,palette.mouth,[0,.20,.565],[.105,happy?.10:.068,.035],I(),pulse*.3);
  // Antenna and responsive sensor crystal.
  this.draw("tube",head,palette.trim,[0,.995,-.04],[.038,.16,.038]);
  this.draw("sphere",head,palette.cyan,[0,1.166,-.04],[.094,.11,.094],I(),pulse*.6);
  this.draw("sphere",head,palette.eye,[-.026,1.197,.04],[.032,.037,.022]);
  // Floating cheek orbit satellite.
  const sat=moving?t*.9:0;
  const satX=.67*Math.cos(sat),satY=.74+.11*Math.sin(sat*2);
  this.draw("sphere",head,palette.beacon,[satX,satY,-.28],[.062,.062,.062],I(),pulse*.35);
  gl.depthMask(true);
 }
 dispose(){
  this.stopped=true;this.pause();
  for(const m of Object.values(this.meshes))this.gl.deleteBuffer(m.buffer);
  this.gl.deleteProgram(this.program);
  this.meshes={} as Record<Primitive,Geometry>;
 }
}
