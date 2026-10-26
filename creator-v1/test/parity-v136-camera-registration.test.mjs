/** PARITY V136.015 — coordinate and camera registration safety, Node 22 source. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cinematicWorldReadiness,cinematicRevealWhenReady} from '../web/src/parity/cinematic-director-v136.ts';
import {
 blenderToThreePosition,normalizedCameraSample,convertBlenderCamera,
 registrationFromLandmarks,applyRegistration,registeredCameraPose,cameraHandoffEligible
} from '../web/src/parity/CinematicCameraRegistrationV136.ts';

const near=(actual,expected,tol=1e-5)=>{
 assert.equal(actual.length,expected.length);
 for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-expected[i])<tol,'coordinate '+i+': '+actual[i]+' vs '+expected[i]);
};
const sample={frame:1,position:[14,-22,11],forward:[-0.44,.82,-.36],up:[0,0,1],verticalFovRadians:.82};
const upright={frame:1,position:[14,-22,11],forward:[0,1,0],up:[0,0,1],verticalFovRadians:.82};
const pairs=[
 {id:'continuance-core',blender:[0,.5,1.1],three:[0,1.1,-.5]},
 {id:'orbital-pearl',blender:[0,.5,9.3],three:[0,9.3,-.5]},
 {id:'east-observatory',blender:[9,-2.2,1.5],three:[9,1.5,2.2]},
 {id:'west-observatory',blender:[-9,-3,1.6],three:[-9,1.6,3]}
];
test('Blender Z-up to glTF/Three Y-up is a proper right-handed rotation',()=>{
 near(blenderToThreePosition([1,2,3]),[1,3,-2]);
 near(blenderToThreePosition([0,1,0]),[0,0,-1]);
 near(blenderToThreePosition([0,0,1]),[0,1,0]);
});
test('camera input rejects invalid, non-normalized, non-orthogonal or non-finite samples',()=>{
 assert.ok(normalizedCameraSample(upright));
 for(const bad of [
  null,{...upright,frame:0},{...upright,frame:181},
  {...upright,verticalFovRadians:0},{...upright,verticalFovRadians:2.7},
  {...upright,forward:[0,0,1]}, // same as up
  {...upright,forward:[0,2,0]},
  {...upright,forward:[NaN,1,0]},
  {...upright,position:['a',0,0]},
  {...upright,up:[0,0,0]},
  {...upright,position:[1,2]}
 ])assert.equal(normalizedCameraSample(bad),null);
 const q=convertBlenderCamera(normalizedCameraSample(upright));
 near(q.forward,[0,0,-1]);
 near(q.up,[0,1,0]);
 assert.ok(q.verticalFovDegrees>45&&q.verticalFovDegrees<50);
});
test('shared geometry landmark registration solves exact Blender/Three coordinate match',()=>{
 const registration=registrationFromLandmarks(pairs);
 assert.ok(registration?.geometryAligned);
 assert.ok(registration.maximumError<1e-7);
 assert.equal(registration.landmarkCount,4);
 for(const item of pairs){
  near(applyRegistration(blenderToThreePosition(item.blender),registration),item.three);
 }
 const result=registeredCameraPose(normalizedCameraSample(upright),registration);
 assert.ok(result);
 near(result.position,[14,11,22]);
 near(result.forward,[0,0,-1]);
 near(result.up,[0,1,0]);
});
test('a coordinate transform cannot falsely approve misaligned or different geometry',()=>{
 assert.equal(registrationFromLandmarks(pairs.slice(0,2)),null);
 assert.equal(registrationFromLandmarks([...pairs,{...pairs[0]}]),null);
 assert.equal(registrationFromLandmarks([...pairs.slice(0,3),{...pairs[3],id:'west-observatory',three:[-15,1.6,3]}])?.geometryAligned,false);
 const wrongScale=pairs.map(p=>({...p,three:p.three.map(v=>v*100)}));
 assert.equal(registrationFromLandmarks(wrongScale),null);
 const skew=pairs.map((p,i)=>({...p,three:i===3?[10,11,9]:p.three}));
 const candidate=registrationFromLandmarks(skew);
 assert.equal(candidate?.geometryAligned,false);
 assert.equal(registeredCameraPose(normalizedCameraSample(upright),candidate),null);
 const collinear=[0,1,2].map(i=>({id:'landmark-'+i,blender:[i,0,0],three:[i,0,0]}));
 assert.equal(registrationFromLandmarks(collinear),null);
});
test('geometrically registered camera is still NOT a release-quality photographic handoff',()=>{
 const approved={geometryAligned:true,approvedSequence:true,sharedWorldRevision:true,visualQA:true,gamepadSafe:true};
 assert.equal(cameraHandoffEligible(approved),true);
 for(const key of Object.keys(approved))assert.equal(cameraHandoffEligible({...approved,[key]:false}),false);
});
test('original editable Blender source exports real shared geometry and normalized frame samples',()=>{
 const script=readFileSync(new URL('../graphics/author-cinematic-institute-v136.py',import.meta.url),'utf8');
 assert.match(script,/camera_world\.to_quaternion\(\)/);
 assert.match(script,/bpy\.ops\.export_scene\.gltf\(/);
 assert.match(script,/use_selection=True/);
 assert.match(script,/source_landmarks=/);
 assert.match(script,/sourceWorldRevision/);
 assert.match(script,/geometryMatchToLiveV136011/);
 assert.match(script,/approvedForRuntime":False/);
});


test('cinematic poster does not reveal a loading GLB or flash backward during handoff',()=>{
 assert.equal(cinematicWorldReadiness('webgl','loading'),'hold');
 assert.equal(cinematicWorldReadiness('webgl',null),'hold');
 assert.equal(cinematicWorldReadiness('webgl','ready'),'ready');
 assert.equal(cinematicWorldReadiness('webgl','unavailable'),'fallback');
 assert.equal(cinematicWorldReadiness('vector',null),'fallback');
 assert.equal(cinematicWorldReadiness(null,null),'fallback');
 assert.equal(cinematicRevealWhenReady(1,'hold',.12,.74),1);
 assert.equal(cinematicRevealWhenReady(1,'ready',.12,.74),0);
 assert.equal(cinematicRevealWhenReady(.43,'fallback',.12,.74),
  cinematicRevealWhenReady(.43,'ready',.12,.74));
 const code=readFileSync(new URL('../web/src/parity/CinematicArrivalV136.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(code,/MutationObserver|handoffCommitted|data-asset-state/);
 assert.match(code,/observer.disconnect\(\)/);
 assert.ok(!/window\.location|history\.pushState|dispatchEvent/.test(code));
});
