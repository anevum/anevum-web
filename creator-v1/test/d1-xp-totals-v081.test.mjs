// Synthetic tests for migration-backed XP totals and legacy upgrade safety.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fixture} from "./helpers/canonical-fixture.mjs";
import {readProgression} from "../canonical-auth/progression.mjs";
const migration=readFileSync(new URL("../canonical-auth/migrations/0011_member_xp_totals.sql",import.meta.url),"utf8");
function user(db,id){
 db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,100,100)')
  .run(id,id,id+"@fixture.invalid");
}
function xpEvent(db,id,requestId,amount=5){
 db.prepare("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,?,'test_button',?,100)")
  .run(id,requestId,amount);
}
test("XP upgrade backfills existing immutable ledger exactly, without changing accounts",async()=>{
 const {db,env}=fixture();try{
  user(db,"xp-a");user(db,"xp-b");
  for(let n=0;n<120;n++)xpEvent(db,"xp-a","fixture-"+n);
  const prior=await readProgression(env.MEMBER_DB,"xp-a");
  assert.equal(prior.xp,600);
  db.exec(migration);
  assert.equal(db.prepare("SELECT xp FROM member_xp_totals WHERE user_id='xp-a'").get().xp,600);
  assert.equal((await readProgression(env.MEMBER_DB,"xp-a")).xp,600);
  assert.equal((await readProgression(env.MEMBER_DB,"xp-b")).xp,0);
  db.exec(migration);
  assert.equal(db.prepare("SELECT xp FROM member_xp_totals WHERE user_id='xp-a'").get().xp,600);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM member_xp_events").get().n,120);
 }finally{db.close();}
});
test("insert, duplicate retry, deletion and updates reconcile materialized totals",async()=>{
 const {db,env}=fixture();try{
  user(db,"xp-a");user(db,"xp-b");db.exec(migration);
  xpEvent(db,"xp-a","event-1");
  assert.equal((await readProgression(env.MEMBER_DB,"xp-a")).xp,5);
  db.prepare("INSERT OR IGNORE INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,'event-1','test_button',5,100)").run("xp-a");
  assert.equal((await readProgression(env.MEMBER_DB,"xp-a")).xp,5);
  const id=db.prepare("SELECT id FROM member_xp_events WHERE request_id='event-1'").get().id;
  db.prepare("UPDATE member_xp_events SET user_id=? WHERE id=?").run("xp-b",id);
  assert.equal((await readProgression(env.MEMBER_DB,"xp-a")).xp,0);
  assert.equal((await readProgression(env.MEMBER_DB,"xp-b")).xp,5);
  db.prepare("DELETE FROM member_xp_events WHERE id=?").run(id);
  assert.equal((await readProgression(env.MEMBER_DB,"xp-b")).xp,0);
 }finally{db.close();}
});
test("post-migration member XP reads do not rescan the event ledger",async()=>{
 const {db,env}=fixture();try{
  user(db,"xp-a");
  for(let i=0;i<40;i++)xpEvent(db,"xp-a","material-"+i);
  db.exec(migration);
  const captured=[];
  const adapter=env.MEMBER_DB;
  const spy={prepare(sql){captured.push(sql);return adapter.prepare(sql)}};
  assert.equal((await readProgression(spy,"xp-a")).xp,200);
  assert.ok(captured.some(sql=>sql.includes("SELECT xp FROM member_xp_totals")));
  assert.ok(!captured.some(sql=>sql.includes("SUM(amount)")),JSON.stringify(captured));
 }finally{db.close();}
});
test("legacy XP read works before migration and unrelated DB failures are never hidden",async()=>{
 const {db,env}=fixture();try{
  user(db,"xp-a");xpEvent(db,"xp-a","legacy");
  assert.equal((await readProgression(env.MEMBER_DB,"xp-a")).xp,5);
  const adapter=env.MEMBER_DB,seen=[];
  const failing={prepare(sql){
   seen.push(sql);
   if(sql.includes("SELECT xp FROM member_xp_totals"))return {bind(){return {async first(){throw Error("D1 read quota exceeded 7500")}}}};
   return adapter.prepare(sql);
  }};
  await assert.rejects(()=>readProgression(failing,"xp-a"),/quota exceeded/);
  assert.ok(!seen.some(sql=>sql.includes("SUM(amount)")));
 }finally{db.close();}
});
