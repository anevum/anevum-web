import test from 'node:test';
import assert from 'node:assert/strict';
import {thresholdForLevel,progressionFromXp} from '../auth/community.mjs';
import {levelProgress} from '../canonical-auth/progression.mjs';
import ARTIFACTS from '../shared/level-artifacts.json' with {type:'json'};
test('Evolution of Everything is one 30-specimen registry across both member engines',()=>{
 assert.equal(ARTIFACTS.length,30);
 assert.equal(ARTIFACTS[0].name,'Pre-Grain');
 assert.equal(ARTIFACTS[29].name,'ANEVUM');
 assert.equal(new Set(ARTIFACTS.map(a=>a.name)).size,30);
 for(let level=1;level<=30;level++){
  const xp=75*(level-1)**2;
  assert.equal(thresholdForLevel(level),xp);
  assert.equal(progressionFromXp(xp).level,level);
  assert.equal(progressionFromXp(xp).artifact,ARTIFACTS[level-1].name);
  assert.equal(levelProgress(xp).artifact,ARTIFACTS[level-1].name);
  assert.equal(levelProgress(xp).level,level);
 }
});
test('XP is preserved and continues accumulating after final level 30',()=>{
 for(const xp of [0,5,25,74,75,300,63074,63075,87025,90000,Number.MAX_SAFE_INTEGER]){
  const a=progressionFromXp(xp),b=levelProgress(xp);
  assert.equal(a.xp,xp);assert.equal(b.xp,xp);
  assert.equal(a.level,b.level);
  assert.equal(a.maxLevel,30);assert.equal(b.maxLevel,30);
 }
 const final=progressionFromXp(63075),high=progressionFromXp(90000);
 assert.equal(final.level,30);assert.equal(final.nextLevelXp,null);
 assert.equal(high.level,30);assert.equal(high.nextLevelXp,null);
 assert.equal(high.progressWithinLevel,1);
 assert.equal(high.artifact,'ANEVUM');
 assert.equal(levelProgress(90000).nextLevel,null);
});
test('invalid threshold and XP inputs never grant unauthorized levels',()=>{
 for(const v of [-1,0,1.5,31,60,Infinity])assert.throws(()=>thresholdForLevel(v),/Invalid level/);
 assert.equal(progressionFromXp(-1).level,1);
 assert.equal(progressionFromXp(Infinity).level,1);
 assert.equal(levelProgress(NaN).level,1);
});
