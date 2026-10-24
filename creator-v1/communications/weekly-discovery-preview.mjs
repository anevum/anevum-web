/**
 * ANEVUM / IREN: preview-only weekly Discovery candidate selection.
 * Source is the existing PUBLIC, moderated /api/v1/boards response.
 * This module cannot send mail, query private accounts, publish, or activate a schedule.
 */
const BOARDS='https://anevum.com/api/v1/boards';
const CATEGORIES=new Set(['tools','games','automation','research','creative','learning','libraries','other']);
const ID=/^[A-Za-z0-9_-]{1,80}$/;
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?)?$/;
const WEEK=604800000;
function instant(value){
 if(typeof value!=='string'||!DATE.test(value))return null;
 let iso=value.replace(' ','T');
 if(!iso.includes('T'))iso+='T00:00:00Z';
 else if(!/(Z|[+-]\d{2}:\d{2})$/.test(iso))iso+='Z';
 const parsed=Date.parse(iso);
 return Number.isFinite(parsed)?parsed:null;
}
function text(value,max){
 if(typeof value!=='string'||value.length>max*4)return '';
 return value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
}
export function selectWeeklyDiscoveryCandidates(source,{now=Date.now(),max=5}={}){
 if(!Number.isSafeInteger(now)||max<1||max>5||!Number.isInteger(max))throw Error('Invalid digest window');
 if(!source||typeof source!=='object'||source.source!=='approved-public-projects'||
 source.qualityRankingAvailable!==false||!Array.isArray(source.latestReleases)||
 source.latestReleases.length>12)throw Error('Unverified public catalogue source');
 const start=now-WEEK;
 const releases=[];const found=new Set();
 for(const item of source.latestReleases){
  if(!item||typeof item!=='object')throw Error('Invalid published project');
  const {id,category,creatorHandle,publishedAt}=item;
  if(typeof id!=='string'||!ID.test(id)||typeof creatorHandle!=='string'||!HANDLE.test(creatorHandle)||
   !CATEGORIES.has(category)||typeof publishedAt!=='string'||instant(publishedAt)===null ||
   !text(item.title,110)||text(item.creatorName,80).length===0 ||
   (item.summary!==null&&item.summary!==undefined&&typeof item.summary!=='string'))throw Error('Invalid published project record');
  const published=instant(publishedAt);
  if(published<=start||published>now||found.has(id))continue;
  found.add(id);
  releases.push({id,title:text(item.title,110),summary:text(item.summary??'',220),
   category,creatorHandle:creatorHandle.toLowerCase(),creatorName:text(item.creatorName,80),
   publishedAt:new Date(published).toISOString(),
   url:'https://anevum.com/projects/'+id});
 }
 releases.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
 // Rotate creators for inclusion breadth, without fabricating popularity or XP.
 const chosen=[];const seenCreators=new Set();
 for(const item of releases)if(!seenCreators.has(item.creatorHandle)&&chosen.length<max){
  chosen.push(item);seenCreators.add(item.creatorHandle);
 }
 for(const item of releases)if(chosen.length<max&&!chosen.some(x=>x.id===item.id))chosen.push(item);
 const weekEnd=new Date(now).toISOString();
 return {source:'approved-public-projects',mode:'preview-only',windowStart:new Date(start).toISOString(),
  windowEnd:weekEnd,shouldSend:false,eligible:chosen.length>0,items:chosen,
  distinctCreators:seenCreators.size,
  reason:chosen.length?'verified-publications-only':'no-new-approved-publications'};
}
export async function fetchWeeklyDiscoveryPreview({fetcher=fetch,now=Date.now()}={}){
 const response=await fetcher(BOARDS,{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',
  headers:{Accept:'application/json'},signal:AbortSignal.timeout(5500)});
 if(!response.ok||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')||''))
  throw Error('Approved public catalogue unavailable');
 const raw=await response.text();
 if(raw.length>80000)throw Error('Approved public catalogue response too large');
 return selectWeeklyDiscoveryCandidates(JSON.parse(raw),{now});
}
