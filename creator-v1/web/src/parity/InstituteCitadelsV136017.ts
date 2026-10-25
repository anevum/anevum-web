/** PARITY V136.017.010 — authored QA-only floating citadel details.
 * Deterministic instancing for platform strata, beacon towers, finials,
 * window engravings and orbital girdles. Runs solely inside the existing
 * Three.js world when VITE_PARITY_V136_HORIZON_QA=true.
 *
 * Decorative original geometry, not registered member activity, private
 * creator content, a physics game, or an approved production 3D master.
 */
import * as T from 'three';
import type {AssetTier} from './InstituteAssetManifestV136';

type Place={x:number;y:number;z:number;r:number;scale:number};
type InstancePose={position:[number,number,number];scale:[number,number,number];rotation?:[number,number,number]};
type Batch={name:string;geometry:T.BufferGeometry;material:T.Material;poses:InstancePose[]};

// The Institute camera occupies approximately (0.1, 3.1, 13.2) and
// looks into -Z. The previous authoring draft placed outposts below y=-10,
// several at or behind the camera (positive Z): invisible but still costly.
// These intentionally stagger in front of the actual hero camera instead.
const DESKTOP_PLACES:readonly Place[]=[
 {x:6.0,y:-1.0,z:-18,r:4.0,scale:1.35},
 {x:1.8,y:-4.0,z:-12,r:1.85,scale:.82},
 {x:10.9,y:.0,z:-21.5,r:1.66,scale:.72}
];
const MOBILE_PLACES:readonly Place[]=[
 {x:7.1,y:-2.7,z:-19,r:1.85,scale:.85},
 {x:1.1,y:-3.3,z:-24,r:1.52,scale:.70}
];
function batch(name:string,geometry:T.BufferGeometry,material:T.Material,poses:InstancePose[]):Batch{
 return {name,geometry,material,poses};
}
/** Revolved architectural sections share one indexed mesh per material batch.
 * Radius/height profiles form terraces and cornices rather than painted detail. */
