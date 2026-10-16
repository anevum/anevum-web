/**
 * ANEVUM V039 / PUBLIC STAGING TRANSPARENCY FEED
 *
 * Bounded, opt-in, cached, aggregate-only D1 reads. No user identifier, profile
 * image, Stripe/customer data, private post body or billing information.
 *
 * Runtime availability requires an explicit flag, the canonical issuer/schema
 * checks already provided by worker.mjs, and a functioning edge cache.
 *
 * All totals refer only to canonical STAGING member D1. They are NOT
 * production adoption, file storage capacity, payments, or operating costs.
 */
import {CANONICAL_ORIGIN} from './policy.mjs';

export const PUBLIC_TELEMETRY_PATH='/api/v1/public/supporter/metrics';
export const PUBLIC_TELEMETRY_CACHE_SECONDS=900;
const CACHE_URL=CANONICAL_ORIGIN+PUBLIC_TELEMETRY_PATH;
const AGGREGATE_SQL='SELECT '+
  '(SELECT COUNT(*) FROM "user") AS member_count,'+
  '(SELECT COUNT(*) FROM member_creator_profiles) AS creator_count,'+
  '(SELECT COUNT(*) FROM member_wall_posts) AS wall_post_count,'+
  '(SELECT COUNT(*) FROM member_space_media) AS media_count,'+
  '(SELECT COALESCE(SUM(LENGTH(data)),0) FROM member_space_media) AS media_bytes';

const errorResponse=(status,message)=>Response.json(
  {error:message},
  {status,headers:{
    'cache-control':'private, no-store',
    'content-type':'application/json; charset=utf-8',
    'x-content-type-options':'nosniff',
    'x-robots-tag':'noindex, nofollow, noarchive',
    'referrer-policy':'no-referrer'
  }}
);
const positiveInt=(value)=>{
 const result=typeof value==='number'?value:Number.NaN;
 return Number.isSafeInteger(result)&&result>=0?result:null;
};
function validateRow(row){
 if(!row||typeof row!=='object'||Array.isArray(row))return null;
 const memberAccounts=positiveInt(row.member_count);
 const creatorProfiles=positiveInt(row.creator_count);
 const wallPosts=positiveInt(row.wall_post_count);
 const mediaObjects=positiveInt(row.media_count);
 const mediaBytes=positiveInt(row.media_bytes);
 if([memberAccounts,creatorProfiles,wallPosts,mediaObjects,mediaBytes].some(x=>x===null)||
  creatorProfiles>memberAccounts||mediaObjects>memberAccounts*2||
  !Number.isSafeInteger(memberAccounts*2))return null;
 return {memberAccounts,creatorProfiles,wallPosts,mediaObjects,mediaBytes};
}
function publishedSnapshot(totals,now){
 return {
  schemaVersion:1,
  source:'canonical-member-d1-aggregate',
  scope:'ANEVUM_STAGING_ONLY',
  dataAsOf:new Date(now).toISOString(),
  cacheTtlSeconds:PUBLIC_TELEMETRY_CACHE_SECONDS,
  community:{
   memberAccounts:totals.memberAccounts,
   creatorProfiles:totals.creatorProfiles,
   wallPosts:totals.wallPosts
  },
  media:{
   imageObjects:totals.mediaObjects,
   imageBytes:totals.mediaBytes,
   imageSlotsPerMember:2,
   imageUploadMaxBytes:262144
  },
  excluded:[
   'private-member-data','production-members','creator-submission-capacity',
   'provider-storage-capacity','operating-costs','customer-payments'
  ]
 };
}

/**
 * Public GET route. No cookies, no request parameters, no custom SQL, no
 * client-controlled measurement range. HEAD/POST and extra query fields
 * are refused before any D1 access. Failed checks do not cache errors.
 */
export async function publicSupporterTelemetry(
 request,env,{now=Date.now(),cache=globalThis.caches?.default}={}
){
 let url;
 try{url=new URL(request.url)}catch{return errorResponse(404,'Not found')}
 if(url.origin!==CANONICAL_ORIGIN||url.pathname!==PUBLIC_TELEMETRY_PATH||
   url.search||url.hash)return errorResponse(404,'Not found');
 if(request.method!=='GET')return errorResponse(405,'Read-only endpoint');
 if(env?.CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED!=='true')return errorResponse(404,'Not available');
 if(!env?.MEMBER_DB?.prepare||typeof cache?.match!=='function'||
   typeof cache?.put!=='function')return errorResponse(503,'Aggregate metrics unavailable');
 if(!Number.isSafeInteger(now)||now<0)return errorResponse(503,'Aggregate metrics unavailable');

 const key=new Request(CACHE_URL,{method:'GET'});
 try{
  const cached=await cache.match(key);
  if(cached?.ok&&cached.headers.get('x-anevum-public-telemetry')==='v1')
   return cached;
 }catch{return errorResponse(503,'Aggregate metrics unavailable')}

 // Fixed SQL, read-only. R2 bucket totals and D1 file footprints require
 // separate provider-level data and remain the dated manual snapshot.
 try{
  const result=await env.MEMBER_DB.prepare(AGGREGATE_SQL).all();
  if(result?.success===false||!Array.isArray(result?.results)||result.results.length!==1)
   return errorResponse(503,'Aggregate metrics unavailable');
  const totals=validateRow(result.results[0]);
  if(!totals)return errorResponse(503,'Aggregate metrics unavailable');
  const payload=publishedSnapshot(totals,now);
  const response=Response.json(payload,{headers:{
   'cache-control':'public, max-age=0, s-maxage='+PUBLIC_TELEMETRY_CACHE_SECONDS,
   'content-type':'application/json; charset=utf-8',
   'x-content-type-options':'nosniff',
   'x-robots-tag':'noindex, nofollow, noarchive',
   'x-anevum-public-telemetry':'v1',
   'referrer-policy':'no-referrer'
  }});
  // Do not return successful uncached responses if edge caching fails.
  // This would turn a public page into an unbounded D1 query path.
  await cache.put(key,response.clone());
  return response;
 }catch{return errorResponse(503,'Aggregate metrics unavailable')}
}
