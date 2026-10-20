export const nativeCreatorEnabled=import.meta.env.VITE_NATIVE_CREATOR_STUDIO_V095==='true';
export const PACKAGE_API='/upload/v3/api/v1/packages';
export const LEGACY_PACKAGE_REVIEW='/upload/v3/review';
export const packageId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
export const nativePlayerPath=(id:string,preview=false)=>{
 if(!packageId(id))throw Error('Invalid project identifier.');
 return '/projects/package/'+id+(preview?'?preview=1':'');
};
export const nativeBuildPath=(id:string)=>{
 if(!packageId(id))throw Error('Invalid project identifier.');
 return '/studio/packages/'+id;
};
export type PackageCategory='game'|'app'|'simulation'|'story';
export interface NativeSession{contract:'native-creator-v095';memberId:string;canUpload:boolean;canReview:boolean;resourceProtection:boolean}
export interface NativeProject{
 id:string;title:string;summary:string;category:PackageCategory;status:string;version:number|null;
 updatedAt:number|null;publishedAt:number|null;coverUrl:string|null;liveReleaseId:string|null;
 draftReleaseId?:string|null;draftStatus?:string|null;draftTitle?:string|null;
 draftSummary?:string|null;draftCategory?:PackageCategory|null;retention?:'test'|'saved'|null;
 expiresAt?:number|null;reviewReason?:string|null;
}
export interface NativeUsage{memberPhysicalBytes:number;memberPhysicalLimit:number;pilotPhysicalBytes:number;pilotPhysicalLimit:number;cleanupPending:number}
export interface NativeLibrary{contract:'native-creator-v095';memberId:string;projects:NativeProject[];usage:NativeUsage|null}
export interface NativeQueue{contract:'native-creator-v095';memberId:string;pending:NativeProject[];moderation:NativeProject[]}
export interface NativePlayback{
 contract:'native-creator-v095';project:NativeProject;preview:boolean;
 release:{id:string;version:number;status:string;fileCount:number;expandedBytes:number;archiveSha256:string|null};
 canEdit:boolean;canReview:boolean;runtimeUrl:string;expiresAt:number|null;
}
export class CreatorRequestError extends Error{status:number;constructor(message:string,status:number){super(message);this.name='CreatorRequestError';this.status=status;}}
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const string=(v:unknown,max=1000):v is string=>typeof v==='string'&&v.length<=max;
const nonnegative=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const optionalId=(v:unknown)=>v===undefined||v===null||(typeof v==='string'&&packageId(v));
export function validNativeProject(value:unknown):value is NativeProject{
 if(!object(value)||typeof value.id!=='string'||!packageId(value.id)||!string(value.title,100)||!string(value.summary,500)||!['game','app','simulation','story'].includes(String(value.category)))return false;
 if(!['draft','ready','pending_review','published','rejected','suspended'].includes(String(value.status)))return false;
 if(!optionalId(value.liveReleaseId)||!optionalId(value.draftReleaseId))return false;
 if(value.version!==null&&(!nonnegative(value.version)||value.version<1))return false;
 if(value.coverUrl!==null&&!(typeof value.coverUrl==='string'&&/^\/upload\/v3\/api\/v1\/packages\/covers\/[0-9a-f-]{36}$/.test(value.coverUrl)))return false;
 for(const key of ['updatedAt','publishedAt','expiresAt'])if(value[key]!=null&&!nonnegative(value[key]))return false;
 return value.reviewReason==null||string(value.reviewReason,1000);
}
/** This is a reviewed execution host, never a user-provided iframe URL.
 * Queries, fragments, credentials and all other origins are refused. */
