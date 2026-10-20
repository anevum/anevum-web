// Synthetic, fully isolated SQLite: no real users, projects, Workers or Stripe.
import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {fixture} from "./helpers/canonical-fixture.mjs";
import {createCanonicalStageWorker} from "../canonical-auth/worker.mjs";
import {canonicalProjectSave,canonicalProjectSaveReady,canonicalProjectSaveExport,parseProjectSaveCursor} from "../canonical-auth/project-saves.mjs";
import {canonicalExportMember} from "../canonical-auth/profile.mjs";
import publicCreatorApi from "../api/worker.mjs";
const ORIGIN="https://a.anevum.com",PATH="/api/v1/member/project-saves/",projectId="a".repeat(32);
const alice={id:"pilot-alice",name:"Alice",email:"alice@fixture.invalid",emailVerified:true};
const bob={id:"pilot-bob",name:"Bob",email:"bob@fixture.invalid",emailVerified:true};
const migration=readFileSync(new URL("../canonical-auth/migrations/0007_private_project_saves.sql",import.meta.url),"utf8");
const req=(id=projectId,method="GET",options={})=>
 new Request((options.origin||ORIGIN)+PATH+id+(options.search||""),{
  method,headers:{
   accept:"application/json",
   ...(method==="PUT"||method==="DELETE"?{origin:ORIGIN,"sec-fetch-site":"same-origin"}:{}),
   ...(options.headers||{})
  },...(options.body===undefined?{}:{body:options.body})
 });
function setup({enabled=true,migrate=true,published=true}={}){
 const f=fixture();
 if(migrate)f.db.exec(migration);
 for(const person of [alice,bob])f.db.prepare(
  "INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,?,?)"
 ).run(person.id,person.name,person.email,100,100);
 const publicDb=new DatabaseSync(":memory:");
 // Mirrors the real public Creator API's required projection so staging
 // schema drift breaks both the read-only catalogue and this save pilot.
 publicDb.exec("CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY,status TEXT NOT NULL,"+
   "handle TEXT NOT NULL DEFAULT 'offline_maker',display_name TEXT NOT NULL DEFAULT 'Offline Maker');"+
   "CREATE TABLE projects(id TEXT PRIMARY KEY,owner_member_id TEXT NOT NULL,"+
   "status TEXT NOT NULL,published_at TEXT,title TEXT NOT NULL DEFAULT 'Verified Project',"+
   "summary TEXT NOT NULL DEFAULT 'A verified sample for isolated tests',"+
   "category TEXT NOT NULL DEFAULT 'games',slug TEXT NOT NULL DEFAULT 'verified-project',"+
   "source_url TEXT,demo_url TEXT,free_to_use INTEGER NOT NULL DEFAULT 1,"+
   "license_name TEXT,description TEXT NOT NULL DEFAULT 'Approved fixture record',"+
   "ai_disclosure TEXT NOT NULL DEFAULT 'No AI in fixture',"+
   "human_contribution TEXT NOT NULL DEFAULT 'Offline testing');");
 publicDb.prepare("INSERT INTO creator_profiles(member_id,status) VALUES(?,?)").run("original-creator","active");
 publicDb.prepare("INSERT INTO projects(id,owner_member_id,status,published_at) VALUES(?,?,?,?)")
  .run(projectId,"original-creator",published?"published":"draft","2000-01-01 00:00:00");
 const community={prepare(sql){let args=[];const st={
  bind(...v){args=v;return st},
  async first(){return publicDb.prepare(sql).get(...args)||null},
  async all(){return {success:true,results:publicDb.prepare(sql).all(...args)}}
 };return st}};
 const env={...f.env,COMMUNITY_DB:community};
 if(enabled)env.CANONICAL_PROJECT_SAVES_ENABLED="true";
 return {db:f.db,publicDb,env,close(){f.db.close();publicDb.close()},
  workerFor(getSession){return createCanonicalStageWorker({authFactory:()=>({api:{getSession}})})}};
}
function withAccount(f){
 const seen=[];
 const worker=f.workerFor(async({headers})=>{
  seen.push({cookie:headers.get("cookie"),authorization:headers.get("authorization")});
  const token=(headers.get("cookie")||"").match(/anevum_can_stage\.session_token=(alice|bob)/);
  return token?{user:token[1]==="alice"?alice:bob,session:{id:token[1]}}:null;
 });
 const call=(id=projectId,method="GET",who="alice",options={})=>
  worker.fetch(req(id,method,{...options,headers:{
   ...(who?{cookie:"__Secure-anevum_can_stage.session_token="+who}:{}),
   ...(options.headers||{})
  }}),f.env);
 return {worker,call,seen};
}
const data=async response=>response.json();

