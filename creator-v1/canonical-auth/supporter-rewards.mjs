/**
 * Canonical server-only supporter cosmetics.
 * No client-supplied customer IDs, XP, rank or creator-specific privilege.
 * This is a deliberately tiny D1 projection that fails closed if Stripe
 * reconciliation is stale, a dispute/refund hold exists, or consent is absent.
 */
import {supporterConfig} from '../supporter/stripe.mjs';
import {supporterState} from '../supporter/entitlements.mjs';
import {supporterUnlocks,selectedSupporterAppearance,rewardCatalog,validSupporterAppearance} from '../supporter/rewards.mjs';
import {boundedText} from './request-body.mjs';

const HEADERS={
  'cache-control':'private, no-store','content-type':'application/json; charset=utf-8',
  'x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow, noarchive'
};
const json=(value,status=200)=>Response.json(value,{status,headers:HEADERS});
const fail=(status,message)=>json({error:message},status);
const PREFIX='/api/v1/member/supporter/rewards';
const empty=()=>({supporter:false,publicInsignia:false,selected:null,revision:0,
  unlocks:{days:0,seals:[],frames:[],auras:[],tier:null}});
const resultRows=async(db,sql,...args)=>{
  const result=await db.prepare(sql).bind(...args).all();
  if(result?.success===false||!Array.isArray(result?.results))throw Error('Member storage unavailable');
  return result.results;
};
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const current=(row,now)=>supporterState({
  status:row.status,currentPeriodEnd:row.current_period_end_ms
},now).supporter && row.synced_at_ms<=now && now-row.synced_at_ms<=259200000;
const safeSelection=row=>({seal:row?.selected_seal,frame:row?.selected_frame,aura:row?.selected_aura});

export async function readSupporterRewards(env,memberId,now=Date.now(),publicOnly=false){
  if(!supporterConfig(env).enabled||!env?.MEMBER_DB?.prepare||
     typeof memberId!=='string'||!memberId)return null;
  const db=env.MEMBER_DB;
  try{
    const hold=await one(db,
      'SELECT h.stripe_customer_id FROM supporter_billing_holds h JOIN supporter_customers c ON c.stripe_customer_id=h.stripe_customer_id WHERE c.member_user_id=?',
      memberId);
    if(hold)return null;
    const consent=await one(db,
      'SELECT public_insignia FROM supporter_visibility WHERE member_user_id=?',memberId);
    if(publicOnly&&consent?.public_insignia!==1)return null;
    const subs=await resultRows(db,
      'SELECT status,current_period_end_ms,started_at_ms,synced_at_ms FROM supporter_subscriptions WHERE member_user_id=? ORDER BY started_at_ms DESC,synced_at_ms DESC LIMIT 12',
      memberId);
    const verified=subs.find(row=>current(row,now));
    if(!verified)return null;
    const unlocked=supporterUnlocks(verified.started_at_ms,now);
    const chosen=await one(db,
      'SELECT selected_seal,selected_frame,selected_aura,revision FROM supporter_appearance WHERE member_user_id=?',memberId);
    return {
      supporter:true,publicInsignia:consent?.public_insignia===1,
      selected:selectedSupporterAppearance(safeSelection(chosen),unlocked),
      unlocks:unlocked,revision:Number(chosen?.revision)||0
    };
  }catch{return null;}
}
export async function supporterRewardsRoute(request,env,user,{now=Date.now()}={}){
  if(!user||typeof user.id!=='string'||user.emailVerified!==true)return fail(403,'Verified member required');
  const url=new URL(request.url);
  if(url.pathname!==PREFIX||url.search)return fail(404,'Not found');
  if(request.method!=='GET'&&request.method!=='PATCH')return fail(405,'Method not allowed');
  const enabled=supporterConfig(env).enabled;
  if(request.method==='GET'){
    const active=await readSupporterRewards(env,user.id,now);
    return json({available:enabled,...empty(),...(active||{}),catalog:rewardCatalog()});
  }
  if(!enabled)return fail(404,'Supporter cosmetics are not open');
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return fail(400,'Invalid request');
  const raw=await boundedText(request,240);
  let input;
  try{input=JSON.parse(raw)}catch{return fail(400,'Invalid request')}
  if(!input||typeof input!=='object'||Array.isArray(input)||
     Object.keys(input).sort().join(',')!=='aura,frame,revision,seal'||
     !Number.isSafeInteger(input.revision)||input.revision<0)
    return fail(400,'Invalid supporter selection');
  const own=await readSupporterRewards(env,user.id,now);
  if(!own)return fail(409,'An active, verified supporter membership is required');
  if(!validSupporterAppearance({
    seal:input.seal,frame:input.frame,aura:input.aura
  },own.unlocks))return fail(400,'A reward is not unlocked for this subscription');
  try{
    const db=env.MEMBER_DB;
    if(input.revision!==own.revision)return fail(409,'Supporter appearance changed. Reload before saving');
    if(input.revision===0){
      const inserted=await resultRows(db,
        'INSERT OR IGNORE INTO supporter_appearance(member_user_id,selected_seal,selected_frame,selected_aura,revision,updated_at_ms) VALUES(?,?,?,?,1,?) RETURNING revision',
        user.id,input.seal,input.frame,input.aura,now);
      if(inserted.length!==1)return fail(409,'Display settings changed. Reload before saving');
      return json({selected:{seal:input.seal,frame:input.frame,aura:input.aura},revision:1});
    }
    const changed=await resultRows(db,
      'UPDATE supporter_appearance SET selected_seal=?,selected_frame=?,selected_aura=?,revision=revision+1,updated_at_ms=? WHERE member_user_id=? AND revision=? RETURNING revision',
      input.seal,input.frame,input.aura,now,user.id,input.revision);
    if(changed.length!==1)return fail(409,'Display settings changed. Reload before saving');
    return json({selected:{seal:input.seal,frame:input.frame,aura:input.aura},revision:Number(changed[0].revision)});
  }catch{return fail(503,'Supporter appearance could not be saved')}
}
