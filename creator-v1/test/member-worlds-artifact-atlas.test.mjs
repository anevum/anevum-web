import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { progressionFromXp, thresholdForLevel } from "../auth/community.mjs";
import { seriesOneArtifacts, seriesOneArtifactAt, serverConfirmedArtifact } from "../web/src/lib/series-one.ts";
import { seriesOneStudies } from "../web/src/lib/artifact-art.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Series One has exactly 60 named relics matching authoritative verified progression",()=>{
  assert.equal(seriesOneArtifacts.length,60);
  assert.equal(new Set(seriesOneArtifacts.map(x=>x.name)).size,60);
  for(let i=1;i<=60;i++){
    const item=seriesOneArtifactAt(i);
    assert.equal(item.level,i);
    const xp=thresholdForLevel(i);
    const actual=progressionFromXp(xp);
    assert.equal(actual.level,i);
    assert.equal(actual.artifact,item.name);
    assert.equal(serverConfirmedArtifact(i,actual.artifact),item);
  }
  assert.equal(seriesOneArtifactAt(0),null);
  assert.equal(seriesOneArtifactAt(61),null);
  assert.equal(seriesOneArtifactAt(Number.POSITIVE_INFINITY),null);
  assert.equal(serverConfirmedArtifact(1,"fabricated"),null);
  assert.equal(serverConfirmedArtifact(40,null),null);
  assert.equal(progressionFromXp(thresholdForLevel(61)).artifact,null);
  assert.equal(progressionFromXp(thresholdForLevel(61)).maxLevel,null);
});

test("unfinished artifact art is explicitly pending, not repetitive earned art",()=>{
  assert.deepEqual(seriesOneArtifacts.filter(x=>x.artStatus==="illustrated-study").map(x=>x.level),[1,2,30,60]);
  assert.deepEqual(seriesOneStudies.map(x=>x.level),[1,2,30,60]);
  const atlas=read("web/src/components/ArtifactAtlas.tsx");
  const levels=read("web/src/pages/LevelsPage.tsx");
  assert.match(levels,/ArtifactAtlas/);
  assert.match(atlas,/ILLUSTRATION PENDING/);
  assert.match(atlas,/PERSONAL INVENTORY IS SEPARATE/);
  assert.match(atlas,/seriesOneArtifacts\.map|items\.map/);
  assert.match(atlas,/aria-pressed/);
  for(const token of ["memberAward","awardXp","purchaseXP","Math.random","localStorage","fetch("])
    assert.ok(!atlas.includes(token),token);
});

test("personal @handle pages are valid and fail closed when public identity is unavailable",()=>{
  const app=read("web/src/App.tsx"),page=read("web/src/pages/MemberWorldPage.tsx");
  assert.match(app,/path=":vanity" element={<MemberWorldPage\/>}/);
  assert.match(page,/vanity\.startsWith\("@"/);
  assert.match(page,/HANDLE\.test\(handle\)/);
  assert.match(page,/memberCreatorProfile\(handle, signal\)/);
  assert.match(page,/readCreator\(handle, signal\)/);
  assert.match(page,/readProjects\(\{ creator: handle, limit: "12" \}, signal\)/);
  assert.match(page,/THIS WORLD IS NOT PUBLIC/);
  assert.match(page,/No sample followers or posts are being shown as real/);
  assert.match(page,/achievements\.filter\(achievement => achievement\.earned\)/);
  assert.doesNotMatch(page,/localStorage|sessionStorage|Math\.random|fakeFollowers|setEarned|awardXp|dangerouslySetInnerHTML/);
  assert.ok(app.indexOf('path="status"') < app.indexOf('path=":vanity"'),"Static app routes must precede the vanity route");
});

test("member worlds and relic atlas preserve small-screen and motion accessibility",()=>{
  const css=read("web/src/member-worlds.css"),main=read("web/src/main.tsx");
  assert.match(main,/import "\.\/member-worlds\.css";/);
  for(const token of ["member-world-hero","member-world-aside","series-atlas-grid","series-atlas-inspector"])
    assert.ok(css.includes(token),token);
  for(const breakpoint of ["900px","650px","370px"])
    assert.ok(css.includes(breakpoint),breakpoint);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/forced-colors:active/);
});
