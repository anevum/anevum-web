/** PARITY V136.015 — verify camera + source GLB + landmarks are from the SAME authored Blender scene.
 * Read-only and offline. Never approves a render or enables site traffic.
 * Usage: node --experimental-strip-types creator-v1/graphics/inspect-cinematic-camera-v136.mjs --source DIR --candidate DIR
 */
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {
 blenderToThreePosition,normalizedCameraSample,convertBlenderCamera,
 registrationFromLandmarks,registeredCameraPose,cameraHandoffEligible
} from '../web/src/parity/CinematicCameraRegistrationV136.ts';
const args=process.argv.slice(2);
function option(name){
 const at=args.indexOf('--'+name);
 assert.ok(at!==-1&&args[at+1]&&!args[at+1].startsWith('--'),'Expected --'+name+' DIR');
 return resolve(args[at+1]);
}
const root=option('source'),candidate=option('candidate');
const camera=JSON.parse(readFileSync(join(root,'camera-manifest.json'),'utf8'));
const landmarks=JSON.parse(readFileSync(join(root,'camera-landmarks-review.json'),'utf8'));
const encoded=JSON.parse(readFileSync(join(candidate,'candidate-manifest.json'),'utf8'));
assert.equal(camera.schema,'anevum.cinematic.camera.v1');
assert.equal(landmarks.schema,'anevum.cinematic.landmarks.v1');
assert.equal(camera.coordinateSystem,'Blender-Z-up-to-glTF-Y-up');
assert.equal(landmarks.sourceCameraId,camera.cameraId);
assert.equal(landmarks.worldRevision,camera.worldRevision);
assert.equal(camera.geometryExport.sourceWorldRevision,camera.worldRevision);
assert.equal(camera.geometryExport.approvedForRuntime,false,'Candidate must not accidentally go live');
assert.equal(camera.geometryExport.geometryMatchToLiveV136011,false,'Do not claim old Atrium geometry matches Blender');
assert.equal(landmarks.runtimeGeometryMatchApproved,false,'No unreviewed spatial handoff');
assert.match(camera.handoffStatus,/UNREGISTERED/);
assert.equal(camera.frames,encoded.sequence.count);
assert.equal(camera.frames,encoded.source.count);
assert.equal(camera.samples?.length,camera.frames);
assert.equal(camera.quality,'preview','Automated CI cannot claim full master render');
assert.equal(camera.nativeWidth,encoded.source.width);
assert.equal(camera.nativeHeight,encoded.source.height);
assert.equal(encoded.source.camera?.worldRevision,camera.worldRevision);
assert.equal(encoded.status,'UNREVIEWED_NOT_FOR_PRODUCTION');
const safeFile=file=>{
 assert.match(file,/^[a-z0-9-]+\.glb$/);
 const path=resolve(root,file);
 assert.ok(path.startsWith(root+sep));
 return path;
};
const binary=readFileSync(safeFile(camera.geometryExport.file));
assert.equal(binary.length,camera.geometryExport.bytes);
assert.equal(binary.length,statSync(safeFile(camera.geometryExport.file)).size);
assert.ok(binary.length>32_000&&binary.length<30_000_000,'Review geometry has reasonable bounded size');
assert.equal(createHash('sha256').update(binary).digest('hex'),camera.geometryExport.sha256);
assert.equal(camera.geometryExport.sha256,landmarks.reviewGeometrySha256);
assert.equal(binary.subarray(0,4).toString('utf8'),'glTF');
assert.equal(binary.readUInt32LE(4),2);
assert.equal(binary.readUInt32LE(8),binary.length);
assert.equal(binary.subarray(16,20).toString('utf8'),'JSON');
const gltf=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString('utf8'));
assert.ok(gltf.meshes?.length>25,'Original reviewed geometry cannot be an empty token scene');
assert.ok(gltf.nodes?.length>25);
assert.ok(!JSON.stringify(gltf).includes('http://')&&!JSON.stringify(gltf).includes('https://'),'No remote asset dependency');
assert.ok(!gltf.buffers?.some(x=>x.uri),'Only self-contained GLB');
assert.equal(camera.geometryExport.objectCount>=100,true,'Model must contain sculpted first master structures');
assert.equal(landmarks.pairs.length,camera.sourceLandmarks.length);
const pairs=landmarks.pairs.map((item,i)=>{
 assert.equal(item.id,camera.sourceLandmarks[i].id);
 assert.deepEqual(item.blender,camera.sourceLandmarks[i].blender);
 assert.equal(item.three.length,3);
 const expected=blenderToThreePosition(item.blender);
 for(let k=0;k<3;k++)assert.ok(Math.abs(item.three[k]-expected[k])<1e-6);
 return item;
});
const registration=registrationFromLandmarks(pairs);
assert.ok(registration?.geometryAligned,'Shared source GLB must be convertible without reprojection error');
assert.ok(registration.maximumError<1e-4);
let first=null,last=null;
for(let i=0;i<camera.samples.length;i++){
 const value=normalizedCameraSample(camera.samples[i]);
 assert.ok(value,'Invalid frame '+(i+1));
 assert.equal(value.frame,i+1,'Contiguous authored camera frame samples');
 const pose=registeredCameraPose(value,registration);
 assert.ok(pose,'Camera must register to its own reviewed source geometry');
 assert.ok(pose.verticalFovDegrees>15&&pose.verticalFovDegrees<100);
 if(i===0)first=pose;
 if(i===camera.samples.length-1)last=pose;
}
assert.equal(cameraHandoffEligible({
 geometryAligned:registration.geometryAligned,approvedSequence:false,
 sharedWorldRevision:false,visualQA:false,gamepadSafe:false
}),false,'Camera+geometry alignment by itself never activates public seamless handoff');
console.log(JSON.stringify({
 status:'ORIGINAL_CAMERA_GEOMETRY_SOURCE_MATCH_ONLY',
 cameraId:camera.cameraId,revision:camera.worldRevision,
 geometry:{bytes:binary.length,meshes:gltf.meshes.length,nodes:gltf.nodes.length,sha256:camera.geometryExport.sha256},
 samples:camera.samples.length,landmarks:registration.landmarkCount,
 maximumError:registration.maximumError,sourcePose:{start:first,end:last},
 publicActivation:false,liveOldAtriumMatch:false,visualQA:false
},null,2));
