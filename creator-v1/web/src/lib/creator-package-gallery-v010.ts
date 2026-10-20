/** V010 read-only package/gallery client. Never executes creator code or mints roles. */
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const COVER=/^\/upload\/v3\/api\/v1\/packages\/covers\/([0-9a-f-]{36})$/;
const PLAY=/^\/upload\/v3\/play\/([0-9a-f-]{36})$/;
const CATEGORY=new Set(['game','app','simulation','story']);
const STATUSES=new Set(['draft','pending_review','published','rejected','suspended']);
const DRAFT_STATUSES=new Set(['ready','pending_review','rejected']);
export type PackageGalleryMode='owner'|'public';
export type CreatorPackageCard={
 id:string;title:string;summary:string;category:string;version:number;
 status:string|null;draftStatus:string|null;coverUrl:string|null;playUrl:string|null;
 previewUrl:string|null;publishedAt:number|null;
};
export type PackageGalleryResult={projects:CreatorPackageCard[];handle:string|null};
function object(input:unknown):input is Record<string,unknown>{
 return input!==null&&typeof input==='object'&&!Array.isArray(input);
}
export function safeCreatorHandle(handle:string):string|null{
 return HANDLE.test(handle)?handle:null;
}
export function safePackageCover(url:unknown):string|null{
 if(typeof url!=='string')return null;
 const m=url.match(COVER);
 return m&&ID.test(m[1])?url:null;
}
export function safePackagePlay(url:unknown):string|null{
 if(typeof url!=='string')return null;
 const m=url.match(PLAY);
 return m&&ID.test(m[1])?url:null;
}
export function parsePackageGallery(value:unknown,mode:PackageGalleryMode,expectedHandle?:string):PackageGalleryResult{
 if(!object(value)||!Array.isArray(value.projects))throw Error('Invalid ANEVUM package gallery response.');
 if(mode==='public'&&(typeof value.handle!=='string'||value.handle!==expectedHandle||!safeCreatorHandle(value.handle)))
   throw Error('Public creator identity could not be verified.');
 const result:CreatorPackageCard[]=[];
 for(const input of value.projects.slice(0,50)){
  if(!object(input)||typeof input.id!=='string'||!ID.test(input.id)||
     typeof input.title!=='string'||input.title.length>100||input.title.trim().length<3||
     typeof input.summary!=='string'||input.summary.length>500||
     typeof input.category!=='string'||!CATEGORY.has(input.category)||
     typeof input.version!=='number'||!Number.isSafeInteger(input.version)||input.version<1)
    continue;
  const status=mode==='owner'&&typeof input.status==='string'&&STATUSES.has(input.status)?input.status:null;
  const draftStatus=mode==='owner'&&typeof input.draft_status==='string'&&DRAFT_STATUSES.has(input.draft_status)?input.draft_status:null;
  // Do not infer a public URL or ownership from arbitrary JSON. Only the
  // canonical service supplies the approved and private lists.
  const play=mode==='public'
    ?safePackagePlay(input.play_url)
    :status==='published'?safePackagePlay(input.play_url):null;
  if(mode==='public'&&!play)continue;
  const publishedAt=mode==='public'&&typeof input.published_at==='number'&&
    Number.isSafeInteger(input.published_at)&&input.published_at>0
      ?input.published_at:null;
  result.push({
   id:input.id,title:input.title,summary:input.summary,category:input.category,
   version:input.version,status,draftStatus,coverUrl:safePackageCover(input.cover_url),
   playUrl:play,previewUrl:mode==='owner'&&['ready','pending_review'].includes(draftStatus||'')
     ?'/upload/v3/play/'+input.id+'?preview=1':null,
   publishedAt
  });
 }
 return {projects:result,handle:mode==='public'?value.handle as string:null};
}
export async function readPackageGallery(mode:PackageGalleryMode,handle:string|null,signal?:AbortSignal):Promise<PackageGalleryResult|null>{
 const safe=mode==='public'&&handle?safeCreatorHandle(handle):null;
 if(mode==='public'&&!safe)return null;
 const path=mode==='public'
  ?'/upload/v3/api/v1/packages/creators/'+safe+'/projects'
  :'/upload/v3/api/v1/packages/mine';
 const response=await fetch(path,{
  method:'GET',credentials:mode==='owner'?'same-origin':'omit',
  mode:'same-origin',cache:'no-store',redirect:'error',signal,
  headers:{Accept:'application/json'}
 });
 // 404 can mean disabled integration, unpublished member, or removed creator.
 // Never expose which private account state caused it.
 if(response.status===404)return null;
 if(!response.ok)throw Error(response.status===401
  ?'Your member session is no longer available. Sign in again to view private builds.'
  :'Creator projects are temporarily unavailable.');
 if(!response.headers.get('content-type')?.toLowerCase().includes('application/json'))
  throw Error('The creator gallery service returned an unexpected response.');
 return parsePackageGallery(await response.json(),mode,safe||undefined);
}

