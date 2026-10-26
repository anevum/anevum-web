/** Node 22 source and visual safety contract, no network or real accounts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cinematicMode,cinematicReveal,cinematicScrollProgress,cinematicFrameIndex,cinematicInspectionOpacity} from '../web/src/parity/cinematic-director-v136.ts';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const base={enabled:true,reducedMotion:false,forcedColors:false,saveData:false,paused:false,visible:true,hasApprovedSequence:false};
test('native fallback preserves bounded modes without unapproved media',()=>{
 assert.equal(cinematicMode(base),'poster');
 assert.equal(cinematicMode({...base,hasApprovedSequence:true}),'sequence');
 for(const key of ['reducedMotion','saveData','paused'])assert.equal(cinematicMode({...base,[key]:true,hasApprovedSequence:true}),'poster');
 assert.equal(cinematicMode({...base,visible:false,hasApprovedSequence:true}),'poster');
 assert.equal(cinematicMode({...base,forcedColors:true}),'off');
 assert.equal(cinematicMode({...base,enabled:false}),'off');
});
test('native scroll drives bounded fade; no fake document routing',()=>{
 assert.equal(cinematicScrollProgress(40,600),0);
 assert.equal(cinematicScrollProgress(0,600),0);
 assert.ok(cinematicScrollProgress(-180,600)>0);
 assert.equal(cinematicScrollProgress(-800,600),1);
 for(const [top,height] of [[NaN,500],[0,NaN],[0,0],[-100,-2]])assert.equal(cinematicScrollProgress(top,height),0);
 assert.equal(cinematicReveal(0,.12,.74),1);
 assert.equal(cinematicReveal(1,.12,.74),0);
 assert.ok(cinematicReveal(.45,.12,.74)>0&&cinematicReveal(.45,.12,.74)<1);
 assert.equal(cinematicReveal(NaN,.12,.74),1);
 assert.equal(cinematicReveal(.5,1,.5),1);
 let previous=1;
 for(let i=0;i<=100;i++){
  const value=cinematicReveal(i/100);
  assert.ok(value<=previous&&value>=0&&value<=1);
  previous=value;
 }
});
test('future authored sequence indexes remain capped without out-of-range access',()=>{
 assert.equal(cinematicFrameIndex(0,24),0);
 assert.equal(cinematicFrameIndex(1,24),23);
 assert.equal(cinematicFrameIndex(.5,24),12);
 assert.equal(cinematicFrameIndex(-100,24),0);
 assert.equal(cinematicFrameIndex(100,24),23);
 assert.equal(cinematicFrameIndex(.5,0),0);
 assert.equal(cinematicFrameIndex(.5,181),0);
});
test('react hero uses only one passive opt-in presentation layer',()=>{
 const hero=read('../web/src/parity/ParityPortalV136.tsx');
 const arrival=read('../web/src/parity/CinematicArrivalV136.tsx');
 const css=read('../web/src/parity/cinematic-arrival-v136.css');
 const world=read('../web/src/parity/LivingWorldField.tsx');
 assert.ok(hero.includes('<CinematicArrivalV136/>'));
 assert.ok(hero.indexOf('<CinematicArrivalV136/>')<hero.indexOf('<div className="p136-hero-shade"'));
 assert.match(arrival,/import.meta.env.MODE==='staging-path'/);
 assert.match(arrival,/VITE_ANEVUM_OWNER_REVIEW/);
 assert.match(arrival,/reviewCinematicVideo\(candidate.video,true\)/);
 assert.ok(arrival.includes('approvedCinematicVideo('),'Video requires reviewed manifest');
 assert.match(arrival,/canPlay&&video/);
 assert.ok(arrival.includes('aria-hidden="true"'));
 assert.match(arrival,/data-cinematic-v136="motion-first"/);
 assert.match(arrival,/ownerReview&&!posterFailed&&<picture/);
 assert.doesNotMatch(arrival,/sceneReadiness|cinematicWorldReadiness|MutationObserver/);
 assert.match(css,/p136-native-institute/);
 assert.ok(arrival.includes("useLivingWorld"));
 assert.ok(!/<(?:canvas|iframe|video)/i.test(arrival),'No second renderer, sandbox or unapproved video');
 assert.ok(!/readStatus|readSession|fetch\(|localStorage|analytics|credentials/.test(arrival),'No private/network dependency');
 assert.ok(css.includes('pointer-events:none'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('forced-colors:active'));
 assert.ok(world.includes('createInstituteRenderer'),'Keep one canonical GPU renderer');
});
test('verified source manifest prohibits invented 4K or traffic claims',()=>{
 const manifest=JSON.parse(read('../web/public/assets/cinematic-v136/arrival/manifest.json'));
 assert.equal(manifest.status,'preview-only');
 assert.equal(manifest.mode,'native-surface-pilot');
 assert.equal(manifest.sequence,null);
 assert.equal(manifest.sourceManifest,undefined);
 assert.equal(manifest.posters,undefined);
 assert.ok(!JSON.stringify(manifest).toLowerCase().includes('fake user'));
});

test('homepage has no modeled-scene dependency; archived inspection math stays valid',()=>{
 assert.equal(cinematicInspectionOpacity(true,'ready',1),0);
 assert.equal(cinematicInspectionOpacity(true,'hold',.78),.78);
 assert.equal(cinematicInspectionOpacity(true,'fallback',.32),.32);
 assert.equal(cinematicInspectionOpacity(false,'ready',.67),.67);
 const arrival=read('../web/src/parity/CinematicArrivalV136.tsx');
 assert.doesNotMatch(arrival,/Inspect live 3D|sceneReadiness|MutationObserver|cinematicInspectionOpacity/);
 assert.match(arrival,/document.visibilityState==='visible'/);
 assert.match(arrival,/connection\?\.saveData/);
 assert.match(arrival,/onError=\{\(\)=>setPosterFailed\(true\)\}/);
});
