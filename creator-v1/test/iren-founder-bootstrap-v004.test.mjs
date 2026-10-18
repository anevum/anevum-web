// ANEVUM.IREN V004: bootstrap must create a single, verified, audited owner.
// This suite operates only on synthetic SQLite and never uses Cloudflare.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';

const read=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
const setup=()=>{
 const f=fixture();
 f.db.exec(read('0011_staff_roles.sql'));
 f.db.exec(read('0012_staff_founder_guard.sql'));
 const seed=(id,verified=1)=>{
  f.db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)')
   .run(id,id,id+'@fixture.invalid',verified,'2026-10-17T12:00:00Z','2026-10-17T12:00:00Z');
 };
 seed('founder');seed('other');seed('unverified',0);
 const grant=(id,role='owner',actor=id)=>
  f.db.prepare('INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES(?,?,?,?,?)')
   .run(id,role,actor,1770000000,1770000000);
 return {...f,grant};
};

test('IREN V004 verified founder bootstrap writes exactly one atomic audit event',()=>{
 const f=setup();
 try{
  f.grant('founder');
  const owners=f.db.prepare("SELECT member_id,role FROM staff_access_grants WHERE role='owner' AND revoked_at IS NULL").all().map(row=>({...row}));
  assert.deepEqual(owners,[{member_id:'founder',role:'owner'}]);
  const a=f.db.prepare("SELECT actor_id,member_id,action,created_at FROM staff_access_audit").all().map(row=>({...row}));
  assert.deepEqual(a,[{actor_id:'founder',member_id:'founder',action:'bootstrap-owner',created_at:1770000000}]);
  assert.throws(()=>f.grant('other'),/owner bootstrap refused|UNIQUE constraint/i);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM staff_access_audit").get().n,1);
 }finally{f.db.close()}
});

test('IREN V004 owner grant fails closed for mismatched actor, unknown, and unverified identity',()=>{
 const f=setup();
 try{
  assert.throws(()=>f.grant('unverified'),/owner bootstrap refused/i);
  assert.throws(()=>f.grant('missing'),/owner bootstrap refused|FOREIGN KEY/i);
  assert.throws(()=>f.grant('founder','owner','other'),/owner bootstrap refused/i);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM staff_access_grants").get().n,0);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM staff_access_audit").get().n,0);
 }finally{f.db.close()}
});

test('IREN V004 prevents silent owner demotion and owner row mutation but permits review grants',()=>{
 const f=setup();
 try{
  f.grant('founder');
  assert.throws(()=>f.db.prepare("UPDATE staff_access_grants SET role='reviewer' WHERE member_id='founder'").run(),/owner requires independent recovery/i);
  assert.throws(()=>f.db.prepare("UPDATE staff_access_grants SET revoked_at=1770000001 WHERE member_id='founder'").run(),/owner requires independent recovery/i);
  f.grant('other','reviewer','founder');
  assert.equal(f.db.prepare("SELECT role FROM staff_access_grants WHERE member_id='other'").get().role,'reviewer');
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM staff_access_audit WHERE action='bootstrap-owner'").get().n,1);
 }finally{f.db.close()}
});
