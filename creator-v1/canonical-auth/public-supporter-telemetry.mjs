/**
 * ANEVUM V040 / PRIVACY-SAFE SUPPORTER TRANSPARENCY AGGREGATES
 *
 * Never publish raw member IDs, small-cohort totals, private file sizes,
 * user-generated content, Stripe identifiers or financial records.
 *
 * Public measurements are independent lower-bound buckets, subject to at
 * least 25 DISTINCT contributors in the relevant cohort. The date and
 * technical upload limits remain visible even if all counts are suppressed.
 *
 * This endpoint is disabled by default, limited to the canonical staging
 * issuer/schema in worker.mjs and requires a Cloudflare Cache API instance.
 */
import {CANONICAL_ORIGIN} from './policy.mjs';

export const PUBLIC_TELEMETRY_PATH='/api/v1/public/supporter/metrics';
export const PUBLIC_TELEMETRY_CACHE_SECONDS=900;
export const PUBLIC_TELEMETRY_MIN_COHORT=25;
export const PUBLIC_TELEMETRY_COUNT_GRANULARITY=25;
export const PUBLIC_TELEMETRY_BYTES_GRANULARITY=1048576;
const POLICY_VERSION='v2';
const CACHE_URL=CANONICAL_ORIGIN+PUBLIC_TELEMETRY_PATH+'?policy='+POLICY_VERSION;
const AGGREGATE_SQL='SELECT '+
 '(SELECT COUNT(*) FROM "user") AS member_count,'+
 '(SELECT COUNT(*) FROM member_creator_profiles) AS creator_count,'+
 '(SELECT COUNT(*) FROM member_wall_posts) AS wall_post_count,'+
 '(SELECT COUNT(DISTINCT user_id) FROM member_wall_posts) AS wall_author_count,'+
 '(SELECT COUNT(*) FROM member_space_media) AS media_count,'+
 '(SELECT COUNT(DISTINCT user_id) FROM member_space_media) AS media_owner_count,'+
 '(SELECT COALESCE(SUM(LENGTH(data)),0) FROM member_space_media) AS media_bytes';

const RESP_HEADERS={
 'x-content-type-options':'nosniff',
 'x-robots-tag':'noindex, nofollow, noarchive',
 'referrer-policy':'no-referrer'
};
const errorResponse=(status,message)=>Response.json(
 {error:message},
 {status,headers:{...RESP_HEADERS,'cache-control':'private, no-store',
   'content-type':'application/json; charset=utf-8'}}
);
const checkedInteger=value=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:null;
function validateRow(row){
 if(!row||typeof row!=='object'||Array.isArray(row))return null;
 const keys=['member_count','creator_count','wall_post_count','wall_author_count',
   'media_count','media_owner_count','media_bytes'];
 const values=keys.map(key=>checkedInteger(row[key]));
 if(values.some(value=>value===null))return null;
 const [members,creators,posts,authors,objects,owners,bytes]=values;
 if(creators>members||authors>members||owners>members||
   authors>posts||owners>objects||objects>members*2||
   !Number.isSafeInteger(members*2)|| (objects===0&&bytes!==0))return null;
 return {members,creators,posts,authors,objects,owners,bytes};
}
const bucket=(value,step)=>Math.floor(value/step)*step;
const privacyCount=(count,distinctContributors)=>
 distinctContributors>=PUBLIC_TELEMETRY_MIN_COHORT
  ?bucket(count,PUBLIC_TELEMETRY_COUNT_GRANULARITY):null;
