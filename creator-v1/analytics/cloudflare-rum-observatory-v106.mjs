/**
 * ANEVUM IREN Observatory / Cloudflare RUM aggregate reader V106.
 * Source-only optional read: no binding, no request. No ingestion or attribution.
 * Web Analytics visits are browser beacons, not unique people or engaged members.
 *
 * Expected inactive Worker environment bindings:
 *   ANEVUM_RUM_ACCOUNT_TAG   (32-hex Cloudflare account ID; private Worker variable)
 *   ANEVUM_RUM_SITE_TAG      (Cloudflare Web Analytics site tag; private Worker variable)
 *   ANEVUM_RUM_READ_TOKEN    (least-privilege GraphQL analytics token; secret)
 */
export const RUM_SOURCE='CLOUDFLARE_WEB_ANALYTICS';
const API='https://api.cloudflare.com/client/v4/graphql';
const ACCOUNT_TAG=/^[a-f0-9]{32}$/i;
const SITE_TAG=/^[a-z0-9_-]{8,128}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const MAX_BYTES=262144;

export function rumBindingState(env){
 const present=!!env&&typeof env==='object'&&
   typeof env.ANEVUM_RUM_ACCOUNT_TAG==='string'&&ACCOUNT_TAG.test(env.ANEVUM_RUM_ACCOUNT_TAG)&&
   typeof env.ANEVUM_RUM_SITE_TAG==='string'&&SITE_TAG.test(env.ANEVUM_RUM_SITE_TAG)&&
   typeof env.ANEVUM_RUM_READ_TOKEN==='string'&&env.ANEVUM_RUM_READ_TOKEN.length>=24&&env.ANEVUM_RUM_READ_TOKEN.length<=4096;
 return present?'ready':'unavailable';
}
function dateOnly(stamp){
 return new Date(stamp).toISOString().slice(0,10);
}
function utcCalendarRange(now){
 if(!Number.isFinite(now))throw Error('Invalid UTC clock');
 const d=new Date(now);
 const midnight=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
 return {
  from:dateOnly(midnight-29*86400000),
  to:dateOnly(midnight),
  midnight
 };
}
export function buildRumQuery(accountTag,siteTag,from,to){
 if(!ACCOUNT_TAG.test(accountTag)||!SITE_TAG.test(siteTag)||!DATE.test(from)||!DATE.test(to)||from>to)
  throw new TypeError('Invalid Cloudflare RUM query dimensions');
 // All labels must be validated before interpolation, and GraphQL string values
 // are serialized as JSON strings to prevent expression injection.
 return 'query ObservatoryRum30Day { viewer { accounts(filter: { accountTag: '+JSON.stringify(accountTag)+
  ' }) { rumPageloadEventsAdaptiveGroups(limit: 31, orderBy: [date_ASC], filter: { siteTag: '+
  JSON.stringify(siteTag)+', date_geq: '+JSON.stringify(from)+', date_leq: '+JSON.stringify(to)+
  ' }) { count sum { visits } dimensions { date } } } } }';
}
export function normalizeRumResponse(data,now=Date.now()){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Cloudflare analytics response invalid');
 const accounts=data.viewer?.accounts;
 if(!Array.isArray(accounts)||accounts.length!==1)throw Error('Cloudflare analytics account unavailable');
 const rows=accounts[0]?.rumPageloadEventsAdaptiveGroups;
 if(!Array.isArray(rows)||rows.length>30)throw Error('Cloudflare analytics series unavailable');
 const range=utcCalendarRange(now);
 const seen=new Set(),daily=new Map();
 for(const row of rows){
  const day=row?.dimensions?.date;
  const loads=row?.count,visits=row?.sum?.visits;
  if(typeof day!=='string'||!DATE.test(day)||day<range.from||day>range.to||seen.has(day)||
   !Number.isFinite(loads)||loads<0||!Number.isFinite(visits)||visits<0||
   loads>Number.MAX_SAFE_INTEGER||visits>Number.MAX_SAFE_INTEGER)
   throw Error('Cloudflare analytics day integrity unavailable');
  seen.add(day);daily.set(day,{day,pageLoads:loads,visits});
 }
 const points=Array.from({length:30},(_,i)=>{
  const day=dateOnly(range.midnight-(29-i)*86400000);
  return daily.get(day)||{day,pageLoads:0,visits:0};
 });
 const visits=points.reduce((total,x)=>total+x.visits,0);
 const pageLoads=points.reduce((total,x)=>total+x.pageLoads,0);
 if(!Number.isFinite(visits)||!Number.isFinite(pageLoads))throw Error('Cloudflare analytics totals invalid');
 return {
  status:'estimated',quality:'may_be_sampled',source:RUM_SOURCE,
  meaning:'Browser beacon visits and page-load event counts; not unique people, signups or meaningful participation.',
  timeZone:'UTC',from:range.from,to:range.to,
  checkedAt:new Date(now).toISOString(),
  visits,pageLoads,days:points,
  warning:'Cloudflare Web Analytics may sample or aggregate the source. Owner/test/bot contamination is not yet classified, and beacon visitors cannot be inferred from visits. Do not combine with member registrations into a conversion rate.'
 };
}
/**
 * A verified, bounded server-only GraphQL read.
 * All failures are generic; nothing leaks Cloudflare credentials/account IDs to browsers.
 */
export async function fetchRumAggregates(env,{fetcher=globalThis.fetch,now=Date.now()}={}){
 if(rumBindingState(env)!=='ready')return {
  status:'unavailable',source:RUM_SOURCE,
  reason:'Analytics read bindings are not configured for this Worker. No browser visit values are available.',
  checkedAt:new Date(now).toISOString()
 };
 if(typeof fetcher!=='function')throw Error('Analytics network unavailable');
 const range=utcCalendarRange(now);
 const query=buildRumQuery(env.ANEVUM_RUM_ACCOUNT_TAG,env.ANEVUM_RUM_SITE_TAG,range.from,range.to);
 const controller=typeof AbortController==='function'?new AbortController():null;
 const timeout=controller?setTimeout(()=>controller.abort(),8000):null;
 let res;
 try{
  res=await fetcher(API,{
   method:'POST',redirect:'error',cache:'no-store',
   headers:{Authorization:'Bearer '+env.ANEVUM_RUM_READ_TOKEN,'Content-Type':'application/json',Accept:'application/json'},
   body:JSON.stringify({query}),signal:controller?.signal
  });
  if(!res?.ok)throw Error('Cloudflare RUM request failed');
  if(!(res.headers?.get('content-type')||'').includes('application/json'))
   throw Error('Cloudflare RUM response invalid');
  const length=Number(res.headers?.get('content-length'));
  if(Number.isFinite(length)&&length>MAX_BYTES)throw Error('Cloudflare RUM response exceeded bound');
  const raw=await res.text();
  if(raw.length>MAX_BYTES)throw Error('Cloudflare RUM response exceeded bound');
  const doc=JSON.parse(raw);
  if(!doc||Array.isArray(doc.errors)&&doc.errors.length||!doc.data)
   throw Error('Cloudflare RUM GraphQL query unavailable');
  return normalizeRumResponse(doc.data,now);
 }catch{
  // The caller returns a generic 503; never leak upstream body, token or account.
  throw Error('CLOUDFLARE_RUM_READ_UNAVAILABLE');
 }finally{
  if(timeout!==null)clearTimeout(timeout);
 }
}
