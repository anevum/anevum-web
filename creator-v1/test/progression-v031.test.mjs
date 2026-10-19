import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import worker from '../web/a-canonical-stage.review.mjs';
import {canonicalProgression,levelProgress,readProgression,syncRewardNotifications} from '../canonical-auth/progression.mjs';
import {canonicalSpace} from '../canonical-auth/space.mjs';
const base='https://a.anevum.com';
function seed(db,id){db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)').run(id,id,id+'@fixture.invalid');db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,0,0)').run(id,id+'___',id,'');return {id,emailVerified:true}}
const req=(path,body)=>new Request(base+'/api/v1/member/'+path,{method:body===undefined?'GET':'POST',headers:{origin:base,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
test('retired XP test route rejects all users and flags without writing',async()=>{
 const {db,env}=fixture();try{
  const a=seed(db,'alpha'),b=seed(db,'beta'),id=crypto.randomUUID();
  for(const value of ['true','false']){
   const ctx={...env,CANONICAL_XP_TEST_ENABLED:value};
   assert.equal((await canonicalProgression(req('xp-test',{requestId:id}),ctx,a,1000)).status,404);
   assert.equal((await canonicalProgression(req('xp-test',{requestId:id}),ctx,null,1000)).status,404);
  }
  assert.equal((await worker.fetch(req('xp-test',{requestId:id}),env)).status,404);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,0);
  const progress=await (await canonicalProgression(req('progression'),env,a)).json();
  assert.equal(progress.testButtonEnabled,false);
  assert.equal(progress.progression.xp,0);
  assert.equal((await readProgression(env.MEMBER_DB,b.id)).xp,0);
 }finally{db.close()}
});
test('historical XP and real milestones survive XP test retirement',async()=>{
 const {db,env}=fixture();try{
  const a=seed(db,'alpha'),b=seed(db,'beta');
  for(let i=0;i<15;i++)db.prepare("INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) VALUES(?,?,'test_button',5,1000)").run(a.id,crypto.randomUUID());
  const before=await readProgression(env.MEMBER_DB,a.id);
  assert.equal(before.xp,75);assert.equal(before.level,2);
  const attempts=await Promise.all(Array.from({length:6},()=>canonicalProgression(req('xp-test',{requestId:crypto.randomUUID()}),env,a,1001)));
  assert.ok(attempts.every(r=>r.status===404));
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,15);
  assert.equal((await readProgression(env.MEMBER_DB,a.id)).xp,75);
  db.prepare("INSERT INTO member_space_milestones(user_id,milestone,earned_at) VALUES(?,'first_signal',1002)").run(a.id);
  await syncRewardNotifications(env.MEMBER_DB,a.id,1002);await syncRewardNotifications(env.MEMBER_DB,a.id,1003);
  assert.equal((await readProgression(env.MEMBER_DB,a.id)).xp,85);
  assert.equal((await readProgression(env.MEMBER_DB,b.id)).xp,0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM member_reward_notifications WHERE kind='award'").get().n,1);
  const inbox=await (await canonicalProgression(req('notifications'),env,a)).json();
  assert.ok(inbox.items.some(item=>item.kind==='level'&&item.level===2));
  assert.equal((await canonicalProgression(req('notifications/ack',{id:inbox.items[0].id}),env,b)).status,404);
  assert.equal((await canonicalProgression(req('notifications/ack',{id:inbox.items[0].id}),env,a)).status,200);
  const own=await (await canonicalSpace(new Request(base+'/api/v1/member/space'),env,a)).json();
  assert.equal(own.stats.xp,85);
  assert.equal(levelProgress(87025).level,30);assert.equal(levelProgress(90000).artifact,'ANEVUM');assert.equal(levelProgress(90000).nextLevel,null);
 }finally{db.close()}
});
test('thirty source-backed Evolution levels replace the sixty emblems',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../shared/level-artifacts.json',import.meta.url),'utf8'));
 assert.equal(catalog.length,30);
 assert.equal(catalog[0].name,'Pre-Grain');assert.equal(catalog.at(-1).name,'ANEVUM');
 assert.deepEqual(catalog.map(x=>x.xp),catalog.map(x=>75*(x.level-1)**2));
 assert.equal(new Set(catalog.map(x=>x.name)).size,30);
 assert.equal(new Set(catalog.map(x=>x.chapter)).size,6);
 assert.ok(catalog.every(x=>x.icon.includes('/evolution/assets/')&&x.preview.includes('/evolution/assets/')));
});
