import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {
  SUPPORTER_SEALS,SUPPORTER_FRAMES,SUPPORTER_AURAS,tierDays,
  supporterUnlocks,validSupporterAppearance,selectedSupporterAppearance
} from '../supporter/rewards.mjs';
import {readSupporterRewards,supporterRewardsRoute} from '../canonical-auth/supporter-rewards.mjs';
import {subscriptionProjection,supporterConfig} from '../supporter/stripe.mjs';
import {supporterSchemaReady} from '../canonical-auth/supporter.mjs';
import canonicalWorker from '../web/a-canonical-stage.review.mjs';
import {canonicalSpace} from '../canonical-auth/space.mjs';

const NOW=1792155000000,DAY=86400000,ORIGIN='https://a.anevum.com';
function setup(){
 const {db,env}=fixture();
 db.exec(readFileSync(new URL('../canonical-auth/migrations/0006_supporter_commerce.sql',import.meta.url),'utf8'));
 Object.assign(env,{
  CANONICAL_SUPPORTER_COMMERCE_ENABLED:'true',
  CANONICAL_STRIPE_SECRET_KEY:'sk_test_'+'a'.repeat(40),
  CANONICAL_STRIPE_WEBHOOK_SECRET:'whsec_'+'b'.repeat(40),
  CANONICAL_STRIPE_MONTHLY_PRICE_ID:'price_anevumMonthly12345',
  CANONICAL_STRIPE_ANNUAL_PRICE_ID:'price_anevumAnnual12345'
 });
 const users=[];
 for(const [id,name] of [['user-alpha-test','alpha'],['user-beta-test','beta']]){
  db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)').run(id,name,name+'@fixture.invalid');
  db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,0,0)').run(id,name,name,'');
  users.push({id,email:name+'@fixture.invalid',emailVerified:true});
 }
 return {db,env,users};
}
function support(db,env,user,started=NOW-10*DAY,status='active'){
 const customer='cus_'+user.id.replaceAll('-','')+'abc',subscription='sub_'+user.id.replaceAll('-','')+'abc';
 db.prepare('INSERT OR IGNORE INTO supporter_customers(member_user_id,stripe_customer_id,created_at_ms) VALUES(?,?,?)').run(user.id,customer,started);
 db.prepare('INSERT INTO supporter_subscriptions(stripe_subscription_id,member_user_id,stripe_customer_id,stripe_price_id,billing_interval,status,current_period_end_ms,started_at_ms,cancel_at_period_end,synced_at_ms) VALUES(?,?,?,?,?,?,?,?,0,?)')
  .run(subscription,user.id,customer,env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,'month',status,NOW+14*DAY,started,NOW);
 return {customer,subscription};
}
function endpoint(method='GET',body,route='/api/v1/member/supporter/rewards'){
 return new Request(ORIGIN+route,{method,headers:{'content-type':'application/json',origin:ORIGIN},
  body:body===undefined?undefined:JSON.stringify(body)});
}
test('catalog has distinctive exclusive cosmetic families and unlock schedule',()=>{
 assert.equal(SUPPORTER_SEALS.length,4);
 assert.equal(SUPPORTER_FRAMES.length,5);
 assert.equal(SUPPORTER_AURAS.length,5);
 assert.equal(new Set([...SUPPORTER_FRAMES.map(x=>x.id)]).size,5);
 assert.deepEqual(supporterUnlocks(NOW-89*DAY,NOW).seals,['signal']);
 assert.deepEqual(supporterUnlocks(NOW-90*DAY,NOW).seals,['signal','orbit']);
 assert.deepEqual(supporterUnlocks(NOW-180*DAY,NOW).seals,['signal','orbit','constellation']);
 assert.deepEqual(supporterUnlocks(NOW-365*DAY,NOW).seals,['signal','orbit','constellation','continuance']);
 assert.equal(tierDays(0,NOW),0);
 assert.equal(tierDays(NOW+DAY,NOW),0);
 assert.equal(tierDays(NOW-365*DAY,NOW),365);
 assert.deepEqual(supporterUnlocks(0,NOW).frames,['orbital','rose','lumen']);
});
test('strict allowlist rejects future-only and attacker-forged rewards',()=>{
 const ten=supporterUnlocks(NOW-10*DAY,NOW);
 assert.equal(validSupporterAppearance({seal:'signal',frame:'orbital',aura:'aurora'},ten),true);
 assert.equal(validSupporterAppearance({seal:'continuance',frame:'orbital',aura:'aurora'},ten),false);
 assert.equal(validSupporterAppearance({seal:'signal',frame:'__proto__',aura:'aurora'},ten),false);
 assert.equal(validSupporterAppearance({seal:'signal',frame:'orbital',aura:'aurora',xp:99999},ten),false);
 assert.deepEqual(selectedSupporterAppearance({seal:'continuance',frame:'stellar',aura:'transcosmic'},ten),
  {seal:'signal',frame:'orbital',aura:'aurora'});
});
test('source migration, issuer gating and Stripe start-date projection',async()=>{
 const {db,env,users}=setup();
 try{
  assert.equal(await supporterSchemaReady(env.MEMBER_DB),true);
  assert.equal(supporterConfig(env).enabled,true);
  const sub={id:'sub_Example12345',customer:'cus_Example12345',status:'active',
   start_date:Math.floor((NOW-90*DAY)/1000),cancel_at_period_end:false,
   items:{data:[{quantity:1,current_period_end:Math.floor((NOW+14*DAY)/1000),
    price:{id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,currency:'usd',unit_amount:500,recurring:{interval:'month'}}}]}};
  assert.equal(subscriptionProjection(sub,env).startedAt,NOW-90*DAY);
  assert.equal(subscriptionProjection({...sub,start_date:null},env).startedAt,0);
  assert.equal(subscriptionProjection({...sub,start_date:1e40},env).startedAt,0);
  assert.equal(await readSupporterRewards({...env,CANONICAL_STRIPE_SECRET_KEY:'sk_live_'+'x'.repeat(30)},users[0].id,NOW),null);
 }finally{db.close()}
});
test('only active fresh verified owner has cosmetics; public requires explicit consent',async()=>{
 const {db,env,users}=setup();const [a,b]=users;
 try{
  const {customer}=support(db,env,a,NOW-180*DAY);
  const own=await readSupporterRewards(env,a.id,NOW,false);
  assert.equal(own.supporter,true);
  assert.equal(own.unlocks.tier,'constellation');
  assert.equal(own.selected.frame,'orbital');
  assert.equal(await readSupporterRewards(env,a.id,NOW,true),null);
  assert.equal(await readSupporterRewards(env,b.id,NOW,false),null);
  db.prepare('INSERT INTO supporter_visibility(member_user_id,public_insignia,revision,updated_at_ms) VALUES(?,1,1,?)').run(a.id,NOW);
  assert.equal((await readSupporterRewards(env,a.id,NOW,true)).selected.seal,'signal');
  db.prepare("INSERT INTO supporter_billing_holds(stripe_customer_id,reason,stripe_event_id,created_at_ms) VALUES(?,'refund','evt_testrefund123',?)").run(customer,NOW);
  assert.equal(await readSupporterRewards(env,a.id,NOW,false),null);
  assert.equal(await readSupporterRewards(env,a.id,NOW,true),null);
  db.prepare('DELETE FROM supporter_billing_holds WHERE stripe_customer_id=?').run(customer);
  db.prepare('UPDATE supporter_subscriptions SET synced_at_ms=? WHERE member_user_id=?').run(NOW-4*DAY,a.id);
  assert.equal(await readSupporterRewards(env,a.id,NOW,false),null);
  db.prepare('UPDATE supporter_subscriptions SET synced_at_ms=?,status=? WHERE member_user_id=?').run(NOW,'canceled',a.id);
  assert.equal(await readSupporterRewards(env,a.id,NOW,false),null);
 }finally{db.close()}
});
test('reward selector persists only unlocked owner picks with optimistic revisions',async()=>{
 const {db,env,users}=setup();const [a,b]=users;
 try{
  support(db,env,a,NOW-91*DAY);
  const own=await (await supporterRewardsRoute(endpoint(),env,a,{now:NOW})).json();
  assert.equal(own.supporter,true);
  assert.equal(own.selected.seal,'signal');
  assert.equal(own.catalog.seals.length,4);
  assert.equal(own.revision,0);
  const future=await supporterRewardsRoute(endpoint('PATCH',{seal:'continuance',frame:'lumen',aura:'aurora',revision:0}),env,a,{now:NOW});
  assert.equal(future.status,400);
  const invalid=await supporterRewardsRoute(endpoint('PATCH',{seal:'orbit',frame:'stellar',aura:'aurora',revision:0}),env,a,{now:NOW});
  assert.equal(invalid.status,400);
  const first=await supporterRewardsRoute(endpoint('PATCH',{seal:'orbit',frame:'rose',aura:'ember',revision:0}),env,a,{now:NOW});
  assert.equal(first.status,200);
  assert.deepEqual(await first.json(),{selected:{seal:'orbit',frame:'rose',aura:'ember'},revision:1});
  assert.equal((await readSupporterRewards(env,a.id,NOW)).selected.seal,'orbit');
  const other=await (await supporterRewardsRoute(endpoint(),env,b,{now:NOW})).json();
  assert.equal(other.supporter,false);
 }finally{db.close()}
});
test('owner-only subsequent save, stale revision rejection and no purchased XP',async()=>{
 const {db,env,users}=setup();const [a,b]=users;
 try{
  support(db,env,a,NOW-365*DAY);
  assert.equal((await supporterRewardsRoute(endpoint('PATCH',{seal:'continuance',frame:'continuance',aura:'transcosmic',revision:0}),env,a,{now:NOW})).status,200);
  assert.equal((await supporterRewardsRoute(endpoint('PATCH',{seal:'signal',frame:'rose',aura:'ember',revision:0}),env,a,{now:NOW})).status,409);
  assert.equal((await supporterRewardsRoute(endpoint('PATCH',{seal:'constellation',frame:'stellar',aura:'nebula',revision:1}),env,a,{now:NOW})).status,200);
  const owner=await (await supporterRewardsRoute(endpoint(),env,a,{now:NOW})).json();
  const stranger=await (await supporterRewardsRoute(endpoint(),env,b,{now:NOW})).json();
  assert.deepEqual(owner.selected,{seal:'constellation',frame:'stellar',aura:'nebula'});
  assert.equal(stranger.supporter,false);
  assert.equal(stranger.selected,null);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_space_milestones').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_appearance').get().n,1);
 }finally{db.close()}
});
test('CSRF and authenticated source router enforce private reward writes',async()=>{
 const {db,env,users}=setup();
 try{
  const foreign=new Request(ORIGIN+'/api/v1/member/supporter/rewards',{
   method:'PATCH',headers:{'origin':'https://attacker.invalid','content-type':'application/json'},
   body:JSON.stringify({seal:'signal',frame:'orbital',aura:'aurora',revision:0})
  });
  assert.equal((await canonicalWorker.fetch(foreign,env)).status,403);
  const noCookies=await canonicalWorker.fetch(endpoint('PATCH',{seal:'signal',frame:'orbital',aura:'aurora',revision:0}),env);
  assert.ok([401,403].includes(noCookies.status));
  const unauthorized=await supporterRewardsRoute(endpoint('PATCH',{seal:'signal',frame:'orbital',aura:'aurora',revision:0}),env,users[1],{now:NOW});
  assert.equal(unauthorized.status,409);
 }finally{db.close()}
});