function section(profile:readonly (readonly [number,number])[],segments:number){
 return new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),segments);
}
function fracturedGeology(segments:number){
 const geometry=section([[0,-1.15],[.13,-.95],[.28,-.48],[.44,-.27],
  [.64,.08],[.79,.20],[1,.68],[.80,1],[0,1.02]],segments);
 const positions=geometry.attributes.position;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),a=Math.atan2(z,x);
  // Continuous angular deformation keeps the seam closed, with no random seed
  // or per-frame geometry uploads. Flat normals expose original rock facets.
  const fracture=1+.14*Math.sin(a*3+y*1.7)+.09*Math.cos(a*7-y*2.3);
  positions.setXYZ(i,x*fracture,y+.09*Math.sin(a*5)*Math.hypot(x,z),z*fracture);
 }
 positions.needsUpdate=true;geometry.computeVertexNormals();return geometry;
}
export function createInstituteCitadels(tier:AssetTier){
 const mobile=tier==='mobile',places=mobile?MOBILE_PLACES:DESKTOP_PLACES;
 const dark=new T.MeshStandardMaterial({color:0x263048,metalness:.18,roughness:.88,flatShading:true});
 const alloy=new T.MeshStandardMaterial({color:0x42637d,metalness:.76,roughness:.29,
  emissive:0x09172c,emissiveIntensity:.23});
 const auric=new T.MeshStandardMaterial({color:0x8b7152,metalness:.83,roughness:.33});
 const photonic=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 const root=new T.Group();root.name='QA / SUSPENDED CONTINUANCE OUTPOSTS';
 const deck:InstancePose[]=[],suspended:InstancePose[]=[],towers:InstancePose[]=[];
 const spires:InstancePose[]=[],windowSlits:InstancePose[]=[],halos:InstancePose[]=[];
 const towerRadius=.20,towerHeight=2.50;
 for(const place of places){
  deck.push({position:[place.x,place.y,place.z],scale:[place.r,.90*place.scale,place.r]});
  suspended.push({position:[place.x,place.y-1.20*place.scale,place.z],
   scale:[place.r*.81,place.scale,place.r*.81]});
  // Broken hanging shards give each island a geological silhouette, rather
  // than a single smooth inverted cone beneath a flat circular platform.
  for(let shard=0;shard<(mobile?1:2);shard++){
   const a=shard*2.7+.65;
   suspended.push({position:[place.x+Math.cos(a)*place.r*.58,
    place.y-1.12*place.scale,place.z+Math.sin(a)*place.r*.58],
    scale:[place.r*.18,place.scale*.7,place.r*.22],rotation:[.12,a,.17]});
  }
  halos.push({position:[place.x,place.y+.26*place.scale,place.z],
   scale:[place.r*1.04,place.r*1.04,place.r*1.04],rotation:[Math.PI/2,0,0]});
  const count=mobile?3:5;
  for(let i=0;i<count;i++){
   const central=i===0;
   const theta=i*2.399963229728653;
   const px=place.x+(central?0:Math.cos(theta)*place.r*.64);
   const pz=place.z+(central?0:Math.sin(theta)*place.r*.64);
   const height=towerHeight*(central?1.52:1)*(0.84+place.scale*.16);
   const width=place.scale*(central?1.3:.89);
   const foot=place.y+.30*place.scale;
   towers.push({position:[px,foot+height*.5,pz],scale:[width,height/towerHeight,width]});
   spires.push({position:[px,foot+height+.59*place.scale,pz],
    scale:[width*1.15,place.scale,width*1.15]});
   // These are original deterministic built-environment windows. They do not
   // represent online users, page hits, active projects or engagement.
   const levels=central?4:3;
   for(let level=0;level<levels;level++){
    const wy=foot+.34*place.scale+level*height/(levels+1);
    for(let side=0;side<4;side++){
     const a=side*Math.PI/2;
     const wx=px+Math.cos(a)*towerRadius*1.1*width;
     const wz=pz+Math.sin(a)*towerRadius*1.1*width;
     windowSlits.push({position:[wx,wy,wz],
      scale:[width*.85,place.scale*.72,width*.85],rotation:[0,-a,0]});
    }
   }
  }
 }
 const batches:Batch[]=[
  batch('Floating deck strata',section([[0,-.22],[.72,-.22],[.74,-.13],
   [1.08,-.13],[1.08,-.04],[.87,-.04],[.87,.10],[1,.10],[1,.17],[0,.17]],mobile?10:14),alloy,deck),
  batch('Suspension geology',fracturedGeology(mobile?8:10),dark,suspended),
  batch('Ring railings',new T.TorusGeometry(1,.017,4,mobile?32:48),photonic,halos),
  batch('Cathedral finial towers',section([[0,-1.25],[.28,-1.25],[.28,-1.08],
   [.19,-.97],[.15,.58],[.27,.62],[.27,.72],[.12,.76],[.10,1.25],[0,1.25]],8),alloy,towers),
  batch('Auric crown spires',section([[0,-.59],[.22,-.59],[.22,-.49],
   [.12,-.40],[.06,.14],[0,.59]],8),auric,spires),
  batch('Photonic window inlays',new T.BoxGeometry(.12,.095,.08),photonic,windowSlits)
 ];
 let triangles=0;
 const assets=new Set<T.BufferGeometry>(),surfaces=new Set<T.Material>();
 for(const {name,geometry,material,poses} of batches){
  const instanced=new T.InstancedMesh(geometry,material,poses.length);
  instanced.name=name;
  assets.add(geometry);surfaces.add(material);
  const matrix=new T.Object3D();
  for(let i=0;i<poses.length;i++){
   const pose=poses[i];
   matrix.position.set(...pose.position);
   matrix.scale.set(...pose.scale);
   matrix.rotation.set(...(pose.rotation??[0,0,0]));
   matrix.updateMatrix();
   instanced.setMatrixAt(i,matrix.matrix);
   if(material===photonic){
    // Architectural light fixtures alternate cool glass and warm under-deck
    // illumination; this is fixed authored detail, never activity telemetry.
    instanced.setColorAt(i,new T.Color(name==='Ring railings'?0xffbd79:
     i%7===0?0xffcf91:i%3===0?0xb7a2ff:0x7fdcff));
   }
  }
  instanced.instanceMatrix.needsUpdate=true;
  instanced.computeBoundingSphere();
  triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*poses.length;
  root.add(instanced);
 }
 return {
  root,triangles,drawCalls:batches.length,instanceCount:batches.reduce((n,b)=>n+b.poses.length,0),
  update(seconds:number,motionAllowed:boolean){
   // Slow, low-amplitude local parallax; paused/reduced-motion leaves a static
   // deterministic resting pose. No autonomously running animation loop.
   root.rotation.y=motionAllowed?Math.sin(seconds*.019)*.012:0;
  },
  dispose(){
   root.traverse(node=>{if(node instanceof T.InstancedMesh)node.dispose()});
   root.clear();
   assets.forEach(geometry=>geometry.dispose());
   surfaces.forEach(material=>material.dispose());
  }
 };
}
