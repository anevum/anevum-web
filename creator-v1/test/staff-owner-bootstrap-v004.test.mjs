// ANEVUM.IREN.BUILD.2026-10-17.004.FOUNDER-BOOTSTRAP
// Synthetic verified IDs only. No live database, auth cookies, email or secrets.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';

const read=(name)=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');

function setup(){
 const f=fixture();
 f.db.exec(read('0010_staff_command.sql'));
 f.db.exec(read('0011_staff_roles.sql'));
 f.db.exec(read('0012_staff_founder_guard.sql'));
 for(const [id,verified] of [['owner_candidate',1],['other_candidate',1],['unverified',0]]){
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)')
   .run(id,'Synthetic '+id,id+'@example.invalid',verified,'2026-10-17T00:00:00Z','2026-10-17T00:00:00Z');
 }
 return f;
}
const insert=(db,id,actor=id,role='owner')=>
 db.prepare('INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES(?,?,?,?,?)')
 .run(id,role,actor,1792200000,1792200000);
const count=(db,table)=>db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;

test('IREN V004 founder owner bootstrap: automatic atomic audit, one verified immutable member, no duplicate owner',()=>{
 const {db}=setup();
 try{
  assert.equal(count(db,'staff_access_grants'),0);
  assert.throws(()=>insert(db,'unverified'),/IREN owner bootstrap refused/);
  assert.throws(()=>insert(db,'owner_candidate','other_candidate'),/IREN owner bootstrap refused/);
  assert.throws(()=>insert(db,'nonexistent_member'),/IREN owner bootstrap refused/);
  assert.equal(count(db,'staff_access_grants'),0);
  assert.equal(count(db,'staff_access_audit'),0);

  insert(db,'owner_candidate');
  assert.deepEqual(db.prepare('SELECT member_id,role,granted_by,revoked_at FROM staff_access_grants').get(),
   {member_id:'owner_candidate',role:'owner',granted_by:'owner_candidate',revoked_at:null});
  const events=db.prepare("SELECT actor_id,member_id,action,created_at FROM staff_access_audit").all();
  assert.deepEqual(events,[{
   actor_id:'owner_candidate',member_id:'owner_candidate',action:'bootstrap-owner',created_at:1792200000
  }]);
  assert.throws(()=>insert(db,'other_candidate'),/IREN owner bootstrap refused|UNIQUE constraint failed/);
  assert.equal(count(db,'staff_access_grants'),1);
  assert.equal(count(db,'staff_access_audit'),1);

  assert.throws(()=>db.prepare("UPDATE staff_access_grants SET role='reviewer' WHERE member_id='owner_candidate'").run(),/IREN owner requires independent recovery/);
  assert.throws(()=>db.prepare("UPDATE staff_access_grants SET revoked_at=1792200020 WHERE member_id='owner_candidate'").run(),/IREN owner requires independent recovery/);
  assert.equal(db.prepare('SELECT role,revoked_at FROM staff_access_grants').get().role,'owner');

  // Separately authorized reviewer path still works with this extra guard.
  insert(db,'other_candidate','owner_candidate','reviewer');
  assert.equal(db.prepare("SELECT role FROM staff_access_grants WHERE member_id='other_candidate'").get().role,'reviewer');
  assert.equal(count(db,'staff_access_audit'),1);
 }finally{db.close()}
});

test('IREN V004 founder cannot be bootstrapped by a user-facing staff command',async()=>{
 const {canonicalStaffOps}=await import('../canonical-auth/staff-ops.mjs');
 const f=setup();
 try{
  const env={...f.env,CANONICAL_STAFF_OPS_ENABLED:'true'};
  const u={id:'other_candidate',emailVerified:true};
  const r=await canonicalStaffOps(new Request('https://anevum.com/api/v1/member/staff-ops',{
   method:'POST',headers:{'content-type':'application/json',origin:'https://anevum.com'},
   body:JSON.stringify({kind:'staff-grant',memberId:'owner_candidate',role:'owner'})
  }),env,u);
  assert.equal(r.status,403);
  assert.equal(count(f.db,'staff_access_grants'),0);
 }finally{f.db.close()}
});