test('public profile only renders equipped cosmetics with active status and consent',async()=>{
 const {db,env,users}=setup();const [a]=users;
 try{
  support(db,env,a,NOW-180*DAY);
  db.prepare("UPDATE member_creator_profiles SET visibility='public' WHERE user_id=?").run(a.id);
  const target='/api/v1/members/alpha/space';
  const ownTarget='/api/v1/member/space';
  const read=async(publicRead)=>{
   const req=new Request(ORIGIN+(publicRead?target:ownTarget),{method:'GET'});
   const response=await canonicalSpace(req,env,publicRead?null:a,publicRead?'alpha':null,Math.floor(NOW/1000));
   assert.equal(response.status,200);
   return response.json();
  };
  const privateView=await read(false);
  assert.equal(privateView.supporter,true);
  assert.equal(privateView.supporterAppearance.seal,'signal');
  const hidden=await read(true);
  assert.equal(hidden.supporter,false);
  assert.equal('supporterAppearance' in hidden,false);
  db.prepare('INSERT INTO supporter_visibility(member_user_id,public_insignia,revision,updated_at_ms) VALUES(?,1,1,?)').run(a.id,NOW);
  const shown=await read(true);
  assert.equal(shown.supporter,true);
  assert.equal(shown.supporterAppearance.aura,'aurora');
  assert.equal('stripeCustomerId' in shown,false);
  assert.equal('startedAt' in shown,false);
  await supporterRewardsRoute(endpoint('PATCH',{seal:'constellation',frame:'stellar',aura:'nebula',revision:0}),env,a,{now:NOW});
  const updated=await read(true);
  assert.deepEqual(updated.supporterAppearance,{seal:'constellation',frame:'stellar',aura:'nebula'});
  db.prepare("UPDATE supporter_subscriptions SET status='canceled' WHERE member_user_id=?").run(a.id);
  const revoked=await read(true);
  assert.equal(revoked.supporter,false);
  assert.equal('supporterAppearance' in revoked,false);
 }finally{db.close()}
});
