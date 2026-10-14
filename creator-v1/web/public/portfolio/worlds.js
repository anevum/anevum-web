"use strict";
window.PORTFOLIO_SCENES = Object.freeze({
  names: ["LUMEN", "FRACTURE", "ABYSS"],
  duration: 120,
  transition: 20,
  // Original procedural 3D work: no remote images, videos, shaders or dependencies.
  fragment: String.raw`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_scroll;
uniform float u_scene;
uniform float u_blend;
#define FAR 12.0
#define STEPS 64
mat2 rotate2(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);}
float hash21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
// The first world: three floating, pierced ceramic lenses.
float lensWorld(vec3 p){
 p.xz=rotate2(u_time*.055)*p.xz;
 p.yz=rotate2(.36+sin(u_time*.13)*.045)*p.yz;
 float nearest=FAR;
 for(int i=0;i<3;i++){
  float j=float(i);
  vec3 q=p-vec3(.09*sin(j*2.4),(.9-j)*.40,.08*cos(j*1.8));
  q.xz=rotate2(j*.49+sin(u_time*.09+j)*.07)*q.xz;
  q.xy=rotate2((j-1.0)*.14)*q.xy;
  float angle=atan(q.z,q.x);
  float radius=1.18-j*.125+.105*cos(3.0*angle+j*.8);
  float disc=max(length(q.xz)-radius,abs(q.y)-(.092+.075*(1.0-smoothstep(0.0,1.3,length(q.xz)))))-.045;
  vec2 lattice=q.xz*5.6+vec2(j*.19,j*.37);
  vec2 cell=fract(lattice+vec2(.5*mod(floor(lattice.y),2.0),0.0))-.5;
  float aperture=.20-length(cell);
  disc=max(disc,aperture*.20);
  nearest=min(nearest,disc);
 }
 return nearest;
}
// The second world: rotating polygonal plates fold through one another.
float shardWorld(vec3 p){
 p.xz=rotate2(u_time*.032)*p.xz;
 float nearest=FAR;
 for(int i=0;i<10;i++){
  float j=float(i);
  float angle=j*2.39996+u_time*.022;
  float radius=.48+.088*j;
  vec3 q=p-vec3(cos(angle)*radius,sin(angle)*radius*.76,sin(j*1.73)*.45);
  q.xy=rotate2(angle+.45+sin(u_time*.10+j)*.12)*q.xy;
  q.yz=rotate2(.36+.22*sin(j*1.8+u_time*.12))*q.yz;
  float panel=sdBox(q,vec3(.46+.09*sin(j*1.3),.30+.08*cos(j*.9),.035));
  nearest=min(nearest,panel);
 }
 return nearest;
}
// The third world: red porous mass and detached fragments, suspended in cobalt.
float coralWorld(vec3 p){
 p.xy=rotate2(sin(u_time*.07)*.19)*p.xy;
 p.xz=rotate2(u_time*.048)*p.xz;
 vec3 q=p;
 q.x+=.11*sin(p.y*4.7+u_time*.20);
 q.z+=.10*sin(p.x*4.0-u_time*.13);
 float organism=length(q*vec3(1.04,.74,.96))-.82;
 organism+=.135*sin(q.x*7.8+sin(q.y*5.1))*sin(q.y*9.8+sin(q.z*5.3));
 float cavities=.077-.096*(sin(q.x*10.3)*sin(q.y*8.7)+sin(q.z*9.1)*sin(q.y*10.4));
 organism=max(organism,cavities);
 float nearest=organism;
 for(int i=0;i<6;i++){
  float j=float(i);
  float a=j*2.39996+u_time*.12;
  vec3 c=vec3(cos(a)*(1.08+.11*sin(j)),.85-j*.31,sin(a)*.85);
  float piece=length(p-c)-(.09+.07*sin(j*1.8));
  nearest=min(nearest,piece);
 }
 return nearest;
}
float sceneAt(vec3 p,float index){
 if(index<.5)return lensWorld(p);
 if(index<1.5)return shardWorld(p);
 return coralWorld(p);
}
float sceneDistance(vec3 p){
 float d=sceneAt(p,u_scene);
 if(u_blend>.00001){
  float next=u_scene>1.5?0.0:u_scene+1.0;
  // Actual distance-field interpolation reshapes the mass: never a hard cut.
  d=mix(d,sceneAt(p,next),u_blend);
 }
 return d;
}
vec3 surfaceNormal(vec3 p){
 vec2 e=vec2(.008,0.0);
 return normalize(vec3(sceneDistance(p+e.xyy)-sceneDistance(p-e.xyy),sceneDistance(p+e.yxy)-sceneDistance(p-e.yxy),sceneDistance(p+e.yyx)-sceneDistance(p-e.yyx)));
}
vec3 palette(float index){
 if(index<.5)return vec3(.72,.80,1.0);
 if(index<1.5)return vec3(1.0,.065,.42);
 return vec3(1.0,.075,.16);
}
vec3 atmosphere(float index,vec2 uv){
 if(index<.5){
  return vec3(.021,.030,.073)+vec3(.05,.065,.16)*exp(-dot(uv-vec2(.16,.02),uv-vec2(.16,.02))*1.5);
 }
 if(index<1.5){
  return vec3(.23,.001,.11)+vec3(.33,.002,.19)*exp(-dot(uv,uv)*.9);
 }
 vec3 blue=vec3(.008,.013,.30)+vec3(.009,.019,.52)*exp(-dot(uv-vec2(-.2,.09),uv-vec2(-.2,.09))*.65);
 float moon=1.0-smoothstep(.058,.065,length(uv-vec2(-.54,.44)));
 float mask=1.0-smoothstep(.06,.07,length(uv-vec2(-.512,.459)));
 blue+=vec3(.03,.10,.56)*max(0.0,moon-mask);
 return blue;
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
 float blend=clamp(u_blend,0.0,1.0);
 float next=u_scene>1.5?0.0:u_scene+1.0;
 vec3 background=mix(atmosphere(u_scene,uv),atmosphere(next,uv),blend);
 float aspect=u_resolution.x/u_resolution.y;
 float horizontal=(aspect>1.0?-.36:0.0);
 vec3 camera=vec3(u_pointer.x*.19,u_pointer.y*.15,4.45+u_scroll*.28);
 vec3 ray=normalize(vec3(uv.x*.84+horizontal-u_pointer.x*.035,uv.y*.83-u_pointer.y*.025,-2.5));
 float distanceTravelled=0.0;
 float smallest=FAR;
 float hitDistance=FAR;
 vec3 pos=camera;
 for(int i=0;i<STEPS;i++){
  pos=camera+ray*distanceTravelled;
  hitDistance=sceneDistance(pos);
  smallest=min(smallest,hitDistance);
  if(hitDistance<.004||distanceTravelled>FAR)break;
  distanceTravelled+=max(.022,hitDistance*.76);
 }
 vec3 color=background;
 vec3 colorAccent=mix(palette(u_scene),palette(next),blend);
 if(hitDistance<.055&&distanceTravelled<FAR){
  vec3 normal=surfaceNormal(pos);
  vec3 key=normalize(vec3(-.6,.95,1.4));
  float diffuse=max(dot(normal,key),0.0);
  float fill=max(dot(normal,normalize(vec3(1.1,-.4,-.4))),0.0);
  float rim=pow(1.0-max(dot(normal,-ray),0.0),2.0);
  float specular=pow(max(dot(reflect(-key,normal),-ray),0.0),18.0);
  float occlusion=clamp(sceneDistance(pos+normal*.15)/.15,.26,1.0);
  float facet=.92+.08*hash21(floor(pos.xy*26.0));
  color=colorAccent*(.37+diffuse*.74+fill*.24)*occlusion*facet;
  color+=colorAccent*rim*.78+vec3(.9,.95,1.)*specular*.64;
  if(u_scene<.5&&blend<.8)color+=vec3(.075,.1,.18)*rim;
  float haze=1.0-exp(-distanceTravelled*.032);
  color=mix(color,background,clamp(haze,.0,.40));
 } else {
  color+=colorAccent*.095*exp(-smallest*4.5);
 }
 float dust=hash21(gl_FragCoord.xy+floor(u_time*4.0))-.5;
 color+=dust*.018;
 color*=1.0-.14*dot(uv,uv);
 color=pow(max(color,0.0),vec3(.92));
 gl_FragColor=vec4(color,1.0);
}
`
});