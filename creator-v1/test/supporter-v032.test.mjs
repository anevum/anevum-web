import test from "node:test";
import assert from "node:assert/strict";
import {SUPPORTER_PLAN,allowedPlan,supporterState,publicSupporterView,acceptStripeEventType,validateStripeIdentity} from "../supporter/entitlements.mjs";
const now=1_800_000_000_000;
test("exact price whitelist",()=>{
  assert.deepEqual(allowedPlan("month"),{key:"founding-supporter",interval:"month",currency:"usd",amountCents:500});
  assert.deepEqual(allowedPlan("year"),{key:"founding-supporter",interval:"year",currency:"usd",amountCents:3600});
  assert.equal(allowedPlan("weekly"),null);
  assert.equal(SUPPORTER_PLAN.annualCents,3600);
});
test("fail closed for unknown, missing and expired billing data",()=>{
  for(const row of [null,{}, {status:"active"}, {status:"active",currentPeriodEnd:"tomorrow"},
    {status:"active",currentPeriodEnd:now-1},{status:"past_due",currentPeriodEnd:now+5000},
    {status:"canceled",currentPeriodEnd:now+5000},{status:"surprise",currentPeriodEnd:now+5000}]){
    assert.equal(supporterState(row,now).supporter,false);
  }
});
test("active and trialing subscriptions require valid future period",()=>{
  for(const status of ["active","trialing"]){
    assert.equal(supporterState({status,currentPeriodEnd:now+5000},now).supporter,true);
    assert.equal(supporterState({status,currentPeriodEnd:now},now).supporter,false);
  }
});
test("public profile only exposes badge boolean and earned designation",()=>{
  assert.deepEqual(publicSupporterView({status:"active",currentPeriodEnd:now+1000,stripeCustomerId:"cus_secret"},now),
    {supporter:true,kind:"founding-supporter"});
  assert.deepEqual(publicSupporterView(null,now),{supporter:false,kind:null});
});
test("explicit event allowlist and identity checks",()=>{
  assert.equal(acceptStripeEventType("customer.subscription.updated"),true);
  assert.equal(acceptStripeEventType("charge.refunded"),false);
  assert.equal(validateStripeIdentity({stripeCustomerId:"cus_abc123",stripeSubscriptionId:"sub_abc123",memberUserId:"canonical-member-1"}),true);
  assert.equal(validateStripeIdentity({stripeCustomerId:"attacker",stripeSubscriptionId:"sub_abc123",memberUserId:"canonical-member-1"}),false);
});
