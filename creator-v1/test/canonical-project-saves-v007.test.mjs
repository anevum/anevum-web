// Synthetic, fully isolated SQLite: no real users, projects, Workers or Stripe.
import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {fixture} from "./helpers/canonical-fixture.mjs";
import {createCanonicalStageWorker} from "../canonical-auth/worker.mjs";
import {canonicalProjectSave,canonicalProjectSaveReady,canonicalProjectSaveExport} from "../canonical-auth/project-saves.mjs";
import {canonicalExportMember} from "../canonical-auth/profile.mjs";
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
 publicDb.exec("CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY,status TEXT NOT NULL);"+
   "CREATE TABLE projects(id TEXT PRIMARY KEY,owner_member_id TEXT NOT NULL,"+
   "status TEXT NOT NULL,published_at TEXT);");
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
