/**
 * ANEVUM supporter billing candidate — no live-money path is permitted.
 * Every mutation is disabled until an explicit staging flag, test Stripe key,
 * reviewed prices, signed webhook secret and additive schema all exist.
 * The canonical worker must authenticate the member and enforce same-origin
 * CSRF before invoking supporterMember().
 */
import {supporterState,acceptStripeEventType} from '../supporter/entitlements.mjs';
import {
  stripeId,supporterConfig,stripePlan,stripeRequest,verifyStripeWebhook,
  stripeCheckoutSession,stripePortalSession,subscriptionProjection
} from '../supporter/stripe.mjs';
import {boundedText} from './request-body.mjs';

const H={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8',
  'x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow, noarchive'};
const out=(data,status=200)=>Response.json(data,{status,headers:H});
const err=(status,message)=>out({error:message},status);
const PREFIX='/api/v1/member/supporter';
const rows=async(db,sql,...params)=>{
  const r=await db.prepare(sql).bind(...params).all();
  if(r.success===false||!Array.isArray(r.results))throw Error('Member storage unavailable');
  return r.results;
};
const row=async(db,sql,...params)=>db.prepare(sql).bind(...params).first();
const apply=async(db,sql,...params)=>{
  const r=await db.prepare(sql).bind(...params).run();
  if(r.success===false)throw Error('Member storage unavailable');
  return r;
};
export async function supporterSchemaReady(db){
  if(!db?.prepare)return false;
  try{
    const found=await rows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('supporter_checkout_intents','supporter_customers','supporter_subscriptions','supporter_webhook_events')");
    return found.length===4;
  }catch{return false;}
}
const dataReady=async env=>supporterConfig(env).enabled&&await supporterSchemaReady(env.MEMBER_DB);
const verified=user=>typeof user?.id==='string'&&user.id.length>0&&user.emailVerified===true;
const activeRow=(record,now)=>record?supporterState({
  status:record.status,currentPeriodEnd:record.current_period_end_ms
},now):supporterState(null,now);

