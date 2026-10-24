/**
 * ANEVUM Pay — replaceable settlement gateway, Square sandbox adapter.
 * Card numbers, bank details, and provider bearer tokens NEVER enter browser
 * code or ANEVUM's database. This module cannot address Square production.
 */
import {canonicalRequestOrigin} from '../canonical-auth/policy.mjs';

export const SUPPORT_OFFERS=Object.freeze({
  month:Object.freeze({interval:'month',amount:500,cadence:'MONTHLY',label:'Founding Supporter / monthly'}),
  year:Object.freeze({interval:'year',amount:3600,cadence:'ANNUAL',label:'Founding Supporter / annual'})
});
export const SUPPORT_API='/api/v1/member/support-v2';
export const SUPPORT_HOOK=SUPPORT_API+'/webhook';
const SQUARE_API='https://connect.squareupsandbox.com';
const VERSION='2026-09-16';
const id=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{6,192}$/.test(x);
const secret=x=>typeof x==='string'&&x.length>=16;

export function sandboxReady(env){
  return env?.ANEVUM_SUPPORT_V2_ENABLED==='true' &&
    env?.ANEVUM_SUPPORT_V2_MODE==='sandbox' &&
    secret(env?.ANEVUM_SQUARE_SANDBOX_ACCESS_TOKEN) &&
    secret(env?.ANEVUM_SQUARE_SANDBOX_WEBHOOK_KEY) &&
    id(env?.ANEVUM_SQUARE_SANDBOX_LOCATION_ID) &&
    id(env?.ANEVUM_SQUARE_SANDBOX_MONTH_VARIATION_ID) &&
    id(env?.ANEVUM_SQUARE_SANDBOX_YEAR_VARIATION_ID) &&
    env.ANEVUM_SQUARE_SANDBOX_MONTH_VARIATION_ID!==env.ANEVUM_SQUARE_SANDBOX_YEAR_VARIATION_ID &&
    env.ANEVUM_SQUARE_SANDBOX_WEBHOOK_URL===canonicalRequestOrigin(env)+SUPPORT_HOOK;
}
export function variationId(env,interval){
  return interval==='month'?env.ANEVUM_SQUARE_SANDBOX_MONTH_VARIATION_ID:
    interval==='year'?env.ANEVUM_SQUARE_SANDBOX_YEAR_VARIATION_ID:null;
}
export function validVariation(object,variation,offer){
  if(!object||object.id!==variation||object.type!=='SUBSCRIPTION_PLAN_VARIATION'||object.is_deleted===true)return false;
  const phases=object.subscription_plan_variation_data?.phases;
  // Only a single, indefinitely recurring, static-priced phase is accepted.
  if(!Array.isArray(phases)||phases.length!==1)return false;
  const p=phases[0];
  return p?.cadence===offer.cadence && (p.periods===undefined||p.periods===null) &&
    p?.pricing?.type==='STATIC' &&
    p.pricing?.price_money?.amount===offer.amount &&
    p.pricing.price_money.currency==='USD';
}
export function trustedCheckoutUrl(value){
  if(typeof value!=='string')return null;
  try{
    const u=new URL(value);
    if(u.protocol!=='https:'||u.username||u.password||
       !['square.link','checkout.square.site'].includes(u.hostname) || !u.pathname.startsWith('/'))return null;
    return u.href;
  }catch{return null;}
}
export async function squareCall(env,path,{method='GET',body,fetcher=fetch}={}){
  if(!sandboxReady(env)||!/^\/v2\/(?:catalog\/object\/[A-Za-z0-9_-]+|online-checkout\/payment-links|payments\/[A-Za-z0-9_-]+)$/.test(path))
    throw Error('Square sandbox unavailable');
  const response=await fetcher(SQUARE_API+path,{
    method,redirect:'error',headers:{
      'Square-Version':VERSION,
      Authorization:'Bearer '+env.ANEVUM_SQUARE_SANDBOX_ACCESS_TOKEN,
      'Content-Type':'application/json',Accept:'application/json'
    },...(body===undefined?{}:{body:JSON.stringify(body)})
  });
  if(!response.ok)throw Error('Square sandbox request failed');
  const result=await response.json();
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Unverified Square response');
  return result;
}
export async function createSandboxCheckout(env,{interval,intentId,email,fetcher=fetch}){
  const offer=SUPPORT_OFFERS[interval],variation=variationId(env,interval);
  if(!offer||!id(variation)||typeof intentId!=='string'||!/^[0-9a-f-]{36}$/.test(intentId))
    throw Error('Unsupported checkout request');
  const catalog=await squareCall(env,'/v2/catalog/object/'+encodeURIComponent(variation),{fetcher});
  if(!validVariation(catalog.object,variation,offer))throw Error('Provider plan price or cadence does not match ANEVUM');
  const created=await squareCall(env,'/v2/online-checkout/payment-links',{
    method:'POST',fetcher,body:{
      idempotency_key:intentId,
      quick_pay:{location_id:env.ANEVUM_SQUARE_SANDBOX_LOCATION_ID,name:offer.label,
        price_money:{amount:offer.amount,currency:'USD'}},
      checkout_options:{subscription_plan_id:variation,allow_tipping:false,
        redirect_url:canonicalRequestOrigin(env)+'/support?checkout=returned'},
      payment_note:'ANEVUM-SUPPORT-V2:'+intentId,
      // Email is a convenience, never a proof of identity or entitlement.
      ...(typeof email==='string'?{pre_populated_data:{buyer_email:email}}:{})
    }
  });
  const p=created.payment_link;
  const url=trustedCheckoutUrl(p?.long_url)||trustedCheckoutUrl(p?.url);
  if(!url||!id(p?.id)||!id(p?.order_id))throw Error('Invalid provider checkout link');
  return {id:p.id,orderId:p.order_id,url,offer,variation};
}
export async function verifySquareWebhook(raw,signature,env){
  if(!sandboxReady(env)||typeof raw!=='string'||raw.length>100000 ||
     typeof signature!=='string'||signature.length>128)return false;
  let sent;
  try{sent=Uint8Array.from(atob(signature),c=>c.charCodeAt(0))}catch{return false}
  if(sent.length!==32)return false;
  const bytes=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',bytes.encode(env.ANEVUM_SQUARE_SANDBOX_WEBHOOK_KEY),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const expected=new Uint8Array(await crypto.subtle.sign('HMAC',key,
    bytes.encode(env.ANEVUM_SQUARE_SANDBOX_WEBHOOK_URL+raw)));
  let mismatch=0;
  for(let i=0;i<expected.length;i++)mismatch|=expected[i]^sent[i];
  return mismatch===0;
}
export async function verifiedSquarePayment(env,paymentId,fetcher=fetch){
  if(!id(paymentId))throw Error('Unknown payment identifier');
  const reply=await squareCall(env,'/v2/payments/'+encodeURIComponent(paymentId),{fetcher});
  const p=reply.payment;
  if(!p||p.id!==paymentId||!id(p.order_id)||p.location_id!==env.ANEVUM_SQUARE_SANDBOX_LOCATION_ID)
    throw Error('Payment provider identity mismatch');
  return p;
}
