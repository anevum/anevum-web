import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {achievementArt,achievementMotif,seriesOneMotif,seriesOneStudies} from "../web/src/lib/artifact-art.ts";
import {ACHIEVEMENTS} from "../auth/social.mjs";
import {progressionFromXp} from "../auth/community.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const svg=read("web/src/components/CelestialEmblem.tsx");
const css=read("web/src/celestial-artifacts.css");
const levels=read("web/src/pages/LevelsPage.tsx");
const account=read("web/src/pages/MemberAccountPage.tsx");
const creator=read("web/src/pages/CreatorsPage.tsx");
const panel=read("web/src/components/LevelPanel.tsx");
const main=read("web/src/main.tsx");
const fixture=read("test/portal-offline-preview.mjs");

test("six illustrated achievement motifs match EXACT verified server achievement keys",()=>{
 assert.equal(achievementArt.length,6);
 assert.deepEqual(achievementArt.map(x=>x.key),ACHIEVEMENTS.map(x=>x.key));
 assert.equal(new Set(achievementArt.map(x=>x.art)).size,6);
 for(const item of achievementArt){
   assert.equal(achievementMotif(item.key),item.art);
   assert.ok(item.description.length>18);
 }
 assert.equal(achievementMotif("__untrusted_public_input__"),null);
});

test("limited Series One art studies do not synthesize server items or invent an end-of-level cap",()=>{
 assert.deepEqual(seriesOneStudies.map(x=>x.level),[1,2,30,60]);
 assert.equal(new Set(seriesOneStudies.map(x=>x.name)).size,4);
 for(const study of seriesOneStudies){
   const atThreshold=progressionFromXp(20*(study.level-1)**2);
   assert.equal(atThreshold.level,study.level);
   assert.equal(atThreshold.artifact,study.name);
   assert.equal(seriesOneMotif(atThreshold.level,atThreshold.artifact),study.motif);
 }
 assert.equal(seriesOneMotif(61,null),"orbital");
 assert.equal(seriesOneMotif(999,null),"orbital");
 assert.equal(seriesOneMotif(2,"wrong title"),"orbital");
 assert.equal(seriesOneMotif(-4,"Foundry Spark"),"orbital");
 assert.equal(seriesOneMotif(1.2,"Foundry Spark"),"orbital");
 assert.equal(seriesOneMotif(1,null),"orbital");
 assert.equal(progressionFromXp(20*60**2).maxLevel,null);
});

test("full-detail emblems use isolated SVG defs, original gradient/material layers and independent pixel-designed small motifs",()=>{
 assert.match(svg,/const uid=useId\(\)\.replace/);
 assert.match(svg,/function MicroMotif/);
 assert.match(svg,/\["nano","tiny","micro","compact"\]/);
 assert.match(svg,/linearGradient/);
 assert.match(svg,/radialGradient/);
 assert.match(svg,/ringTicks\.map/);
 assert.match(svg,/starPoints\.map/);
 assert.match(svg,/Motif name={motif}/);
 for(const token of ["nano","tiny","micro","compact","small","medium","large","hero"])
   assert.ok(css.includes("celestial-emblem--"+token),token);
 for(const size of ["16px","20px","24px","32px","48px","96px","146px","220px"])
   assert.ok(css.includes(size),size);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/@media\(hover:none\),\(pointer:coarse\)/);
 assert.match(main,/import "\.\/cosmic-observatory\.css";\s*import "\.\/celestial-artifacts\.css";/);
});

test("public level collection and medal states remain server-controlled",()=>{
 assert.match(levels,/<LevelCollection\/>/);
 assert.match(levels,/useMemberProgression/);
 assert.match(levels,/earned=Boolean\(p\?\.awards/);
 assert.match(levels,/earned=\{earned\}/);
 for(const text of ['10 XP','25 XP','does not grant extra XP','FIRST 60 ARTIFACTS'])assert.ok(levels.includes(text));
 assert.doesNotMatch(levels,/localStorage|sessionStorage|purchaseXP/);
});

test("private account and public channel never infer earned state from artwork",()=>{
 assert.match(account,/a\.earned\?"earned":"locked"/);
 assert.match(account,/seriesOneMotif\(progress\.data\.progression\.level,progress\.data\.progression\.artifact\)/);
 assert.match(account,/progress\.data\.progression\.artifactEarned\?"earned":"preview"/);
 assert.match(account,/cabinet\.data\.achievements\.map/);
 assert.match(panel,/useMemberProgression/);
 assert.match(panel,/<LevelEmblem level=\{p\?\.level\|\|1\}/);
 assert.match(creator,/earned=detailed\?\.achievements\?\.filter\(a=>a\.earned\)/);
 assert.match(creator,/state="earned"/);
 assert.match(creator,/detailed\.progression\.artifactEarned\?"earned":"preview"/);
 for(const component of [levels,account,creator,panel]){
   assert.doesNotMatch(component,/localStorage|sessionStorage|onClick=\{.*award|purchaseXP/);
 }
});

test("offline screenshot fixture is isolated, visibly labeled synthetic and cannot generate real account awards",()=>{
 assert.match(fixture,/SYNTHETIC OFFLINE REVIEW/);
 assert.match(fixture,/synthetic-account@anevum\.invalid/);
 assert.match(fixture,/url\.pathname==="\/api\/v1\/member\/community\/me"/);
 assert.match(fixture,/url\.pathname==="\/api\/v1\/member\/creators\/offline_artist"/);
 assert.match(fixture,/u\.pathname==="\/creator\/account"/);
 assert.match(fixture,/127\.0\.0\.1:4178/);
 assert.match(fixture,/No credential verification, writes, project or staff actions/);
});
