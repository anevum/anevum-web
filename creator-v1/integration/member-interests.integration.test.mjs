import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {createMemberWorker} from "../auth/worker.mjs";
import {INTEREST_CATEGORIES} from "../auth/interests.mjs";

const now=1791800000,pep="8".repeat(64);
const people=[
  {id:"member-alpha",email:"alpha@fixture.test",handle:"alpha_makes",token:"a".repeat(64)},
  {id:"member-beta",email:"beta@fixture.test",handle:"beta_makes",token:"b".repeat(64)}
];
async function signature(token){
 const key=await crypto.subtle.importKey("raw",Uint8Array.from(pep.match(/../g).map(v=>parseInt(v,16))),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return Buffer.from(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode("session\0"+token))).toString("hex");
}
async function fixture(){
 const sql=new DatabaseSync(":memory:");
 sql.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY,handle TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active');`);
 for(const file of ["0003_member_identity_staging.sql","0006_account_privacy.sql","0007_discovery_preferences.sql"]){
  sql.exec(readFileSync(new URL("../auth/migrations/"+file,import.meta.url),"utf8"));
 }
 function statement(raw,params=[]){
  return {
   bind(...values){return statement(raw,values)},
   async all(){return {success:true,results:sql.prepare(raw).all(...params)}},
   async run(){const out=sql.prepare(raw).run(...params);return {success:true,meta:{changes:Number(out.changes)}}}
  };
 }
 const db={prepare:raw=>statement(raw)};
 for(const p of people){
  sql.prepare("INSERT INTO member_accounts(id,email,verified_at,status,created_at) VALUES(?,?,?,'active',?)").run(p.id,p.email,now-120,now-400);
  sql.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,status) VALUES(?,?,?,'Fixture biography','active')").run(p.id,p.handle,p.handle);
  sql.prepare("INSERT INTO member_sessions(token_hash,member_id,expires_at,created_at) VALUES(?,?,?,?)").run(await signature(p.token),p.id,now+3600,now-120);
 }
 const app=createMemberWorker({clock:()=>now,fetcher:async()=>{throw Error("External requests are not permitted in interests tests")}});
 const env={COMMUNITY_DB:db,AUTH_PEPPER:pep};
 function call(path="/interests",method="GET",body=undefined,who=people[0],opts={}){
  const origin=opts.origin??"https://next.anevum.com";
  const request=new Request("https://next.anevum.com/api/v1/member"+path,{
   method,headers:{
    origin,"sec-fetch-site":opts.site??(origin==="https://next.anevum.com"?"same-origin":"cross-site"),
    "content-type":opts.contentType??"application/json",
    ...(who?{cookie:"__Host-anevum_stage_sid="+who.token}:{})
   },body:body===undefined?undefined:opts.raw??JSON.stringify(body)
  });
  return app.fetch(request,env);
 }
 return {sql,call,app,env};
}
const withDb=async(action)=>{const x=await fixture();try{await action(x)}finally{x.sql.close()}};

test("discovery preferences migration is account-scoped and independently versioned",async()=>withDb(async({sql})=>{
 const info=sql.prepare("SELECT version FROM schema_migrations WHERE version='0007_discovery_preferences'").get();
 assert.ok(info);
 const columns=sql.prepare("PRAGMA table_info(member_discovery_preferences)").all().map(x=>x.name);
 assert.deepEqual(columns,["member_id","categories_json","updated_at"]);
 assert.throws(()=>sql.prepare("INSERT INTO member_discovery_preferences(member_id,categories_json,updated_at) VALUES('member-alpha','{bad}',1)").run());
 assert.throws(()=>sql.prepare("INSERT INTO member_discovery_preferences(member_id,categories_json,updated_at) VALUES('stranger','[]',1)").run());
}));

test("first account starts with no interests without a project submission",async()=>withDb(async({sql,call})=>{
 assert.equal(sql.prepare("SELECT count(*) n FROM member_discovery_preferences").get().n,0);
 const r=await call();
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{categories:[],updatedAt:null});
 assert.match(r.headers.get("cache-control"),/private/);
 assert.match(r.headers.get("x-robots-tag"),/noindex/);
 assert.equal((await (await call("/interests","HEAD")).text()).length,0);
 assert.equal((await call("/interests","GET",undefined,null)).status,401);
}));

test("member can persist, replace and clear eight permitted categories independently",async()=>withDb(async({sql,call})=>{
 assert.equal(INTEREST_CATEGORIES.length,8);
 const first=await call("/interests","POST",{categories:["learning","games","tools"]});
 assert.equal(first.status,200,await first.clone().text());
 assert.deepEqual((await first.json()).categories,["tools","games","learning"]);
 assert.deepEqual((await (await call()).json()).categories,["tools","games","learning"]);
 assert.equal(sql.prepare("SELECT count(*) n FROM member_discovery_preferences").get().n,1);
 const next=await call("/interests","POST",{categories:[]});
 assert.equal(next.status,200);
 assert.deepEqual((await (await call()).json()).categories,[]);
 assert.equal(sql.prepare("SELECT count(*) n FROM member_discovery_preferences").get().n,1);
 const all=await call("/interests","POST",{categories:[...INTEREST_CATEGORIES]});
 assert.equal(all.status,200);
 assert.deepEqual((await all.json()).categories,[...INTEREST_CATEGORIES]);
 assert.equal(sql.prepare("SELECT count(*) n FROM member_discovery_preferences").get().n,1);
}));

