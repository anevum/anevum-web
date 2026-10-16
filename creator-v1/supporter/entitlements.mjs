/**
 * ANEVUM SUPPORTER V032 — pure, fail-closed billing state projection.
 * This module makes NO network requests, creates NO checkout sessions,
 * assigns NO XP and never trusts client-supplied entitlement flags.
 * A future authenticated endpoint must resolve its own member user id.
 */
export const SUPPORTER_PLAN=Object.freeze({
  id:"founding-supporter",
  currency:"usd",
  monthlyCents:500,
  annualCents:3600,
  intervalOptions:Object.freeze(["month","year"])
});
const ACTIVE=new Set(["active","trialing"]);
const KNOWN=new Set(["incomplete","incomplete_expired","trialing","active","past_due","canceled","unpaid","paused"]);
export function supporterState(record,now=Date.now()){
  if(!record || typeof record!=="object")return {supporter:false,state:"none",until:null};
  const status=record.status;
  const until=record.currentPeriodEnd;
  if(!KNOWN.has(status)||!Number.isSafeInteger(until)||until<=0)
    return {supporter:false,state:"unverified",until:null};
  // Entitlements are valid only for a known subscription lifecycle AND a
  // period-end supplied by verified Stripe data and persisted server-side.
  if(status==="active" || status==="trialing"){
    return {supporter:until>now,state:until>now?"active":"expired",until};
  }
  // Stripe subscriptions marked canceled do not automatically confer access.
  // If cancelling at period end, Stripe remains active until that period ends.
  return {supporter:false,state:status,until};
}
export function allowedPlan(interval){
  if(interval!=="month"&&interval!=="year")return null;
  return {key:SUPPORTER_PLAN.id,interval,currency:"usd",amountCents:interval==="month"?500:3600};
}
export function publicSupporterView(record,now=Date.now()){
  const state=supporterState(record,now);
  return {supporter:state.supporter,kind:state.supporter?"founding-supporter":null};
}
export function acceptStripeEventType(type){
  return new Set([
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed"
  ]).has(type);
}
export function validateStripeIdentity(input){
  if(!input||typeof input!=="object"||Array.isArray(input))return false;
  // IDs must never be accepted from browser body, URL or profile fields.
  return typeof input.stripeCustomerId==="string"&&/^cus_[A-Za-z0-9]+$/.test(input.stripeCustomerId)
    &&typeof input.stripeSubscriptionId==="string"&&/^sub_[A-Za-z0-9]+$/.test(input.stripeSubscriptionId)
    &&typeof input.memberUserId==="string"&&input.memberUserId.length>=12&&input.memberUserId.length<=128;
}
