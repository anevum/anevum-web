import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {creatorAssets,cleanupExpiredAssets} from "../auth/assets.mjs";

const dbSqlite=new DatabaseSync(":memory:");
dbSqlite.exec("PRAGMA foreign_keys=ON;"+
  "CREATE TABLE schema_migrations(version TEXT PRIMARY KEY);"+
  "CREATE TABLE creator_profiles(member_id TEXT PRIMARY KEY, status TEXT NOT NULL);"+
  "CREATE TABLE projects(id TEXT PRIMARY KEY,owner_member_id TEXT REFERENCES creator_profiles(member_id),status TEXT NOT NULL);");
dbSqlite.prepare("INSERT INTO creator_profiles VALUES (?,?)").run("alice","active");
dbSqlite.prepare("INSERT INTO creator_profiles VALUES (?,?)").run("bob","active");
const first="a".repeat(32),second="b".repeat(32);
dbSqlite.prepare("INSERT INTO projects VALUES (?,?,?)").run(first,"alice","draft");
dbSqlite.prepare("INSERT INTO projects VALUES (?,?,?)").run(second,"bob","draft");
dbSqlite.exec(readFileSync(new URL("../auth/migrations/0014_private_creator_assets.sql",import.meta.url),"utf8"));
const statement=(sql,params=[])=>({
  bind(...p){return statement(sql,p);},
  async all(){return {success:true,results:dbSqlite.prepare(sql).all(...params)};},
  async run(){const r=dbSqlite.prepare(sql).run(...params);return {success:true,meta:{changes:Number(r.changes),rows_written:Number(r.changes)}};}
});
const db={prepare(sql){return statement(sql)}};
const stored=new Map();
const r2={
  failPut:false,failDelete:false,
  async put(key,bytes){if(this.failPut)throw Error("Injected R2 write failure");stored.set(key,new Uint8Array(bytes));},
  async get(key){const bytes=stored.get(key);return bytes?{body:new Blob([bytes]).stream()}:null;},
  async delete(key){if(this.failDelete)throw Error("Injected R2 delete failure");stored.delete(key);}
};
const env={CREATOR_UPLOADS_ENABLED:"true",CREATOR_ASSETS:r2,COMMUNITY_DB:db};
const alice={id:"alice",handle:"alice_dev"},bob={id:"bob",handle:"bob_dev"};
const now=Math.floor(Date.now()/1000),limit=async()=>true;
const base=id=>"https://next.anevum.com/api/v1/member/projects/"+id+"/assets";
async function call(id,method="GET",body,who=alice,asset="",headers={}){
  const init={method,headers:{...headers}};
  if(body!==undefined){
    if(method==="PUT"){init.body=body;init.headers["content-type"]="application/octet-stream";}
    else if(typeof body==="object"){init.body=JSON.stringify(body);init.headers["content-type"]="application/json";}
  }
  const req=new Request(base(id)+asset,init);
  return creatorAssets(req,env,who,limit,now);
}
function file(name,mime,size){return {name,sizeBytes:size,contentType:mime};}
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
test.after(()=>dbSqlite.close());

