/** PARITY V136.016 — isolated candidate GLB boundary tests, Node 22 only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStageSceneCandidate} from '../web/src/parity/CinematicStageGeometryV136.ts';
const hash='e'.repeat(64);
const make=(opts={})=>({
 schema:'anevum.cinematic.scene-candidate.v1',status:'UNREVIEWED_QA_ONLY',
 stageOnly:true,approvedForProduction:false,oldLiveAtriumEquivalent:false,
 visualQAPassed:false,sourceReviewGeometrySha256:hash,
 sourceWorldRevision:'continuance-atrium-source-v136015-001',
 cameraId:'atrium-cinema-014-source-v1',geometryRevision:'continuance-stage-v136016-001',
 landmarks:[
 {id:'continuance-core',blender:[0,.5,1.1],three:[0,1.1,-.5]},
 {id:'orbital-pearl',blender:[0,.5,9.3],three:[0,9.3,-.5]},
 {id:'east-observatory',blender:[9,-2.2,1.5],three:[9,1.5,2.2]},
 {id:'west-observatory',blender:[-9,-3,1.6],three:[-9,1.6,3]}
 ],
 cameraSamples:Array.from({length:4},(_,i)=>({
   frame:i+1,position:[15,-25,12],forward:[0,1,0],up:[0,0,1],verticalFovRadians:.62
 })),
 variants:{
  desktop:{path:'assets/cinematic-v136/stage/atrium-desktop.glb',bytes:700000,sha256:hash,
   triangles:60000,drawPrimitiveCount:18,sourceObjectCount:500,sourceMeshCount:18,withinBudget:true,compressed:true},
  mobile:{path:'assets/cinematic-v136/stage/atrium-mobile.glb',bytes:400000,sha256:hash,
   triangles:35000,drawPrimitiveCount:12,sourceObjectCount:290,sourceMeshCount:12,withinBudget:true,compressed:true}
 },...opts
});
test('Only QA candidate derived from exact original camera geometry is accepted',()=>{
 assert.ok(validateStageSceneCandidate(make()));
 assert.equal(validateStageSceneCandidate({...make(),approvedForProduction:true}),null);
 assert.equal(validateStageSceneCandidate({...make(),oldLiveAtriumEquivalent:true}),null);
 assert.equal(validateStageSceneCandidate({...make(),stageOnly:false}),null);
 assert.equal(validateStageSceneCandidate({...make(),visualQAPassed:true}),null);
 assert.equal(validateStageSceneCandidate({...make(),status:'approved'}),null);
 assert.equal(validateStageSceneCandidate({...make(),sourceWorldRevision:'wrong-scene'}),null);
 assert.equal(validateStageSceneCandidate({...make(),sourceReviewGeometrySha256:'wrong'}),null);
});
test('No remote/external GLB or arbitrarily huge draw count or byte budget',()=>{
 const orig=make();
 for(const url of ['https://cdn.example/x.glb','/assets/cinematic-v136/stage/atrium-desktop.glb',
  'assets/cinematic-v136/stage/../../evil.glb','assets/cinematic-v136/stage/avatar.glb']){
  const x=structuredClone(orig);x.variants.desktop.path=url;
  assert.equal(validateStageSceneCandidate(x),null,url);
 }
 for(const [field,bad] of [['bytes',4e6],['sha256','no'],['triangles',300000],
  ['drawPrimitiveCount',150],['compressed',false],['withinBudget',false]]){
  const x=structuredClone(orig);x.variants.mobile[field]=bad;
  assert.equal(validateStageSceneCandidate(x),null,field);
 }
});
test('Untrusted camera vectors or landmark geometries cannot register',()=>{
 for(const patch of [
 {position:[NaN,0,1]},{forward:[0,0,1]},{forward:[0,2,0]},
 {verticalFovRadians:0},{frame:6}]){
  const x=make();Object.assign(x.cameraSamples[1],patch);
  assert.equal(validateStageSceneCandidate(x),null,JSON.stringify(patch));
 }
 const wrong=make();wrong.landmarks[2].three=[15,1.5,2.2];
 assert.equal(validateStageSceneCandidate(wrong),null);
 const duplicate=make();duplicate.landmarks[2].id='continuance-core';
 assert.equal(validateStageSceneCandidate(duplicate),null);
});
test('Real renderer retains one canvas; stage path only with explicit QA opt-in',()=>{
 const r=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const renderer=r('../web/src/parity/InstituteRendererV136.ts');
 const stage=r('../web/src/parity/CinematicStageGeometryV136.ts');
 const arrival=r('../web/src/parity/CinematicArrivalV136.tsx');
 assert.match(renderer,/VITE_PARITY_V136_SHARED_SCENE_QA==='true'/);
 assert.match(renderer,/stageEnabled&&family==='atrium'&&input\.sector==='hero'/);
 assert.match(renderer,/fetchStageScene\(budget\.tier,controller\.signal\)/);
 assert.match(renderer,/loader\.parseAsync\(stage\.buffer,''\)/);
 assert.match(renderer,/if\(stage\)m\.forceSinglePass=true/,'Closed, double-sided Blender surfaces must not double-draw during alpha handoff');
 assert.match(renderer,/if\(!stage\)/);
 assert.match(renderer,/camera\.up\.copy\(up\)/);
 assert.match(renderer,/stageUnavailable=true/);
 assert.match(renderer,/loaded\.stage===wantsStage/);
 assert.match(renderer,/pending\.get\(family\)===controller/);
 assert.match(renderer,/cache\.get\('atrium'\)\?\.stage===true/);
 assert.match(renderer,/stageSamples=null;stageUnavailable=false/);
 assert.match(renderer,/controller\.signal\.aborted\|\|disposed/);

 assert.match(stage,/crypto\.subtle\.digest\('SHA-256',buffer\)/);
 assert.doesNotMatch(arrival,/cameraProgress|stageCamera|sceneReadiness/);
 assert.match(arrival,/data-cinematic-v136="motion-first"/);
 assert.ok(!/new T\.WebGLRenderer|document\.createElement\('canvas'\)/.test(stage+arrival),
  'No new WebGL context for the cinematic candidate');
 assert.ok(!/session|credentials:'include'|authorization:|localStorage|submit\(/i.test(stage+arrival));
});
