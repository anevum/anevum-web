/**
 * V076 release-only probe. A stand-alone read-only PUBLIC reward-media Worker,
 * never a full member or static archive gateway. No private session routes,
 * auth secrets, mutations, admin APIs, public files, or award grants.
 */
import {matchRewardMedia,earnedRewardMedia} from './reward-media.mjs';
const deny=()=>new Response('Not found',{status:404,headers:{
 'cache-control':'no-store','x-content-type-options':'nosniff',
 'x-robots-tag':'noindex, nofollow, noarchive'
}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  // No cross-origin credential reads, owned-account endpoints or arbitrary
  // static /evolution/ bytes are exposed on the disposable probe.
  const match=matchRewardMedia(url.pathname);
  if(!match?.handle||!['GET','HEAD'].includes(request.method))return deny();
  return earnedRewardMedia(request,env,null,match);
 }
};
