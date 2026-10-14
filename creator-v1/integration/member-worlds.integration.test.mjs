import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { createMemberWorker } from "../auth/worker.mjs";

const now=1791900000,pep="e".repeat(64);
const members=[
 {id:"world-member-one",handle:"world_one",email:"one@fixture.invalid",token:"a".repeat(64)},
 {id:"world-member-two",handle:"world_two",email:"two@fixture.invalid",token:"b".repeat(64)}
];
const scene={visibility:"private",theme:"ember",scene:"creative",sections:["community","work","cabinet"]};
async function hashed(token) {
 const key=await crypto.subtle.importKey("raw",Uint8Array.from(pep.match(/../g).map(x=>parseInt(x,16))),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return Buffer.from(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode("session\0"+token))).toString("hex");
}
async function fixture(){
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY NOT NULL,handle TEXT UNIQUE COLLATE NOCASE NOT NULL,
 display_name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',
 is_staff INTEGER NOT NULL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE member_deletion_requests(id TEXT PRIMARY KEY,member_id TEXT NOT NULL,state TEXT NOT NULL,requested_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);`);
 sqlite.exec(readFileSync(new URL("../auth/migrations/0003_member_identity_staging.sql",import.meta.url),"utf8"));
 sqlite.exec(readFileSync(new URL("../auth/migrations/0010_member_worlds.sql",import.meta.url),"utf8"));
 function stmt(sql,args=[]){return{bind(...p){return stmt(sql,p)},async all(){return{success:true,results:sqlite.prepare(sql).all(...args)}},async run(){const r=sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}}}};}
 const db={prepare:q=>stmt(q)};
 for(const m of members){
  sqlite.prepare("INSERT INTO member_accounts(id,email,verified_at,created_at,status) VALUES(?,?,?,?,'active')").run(m.id,m.email,now-60,now-300);
  sqlite.prepare("INSERT INTO creator_profiles(member_id,handle,display_name,bio,status) VALUES(?,?,?,'Member-generated public bio','active')").run(m.id,m.handle,m.handle);
  sqlite.prepare("INSERT INTO member_sessions(token_hash,member_id,expires_at,created_at) VALUES(?,?,?,?)").run(await hashed(m.token),m.id,now+3600,now-30);
 }
 const env={COMMUNITY_DB:db,AUTH_PEPPER:pep,MEMBER_WORLDS_ENABLED:"false"};
 const app=createMemberWorker({clock:()=>now,fetcher:async()=>{throw Error("Network not allowed")}});
 function call(path,method="GET",body,user=members[0],origin="https://next.anevum.com"){
  return app.fetch(new Request("https://next.anevum.com/api/v1/member"+path,{
   method,headers:{origin,"sec-fetch-site":origin==="https://next.anevum.com"?"same-origin":"cross-site",
    "content-type":"application/json",...(user?{cookie:"__Host-anevum_stage_sid="+user.token}:{})},
   body:body===undefined?undefined:JSON.stringify(body)
  }),env);
 }
 return{sqlite,db,env,call};
}
const withFixture=async cb=>{const f=await fixture();try{await cb(f)}finally{f.sqlite.close()}};

test("member worlds feature flag starts closed and changes no existing accounts",()=>withFixture(async f=>{
 assert.equal((await f.call("/world")).status,404);
 assert.equal((await f.call("/world","POST",scene)).status,404);
 assert.equal((await f.call("/worlds/world_one","GET",undefined,null)).status,404);
 assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM member_world_appearances").get().n,0);
}));

test("staged new members remain private by default even without published projects",()=>withFixture(async f=>{
 f.env.MEMBER_WORLDS_ENABLED="true";
 assert.equal((await f.call("/world","GET",undefined,null)).status,401);
 const a=await f.call("/world");
 assert.equal(a.status,200);
 assert.deepEqual((await a.json()).appearance,{visibility:"private",theme:"astral",scene:"portal",sections:["work","cabinet","community"]});
 assert.equal((await f.call("/worlds/world_one","GET",undefined,null)).status,404);
 assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM member_world_appearances").get().n,0);
}));

test("payloads and cross-origin writes fail closed with no mutated world",()=>withFixture(async f=>{
 f.env.MEMBER_WORLDS_ENABLED="true";
 const invalid=[
  {...scene,extra:"forged"}, {...scene,theme:"evil"},
  {...scene,visibility:"unlisted"},
  {...scene,sections:["community","community","work"]},
  {...scene,sections:["work","cabinet","private"]},
  {...scene,sections:["work","cabinet"]}
 ];
 for(const value of invalid)assert.equal((await f.call("/world","POST",value)).status,400);
 assert.equal((await f.call("/world","POST",scene,members[0],"https://attacker.example")).status,403);
 assert.equal((await f.call("/world","POST",scene,null)).status,401);
 assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM member_world_appearances").get().n,0);
}));

test("owner saves private world, then deliberately opts in to public profile",()=>withFixture(async f=>{
 f.env.MEMBER_WORLDS_ENABLED="true";
 const first=await f.call("/world","POST",scene);
 assert.equal(first.status,200,await first.clone().text());
 const initial=await first.json();assert.equal(initial.saved,true);assert.deepEqual(initial.appearance,scene);
 assert.equal((await f.call("/worlds/world_one","GET",undefined,null)).status,404);
 const published={...scene,visibility:"public",theme:"verdigris",scene:"research"};
 assert.equal((await f.call("/world","POST",published)).status,200);
 const anon=await f.call("/worlds/world_one","GET",undefined,null);
 assert.equal(anon.status,200,await anon.clone().text());
 const data=await anon.json();
 assert.deepEqual(data.appearance,published);
 assert.equal(data.profile.handle,"world_one");
 for(const forbidden of [members[0].id,members[0].email,"token_hash","is_staff","memberId"])
  assert.ok(!JSON.stringify(data).includes(forbidden),forbidden);
 assert.equal((await f.call("/worlds/world_two","GET",undefined,null)).status,404);
}));

test("member world isolation and suspensions cannot expose another account",()=>withFixture(async f=>{
 f.env.MEMBER_WORLDS_ENABLED="true";
 await f.call("/world","POST",{...scene,visibility:"public"});
 const other=await f.call("/world","POST",{...scene,theme:"obsidian"},members[1]);
 assert.equal(other.status,200);
 const privateSecond=await f.call("/world","GET",undefined,members[1]);
 assert.equal((await privateSecond.json()).appearance.theme,"obsidian");
 const first=await f.call("/world","GET",undefined,members[0]);
 assert.equal((await first.json()).appearance.theme,"ember");
 assert.equal((await f.call("/worlds/world_two","GET",undefined,null)).status,404);
 f.sqlite.prepare("UPDATE member_accounts SET status='suspended' WHERE id=?").run(members[0].id);
 assert.equal((await f.call("/worlds/world_one","GET",undefined,null)).status,404);
 f.sqlite.prepare("UPDATE member_accounts SET status='active' WHERE id=?").run(members[0].id);
 f.sqlite.prepare("UPDATE creator_profiles SET status='deleted' WHERE member_id=?").run(members[0].id);
 assert.equal((await f.call("/worlds/world_one","GET",undefined,null)).status,404);
}));

test("owner can export own world settings, but disabled feature cannot advertise world export",()=>withFixture(async f=>{
 let before=await (await f.call("/privacy")).json();
 assert.ok(!before.availableExportSections.includes("world"));
 assert.equal((await f.call("/privacy/export?section=world")).status,400);
 f.env.MEMBER_WORLDS_ENABLED="true";
 await f.call("/world","POST",scene);
 const after=await (await f.call("/privacy")).json();
 assert.ok(after.availableExportSections.includes("world"));
 const a=await f.call("/privacy/export?section=world");
 assert.equal(a.status,200,await a.clone().text());
 const result=await a.json();
 assert.equal(result.items.length,1);
 assert.equal(result.items[0].memberId,members[0].id);
 assert.equal(result.items[0].theme,"ember");
 const b=await f.call("/privacy/export?section=world","GET",undefined,members[1]);
 assert.equal(b.status,200);
 assert.equal((await b.json()).items.length,0);
}));