test("migration is private-only with cascade, and deployed config has no activation switch",()=>{
 assert.match(migration,/REFERENCES "user"\(id\) ON DELETE CASCADE/);
 assert.match(migration,/PRIMARY KEY\(member_user_id,public_project_id\)/);
 assert.doesNotMatch(migration,/INSERT INTO member_project_saves|ALTER TABLE projects|member_xp_events/);
 const worker=readFileSync(new URL("../canonical-auth/worker.mjs",import.meta.url),"utf8");
 assert.match(worker,/CANONICAL_PROJECT_SAVES_ENABLED/);
 assert.match(worker,/sameOriginMutation/);
 assert.match(worker,/withoutForeignCookies/);
 const config=JSON.parse(readFileSync(new URL("../wrangler.a-progression-v031.jsonc",import.meta.url),"utf8"));
 assert.equal(config.vars?.CANONICAL_PROJECT_SAVES_ENABLED,undefined);
 assert.deepEqual(config.d1_databases.map(b=>b.binding),["COMMUNITY_DB","MEMBER_DB"]);
 assert.deepEqual(config.routes,[]);
});

test("disabled flag or absent private schema leaves all canonical save routes inert",async()=>{
 for(const options of [{enabled:false},{migrate:false}]){
  const f=setup(options);try{
   assert.equal(await canonicalProjectSaveReady(f.env),false);
   let sessions=0;
   const worker=f.workerFor(async()=>{sessions++;return {user:alice}});
   for(const method of ["GET","PUT","DELETE"]){
    const response=await worker.fetch(req(projectId,method),f.env);
    assert.equal(response.status,options.enabled===false?404:503);
   }
   assert.equal(sessions,options.enabled===false?0:3);
  }finally{f.close()}
 }
 const f=setup();try{
  const invalid={...f.env,COMMUNITY_DB:f.env.MEMBER_DB};
  assert.equal(await canonicalProjectSaveReady(invalid),false);
  assert.equal((await canonicalProjectSave(req(projectId),invalid,alice)).status,404);
 }finally{f.close()}
});

test("worker binds saves to Better Auth cookies, never arbitrary identity or cross-site actions",async()=>{
 const f=setup();try{
  const {call,seen}=withAccount(f);
  assert.equal((await call(projectId,"GET",null)).status,401);
  assert.equal((await call(projectId,"GET",null,{
   headers:{cookie:"better-auth.session_token=legacy-token; other=tracking",authorization:"Bearer legacy"}
  })).status,401);
  assert.equal(seen.at(-1).cookie,null);
  assert.equal(seen.at(-1).authorization,null);
  assert.equal((await call(projectId,"PUT","alice",{headers:{origin:"https://evil.example","sec-fetch-site":"cross-site"}})).status,403);
  assert.equal((await call(projectId,"DELETE","alice",{headers:{origin:"https://anevum.com"}})).status,403);
  assert.equal((await call(projectId,"POST","alice")).status,405);
  assert.equal((await call(projectId,"GET","alice",{search:"?memberId=pilot-bob"})).status,404);
  assert.equal((await call("../admin","GET","alice")).status,404);
  assert.equal((await call(projectId,"PUT","alice",{body:'{"memberId":"pilot-bob"}'})).status,400);
  assert.equal((await call()).status,200);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_project_saves").get().n,0);
 }finally{f.close()}
});

