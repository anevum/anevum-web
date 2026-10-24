/** Original ANEVUM model sources. Rebuild: node creator-v1/graphics/build-institute-assets.mjs
 * No downloaded art, concept raster, user record, or private content is embedded. */
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression,ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptEncoder} from 'meshoptimizer';
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
// GLTFExporter uses the browser FileReader contract for Blob -> ArrayBuffer.
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.()})}};
const out='creator-v1/web/public/assets/institute/v136-011';mkdirSync(out,{recursive:true});
const manifest={version:'136.011.1',generator:'creator-v1/graphics/build-institute-assets.mjs',provenance:'Original ANEVUM procedural architectural models; no third-party media; source in repository.',license:'ANEVUM repository LICENSE; ANEVUM marks remain subject to TRADEMARKS.md',families:{}};
for(const tier of ['mobile','desktop'])for(const family of ['atrium','archive','forge','relay']){
const detail=tier==='desktop'?96:40;
const scene=new T.Scene();scene.name='CONTINUANCE_'+family.toUpperCase();
const m={
 alloy:new T.MeshStandardMaterial({name:'structural-alloy',color:0x293c52,metalness:.87,roughness:.29}),
 dark:new T.MeshStandardMaterial({name:'recessed-carbon',color:0x07101c,metalness:.5,roughness:.56}),
 silver:new T.MeshStandardMaterial({name:'machined-titanium',color:0x9eafbb,metalness:.91,roughness:.22}),
 gold:new T.MeshStandardMaterial({name:'brushed-auric',color:0xa27d48,metalness:.88,roughness:.28}),
 light:new T.MeshStandardMaterial({name:'photonic-cyan',color:0x5ad6ff,emissive:0x26b7fa,emissiveIntensity:3,metalness:.28,roughness:.22}),
 violet:new T.MeshStandardMaterial({name:'photonic-violet',color:0x9670ff,emissive:0x7044ef,emissiveIntensity:2.4,metalness:.3,roughness:.3}),
 glass:new T.MeshPhysicalMaterial({name:'optical-glass',color:0x27699c,metalness:.25,roughness:.16,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false,clearcoat:1}),
 core:new T.MeshStandardMaterial({name:'celestial-ceramic',color:0x387aab,metalness:.65,roughness:.3,emissive:0x082c52,emissiveIntensity:.6})
};
const box=new T.BoxGeometry(1,1,1);
const cylinder=new T.CylinderGeometry(1,1,1,detail);
function mesh(geo,mat,x,y,z,sx=1,sy=1,sz=1,parent=scene){const a=new T.Mesh(geo,m[mat]);a.position.set(x,y,z);a.scale.set(sx,sy,sz);parent.add(a);return a}
function plate(mat,x,y,z,w,h,d,parent){return mesh(box,mat,x,y,z,w,h,d,parent)}
function ring(radius,tube,mat,x,y,z,rx=0,ry=0,rz=0,parent=scene){const a=mesh(new T.TorusGeometry(radius,tube,8,detail),mat,x,y,z,1,1,1,parent);a.rotation.set(rx,ry,rz);return a}
function beam(a,b,width,mat,parent=scene){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const obj=plate(mat,...start.clone().add(end).multiplyScalar(.5).toArray(),width,delta.length(),width,parent);obj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return obj}
// A shared engineered nave: coffered floor, inset transit lanes, buttressed ribs.
plate('dark',0,-1.3,-7,20,.5,35);
for(let i=0;i<17;i++){
const z=7-i*2;
plate('alloy',0,-1.015,z,17,.08,.025);
for(const x of [-7.4,7.4]){plate('gold',x,-.99,z,.16,.04,1.5);plate('light',x+.25,-.98,z,.045,.025,1.2)}
}
for(let i=0;i<7;i++){
const z=4-i*4;
for(const sign of [-1,1]){
beam([sign*8,-1,z],[sign*7,6,z],.24,'alloy');
beam([sign*7,6,z],[sign*4,9,z],.21,'silver');
beam([sign*7.03,5.8,z],[sign*4.1,8.75,z],.035,'light');
for(let j=0;j<4;j++)plate('silver',sign*(7.8-j*.16),j*.95,z,.4,.09,.4);
}
beam([-4,9,z],[4,9,z],.18,'alloy');
}
const root=new T.Group();root.position.set(3,0,-4);root.name='architectural-heart';scene.add(root);
if(family==='atrium'){
 mesh(cylinder,'alloy',0,-.6,0,3.5,.5,3.5,root);
 mesh(cylinder,'silver',0,-.31,0,3.2,.12,3.2,root);
 ring(3.15,.035,'light',0,-.23,0,Math.PI/2,0,0,root);
 // Armillary cradle: counter-rotating segmented orbital bands and precision mounts.
 const core=mesh(new T.SphereGeometry(1.4,detail,detail/2),'core',0,2.4,0,1,1,1,root);core.name='celestial-heart';
 for(let i=0;i<3;i++){
 const radius=1.9+i*.36;
 ring(radius,.09,'alloy',0,2.4,0,.7+i*.5,i*.8,.35,root);
 ring(radius+.1,.022,'light',0,2.4,0,.7+i*.5,i*.8,.35,root);
 }
 for(let i=0;i<24;i++){
 const angle=i*Math.PI/12,x=Math.cos(angle),z=Math.sin(angle);
 const p=plate(i%3?'silver':'gold',x*2.9,-.02,z*2.9,.22,.1,.5,root);p.rotation.y=-angle;
 if(i%3===0){beam([x*3,-.15,z*3],[x*1.4,1.3,z*1.4],.16,'alloy',root);plate('light',x*3.1,.12,z*3.1,.12,.12,.12,root)}
 }
 for(let i=0;i<12;i++)ring(1.41,.008,'gold',0,2.4,0,i*Math.PI/12,.2,0,root);
 for(const sign of [-1,1]){
 plate('alloy',sign*4,-.2,1.4,1.1,.65,3,root);
 plate('glass',sign*4,.16,1.4,.95,.08,2.8,root);
 beam([sign*4,-.5,-.2],[sign*2,2,-.7],.18,'silver',root);
 }
}else if(family==='archive'){
 for(let side of [-1,1])for(let i=0;i<6;i++){
 const x=side*4.7,z=2-i*3.6;
 plate('alloy',x,2,z,1,5.8,2.6,root);plate('silver',x-side*.53,2,z,.07,5.5,2.3,root);
 for(let j=0;j<8;j++){
 plate('dark',x-side*.57,-.3+j*.63,z,.04,.49,2.12,root);
 plate('light',x-side*.61,-.3+j*.63,z-.84,.035,.32,.025,root);
 for(let k=0;k<3;k++)plate('glass',x-side*.63,-.3+j*.63,z-.6+k*.58,.025,.4,.48,root);
 }
 }
 for(let i=0;i<5;i++){
 const z=1-i*3;
 plate('alloy',0,-.4,z,2.6,.8,1.2,root);
 const glass=plate('glass',0,1,z,2.35,1.8,.06,root);glass.rotation.x=-.15;
 for(let j=0;j<4;j++)plate(j?'silver':'light',-.6+j*.4,1,z+.04,.025,1.3,.02,root);
 }
 ring(2.5,.16,'silver',0,2.4,-16,0,0,0,root);ring(2.3,.035,'light',0,2.4,-15.98,0,0,0,root);
}else if(family==='forge'){
 mesh(cylinder,'alloy',0,-.5,0,3.1,.8,3.1,root);
 for(let i=0;i<3;i++)ring(2.4+i*.25,.06,i%2?'gold':'light',0,.01+i*.06,0,Math.PI/2,0,0,root);
 const heart=mesh(new T.IcosahedronGeometry(1.18,1),'gold',0,2.5,0,1,1,1,root);heart.name='fabrication-heart';
 ring(1.8,.05,'violet',0,2.5,0,.3,.6,.6,root);
 for(let i=0;i<6;i++){
 const a=i*Math.PI/3,x=Math.cos(a),z=Math.sin(a);
 beam([x*3,-.6,z*3],[x*2.9,2.5,z*2.9],.2,'alloy',root);
 beam([x*2.9,2.5,z*2.9],[x*1.7,3.5,z*1.7],.15,'silver',root);
 beam([x*1.7,3.5,z*1.7],[x*.6,2.8,z*.6],.035,'violet',root);
 for(let j=0;j<5;j++)plate('dark',x*2.9,j*.42,z*2.9,.35,.1,.35,root);
 }
 for(const side of [-1,1]){
 plate('alloy',side*4.4,.1,1,2.3,1.1,2,root);
 const panel=plate('glass',side*4.4,1.3,.8,2.2,1.3,.06,root);panel.rotation.x=-.2;
 for(let i=0;i<8;i++)plate(i%2?'light':'silver',side*4.4-.85+i*.24,.69,1.1,.14,.015,.38,root);
 }
}else{
 for(let i=0;i<5;i++){
 const x=(i-2)*2.4,z=-Math.abs(i-2)*2;
 const h=5.6-Math.abs(i-2)*.65;
 plate('alloy',x,h/2-.7,z,.8,h,.8,root);
 for(let j=0;j<12;j++){
 plate('silver',x,-.4+j*h/12,z,.98,.08,.98,root);
 plate(i%2?'violet':'light',x+.415,-.35+j*h/12,z,.025,.19,.54,root);
 }
 ring(.85,.045,'light',x,h-.3,z,Math.PI/2,0,0,root);
 plate('glass',x+.48,1.5,z,1.1,1.6,.025,root);
 if(i<4)beam([x,h-.4,z],[x+2.4,5.2-Math.abs(i-1)*.65,-Math.abs(i-1)*2],.03,'violet',root);
 }
 for(let i=0;i<9;i++)plate('light',0,-.97,4-i*2,.035,.018,1.3,root);
}
scene.updateMatrixWorld(true);
const buffer=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true});
const document=await io.readBinary(new Uint8Array(buffer));
document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.FILTER});
const name=family+'-'+tier+'.glb';const bytes=Buffer.from(await io.writeBinary(document));writeFileSync(out+'/'+name,bytes);
let triangles=0,nodes=0;scene.traverse(o=>{if(o.isMesh){nodes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3}});
manifest.families[family]??={};manifest.families[family][tier]={url:'/assets/institute/v136-011/'+name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),triangles,nodes};
console.log(name,bytes.length,'bytes',triangles,'triangles',nodes,'mesh nodes');
}
writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
