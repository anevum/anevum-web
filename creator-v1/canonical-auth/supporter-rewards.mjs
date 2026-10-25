/** Read-only concept catalogue. No payments, entitlement grants or ledger writes. */
import {rewardCatalog} from '../supporter/rewards.mjs';
const headers={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
const send=(value,status=200)=>Response.json(value,{status,headers});
export async function readSupporterRewards(){return null;}
export async function supporterRewardsRoute(request,_env,user){
 if(!user?.id||user.emailVerified!==true)return send({error:'Verified member required'},403);
 const url=new URL(request.url);
 if(url.pathname!=='/api/v1/member/supporter/rewards'||url.search)return send({error:'Not found'},404);
 if(request.method==='GET')return send({available:false,supporter:false,publicInsignia:false,selected:null,revision:0,
   unlocks:{days:0,seals:[],frames:[],auras:[],tier:null},catalog:rewardCatalog()});
 return send({error:'Supporter reward enrollment is retired'},410);
}
