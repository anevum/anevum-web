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
const checkout={id:'cs_test_Creator123456789',url:'https://checkout.stripe.com/c/pay/testsession',mode:'subscription',status:'open',client_reference_id:'member-alpha'};
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
async function signed(env,kind,object,tag='12345678'){
 const payload=JSON.stringify({
  id:'evt_'+kind.replace(/[^a-z]/gi,'')+tag,
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
  if(url.endsWith('/prices/'+env.CANONICAL_STRIPE_MONTHLY_PRICE_ID))return json({
   id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,active:true,type:'recurring',
   billing_scheme:'per_unit',currency:'usd',unit_amount:500,
   recurring:{interval:'month',interval_count:1}
  });
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
  const createdAgain=await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW+1000,http});
  assert.equal(createdAgain.status,200);
  assert.equal((await createdAgain.json()).url,checkout.url);
  assert.equal((await supporterMember(request('/checkout','POST',{interval:'year'}),env,a,{now:NOW+1000,http})).status,409);
  assert.equal(calls.filter(call=>call.url.endsWith('/checkout/sessions')&&call.opts.method==='POST').length,1);
  const sessionCall=calls.find(call=>call.url.endsWith('/checkout/sessions')&&call.opts.method==='POST');
  const params=new URLSearchParams(sessionCall.opts.body);
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
  if(url.endsWith('/prices/'+env.CANONICAL_STRIPE_MONTHLY_PRICE_ID))return json({
   id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,active:true,type:'recurring',billing_scheme:'per_unit',
   currency:'usd',unit_amount:500,recurring:{interval:'month',interval_count:1}
  });
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


test('canceled member reuses customer instead of creating orphaned second account',async()=>{
 const {db,env,a}=setup();
 const second='sub_Renewal987654321';
 const firstCheckout={...checkout,id:'cs_test_Original12345678'};
 const nextCheckout={...checkout,id:'cs_test_Return12345678'};
 let current=firstCheckout,oldStatus='active';
 const posts=[];
 const http=async(url,opts)=>{
  if(url.endsWith('/prices/'+env.CANONICAL_STRIPE_MONTHLY_PRICE_ID))return json({
   id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,active:true,type:'recurring',billing_scheme:'per_unit',
   currency:'usd',unit_amount:500,recurring:{interval:'month',interval_count:1}
  });
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST'){
   posts.push(new URLSearchParams(opts.body));
   return json(current);
  }
  if(url.endsWith('/checkout/sessions/'+firstCheckout.id))return json({
   ...firstCheckout,payment_status:'paid',customer,subscription:subId
  });
  if(url.endsWith('/checkout/sessions/'+nextCheckout.id))return json({
   ...nextCheckout,payment_status:'paid',customer,subscription:second
  });
  if(url.endsWith('/subscriptions/'+subId))return json(sub(env,oldStatus));
  if(url.endsWith('/subscriptions/'+second))return json({...sub(env),id:second,status:'active'});
  throw Error('Unexpected Stripe request: '+url);
 };
 try{
  assert.equal((await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW,http})).status,200);
  assert.equal((await supporterWebhook(await signed(env,'checkout.session.completed',{id:firstCheckout.id},'first12345'),env,{now:NOW,http})).status,200);
  oldStatus='canceled';
  assert.equal((await supporterWebhook(await signed(env,'customer.subscription.deleted',{id:subId},'canceled1'),env,{now:NOW+1000,http})).status,200);
  assert.equal((await (await supporterMember(request(''),env,a,{now:NOW+1000,http})).json()).supporter,false);
  current=nextCheckout;
  const returning=await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW+1500,http});
  assert.equal(returning.status,200);
  assert.equal(posts.length,2);
  assert.equal(posts[0].get('customer'),null);
  assert.equal(posts[0].get('customer_email'),a.email);
  assert.equal(posts[1].get('customer'),customer);
  assert.equal(posts[1].get('customer_email'),null);
  assert.equal((await supporterWebhook(await signed(env,'checkout.session.completed',{id:nextCheckout.id},'second1234'),env,{now:NOW+2000,http})).status,200);
  assert.equal((await (await supporterMember(request(''),env,a,{now:NOW+2000,http})).json()).supporter,true);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_customers').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_subscriptions').get().n,2);
 }finally{db.close()}
});
test('atomic checkout lease prevents racing payment sessions and is released after storage',async()=>{
 const {db,env,a}=setup();
 let release;
 const withheld=new Promise(resolve=>{release=resolve});
 let stripePosts=0;
 const http=async(url,opts)=>{
  if(url.includes('/prices/'))return json({
   id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,active:true,type:'recurring',
   billing_scheme:'per_unit',currency:'usd',unit_amount:500,recurring:{interval:'month',interval_count:1}
  });
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST'){
   stripePosts++;
   await withheld;
   return json(checkout);
  }
  throw Error('Unexpected Stripe operation: '+url);
 };
 try{
  const first=supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW,http});
  for(let i=0;i<200&&stripePosts===0;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stripePosts,1,'first checkout has acquired guard and reached Stripe');
  const second=await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW+1,http});
  assert.equal(second.status,409);
  assert.equal(stripePosts,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_checkout_guards').get().n,1);
  release();
  assert.equal((await first).status,200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_checkout_guards').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_checkout_intents').get().n,1);
 }finally{release?.();db.close()}
});
test('mismatched Stripe Price is rejected before Checkout, with retry lease released',async()=>{
 const {db,env,a}=setup();
 let valid=false,sessionPosts=0;
 const http=async(url,opts)=>{
  if(url.includes('/prices/'))return json({
   id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,active:true,type:'recurring',billing_scheme:'per_unit',
   currency:'usd',unit_amount:valid?500:499,recurring:{interval:'month',interval_count:1}
  });
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST'){
   sessionPosts++;return json(checkout);
  }
  throw Error('Unexpected Stripe operation: '+url);
 };
 try{
  assert.equal((await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW,http})).status,503);
  assert.equal(sessionPosts,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_checkout_guards').get().n,0);
  valid=true;
  assert.equal((await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW+5000,http})).status,200);
  assert.equal(sessionPosts,1);
 }finally{db.close()}
});
test('reused customer checkout cannot attach an unexpected Stripe customer',async()=>{
 const {db,env,a}=setup();
 try{
  db.prepare('INSERT INTO supporter_customers(member_user_id,stripe_customer_id,created_at_ms) VALUES(?,?,?)')
    .run(a.id,customer,NOW-100000);
  db.prepare("INSERT INTO supporter_checkout_intents(stripe_checkout_session_id,member_user_id,billing_interval,created_at_ms) VALUES(?,?,?,?)")
    .run(checkout.id,a.id,'month',NOW);
  const rogue='cus_OtherUnknownUser123';
  const http=async(url)=>{
   if(url.endsWith('/checkout/sessions/'+checkout.id))return json({
    ...checkout,payment_status:'paid',customer:rogue,subscription:subId
   });
   throw Error('Unexpected Stripe operation: '+url);
  };
  const event=await signed(env,'checkout.session.completed',{id:checkout.id},'rogue12345');
  assert.equal((await supporterWebhook(event,env,{now:NOW,http})).status,503);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_subscriptions').get().n,0);
 }finally{db.close()}
});


