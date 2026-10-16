import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/canonical-fixture.mjs';
import {publicSupporterTelemetry} from '../canonical-auth/public-supporter-telemetry.mjs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';
import {readFileSync} from 'node:fs';
const BASE='https://a.anevum.com/api/v1/public/supporter/metrics';
function setup(){
 const {db,env}=fixture();
 const cache=new Map();
 let reads=0,writes=0;
 const fakeCache={
  async match(request){reads++;return cache.get(request.url)?.clone()??null},
  async put(request,response){writes++;cache.set(request.url,response.clone())}
 };
 db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)').run('staging-user','Test','test@fixture.invalid');
 db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,0,0)').run('staging-user','tester','Test','');
 db.prepare('INSERT INTO member_wall_posts(id,user_id,body,created_at,updated_at) VALUES(?,?,?,?,?)').run('42cb512a-52d4-463d-bb11-52ab3871a4b9','staging-user','A private example',1,1);
 const bytes=new Uint8Array(10).fill(4);
 db.prepare('INSERT INTO member_space_media(user_id,slot,data,version,updated_at) VALUES(?,?,?,?,?)').run('staging-user','avatar',bytes,1,1);
 return {db,env,fakeCache,stats:()=>({reads,writes})};
}
test('disabled telemetry returns 404 and never queries private database',async()=>{
 const {db,env,fakeCache,stats}=setup();
 try{
  const r=await publicSupporterTelemetry(new Request(BASE),env,{now:1000,cache:fakeCache});
  assert.equal(r.status,404);
  assert.equal(stats().reads,0);
 }finally{db.close()}
});
test('enabled metrics report bounded, cached aggregates with no identity or billing information',async()=>{
 const {db,env,fakeCache,stats}=setup();env.CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED='true';
 try{
  const one=await publicSupporterTelemetry(new Request(BASE,{headers:{cookie:'private=confidential'}}),env,{now:1792155000000,cache:fakeCache});
  assert.equal(one.status,200);
  const body=await one.json();
  assert.deepEqual(body.community,{memberAccounts:1,creatorProfiles:1,wallPosts:1});
  assert.deepEqual(body.media,{imageObjects:1,imageBytes:10,imageSlotsPerMember:2,imageUploadMaxBytes:262144});
  assert.equal(body.scope,'ANEVUM_STAGING_ONLY');
  assert.equal(body.cacheTtlSeconds,900);
  assert.equal(one.headers.get('x-anevum-public-telemetry'),'v1');
  const serialized=JSON.stringify(body);
  for(const leak of ['staging-user','test@fixture.invalid','private example','stripe','customer_id','private=confidential']){
   assert.equal(serialized.includes(leak),false,leak);
  }
  db.prepare('DELETE FROM member_wall_posts').run();
  const cached=await publicSupporterTelemetry(new Request(BASE),env,{now:1792155001000,cache:fakeCache});
  assert.equal(cached.status,200);
  assert.equal((await cached.json()).community.wallPosts,1,'cached totals are not re-queried');
  assert.equal(stats().writes,1);
 }finally{db.close()}
});
test('path query mutations and cross-origin attempts never query storage',async()=>{
 const {db,env,fakeCache,stats}=setup();env.CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED='true';
 try{
  for(const request of [
   new Request(BASE+'?userId=someone'),
   new Request(BASE,{method:'POST'}),
   new Request('https://evil.invalid/api/v1/public/supporter/metrics')
  ]){
   const r=await publicSupporterTelemetry(request,env,{cache:fakeCache});
   assert.ok([404,405].includes(r.status));
  }
  assert.equal(stats().reads,0);
 }finally{db.close()}
});
test('absent cache fails closed before database queries, not uncached unbounded public polling',async()=>{
 const {db,env}=setup();env.CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED='true';
 try{
  assert.equal((await publicSupporterTelemetry(new Request(BASE),env,{cache:null})).status,503);
 }finally{db.close()}
});
test('malformed D1 numeric aggregates are never returned publicly',async()=>{
 const env={
  CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED:'true',
  MEMBER_DB:{prepare:()=>({all:async()=>({success:true,results:[{member_count:1,creator_count:100,wall_post_count:1,media_count:0,media_bytes:0}]})})}
 };
 const cache={match:async()=>null,put:async()=>{throw Error('should never cache')}};
 assert.equal((await publicSupporterTelemetry(new Request(BASE),env,{cache})).status,503);
});
test('canonical Worker enforces issuer + profile schema gate before aggregate access',async()=>{
 const {db,env}=setup();env.CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED='true';
 try{
  const worker=createCanonicalStageWorker({authFactory:()=>{throw Error('Telemetry should not require authentication')}});
  const response=await worker.fetch(new Request(BASE),env);
  assert.equal(response.status,503,'No edge cache should fail closed in local Worker fixture');
  const wrongIssuer={...env,CANONICAL_SCHEMA_APPROVED:'false'};
  assert.equal((await worker.fetch(new Request(BASE),wrongIssuer)).status,503);
 }finally{db.close()}
});
test('composed staging Worker maps only exact telemetry path to canonical service',()=>{
 const source=readFileSync(new URL('../web/a-canonical-stage.review.mjs',import.meta.url),'utf8');
 assert.match(source,/PUBLIC_METRICS/);
 assert.match(source,/url.pathname===PUBLIC_METRICS/);
});
