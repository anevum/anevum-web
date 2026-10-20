// ANEVUM V010 additive migration rehearsal — synthetic in-memory D1-equivalent SQLite.
// No connection to production/staging databases or member account records.
import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
const migration=readFileSync(new URL("../site/alpha/v003/migrations/0003_canonical_creator_links.sql",import.meta.url),"utf8");
const legacy=[
 "CREATE TABLE anevum_package_projects(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,status TEXT NOT NULL)",
 "CREATE TABLE anevum_package_releases(id TEXT PRIMARY KEY,project_id TEXT NOT NULL)",
 "CREATE TABLE anevum_package_files(release_id TEXT,path TEXT,PRIMARY KEY(release_id,path))",
 "CREATE TABLE anevum_package_upload_limits(owner_id TEXT PRIMARY KEY,window_start INTEGER)",
 "CREATE TABLE anevum_package_preview_tokens(token_hash TEXT PRIMARY KEY,release_id TEXT)",
 "CREATE TABLE anevum_package_rights_receipts(release_id TEXT PRIMARY KEY,owner_id TEXT)"
];
function fresh(){
 const db=new DatabaseSync(":memory:");
 for(const sql of legacy)db.exec(sql);
 db.prepare("INSERT INTO anevum_package_projects VALUES(?,?,?)")
   .run("real-existing-project","member-in-legacy","published");
 db.prepare("INSERT INTO anevum_package_rights_receipts VALUES(?,?)")
   .run("existing-release","member-in-legacy");
 return db;
}
function names(db){
 return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'anevum_package_%' ORDER BY name")
   .all().map(x=>x.name);
}
test("V010 isolated migration is rollback-safe and leaves the previous six package tables intact",()=>{
 const db=fresh();
 try{
  assert.equal(names(db).length,6);
  db.exec("BEGIN IMMEDIATE");
  db.exec(migration);
  assert.equal(names(db).length,7);
  db.exec("ROLLBACK");
  assert.equal(names(db).length,6);
  assert.equal(db.prepare("SELECT owner_id FROM anevum_package_projects WHERE id=?")
    .get("real-existing-project").owner_id,"member-in-legacy");
 }finally{db.close();}
});
test("V010 migration is additive, idempotent and includes verified subject proof column",()=>{
 const db=fresh();
 try{
  db.exec(migration);
  db.exec(migration);
  const tables=names(db);
  assert.equal(tables.length,7);
  assert.ok(tables.includes("anevum_package_creator_links"));
  const cols=db.prepare("PRAGMA table_info(anevum_package_creator_links)").all();
  assert.deepEqual(cols.map(x=>x.name),
    ["owner_id","handle","profile_created_at","creator_proof","verified_at"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM anevum_package_projects").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM anevum_package_rights_receipts").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM anevum_package_creator_links").get().n,0);
  const valid=["member-a","cosmiccreator",1760000000,"1".repeat(64),1760000009];
  db.prepare("INSERT INTO anevum_package_creator_links VALUES(?,?,?,?,?)").run(...valid);
  assert.throws(()=>db.prepare("INSERT INTO anevum_package_creator_links VALUES(?,?,?,?,?)")
    .run("member-b","cosmiccreator",1760000001,"2".repeat(64),1760000010),/UNIQUE/);
  assert.throws(()=>db.prepare("INSERT INTO anevum_package_creator_links VALUES(?,?,?,?,?)")
    .run("member-c","anothercreator",1760000001,"invalid-proof",1760000010),/CHECK/);
  assert.equal(db.prepare("SELECT owner_id FROM anevum_package_creator_links WHERE handle=?")
    .get("cosmiccreator").owner_id,"member-a");
 }finally{db.close();}
});
