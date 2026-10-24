/**
 * ANEVUM's own supporter transaction and entitlement ledger.
 * Settlement adapter: Square SANDBOX ONLY. Inactive by default.
 * Never infer a payment, reward, or bank deposit from the browser redirect.
 */
import {SUPPORT_API,SUPPORT_HOOK,SUPPORT_OFFERS,sandboxReady,variationId,
  createSandboxCheckout,verifySquareWebhook,verifiedSquarePayment,squareCall} from '../support-v2/square.mjs';

const H={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8',
 'x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow, noarchive'};
const reply=(data,status=200)=>Response.json(data,{status,headers:H});
const error=(status,detail)=>reply({error:detail},status);
const tables=['support_v2_checkout_guards','support_v2_intents','support_v2_payments',
 'support_v2_memberships','support_v2_payment_holds','support_v2_webhook_events'];
const token=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{6,192}$/.test(x);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&
 Number.isFinite(Date.parse(x+'T00:00:00Z'));
const verifiedUser=u=>typeof u?.id==='string'&&u.id.length>0&&
 u.emailVerified===true&&typeof u.email==='string'&&u.email.length<=254;
const dbRows=async(db,sql,...args)=>{
 const value=await db.prepare(sql).bind(...args).all();
 if(value?.success===false||!Array.isArray(value?.results))throw Error('Database unavailable');
 return value.results;
};
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const execute=async(db,sql,...args)=>{
 const r=await db.prepare(sql).bind(...args).run();
 if(r?.success===false)throw Error('Database unavailable');
 return r;
};
export async function supportV2SchemaReady(db){
 if(!db?.prepare)return false;
 try{
  const found=await dbRows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'support_v2_%'");
  const names=new Set(found.map(x=>x.name));
  return tables.every(x=>names.has(x));
 }catch{return false}
}
const enabled=async env=>sandboxReady(env)&&await supportV2SchemaReady(env?.MEMBER_DB);
const nowDate=now=>new Date(now).toISOString().slice(0,10);
const activeMembership=(s,now)=>Boolean(s&&s.provider_status==='ACTIVE'&&
 date(s.paid_until_date)&&s.paid_until_date>=nowDate(now)&&
 s.verified_at_ms<=now&&now-s.verified_at_ms<=3*86400000);
