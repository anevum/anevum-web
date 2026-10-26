import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {approvedCinematicVideo,reviewCinematicVideo,allowMotion} from '../web/src/parity/CinematicMediaContractV136.ts';
import preview from '../web/v136-visual-review.worker.mjs';
const root=new URL('../web/public/',import.meta.url);
const candidate=JSON.parse(readFileSync(new URL('assets/cinematic-v136/arrival/review-001/manifest.json',root),'utf8'));

test('unaccepted artwork cannot acquire production approval through review validation',()=>{
 assert.equal(approvedCinematicVideo(candidate.video),null);
 assert.equal(reviewCinematicVideo(candidate.video,false),null);
 assert.equal(reviewCinematicVideo({...candidate.video,scope:'production'},true),null);
 assert.equal(reviewCinematicVideo({...candidate.video,approval:'approved'},true),null);
 const review=reviewCinematicVideo(candidate.video,true);
 assert.ok(review);assert.equal(review.approved,false);
 assert.equal(approvedCinematicVideo(review),null);
 assert.equal(reviewCinematicVideo({...candidate.video,assets:{mp4:{...candidate.video.assets.mp4,path:'https://example.com/video.mp4'}}},true),null);
});
test('media ledger matches real bounded assets and responsive derivatives',()=>{
 assert.equal(candidate.status,'owner-review-pending');
 assert.match(candidate.origin,/OpenAI image generation/);
 assert.match(candidate.represents,/Not a shipped game/);
 for(const a of [...Object.values(candidate.poster),...Object.values(candidate.video.assets)]){
  const path=new URL(a.path,root);
  assert.equal(statSync(path).size,a.bytes);
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),a.sha256);
 }
 assert.ok(candidate.poster.mobile.bytes<130_000);
 assert.ok(candidate.video.assets.mp4.bytes<2_000_000);
 assert.ok(candidate.video.assets.mp4Mobile.bytes<700_000);
});
test('ambient motion stops for every accessibility, bandwidth and visibility condition',()=>{
 const base={enabled:true,reducedMotion:false,forcedColors:false,saveData:false,paused:false,visible:true};
 assert.equal(allowMotion(base),true);
 for(const key of ['reducedMotion','forcedColors','saveData','paused'])assert.equal(allowMotion({...base,[key]:true}),false);
 for(const key of ['enabled','visible'])assert.equal(allowMotion({...base,[key]:false}),false);
});
test('review media supports anonymous byte ranges without widening API access',async()=>{
 let observed;
 const result=await preview.fetch(new Request('https://anevum-v136-visual-review-001.devonakins.workers.dev/creator/assets/cinematic-v136/arrival/review-001/continuance-720.mp4',{
  headers:{range:'bytes=0-255',cookie:'private=must-not-forward',authorization:'Bearer must-not-forward'}
 }),{ASSETS:{async fetch(req){observed=req;return new Response(new Uint8Array(256),{status:206,headers:{'content-type':'video/mp4','content-range':'bytes 0-255/1000','accept-ranges':'bytes'}})}}});
 assert.equal(result.status,206);assert.equal(result.headers.get('content-range'),'bytes 0-255/1000');
 assert.equal(observed.headers.get('range'),'bytes=0-255');
 assert.equal(observed.headers.has('cookie'),false);assert.equal(observed.headers.has('authorization'),false);
});

test('approved production motion is gated by the reviewed manifest, not a review-only build flag',()=>{
 const arrival=readFileSync(new URL('../web/src/parity/CinematicArrivalV136.tsx',import.meta.url),'utf8');
 assert.match(arrival,/const ownerReview=import\.meta\.env\.MODE==='staging-path'/);
 assert.match(arrival,/ownerReview\?reviewCinematicVideo\(candidate\.video,true\):approvedCinematicVideo\(candidate\.video\)/);
 assert.match(arrival,/enabled:Boolean\(video\)/);
 assert.doesNotMatch(arrival,/enabled:ownerReview/);
 assert.equal(approvedCinematicVideo(candidate.video),null);
});
