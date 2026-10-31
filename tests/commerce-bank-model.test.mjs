import test from "node:test";
import assert from "node:assert/strict";
import {
  createUnpaidOrderDraft, evaluateBankCreditCandidate, simulateBalancedJournal,
  bankReadinessGates
} from "../src/server/commerce-bank-model.mjs";

const prices = { "signal-support-5":500, "signal-support-10":1000,
  "signal-support-25":2500, "vault-10g-month":400,"vault-50g-month":900 };
const base = {
  memberId:"user-A",orderId:"b6c584a8-705f-4b52-99bf-3f78a64ac9cd",
  productCode:"vault-10g-month",prices,reference:"ANV00C9DE54AF",now:1793050000000
};
const entry={
  id:"synthetic-bank-entry-1",institutionId:"simulation-only",
  accountAlias:"anevum-business-not-configured", direction:"credit",
  postingStatus:"posted", amountCents:400,currency:"USD",
  reference:"ANV00C9DE54AF"
};

test("Order is an unpaid owner-session-scoped quote, not payment instructions",()=>{
  const order=createUnpaidOrderDraft(base);
  assert.equal(order.memberId,"user-A");
  assert.equal(order.paymentInstructionsAvailable,false);
  assert.equal(order.paid,false);
  assert.equal(order.amountCents,400);
  assert.equal(order.state,"draft");
  assert.equal(Object.isFrozen(order),true);
  assert.throws(()=>createUnpaidOrderDraft({...base,reference:"../../secret"}));
  assert.throws(()=>createUnpaidOrderDraft({...base,productCode:"vault-100g-month"}));
});

test("Untrusted bank-like records cannot grant paid capacity",()=>{
  const order=createUnpaidOrderDraft(base);
  const match=evaluateBankCreditCandidate(order,entry,{now:base.now+5000});
  assert.deepEqual(match,{
    matched:true,reason:"synthetic_candidate_only",verified:false,canFulfill:false
  });
  assert.equal(evaluateBankCreditCandidate(order,{...entry,amountCents:399},{now:base.now+5000}).matched,false);
  assert.equal(evaluateBankCreditCandidate(order,{...entry,reference:"different"},{now:base.now+5000}).matched,false);
  assert.equal(evaluateBankCreditCandidate(order,{...entry,direction:"debit"},{now:base.now+5000}).matched,false);
  assert.equal(evaluateBankCreditCandidate(order,{...entry,postingStatus:"pending"},{now:base.now+5000}).matched,false);
  assert.equal(evaluateBankCreditCandidate(order,entry,{now:base.now+5000,knownBankEntryIds:[entry.id]}).matched,false);
  assert.equal(evaluateBankCreditCandidate(order,entry,{now:base.now+31*86400000}).matched,false);
});

test("Synthetic journal is balanced and explicitly not settled",()=>{
  const order=createUnpaidOrderDraft(base);
  const result=evaluateBankCreditCandidate(order,entry,{now:base.now+5000});
  const journal=simulateBalancedJournal(order,result,{entryId:"simulation-1"});
  assert.equal(journal.synthetic,true);
  assert.equal(journal.settled,false);
  assert.equal(journal.entries.reduce((n,x)=>n+x.debitCents-x.creditCents,0),0);
  assert.throws(()=>simulateBalancedJournal(order,{matched:true,verified:true,canFulfill:true},{entryId:"sim"}));
  assert.throws(()=>simulateBalancedJournal(order,{matched:false,verified:false,canFulfill:false},{entryId:"sim"}));
});

test("Bank onboarding gates never automatically enable money acceptance",()=>{
  const no=bankReadinessGates();
  assert.equal(no.readyToConsiderRelease,false);
  assert.equal(no.liveAcceptanceEnabled,false);
  assert(no.missing.includes("merchantAccountApproved"));
  const yes=bankReadinessGates(Object.fromEntries(no.missing.map(x=>[x,true])));
  assert.equal(yes.readyToConsiderRelease,true);
  assert.equal(yes.liveAcceptanceEnabled,false);
});
