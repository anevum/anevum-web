import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {SUPPORT_API,SUPPORT_HOOK,SUPPORT_OFFERS,sandboxReady,validVariation,
 trustedCheckoutUrl,createSandboxCheckout,verifySquareWebhook,squareCall} from '../support-v2/square.mjs';
import {supportV2SchemaReady,supportV2Member,supportV2Webhook} from '../canonical-auth/support-v2.mjs';

const env=()=>({
 ANEVUM_SUPPORT_V2_ENABLED:'true',ANEVUM_SUPPORT_V2_MODE:'sandbox',
 ANEVUM_SQUARE_SANDBOX_ACCESS_TOKEN:'sandbox-access-token-no-real-charge',
 ANEVUM_SQUARE_SANDBOX_WEBHOOK_KEY:'sandbox-webhook-key-secret-test',
 ANEVUM_SQUARE_SANDBOX_LOCATION_ID:'LOCATION_SANDBOX',
 ANEVUM_SQUARE_SANDBOX_MONTH_VARIATION_ID:'VAR_MONTH_SUB',
 ANEVUM_SQUARE_SANDBOX_YEAR_VARIATION_ID:'VAR_YEAR_SUB',
 ANEVUM_SQUARE_SANDBOX_WEBHOOK_URL:'https://a.anevum.com'+SUPPORT_HOOK
});
const catalog=(variation,offer)=>({
 id:variation,type:'SUBSCRIPTION_PLAN_VARIATION',is_deleted:false,
 subscription_plan_variation_data:{phases:[{
  cadence:offer.cadence,pricing:{type:'STATIC',
   price_money:{amount:offer.amount,currency:'USD'}}
 }]}
});
const tables=['support_v2_checkout_guards','support_v2_intents','support_v2_payments',
 'support_v2_memberships','support_v2_payment_holds','support_v2_webhook_events'];
