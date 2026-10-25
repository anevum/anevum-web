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
 {x:6.4,y:-2.6,z:-19,r:2.35,scale:1},
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
export function createInstituteCitadels(tier:AssetTier){
 const mobile=tier==='mobile',places=mobile?MOBILE_PLACES:DESKTOP_PLACES;
 const dark=new T.MeshStandardMaterial({color:0x111c30,metalness:.35,roughness:.69});
 const alloy=new T.MeshStandardMaterial({color:0x42637d,metalness:.76,roughness:.29,
  emissive:0x09172c,emissiveIntensity:.23});
 const auric=new T.MeshStandardMaterial({color:0x8b7152,metalness:.83,roughness:.33});
 const photonic=new T.MeshBasicMaterial({color:0x7fdcff,toneMapped:false});
 const root=new T.Group();root.name='QA / SUSPENDED CONTINUANCE OUTPOSTS';
 const deck:InstancePose[]=[],suspended:InstancePose[]=[],towers:InstancePose[]=[];
 const spires:InstancePose[]=[],windowSlits:InstancePose[]=[],halos:InstancePose[]=[];
 const towerRadius=.20,towerHeight=2.50;
 for(const place of places){
  deck.push({position:[place.x,place.y,place.z],scale:[place.r,.90*place.scale,place.r]});
  suspended.push({position:[place.x,place.y-1.20*place.scale,place.z],
   scale:[place.r*.66,place.scale,place.r*.66],rotation:[Math.PI,0,0]});
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
  batch('Floating deck strata',new T.CylinderGeometry(1,1.10,.28,mobile?10:14),alloy,deck),
  batch('Suspension geology',new T.ConeGeometry(1,2.15,mobile?10:14),dark,suspended),
  batch('Ring railings',new T.TorusGeometry(1,.017,4,mobile?32:48),photonic,halos),
  batch('Cathedral finial towers',new T.CylinderGeometry(.12,.22,towerHeight,8),alloy,towers),
  batch('Auric crown spires',new T.ConeGeometry(.20,1.18,8),auric,spires),
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
