import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {supporterMember,publicSupporterForMember,supporterExportMember,reconcileSupporterSubscriptions,reconcileSupporterCheckouts} from '../canonical-auth/supporter.mjs';
import {supporterRewardsRoute,readSupporterRewards} from '../canonical-auth/supporter-rewards.mjs';
const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const ORIGIN='https://a.anevum.com';
const user={id:'verified-member',emailVerified:true};
test('retired commerce fails closed even if old enable flags are present',async()=>{
 const env={CANONICAL_SUPPORTER_COMMERCE_ENABLED:'true'};
 const status=await supporterMember(new Request(ORIGIN+'/api/v1/member/supporter'),env,user);
 assert.equal(status.status,200);
 assert.deepEqual(await status.json(),{available:false,supporter:false,status:'retired',publicInsignia:false,revision:0});
 for(const route of ['/checkout','/portal','/webhook']){
  assert.equal((await supporterMember(new Request(ORIGIN+'/api/v1/member/supporter'+route,{method:'POST'}),env,user)).status,404);
 }
 assert.equal((await supporterMember(new Request(ORIGIN+'/api/v1/member/supporter',{method:'PATCH'}),env,user)).status,410);
 assert.equal(await publicSupporterForMember(env,user.id),false);
 assert.equal((await reconcileSupporterSubscriptions(env)).available,false);
 assert.equal((await reconcileSupporterCheckouts(env)).available,false);
});
test('recognition remains nonpayable and public entitlements remain withheld',async()=>{
 const req=new Request(ORIGIN+'/api/v1/member/supporter/rewards');
 const data=await (await supporterRewardsRoute(req,{},user)).json();
 assert.equal(data.available,false);assert.equal(data.supporter,false);
 assert.equal(data.catalog.seals.length>0,true);
 assert.equal(await readSupporterRewards({},user.id),null);
 assert.equal((await supporterRewardsRoute(new Request(req.url,{method:'PATCH'}),{},user)).status,410);
});
test('canonical edge and scheduler contain no payment-provider routes, callers or redirect',()=>{
 const worker=src('../canonical-auth/worker.mjs');
 const scheduler=src('../web/a-canonical-stage.review.mjs');
 const page=src('../web/src/pages/SupporterPage.tsx');
 assert.equal(worker.includes('supporterHook'),false);
 assert.equal(worker.includes('supporterWebhook'),false);
 for(const path of ['/supporter/checkout','/supporter/portal','/supporter/webhook']){
  assert.equal(worker.includes(path),false);
 }
 assert.equal(scheduler.includes('reconcileSupporter'),false);
 assert.equal(page.includes('stripe.com'),false);
 assert.equal(page.includes('window.location.assign'),false);
 assert.equal(page.includes('fetch('),false);
 assert.equal(page.includes('$36')||page.includes('$5'),false);
 assert.equal(page.includes('Payment enrollment is closed'),true);
});
