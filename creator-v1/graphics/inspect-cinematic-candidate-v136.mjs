#!/usr/bin/env node
/** Independent candidate inspector for Blender/FFmpeg output. Never approves or deploys. */
import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const arg=process.argv.indexOf('--candidate');
assert.ok(arg!==-1&&process.argv[arg+1]&&!process.argv[arg+1].startsWith('--'),'Usage: --candidate DIR');
const root=resolve(process.argv[arg+1]);
const doc=JSON.parse(readFileSync(resolve(root,'candidate-manifest.json'),'utf8'));
assert.equal(doc.schema,'anevum.cinematic.candidate.v1');
assert.equal(doc.status,'UNREVIEWED_NOT_FOR_PRODUCTION');
assert.equal(doc.sequence.approved,false);
assert.equal(doc.video.approved,false);
assert.equal(doc.safety.requiresVideoCspReview,true);
assert.ok(Number.isInteger(doc.sequence.count)&&doc.sequence.count>=4&&doc.sequence.count<=180);
assert.ok(Number.isInteger(doc.fps)&&doc.fps>=6&&doc.fps<=30);
assert.equal(doc.sequence.count,doc.source.count);
assert.match(doc.source.frameSourceDigest,/^[a-f0-9]{64}$/);
const actual=(spec,ext)=>{
 assert.ok(spec&&typeof spec==='object');
 assert.match(spec.path,new RegExp('^[a-z0-9/_-]+\\.'+ext+'$'));
 assert.ok(!spec.path.includes('..')&&!spec.path.includes('//'),'No traversal or absolute asset');
 const full=resolve(root,spec.path);
 assert.ok(full.startsWith(root+sep),'Candidate asset escaped root');
 assert.ok(existsSync(full),'Missing candidate '+spec.path);
 const bytes=readFileSync(full);
 assert.equal(bytes.byteLength,spec.bytes,'Byte-length drift '+spec.path);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),spec.sha256,'Content drift '+spec.path);
 return full;
};
function probe(path){
 const r=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height,codec_name','-of','json',path],{encoding:'utf8'});
 assert.equal(r.status,0,'Invalid media: '+path+'\n'+r.stderr);
 const stream=JSON.parse(r.stdout).streams?.[0];assert.ok(stream?.width>0&&stream.height>0);
 return stream;
}
let checked=0;
for(const [tier,maxBytes] of [['mobile',3_800_000],['desktop',8_500_000]]){
 const poster=doc.posters[tier],set=doc.sequence[tier];
 const info=probe(actual(poster,'webp'));
 assert.equal(info.width,poster.width);assert.equal(info.height,poster.height);
 assert.equal(set.frames.length,doc.sequence.count);
 assert.equal(set.width,poster.width);assert.equal(set.height,poster.height);
 let sum=0;const names=new Set();
 for(let i=0;i<set.frames.length;i++){
  const frame=set.frames[i];
  assert.match(frame.path,new RegExp('^frames/'+tier+'/frame-'+String(i+1).padStart(3,'0')+'\\.webp$'));
  assert.ok(!names.has(frame.path));names.add(frame.path);
  const path=actual(frame,'webp');sum+=frame.bytes;
  if(i===0||i===set.frames.length-1){const stream=probe(path);assert.equal(stream.width,set.width);assert.equal(stream.height,set.height);}
  checked++;
 }
 assert.equal(sum,set.bytes,'Sequence byte discrepancy');
 assert.ok(sum<=maxBytes,'Candidate transfer exceeds '+tier+' approved budget');
}
for(const [kind,spec] of Object.entries(doc.video.assets)){
 assert.ok(['mp4','webm'].includes(kind));
 assert.ok(spec.bytes<12_000_000);
 const p=actual(spec,kind);
 const info=probe(p);
 assert.equal(info.width,spec.width);assert.equal(info.height,spec.height);
 assert.ok(kind==='mp4'?['h264','av1','hevc'].includes(info.codec_name):['vp9','vp8','av1'].includes(info.codec_name));
 checked++;
}
if(doc.source.camera){
 assert.equal(doc.source.camera.schema,'anevum.cinematic.camera.v1');
 assert.match(doc.source.camera.handoffStatus,/UNREGISTERED/);
 assert.ok(doc.source.camera.nativeWidth>=640&&doc.source.camera.nativeHeight>=360);
 assert.equal(doc.source.camera.frames,doc.sequence.count);
}
console.log(JSON.stringify({status:'CINEMATIC_CANDIDATE_VALIDATED_UNREVIEWED',files:checked+2,
 sourceNativePixels:[doc.source.width,doc.source.height],
 sequenceBytes:{mobile:doc.sequence.mobile.bytes,desktop:doc.sequence.desktop.bytes},
 optionalVideo:Object.keys(doc.video.assets).length,
 camera:doc.source.camera?.cameraId||'not-supplied',
 readyForProduction:false},null,2));
