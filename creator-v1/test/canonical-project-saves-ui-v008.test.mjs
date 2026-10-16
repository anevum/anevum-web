import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectEngagementGateway} from "../web/src/lib/project-engagement.ts";
import {
 readCanonicalProjectSave,setCanonicalProjectSaved,CanonicalProjectSaveError
} from "../web/src/lib/canonical-project-saves.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const id="a".repeat(32);
const response=(body,status=200,type="application/json")=>
 new Response(type==="application/json"?JSON.stringify(body):"<html>blocked</html>",{
  status,headers:{"content-type":type}
 });
async function withFetch(stub,fn){
 const old=globalThis.fetch;globalThis.fetch=stub;
 try{await fn()}finally{globalThis.fetch=old}
}

test("canonical save controls appear only after real server readiness, never a client flag",()=>{
 const health={service:"anevum-canonical-auth-staging",status:"ready",registration:"invite-only"};
 assert.deepEqual(projectEngagementGateway(health),{kind:"canonical-readonly",registration:"invite-only"});
 assert.deepEqual(projectEngagementGateway({...health,projectSavesReady:false}),{kind:"canonical-readonly",registration:"invite-only"});
 assert.deepEqual(projectEngagementGateway({...health,projectSavesReady:"true"}),{kind:"canonical-readonly",registration:"invite-only"});
 assert.deepEqual(projectEngagementGateway({...health,projectSavesReady:true}),{kind:"canonical-saves",registration:"invite-only"});
 assert.deepEqual(projectEngagementGateway({...health,status:"closed",projectSavesReady:true}),{kind:"canonical-readonly",registration:"closed"});
 assert.deepEqual(projectEngagementGateway({status:"ok",signupEnabled:false,projectSavesReady:true}),{kind:"legacy"});
 assert.deepEqual(projectEngagementGateway({projectSavesReady:true}),{kind:"closed"});
});

test("GET, PUT and DELETE use only the exact same-origin canonical route and no caller identities",async()=>{
 const calls=[];
 await withFetch(async(url,init)=>{
  calls.push({url,init});
  return response(init.method==="GET"?{available:true,saved:false}:
    {saved:init.method==="PUT",changed:true});
 },async()=>{
  assert.deepEqual(await readCanonicalProjectSave(id),{available:true,saved:false});
  assert.deepEqual(await setCanonicalProjectSaved(id,true),{saved:true,changed:true});
  assert.deepEqual(await setCanonicalProjectSaved(id,false),{saved:false,changed:true});
 });
 assert.deepEqual(calls.map(c=>c.url),Array(3).fill("/api/v1/member/project-saves/"+id));
 assert.deepEqual(calls.map(c=>c.init.method),["GET","PUT","DELETE"]);
 for(const c of calls){
  assert.equal(c.init.credentials,"same-origin");
  assert.equal(c.init.mode,"same-origin");
  assert.equal(c.init.cache,"no-store");
  assert.equal(c.init.redirect,"error");
  assert.deepEqual(c.init.headers,{Accept:"application/json"});
  assert.equal(c.init.body,undefined);
  assert.equal(c.init.headers.Authorization,undefined);
  assert.equal(c.init.headers["X-Member-ID"],undefined);
 }
});

test("caller cannot force a project id or fake save payload; network never called for invalid ids",async()=>{
 await withFetch(async()=>{throw Error("unexpected fetch")},async()=>{
  for(const invalid of ["../admin","a".repeat(31),"A".repeat(32),
   "https://another.example/","a".repeat(32)+"?memberId=other"]){
   await assert.rejects(readCanonicalProjectSave(invalid),/Invalid published project identifier/);
   await assert.rejects(setCanonicalProjectSaved(invalid,true),/Invalid published project identifier/);
  }
 });
});

test("canonical save client exposes explicit guest and failure responses, no false success",async()=>{
 for(const status of [401,403,404,409,429,503]){
  await withFetch(async()=>response({error:"server-origin text ignored"},status),async()=>{
   await assert.rejects(readCanonicalProjectSave(id),
    error=>error instanceof CanonicalProjectSaveError&&error.status===status);
  });
 }
 for(const body of [{available:true,saved:"true"},{saved:true,changed:false},
  {available:false,saved:false},[],null]){
  await withFetch(async()=>response(body),async()=>{
   await assert.rejects(readCanonicalProjectSave(id),
    error=>error instanceof CanonicalProjectSaveError&&error.status===503);
  });
 }
 await withFetch(async()=>response({saved:true,changed:false}),async()=>{
  await assert.rejects(readCanonicalProjectSave(id),/Invalid project saves response/);
 });
 await withFetch(async()=>response(null,200,"text/html"),async()=>{
  await assert.rejects(setCanonicalProjectSaved(id,true),
   error=>error instanceof CanonicalProjectSaveError&&error.status===503);
 });
});

test("save UI retains guest, unavailable, and verified-member states without XP or legacy endpoints",()=>{
 const panel=read("web/src/components/MemberEngagementPanel.tsx");
 const save=read("web/src/components/CanonicalProjectSavePanel.tsx");
 const gateway=read("web/src/lib/project-engagement.ts");
 const css=read("web/src/components/project-player-shell.css");
 const stage=read("canonical-auth/worker.mjs");
 const config=JSON.parse(read("wrangler.a-progression-v031.jsonc"));
 assert.match(panel,/gateway\.kind==="canonical-readonly"\|\|gateway\.kind==="canonical-saves"/);
 assert.match(panel,/available\.data\.kind==="canonical-saves"/);
 assert.match(gateway,/value\.projectSavesReady===true/);
 assert.match(stage,/projectSavesReady:Boolean\(stageReady&&await canonicalProjectSaveReady\(env\)\)/);
 assert.match(save,/data-avp-availability=\{guest\?"canonical-saves-guest":"canonical-saves-unavailable"\}/);
 assert.match(save,/data-avp-availability="canonical-saves-member"/);
 assert.match(save,/aria-pressed=\{saved\}/);
 assert.match(save,/setCanonicalProjectSaved\(projectId,!saved\)/);
 assert.match(save,/Rating and XP are not active/);
 assert.match(save,/No client-generated achievements, XP or rankings/);
 assert.doesNotMatch(save,/memberVote|memberMe|memberSetSaved|localStorage|awardXp|grantXp/);
 assert.match(css,/\.avp-project \.avp-canonical-save \.avp-participation-actions button\{[^}]*min-height:56px/);
 assert.equal(config.vars?.CANONICAL_PROJECT_SAVES_ENABLED,undefined);
 const fixture=read("test/portal-offline-preview.mjs");
 const capture=read("test/capture-sitewide-v012.mjs");
 assert.match(fixture,/playerMemberHealthMode==="canonical-saves"/);
 assert.match(fixture,/syntheticProjectSaved/);
 assert.match(capture,/PLAYER_V008_PRIVATE_SAVE_/);
 assert.match(capture,/PLAYER_V008_LEGACY_IDENTITY_LEAK_/);
 assert.match(capture,/player-v008-canonical-save-before-/);
 assert.doesNotMatch(read("web/src/main.tsx"),/syntheticProjectSaved|__player-member-fixture/);
});