test("preferences cannot leak across accounts or public creator endpoints",async()=>withDb(async({call})=>{
 assert.equal((await call("/interests","POST",{categories:["games"]})).status,200);
 assert.equal((await call("/interests","POST",{categories:["research"]},people[1])).status,200);
 const alice=await (await call()).json();
 const beta=await (await call("/interests","GET",undefined,people[1])).json();
 assert.deepEqual(alice.categories,["games"]);
 assert.deepEqual(beta.categories,["research"]);
 const anon=await call("/creators/alpha_makes","GET",undefined,null);
 assert.equal(anon.status,200);
 const body=JSON.stringify(await anon.json());
 assert.ok(!body.includes("categories_json")&&!body.includes("research")&&!body.includes("discoveryPreferences"));
 assert.ok(!body.includes("alpha@fixture.test")&&!body.includes("member-alpha"));
}));

test("invalid, duplicate, overlarge and client-ID forged payloads are rejected",async()=>withDb(async({call,sql})=>{
 for(const payload of [
  {categories:["games","games"]},{categories:["unsafe"]},{categories:["GAMES"]},
  {categories:[0]}, {categories:"games"}, {categories:null},
  {categories:["games"],memberId:people[1].id},
  {categories:new Array(9).fill("games")}, {},[],
  {categories:["games"],xp:9999},
 ]){
  const r=await call("/interests","POST",payload);
  assert.equal(r.status,400,JSON.stringify(payload));
 }
 assert.equal((await call("/interests","POST",{categories:["games"]},people[0],{contentType:"text/plain"})).status,400);
 assert.equal((await call("/interests","POST",undefined,people[0],{raw:"{broken"})).status,400);
 assert.equal(sql.prepare("SELECT count(*) n FROM member_discovery_preferences").get().n,0);
}));

test("sign-in, origin and member status gate all writes",async()=>withDb(async({call,sql})=>{
 assert.equal((await call("/interests","POST",{categories:["tools"]},null)).status,401);
 assert.equal((await call("/interests","POST",{categories:["tools"]},people[0],{origin:"https://evil.example"})).status,403);
 assert.equal((await call("/interests","POST",{categories:["tools"]},people[0],{site:"cross-site"})).status,403);
 assert.equal((await call("/interests","PUT",{categories:["tools"]})).status,405);
 assert.equal((await call("/interests/another","POST",{categories:["tools"]})).status,404);
 assert.equal((await call("/interests?member=member-beta","GET")).status,404);
 assert.equal(sql.prepare("SELECT count(*) n FROM member_discovery_preferences").get().n,0);
 sql.prepare("UPDATE member_accounts SET status='suspended' WHERE id='member-alpha'").run();
 assert.equal((await call("/interests")).status,401);
 assert.equal((await call("/interests","POST",{categories:["tools"]})).status,401);
}));

test("discovery preferences export is private, member-scoped and recent-session protected",async()=>withDb(async({call})=>{
 await call("/interests","POST",{categories:["games","learning"]});
 await call("/interests","POST",{categories:["research"]},people[1]);
 const own=await call("/privacy/export?section=interests");
 assert.equal(own.status,200,await own.clone().text());
 const exportData=await own.json();
 assert.deepEqual(JSON.parse(exportData.items[0].categoriesJson),["games","learning"]);
 assert.equal(exportData.items.length,1);
 assert.ok(!JSON.stringify(exportData).includes("research"));
 const other=await (await call("/privacy/export?section=interests","GET",undefined,people[1])).json();
 assert.deepEqual(JSON.parse(other.items[0].categoriesJson),["research"]);
 assert.equal((await call("/privacy/export?section=interests","GET",undefined,null)).status,401);
}));

test("interest records cascade only when owning account is actually deleted",async()=>withDb(async({sql,call})=>{
 await call("/interests","POST",{categories:["games"]});
 await call("/interests","POST",{categories:["tools"]},people[1]);
 assert.equal(sql.prepare("SELECT count(*) n FROM member_discovery_preferences").get().n,2);
 sql.prepare("DELETE FROM member_sessions WHERE member_id='member-alpha'").run();
 sql.prepare("DELETE FROM creator_profiles WHERE member_id='member-alpha'").run();
 sql.prepare("DELETE FROM member_accounts WHERE id='member-alpha'").run();
 assert.equal(sql.prepare("SELECT count(*) n FROM member_discovery_preferences").get().n,1);
 assert.equal(sql.prepare("SELECT categories_json FROM member_discovery_preferences WHERE member_id='member-beta'").get().categories_json,'["tools"]');
}));
