/**
 * Client-side read model for the EXISTING approved-public-projects board.
 * Not a ranking, publishing permission, newsletter scheduler, or XP event.
 * Never use this result as authorization to dispatch email.
 */
export type WeeklyPublicCreation={
  id:string;title:string;summary:string;creatorName:string;creatorHandle:string;
  publishedAt:string;url:string;
};
export type WeeklyPublicCreations={source:'approved-public-projects';items:WeeklyPublicCreation[];windowStart:string;windowEnd:string};
const WEEK_MS=7*24*60*60*1000;
const ID=/^[A-Za-z0-9_-]{1,80}$/;
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const CATEGORIES=new Set(['games','tools','automation','research','creative','learning','libraries','other']);
function timestamp(value:unknown):number|null{
 if(typeof value!=='string'||!DATE.test(value))return null;
 let iso=value.replace(' ','T');
 if(!iso.includes('T'))iso+='T00:00:00Z';
 else if(!/(Z|[+-]\d{2}:\d{2})$/.test(iso))iso+='Z';
 const parsed=Date.parse(iso);
 return Number.isFinite(parsed)?parsed:null;
}
function cleanText(value:unknown,max:number):string{
 if(typeof value!=='string'||value.length>max*4)return '';
 return value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
}
function object(value:unknown):value is Record<string,unknown>{
 return Boolean(value&&typeof value==='object'&&!Array.isArray(value));
}
export function selectWeeklyPublicCreations(source:unknown,now=Date.now()):WeeklyPublicCreations{
 if(!Number.isSafeInteger(now)||!object(source)||source.source!=='approved-public-projects'||
  source.qualityRankingAvailable!==false||!Array.isArray(source.latestReleases)||source.latestReleases.length>12)
  throw new Error('Verified public publication index unavailable');
 const earliest=now-WEEK_MS;
 const sorted:WeeklyPublicCreation[]=[];
 const identifiers=new Set<string>();
 for(const value of source.latestReleases){
  if(!object(value))throw new Error('Invalid public publication');
  const date=timestamp(value.publishedAt);
  if(typeof value.id!=='string'||!ID.test(value.id)||typeof value.category!=='string'||!CATEGORIES.has(value.category)||
   typeof value.creatorHandle!=='string'||!HANDLE.test(value.creatorHandle)||
   !cleanText(value.title,110)||!cleanText(value.creatorName,80)||
   (value.summary!==null&&value.summary!==undefined&&typeof value.summary!=='string')||
   date===null)throw new Error('Invalid verified publication');
  if(date<=earliest||date>now||identifiers.has(value.id))continue;
  identifiers.add(value.id);
  sorted.push({id:value.id,title:cleanText(value.title,110),summary:cleanText(value.summary??'',220),
   creatorHandle:value.creatorHandle.toLowerCase(),creatorName:cleanText(value.creatorName,80),
   publishedAt:new Date(date).toISOString(),url:'/projects/'+encodeURIComponent(value.id)});
 }
 sorted.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
 const picked:WeeklyPublicCreation[]=[];
 const creators=new Set<string>();
 for(const item of sorted){
  if(picked.length>=5)break;
  if(creators.has(item.creatorHandle))continue;
  creators.add(item.creatorHandle);
  picked.push(item);
 }
 for(const item of sorted){
  if(picked.length>=5)break;
  if(!picked.some(project=>project.id===item.id))picked.push(item);
 }
 return {source:'approved-public-projects',items:picked,windowStart:new Date(earliest).toISOString(),windowEnd:new Date(now).toISOString()};
}

/**
 * Read only ANEVUM's existing approved/public catalogue. Browser session or
 * account identity is never forwarded. Failure simply omits the highlights.
 */
export async function readWeeklyPublicCreations(signal?:AbortSignal,now=Date.now()):Promise<WeeklyPublicCreations>{
 const response=await fetch('/api/v1/boards',{method:'GET',credentials:'omit',cache:'no-store',
  redirect:'error',headers:{Accept:'application/json'},signal});
 if(!response.ok||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')||''))
  throw new Error('Public weekly catalogue unavailable');
 const raw=await response.text();
 if(raw.length>80000)throw new Error('Public weekly catalogue response too large');
 return selectWeeklyPublicCreations(JSON.parse(raw),now);
}
