import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import publicApi from "../api/worker.mjs";
import stagedSite from "../web/a-staging-worker.mjs";
import {memberShowcaseRoutes} from "../auth/showcase.mjs";
import {readPublicShowcase,publicSelection} from "../shared/public-showcase.mjs";
import {progressionFromXp,earnedArtifactsThroughLevel} from "../auth/community.mjs";
import {deriveAchievements} from "../auth/social.mjs";

function harness(){
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec(`CREATE TABLE schema_migrations(version TEXT PRIMARY KEY);
 CREATE TABLE member_accounts(id TEXT PRIMARY KEY,status TEXT NOT NULL);
 CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY,handle TEXT UNIQUE,status TEXT NOT NULL);
 CREATE TABLE projects(id TEXT PRIMARY KEY,owner_member_id TEXT NOT NULL,status TEXT NOT NULL,published_at TEXT);
 CREATE TABLE project_releases(id TEXT PRIMARY KEY,project_id TEXT);
 CREATE TABLE community_project_votes(member_id TEXT,project_id TEXT,status TEXT);
 CREATE TABLE community_xp_events(member_id TEXT,amount INTEGER);
 CREATE TABLE community_posts(author_member_id TEXT,status TEXT,published_at TEXT);`);
 const migration=readFileSync(new URL("../auth/migrations/0015_creator_profile_showcase.sql",import.meta.url),"utf8");
 sqlite.exec(migration);
 sqlite.exec(`INSERT INTO member_accounts VALUES('m1','active'),('m2','active'),('m3','suspended');
 INSERT INTO creator_profiles VALUES('m1','aurora','active'),('m2','hidden','active'),('m3','silenced','active');
 INSERT INTO projects VALUES('p1','m1','published','2026-10-01'),('p2','m2','pending_review',NULL),('p3','m3','published','2026-10-02');
 INSERT INTO community_project_votes VALUES('m1','p1','active');
 INSERT INTO community_xp_events VALUES('m1',80);`);
 const db={prepare(statement){
   const run=params=>{
     const stmt=sqlite.prepare(statement);
     return stmt.all(...params).map(row=>({...row}));
   };
   return {
     all:async()=>({success:true,results:run([])}),
     bind(...params){return {all:async()=>({success:true,results:run(params)})};}
   };
 }};
 return {sqlite,db,member:{id:"m1",handle:"aurora"},close:()=>sqlite.close()};
}
const req=(path,method="GET",body)=>new Request("https://next.anevum.com"+path,{
 method,headers:body===undefined?undefined:{"content-type":"application/json"},
 body:body===undefined?undefined:JSON.stringify(body)});
const update=(h,body)=>memberShowcaseRoutes(req("/api/v1/member/showcase","POST",body),h.db,h.member,async()=>true,1792000000);
const settings=h=>memberShowcaseRoutes(req("/api/v1/member/showcase"),h.db,h.member,async()=>true,1792000000);
function publicConsent(h) {
 h.sqlite.prepare("INSERT INTO member_showcase_selections(member_id,artifact_key,award_keys_json,is_public,revision,updated_at) VALUES('m1',NULL,'[]',1,1,1792000000)").run();
}


test("legacy public flatten mirror matches every issued artifact, XP threshold and earned achievement",()=>{
 for(let level=1;level<=65;level++){
  const xp=20*(level-1)*(level-1);
  const authoritative=progressionFromXp(xp);
  const roster=earnedArtifactsThroughLevel(level);
  const stats={xp,ratings:26,publishedProjects:4,releases:1};
  const awards=deriveAchievements(stats).filter(a=>a.earned);
  const selected=awards.slice(0,3).map(a=>a.key);
  for(const item of [roster[0],roster.at(-1),undefined]){
   const projection=publicSelection({
     artifact_key:item||null,award_keys_json:JSON.stringify(selected)},stats);
   assert.equal(projection.level,authoritative.level);
   assert.equal(projection.currentArtifact,authoritative.artifact);
   assert.equal(projection.earnedAwardCount,awards.length);
   assert.deepEqual(projection.featuredAwards.map(x=>x.key),selected);
   assert.equal(projection.equippedArtifact?.name||null,item||null);
  }
 }
 const unknown=publicSelection(null,{xp:0,ratings:0,publishedProjects:0,releases:0});
 assert.equal(unknown.level,1);
 assert.deepEqual(unknown.featuredAwards,[]);
});

