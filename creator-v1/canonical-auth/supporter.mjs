/**
 * Provider-retired supporter facade. The previous commercial provider is
 * permanently disconnected. Historical billing records are never changed
 * or queried from this module. New money flows require a separate review.
 */
const HEADERS={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
const response=(data,status=200)=>Response.json(data,{status,headers:HEADERS});
export async function supporterSchemaReady(){return false;}
export async function publicSupporterForMember(){return false;}
export async function supporterExportMember(env,memberId){
 const db=env?.MEMBER_DB;
 if(typeof memberId!=='string'||!memberId||!db?.prepare)return null;
 try{
  const readOne=async(sql,...args)=>db.prepare(sql).bind(...args).first();
  const readMany=async(sql,...args)=>{
   const result=await db.prepare(sql).bind(...args).all();
   return Array.isArray(result?.results)?result.results:[];
  };
  const existing=await readMany("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('supporter_customers','supporter_subscriptions','supporter_checkout_intents','supporter_visibility','supporter_appearance','supporter_billing_holds')");
  if(new Set(existing.map(row=>row.name)).size!==6)return null;
  // Exact historic storage columns are retained only to preserve personal
  // data export/closure evidence. They never trigger remote provider calls.
  const customer=await readOne('SELECT stripe_customer_id,created_at_ms FROM supporter_customers WHERE member_user_id=?',memberId);
  const subscriptions=await readMany('SELECT stripe_subscription_id,stripe_price_id,billing_interval,status,current_period_end_ms,started_at_ms,cancel_at_period_end,synced_at_ms FROM supporter_subscriptions WHERE member_user_id=? ORDER BY started_at_ms DESC LIMIT 500',memberId);
  const checkouts=await readMany('SELECT stripe_checkout_session_id,billing_interval,created_at_ms,completed_at_ms,abandoned_at_ms FROM supporter_checkout_intents WHERE member_user_id=? ORDER BY created_at_ms DESC LIMIT 500',memberId);
  const consent=await readOne('SELECT public_insignia,revision,updated_at_ms FROM supporter_visibility WHERE member_user_id=?',memberId);
  const appearance=await readOne('SELECT selected_seal,selected_frame,selected_aura,revision,updated_at_ms FROM supporter_appearance WHERE member_user_id=?',memberId);
  const holds=await readMany('SELECT h.reason,h.created_at_ms FROM supporter_billing_holds h JOIN supporter_customers c ON c.stripe_customer_id=h.stripe_customer_id WHERE c.member_user_id=?',memberId);
  if(!customer&&!subscriptions.length&&!checkouts.length&&!consent&&!appearance&&!holds.length)return null;
  return {service:'retired-legacy-provider',customerId:customer?.stripe_customer_id??null,subscriptions,checkouts,
   display:consent?{publicInsignia:consent.public_insignia===1,revision:consent.revision,updatedAt:consent.updated_at_ms}:null,
   appearance:appearance?{seal:appearance.selected_seal,frame:appearance.selected_frame,aura:appearance.selected_aura,revision:appearance.revision,updatedAt:appearance.updated_at_ms}:null,
   billingHolds:holds};
 }catch{return null;}
}
export async function supporterMember(request,_env,user){
 const path=new URL(request.url).pathname;
 if(!user?.id||user.emailVerified!==true)return response({error:'Verified member required'},403);
 if(path!=='/api/v1/member/supporter')return response({error:'Not found'},404);
 if(request.method==='GET')return response({available:false,supporter:false,status:'retired',publicInsignia:false,revision:0});
 return response({error:'Supporter enrollment is retired; no payment actions are available'},410);
}
export async function reconcileSupporterSubscriptions(){return {available:false,examined:0,refreshed:0,failed:0};}
export async function reconcileSupporterCheckouts(){return {available:false,examined:0,reconciled:0,failed:0};}
