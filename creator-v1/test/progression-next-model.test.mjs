import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ACTIVITIES,TRACKS,EXPEDITIONS,threshold,summarizeProgress,selectActivities,simulatePacing,PACING} from '../web/src/lib/progression-next-model.ts';
test('nineteen unique activities cover four tracks and truthful candidate status',()=>{
 assert.equal(ACTIVITIES.length,19);assert.equal(TRACKS.length,4);
 assert.equal(new Set(ACTIVITIES.map(x=>x.id)).size,19);
 for(const a of ACTIVITIES){assert.ok(TRACKS.some(t=>t.id===a.track));assert.ok(Number.isInteger(a.xp)&&a.xp>=0&&a.xp<=150);assert.ok(a.limit.length>10&&a.evidence.length>15);assert.match(a.href,/^\/(discover(?:\?category=libraries)?|saved|community|studio)$/)}
 assert.deepEqual(ACTIVITIES.filter(a=>a.stage==='staging-only').map(a=>a.id),['rating']);
 assert.equal(ACTIVITIES.find(a=>a.id==='save').xp,0);
 assert.ok(!ACTIVITIES.some(a=>/login|purchase|streak|profile/.test(a.id)));
});
test('search, track intersection and empty results are deterministic',()=>{
 assert.equal(selectActivities('all','').length,19);
 assert.ok(selectActivities('creation','').every(a=>a.track==='creation'));
 assert.equal(selectActivities('all',' ACCESSIBILITY ')[0].id,'accessibility');
 assert.equal(selectActivities('creation','accessibility').length,0);
 assert.equal(selectActivities('all','nonexistent zzz').length,0);
});
test('all expedition routes point to defined proposals and no bonus is minted',()=>{
 for(const e of EXPEDITIONS){assert.equal(e.steps.length,3);assert.ok(ACTIVITIES.some(a=>a.id===e.activity));assert.ok(!Object.hasOwn(e,'bonus'))}
});
test('thirty-level thresholds preserve 75*(level-1)^2',()=>{
 for(let i=1;i<=30;i++)assert.equal(threshold(i),75*(i-1)**2);
 assert.equal(threshold(30),63075);
 for(const v of [0,31,NaN,1.5,Infinity])assert.throws(()=>threshold(v));
});
test('progress requires matching safe server totals, starts, and next thresholds',()=>{
 assert.deepEqual(summarizeProgress({xp:77,level:2,levelStart:75,nextLevel:300}),{xp:77,level:2,start:75,next:300,percent:0});
 assert.equal(summarizeProgress({xp:63075,level:30,levelStart:63075,nextLevel:null}).percent,100);
 for(const raw of [null,{},[],{xp:-1,level:1},{xp:0,level:2},{xp:1.5,level:1},{xp:'77',level:2},{xp:77,level:2,levelStart:0,nextLevel:300},{xp:300,level:2,levelStart:75,nextLevel:300},{xp:0,level:31}])assert.equal(summarizeProgress(raw),null);
});
test('weekly simulations reveal rather than hide slow long-term pacing',()=>{
 assert.equal(simulatePacing(15,52).level,4);
 for(const p of PACING){const y=simulatePacing(p.weeklyXp,52);assert.ok(y.level<10);assert.equal(y.xp,p.weeklyXp*52)}
 assert.throws(()=>simulatePacing(-1,1));assert.throws(()=>simulatePacing(100,1.2));assert.throws(()=>simulatePacing(Infinity,1));
});
test('preview is default-off, leaves canonical routes and one IREN intact',()=>{
 const app=readFileSync(new URL('../web/src/App.tsx',import.meta.url),'utf8');
 const page=readFileSync(new URL('../web/src/pages/ProgressionNextReviewPage.tsx',import.meta.url),'utf8');
 assert.match(app,/VITE_PROGRESSION_NEXT_REVIEW===\"true\"/);
 assert.match(app,/__review\/progression/);assert.match(app,/path=\"levels\" element={<LevelsPage/);
 assert.match(page,/useMemberProgression/);assert.match(page,/key={memberId}/);
 assert.match(page,/No XP is granted from this preview/);
 assert.doesNotMatch(page,/xp-test|localStorage|method:\s*['\"]POST|new IREN|level-artifacts/);
 assert.match(page,/anevum:iren-open/);
});
test('motion respects pause, hidden tabs, reduced motion and forced colors',()=>{
 const css=readFileSync(new URL('../web/src/pages/progression-next-review.css',import.meta.url),'utf8');
 const page=readFileSync(new URL('../web/src/pages/ProgressionNextReviewPage.tsx',import.meta.url),'utf8');
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/forced-colors:active/);
 assert.match(css,/animation-play-state:paused/);assert.match(page,/visibilitychange/);
 assert.match(page,/<dialog/);assert.match(page,/onCancel={close}/);
});