test("private reservations require ownership; account isolation does not leak asset lists",async()=>{
  assert.equal((await call(first,"GET",undefined,null)).status,401);
  assert.equal((await call(first,"GET",undefined,bob)).status,404);
  assert.equal((await call(first)).status,200);
  const r=await call(first,"POST",file("original.png","image/png",png.length));
  assert.equal(r.status,201,await r.clone().text());
  const a=await r.json();
  assert.match(a.id,/^[0-9a-f]{32}$/);
  assert.equal((await call(first,"GET",undefined,bob,"/"+a.id)).status,404);
  assert.equal((await call(second,"GET",undefined,bob)).status,200);
  globalThis.__assetTestId=a.id;
});
test("invalid bytes are rejected, reservation resets and valid bytes are privately quarantined",async()=>{
  const id=globalThis.__assetTestId;
  const invalid=await call(first,"PUT",new TextEncoder().encode("bad signature"),alice,"/"+id);
  assert.equal(invalid.status,422);
  assert.equal(dbSqlite.prepare("SELECT status FROM project_assets WHERE id=?").get(id).status,"reserved");
  const accepted=await call(first,"PUT",png,alice,"/"+id);
  assert.equal(accepted.status,200,await accepted.clone().text());
  assert.equal((await accepted.json()).status,"quarantined");
  assert.equal(stored.size,1);
  const data=await call(first,"GET",undefined,alice,"/"+id+"/file");
  assert.equal(data.status,200);
  assert.equal(data.headers.get("content-type"),"application/octet-stream");
  assert.match(data.headers.get("content-disposition"),/attachment/);
  assert.equal(data.headers.get("x-content-type-options"),"nosniff");
  assert.deepEqual(new Uint8Array(await data.arrayBuffer()),png);
  assert.equal((await call(first,"GET",undefined,bob,"/"+id+"/file")).status,404);
  assert.equal((await call(first,"PUT",png,alice,"/"+id)).status,409);
});
test("project lock prevents new uploads or removal; bad formats and oversize declarations rejected",async()=>{
  for(const x of [file("script.js","text/javascript",20),file("script.svg","image/svg+xml",20),file("../escape.zip","application/zip",20),file("huge.zip","application/zip",20971521)]){
    assert.equal((await call(first,"POST",x)).status,400);
  }
  dbSqlite.prepare("UPDATE projects SET status='pending_review' WHERE id=?").run(first);
  assert.equal((await call(first,"POST",file("a.png","image/png",12))).status,409);
  assert.equal((await call(first,"DELETE",undefined,alice,"/"+globalThis.__assetTestId)).status,409);
  dbSqlite.prepare("UPDATE projects SET status='draft' WHERE id=?").run(first);
});
test("R2 write failures remain private, return to reserved and can be retried",async()=>{
  const r=await call(first,"POST",file("retry.png","image/png",png.length));
  const {id}=await r.json();
  r2.failPut=true;
  assert.equal((await call(first,"PUT",png,alice,"/"+id)).status,503);
  r2.failPut=false;
  assert.equal(dbSqlite.prepare("SELECT status FROM project_assets WHERE id=?").get(id).status,"reserved");
  assert.equal((await call(first,"PUT",png,alice,"/"+id)).status,200);
});
test("private DELETE removes R2 and database references; transient deletion failures are retryable",async()=>{
  const id=globalThis.__assetTestId;
  r2.failDelete=true;
  assert.equal((await call(first,"DELETE",undefined,alice,"/"+id)).status,503);
  assert.equal(dbSqlite.prepare("SELECT status FROM project_assets WHERE id=?").get(id).status,"deleting");
  r2.failDelete=false;
  assert.equal((await call(first,"DELETE",undefined,alice,"/"+id)).status,200);
  assert.equal(dbSqlite.prepare("SELECT id FROM project_assets WHERE id=?").get(id),undefined);
  assert.equal((await call(first,"GET",undefined,alice,"/"+id+"/file")).status,404);
});
test("private object is deleted when the project is locked between R2 put and D1 commit",async()=>{
  const before=stored.size;
  const reserved=await call(second,"POST",file("racing.png","image/png",png.length),bob);
  assert.equal(reserved.status,201);
  const {id}=await reserved.json();
  const originalPut=r2.put;
  r2.put=async function(key,bytes,meta){
    await originalPut.call(this,key,bytes,meta);
    dbSqlite.prepare("UPDATE projects SET status='pending_review' WHERE id=?").run(second);
  };
  try{
    const result=await call(second,"PUT",png,bob,"/"+id);
    assert.equal(result.status,503,await result.clone().text());
    assert.equal(stored.size,before,"Failed D1 commit must not retain its R2 object");
    assert.notEqual(dbSqlite.prepare("SELECT status FROM project_assets WHERE id=?").get(id)?.status,"quarantined");
  }finally{
    r2.put=originalPut;
    dbSqlite.prepare("UPDATE projects SET status='draft' WHERE id=?").run(second);
  }
});
test("per-project asset quota is guarded by one database statement",async()=>{
  const original=first, x=file("readme.txt","text/plain",1);
  for(let i=0;i<19;i++)assert.equal((await call(original,"POST",x)).status,201);
  const limitReply=await call(original,"POST",x);
  assert.equal(limitReply.status,409);
  const count=dbSqlite.prepare("SELECT COUNT(*) n FROM project_assets WHERE project_id=?").get(original);
  assert.equal(count.n,20);
});
test("scheduled cleanup reaps expired reservation and uploading leases without touching current quarantined files",async()=>{
  dbSqlite.prepare("UPDATE project_assets SET created_at='2020-01-01 00:00:00' WHERE status='reserved'").run();
  const other=await call(second,"POST",file("current.png","image/png",png.length),bob);
  const {id:currentId}=await other.json();
  assert.equal((await call(second,"PUT",png,bob,"/"+currentId)).status,200);
  const stale=await call(second,"POST",file("stale.png","image/png",png.length),bob);
  const {id:staleId}=await stale.json();
  dbSqlite.prepare("UPDATE project_assets SET status='uploading',lease_until=? WHERE id=?").run(now-10,staleId);
  const cleaned=await cleanupExpiredAssets(env,now);
  assert.ok(cleaned.cleaned>=20);
  assert.equal(dbSqlite.prepare("SELECT id FROM project_assets WHERE id=?").get(staleId),undefined);
  assert.equal(dbSqlite.prepare("SELECT status FROM project_assets WHERE id=?").get(currentId).status,"quarantined");
});