export function validRuntimeURL(value:unknown,releaseId:string,preview:boolean):value is string{
 if(typeof value!=='string'||!packageId(releaseId))return false;
 try{
  const u=new URL(value);
  if(u.origin!=='https://anevum-package-alpha-v003-runtime.devonakins.workers.dev'||u.username||u.password||u.search||u.hash)return false;
  return preview?new RegExp('^/p/'+releaseId+'/[a-f0-9]{64}/index\\.html$').test(u.pathname):u.pathname==='/r/'+releaseId+'/index.html';
 }catch{return false;}
}
async function request(path:string,options:{signal?:AbortSignal;body?:FormData|Record<string,unknown>}={}):Promise<unknown>{
 if(!/^(?:native\/)?[a-z0-9/_-]+(?:\?preview=1)?$/.test(path)||path.includes('..'))throw Error('Invalid Creator Studio request.');
 const write=options.body!==undefined,multipart=options.body instanceof FormData;
 let res:Response;
 try{res=await fetch(PACKAGE_API+'/'+path,{method:write?'POST':'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal:options.signal,
  headers:{accept:'application/json',...(write?{'x-anevum-package':'v003'}:{}),...(write&&!multipart?{'content-type':'application/json'}:{})},
  ...(write?{body:multipart?options.body as FormData:JSON.stringify(options.body)}:{})});}
 catch(e){if(options.signal?.aborted)throw e;throw new CreatorRequestError(write?'The result could not be confirmed. Check your build library before retrying; nothing was automatically resubmitted.':'Creator Studio could not be reached. Your work has not changed.',0);}
 const type=res.headers.get('content-type')||'';
 if(!type.toLowerCase().includes('application/json'))throw new CreatorRequestError(res.status===404?'This integration is not active on the current deployment.':'The service returned an unexpected response. Sign in or retry.',res.status);
 const raw=await res.text();if(raw.length>1048576)throw new CreatorRequestError('The response exceeded the allowed size.',502);
 let value:unknown;try{value=JSON.parse(raw);}catch{throw new CreatorRequestError('The service returned invalid project data.',502);}
 if(!res.ok)throw new CreatorRequestError(object(value)&&string(value.error,1000)?value.error:'Creator request failed ('+res.status+').',res.status);
 return value;
}
function contract(v:unknown):asserts v is Record<string,unknown>{if(!object(v)||v.contract!=='native-creator-v095')throw new CreatorRequestError('The native Studio service is not ready for this interface.',503);}
function identity(v:Record<string,unknown>,expected:string){if(v.memberId!==expected)throw new CreatorRequestError('The signed-in account changed. Reload your Studio.',401);}
export async function readNativeSession(memberId:string,signal?:AbortSignal):Promise<NativeSession>{
 const v=await request('native/session',{signal});contract(v);identity(v,memberId);
 if(typeof v.canUpload!=='boolean'||typeof v.canReview!=='boolean'||typeof v.resourceProtection!=='boolean')throw Error('Invalid permission response.');
 return v as unknown as NativeSession;
}
export async function readNativeLibrary(memberId:string,signal?:AbortSignal):Promise<NativeLibrary>{
 const v=await request('native/mine',{signal});contract(v);identity(v,memberId);
 if(!Array.isArray(v.projects)||v.projects.length>50||!v.projects.every(validNativeProject))throw Error('Invalid build inventory.');
 if(v.usage!==null&&(!object(v.usage)||!['memberPhysicalBytes','memberPhysicalLimit','pilotPhysicalBytes','pilotPhysicalLimit','cleanupPending'].every(k=>nonnegative((v.usage as Record<string,unknown>)[k]))))throw Error('Invalid storage response.');
 return v as unknown as NativeLibrary;
}
export async function readNativeQueue(memberId:string,signal?:AbortSignal):Promise<NativeQueue>{
 const v=await request('native/review',{signal});contract(v);identity(v,memberId);
 if(!Array.isArray(v.pending)||v.pending.length>100||!v.pending.every(validNativeProject)||!Array.isArray(v.moderation)||v.moderation.length>75||!v.moderation.every(validNativeProject))throw Error('Invalid review inventory.');
 return v as unknown as NativeQueue;
}
export async function readNativePlayback(id:string,preview:boolean,signal?:AbortSignal):Promise<NativePlayback>{
 if(!packageId(id))throw Error('Invalid project identifier.');
 const v=await request('native/projects/'+id+(preview?'?preview=1':''),{signal});contract(v);
 if(!validNativeProject(v.project)||v.project.id!==id||!object(v.release)||typeof v.release.id!=='string'||!packageId(v.release.id)||v.preview!==preview||typeof v.canEdit!=='boolean'||typeof v.canReview!=='boolean'||!validRuntimeURL(v.runtimeUrl,v.release.id,preview))throw Error('The player response could not be verified.');
 if(!nonnegative(v.release.version)||v.release.version<1||!nonnegative(v.release.fileCount)||!nonnegative(v.release.expandedBytes))throw Error('Invalid release inventory.');
 if(v.release.archiveSha256!==null&&!(typeof v.release.archiveSha256==='string'&&/^[a-f0-9]{64}$/.test(v.release.archiveSha256)))throw Error('Invalid release hash.');
 if(preview&&(!nonnegative(v.expiresAt)||v.expiresAt<=Date.now()/1000))throw Error('The private playtest expired. Reopen it from your Studio.');
 return v as unknown as NativePlayback;
}
export async function uploadNativeBuild(form:FormData):Promise<{id:string;release_id:string}>{
 const v=await request('upload',{body:form});
 if(!object(v)||typeof v.id!=='string'||!packageId(v.id)||typeof v.release_id!=='string'||!packageId(v.release_id))throw new CreatorRequestError('Upload status is uncertain. Check your build library before retrying.',502);
 return {id:v.id,release_id:v.release_id};
}
export type BuildAction='save'|'submit'|'discard'|'delete'|'publish'|'reject'|'suspend'|'restore';
export async function nativeBuildAction(id:string,releaseId:string,action:BuildAction,reason=''):Promise<void>{
 if(!packageId(id)||!packageId(releaseId))throw Error('Invalid release identifier.');
 const endpoint=['publish','reject'].includes(action)?'review':['suspend','restore'].includes(action)?'moderate':action;
 await request('projects/'+id+'/'+endpoint,{body:{action,reason,expected_release_id:releaseId}});
}
export function checkNativeFile(file:File|null):string{
 if(!file)return 'Choose a ZIP or self-contained HTML file.';
 if(!/\.(zip|html)$/i.test(file.name))return 'Upload the exported browser build, not a source project or native executable.';
 if(!file.size)return 'The selected file is empty.';
 const html=/\.html$/i.test(file.name);return file.size>(html?5:20)*1048576?'This '+(html?'HTML file exceeds 5 MiB.':'ZIP exceeds 20 MiB.') :'';
}
