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
import type {createInstituteCitadels} from './InstituteCitadelsV136017';

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
 // Exactly three procedural noise samples, concentrated in latitude-flow
 // bands rather than high-frequency mottling. The distant planet is a
 // backdrop to authored architecture, never a foreground UI obstruction.
 float weather=horizonNoise(n*3.8);
 float filament=horizonNoise(n*14.0+vec3(weather*2.1,n.y*6.0,1.7));
 float detail=horizonNoise(n*37.0+vec3(filament*.9,weather*.5,.8));
 float flow=n.y*31.0+(weather-.5)*7.0+(filament-.5)*2.5;
 float belts=.5+.5*sin(flow);
 float sediment=smoothstep(.56,.91,belts);
 float cloud=smoothstep(.55,.82,filament+detail*.10);
 vec3 abyss=vec3(.016,.030,.072);
 vec3 cobalt=vec3(.075,.126,.218);
 vec3 silver=vec3(.19,.25,.34);
 vec3 body=mix(abyss,cobalt,belts*.72+weather*.13);
 body=mix(body,silver,cloud*.17+sediment*.16);
 body+=vec3(.17,.11,.07)*pow(sediment,5.0)*(.18+.35*detail)*daylight;
 body*=.30+.94*daylight;
 body+=vec3(.13,.23,.49)*limb*(.65+uPublicDensity*.07);
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
 desktop:{triangles:25000,drawCalls:10},
 mobile:{triangles:10000,drawCalls:10}
} as const;

/** Independently disposable optional root: never enters the four-family GLB
 * cache and never becomes an unreviewed generic site-wide data source.
 */
export function createInstituteHorizon(tier:AssetTier,citadelFactory:typeof createInstituteCitadels){
 const mobile=tier==='mobile';
 const latitude=mobile?20:36,longitude=mobile?36:60;
 const root=new T.Group();
 root.name='QA / CONTINUANCE PLANETARY HORIZON';
 // The planet needs a distant offset, but the modeled architecture is
 // positioned directly in camera/world coordinates. Do NOT translate the
 // entire root: that silently shifts citadels out of the camera frustum.
 const orbitalBody=new T.Group();
 orbitalBody.name='Planet + illuminated observation rings';
 orbitalBody.position.set(mobile?18.5:18.4,mobile?11.5:12.8,mobile?-42:-43);
 root.add(orbitalBody);
 const signal={value:0};
 const body=new T.Mesh(
  new T.SphereGeometry(mobile?7.9:8.8,longitude,latitude),
  new T.ShaderMaterial({vertexShader:planetVertex,fragmentShader:planetFragment,
   uniforms:{uPublicDensity:signal},fog:false,depthWrite:true,toneMapped:false})
 );
 body.name='Original gas giant / no texture or telemetry';
 orbitalBody.add(body);
 const atmosphere=new T.Mesh(
  new T.SphereGeometry(mobile?8.12:9.04,longitude,latitude),
  new T.ShaderMaterial({vertexShader:planetVertex,fragmentShader:atmosphereFragment,
   uniforms:{uPublicDensity:signal},transparent:true,depthWrite:false,
   blending:T.AdditiveBlending,fog:false,toneMapped:false})
 );
 atmosphere.name='Atmospheric limb';
 orbitalBody.add(atmosphere);
 const orbits=new T.Group();orbits.rotation.set(.41,-.12,.22);
 orbits.name='Two engineered auric observation rings';
 for(const [radius,tube,opacity,color] of [
  [mobile?10.8:11.9,.056,.36,0x9ed6ff],[mobile?12.7:14.2,.032,.22,0xb393ef]
 ] as const){
  const ring=new T.Mesh(
   new T.TorusGeometry(radius,tube,mobile?4:6,mobile?72:144),
   new T.MeshBasicMaterial({color,transparent:true,opacity,
    depthWrite:false,blending:T.AdditiveBlending,fog:false,toneMapped:false})
  );
  ring.rotation.set(.58,.16,.28);
  orbits.add(ring);
 }
 orbitalBody.add(orbits);
 const citadels=citadelFactory(tier);
 root.add(citadels.root);
 root.updateMatrixWorld(true);
 let triangles=0,drawCalls=0;
 root.traverse(object=>{
  if(!(object instanceof T.Mesh))return;
  drawCalls++;
  const geometry=object.geometry;
  triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*
   (object instanceof T.InstancedMesh?object.count:1);
 });
 const budget=HORIZON_QA_BUDGET[tier];
 if(triangles>budget.triangles||drawCalls>budget.drawCalls){
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
  root,tier,triangles,drawCalls,
  update(publicDensity:number,elapsedSeconds:number,motionAllowed:boolean){
   signal.value=Math.max(0,Math.min(1,Number.isFinite(publicDensity)?publicDensity:0));
   if(motionAllowed)orbits.rotation.z=.22+Math.sin(elapsedSeconds*.024)*.035;
   else orbits.rotation.z=.22;
   citadels.update(elapsedSeconds,motionAllowed);
  },
  dispose(){
   root.remove(citadels.root);citadels.dispose();
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
