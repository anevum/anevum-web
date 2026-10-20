import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import worker from '../operations/anevum-iren-staff-observatory-v001.mjs';
import {memberVerifiedRoleMap} from '../canonical-auth/member-verified-roles.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const BASE='https://anevum.com/staff/observatory/api/';
const CASE='https://github.com/anevum/anevum-web/issues/1234';

function fixture({migrated=true,enabled=true}={}){
 const raw=new DatabaseSync(':memory:');
 raw.exec([
  'PRAGMA foreign_keys=ON;',
  'CREATE TABLE "user"(id TEXT PRIMARY KEY,name TEXT,emailVerified INTEGER);',
  'CREATE TABLE staff_access_grants(member_id TEXT PRIMARY KEY,role TEXT,revoked_at INTEGER);',
  'CREATE TABLE member_creator_profiles(user_id TEXT PRIMARY KEY,display_name TEXT,handle TEXT);',
  "INSERT INTO \"user\" VALUES('owner','Owner',1),('reviewer','Independent reviewer',1),('other','Second moderator',1),('member','Creator',1),('unverified','Not verified',0);",
  "INSERT INTO staff_access_grants VALUES('owner','owner',NULL),('reviewer','reviewer',NULL),('other','reviewer',NULL);",
  "INSERT INTO member_creator_profiles VALUES('member','Creator','creatorqa');"
 ].join('\n'));
 if(migrated)raw.exec(read('canonical-auth/migrations/0012_verified_designations_v093.sql'));
 const prepare=sql=>{
  const statement=raw.prepare(sql),args=[];
  const bound={
   bind(...input){args.splice(0,args.length,...input);return bound},
   async first(){return statement.get(...args)||null},
   async all(){return {success:true,results:statement.all(...args)}},
   async run(){return {success:true,meta:{changes:statement.run(...args).changes}}}
  };
  return bound;
 };
 const db={prepare,async batch(items){
  raw.exec('BEGIN IMMEDIATE');
  try{
   const result=[];
   for(const statement of items)result.push(await statement.run());
   raw.exec('COMMIT');
   return result;
  }catch(e){raw.exec('ROLLBACK');throw e}
 }};
 const APEX_AUTH={async fetch(request){
  const cookie=request.headers.get('cookie')||'';
  const who=cookie.includes('owner')?'owner':cookie.includes('other')?'other':
   cookie.includes('reviewer')?'reviewer':'outsider';
  const exists=who!=='outsider';
  return Response.json(exists?{
   session:{id:'session-'+who,userId:who,expiresAt:new Date(Date.now()+60000).toISOString()},
   user:{id:who,emailVerified:true}
  }:{session:null,user:null});
 }};
 const env={MEMBER_DB:db,APEX_AUTH,
  ...(enabled?{ANEVUM_VERIFIED_ROLE_OPERATIONS_ENABLED:'true'}:{})};
 const call=async(who,method,path,body,origin='https://anevum.com')=>{
  const headers={cookie:'sid='+who,accept:'application/json'};
  if(method==='POST'){headers['content-type']='application/json';headers.origin=origin;headers['sec-fetch-site']='same-origin'}
  const req=new Request(BASE+path,{
   method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})
  });
  const response=await worker.fetch(req,env);
  return {status:response.status,body:await response.json()};
 };
 return {raw,db,env,call};
}
const nomination=(memberId='member',role='moderator',evidenceRef=CASE)=>({memberId,role,evidenceRef});

test('V093 unavailable or missing role schema fails closed with no account writes',async t=>{
 for(const conditions of [{migrated:false,enabled:true},{migrated:true,enabled:false}]){
  const f=fixture(conditions);t.after(()=>f.raw.close());
  const queue=await f.call('owner','GET','roles');
  assert.equal(queue.status,200);assert.equal(queue.body.enabled,false);
  assert.equal((await f.call('owner','POST','role-nominate',nomination())).status,503);
  assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM staff_access_grants").get().n,3);
 }
});

