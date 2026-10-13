import test from "node:test";
import assert from "node:assert/strict";
import {thresholdForLevel,progressionFromXp} from "../auth/community.mjs";

test("early levels retain current XP semantics until pacing is approved",()=>{
 assert.equal(thresholdForLevel(1),0);
 assert.equal(thresholdForLevel(2),20);
 assert.equal(thresholdForLevel(60),69620);
 const p=progressionFromXp(20);
 assert.equal(p.level,2);
 assert.equal(p.xp,20);
 assert.equal(p.maxLevel,null);
 assert.equal(p.artifact,"Copper Key");
});
test("level sixty is no longer the end, and the first art series remains intact",()=>{
 const sixty=progressionFromXp(thresholdForLevel(60));
 assert.equal(sixty.level,60);
 assert.equal(sixty.artifact,"The First Light");
 assert.equal(sixty.nextLevelXp,thresholdForLevel(61));
 assert.ok(sixty.progressWithinLevel>=0&&sixty.progressWithinLevel<=1);
 const sixtyOne=progressionFromXp(thresholdForLevel(61));
 assert.equal(sixtyOne.level,61);
 assert.equal(sixtyOne.maxLevel,null);
 assert.equal(sixtyOne.artifact,null);
 assert.equal(sixtyOne.artifactEarned,false);
 assert.equal(sixtyOne.nextLevelXp,thresholdForLevel(62));
 assert.equal(sixtyOne.progressWithinLevel,0);
});
test("very high levels are mathematically monotone and finite",()=>{
 const hundred=progressionFromXp(thresholdForLevel(100));
 const thousand=progressionFromXp(thresholdForLevel(1000));
 assert.equal(hundred.level,100);
 assert.equal(thousand.level,1000);
 assert.ok(thousand.nextLevelXp>thousand.levelStartXp);
 assert.ok(Number.isFinite(thousand.progressWithinLevel));
 assert.equal(progresssionSafe(-4),1);
 function progresssionSafe(value){return progressionFromXp(value).level;}
 assert.equal(progressionFromXp(Infinity).level,1);
 assert.equal(progressionFromXp(Number.MAX_SAFE_INTEGER).maxLevel,null);
});
test("bad threshold input does not create negative or fractional levels",()=>{
 for(const v of [-1,0,1.5,Infinity])assert.throws(()=>thresholdForLevel(v),/Invalid level/);
});
