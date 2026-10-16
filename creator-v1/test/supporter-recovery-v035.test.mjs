import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {supporterMember,reconcileSupporterCheckouts} from '../canonical-auth/supporter.mjs';
import {readSupporterRewards} from '../canonical-auth/supporter-rewards.mjs';
const ORIGIN='https://a.anevum.com',NOW=1792155000000,DAY=86400000;
const firstId='cs_test_RecoveryFirst12345',secondId='cs_test_RecoverySecond12345';
const customer='cus_RecoveryMember12345',subId='sub_RecoveryMember12345';
function setup(){
 const {db,env}=fixture();
 db.exec(readFileSync(new URL('../canonical-auth/migrations/0006_supporter_commerce.sql',import.meta.url),'utf8'));
 Object.assign(env,{
  CANONICAL_SUPPORTER_COMMERCE_ENABLED:'true',
  CANONICAL_STRIPE_SECRET_KEY:'sk_test_'+'x'.repeat(40),
  CANONICAL_STRIPE_WEBHOOK_SECRET:'whsec_'+'y'.repeat(40),
  CANONICAL_STRIPE_MONTHLY_PRICE_ID:'price_RecoveryMonth12345',
  CANONICAL_STRIPE_ANNUAL_PRICE_ID:'price_RecoveryAnnual12345'
 });
 for(const id of ['member-one','member-two']){
  db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)')
   .run(id,id,id+'@fixture.invalid');
  db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,0,0)')
   .run(id,id.replace('member-',''),id,'');
 }
 return {db,env,member:{id:'member-one',email:'member-one@fixture.invalid',emailVerified:true}};
}
const json=x=>new Response(JSON.stringify(x),{status:200,headers:{'content-type':'application/json'}});
const get=()=>new Request(ORIGIN+'/api/v1/member/supporter');
const checkout=interval=>new Request(ORIGIN+'/api/v1/member/supporter/checkout',{
 method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
 body:JSON.stringify({interval})
});
const session=(id,owner='member-one',status='complete',payment='paid')=>({
 id,url:'https://checkout.stripe.com/c/pay/'+id,
 mode:'subscription',client_reference_id:owner,livemode:false,
 status,payment_status:payment,customer,subscription:subId
});
const subscription=(env,interval='month')=>({
 id:subId,customer,status:'active',
 start_date:Math.floor((NOW-180*DAY)/1000),cancel_at_period_end:false,
 items:{data:[{quantity:1,current_period_end:Math.floor((NOW+DAY)/1000),
  price:{id:interval==='year'?env.CANONICAL_STRIPE_ANNUAL_PRICE_ID:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,
   currency:'usd',unit_amount:interval==='year'?3600:500,recurring:{interval}}}]}
});
function insertIntent(db,owner='member-one',id=firstId,interval='month',when=NOW-4000000){
 db.prepare('INSERT INTO supporter_checkout_intents(stripe_checkout_session_id,member_user_id,billing_interval,created_at_ms) VALUES(?,?,?,?)')
 .run(id,owner,interval,when);
}
test('status refresh recovers verified paid Checkout without a webhook or double charge',async()=>{
 const {db,env,member}=setup();
 const calls=[];
 const http=async(url,options)=>{
  calls.push([url,options?.method]);
  if(url.endsWith('/checkout/sessions/'+firstId))return json(session(firstId));
  if(url.endsWith('/subscriptions/'+subId))return json(subscription(env));
  throw Error('Unexpected Stripe URL '+url);
 };
 try{
  insertIntent(db);
  const state=await (await supporterMember(get(),env,member,{now:NOW,http})).json();
  assert.equal(state.supporter,true);
  assert.equal(state.status,'active');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_subscriptions').get().n,1);
  assert.equal(db.prepare('SELECT completed_at_ms FROM supporter_checkout_intents').get().completed_at_ms,NOW);
  assert.equal((await readSupporterRewards(env,member.id,NOW)).unlocks.tier,'constellation');
  const again=await (await supporterMember(get(),env,member,{now:NOW+1000,http})).json();
  assert.equal(again.supporter,true);
  assert.equal(calls.length,2);
  assert.equal(calls.some(v=>v[1]==='POST'),false);
 }finally{db.close()}
});
test('payable Checkout older than 30 minutes cannot be superseded',async()=>{
 const {db,env,member}=setup();
 let created=0;
 const http=async(url,opts)=>{
  if(url.endsWith('/checkout/sessions/'+firstId))return json(session(firstId,member.id,'open','unpaid'));
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST')created++;
  throw Error('Unexpected Stripe URL '+url);
 };
 try{
  insertIntent(db,member.id,firstId,'month',NOW-3600000);
  const same=await supporterMember(checkout('month'),env,member,{now:NOW,http});
  assert.equal(same.status,200);
  assert.equal((await same.json()).url,session(firstId).url);
  const other=await supporterMember(checkout('year'),env,member,{now:NOW+1000,http});
  assert.equal(other.status,409);
  assert.equal(created,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_checkout_intents').get().n,1);
 }finally{db.close()}
});
test('verified expired unpaid Checkout is retired, then one new short-lived session is created',async()=>{
 const {db,env,member}=setup();
 let created=0,fields=null,key=null;
 const http=async(url,opts)=>{
  if(url.endsWith('/checkout/sessions/'+firstId))return json(session(firstId,member.id,'expired','unpaid'));
  if(url.endsWith('/prices/'+env.CANONICAL_STRIPE_MONTHLY_PRICE_ID))return json({
   id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,active:true,type:'recurring',
   billing_scheme:'per_unit',currency:'usd',unit_amount:500,
   recurring:{interval:'month',interval_count:1}
  });
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST'){
   created++;fields=new URLSearchParams(opts.body);key=opts.headers['Idempotency-Key'];
   return json(session(secondId,member.id,'open','unpaid'));
  }
  throw Error('Unexpected Stripe URL '+url);
 };
 try{
  insertIntent(db,member.id,firstId,'month',NOW-3600000);
  const result=await supporterMember(checkout('month'),env,member,{now:NOW,http});
  assert.equal(result.status,200);
  assert.equal((await result.json()).url,session(secondId).url);
  assert.equal(created,1);
  assert.equal(fields.get('expires_at'),String(Math.ceil(NOW/1000)+1800));
  assert.match(key,/^anevum-v032-checkout-[\da-f-]{36}$/);
  assert.equal(db.prepare('SELECT abandoned_at_ms FROM supporter_checkout_intents WHERE stripe_checkout_session_id=?').get(firstId).abandoned_at_ms,NOW);
  assert.equal(db.prepare('SELECT completed_at_ms FROM supporter_checkout_intents WHERE stripe_checkout_session_id=?').get(secondId).completed_at_ms,null);
 }finally{db.close()}
});
test('a Stripe request failure retains an anti-double-charge lock beyond Checkout expiry',async()=>{
 const {db,env,member}=setup();
 let creates=0;
 const http=async(url,opts)=>{
  if(url.endsWith('/prices/'+env.CANONICAL_STRIPE_MONTHLY_PRICE_ID))return json({
   id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,active:true,type:'recurring',
   billing_scheme:'per_unit',currency:'usd',unit_amount:500,
   recurring:{interval:'month',interval_count:1}
  });
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST'){
   creates++;throw Error('Simulated network disconnection after sending request');
  }
  throw Error('Unexpected Stripe URL '+url);
 };
 try{
  assert.equal((await supporterMember(checkout('month'),env,member,{now:NOW,http})).status,503);
  const row=db.prepare('SELECT expires_at_ms FROM supporter_checkout_guards').get();
  assert.equal(row.expires_at_ms,NOW+7200000);
  assert.equal((await supporterMember(checkout('month'),env,member,{now:NOW+1800000,http})).status,409);
  assert.equal(creates,1);
 }finally{db.close()}
});
test('cron reconciles paid, expired and incomplete checkouts without minting XP',async()=>{
 const {db,env,member}=setup();
 let badOwner=false;
 const http=async url=>{
  if(url.endsWith('/checkout/sessions/'+firstId))return json(session(firstId,badOwner?'member-two':'member-one'));
  if(url.endsWith('/checkout/sessions/'+secondId))return json(session(secondId,'member-two','expired','unpaid'));
  if(url.endsWith('/subscriptions/'+subId))return json(subscription(env));
  throw Error('Unexpected Stripe URL '+url);
 };
 try{
  insertIntent(db);
  insertIntent(db,'member-two',secondId,'month',NOW-3000000);
  const first=await reconcileSupporterCheckouts(env,{now:NOW,http});
  assert.deepEqual(first,{available:true,examined:2,completed:1,expired:1,pending:0,failed:0});
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_subscriptions').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_checkout_intents WHERE abandoned_at_ms IS NOT NULL').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,0);
  const again=await reconcileSupporterCheckouts(env,{now:NOW+5000,http});
  assert.equal(again.examined,0);
  insertIntent(db,'member-two','cs_test_RecoveryThird12345','month',NOW);
  badOwner=true;
  const unexpected=await reconcileSupporterCheckouts(env,{now:NOW+301000,http});
  assert.equal(unexpected.failed,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_subscriptions').get().n,1);
 }finally{db.close()}
});
test('mismatched Checkout interval or owner cannot grant cosmetics',async()=>{
 const {db,env,member}=setup();
 const http=async url=>{
  if(url.endsWith('/checkout/sessions/'+firstId))return json(session(firstId));
  if(url.endsWith('/subscriptions/'+subId))return json(subscription(env,'month'));
  throw Error('Unexpected Stripe URL '+url);
 };
 try{
  insertIntent(db,member.id,firstId,'year');
  const state=await (await supporterMember(get(),env,member,{now:NOW,http})).json();
  assert.equal(state.supporter,false);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_subscriptions').get().n,0);
  assert.equal(db.prepare('SELECT completed_at_ms FROM supporter_checkout_intents').get().completed_at_ms,null);
  assert.equal(await readSupporterRewards(env,member.id,NOW),null);
 }finally{db.close()}
});