test("projection exposes only real progress, not auto-selected or fictional awards",async()=>{
 const h=harness();try{
  assert.equal(await readPublicShowcase(h.db,"aurora"),null,"unselected public projection must default private");
  publicConsent(h);
  const shown=await readPublicShowcase(h.db,"aurora");
  assert.equal(shown.level,3);
  assert.equal(shown.currentArtifact,"Blackglass Seed");
  assert.equal(shown.equippedArtifact,null);
  assert.deepEqual(shown.featuredAwards,[]);
  assert.equal(shown.earnedAwardCount,2);
  assert.equal(await readPublicShowcase(h.db,"hidden"),null);
  assert.equal(await readPublicShowcase(h.db,"silenced"),null);
  assert.equal(await readPublicShowcase(h.db,"x"),null);
  assert.deepEqual(publicSelection({artifact_key:"NOT OWNED",award_keys_json:'["forged"]'},
    {xp:80,ratings:0,publishedProjects:0,releases:0}).featuredAwards,[]);
 }finally{h.close()}
});

test("authenticated selector accepts owned relics, earned awards, clear and hides public loadout",async()=>{
 const h=harness();try{
  const initial=await settings(h);
  assert.equal(initial.status,200);
  const data=await initial.json();
  assert.equal(data.selection.revision,0);
  assert.equal(data.selection.isPublic,false,"never expose new member achievements by default");
  assert.equal(await readPublicShowcase(h.db,"aurora"),null);
  assert.ok(data.availableArtifacts.includes("Copper Key"));
  assert.deepEqual(data.availableAwards.map(x=>x.key).sort(),["first-launch","first-signal"]);
  const payload={artifactKey:"Copper Key",awardKeys:["first-signal","first-launch"],isPublic:true,revision:0};
  const result=await update(h,payload);
  assert.equal(result.status,200,await result.clone().text());
  assert.equal((await result.json()).selection.revision,1);
  const shown=await readPublicShowcase(h.db,"aurora");
  assert.equal(shown.equippedArtifact.name,"Copper Key");
  assert.deepEqual(shown.featuredAwards.map(x=>x.key),payload.awardKeys);
  assert.equal((await update(h,payload)).status,409,"stale revision must not win");
  const hidden=await update(h,{...payload,revision:1,isPublic:false});
  assert.equal(hidden.status,200);
  assert.equal(await readPublicShowcase(h.db,"aurora"),null,"opt-out must suppress earned level too");
  assert.equal((await settings(h)).status,200,"owner may still edit private selection");
 }finally{h.close()}
});

test("authenticated selector refuses imaginary, unearned and duplicate achievements",async()=>{
 const h=harness();try{
  for(const payload of [
   {artifactKey:"The First Light",awardKeys:[],isPublic:true,revision:0},
   {artifactKey:null,awardKeys:["release-steward"],isPublic:true,revision:0},
   {artifactKey:null,awardKeys:["first-signal","first-signal"],isPublic:true,revision:0},
   {artifactKey:null,awardKeys:["first-signal","first-launch","keen-eye","portal-guide"],isPublic:true,revision:0},
  ]){
   const r=await update(h,payload);
   assert.ok([400,403].includes(r.status),await r.clone().text());
  }
  const unauthed=await memberShowcaseRoutes(req("/api/v1/member/showcase"),h.db,null,async()=>true,1792000000);
  assert.equal(unauthed.status,401);
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) AS n FROM member_showcase_selections").get().n,0);
 }finally{h.close()}
});

test("revoked earned award vanishes from public selection on subsequent reads",async()=>{
 const h=harness();try{
  const saved=await update(h,{artifactKey:"Foundry Spark",awardKeys:["first-signal","first-launch"],isPublic:true,revision:0});
  assert.equal(saved.status,200);
  h.sqlite.exec("UPDATE community_project_votes SET status='hidden' WHERE member_id='m1'");
  const shown=await readPublicShowcase(h.db,"aurora");
  assert.deepEqual(shown.featuredAwards.map(x=>x.key),["first-launch"]);
 }finally{h.close()}
});

