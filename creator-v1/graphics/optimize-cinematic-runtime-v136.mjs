#!/usr/bin/env node
/** PARITY V136.016. Turn authored Blender world-aligned geometry into *staged*
 * Meshopt GLBs and an immutable, explicitly unapproved QA manifest.
 * No runtime rights, no third-party data, no Cloudflare upload, no repo writes.
 *   node creator-v1/graphics/optimize-cinematic-runtime-v136.mjs
 *      --lod DIR --camera DIR/camera-manifest.json --out DIR
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptEncoder} from 'meshoptimizer';
import {meshopt} from '@gltf-transform/functions';

const args=process.argv.slice(2);
const arg=(key)=>{const i=args.indexOf('--'+key);assert.ok(i!==-1&&args[i+1]&&!args[i+1].startsWith('--'),'Required --'+key+' PATH');return resolve(args[i+1])};
const lod=arg('lod'),cameraPath=arg('camera'),out=arg('out');
assert.ok(!out.startsWith(lod+sep)&&out!==lod,'Output may not alter Blender source variants');
const source=JSON.parse(readFileSync(join(lod,'lod-source-manifest.json'),'utf8'));
const camera=JSON.parse(readFileSync(cameraPath,'utf8'));
assert.equal(source.schema,'anevum.cinematic.lod-source.v1');
assert.equal(camera.schema,'anevum.cinematic.camera.v1');
assert.equal(source.sourceWorldRevision,camera.worldRevision);
assert.equal(source.cameraId,camera.cameraId);
assert.equal(source.reviewGeometrySha256,camera.geometryExport.sha256);
assert.equal(camera.geometryExport.approvedForRuntime,false);
assert.equal(camera.geometryExport.geometryMatchToLiveV136011,false);
assert.ok(Array.isArray(camera.samples)&&camera.samples.length===camera.frames);
assert.ok(camera.frames>=4&&camera.frames<=180);
assert.equal(source.approvedForProduction,false);
assert.equal(source.visualQAPassed,false);
assert.match(camera.worldRevision,/^continuance-atrium-source-v136015-[a-z0-9-]+$/);
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
mkdirSync(out,{recursive:true});
const variants={};
for(const tier of ['desktop','mobile']){
 const input=source.models[tier];
 assert.ok(input&&/^[a-z0-9-]+\.glb$/.test(input.file));
 const inputPath=resolve(lod,input.file);
 assert.ok(inputPath.startsWith(lod+sep));
 const original=readFileSync(inputPath);
 assert.equal(original.length,input.bytes);
 assert.equal(sha(original),input.sha256);
 const document=await io.readBinary(new Uint8Array(original));
 const root=document.getRoot();
 const scene=root.listScenes()[0];
 assert.ok(scene,'Original GLB must contain one spatial scene');
 assert.ok(root.listMeshes().length>=2&&root.listMeshes().length<=40,
  'Blender source should be grouped by material, not retain hundreds of draw calls');
 let triangles=0,primitives=0;
 for(const mesh of root.listMeshes())for(const primitive of mesh.listPrimitives()){
  const mode=primitive.getMode();
  assert.equal(mode,4,'Only triangle geometry supported');
  const indices=primitive.getIndices();
  assert.ok(indices,'Every source primitive must have explicit indices');
  triangles+=indices.getCount()/3;primitives++;
 }
 assert.ok(triangles>5000&&primitives>=2,'Authored scene has no usable detail');
 // Vertex reordering and KHR_mesh_quantization are required: lossless
 // FILTER-only compression measured 1.83MB / .946MB and failed BOTH budgets.
 // A measured 14-bit position grid maintains cinematic architecture accuracy;
 // medium mode stores compact quantized accessors without needing Brotli or
 // relaxing the site's 1 MiB CSP-safe Meshopt decode worker limits.
 await document.transform(meshopt({
  encoder:MeshoptEncoder,level:'medium',quantizePosition:14,
  quantizeNormal:10,quantizeTexcoord:12
 }));
 const binary=Buffer.from(await io.writeBinary(document));
 const serialized=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString());
 assert.ok(serialized.extensionsRequired?.includes('EXT_meshopt_compression'),
  'QA geometry must remain Meshopt-encoded');
 assert.ok(serialized.extensionsRequired?.includes('KHR_mesh_quantization'),
  'Compact quantized geometry needs KHR_mesh_quantization');
 assert.ok(!serialized.images?.length,'Standalone shared geometry must not link remote textures');
 assert.ok(!(serialized.buffers||[]).some(b=>b.uri),
  'Self-contained binary GLB only');
 const decodedAccessors=serialized.accessors||[];
 assert.ok(decodedAccessors.every(a=>a.count<1_000_000),'Reject extreme decoded accessor counts');
 // Existing CSP decoder rejects any one decoded compressed bufferView >1 MiB.
 for(const view of serialized.bufferViews||[]){
  if(!view.extensions?.EXT_meshopt_compression)continue;
  assert.ok(view.byteLength<=1_048_576,
   'CSP-safe decoder per-bufferView output limit exceeded: '+view.byteLength);
 }
 const targetName='atrium-'+tier+'.glb';
 const target=join(out,targetName);
 writeFileSync(target,binary);
 const maxBytes=tier==='desktop'?1_700_000:900_000;
 const triBudget=tier==='desktop'?175_000:100_000;
 const drawsBudget=tier==='desktop'?36:22;
 const bytePass=binary.length<=maxBytes,trianglePass=triangles<=triBudget,drawPass=primitives<=drawsBudget;
 variants[tier]={
  path:'assets/cinematic-v136/stage/'+targetName,
  bytes:binary.length,sha256:sha(binary),triangles,
  drawPrimitiveCount:primitives,sourceObjectCount:input.originalObjectCount,
  sourceMeshCount:input.joinedMeshCount,compressed:true,
  sourceSha256:input.sha256,byteBudget:maxBytes,triangleBudget:triBudget,drawBudget:drawsBudget,
  withinBudget:bytePass&&trianglePass&&drawPass
 };
 console.log(tier,JSON.stringify(variants[tier]));
}
const stage={
 schema:'anevum.cinematic.scene-candidate.v1',
 status:'UNREVIEWED_QA_ONLY',
 stageOnly:true,approvedForProduction:false,
 sourceWorldRevision:camera.worldRevision,cameraId:camera.cameraId,
 provenance:'Original ANEVUM Blender scene; edited/reviewed master retained separately',
 sourceBlendSha256:source.sourceBlendSha256,
 sourceReviewGeometrySha256:source.reviewGeometrySha256,
 geometryRevision:'continuance-stage-v136016-001',
 oldLiveAtriumEquivalent:false,
 visualQAPassed:false,
 landmarks:camera.sourceLandmarks.map(p=>({id:p.id,blender:p.blender,three:[p.blender[0],p.blender[2],-p.blender[1]]})),
 cameraSamples:camera.samples.map(s=>({
  frame:s.frame,position:s.position,forward:s.forward,up:s.up,verticalFovRadians:s.verticalFovRadians
 })),
 variants
};
writeFileSync(join(out,'manifest.json'),JSON.stringify(stage,null,2)+'\n');
console.log(JSON.stringify({status:'QA_CANDIDATE_OPTIMIZED_UNAPPROVED',
 revision:stage.geometryRevision,camera:stage.cameraId,
 variants:Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,{bytes:v.bytes,draws:v.drawPrimitiveCount,
 triangles:v.triangles,withinBudget:v.withinBudget}])),
 productionEnabled:false},null,2));
if(!Object.values(variants).every(item=>item.withinBudget)){
 console.error('NO RELEASE: Optimization exceeded staged resource limits. Source candidates are retained for inspection.');
 process.exitCode=2;
}
