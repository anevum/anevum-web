import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {progressionFromXp,thresholdForLevel} from "../auth/community.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
const catalog=JSON.parse(readFileSync(join(root,"art/relic-series-one-production.json"),"utf8"));
const read=p=>readFileSync(join(root,p),"utf8");

test("60 original relic identities match existing authoritative server progression",()=>{
 assert.equal(catalog.schema,"anevum.relic-art-direction.v1");
 assert.equal(catalog.requiredMasters,60);
 assert.equal(catalog.specs.length,60);
 assert.equal(new Set(catalog.specs.map(x=>x.renderKey)).size,60);
 assert.equal(new Set(catalog.specs.map(x=>x.visualSubject)).size,60);
 for(const [i,item] of catalog.specs.entries()){
  const level=i+1,actual=progressionFromXp(thresholdForLevel(level));
  assert.equal(item.level,level);
  assert.equal(item.name,actual.artifact);
  assert.match(item.renderKey,/^series-01\/[0-9]{2}-[a-z0-9-]+$/);
  assert.equal(item.assetRole,"presentation-only");
  assert.equal(item.state,"master-pending");
  assert.ok(item.visualSubject.length>=38);
  assert.ok(item.materials.length>=18);
 }
 assert.equal(progressionFromXp(thresholdForLevel(61)).maxLevel,null);
 assert.equal(progressionFromXp(thresholdForLevel(61)).artifact,null);
});

test("high resolution master acceptance never asserts non-existent artwork is complete",()=>{
 const source=read("ops/build-series-one-raster.py");
 const atlas=read("web/src/components/ArtifactAtlas.tsx");
 const renderer=read("web/src/components/RelicRaster.tsx");
 const generated=read("web/src/lib/relic-raster-assets.ts");
 const members=read("web/src/pages/MemberWorldPage.tsx");
 assert.match(source,/2048/);
 assert.match(source,/Image.Resampling.LANCZOS/);
 assert.match(source,/sha256/);
 assert.match(source,/Missing approved master/);
 assert.match(source,/Duplicate artwork file/);
 assert.match(source,/transparent/);
 assert.match(source,/--render/);
 assert.match(generated,/Record<number/);
 if(!existsSync(join(root,"art/masters/series-01/01-foundry-spark.png")))
   assert.match(generated,/= \{\}/,"No candidate art can be shown before approved masters are installed");
 assert.match(renderer,/hasApprovedRelicRaster/);
 assert.match(renderer,/srcSet/);
 assert.match(renderer,/loading="lazy"/);
 assert.match(atlas,/RENDERED RELIC/);
 assert.match(atlas,/ILLUSTRATION PENDING/);
 assert.match(members,/level\?\.artifact/);
 for(const part of [generated,atlas,renderer]){
  assert.doesNotMatch(part,/grantXp|purchaseXP|fakeReward|Math.random/);
 }
 assert.match(source,/Manual visual acceptance and code review are REQUIRED/);
});