const fakeDb=names=>({
 prepare:()=>({bind(){return this},all:async()=>({results:names.map(name=>({name}))})})
});
const raw=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('deployment is sandbox-only, explicit, and cannot point to a different notification host',()=>{
 assert.equal(sandboxReady(env()),true);
 for(const [key,value] of [
  ['ANEVUM_SUPPORT_V2_MODE','production'],
  ['ANEVUM_SUPPORT_V2_ENABLED','false'],
  ['ANEVUM_SQUARE_SANDBOX_WEBHOOK_URL','https://evil.example/webhook'],
  ['ANEVUM_SQUARE_SANDBOX_MONTH_VARIATION_ID','VAR_YEAR_SUB'],
  ['ANEVUM_SQUARE_SANDBOX_ACCESS_TOKEN','']
 ]){
  const x={...env(),[key]:value};
  assert.equal(sandboxReady(x),false,key);
 }
 assert.match(raw('support-v2/square.mjs'),/connect\.squareupsandbox\.com/);
 assert.doesNotMatch(raw('support-v2/square.mjs'),/connect\.squareup\.com(?:\/|['"])/);
});
test('server-owned plans cannot be replaced by arbitrary client prices',()=>{
 assert.equal(SUPPORT_OFFERS.month.amount,500);
 assert.equal(SUPPORT_OFFERS.year.amount,3600);
 for(const [key,offer] of Object.entries(SUPPORT_OFFERS)){
  const variation=key==='month'?env().ANEVUM_SQUARE_SANDBOX_MONTH_VARIATION_ID:env().ANEVUM_SQUARE_SANDBOX_YEAR_VARIATION_ID;
  assert.equal(validVariation(catalog(variation,offer),variation,offer),true);
  assert.equal(validVariation(catalog(variation,{...offer,amount:499}),variation,offer),false);
  assert.equal(validVariation(catalog(variation,{...offer,cadence:'WEEKLY'}),variation,offer),false);
  assert.equal(validVariation({...catalog(variation,offer),is_deleted:true},variation,offer),false);
  const p=catalog(variation,offer);
  p.subscription_plan_variation_data.phases.push(p.subscription_plan_variation_data.phases[0]);
  assert.equal(validVariation(p,variation,offer),false);
 }
});
test('checkout redirect destination is HTTPS and constrained to Square-owned domains',()=>{
 for(const value of ['http://square.link/x','https://square.link.evil.test/x',
  'https://evil.test/x','https://user:pass@square.link/x','javascript:alert(1)','/relative']){
  assert.equal(trustedCheckoutUrl(value),null,value);
 }
 assert.equal(trustedCheckoutUrl('https://square.link/ABC123'),'https://square.link/ABC123');
 assert.equal(trustedCheckoutUrl('https://checkout.square.site/my-link'),
  'https://checkout.square.site/my-link');
});
test('Square sandbox checkout validates the current plan before creating any payment link',async()=>{
 const calls=[];
 const fetcher=async(url,options)=>{
  calls.push({url,options});
  if(url.includes('/catalog/object/'))return Response.json({object:catalog('VAR_MONTH_SUB',SUPPORT_OFFERS.month)});
  return Response.json({payment_link:{id:'PAYLINK001',order_id:'ORDER001',
   url:'https://square.link/TEST0001'}});
 };
 const result=await createSandboxCheckout(env(),{
  interval:'month',intentId:'9a66c6ef-152f-41c2-a630-93a787317d01',email:'test@example.com',fetcher});
 assert.equal(result.url,'https://square.link/TEST0001');
 assert.equal(calls.length,2);
 assert(calls.every(v=>v.url.startsWith('https://connect.squareupsandbox.com')));
 assert(calls.every(v=>v.options.headers.Authorization.startsWith('Bearer sandbox-')));
 const payload=JSON.parse(calls[1].options.body);
 assert.equal(payload.quick_pay.price_money.amount,500);
 assert.equal(payload.quick_pay.price_money.currency,'USD');
 assert.equal(payload.checkout_options.subscription_plan_id,'VAR_MONTH_SUB');
 assert.equal(payload.checkout_options.redirect_url,'https://a.anevum.com/support?checkout=returned');
 assert.equal(payload.idempotency_key,'9a66c6ef-152f-41c2-a630-93a787317d01');
 assert.equal(payload.payment_note,'ANEVUM-SUPPORT-V2:'+payload.idempotency_key);
 assert.equal(payload.checkout_options.allow_tipping,false);
});
test('mismatched provider catalog prevents session creation without silently overriding price',async()=>{
 let requests=0;
 const fetcher=async()=>{
  requests++;
  return Response.json({object:catalog('VAR_YEAR_SUB',{...SUPPORT_OFFERS.year,amount:3500})});
 };
 await assert.rejects(createSandboxCheckout(env(),{
  interval:'year',intentId:'9a66c6ef-152f-41c2-a630-93a787317d01',fetcher
 }),/Provider plan price/);
 assert.equal(requests,1);
});
test('signed webhook verification binds URL, exact body and secret',async()=>{
 const e=env(),body='{"event_id":"abcdef12-1234-45ab-9abc-abcdef012345","type":"payment.updated"}';
 const data=new TextEncoder();
 const key=await webcrypto.subtle.importKey('raw',data.encode(e.ANEVUM_SQUARE_SANDBOX_WEBHOOK_KEY),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=Buffer.from(await webcrypto.subtle.sign('HMAC',key,
  data.encode(e.ANEVUM_SQUARE_SANDBOX_WEBHOOK_URL+body))).toString('base64');
 assert.equal(await verifySquareWebhook(body,signature,e),true);
 assert.equal(await verifySquareWebhook(body+' ',signature,e),false);
 assert.equal(await verifySquareWebhook(body,'corrupted',e),false);
 assert.equal(await verifySquareWebhook(body,signature,{
  ...e,ANEVUM_SQUARE_SANDBOX_WEBHOOK_KEY:'different-webhook-key-123'
 }),false);
});
test('unknown provider paths and invalid mode never reach the network',async()=>{
 let attempts=0;
 const fetcher=async()=>{attempts++;return Response.json({})};
 await assert.rejects(squareCall(env(),'/v2/bank-accounts',{fetcher}),/sandbox unavailable/);
 await assert.rejects(squareCall({...env(),ANEVUM_SUPPORT_V2_MODE:'production'},
  '/v2/payments/PAID001',{fetcher}),/sandbox unavailable/);
 assert.equal(attempts,0);
});
test('sandbox endpoints remain disabled with missing schema, and offline read is explicit',async()=>{
 assert.equal(await supportV2SchemaReady(fakeDb(tables)),true);
 assert.equal(await supportV2SchemaReady(fakeDb(tables.slice(1))),false);
 const request=new Request('https://a.anevum.com'+SUPPORT_API);
 const user={id:'member-123',email:'test@example.com',emailVerified:true};
 const response=await supportV2Member(request,{...env(),MEMBER_DB:fakeDb([])},user);
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).plans,{month:500,year:3600});
});
test('webhook never processes unsigned requests, even with a complete staging schema',async()=>{
 const body=JSON.stringify({event_id:'11111111-2222-4333-8444-555555555555',type:'payment.updated'});
 const request=new Request('https://a.anevum.com'+SUPPORT_HOOK,{
  method:'POST',headers:{'content-type':'application/json'},body
 });
 const result=await supportV2Webhook(request,{...env(),MEMBER_DB:fakeDb(tables)});
 assert.equal(result.status,403);
});
test('old Stripe supporter routes stay retired and account deletion protects the new pending ledger',()=>{
 const worker=raw('canonical-auth/worker.mjs');
 const closure=raw('canonical-auth/account-closure.mjs');
 const page=raw('web/src/pages/SupporterPage.tsx');
 assert.match(worker,/V081: payment-provider migration/);
 assert.match(worker,/supportV2Webhook/);
 assert.match(worker,/supportV2Member/);
 assert.match(closure,/support_v2_intents/);
 assert.match(closure,/support_v2_checkout_guards/);
 assert.match(closure,/support_v2_memberships/);
 assert.match(page,/PAYMENTS PAUSED/);
 assert.match(page,/PROVIDER TRANSITION/);
 assert.match(page,/trustedSquareDestination/);
 assert.doesNotMatch(page,/stripe\.com/);
 assert.doesNotMatch(page,/\/api\/v1\/member\/supporter(?:\/|['"])/);
});