const sameSubscription=(s,env,payment,intent,now)=>{
 if(!s||!token(s.id)||s.location_id!==env.ANEVUM_SQUARE_SANDBOX_LOCATION_ID||
    s.customer_id!==payment.customer_id||s.plan_variation_id!==variationId(env,intent.interval)||
    s.status!=='ACTIVE'||!date(s.paid_until_date)||s.paid_until_date<nowDate(now))return false;
 const created=Date.parse(s.created_at||'');
 return Number.isFinite(created)&&created>=intent.created_at_ms-120000 &&
   created<=now+120000;
};
async function attachSubscription(env,record,s,now){
 const db=env.MEMBER_DB;
 if(!sameSubscription(s,env,record,record,now))return false;
 const claimed=await first(db,'SELECT member_user_id FROM support_v2_memberships WHERE square_subscription_id=? OR square_customer_id=?',
   s.id,s.customer_id);
 if(claimed&&claimed.member_user_id!==record.member_user_id)return false;
 const existing=await first(db,'SELECT square_subscription_id FROM support_v2_memberships WHERE member_user_id=?',record.member_user_id);
 if(existing&&existing.square_subscription_id!==s.id)return false;
 const hold=await first(db,'SELECT payment_id FROM support_v2_payment_holds WHERE payment_id=?',record.payment_id);
 if(hold)return false;
 await execute(db,
  'INSERT INTO support_v2_memberships(member_user_id,square_subscription_id,square_customer_id,intent_id,interval,provider_status,paid_until_date,canceled_date,verified_at_ms) '+
  'VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(member_user_id) DO UPDATE SET provider_status=excluded.provider_status,paid_until_date=excluded.paid_until_date,canceled_date=excluded.canceled_date,verified_at_ms=excluded.verified_at_ms '+
  'WHERE support_v2_memberships.square_subscription_id=excluded.square_subscription_id AND support_v2_memberships.intent_id=excluded.intent_id',
  record.member_user_id,s.id,s.customer_id,record.id,record.interval,s.status,s.paid_until_date,s.canceled_date??null,now);
 return true;
}
async function findSubscription(env,record,now,fetcher){
 if(!token(record.customer_id))return false;
 const search=await squareCall(env,'/v2/subscriptions/search',{method:'POST',fetcher,
  body:{query:{filter:{location_ids:[env.ANEVUM_SQUARE_SANDBOX_LOCATION_ID],customer_ids:[record.customer_id]}}}});
 // A truncated search or multiple matching subscriptions is an ambiguity, not a grant.
 if(search.cursor)return false;
 const subs=Array.isArray(search.subscriptions)?search.subscriptions:[];
 const matches=subs.filter(s=>sameSubscription(s,env,record,record,now));
 if(matches.length!==1)return false;
 return attachSubscription(env,record,matches[0],now);
}
async function matchSubscriptionById(env,subscriptionId,now,fetcher){
 if(!token(subscriptionId))return false;
 const response=await squareCall(env,'/v2/subscriptions/'+encodeURIComponent(subscriptionId),{fetcher});
 const s=response.subscription;
 if(!s||s.id!==subscriptionId||!token(s.customer_id)||
    s.location_id!==env.ANEVUM_SQUARE_SANDBOX_LOCATION_ID)return false;
 const db=env.MEMBER_DB;
 const linked=await first(db,
   'SELECT member_user_id,square_customer_id,interval,intent_id FROM support_v2_memberships WHERE square_subscription_id=?',s.id);
 if(linked){
  if(linked.square_customer_id!==s.customer_id||s.plan_variation_id!==variationId(env,linked.interval))return false;
  await execute(db,
    'UPDATE support_v2_memberships SET provider_status=?,paid_until_date=?,canceled_date=?,verified_at_ms=? WHERE square_subscription_id=? AND member_user_id=?',
    s.status,date(s.paid_until_date)?s.paid_until_date:'1970-01-01',s.canceled_date??null,now,s.id,linked.member_user_id);
  return true;
 }
 const possible=await dbRows(db,
 'SELECT i.id,i.member_user_id,i.interval,i.created_at_ms,p.payment_id,p.customer_id '+
 'FROM support_v2_payments p JOIN support_v2_intents i ON i.id=p.intent_id '+
 'WHERE p.customer_id=? ORDER BY i.created_at_ms DESC LIMIT 3',s.customer_id);
 const matched=possible.filter(p=>sameSubscription(s,env,p,p,now));
 if(matched.length!==1)return false;
 return attachSubscription(env,matched[0],s,now);
}
async function paymentEvent(env,paymentId,now,fetcher){
 const p=await verifiedSquarePayment(env,paymentId,fetcher);
 const db=env.MEMBER_DB;
 const intent=await first(db,
  'SELECT id,member_user_id,interval,amount_cents,created_at_ms,state FROM support_v2_intents WHERE square_order_id=?',
  p.order_id);
 if(!intent)return false;
 if(p.status!=='COMPLETED'||p.amount_money?.currency!=='USD'||
    p.amount_money?.amount!==intent.amount_cents||
    p.total_money?.amount!==intent.amount_cents||
    p.total_money?.currency!=='USD'||!token(p.customer_id)||
    p.note!=='ANEVUM-SUPPORT-V2:'+intent.id)return false;
 const old=await first(db,'SELECT intent_id,member_user_id FROM support_v2_payments WHERE payment_id=?',p.id);
 if(old&&(old.intent_id!==intent.id||old.member_user_id!==intent.member_user_id))return false;
 await execute(db,
  'INSERT OR IGNORE INTO support_v2_payments(payment_id,intent_id,member_user_id,customer_id,amount_cents,currency,provider_status,verified_at_ms) VALUES(?,?,?,?,?,?,?,?)',
  p.id,intent.id,intent.member_user_id,p.customer_id,intent.amount_cents,'USD','COMPLETED',now);
 await execute(db,"UPDATE support_v2_intents SET state='paid',updated_at_ms=? WHERE id=? AND member_user_id=?",
  now,intent.id,intent.member_user_id);
 if(Number(p.refunded_money?.amount)>0){
  await execute(db,
   "INSERT OR IGNORE INTO support_v2_payment_holds(payment_id,reason,event_id,created_at_ms) VALUES(?,'refund',?,?)",
   p.id,'provider-reconcile',now);
  return true;
 }
 try{await findSubscription(env,{...intent,payment_id:p.id,customer_id:p.customer_id},now,fetcher)}
 catch{/* Verified payment persists; the subscription remains ungranted for safe later recovery. */}
 return true;
}
async function refundEvent(env,refundId,eventId,now,fetcher){
 if(!token(refundId))return false;
 const result=await squareCall(env,'/v2/refunds/'+encodeURIComponent(refundId),{fetcher});
 const r=result.refund;
 if(!r||r.id!==refundId||r.location_id!==env.ANEVUM_SQUARE_SANDBOX_LOCATION_ID||
    !token(r.payment_id)||!['PENDING','COMPLETED','APPROVED'].includes(r.status))return false;
 await execute(env.MEMBER_DB,
   "INSERT OR IGNORE INTO support_v2_payment_holds(payment_id,reason,event_id,created_at_ms) VALUES(?,'refund',?,?)",
   r.payment_id,eventId,now);
 return true;
}
async function disputeEvent(env,disputeId,eventId,now,fetcher){
 if(!token(disputeId))return false;
 const result=await squareCall(env,'/v2/disputes/'+encodeURIComponent(disputeId),{fetcher});
 const d=result.dispute;
 if(!d||d.id!==disputeId||!token(d.disputed_payment?.payment_id))return false;
 await execute(env.MEMBER_DB,
   "INSERT OR IGNORE INTO support_v2_payment_holds(payment_id,reason,event_id,created_at_ms) VALUES(?,'dispute',?,?)",
   d.disputed_payment.payment_id,eventId,now);
 return true;
}
async function status(env,user,now){
 if(!await enabled(env))return reply({available:false,mode:'off',subscriber:false,
  status:'paused',plans:{month:500,year:3600},sandbox:true});
 try{
  const db=env.MEMBER_DB;
  const s=await first(db,'SELECT * FROM support_v2_memberships WHERE member_user_id=?',user.id);
  const held=await first(db,
    'SELECT h.reason FROM support_v2_payment_holds h JOIN support_v2_payments p ON p.payment_id=h.payment_id WHERE p.member_user_id=? LIMIT 1',user.id);
  const pending=await first(db,
    "SELECT i.state FROM support_v2_intents i WHERE i.member_user_id=? AND i.created_at_ms>? ORDER BY i.created_at_ms DESC LIMIT 1",
    user.id,now-7200000);
  const supporter=!held&&activeMembership(s,now);
  return reply({available:true,mode:'sandbox',sandbox:true,subscriber:supporter,
    status:held?'billing-review':supporter?(s.canceled_date?'canceling':'active'):
      s?'unverified':pending?.state==='paid'?'payment-pending-verification':
      pending?'checkout-pending':'none',
    cancelAtPeriodEnd:Boolean(s?.canceled_date),paidUntil:supporter?s.paid_until_date:null,
    plans:{month:500,year:3600}});
 }catch{return error(503,'Supporter status unavailable')}
}
async function checkout(request,env,user,now,fetcher){
 if(!await enabled(env))return error(404,'Supporter checkout is not enabled');
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return error(400,'Invalid request');
 const raw=await request.text();
 if(raw.length>64)return error(413,'Request too large');
 let data;
 try{data=JSON.parse(raw)}catch{return error(400,'Invalid request')}
 if(!data||typeof data!=='object'||Array.isArray(data)||
    Object.keys(data).join(',')!=='interval'||!SUPPORT_OFFERS[data.interval])
   return error(400,'Invalid supporter plan');
 const db=env.MEMBER_DB,offer=SUPPORT_OFFERS[data.interval];
 try{
  const existing=await first(db,'SELECT member_user_id FROM support_v2_memberships WHERE member_user_id=?',user.id);
  if(existing)return error(409,'A supporter membership already exists; manage it before buying another');
  // A pending account closure blocks financial enrollment.
  const closure=await first(db,
    'SELECT member_user_id FROM member_account_closure_guards WHERE member_user_id=? AND expires_at_ms>?',
    user.id,now);
  if(closure)return error(409,'Account closure is in progress');
  const intentId=crypto.randomUUID();
  const claimed=await dbRows(db,
    'INSERT INTO support_v2_checkout_guards(member_user_id,intent_id,expires_at_ms,created_at_ms) VALUES(?,?,?,?) '+
    'ON CONFLICT(member_user_id) DO UPDATE SET intent_id=excluded.intent_id,expires_at_ms=excluded.expires_at_ms,created_at_ms=excluded.created_at_ms '+
    'WHERE support_v2_checkout_guards.expires_at_ms<? RETURNING intent_id',
    user.id,intentId,now+7200000,now,now);
  if(claimed.length!==1||claimed[0].intent_id!==intentId)
    return error(409,'A checkout is already in progress. Do not open another payment session');
  await execute(db,
    'INSERT INTO support_v2_intents(id,member_user_id,interval,amount_cents,currency,provider,state,created_at_ms,updated_at_ms) '+
    "VALUES(?,?,?,?,?,'square_sandbox','creating',?,?)",
    intentId,user.id,offer.interval,offer.amount,'USD',now,now);
  // Never release a potentially ambiguous creation lease before its expiry.
  const value=await createSandboxCheckout(env,{interval:offer.interval,intentId,email:user.email,fetcher});
  await execute(db,
    "UPDATE support_v2_intents SET state='ready',square_order_id=?,square_payment_link_id=?,checkout_url=?,updated_at_ms=? WHERE id=? AND member_user_id=? AND state='creating'",
    value.orderId,value.id,value.url,now,intentId,user.id);
  return reply({url:value.url,mode:'sandbox',amount:offer.amount,currency:'USD'});
 }catch{return error(503,'Sandbox checkout unavailable; no new payment link was confirmed')}
}
async function cancel(env,user,now,fetcher){
 if(!await enabled(env))return error(404,'Supporter management unavailable');
 try{
  const db=env.MEMBER_DB;
  const member=await first(db,'SELECT * FROM support_v2_memberships WHERE member_user_id=?',user.id);
  if(!member||!token(member.square_subscription_id))return error(409,'No verified subscription to cancel');
  const current=await squareCall(env,'/v2/subscriptions/'+encodeURIComponent(member.square_subscription_id),{fetcher});
  const s=current.subscription;
  if(!s||s.id!==member.square_subscription_id||s.customer_id!==member.square_customer_id||
    s.location_id!==env.ANEVUM_SQUARE_SANDBOX_LOCATION_ID||
    s.plan_variation_id!==variationId(env,member.interval))return error(409,'Subscription identity mismatch');
  if(s.status==='CANCELED'||s.canceled_date)
    return reply({status:'canceling',paidUntil:date(s.paid_until_date)?s.paid_until_date:null});
  const end=await squareCall(env,'/v2/subscriptions/'+encodeURIComponent(s.id)+'/cancel',{method:'POST',body:{},fetcher});
  const result=end.subscription;
  if(!result||result.id!==s.id||result.customer_id!==s.customer_id||!result.canceled_date)
    return error(503,'Cancellation requires verification');
  await execute(db,
   'UPDATE support_v2_memberships SET canceled_date=?,provider_status=?,paid_until_date=?,verified_at_ms=? WHERE member_user_id=? AND square_subscription_id=?',
   result.canceled_date,result.status,date(result.paid_until_date)?result.paid_until_date:'1970-01-01',now,user.id,s.id);
  return reply({status:'canceling',paidUntil:date(result.paid_until_date)?result.paid_until_date:null});
 }catch{return error(503,'Unable to verify cancellation. Review Square Sandbox before retrying')}
}
export async function supportV2Member(request,env,user,{fetcher=fetch,now=Date.now()}={}){
 if(!verifiedUser(user))return error(403,'Verified member sign-in required');
 const url=new URL(request.url);
 if(url.search)return error(400,'Unexpected query parameters');
 if(url.pathname===SUPPORT_API&&request.method==='GET')return status(env,user,now);
 if(url.pathname===SUPPORT_API+'/checkout'&&request.method==='POST')return checkout(request,env,user,now,fetcher);
 if(url.pathname===SUPPORT_API+'/cancel'&&request.method==='POST'){
  if(request.headers.get('content-length')&&!/^(?:0)$/.test(request.headers.get('content-length')))return error(400,'Empty request required');
  return cancel(env,user,now,fetcher);
 }
 return error(404,'Unknown supporter route');
}
export async function supportV2Webhook(request,env,{fetcher=fetch,now=Date.now()}={}){
 if(request.method!=='POST'||!await enabled(env))return error(404,'Not found');
 let raw;
 try{raw=await request.text()}catch{return error(400,'Invalid webhook body')}
 if(raw.length===0||raw.length>100000)return error(413,'Invalid webhook body');
 if(!await verifySquareWebhook(raw,request.headers.get('x-square-hmacsha256-signature'),env))
  return error(403,'Invalid webhook signature');
 let event;
 try{event=JSON.parse(raw)}catch{return error(400,'Invalid event')}
 if(!token(event?.event_id)||typeof event?.type!=='string'||event.type.length>64)
   return error(400,'Invalid event identifiers');
 const types=new Set(['payment.created','payment.updated','subscription.created',
  'subscription.updated','refund.created','refund.updated','dispute.created','dispute.state.updated']);
 if(!types.has(event.type))return reply({ok:true,ignored:true});
 const db=env.MEMBER_DB;
 try{
  const seen=await first(db,'SELECT event_id FROM support_v2_webhook_events WHERE event_id=?',event.event_id);
  if(seen)return reply({ok:true,duplicate:true});
  const item=event?.data?.object;
  let handled=false;
  if(event.type.startsWith('payment.'))handled=await paymentEvent(env,item?.payment?.id??item?.id,now,fetcher);
  else if(event.type.startsWith('subscription.'))handled=await matchSubscriptionById(env,item?.subscription?.id??item?.id,now,fetcher);
  else if(event.type.startsWith('refund.'))handled=await refundEvent(env,item?.refund?.id??item?.id,event.event_id,now,fetcher);
  else if(event.type.startsWith('dispute.'))handled=await disputeEvent(env,item?.dispute?.id??item?.id,event.event_id,now,fetcher);
  await execute(db,"INSERT OR IGNORE INTO support_v2_webhook_events(event_id,event_type,processed_at_ms,outcome) VALUES(?,?,?,?)",
    event.event_id,event.type,now,handled?'recorded':'ignored');
  return reply({ok:true});
 }catch{return error(503,'Webhook reconciliation unavailable')}
}
