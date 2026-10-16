import {SUPPORTER_PLAN,allowedPlan} from './entitlements.mjs';

const ID=/^[A-Za-z0-9_]{8,128}$/;
const LIMIT=300000;
export const stripeId=(kind,value)=>typeof value==='string'&&value.startsWith(kind+'_')&&ID.test(value);
export function supporterConfig(env){
  // Hard test-mode lock. Live money requires a separate, audited release.
  const key=env?.CANONICAL_STRIPE_SECRET_KEY;
  const webhook=env?.CANONICAL_STRIPE_WEBHOOK_SECRET;
  const month=env?.CANONICAL_STRIPE_MONTHLY_PRICE_ID;
  const year=env?.CANONICAL_STRIPE_ANNUAL_PRICE_ID;
  return {
    enabled:env?.CANONICAL_SUPPORTER_COMMERCE_ENABLED==='true' &&
      typeof key==='string'&&/^sk_test_[A-Za-z0-9]{12,}$/.test(key) &&
      typeof webhook==='string'&&/^whsec_[A-Za-z0-9]{12,}$/.test(webhook) &&
      stripeId('price',month)&&stripeId('price',year)&&month!==year,
    prices:{month,year}
  };
}
export function stripePlan(env,interval){
  const plan=allowedPlan(interval);
  const state=supporterConfig(env);
  if(!plan||!state.enabled)return null;
  return {...plan,priceId:state.prices[interval]};
}
const enc=new TextEncoder();
function safeHex(buffer){return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');}
function equalHex(a,b){
  if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)return false;
  let diff=0;
  for(let i=0;i<64;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
export async function verifyStripeWebhook(raw,signature,secret,now=Date.now()){
  if(typeof raw!=='string'||typeof signature!=='string'||!/^whsec_[A-Za-z0-9]{12,}$/.test(secret||''))return false;
  const parts=signature.split(',');
  if(parts.length<2||parts.length>16)return false;
  const time=parts.find(v=>v.startsWith('t='))?.slice(2);
  const hashes=parts.filter(v=>v.startsWith('v1=')).map(v=>v.slice(3).toLowerCase());
  if(!/^\d{10}$/.test(time||'')||!hashes.length||hashes.length>8)return false;
  const ms=Number(time)*1000;
  if(!Number.isSafeInteger(ms)||Math.abs(now-ms)>LIMIT)return false;
  const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const expected=safeHex(await crypto.subtle.sign('HMAC',key,enc.encode(time+'.'+raw)));
  return hashes.some(v=>/^[a-f0-9]{64}$/.test(v)&&equalHex(expected,v));
}
export async function stripeRequest(env,path,{method='GET',fields=null,idempotencyKey=null}={},http=fetch){
  const config=supporterConfig(env);
  if(!config.enabled)throw Error('Commerce unavailable');
  if(!/^\/v1\/(?:checkout\/sessions(?:\/cs_test_[A-Za-z0-9]+)?|billing_portal\/sessions|subscriptions\/sub_[A-Za-z0-9]+)$/.test(path))
    throw Error('Invalid Stripe operation');
  if(method!=='GET'&&method!=='POST')throw Error('Invalid Stripe method');
  if(method==='POST'&&(!idempotencyKey||!/^anevum-v032-[A-Za-z0-9_-]{10,130}$/.test(idempotencyKey)))
    throw Error('Missing Stripe idempotency');
  const headers={Authorization:'Bearer '+env.CANONICAL_STRIPE_SECRET_KEY,Accept:'application/json','Stripe-Version':'2025-03-31.basil'};
  if(method==='POST'){
    headers['Content-Type']='application/x-www-form-urlencoded';
    headers['Idempotency-Key']=idempotencyKey;
  }
  const response=await http('https://api.stripe.com'+path,{
    method,headers,body:method==='POST'?new URLSearchParams(fields||{}).toString():undefined,
    redirect:'error',credentials:'omit',signal:AbortSignal.timeout(8000)
  });
  if(!response.ok)throw Error('Stripe operation unavailable');
  const body=await response.text();
  if(body.length>65536)throw Error('Stripe response too large');
  const result=JSON.parse(body);
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Invalid Stripe response');
  return result;
}
export function stripeCheckoutSession(session){
  if(!stripeId('cs',session?.id)||!session.id.startsWith('cs_test_'))return null;
  try{
    const u=new URL(session.url);
    if(u.protocol!=='https:'||u.hostname!=='checkout.stripe.com'||u.username||u.password)return null;
  }catch{return null;}
  return {id:session.id,url:session.url};
}
export function stripePortalSession(session){
  try{
    const u=new URL(session?.url);
    if(u.protocol!=='https:'||u.hostname!=='billing.stripe.com'||u.username||u.password)return null;
    return {url:session.url};
  }catch{return null;}
}
export function subscriptionProjection(sub,env,expectedCustomer=null){
  const config=supporterConfig(env);
  if(!config.enabled||!stripeId('sub',sub?.id)||!stripeId('cus',sub?.customer)||
     (expectedCustomer!==null&&sub.customer!==expectedCustomer))return null;
  if(!Array.isArray(sub?.items?.data)||sub.items.data.length!==1)return null;
  const item=sub.items.data[0],price=item?.price;
  const interval=price?.id===config.prices.month?'month':price?.id===config.prices.year?'year':null;
  const plan=allowedPlan(interval);
  if(!plan||price?.currency!=='usd'||price?.recurring?.interval!==interval||
    price?.unit_amount!==plan.amountCents||item?.quantity!==1)return null;
  const end=item.current_period_end;
  if(!Number.isSafeInteger(end)||end<=0||end*1000>Number.MAX_SAFE_INTEGER)return null;
  const statuses=['active','trialing','incomplete','incomplete_expired','past_due','canceled','unpaid','paused'];
  if(!statuses.includes(sub.status))return null;
  return {
    subscriptionId:sub.id,customerId:sub.customer,priceId:price.id,interval,
    status:sub.status,currentPeriodEnd:end*1000,cancelAtPeriodEnd:sub.cancel_at_period_end===true
  };
}