function publishedSnapshot(totals,now){
 const members=privacyCount(totals.members,totals.members);
 const creators=privacyCount(totals.creators,totals.creators);
 const posts=privacyCount(totals.posts,totals.authors);
 const imageOwnersEligible=totals.owners>=PUBLIC_TELEMETRY_MIN_COHORT;
 return {
  schemaVersion:2,
  source:'canonical-member-d1-privacy-aggregate',
  scope:'ANEVUM_STAGING_ONLY',
  dataAsOf:new Date(now).toISOString(),
  cacheTtlSeconds:PUBLIC_TELEMETRY_CACHE_SECONDS,
  privacy:{
   minimumDistinctContributors:PUBLIC_TELEMETRY_MIN_COHORT,
   countLowerBoundStep:PUBLIC_TELEMETRY_COUNT_GRANULARITY,
   imageByteLowerBoundStep:PUBLIC_TELEMETRY_BYTES_GRANULARITY,
   suppressedValuesAreNull:true
  },
  community:{
   memberAccountsLowerBound:members,
   creatorProfilesLowerBound:creators,
   wallPostsLowerBound:posts
  },
  media:{
   imageObjectsLowerBound:imageOwnersEligible
    ?privacyCount(totals.objects,totals.owners):null,
   imageBytesLowerBound:imageOwnersEligible
    ?bucket(totals.bytes,PUBLIC_TELEMETRY_BYTES_GRANULARITY):null,
   imageSlotsPerMember:2,
   imageUploadMaxBytes:262144
  },
  excluded:[
   'personal-records','small-cohort-totals','exact-participant-counts',
   'exact-member-image-bytes','production-members','creator-storage-capacity',
   'provider-storage-capacity','financial-records'
  ]
 };
}
function cachePayloadValid(value,now){
 if(!value||typeof value!=='object'||value.schemaVersion!==2||
   value.source!=='canonical-member-d1-privacy-aggregate'||
   value.scope!=='ANEVUM_STAGING_ONLY'||
   value.cacheTtlSeconds!==PUBLIC_TELEMETRY_CACHE_SECONDS||
   value.privacy?.minimumDistinctContributors!==PUBLIC_TELEMETRY_MIN_COHORT||
   value.privacy?.countLowerBoundStep!==PUBLIC_TELEMETRY_COUNT_GRANULARITY||
   value.privacy?.imageByteLowerBoundStep!==PUBLIC_TELEMETRY_BYTES_GRANULARITY)return false;
 const timestamp=Date.parse(value.dataAsOf);
 const diff=now-timestamp;
 return Number.isFinite(timestamp)&&diff>=0&&
   diff<=PUBLIC_TELEMETRY_CACHE_SECONDS*1000;
}
/**
 * GET-only public route. The query and cache key are fixed by source code,
 * not user parameters. Any disabled flag, invalid issuer, unavailable cache,
 * stale cache or failed aggregate returns a non-revealing error.
 */
export async function publicSupporterTelemetry(
 request,env,{now=Date.now(),cache=globalThis.caches?.default}={}
){
 let url;
 try{url=new URL(request.url)}catch{return errorResponse(404,'Not found')}
 if(url.origin!==CANONICAL_ORIGIN||url.pathname!==PUBLIC_TELEMETRY_PATH||
   url.search||url.hash)return errorResponse(404,'Not found');
 if(request.method!=='GET')return errorResponse(405,'Read-only endpoint');
 if(env?.CANONICAL_SUPPORTER_PUBLIC_METRICS_ENABLED!=='true')
  return errorResponse(404,'Not available');
 if(!env?.MEMBER_DB?.prepare||typeof cache?.match!=='function'||
   typeof cache?.put!=='function')return errorResponse(503,'Aggregate metrics unavailable');
 if(!Number.isSafeInteger(now)||now<0)return errorResponse(503,'Aggregate metrics unavailable');
 const key=new Request(CACHE_URL,{method:'GET'});
 try{
  const cached=await cache.match(key);
  if(cached?.ok&&cached.headers.get('x-anevum-public-telemetry')===POLICY_VERSION){
   const payload=await cached.clone().json().catch(()=>null);
   if(cachePayloadValid(payload,now))return cached;
  }
 }catch{return errorResponse(503,'Aggregate metrics unavailable')}
 try{
  const result=await env.MEMBER_DB.prepare(AGGREGATE_SQL).all();
  if(result?.success===false||!Array.isArray(result?.results)||result.results.length!==1)
   return errorResponse(503,'Aggregate metrics unavailable');
  const totals=validateRow(result.results[0]);
  if(!totals)return errorResponse(503,'Aggregate metrics unavailable');
  const response=Response.json(publishedSnapshot(totals,now),{headers:{
   ...RESP_HEADERS,
   'cache-control':'public, max-age=0, s-maxage='+PUBLIC_TELEMETRY_CACHE_SECONDS,
   'content-type':'application/json; charset=utf-8',
   'x-anevum-public-telemetry':POLICY_VERSION
  }});
  // A failed cache write must not turn the public endpoint into uncapped D1
  // reads. Cloudflare Cache API is per data center, not one global cache.
  await cache.put(key,response.clone());
  return response;
 }catch{return errorResponse(503,'Aggregate metrics unavailable')}
}
