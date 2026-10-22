import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import worker from '../web/a-canonical-stage.review.mjs';
import {canonicalProgression,levelProgress,readProgression,syncRewardNotifications} from '../canonical-auth/progression.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
const base='https://a.anevum.com';
function seed(db,id){
 db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)').run(id,id,id+'@fixture.invalid');
 db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,0,0)').run(id,id+'___',id,'');
 return {id,emailVerified:true};
}
const req=(path,body)=>new Request(base+'/api/v1/member/'+path,{method:body===undefined?'GET':'POST',headers:{origin:base,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
test('retired calibration endpoint never awards XP even with its old flag enabled',async()=>{
 const {db,env}=fixture();try{
  const user=seed(db,'alpha');
  for(const enabled of ['true','false']){
   const r=await canonicalProgression(req('xp-test',{requestId:crypto.randomUUID()}),{...env,CANONICAL_XP_TEST_ENABLED:enabled},user,1000);
   assert.equal(r.status,404);
  }
  const r=await canonicalProgression(req('progression'),env,user);
  assert.equal(r.status,200);
  const payload=await r.json();
  assert.equal(payload.progression.xp,0);
  assert.equal(payload.progression.level,1);
  assert.equal(payload.testButtonEnabled,false);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,0);
  assert.equal((await worker.fetch(req('xp-test',{requestId:crypto.randomUUID()}),env)).status,404);
 }finally{db.close();}
});
test('retired route returns 404 before authentication and database readiness',async()=>{
 let authCalls=0,dbCalls=0;
 const stage=createCanonicalStageWorker({authFactory:()=>{authCalls++;throw Error('Retired route must not initialize auth')}});
 const env={MEMBER_DB:{prepare(){dbCalls++;throw Error('Retired route must not query D1')}},CANONICAL_XP_TEST_ENABLED:'true'};
 for(const method of ['GET','HEAD','POST','PUT','DELETE']){
  const r=await stage.fetch(new Request(base+'/api/v1/member/xp-test',{method}),env);
  assert.equal(r.status,404,method);
 }
 assert.equal(authCalls,0);assert.equal(dbCalls,0);
});
test('legitimate earned milestones and notifications remain independent of removed test button',async()=>{
 const {db,env}=fixture();try{
  const a=seed(db,'alpha'),b=seed(db,'beta');
  db.prepare("INSERT INTO member_space_milestones(user_id,milestone,earned_at) VALUES(?,'first_signal',1002)").run(a.id);
  await syncRewardNotifications(env.MEMBER_DB,a.id,1002);
  await syncRewardNotifications(env.MEMBER_DB,a.id,1003);
  const p=await readProgression(env.MEMBER_DB,a.id);
  assert.equal(p.xp,10);
  assert.equal(p.level,1);
  assert.equal((await readProgression(env.MEMBER_DB,b.id)).xp,0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM member_reward_notifications WHERE kind='award'").get().n,1);
  assert.equal(levelProgress(87025).level,30);
  assert.equal(levelProgress(90000).artifact,'ANEVUM');
  assert.equal(levelProgress(90000).nextLevel,null);
 }finally{db.close();}
});
test('thirty source-backed Evolution levels remain intact',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../shared/level-artifacts.json',import.meta.url),'utf8'));
 assert.equal(catalog.length,30);
 assert.equal(catalog[0].name,'Pre-Grain');
 assert.equal(catalog.at(-1).name,'ANEVUM');
 assert.deepEqual(catalog.map(x=>x.xp),catalog.map(x=>75*(x.level-1)**2));
 assert.equal(new Set(catalog.map(x=>x.name)).size,30);
 assert.equal(new Set(catalog.map(x=>x.chapter)).size,6);
});