test("published projects save idempotently with strict member ownership and no XP",async()=>{
 const f=setup();try{
  const {call}=withAccount(f);
  assert.deepEqual(await data(await call()),{available:true,saved:false});
  assert.deepEqual(await data(await call(projectId,"PUT")),{saved:true,changed:true});
  assert.deepEqual(await data(await call(projectId,"PUT")),{saved:true,changed:false});
  assert.deepEqual(await data(await call()),{available:true,saved:true});
  assert.deepEqual(await data(await call(projectId,"GET","bob")),{available:true,saved:false});
  assert.deepEqual(await data(await call(projectId,"DELETE","bob")),{saved:false,changed:false});
  assert.deepEqual(await data(await call(projectId,"DELETE")),{saved:false,changed:true});
  assert.deepEqual(await data(await call(projectId,"DELETE")),{saved:false,changed:false});
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_xp_events").get().n,0);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_reward_notifications").get().n,0);
 }finally{f.close()}
});

test("withdrawn, future and inactive-creator records cannot be exposed, but private saves can be removed",async()=>{
 const f=setup();try{
  const {call}=withAccount(f);
  assert.equal((await call(projectId,"PUT")).status,200);
  const changes=[
   ()=>f.publicDb.prepare("UPDATE projects SET status='draft' WHERE id=?").run(projectId),
   ()=>f.publicDb.prepare("UPDATE projects SET status='published',published_at='2999-01-01' WHERE id=?").run(projectId),
   ()=>{f.publicDb.prepare("UPDATE projects SET published_at='2000-01-01' WHERE id=?").run(projectId);
        f.publicDb.prepare("UPDATE creator_profiles SET status='inactive'").run()}
  ];
  for(const change of changes){
   change();
   assert.equal((await call(projectId,"GET")).status,404);
   assert.equal((await call(projectId,"PUT")).status,404);
  }
  assert.deepEqual(await data(await call(projectId,"DELETE")),{saved:false,changed:true});
 }finally{f.close()}
});

test("unverified member, unknown published ID and request bodies cannot save",async()=>{
 const f=setup();try{
  assert.equal((await canonicalProjectSave(req(projectId,"PUT"),f.env,{...alice,emailVerified:false})).status,403);
  assert.equal((await canonicalProjectSave(req("b".repeat(32),"PUT"),f.env,alice)).status,404);
  assert.equal((await canonicalProjectSave(req(projectId,"PUT",{body:'{}'}),f.env,alice)).status,400);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_project_saves").get().n,0);
 }finally{f.close()}
});

test("server limits saves to 200 and 60 actual changes per hour",async()=>{
 const f=setup();try{
  const stmt=f.db.prepare("INSERT INTO member_project_saves(member_user_id,public_project_id,saved_at) VALUES(?,?,?)");
  for(let i=0;i<200;i++)stmt.run(alice.id,String(i).padStart(32,"0"),1700000000+i);
  assert.equal((await canonicalProjectSave(req(projectId,"PUT"),f.env,alice,{now:1700000000000})).status,409);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_project_save_rate_limits WHERE member_user_id=?").get(alice.id).n,0,
    "A rejected over-capacity save must not consume mutation allowance");
  f.db.prepare("DELETE FROM member_project_saves WHERE member_user_id=?").run(alice.id);
  for(let i=0;i<60;i++){
   const method=i%2===0?"PUT":"DELETE";
   const response=await canonicalProjectSave(req(projectId,method),f.env,alice,{now:1700000000000});
   assert.equal(response.status,200,"mutation "+i);
   assert.equal((await response.json()).changed,true);
  }
  assert.equal((await canonicalProjectSave(req(projectId,"PUT"),f.env,alice,{now:1700000000000})).status,429);
  assert.equal((await canonicalProjectSave(req(projectId,"PUT"),f.env,alice,{now:1700003601000})).status,200);
 }finally{f.close()}
});

