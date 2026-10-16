import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/canonical-fixture.mjs';
import {supporterMember,supporterWebhook,supporterSchemaReady,publicSupporterForMember} from '../canonical-auth/supporter.mjs';
import {stripePlan,supporterConfig,verifyStripeWebhook,subscriptionProjection} from '../supporter/stripe.mjs';
import {supporterState} from '../supporter/entitlements.mjs';
import canonicalWorker from '../web/a-canonical-stage.review.mjs';

const ORIGIN='https://a.anevum.com';
const NOW=1792155000000;
const t=Math.floor(NOW/1000);
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
 for(const [id,name] of [['member-alpha','alpha'],['member-beta','beta']]){
  db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,0,0)')
    .run(id,name,name+'@fixture.invalid');
  db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,created_at,updated_at) VALUES(?,?,?,?,0,0)')
    .run(id,name,name,'');
 }
 return {db,env,a:{id:'member-alpha',email:'alpha@fixture.invalid',emailVerified:true},
  b:{id:'member-beta',email:'beta@fixture.invalid',emailVerified:true}};
}
const request=(route,method='GET',body)=>new Request(ORIGIN+'/api/v1/member/supporter'+route,{
 method,headers:{origin:ORIGIN,'content-type':'application/json'},
 body:body===undefined?undefined:JSON.stringify(body)
});
const json=value=>new Response(JSON.stringify(value),{status:200,headers:{'content-type':'application/json'}});
const checkout={id:'cs_test_Creator123456789',url:'https://checkout.stripe.com/c/pay/testsession'};
const customer='cus_Creator123456789',subId='sub_Creator123456789';
function sub(env,status='active',price=env.CANONICAL_STRIPE_MONTHLY_PRICE_ID){
 return {id:subId,customer,status,cancel_at_period_end:false,
  items:{data:[{quantity:1,current_period_end:t+86400,price:{
   id:price,currency:'usd',recurring:{interval:'month'},unit_amount:500
  }}]}};
}
async function signature(raw,secret,time=t){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const data=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(time+'.'+raw));
 return 't='+time+',v1='+Array.from(new Uint8Array(data),n=>n.toString(16).padStart(2,'0')).join('');
}
async function signed(env,kind,object){
 const payload=JSON.stringify({
  id:'evt_'+kind.replace(/[^a-z]/gi,'')+'12345678',
  type:kind,livemode:false,created:t,data:{object}
 });
 return new Request(ORIGIN+'/api/v1/member/supporter/webhook',{
  method:'POST',headers:{'stripe-signature':await signature(payload,env.CANONICAL_STRIPE_WEBHOOK_SECRET),'content-type':'application/json'},body:payload
 });
}
test('pricing, schema, test-only lock and fail-closed state',async()=>{
 const {db,env,a}=setup();
 try{
  assert.equal(await supporterSchemaReady(env.MEMBER_DB),true);
  assert.equal(supporterConfig(env).enabled,true);
  assert.equal(stripePlan(env,'month').amountCents,500);
  assert.equal(stripePlan(env,'year').amountCents,3600);
  assert.equal(stripePlan(env,'week'),null);
  assert.equal(subscriptionProjection(sub(env),env).currentPeriodEnd,(t+86400)*1000);
  assert.equal(subscriptionProjection(sub(env,'active','price_fakeUnexpected100'),env),null);
  assert.equal(supporterState({status:'past_due',currentPeriodEnd:NOW+10000},NOW).supporter,false);
  const locked={...env,CANONICAL_STRIPE_SECRET_KEY:'sk_live_'+('x'.repeat(40))};
  assert.equal(supporterConfig(locked).enabled,false);
  assert.equal((await (await supporterMember(request(''),locked,a,{now:NOW})).json()).available,false);
  assert.equal((await supporterMember(request('/checkout','POST',{interval:'month'}),locked,a,{now:NOW})).status,404);
 }finally{db.close()}
});
test('raw-body signature checks reject tampering, replay age and unknown secret',async()=>{
 const secret='whsec_'+'b'.repeat(40),raw='{"id":"evt_demo123"}';
 const good=await signature(raw,secret);
 assert.equal(await verifyStripeWebhook(raw,good,secret,NOW),true);
 assert.equal(await verifyStripeWebhook(raw+' ',good,secret,NOW),false);
 assert.equal(await verifyStripeWebhook(raw,good,secret,NOW+301000),false);
 assert.equal(await verifyStripeWebhook(raw,good,'whsec_'+('c'.repeat(40)),NOW),false);
});
test('checkout, signed settlement, private entitlement, duplicate event and portal',async()=>{
 const {db,env,a,b}=setup();
 const calls=[];
 const http=async(url,opts)=>{
  calls.push({url,opts});
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST')return json(checkout);
  if(url.endsWith('/checkout/sessions/'+checkout.id))return json({
   ...checkout,mode:'subscription',payment_status:'paid',client_reference_id:a.id,customer,subscription:subId
  });
  if(url.endsWith('/subscriptions/'+subId))return json(sub(env));
  if(url.endsWith('/billing_portal/sessions'))return json({url:'https://billing.stripe.com/p/session/validtest'});
  throw Error('Unexpected Stripe request: '+url);
 };
 try{
  const initial=await (await supporterMember(request(''),env,a,{now:NOW,http})).json();
  assert.equal(initial.supporter,false);
  assert.equal(initial.publicInsignia,false);
  assert.equal(initial.revision,0);
  assert.equal(await publicSupporterForMember(env,a.id,NOW),false);
  assert.equal((await supporterMember(new Request(ORIGIN+'/api/v1/member/supporter',{method:'PATCH',headers:{origin:ORIGIN,'content-type':'application/json'},body:JSON.stringify({publicInsignia:true,revision:0})}),env,a,{now:NOW,http})).status,409);
  const reject=await supporterMember(request('/checkout','POST',{interval:'month',amount:1}),env,a,{now:NOW,http});
  assert.equal(reject.status,400);
  const created=await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW,http});
  assert.equal(created.status,200);assert.equal((await created.json()).url,checkout.url);
  const params=new URLSearchParams(calls[0].opts.body);
  assert.equal(params.get('customer_email'),a.email);
  assert.equal(params.get('line_items[0][price]'),env.CANONICAL_STRIPE_MONTHLY_PRICE_ID);
  assert.equal(params.get('client_reference_id'),a.id);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_checkout_intents').get().n,1);
  const event=await signed(env,'checkout.session.completed',{id:checkout.id});
  assert.equal((await supporterWebhook(event.clone(),env,{now:NOW,http})).status,200);
  assert.equal((await supporterWebhook(event.clone(),env,{now:NOW,http})).status,200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_webhook_events').get().n,1);
  const statusA=await (await supporterMember(request(''),env,a,{now:NOW,http})).json();
  const statusB=await (await supporterMember(request(''),env,b,{now:NOW,http})).json();
  assert.equal(statusA.supporter,true);assert.equal(statusB.supporter,false);
  const patch=(user,publicInsignia,revision)=>new Request(ORIGIN+'/api/v1/member/supporter',{
    method:'PATCH',headers:{origin:ORIGIN,'content-type':'application/json'},body:JSON.stringify({publicInsignia,revision})
  });
  const aOpt=await supporterMember(patch(a,true,0),env,a,{now:NOW,http});
  assert.equal(aOpt.status,200);
  assert.deepEqual(await aOpt.json(),{publicInsignia:true,revision:1});
  assert.equal(await publicSupporterForMember(env,a.id,NOW),true);
  assert.equal(await publicSupporterForMember(env,b.id,NOW),false);
  assert.equal((await supporterMember(patch(b,true,0),env,b,{now:NOW,http})).status,409);
  assert.equal((await supporterMember(patch(a,false,0),env,a,{now:NOW,http})).status,409);
  const aHide=await supporterMember(patch(a,false,1),env,a,{now:NOW,http});
  assert.equal(aHide.status,200);
  assert.deepEqual(await aHide.json(),{publicInsignia:false,revision:2});
  assert.equal(await publicSupporterForMember(env,a.id,NOW),false);
  assert.equal(statusA.until,(t+86400)*1000);
  assert.equal((await supporterMember(request('/portal','POST'),env,b,{now:NOW,http})).status,409);
  const p=await supporterMember(request('/portal','POST'),env,a,{now:NOW,http});
  assert.equal(p.status,200);
  assert.equal((await p.json()).url,'https://billing.stripe.com/p/session/validtest');
  assert.equal((await supporterMember(request('/checkout','POST',{interval:'year'}),env,a,{now:NOW,http})).status,409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,0);
 }finally{db.close()}
});
test('subscription cancellation and invalid client-reference events cannot grant membership',async()=>{
 const {db,env,a}=setup();
 let cancelled=false,foreign=false;
 const http=async(url,opts)=>{
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST')return json(checkout);
  if(url.endsWith('/checkout/sessions/'+checkout.id))return json({
   ...checkout,mode:'subscription',payment_status:'paid',client_reference_id:foreign?'member-beta':a.id,
   customer,subscription:subId
  });
  if(url.endsWith('/subscriptions/'+subId))return json(sub(env,cancelled?'canceled':'active'));
  throw Error('Unexpected Stripe request');
 };
 try{
  await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW,http});
  foreign=true;
  assert.equal((await supporterWebhook(await signed(env,'checkout.session.completed',{id:checkout.id}),env,{now:NOW,http})).status,503);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_subscriptions').get().n,0);
  foreign=false;
  assert.equal((await supporterWebhook(await signed(env,'checkout.session.completed',{id:checkout.id}),env,{now:NOW,http})).status,200);
  cancelled=true;
  assert.equal((await supporterWebhook(await signed(env,'customer.subscription.deleted',{id:subId}),env,{now:NOW+1000,http})).status,200);
  const state=await (await supporterMember(request(''),env,a,{now:NOW+1000,http})).json();
  assert.equal(state.supporter,false);
  assert.equal(await publicSupporterForMember(env,a.id,NOW+1000),false);
 }finally{db.close()}
});
test('canonical router blocks forged browser POST and no-origin webhook cannot bypass signature',async()=>{
 const {db,env}=setup();
 try{
  const csrf=new Request(ORIGIN+'/api/v1/member/supporter/checkout',{
   method:'POST',headers:{'content-type':'application/json'},body:'{"interval":"month"}'
  });
  assert.equal((await canonicalWorker.fetch(csrf,env)).status,403);
  const forged=new Request(ORIGIN+'/api/v1/member/supporter/webhook',{
   method:'POST',headers:{'content-type':'application/json','stripe-signature':'t=1234567890,v1=wrong'},body:'{"id":"evt_wrong"}'
  });
  assert.equal((await canonicalWorker.fetch(forged,env)).status,400);
 }finally{db.close()}
});