export async function supporterMember(request,env,user,{http=fetch,now=Date.now()}={}){
  const path=new URL(request.url).pathname;
  if(!verified(user))return err(403,'Verified member email required');
  if(new URL(request.url).search)return err(400,'Unexpected query');
  if(path===PREFIX&&request.method==='GET'){
    const available=await dataReady(env);
    if(!available)return out({available:false,supporter:false,status:'not-launched',plans:{month:500,year:3600}});
    try{
      const records=await rows(env.MEMBER_DB,
        'SELECT status,current_period_end_ms,cancel_at_period_end,synced_at_ms,billing_interval FROM supporter_subscriptions WHERE member_user_id=? ORDER BY synced_at_ms DESC LIMIT 12',user.id);
      const valid=records.find(value=>now-Number(value.synced_at_ms)<=259200000 && activeRow(value,now).supporter);
      return out({available:true,supporter:Boolean(valid),status:valid?'active':records.length?'inactive':'none',
        until:valid?.current_period_end_ms??null,cancelAtPeriodEnd:valid?.cancel_at_period_end===1,
        interval:valid?.billing_interval??null,plans:{month:500,year:3600}});
    }catch{return err(503,'Supporter status unavailable');}
  }
  if(path!==PREFIX+'/checkout'&&path!==PREFIX+'/portal')return err(404,'Not found');
  if(request.method!=='POST')return err(405,'Method not allowed');
  if(!await dataReady(env))return err(404,'Supporter enrollment is not open');
  try{
    if(!await row(env.MEMBER_DB,'SELECT user_id FROM member_creator_profiles WHERE user_id=?',user.id))
      return err(409,'Create your profile before supporting.');
    if(path===PREFIX+'/checkout'){
      if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return err(400,'Invalid request');
      const raw=await boundedText(request,128);
      let input;
      try{input=JSON.parse(raw);}catch{return err(400,'Invalid request');}
      if(!input||typeof input!=='object'||Array.isArray(input)||
         Object.keys(input).length!==1||!['month','year'].includes(input.interval))
        return err(400,'Invalid supporter interval');
      const plan=stripePlan(env,input.interval);
      if(!plan)return err(503,'Supporter pricing unavailable');
      const existing=await rows(env.MEMBER_DB,
        'SELECT status,current_period_end_ms,synced_at_ms FROM supporter_subscriptions WHERE member_user_id=? ORDER BY synced_at_ms DESC LIMIT 12',user.id);
      if(existing.some(record=>now-Number(record.synced_at_ms)<=259200000&&activeRow(record,now).supporter))
        return err(409,'You are already a supporter. Manage your membership instead.');
      const clock=Math.floor(now/3600000);
      const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.id+'|'+plan.interval+'|'+clock)));
      const key='anevum-v032-checkout-'+Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');
      const session=await stripeRequest(env,'/v1/checkout/sessions',{
        method:'POST',idempotencyKey:key,fields:{
          mode:'subscription','line_items[0][price]':plan.priceId,'line_items[0][quantity]':'1',
          client_reference_id:user.id,
          customer_email:user.email,
          'metadata[anevum_member_id]':user.id,
          'subscription_data[metadata][anevum_member_id]':user.id,
          success_url:'https://a.anevum.com/support?checkout=returned',
          cancel_url:'https://a.anevum.com/support?checkout=cancelled',
          billing_address_collection:'auto'
        }
      },http);
      const valid=stripeCheckoutSession(session);
      if(!valid)return err(503,'Checkout response could not be verified');
      await apply(env.MEMBER_DB,
        'INSERT OR IGNORE INTO supporter_checkout_intents(stripe_checkout_session_id,member_user_id,created_at_ms) VALUES(?,?,?)',
        valid.id,user.id,now);
      const stored=await row(env.MEMBER_DB,
        'SELECT member_user_id FROM supporter_checkout_intents WHERE stripe_checkout_session_id=?',valid.id);
      if(stored?.member_user_id!==user.id)return err(409,'Checkout ownership conflict');
      return out({url:valid.url});
    }
    if(request.headers.get('content-length')&&!/^(?:0)$/.test(request.headers.get('content-length')||''))
      return err(400,'Portal request must be empty');
    const owner=await row(env.MEMBER_DB,
      'SELECT stripe_customer_id FROM supporter_customers WHERE member_user_id=?',user.id);
    if(!owner?.stripe_customer_id||!stripeId('cus',owner.stripe_customer_id))
      return err(409,'No supporter billing account exists.');
    const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.id+'|portal|'+Math.floor(now/60000))));
    const key='anevum-v032-portal-'+Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');
    const portal=await stripeRequest(env,'/v1/billing_portal/sessions',{
      method:'POST',idempotencyKey:key,fields:{
        customer:owner.stripe_customer_id,
        return_url:'https://a.anevum.com/support'
      }
    },http);
    const checked=stripePortalSession(portal);
    return checked?out(checked):err(503,'Billing portal unavailable');
  }catch{
    return err(503,'Supporter service unavailable');
  }
}

async function syncSubscription(env,memberId,expectedCustomer,subscriptionId,now,http){
  const db=env.MEMBER_DB;
  const value=await stripeRequest(env,'/v1/subscriptions/'+subscriptionId,{},http);
  const projection=subscriptionProjection(value,env,expectedCustomer);
  if(!projection)throw Error('Subscription identity or price mismatch');
  // Enforce ownership with database uniqueness, not webhook metadata.
  await apply(db,'INSERT OR IGNORE INTO supporter_customers(member_user_id,stripe_customer_id,created_at_ms) VALUES(?,?,?)',
    memberId,expectedCustomer,now);
  await apply(db,
    'INSERT INTO supporter_subscriptions(stripe_subscription_id,member_user_id,stripe_customer_id,stripe_price_id,billing_interval,status,current_period_end_ms,cancel_at_period_end,synced_at_ms) '+
    'SELECT ?,member_user_id,stripe_customer_id,?,?,?,?,?,? FROM supporter_customers WHERE member_user_id=? AND stripe_customer_id=? '+
    'ON CONFLICT(stripe_subscription_id) DO UPDATE SET stripe_price_id=excluded.stripe_price_id,billing_interval=excluded.billing_interval,status=excluded.status,'+
    'current_period_end_ms=excluded.current_period_end_ms,cancel_at_period_end=excluded.cancel_at_period_end,synced_at_ms=excluded.synced_at_ms '+
    'WHERE supporter_subscriptions.member_user_id=excluded.member_user_id AND supporter_subscriptions.stripe_customer_id=excluded.stripe_customer_id',
    projection.subscriptionId,projection.priceId,projection.interval,projection.status,
    projection.currentPeriodEnd,projection.cancelAtPeriodEnd?1:0,now,memberId,expectedCustomer);
  const record=await row(db,
    'SELECT member_user_id,stripe_customer_id FROM supporter_subscriptions WHERE stripe_subscription_id=?',
    subscriptionId);
  if(record?.member_user_id!==memberId||record.stripe_customer_id!==expectedCustomer)
    throw Error('Subscription is not owned by that member');
}