test("private exports preserve saved IDs when disabled; erasure cascades member-only saves",async()=>{
 const f=setup();try{
  const {call}=withAccount(f);
  assert.equal((await call(projectId,"PUT")).status,200);
  assert.deepEqual(await canonicalProjectSaveExport(f.env.MEMBER_DB,alice.id),[projectId]);
  assert.deepEqual(await canonicalProjectSaveExport(f.env.MEMBER_DB,bob.id),[]);
  const disabled={...f.env,CANONICAL_PROJECT_SAVES_ENABLED:"false"};
  assert.deepEqual(await canonicalProjectSaveExport(disabled.MEMBER_DB,alice.id),[projectId]);
  const response=await canonicalExportMember(new Request(ORIGIN+"/api/v1/member/account-export"),disabled,alice,ORIGIN);
  assert.equal(response.status,200);
  const exported=await response.json();
  assert.deepEqual(exported.savedPublicProjectIds,[projectId]);
  assert.equal(JSON.stringify(exported).includes(bob.id),false);
  f.db.prepare('DELETE FROM "user" WHERE id=?').run(alice.id);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_project_saves").get().n,0);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_project_save_rate_limits").get().n,0);
 }finally{f.close()}
});


const collection=(who="alice",search="",method="GET")=>
 new Request(ORIGIN+"/api/v1/member/project-saves"+search,{
  method,headers:{
   accept:"application/json",
   ...(who?{cookie:"__Secure-anevum_can_stage.session_token="+who}:{}),
   ...(method==="PUT"?{origin:ORIGIN,"sec-fetch-site":"same-origin"}:{})
  }
 });

test("private saved works list verifies owner, approved public metadata and no legacy bridge",async()=>{
 const f=setup();try{
  const {worker}=withAccount(f);
  assert.equal((await worker.fetch(collection(null),f.env)).status,401);
  assert.deepEqual(await data(await worker.fetch(collection("alice"),f.env)),{items:[],nextCursor:null});
  assert.equal((await canonicalProjectSave(req(projectId,"PUT"),f.env,alice)).status,200);
  const a=await data(await worker.fetch(collection("alice"),f.env));
  const b=await data(await worker.fetch(collection("bob"),f.env));
  assert.deepEqual(b,{items:[],nextCursor:null});
  assert.equal(a.items.length,1);
  assert.deepEqual(Object.keys(a.items[0]).sort(),[
   "category","creatorHandle","creatorName","id","publishedAt","savedAt","summary","title"].sort());
  assert.equal(a.items[0].id,projectId);
  assert.equal(a.items[0].title,"Verified Project");
  assert.equal(a.items[0].creatorHandle,"offline_maker");
  assert.equal(typeof a.items[0].savedAt,"number");
  assert.equal(a.nextCursor,null);
  assert.doesNotMatch(JSON.stringify(a),/pilot-alice|pilot-bob|@fixture|password|session/);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_xp_events").get().n,0);
 }finally{f.close()}
});

test("disabled collection routes do not read sessions; schema missing fails closed",async()=>{
 for(const options of [{enabled:false},{migrate:false}]){
  const f=setup(options);try{
   let sessions=0;
   const worker=f.workerFor(async()=>{sessions++;return {user:alice}});
   const result=await worker.fetch(collection(),f.env);
   assert.equal(result.status,options.enabled===false?404:503);
   assert.equal(sessions,options.enabled===false?0:1);
  }finally{f.close()}
 }
 const f=setup();try{
  const worker=withAccount(f).worker;
  for(const query of ["?limit=0","?limit=25","?limit=012","?limit=2&limit=3",
    "?after=bogus","?after=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","?memberId=pilot-bob",
    "?limit=2&after=a@b"]){
   assert.equal((await worker.fetch(collection("alice",query),f.env)).status,400,query);
  }
  assert.equal((await worker.fetch(collection("alice","","POST"),f.env)).status,405);
  assert.equal((await worker.fetch(collection("bob","?after="+
    "eyJwcm9maWxlIjoicGlsb3QtYWxpY2UifQ"),f.env)).status,400);
 }finally{f.close()}
});

