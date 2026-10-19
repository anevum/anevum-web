// V085: real staff Worker route with synthetic cookie-backed Better Auth fixture.
// These tests NEVER call Cloudflare, issue real staff privileges or write live D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {createIrenApexStaffWorker} from '../staff-portal/worker.mjs';
const ORIGIN='https://anevum.com',API='/api/v1/member/staff-ops';
const migration=name=>readFileSync(new URL('../canonical-auth/migrations/'+name,import.meta.url),'utf8');
const get=(lane,extra='')=>API+'?lane='+lane+extra;
function setup(){
 const {db,env:originalEnv}=fixture();
 for(const f of ['0006_member_community_forums.sql','0010_staff_command.sql','0011_staff_roles.sql'])db.exec(migration(f));
 const write=(id,name,email,verified,when)=>db.prepare(
  'INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,?,?,?)'
 ).run(id,name,email,verified,when,when);
 write('v085-founder','Owner Fixture','founder@synthetic.invalid',1,'2026-10-18T11:00:00.000Z');
 write('v085-peer','Orion Creator','peer@synthetic.invalid',1,'2026-10-18T12:00:00.000Z');
 write('v085-waiting','Unverified Member','unverified@synthetic.invalid',0,'2026-10-18T13:00:00.000Z');
 db.prepare("INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,revision,created_at,updated_at) VALUES('v085-peer','orion','Orion Worldbuilder','','public',1,1792300000,1792300000)").run();
 db.prepare("INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES('v085-founder','owner','v085-founder',1792300000,1792300000)").run();
 const expiresAt=new Date(Date.now()+3600000).toISOString();
 const identities={'auth=founder':'v085-founder','auth=peer':'v085-peer','auth=waiting':'v085-waiting'};
 const env={...originalEnv,CANONICAL_STAFF_OPS_ENABLED:'true',CANONICAL_FORUM_ENABLED:'true',
  APEX_AUTH:{async fetch(request){
   const id=identities[request.headers.get('cookie')];
   if(!id)return Response.json({session:null,user:null});
   return Response.json({session:{id:'fixture-'+id,userId:id,expiresAt},
    user:{id,emailVerified:id!=='v085-waiting'}});
  }}
 };
 const worker=createIrenApexStaffWorker();
 const call=(path,cookie,method='GET',body)=>worker.fetch(new Request(ORIGIN+path,{
  method,headers:{...(cookie?{cookie}:{}),...(body?{'content-type':'application/json',origin:ORIGIN,'sec-fetch-site':'same-origin'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 }),env);
 return {db,env,call};
}
test('V085 private lanes deny anonymous, unverified and ordinary members (including reviewers)',async()=>{
 const f=setup();try{
  for(const lane of ['owner-members','owner-member&member=v085-founder','owner-releases']){
   assert.equal((await f.call(get(lane))).status,401);
   assert.equal((await f.call(get(lane),'auth=waiting')).status,401);
   assert.equal((await f.call(get(lane),'auth=peer')).status,403);
  }
  f.db.prepare("INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at) VALUES('v085-peer','reviewer','v085-founder',1792300100,1792300100)").run();
  for(const lane of ['owner-members','owner-member&member=v085-founder','owner-releases'])
   assert.equal((await f.call(get(lane),'auth=peer')).status,403,'reviewer cannot access '+lane);
 }finally{f.db.close()}
});
test('V085 owner directory respects bounded pages, verifies registry records, and escapes LIKE search',async()=>{
 const f=setup();try{
  let r=await f.call(get('owner-members','&page=0'),'auth=founder');
  assert.equal(r.status,200);
  assert.equal(r.headers.get('cache-control'),'private, no-store');
  const v=await r.json();assert.equal(v.members.length,3);assert.equal(v.page,0);assert.equal(v.pageSize,25);
  assert.equal(v.members.find(x=>x.id==='v085-peer').handle,'orion');
  assert.equal(v.members.find(x=>x.id==='v085-founder').staffRole,'owner');
  assert.equal(v.members.find(x=>x.id==='v085-waiting').verified,false);
  assert.ok(v.members.every(x=>x.selectedAura==='none'));
  r=await f.call(get('owner-members','&q=Orion'),'auth=founder');
  assert.equal(r.status,200);const searched=await r.json();
  assert.deepEqual(searched.members.map(x=>x.id),['v085-peer']);
  for(const extra of ['&q=x','&page=999','&page=0&page=1','&member=v085-peer','&q=abc&secret=true']){
   assert.equal((await f.call(get('owner-members',extra),'auth=founder')).status,400,extra);
  }
  r=await f.call(get('owner-members','&q=%25%5F'),'auth=founder');
  assert.equal(r.status,200);assert.equal((await r.json()).members.length,0);
 }finally{f.db.close()}
});
test('V085 member inspection distinguishes absent reputation schema from zero score and prevents invented awards',async()=>{
 const f=setup();try{
  let r=await f.call(get('owner-member','&member=v085-peer'),'auth=founder');
  assert.equal(r.status,200);
  let d=await r.json();
  assert.equal(d.member.email,'peer@synthetic.invalid');
  assert.equal(d.recognition.verifiedRoleRegistryReady,false);
  assert.equal(d.recognition.roleBadges,null);
  assert.equal(d.recognition.grants,null);
  assert.equal(d.member.selectedAura,'none');
  assert.equal(d.controls.roleHalos,'independent-review-required');
  assert.equal(d.controls.earnedLevels,'automatic-only');
  assert.equal(d.storage.xpAggregateReady,false);
  assert.equal((await f.call(get('owner-member','&member=nope'),'auth=founder')).status,404);
  assert.equal((await f.call(get('owner-member','&member=v085-peer&room=operations'),'auth=founder')).status,400);
  // Install only controlled representative recognition tables in memory,
  // including evidence-backed grants. Do not touch production schemas.
  f.db.exec('CREATE TABLE member_recognition_preferences(user_id TEXT PRIMARY KEY,aura TEXT);'+
   'CREATE TABLE member_recognition_grants(user_id TEXT,kind TEXT,recognition_id TEXT,earned_at INTEGER,revoked_at INTEGER);'+
   'CREATE TABLE member_role_grants(user_id TEXT,role TEXT,granted_at INTEGER,revoked_at INTEGER);');
  f.db.prepare("INSERT INTO member_recognition_preferences(user_id,aura) VALUES('v085-peer','eclipse')").run();
  f.db.prepare("INSERT INTO member_recognition_grants(user_id,kind,recognition_id,earned_at) VALUES('v085-peer','badge','first_orbit',1792300000)").run();
  f.db.prepare("INSERT INTO member_role_grants(user_id,role,granted_at) VALUES('v085-peer','curator',1792300000)").run();
  r=await f.call(get('owner-member','&member=v085-peer'),'auth=founder');d=await r.json();
  assert.equal(r.status,200);assert.equal(d.member.selectedAura,'eclipse');
  assert.equal(d.recognition.verifiedRoleRegistryReady,true);
  assert.equal(d.recognition.grants[0].id,'first_orbit');
  assert.equal(d.recognition.roleBadges[0].role,'curator');
  assert.equal(d.controls.cosmeticAura,'member-controlled');
 }finally{f.db.close()}
});
test('V085 release shelf labels actual compiled evidence versus isolated synthetic Lab, and cannot mutate records',async()=>{
 const f=setup();try{
  const r=await f.call(get('owner-releases'),'auth=founder');
  assert.equal(r.status,200);
  const d=await r.json();assert.equal(d.realIsolatedStaging,false);
  assert.ok(d.releases.find(x=>x.id==='v084-live'&&x.kind==='production'));
  assert.ok(d.releases.find(x=>x.kind==='simulation'&&x.status==='SYNTHETIC ONLY'));
  assert.equal((await f.call(get('owner-releases','&page=1'),'auth=founder')).status,400);
  assert.equal((await f.call(get('owner-unknown'),'auth=founder')).status,400);
  assert.equal((await f.call(API,'auth=founder','POST',{kind:'award-issue',memberId:'v085-peer',award:'first_light'})).status,400);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM staff_access_audit").get().n,0);
 }finally{f.db.close()}
});
test('V085 UI prevents owner-only nav rendering for moderator, is read-only, and includes responsive safeguards',()=>{
 const p=new URL('../web/src/pages/StaffCommandPage.tsx',import.meta.url);
 const screen=readFileSync(p,'utf8');
 const component=readFileSync(new URL('../web/src/components/OwnerControlRoom.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../web/src/components/owner-control-v085.css',import.meta.url),'utf8');
 assert.match(screen,/\['members','releases'\].includes\(item.id\)/);
 assert.match(screen,/snapshot\.role==='owner'&&<OwnerControlRoom/);
 assert.match(screen,/snapshot\.role==='owner'&&<OwnerReleaseShelf/);
 assert.match(component,/credentials:'same-origin'/);
 assert.match(component,/method:'GET'/);
 assert.doesNotMatch(component,/kind:'staff-grant'|kind:'award-issue'|\bfetch\([^)]*,\s*\{method:'POST'/);
 assert.match(css,/@media\(max-width:500px\)/);
 assert.match(css, /prefers-reduced-motion/);
});
