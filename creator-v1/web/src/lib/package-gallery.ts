/* V010 / ANEVUM approved package presence in canonical member worlds.
 * Every URL is same-origin. Public owner attribution and profile visibility are
 * enforced by the server, not by this client or by an author-submitted handle.
 */
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const CATEGORIES=new Set(['game','app','simulation','story']);
const COVER=/^\/upload\/v3\/api\/v1\/packages\/covers\/[a-f0-9-]{36}$/;
const PLAY=/^\/upload\/v3\/play\/[a-f0-9-]{36}$/;
const STATUS=new Set(['draft','pending_review','published','rejected','suspended']);
export type PackageWork = {
  id:string;title:string;summary:string;category:string;version:number;
  coverUrl:string|null;playUrl:string|null;status:string|null;
  pending:boolean;
};
export type PackageWorks = {handle:string|null;projects:PackageWork[]};
function record(x:unknown):x is Record<string,unknown>{
  return Boolean(x)&&typeof x==='object'&&!Array.isArray(x);
}
export function validCreatorHandle(handle:string){return HANDLE.test(handle);}
export function parsePackageWorks(value:unknown,handle:string,owner:boolean):PackageWorks|null{
  if(!validCreatorHandle(handle)||!record(value)||!Array.isArray(value.projects)||
    value.projects.length>25)return null;
  if(!owner&&value.handle!==handle)return null;
  const projects:PackageWork[]=[];
  const ids=new Set<string>();
  for(const entry of value.projects){
    if(!record(entry))return null;
    const id=entry.id,title=entry.title,summary=entry.summary,category=entry.category,version=entry.version;
    if(typeof id!=='string'||!UUID.test(id)||ids.has(id)||
      typeof title!=='string'||title.trim().length<3||title.length>100||
      typeof summary!=='string'||summary.length>500||
      typeof category!=='string'||!CATEGORIES.has(category)||
      typeof version!=='number'||!Number.isSafeInteger(version)||version<1)return null;
    ids.add(id);
    const cover=entry.cover_url,play=entry.play_url;
    if(cover!==null&&(typeof cover!=='string'||!COVER.test(cover)))return null;
    if(play!==null&&(typeof play!=='string'||!PLAY.test(play)||
      play!==('/upload/v3/play/'+id)))return null;
    const status=entry.status;
    if(owner&&status!==undefined&&(typeof status!=='string'||!STATUS.has(status)))return null;
    if(!owner&&(play===null||!Number.isSafeInteger(entry.published_at)||
      (entry.published_at as number)<=0||status!==undefined&&status!=='published'))return null;
    projects.push({
      id,title,summary,category,version,coverUrl:cover as string|null,
      playUrl:play as string|null,status:owner?(status as string??null):null,
      pending:owner&&typeof entry.draft_status==='string'&&
        ['ready','pending_review','rejected'].includes(entry.draft_status)
    });
  }
  return {handle:owner?null:handle,projects};
}
export async function requestPackageWorks(handle:string,owner:boolean,signal?:AbortSignal):Promise<PackageWorks|null>{
  if(!validCreatorHandle(handle))return null;
  const path=owner?'/upload/v3/api/v1/packages/mine':
    '/upload/v3/api/v1/packages/creators/'+handle+'/projects';
  let response:Response;
  try{
    response=await fetch(path,{
      method:'GET',mode:'same-origin',credentials:owner?'same-origin':'omit',
      redirect:'error',cache:'no-store',referrerPolicy:'same-origin',
      headers:{Accept:'application/json'},signal
    });
  }catch{
    if(signal?.aborted)return null;
    return null;
  }
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))return null;
  try {return parsePackageWorks(await response.json(),handle,owner);}
  catch{return null;}
}