test('signed refunds and disputes hold verified billing without changing XP',async()=>{
 const {db,env,a}=setup();
 const charge='ch_SupportedTestCharge12345';
 const http=async(url)=>{
  if(url.endsWith('/charges/'+charge))return json({id:charge,customer,livemode:false});
  throw Error('Unexpected Stripe operation '+url);
 };
 try{
  // Out-of-order: the refund can arrive before Checkout completion.
  const refund=await signed(env,'refund.created',{id:'re_Test123456789',charge,status:'succeeded'},'hold123456');
  assert.equal((await supporterWebhook(refund,env,{now:NOW,http})).status,200);
  assert.equal(db.prepare('SELECT reason FROM supporter_billing_holds').get().reason,'refund');
  db.prepare('INSERT INTO supporter_customers(member_user_id,stripe_customer_id,created_at_ms) VALUES(?,?,?)')
    .run(a.id,customer,NOW);
  db.prepare("INSERT INTO supporter_subscriptions(stripe_subscription_id,member_user_id,stripe_customer_id,stripe_price_id,billing_interval,status,current_period_end_ms,cancel_at_period_end,synced_at_ms) VALUES(?,?,?,?,?,'active',?,0,?)")
    .run(subId,a.id,customer,env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,'month',NOW+86400000,NOW);
  db.prepare('INSERT INTO supporter_visibility(member_user_id,public_insignia,revision,updated_at_ms) VALUES(?,1,1,?)').run(a.id,NOW);
  const status=await (await supporterMember(request(''),env,a,{now:NOW,http})).json();
  assert.equal(status.status,'billing-review');
  assert.equal(status.supporter,false);
  assert.equal(await publicSupporterForMember(env,a.id,NOW),false);
  assert.equal((await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW,http})).status,409);
  assert.equal((await supporterMember(new Request(ORIGIN+'/api/v1/member/supporter',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({publicInsignia:true,revision:1})}),env,a,{now:NOW,http})).status,409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM member_xp_events').get().n,0);
 }finally{db.close()}
});
test('signed dispute holds customer; non-final refunds do not hold billing',async()=>{
 const {db,env,a}=setup();
 const charge='ch_DisputeTestCharge1234',customerId='cus_DisputeTestUser12345';
 const http=async(url)=>{
  if(url.endsWith('/charges/'+charge))return json({id:charge,customer:customerId,livemode:false});
  throw Error('Unexpected Stripe operation '+url);
 };
 try{
  const pending=await signed(env,'refund.created',{charge,status:'pending'},'nonfinal123');
  assert.equal((await supporterWebhook(pending,env,{now:NOW,http})).status,200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_billing_holds').get().n,0);
  const dispute=await signed(env,'charge.dispute.created',{id:'dp_Test123456',charge},'dispute123');
  assert.equal((await supporterWebhook(dispute,env,{now:NOW,http})).status,200);
  assert.equal(db.prepare('SELECT reason FROM supporter_billing_holds').get().reason,'dispute');
  assert.equal(db.prepare('SELECT stripe_customer_id FROM supporter_billing_holds').get().stripe_customer_id,customerId);
  const tamper=await signed(env,'charge.refunded',{id:'ch_BadMissingCharge1234'},'badcharge12');
  assert.equal((await supporterWebhook(tamper,env,{now:NOW,http})).status,503);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM supporter_billing_holds').get().n,1);
 }finally{db.close()}
});
test('delayed asynchronous Checkout only grants after verified paid event',async()=>{
 const {db,env,a}=setup();
 let paid=false;
 const http=async(url,opts)=>{
  if(url.includes('/prices/'))return json({
   id:env.CANONICAL_STRIPE_MONTHLY_PRICE_ID,active:true,type:'recurring',
   billing_scheme:'per_unit',currency:'usd',unit_amount:500,recurring:{interval:'month',interval_count:1}
  });
  if(url.endsWith('/checkout/sessions')&&opts.method==='POST')return json(checkout);
  if(url.endsWith('/checkout/sessions/'+checkout.id))return json({
   ...checkout,customer,subscription:subId,payment_status:paid?'paid':'unpaid'
  });
  if(url.endsWith('/subscriptions/'+subId))return json(sub(env));
  throw Error('Unexpected Stripe operation '+url);
 };
 try{
  assert.equal((await supporterMember(request('/checkout','POST',{interval:'month'}),env,a,{now:NOW,http})).status,200);
  assert.equal((await supporterWebhook(await signed(env,'checkout.session.completed',{id:checkout.id},'initial100'),env,{now:NOW,http})).status,200);
  assert.equal((await (await supporterMember(request(''),env,a,{now:NOW,http})).json()).supporter,false);
  paid=true;
  assert.equal((await supporterWebhook(await signed(env,'checkout.session.async_payment_succeeded',{id:checkout.id},'asyncpaid1'),env,{now:NOW+1000,http})).status,200);
  assert.equal((await (await supporterMember(request(''),env,a,{now:NOW+1000,http})).json()).supporter,true);
 }finally{db.close()}
});