/** The global package endpoint returns approved releases without exposing a
 * member identity. Member-wall attribution continues to use the proof-bound
 * handle endpoint above; no identity is inferred from catalogue metadata. */
export function parsePackageCatalogue(value:unknown):CreatorPackageCard[]{
 if(!object(value)||!Array.isArray(value.projects))throw Error('Invalid ANEVUM package catalogue response.');
 const projects:CreatorPackageCard[]=[],seen=new Set<string>();
 for(const item of value.projects.slice(0,100)){
  if(!object(item)||typeof item.id!=='string'||!ID.test(item.id)||seen.has(item.id)||
    typeof item.title!=='string'||item.title.trim().length<3||item.title.length>100||
    typeof item.summary!=='string'||item.summary.length>500||
    typeof item.category!=='string'||!CATEGORY.has(item.category)||
    typeof item.version!=='number'||!Number.isSafeInteger(item.version)||item.version<1||
    (item.status!==undefined&&item.status!=='published')||
    (item.draft_status!==undefined&&item.draft_status!==null))continue;
  const play='/upload/v3/play/'+item.id;
  // Older approved catalogue responses omit play_url. Only the UUID from this
  // published-only endpoint can use the existing canonical package player.
  if(item.play_url!==undefined&&safePackagePlay(item.play_url)!==play)continue;
  seen.add(item.id);
  projects.push({id:item.id,title:item.title,summary:item.summary,category:item.category,
   version:item.version,status:'published',draftStatus:null,previewUrl:null,playUrl:play,
   coverUrl:safePackageCover(item.cover_url),
   publishedAt:typeof item.published_at==='number'&&Number.isSafeInteger(item.published_at)&&item.published_at>0?item.published_at:null});
 }
 return projects;
}
export async function readPackageCatalogue(enabled=false,signal?:AbortSignal):Promise<CreatorPackageCard[]|null>{
 if(!enabled)return null;
 const response=await fetch('/upload/v3/api/v1/packages/projects',{
  method:'GET',credentials:'omit',mode:'same-origin',cache:'no-store',redirect:'error',signal,
  headers:{Accept:'application/json'}
 });
 if(response.status===404)return null;
 if(!response.ok)throw Error('Uploaded browser releases are temporarily unavailable.');
 if(!response.headers.get('content-type')?.toLowerCase().includes('application/json'))
  throw Error('The package catalogue returned an unexpected response.');
 return parsePackageCatalogue(await response.json());
}
const DISCOVERY_CATEGORY:Record<string,string>={game:'games',simulation:'games',app:'tools',story:'creative'};
export function packageDiscoveryResults(projects:CreatorPackageCard[],
 filter:{query:string;category:string;freeOnly:boolean},
 legacy:ReadonlyArray<{id:string;demoUrl:string|null}>=[]):CreatorPackageCard[]{
 // Packages have no creator-declared freeToUse field. Do not invent a free
 // declaration merely because their player does not currently charge money.
 if(filter.freeOnly)return [];
 const linked=new Set(legacy.map(item=>item.id));
 for(const item of legacy){
  if(!item.demoUrl)continue;
  try{
   const url=new URL(item.demoUrl,'https://anevum.com');
   if(url.origin!=='https://anevum.com'||url.username||url.password||url.search)continue;
   const path=url.pathname.replace(/\/$/,'');
   if(safePackagePlay(path))linked.add(path.slice('/upload/v3/play/'.length));
  }catch{/* An invalid legacy demo cannot claim an uploaded package. */}
 }
 const query=filter.query.trim().toLowerCase();
 return projects.filter(project=>!linked.has(project.id)&&
  (!filter.category||DISCOVERY_CATEGORY[project.category]===filter.category)&&
  (!query||(project.title+' '+project.summary).toLowerCase().includes(query)));
}