test("opt-in semantics apply to batch projection and anonymous visitors",async()=>{
 const h=harness();try{
  const base=await publicApi.fetch(req("/api/v1/community/showcases?handles=aurora"),{COMMUNITY_DB:h.db});
  assert.equal(base.status,200);
  assert.deepEqual(Object.keys((await base.json()).items),[]);
  publicConsent(h);
  const allowed=await publicApi.fetch(req("/api/v1/community/showcases?handles=aurora"),{COMMUNITY_DB:h.db});
  assert.deepEqual(Object.keys((await allowed.json()).items),["aurora"]);
  h.sqlite.exec("UPDATE member_showcase_selections SET is_public=0 WHERE member_id='m1'");
  const hidden=await publicApi.fetch(req("/api/v1/community/showcases?handles=aurora"),{COMMUNITY_DB:h.db});
  assert.deepEqual(Object.keys((await hidden.json()).items),[]);
 }finally{h.close()}
});


test("unmigrated staging never reveals earned artifacts and member selections remain unavailable",async()=>{
 const h=harness();try{
  h.sqlite.exec("DROP TABLE member_showcase_selections");
  assert.equal(await readPublicShowcase(h.db,"aurora"),null);
  const publicResult=await publicApi.fetch(req("/api/v1/community/showcases?handles=aurora"),{COMMUNITY_DB:h.db});
  assert.equal(publicResult.status,200);
  assert.deepEqual(Object.keys((await publicResult.json()).items),[]);
  const privateResult=await settings(h);
  assert.equal(privateResult.status,503,"requires the approved migration");
 }finally{h.close()}
});

test("creator page and selected emblems cannot bypass public opt-in",()=>{
 const creator=readFileSync(new URL("../web/src/pages/CreatorsPage.tsx",import.meta.url),"utf8");
 const legacy=readFileSync(new URL("../auth/social.mjs",import.meta.url),"utf8");
 const artwork=readFileSync(new URL("../web/src/components/PublicAuthorShowcase.tsx",import.meta.url),"utf8");
 assert.match(creator,/readPublicShowcases/);
 assert.match(creator,/publicShowcase/);
 assert.doesNotMatch(creator,/detailed\.progression|detailed\.achievements/);
 assert.match(legacy,/progression:isOwner\?/);
 assert.match(legacy,/achievements:isOwner\?/);
 assert.match(artwork,/seriesOneArtifactMotif\(artifact\)/,"equipped art uses the equipped name, not current level");
});

test("published-only API validates author enumeration and never writes",async()=>{
 const h=harness();try{
  publicConsent(h);
  const call=(path,method="GET")=>publicApi.fetch(req(path,method),{COMMUNITY_DB:h.db});
  const good=await call("/api/v1/community/showcases?handles=aurora,hidden,silenced");
  assert.equal(good.status,200);
  const data=await good.json();
  assert.deepEqual(Object.keys(data.items),["aurora"]);
  for(const bad of ["","?handles=aurora&handles=hidden","?handles=aurora,aurora",
    "?handles=../../private","?unexpected=x",
    "?handles="+Array.from({length:11},(_,i)=>"maker"+i).join(",")]){
    const r=await call("/api/v1/community/showcases"+bad);
    assert.equal(r.status,400,bad);
  }
  assert.equal((await call("/api/v1/community/showcases?handles=aurora","POST")).status,405);
 }finally{h.close()}
});

test("a.anevum.com staging permits public GET only, strips identity, and protects apex",async()=>{
 const h=harness();try{
  publicConsent(h);
  const env={COMMUNITY_DB:h.db,ASSETS:{fetch:async()=>new Response("ok")}};
  const call=(path,method="GET")=>stagedSite.fetch(new Request("https://a.anevum.com"+path,{method}),env,{});
  const result=await call("/api/v1/community/showcases?handles=aurora");
  assert.equal(result.status,200);
  assert.equal((await result.json()).items.aurora.level,3);
  assert.equal((await call("/api/v1/member/showcase")).status,404);
  assert.equal((await call("/api/v1/community/showcases?handles=aurora","POST")).status,405);
  const apex=await stagedSite.fetch(new Request("https://anevum.com/api/v1/community/showcases?handles=aurora"),env,{});
  assert.equal(apex.status,404);
 }finally{h.close()}
});
