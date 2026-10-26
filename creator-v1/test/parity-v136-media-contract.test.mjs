/** V136.014 cinematic media validation on Node 22. No browser/GPU/network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  approvedCinematicSequence,approvedCinematicVideo,allowMotion,frameAt,
  isCinemaPath,CINEMATIC_DECODE_CACHE_LIMIT
} from '../web/src/parity/CinematicMediaContractV136.ts';
const digest='a'.repeat(64);
const dummyFrame=(tier,i)=>({path:'assets/cinematic-v136/arrival/frames/'+tier+'/frame-'+String(i).padStart(3,'0')+'.webp',bytes:1200,sha256:digest});
const makeSequence=()=>({
 approved:true, fps:24,count:4,cameraId:'atrium-cinema-014-source-v1',
 desktop:{width:1536,height:864,bytes:4800,frames:[1,2,3,4].map(i=>dummyFrame('desktop',i))},
 mobile:{width:768,height:432,bytes:4800,frames:[1,2,3,4].map(i=>dummyFrame('mobile',i))}
});
test('only first-party same-origin immutable image/video asset paths',()=>{
 for(const path of ['https://evil.test/a.webp','//evil.test/a.webp','/assets/cinematic-v136/a.webp',
  'assets/cinematic-v136/../../other.webp','assets/cinematic-v136/arrival//x.webp',
  'assets/cinematic-v136/arrival/../../x.webp','assets/cinematic-v136/arrival/x.svg',
  'assets/cinematic-v136/arrival/x.webp?token=123','assets/parity-v136/x.webp']){
  assert.equal(isCinemaPath(path,'webp'),false,path);
 }
 assert.equal(isCinemaPath(dummyFrame('desktop',1).path,'webp'),true);
 assert.equal(isCinemaPath('assets/cinematic-v136/arrival/cinematic-mp4.mp4','mp4'),true);
 assert.equal(isCinemaPath('assets/cinematic-v136/arrival/cinematic-webm.webm','webm'),true);
});
test('only bounded explicitly approved exact-count hash-verified sequences',()=>{
 const valid=makeSequence();
 assert.ok(approvedCinematicSequence(valid));
 assert.equal(approvedCinematicSequence({...valid,approved:false}),null);
 assert.equal(approvedCinematicSequence({...valid,count:181}),null);
 assert.equal(approvedCinematicSequence({...valid,cameraId:'n/a'}),null);
 assert.equal(approvedCinematicSequence({...valid,desktop:{...valid.desktop,bytes:1}}),null);
 assert.equal(approvedCinematicSequence({...valid,desktop:{...valid.desktop,frames:valid.desktop.frames.slice(0,3)}}),null);
 const duplicate=makeSequence();duplicate.mobile.frames[2]={...duplicate.mobile.frames[1]};
 assert.equal(approvedCinematicSequence(duplicate),null);
 const remote=makeSequence();remote.desktop.frames[0].path='https://untrusted.example/v.webp';
 assert.equal(approvedCinematicSequence(remote),null);
 const noSha=makeSequence();noSha.desktop.frames[0].sha256='bad';
 assert.equal(approvedCinematicSequence(noSha),null);
 const tooLarge=makeSequence();tooLarge.mobile.bytes=10_000_000;
 assert.equal(approvedCinematicSequence(tooLarge),null);
});
test('scroll maps deterministically to approved frames without loading a queue of all frames',()=>{
 const sequence=approvedCinematicSequence(makeSequence());
 assert.ok(sequence);
 assert.equal(frameAt(sequence,'mobile',0).path,dummyFrame('mobile',1).path);
 assert.equal(frameAt(sequence,'mobile',1).path,dummyFrame('mobile',4).path);
 assert.equal(frameAt(sequence,'desktop',.51).path,dummyFrame('desktop',3).path);
 assert.equal(CINEMATIC_DECODE_CACHE_LIMIT,3);
});
test('native video requires separate explicit CSP contract, approval and bounded same-origin source',()=>{
 const video={approved:true,requiresMediaSrcSelf:true,assets:{
  mp4:{path:'assets/cinematic-v136/arrival/cinematic-mp4.mp4',bytes:3200,sha256:digest},
  webm:{path:'assets/cinematic-v136/arrival/cinematic-webm.webm',bytes:2800,sha256:digest}
 }};
 assert.ok(approvedCinematicVideo(video));
 assert.equal(approvedCinematicVideo({...video,approved:false}),null);
 assert.equal(approvedCinematicVideo({...video,requiresMediaSrcSelf:false}),null);
 assert.equal(approvedCinematicVideo({...video,assets:{mp4:{...video.assets.mp4,path:'https://untrusted.test/m.mp4'}}}),null);
 assert.equal(approvedCinematicVideo({...video,assets:{webm:{...video.assets.webm,bytes:15_000_000}}}),null);
});
test('motion obeys saved-data, reduced-motion, pause, forced colors and visibility',()=>{
 const base={enabled:true,reducedMotion:false,saveData:false,paused:false,forcedColors:false,visible:true};
 assert.equal(allowMotion(base),true);
 for(const key of ['reducedMotion','saveData','paused','forcedColors'])assert.equal(allowMotion({...base,[key]:true}),false);
 assert.equal(allowMotion({...base,visible:false}),false);
 assert.equal(allowMotion({...base,enabled:false}),false);
});
test('actual Arrival, native video and frame player preserve the same DOM and one WebGL renderer',()=>{
 const r=path=>readFileSync(new URL(path,import.meta.url),'utf8');
 const arrival=r('../web/src/parity/CinematicArrivalV136.tsx');
 const video=r('../web/src/parity/CinematicVideoV136.tsx');
 const frames=r('../web/src/parity/CinematicFramesV136.tsx');
 const world=r('../web/src/parity/LivingWorldField.tsx');
 assert.match(arrival,/reviewCinematicVideo\(/);
 assert.match(arrival,/approvedCinematicVideo\(/);
 assert.match(arrival,/VITE_ANEVUM_OWNER_REVIEW/);
 assert.match(arrival,/canPlay&&video&&<CinematicVideoV136/);
 assert.match(video,/preload="none"/);
 assert.match(video,/muted playsInline loop/);
 assert.match(video,/document\.addEventListener\('visibilitychange'/);
 assert.match(frames,/CINEMATIC_DECODE_CACHE_LIMIT/);
 assert.ok(!/<canvas\b/.test(arrival+frames+video));
 assert.match(world,/createInstituteRenderer/);
 assert.ok(!/fetch\(|readSession|window\.localStorage|navigator\.sendBeacon/.test(arrival+video+frames));
});
test('existing authored asset manifest is poster-only until creative review',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../web/public/assets/cinematic-v136/arrival/manifest.json',import.meta.url),'utf8'));
 assert.equal(approvedCinematicSequence(manifest.sequence),null);
 assert.equal(approvedCinematicVideo(manifest.video),null);
});