export async function supporterWebhook(request,env,{http=fetch,now=Date.now()}={}){
  if(request.method!=='POST')return err(405,'Method not allowed');
  if(!await dataReady(env))return err(404,'Not found');
  const raw=await boundedText(request,100000);
  if(raw===null)return err(413,'Invalid webhook payload');
  const signed=await verifyStripeWebhook(raw,request.headers.get('stripe-signature'),
    env.CANONICAL_STRIPE_WEBHOOK_SECRET,now);
  if(!signed)return err(400,'Webhook signature invalid');
  let event;
  try{event=JSON.parse(raw);}catch{return err(400,'Invalid webhook JSON');}
  if(!stripeId('evt',event?.id)||typeof event.type!=='string'||
    event.livemode!==false||!Number.isSafeInteger(event.created)||!event?.data?.object)
    return err(400,'Invalid Stripe test event');
  if(!acceptStripeEventType(event.type))return out({received:true});
  const db=env.MEMBER_DB;
  try{
    if(await row(db,'SELECT stripe_event_id FROM supporter_webhook_events WHERE stripe_event_id=?',event.id))
      return out({received:true});
    const object=event.data.object;
    let result='ignored';
    if(event.type==='checkout.session.completed' && stripeId('cs',object.id)&&object.id.startsWith('cs_test_')){
      const intent=await row(db,
        'SELECT member_user_id FROM supporter_checkout_intents WHERE stripe_checkout_session_id=?',object.id);
      if(intent){
        const session=await stripeRequest(env,'/v1/checkout/sessions/'+object.id,{},http);
        if(session.id!==object.id||session.mode!=='subscription'||
          session.client_reference_id!==intent.member_user_id)throw Error('Checkout session mismatch');
        if(session.payment_status==='paid'&&stripeId('cus',session.customer)&&stripeId('sub',session.subscription)){
          await syncSubscription(env,intent.member_user_id,session.customer,session.subscription,now,http);
          await apply(db,'UPDATE supporter_checkout_intents SET completed_at_ms=?,stripe_customer_id=?,stripe_subscription_id=? WHERE stripe_checkout_session_id=? AND member_user_id=?',
            now,session.customer,session.subscription,object.id,intent.member_user_id);
          result='synced';
        }
      }
    } else {
      let subscriptionId=null;
      if(event.type.startsWith('customer.subscription.'))subscriptionId=object.id;
      else if(event.type.startsWith('invoice.'))
        subscriptionId=typeof object.subscription==='string'?object.subscription:
          object.parent?.subscription_details?.subscription;
      if(stripeId('sub',subscriptionId)){
        const existing=await row(db,
          'SELECT member_user_id,stripe_customer_id FROM supporter_subscriptions WHERE stripe_subscription_id=?',subscriptionId);
        if(existing){
          await syncSubscription(env,existing.member_user_id,existing.stripe_customer_id,subscriptionId,now,http);
          result='synced';
        }
      }
    }
    await apply(db,
      'INSERT OR IGNORE INTO supporter_webhook_events(stripe_event_id,event_type,stripe_created_sec,processed_at_ms,result) VALUES(?,?,?,?,?)',
      event.id,event.type,event.created,now,result);
    return out({received:true});
  }catch{
    // Stripe will retry. Never acknowledge a failed entitlement reconciliation.
    return err(503,'Webhook reconciliation unavailable');
  }
}