test('V093 enforces independent two-person approval and does not issue staff privileges',async t=>{
 const f=fixture();t.after(()=>f.raw.close());
 assert.equal((await f.call('reviewer','POST','role-nominate',nomination())).status,403);
 assert.equal((await f.call('owner','POST','role-nominate',nomination('unverified'))).status,404);
 assert.equal((await f.call('owner','POST','role-nominate',nomination('member','founder','https://outside.invalid'))).status,400);
 assert.equal((await f.call('owner','POST','role-nominate',nomination(),'https://untrusted.invalid')).status,403);
 const proposed=await f.call('owner','POST','role-nominate',nomination());
 assert.equal(proposed.status,201);
 assert.equal(proposed.body.state,'pending');
 const queue=await f.call('reviewer','GET','roles');
 assert.equal(queue.body.enabled,true);
 assert.equal(queue.body.requests.length,1);
 assert.equal(queue.body.requests[0].memberName,'Creator');
 assert.equal(Object.hasOwn(queue.body.requests[0],'email'),false);
 const id=queue.body.requests[0].id;
 assert.equal((await memberVerifiedRoleMap(f.db,['member'])).size,0,'nomination never implies public role');
 assert.equal((await f.call('owner','POST','role-review',{requestId:id,decision:'approved'})).status,403);
 const approved=await f.call('reviewer','POST','role-review',{requestId:id,decision:'approved'});
 assert.equal(approved.status,200);assert.equal(approved.body.state,'approved');
 assert.equal((await memberVerifiedRoleMap(f.db,['member'])).get('member'),'moderator');
 assert.equal((await f.call('reviewer','POST','role-review',{requestId:id,decision:'approved'})).status,409);
 assert.equal(f.raw.prepare('SELECT COUNT(*) AS n FROM staff_access_grants').get().n,3);
 assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM staff_access_grants WHERE member_id='member'").get().n,0);
 assert.equal(f.raw.prepare("SELECT granted_by,reviewed_by FROM member_role_grants WHERE user_id='member'").get().reviewed_by,'reviewer');
 assert.equal(f.raw.prepare('SELECT COUNT(*) AS n FROM member_role_events').get().n,1);
});

test('V093 rejects self-approval, records denials, safely revokes and audits reissuance',async t=>{
 const f=fixture();t.after(()=>f.raw.close());
 assert.equal((await f.call('owner','POST','role-nominate',nomination('reviewer','founder'))).status,201);
 let queue=(await f.call('reviewer','GET','roles')).body.requests;
 assert.equal((await f.call('reviewer','POST','role-review',{requestId:queue[0].id,decision:'approved'})).status,403);
 assert.equal((await f.call('other','POST','role-review',{requestId:queue[0].id,decision:'rejected'})).status,200);
 assert.equal((await memberVerifiedRoleMap(f.db,['reviewer'])).size,0);
 assert.equal((await f.call('owner','POST','role-nominate',nomination('member','curator'))).status,201);
 queue=(await f.call('reviewer','GET','roles')).body.requests;
 const first=queue.find(x=>x.role==='curator');
 assert.ok(first);
 assert.equal((await f.call('reviewer','POST','role-review',{requestId:first.id,decision:'approved'})).status,200);
 assert.equal((await f.call('owner','POST','role-nominate',nomination('member','curator'))).status,409);
 assert.equal((await f.call('reviewer','POST','role-revoke',{memberId:'member',role:'curator'})).status,403);
 assert.equal((await f.call('owner','POST','role-revoke',{memberId:'member',role:'curator'})).status,200);
 assert.equal((await memberVerifiedRoleMap(f.db,['member'])).size,0);
 assert.equal((await f.call('owner','POST','role-nominate',nomination('member','curator'))).status,201);
 queue=(await f.call('reviewer','GET','roles')).body.requests;
 const second=queue.find(x=>x.role==='curator');
 assert.ok(second);assert.notEqual(second.id,first.id);
 assert.equal((await f.call('other','POST','role-review',{requestId:second.id,decision:'approved'})).status,200);
 assert.equal((await memberVerifiedRoleMap(f.db,['member'])).get('member'),'curator');
 assert.deepEqual(
  f.raw.prepare('SELECT action FROM member_role_events ORDER BY happened_at,id').all().map(x=>x.action).sort(),
  ['approved','approved','rejected','revoked']
 );
});

test('V093 gated member/queue UI is syntax valid and never confuses aura with institutional role',()=>{
 const source=read('operations/anevum-iren-staff-observatory-v001.mjs');
 const extract=name=>JSON.parse(source.match(new RegExp('^const '+name+' = (".*");$','m'))[1]);
 const client=extract('CLIENT'),html=extract('PAGE'),styles=extract('STYLES');
 assert.doesNotThrow(()=>new Script(client));
 for(const name of ['roleRequests','roleStatus','insignias','rolesRefresh'])
  assert.match(html,new RegExp(name));
 assert.match(styles,/role-request/);
 assert.match(client,/rolePost\('role-nominate'/);
 assert.match(client,/rolePost\('role-review'/);
 assert.match(client,/rolePost\('role-revoke'/);
 assert.match(source,/ANEVUM_VERIFIED_ROLE_OPERATIONS_ENABLED !== 'true'/);
 assert.match(source,/staff\.role!=='owner'/);
 assert.match(source,/staff\.role!=='reviewer'/);
 assert.match(source,/nominated_by<>/);
 assert.match(source,/member_role_events/);
 assert.doesNotMatch(source,/UPDATE staff_access_grants SET role/);
 const migration=read('canonical-auth/migrations/0012_verified_designations_v093.sql');
 assert.match(migration,/reviewed_by<>granted_by/);
 assert.doesNotMatch(migration,/INSERT INTO member_role_grants|UPDATE member_xp_events|DELETE FROM member_xp_events/);
 assert.doesNotMatch(migration,/CREATE INDEX IF NOT EXISTS member_forum_/);
});
