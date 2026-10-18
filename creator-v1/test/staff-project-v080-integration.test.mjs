// V080 isolated Better Auth/D1/R2 integration. No production records or objects.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fixture} from "./helpers/canonical-fixture.mjs";
import worker from "../operations/staff-project-worker-v080.mjs";
import {controlSchemaReady,staffOwnerAction,staffReviewAction,staffInventory} from "../operations/staff-project-control-v080.mjs";
const ORIGIN="https://anevum.com",SHA="a".repeat(64);
const ID={pending:"11111111-1111-4111-8111-111111111111",published:"22222222-2222-4222-8222-222222222222",rejected:"33333333-3333-4333-8333-333333333333",comment:"44444444-4444-4444-8444-444444444444"};
const SCHEMA=[
 "CREATE TABLE staff_access_grants(member_id TEXT PRIMARY KEY REFERENCES \"user\"(id),role TEXT CHECK(role IN ('owner','reviewer')),revoked_at INTEGER)",
 "CREATE TABLE anevum_alpha_projects(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES \"user\"(id),title TEXT NOT NULL,summary TEXT NOT NULL,filename TEXT NOT NULL,kind TEXT NOT NULL,mime TEXT NOT NULL,size_bytes INTEGER NOT NULL,object_key TEXT NOT NULL UNIQUE,sha256 TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','pending_review','published','rejected')),rejection_reason TEXT,created_at INTEGER NOT NULL,submitted_at INTEGER,reviewed_by TEXT,reviewed_at INTEGER,published_at INTEGER)",
 "CREATE TABLE anevum_alpha_review_events(event_id INTEGER PRIMARY KEY AUTOINCREMENT,project_id TEXT,reviewer_id TEXT,decision TEXT,decided_at INTEGER,rejection_reason TEXT)",
 "CREATE TABLE alpha_test_comments(id TEXT PRIMARY KEY,project_id TEXT REFERENCES anevum_alpha_projects(id) ON DELETE CASCADE,author_id TEXT REFERENCES \"user\"(id))",
 "CREATE TABLE alpha_test_restrict(id TEXT PRIMARY KEY,project_id TEXT REFERENCES anevum_alpha_projects(id) ON DELETE RESTRICT)"
].join(";\n")+";";
const people=[["owner-a","Owner", "owner@fixture.invalid","owner"],["reviewer-b","Reviewer","reviewer@fixture.invalid","reviewer"],["creator-c","Creator","creator@fixture.invalid",null]];
function setup({migration=true}={}){
 const fixtureObj=fixture(),{db}=fixtureObj;db.exec("PRAGMA foreign_keys=ON;");db.exec(SCHEMA);
 if(migration)db.exec(readFileSync(new URL("../operations/migrations/0010_staff_project_lifecycle.sql",import.meta.url),"utf8"));
 for(const [id,name,email,role] of people){
  db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)').run(id,name,email);
  db.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,created_at,updated_at) VALUES(?,?,?,?,?)").run(id,id.split("-")[0],name,100,100);
  if(role)db.prepare("INSERT INTO staff_access_grants(member_id,role) VALUES(?,?)").run(id,role);
 }
 for(const [id,title,status] of [[ID.pending,"Pending item","pending_review"],[ID.published,"Single Drift","published"],[ID.rejected,"Rejected item","rejected"]])
  db.prepare("INSERT INTO anevum_alpha_projects(id,owner_id,title,summary,filename,kind,mime,size_bytes,object_key,sha256,status,created_at,submitted_at,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id,"creator-c",title,"Fixture project with valid metadata",title+".html","html","text/html",128,"quarantine/fixture/"+id,SHA,status,100,status==="pending_review"?120:null,status==="published"?150:null);
 const objects=new Set([ID.pending,ID.published,ID.rejected].map(x=>"quarantine/fixture/"+x));
 let storageFailure=false,corrupted=false;
 const env={...fixtureObj.env,DB:fixtureObj.env.MEMBER_DB,
  MEDIA:{async head(key){return objects.has(key)?{size:corrupted?0:128,customMetadata:{sha256:SHA}}:null},async delete(key){if(storageFailure)throw Error("Fixture R2 failure");objects.delete(key)}},
  AUTH:{async fetch(req){const who=people.find(x=>req.headers.get("cookie")==="auth="+x[0]);return who?Response.json({user:{id:who[0],emailVerified:true},session:{userId:who[0],expiresAt:"2099-01-01T00:00:00Z"}}):Response.json(null,{status:401})}}};
 const get=(sql,...args)=>db.prepare(sql).get(...args);
 const ownerAction=(projectId,action,extra={})=>staffOwnerAction(env,"owner-a","owner",{projectId,action,confirmedTitle:projectId===ID.published?"Single Drift":projectId===ID.pending?"Pending item":"Rejected item",...extra});
 async function request(who,method="GET",path="/staff/projects",body,extra={}){
  const headers=new Headers({...(method==="POST"?{origin:ORIGIN,"sec-fetch-site":"same-origin","x-anevum-staff":"1","content-type":"application/json"}:{}),...(who?{cookie:"auth="+who}:{}),...extra});
  return worker.fetch(new Request(ORIGIN+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 }
 return {db,env,objects,get,ownerAction,request,storageFailure:x=>storageFailure=x,corrupted:x=>corrupted=x,close:()=>db.close()};
}
test("migration is mandatory before mutation; reviewer inventory is pending-only",async()=>{
 const absent=setup({migration:false});try{
  assert.equal(await controlSchemaReady(absent.env.DB),false);
  assert.equal((await absent.ownerAction(ID.published,"unpublish")).status,503);
 }finally{absent.close()}
 const s=setup();try{
  assert.equal((await staffInventory(s.env.DB,"owner")).projects.length,3);
  const reviewer=await staffInventory(s.env.DB,"reviewer");
  assert.equal(reviewer.projects.length,1);
  assert.equal(reviewer.projects[0].id,ID.pending);
 }finally{s.close()}
});
test("publication writes an audit entry only when media integrity holds",async()=>{
 const s=setup();try{
  s.corrupted(true);
  assert.equal((await staffReviewAction(s.env,"reviewer-b","reviewer",{projectId:ID.pending,action:"publish"})).status,503);
  assert.equal(s.get("SELECT status FROM anevum_alpha_projects WHERE id=?",ID.pending).status,"pending_review");
  s.corrupted(false);
  assert.equal((await staffReviewAction(s.env,"reviewer-b","reviewer",{projectId:ID.pending,action:"publish"})).status,200);
  assert.equal(s.get("SELECT status FROM anevum_alpha_projects WHERE id=?",ID.pending).status,"published");
  assert.equal(s.get("SELECT COUNT(*) n FROM anevum_alpha_review_events WHERE project_id=?",ID.pending).n,1);
  assert.equal((await staffReviewAction(s.env,"reviewer-b","reviewer",{projectId:ID.pending,action:"publish"})).status,409);
 }finally{s.close()}
});
test("rejection requires meaningful feedback and logs reviewed version",async()=>{
 const s=setup();try{
  assert.equal((await staffReviewAction(s.env,"reviewer-b","reviewer",{projectId:ID.pending,action:"reject",reason:"bad"})).status,422);
  assert.equal((await staffReviewAction(s.env,"reviewer-b","reviewer",{projectId:ID.pending,action:"reject",reason:"Interactive player fails on mobile."})).status,200);
  assert.equal(s.get("SELECT status FROM anevum_alpha_projects WHERE id=?",ID.pending).status,"rejected");
  assert.equal(s.get("SELECT decision FROM anevum_alpha_review_events WHERE project_id=?",ID.pending).decision,"rejected");
 }finally{s.close()}
});
test("unpublish and restore are reversible and audited",async()=>{
 const s=setup();try{
  assert.equal((await s.ownerAction(ID.published,"unpublish")).status,200);
  assert.equal(s.get("SELECT status FROM anevum_alpha_projects WHERE id=?",ID.published).status,"rejected");
  assert.equal((await s.ownerAction(ID.published,"restore")).status,200);
  assert.equal(s.get("SELECT status FROM anevum_alpha_projects WHERE id=?",ID.published).status,"published");
  assert.equal(s.get("SELECT COUNT(*) n FROM anevum_alpha_project_admin_events WHERE project_id=?",ID.published).n,2);
 }finally{s.close()}
});
test("permanent deletion cascades community data, keeps tombstone and clears R2",async()=>{
 const s=setup();try{
  s.db.prepare("INSERT INTO alpha_test_comments(id,project_id,author_id) VALUES(?,?,?)").run(ID.comment,ID.published,"creator-c");
  assert.equal((await s.ownerAction(ID.published,"delete",{confirmDelete:true})).status,200);
  assert.equal(s.get("SELECT COUNT(*) n FROM anevum_alpha_projects WHERE id=?",ID.published).n,0);
  assert.equal(s.get("SELECT COUNT(*) n FROM alpha_test_comments WHERE project_id=?",ID.published).n,0);
  assert.equal(s.get("SELECT COUNT(*) n FROM anevum_alpha_project_admin_events WHERE action='delete'").n,1);
  assert.ok(s.get("SELECT cleaned_at FROM anevum_alpha_project_deletions WHERE project_id=?",ID.published).cleaned_at>0);
  assert.ok(!s.objects.has("quarantine/fixture/"+ID.published));
 }finally{s.close()}
});
test("failed R2 cleanup retains retryable tombstone without resurrecting project",async()=>{
 const s=setup();try{
  s.storageFailure(true);
  assert.equal((await s.ownerAction(ID.published,"delete",{confirmDelete:true})).status,202);
  assert.equal(s.get("SELECT COUNT(*) n FROM anevum_alpha_projects WHERE id=?",ID.published).n,0);
  assert.equal(s.get("SELECT cleaned_at FROM anevum_alpha_project_deletions WHERE project_id=?",ID.published).cleaned_at,null);
  s.storageFailure(false);
  assert.equal((await staffOwnerAction(s.env,"owner-a","owner",{action:"retry_cleanup",projectId:ID.published})).status,200);
  assert.equal((await staffOwnerAction(s.env,"owner-a","owner",{action:"retry_cleanup",projectId:ID.published})).status,200);
 }finally{s.close()}
});
test("SQLite transaction restores project, audit, and tombstone on failed delete",async()=>{
 const s=setup();try{
  s.db.prepare("INSERT INTO alpha_test_restrict(id,project_id) VALUES(?,?)").run("locked",ID.published);
  await assert.rejects(()=>s.ownerAction(ID.published,"delete",{confirmDelete:true}),/FOREIGN KEY|constraint/i);
  assert.equal(s.get("SELECT status FROM anevum_alpha_projects WHERE id=?",ID.published).status,"published");
  assert.equal(s.get("SELECT COUNT(*) n FROM anevum_alpha_project_admin_events").n,0);
  assert.equal(s.get("SELECT COUNT(*) n FROM anevum_alpha_project_deletions").n,0);
  assert.ok(s.objects.has("quarantine/fixture/"+ID.published));
 }finally{s.close()}
});
test("HTTP denies unauthenticated users, revoked roles, CSRF and reviewer deletion",async()=>{
 const s=setup();try{
  assert.equal((await s.request(null)).status,401);
  assert.equal((await s.request("creator-c")).status,403);
  assert.equal((await s.request("reviewer-b")).status,200);
  assert.equal((await s.request("reviewer-b","POST","/staff/projects/api/manage",{projectId:ID.published,action:"delete",confirmedTitle:"Single Drift",confirmDelete:true})).status,403);
  assert.equal((await s.request("reviewer-b","POST","/staff/projects/api/review",{projectId:ID.pending,action:"publish"},{origin:"https://evil.invalid","sec-fetch-site":"cross-site"})).status,403);
  assert.equal((await s.request("reviewer-b","POST","/staff/projects/api/review",{projectId:ID.pending,action:"publish"})).status,200);
  s.db.prepare("UPDATE staff_access_grants SET revoked_at=200 WHERE member_id=?").run("reviewer-b");
  assert.equal((await s.request("reviewer-b")).status,403);
 }finally{s.close()}
});