test("canonical collection uses private keyset cursor, pages at most 24, and filters withdrawn work",async()=>{
 const f=setup();try{
  const insertSave=f.db.prepare(
   "INSERT INTO member_project_saves(member_user_id,public_project_id,saved_at) VALUES(?,?,?)");
  const insertProject=f.publicDb.prepare(
   "INSERT INTO projects(id,owner_member_id,status,published_at,title) VALUES(?,?,?,?,?)");
  const ids=[];
  for(let i=1;i<=31;i++){
   const id=i.toString(16).padStart(32,"0");
   ids.push(id);
   insertProject.run(id,"original-creator","published","2000-01-01 00:00:00","Approved work "+i);
   insertSave.run(alice.id,id,1700000000+i);
  }
  const worker=withAccount(f).worker;
  const first=await data(await worker.fetch(collection("alice","?limit=12"),f.env));
  assert.equal(first.items.length,12);
  assert.ok(first.nextCursor);
  assert.deepEqual(parseProjectSaveCursor(first.nextCursor),[
   1700000020,ids[19]
  ]);
  const second=await data(await worker.fetch(collection("alice","?limit=12&after="+first.nextCursor),f.env));
  assert.equal(second.items.length,12);
  assert.ok(second.nextCursor);
  const third=await data(await worker.fetch(collection("alice","?limit=12&after="+second.nextCursor),f.env));
  assert.equal(third.items.length,7);
  assert.equal(third.nextCursor,null);
  const pageIds=[...first.items,...second.items,...third.items].map(item=>item.id);
  assert.equal(pageIds.length,31);
  assert.equal(new Set(pageIds).size,31);
  assert.equal(pageIds[0],ids[30]);
  assert.equal(pageIds.at(-1),ids[0]);
  assert.deepEqual(await data(await worker.fetch(collection("bob","?limit=24"),f.env)),{items:[],nextCursor:null});
  // Withdraw from the first page; the private cursor still advances across
  // the hidden record while never surfacing its former public metadata.
  const forbidden=ids[29],future=ids[28],inactive=ids[27];
  f.publicDb.prepare("UPDATE projects SET status='draft' WHERE id=?").run(forbidden);
  f.publicDb.prepare("UPDATE projects SET published_at='2999-01-01' WHERE id=?").run(future);
  // Simulate a creator suspension separately and then restore it.
  f.publicDb.prepare("UPDATE creator_profiles SET status='inactive'").run();
  const suspended=await data(await worker.fetch(collection("alice","?limit=12"),f.env));
  assert.equal(suspended.items.length,0);
  assert.ok(suspended.nextCursor);
  f.publicDb.prepare("UPDATE creator_profiles SET status='active'").run();
  const hidden=await data(await worker.fetch(collection("alice","?limit=12"),f.env));
  assert.equal(hidden.items.length,10);
  assert.equal(hidden.nextCursor,first.nextCursor);
  assert.ok(hidden.items.every(item=>item.id!==forbidden&&item.id!==future));
  assert.equal(hidden.items.some(item=>item.id===inactive),true);
  assert.equal((await worker.fetch(collection("alice","?limit=24"),f.env)).status,200);
 }finally{f.close()}
});

test("canonical collection never hydrates withdrawn metadata and allows private owner deletion",async()=>{
 const f=setup();try{
  const worker=withAccount(f).worker;
  await canonicalProjectSave(req(projectId,"PUT"),f.env,alice);
  f.publicDb.prepare("UPDATE projects SET status='draft',title='Private work' WHERE id=?").run(projectId);
  const list=await data(await worker.fetch(collection("alice"),f.env));
  assert.deepEqual(list,{items:[],nextCursor:null});
  assert.doesNotMatch(JSON.stringify(list),/Private work|Verified Project/);
  assert.deepEqual(await data(await canonicalProjectSave(req(projectId,"DELETE"),f.env,alice)),{saved:false,changed:true});
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM member_project_saves").get().n,0);
 }finally{f.close()}
});


