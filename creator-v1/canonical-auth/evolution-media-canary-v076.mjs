/**
 * V076 release-only probe. A stand-alone read-only PUBLIC reward-media Worker,
 * never a full member or static archive gateway. No private session routes,
 * auth secrets, mutations, admin APIs, public files, or award grants.
 */
import {matchRewardMedia,earnedRewardMedia,earnedRewardInventory} from './reward-media.mjs';
const deny=()=>new Response('Not found',{status:404,headers:{
 'cache-control':'no-store','x-content-type-options':'nosniff',
 'x-robots-tag':'noindex, nofollow, noarchive'
}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  // No cross-origin credential reads, owned-account endpoints or arbitrary
  // static /evolution/ bytes are exposed on the disposable probe.
  if(url.pathname==='/__canary/v076/asset-status'&&request.method==='GET'){
   const inventory=await earnedRewardInventory(
    new Request('https://anevum.com/api/v1/members/devon/rewards/inventory'),
    env,null,{handle:'devon'});
   if(!inventory.ok)return deny();
   const current=await inventory.json();
   if(current.currentLevel!==4||current.levels?.[0]?.level!==4)return deny();
   const names=[
    'level-04-compact-128.png','level-04-256.webp','level-04-1024.webp',
    'level-04-scene.gz','height.png','albedo.webp'
   ];
   const records=await Promise.all(names.map(async name=>{
    try{
     const asset=await env.ASSETS.fetch(new URL('/evolution/assets/'+name,'https://assets.local'));
     return {name,status:asset.status,type:asset.headers.get('content-type')||'',
      encoding:asset.headers.get('content-encoding')||'',
      length:asset.headers.get('content-length')||'',
      redirected:asset.redirected};
    }catch(e){return {name,error:e instanceof Error?e.name:'unknown'}}
   }));
   return Response.json({currentLevel:4,records},{headers:{
    'cache-control':'no-store','x-robots-tag':'noindex, nofollow, noarchive'
   }});
  }
  const match=matchRewardMedia(url.pathname);
  if(!match?.handle||!['GET','HEAD'].includes(request.method))return deny();
  return earnedRewardMedia(request,env,null,match);
 }
};
