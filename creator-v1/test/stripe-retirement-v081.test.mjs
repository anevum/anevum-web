import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCanonicalStageWorker} from '../canonical-auth/worker.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('payment endpoints stay inaccessible even with stale test-mode credentials',async()=>{
 let authCalls=0;
 const worker=createCanonicalStageWorker({authFactory:()=>{
  authCalls++;
  throw Error('Authorization should never run for retired checkout');
 }});
 const env={
  ANEVUM_CANONICAL_STAGE_ENABLED:'true',
  CANONICAL_SUPPORTER_COMMERCE_ENABLED:'true',
  CANONICAL_STRIPE_SECRET_KEY:'sk_test_'+'a'.repeat(40),
  CANONICAL_STRIPE_WEBHOOK_SECRET:'whsec_'+'b'.repeat(40)
 };
 const routes=['','/checkout','/portal','/webhook','/rewards','/checkout/unknown','/unknown'];
 for(const path of routes){
  for(const method of ['GET','POST','PATCH']){
   const request=new Request('https://a.anevum.com/api/v1/member/supporter'+path,{
    method,headers:{origin:'https://a.anevum.com','content-type':'application/json'},
    ...(method==='GET'?{}:{body:'{}'})
   });
   const response=await worker.fetch(request,env);
   assert.equal(response.status,404,method+' '+path);
   assert.match(response.headers.get('cache-control')||'',/no-store/);
  }
 }
 assert.equal(authCalls,0);
});

test('apex canonical mode also blocks retired checkout before authentication',async()=>{
 let authCalls=0;
 const worker=createCanonicalStageWorker({authFactory:()=>{authCalls++;throw Error('Unexpected authorization')}});
 const request=new Request('https://anevum.com/api/v1/member/supporter/checkout',{method:'POST',headers:{origin:'https://anevum.com'},body:'{}'});
 const response=await worker.fetch(request,{ANEVUM_CANONICAL_APEX_ENABLED:'true',CANONICAL_SUPPORTER_COMMERCE_ENABLED:'true'});
 assert.equal(response.status,404);
 assert.equal(authCalls,0);
});

test('no supporter payments or Stripe destinations are reachable from the public frontend',()=>{
 const page=read('web/src/pages/SupporterPage.tsx');
 const collection=read('web/src/pages/SupporterCollectionPage.tsx');
 assert.match(page,/PAYMENTS PAUSED/);
 assert.match(page,/PROVIDER TRANSITION/);
 for(const text of [page,collection]){
  assert.doesNotMatch(text,/stripe\.com|\/api\/v1\/member\/supporter(?:\/|['\"])/);
 }
 assert.match(collection,/memberId=\{null\}/);
 assert.match(page,/trustedSquareDestination/);
 assert.match(page,/sandbox/);
 assert.match(page,/\/api\/v1\/member\/support-v2\/checkout/);
});

test('cron retains media cleanup but not payment processor reconciliation',()=>{
 const stage=read('web/a-canonical-stage.review.mjs');
 assert.match(stage,/cleanupCanonicalStudioAssets/);
 assert.doesNotMatch(stage,/reconcileSupporterSubscriptions|reconcileSupporterCheckouts|stripeRequest/);
});

test('historical dispute and member-record safeguards remain intact',()=>{
 const accountClosure=read('canonical-auth/account-closure.mjs');
 const supporter=read('canonical-auth/supporter.mjs');
 assert.match(accountClosure,/supporter_customers/);
 assert.match(accountClosure,/supporter_subscriptions/);
 assert.match(supporter,/supporter_billing_holds/);
});