test("readiness compiles real public and private column projections; incomplete schemas fail closed",async()=>{
 for(const change of [
  f=>f.publicDb.exec("ALTER TABLE projects RENAME COLUMN title TO unavailable_title"),
  f=>f.publicDb.exec("ALTER TABLE creator_profiles RENAME COLUMN handle TO hidden_handle"),
  f=>f.db.exec("ALTER TABLE member_project_saves RENAME COLUMN saved_at TO old_saved_at"),
  f=>f.db.exec("ALTER TABLE member_project_save_rate_limits RENAME COLUMN requests TO old_requests")
 ]){
  const f=setup();try{
   assert.equal(await canonicalProjectSaveReady(f.env),true);
   change(f);
   assert.equal(await canonicalProjectSaveReady(f.env),false);
   const worker=withAccount(f).worker;
   const health=await data(await worker.fetch(
    new Request(ORIGIN+"/api/v1/member/health"),f.env));
   assert.equal(health.projectSavesReady,false);
   assert.equal((await worker.fetch(req(projectId,"GET",{headers:{
    cookie:"__Secure-anevum_can_stage.session_token=alice"
   }}),f.env)).status,503);
  }finally{f.close()}
 }
});

test("project saves and collection use the exact visible public API approval boundary",async()=>{
 const f=setup();try{
  const worker=withAccount(f).worker;
  const publicDetail=async()=>publicCreatorApi.fetch(
   new Request(ORIGIN+"/api/v1/projects/"+projectId),{COMMUNITY_DB:f.env.COMMUNITY_DB});
  const publicList=async()=>publicCreatorApi.fetch(
   new Request(ORIGIN+"/api/v1/projects?limit=24"),{COMMUNITY_DB:f.env.COMMUNITY_DB});
  const assertEqualVisibility=async visible=>{
   const detail=await publicDetail(),list=await data(await publicList());
   const canonical=await worker.fetch(req(projectId,"GET",{headers:{
     cookie:"__Secure-anevum_can_stage.session_token=alice"
   }}),f.env);
   const collectionData=await data(await worker.fetch(collection(),f.env));
   assert.equal(detail.status,visible?200:404);
   assert.equal(list.items.some(x=>x.id===projectId),visible);
   assert.equal(canonical.status,visible?200:404);
   assert.equal(collectionData.items.length,visible?1:0);
   if(visible){
    const details=await data(detail),save=collectionData.items[0];
    for(const [publicName,savedName] of [
     ["id","id"],["title","title"],["summary","summary"],["category","category"],
     ["creatorHandle","creatorHandle"],["creatorName","creatorName"],
     ["publishedAt","publishedAt"]
    ])assert.equal(details.item[publicName],save[savedName]);
   }
  };
  await canonicalProjectSave(req(projectId,"PUT"),f.env,alice);
  await assertEqualVisibility(true);
  f.publicDb.prepare("UPDATE projects SET status='draft' WHERE id=?").run(projectId);
  await assertEqualVisibility(false);
  f.publicDb.prepare("UPDATE projects SET status='published',published_at='2999-01-01' WHERE id=?").run(projectId);
  await assertEqualVisibility(false);
  f.publicDb.prepare("UPDATE projects SET published_at='2000-01-01 00:00:00' WHERE id=?").run(projectId);
  f.publicDb.prepare("UPDATE creator_profiles SET status='inactive'").run();
  await assertEqualVisibility(false);
  f.publicDb.prepare("UPDATE creator_profiles SET status='active'").run();
  await assertEqualVisibility(true);
 }finally{f.close()}
});
