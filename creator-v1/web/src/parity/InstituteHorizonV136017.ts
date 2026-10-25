/**
 * PARITY V136.017.008 / First-party planetary horizon candidate.
 *
 * QA-only, optional atmosphere inside the existing InstituteRendererV136
 * scene/canvas. No additional GPU context, external textures, network, user
 * activity, licensed video or private data. This is NOT approved concept
 * parity or a replacement for the review-only Blender master.
 */
import * as T from 'three';
import type {AssetTier} from './InstituteAssetManifestV136';

const planetVertex=`
varying vec3 vHorizonNormal;
varying vec3 vHorizonPosition;
void main(){
 vec4 world=modelMatrix*vec4(position,1.0);
 vHorizonPosition=world.xyz;
 vHorizonNormal=normalize(mat3(modelMatrix)*normal);
 gl_Position=projectionMatrix*viewMatrix*world;
}
`;
const noiseFunctions=`
float horizonHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float horizonNoise(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(horizonHash(i),horizonHash(i+vec3(1,0,0)),f.x),
                mix(horizonHash(i+vec3(0,1,0)),horizonHash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(horizonHash(i+vec3(0,0,1)),horizonHash(i+vec3(1,0,1)),f.x),
                mix(horizonHash(i+vec3(0,1,1)),horizonHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
`;
const planetFragment=`
precision highp float;
varying vec3 vHorizonNormal;
varying vec3 vHorizonPosition;
uniform float uPublicDensity;
`+noiseFunctions+`
void main(){
 vec3 n=normalize(vHorizonNormal);
 vec3 eye=normalize(cameraPosition-vHorizonPosition);
 vec3 star=normalize(vec3(-0.7,0.78,0.48));
 float daylight=max(0.0,dot(n,star));
 float limb=pow(1.0-max(0.0,dot(n,eye)),3.2);
 float layer=horizonNoise(n*6.4)+0.35*horizonNoise(n*14.0);
 float bands=0.5+0.5*sin(n.y*34.0+n.x*6.0+layer*7.0);
 float cloud=horizonNoise(n*18.0+vec3(1.7,0.2,0.8));
 vec3 cobalt=vec3(0.035,0.075,0.22);
 vec3 violet=vec3(0.21,0.13,0.43);
 vec3 upper=vec3(0.1,0.24,0.48);
 vec3 body=mix(cobalt,violet,clamp(bands*.74+layer*.19,0.0,1.0));
 body=mix(body,upper,smoothstep(0.52,0.78,cloud)*.54);
 body*=0.42+0.85*daylight;
 body+=vec3(0.13,0.24,0.56)*limb*(0.6+uPublicDensity*.08);
 body+=vec3(0.09,0.06,0.21)*pow(bands,5.0)*daylight;
 gl_FragColor=vec4(body,1.0);
}
`;
const atmosphereFragment=`
precision highp float;
varying vec3 vHorizonNormal;
varying vec3 vHorizonPosition;
uniform float uPublicDensity;
void main(){
 vec3 n=normalize(vHorizonNormal),eye=normalize(cameraPosition-vHorizonPosition);
 float edge=pow(1.0-max(0.0,dot(n,eye)),3.8);
 float alpha=clamp(edge*(0.46+uPublicDensity*.045),0.0,0.58);
 vec3 glow=mix(vec3(.17,.46,.86),vec3(.46,.24,.82),0.58+0.42*n.y);
 gl_FragColor=vec4(glow*1.4,alpha);
}
`;

export const HORIZON_QA_BUDGET={
 desktop:{triangles:18000,drawCalls:4},
 mobile:{triangles:7000,drawCalls:4}
} as const;

/** Independently disposable optional root: never enters the four-family GLB
 * cache and never becomes an unreviewed generic site-wide data source.
 */
export function createInstituteHorizon(tier:AssetTier){
 const mobile=tier==='mobile';
 const latitude=mobile?22:42,longitude=mobile?40:72;
 const root=new T.Group();
 root.name='QA / CONTINUANCE PLANETARY HORIZON';
 root.position.set(mobile?10:17,12,-35);
 const signal={value:0};
 const body=new T.Mesh(
  new T.SphereGeometry(14.6,longitude,latitude),
  new T.ShaderMaterial({vertexShader:planetVertex,fragmentShader:planetFragment,
   uniforms:{uPublicDensity:signal},fog:false,depthWrite:true,toneMapped:false})
 );
 body.name='Original gas giant / no texture or telemetry';
 root.add(body);
 const atmosphere=new T.Mesh(
  new T.SphereGeometry(14.91,longitude,latitude),
  new T.ShaderMaterial({vertexShader:planetVertex,fragmentShader:atmosphereFragment,
   uniforms:{uPublicDensity:signal},transparent:true,depthWrite:false,
   blending:T.AdditiveBlending,fog:false,toneMapped:false})
 );
 atmosphere.name='Atmospheric limb';
 root.add(atmosphere);
 const orbits=new T.Group();orbits.rotation.set(.41,-.12,.22);
 orbits.name='Two engineered auric observation rings';
 for(const [radius,tube,opacity,color] of [
  [19.9,.060,.36,0x9ed6ff],[22.3,.033,.22,0xb393ef]
 ] as const){
  const ring=new T.Mesh(
   new T.TorusGeometry(radius,tube,mobile?4:6,mobile?72:144),
   new T.MeshBasicMaterial({color,transparent:true,opacity,
    depthWrite:false,blending:T.AdditiveBlending,fog:false,toneMapped:false})
  );
  ring.rotation.set(.58,.16,.28);
  orbits.add(ring);
 }
 root.add(orbits);
 root.updateMatrixWorld(true);
 const triangles=root.children.reduce((n,child)=>{
  if(child instanceof T.Group)
   return n+child.children.reduce((sum,mesh)=>sum+(mesh instanceof T.Mesh?
    (mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3:0),0);
  return n+(child instanceof T.Mesh?
   (child.geometry.index?.count??child.geometry.attributes.position.count)/3:0);
 },0);
 const budget=HORIZON_QA_BUDGET[tier];
 if(triangles>budget.triangles||root.children.length>budget.drawCalls){
  root.traverse(object=>{
   if(object instanceof T.Mesh){
    object.geometry.dispose();
    if(Array.isArray(object.material))object.material.forEach(m=>m.dispose());
    else object.material.dispose();
   }
  });
  throw Error('Planetary QA environment exceeds fixed geometry budget');
 }
 return {
  root,triangles,drawCalls:4,
  update(publicDensity:number,elapsedSeconds:number,motionAllowed:boolean){
   signal.value=Math.max(0,Math.min(1,Number.isFinite(publicDensity)?publicDensity:0));
   if(motionAllowed)orbits.rotation.z=.22+Math.sin(elapsedSeconds*.024)*.035;
  },
  dispose(){
   root.traverse(object=>{
    if(object instanceof T.Mesh){
     object.geometry.dispose();
     if(Array.isArray(object.material))object.material.forEach(material=>material.dispose());
     else object.material.dispose();
    }
   });
   root.clear();
  }
 };
}
