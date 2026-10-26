// Canonical Better Auth Creator Studio. Does NOT use legacy Creator V1 identity.
// All server mutations bind ownership from the HttpOnly canonical session.
const ROOT='/api/v1/member/studio';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ASSET=/^[a-f0-9]{32}$/;
export type StudioCategory='games'|'tools'|'creative'|'music'|'art'|'video'|'writing'|'learning'|'research'|'other';
export type StudioStatus='draft'|'pending_review'|'changes_requested'|'rejected';
export interface StudioDraft {
 slug:string;title:string;summary:string;description:string;category:StudioCategory;
 freeToUse:boolean;license:string;sourceUrl:string|null;demoUrl:string|null;
 aiDisclosure:string;humanContribution:string;
}
export interface StudioProject extends StudioDraft {
 id:string;status:StudioStatus;revision:number;createdAt:number;updatedAt:number;submittedAt:number|null;
}
export interface StudioReviewHistory {action:'changes_requested'|'rejected';reason:string;createdAt:number;submissionId:string|null}
export interface StudioReviewReceipt extends StudioDraft {
 id:string;projectId:string;revision:number;status:'pending_review'|'withdrawn'|'changes_requested'|'rejected';
 submittedAt:number;resolvedAt:number|null;
 assets:Array<Pick<StudioAsset,'id'|'name'|'kind'|'contentType'|'sizeBytes'|'sha256'> & {digestType?:'file-sha256'|'part-manifest'}>;
}
export interface StudioReviewManifest {
 projectId:string;revision:number;note:string;assets:StudioAsset[];
}
const UPLOAD_KINDS:Record<StudioCategory,StudioAsset['kind'][]>={
 games:['package'],tools:['package'],creative:['image','audio','document','package'],
 music:['audio'],art:['image'],video:['video'],writing:['document'],
 learning:['document','package'],research:['document','package'],
 other:['image','audio','document','package']
};
export function studioEligibleUpload(category:StudioCategory,kind:StudioAsset['kind']):boolean{
 return UPLOAD_KINDS[category].includes(kind);
}
export interface StudioAsset {
 id:string;name:string;kind:'image'|'audio'|'video'|'document'|'package';
 contentType:string;sizeBytes:number;status:'reserved'|'uploading'|'quarantined'|'deleting';
 sha256:string|null;uploadedAt:number|null;
}
export interface StudioHealth {
 service:string;status:string;studioReady?:boolean;studioUploadsReady?:boolean;
}
export class StudioError extends Error{
 constructor(readonly status:number,message:string){super(message);this.name='StudioError';}
}
function validId(id:string){if(!UUID.test(id))throw Error('Invalid Studio project identifier');return id;}
function validAsset(id:string){if(!ASSET.test(id))throw Error('Invalid private file identifier');return id;}
function projectPath(id?:string){return ROOT+'/projects'+(id?'/'+validId(id):'');}
function responseError(status:number,message?:string):StudioError{
 const standard=status===401?'Sign in to open your Creator Studio.':
 status===403?'Your account cannot access this private project.':
 status===404?'This Studio feature or project is unavailable.':
 status===409?'The project changed, is locked, or a storage limit was reached. Reload to continue.':
 status===413?'File exceeds the upload limit.':
 status===422?'Some information or file contents do not meet the upload requirements.':
 status===429?'Too many changes. Try again later.':
 'The Studio service is not available in this environment.';
 return new StudioError(status,message&&message.length<300?message:standard);
}
async function read<T>(r:Response):Promise<T>{
 if(!r.ok){
  let data:unknown=null;
  try{data=await r.json();}catch{/* non-JSON errors fail closed */}
  const message=data&&typeof data==='object'&&!Array.isArray(data)?(data as {error?:unknown}).error:null;
  throw responseError(r.status,typeof message==='string'?message:undefined);
 }
 if(!r.headers.get('content-type')?.toLowerCase().includes('application/json'))
  throw new StudioError(503,'Unexpected Creator Studio response.');
 const data:unknown=await r.json();
 if(!data||typeof data!=='object'||Array.isArray(data))
  throw new StudioError(503,'Invalid Creator Studio response.');
 return data as T;
}
async function request<T>(path:string,method:'GET'|'POST'|'PATCH'|'PUT'|'DELETE'='GET',
 payload?:unknown,signal?:AbortSignal):Promise<T>{
 const binary=payload instanceof Blob;
 const init:RequestInit={
  method,signal,credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',
  headers:{Accept:'application/json',...(method!=='GET'?{'Content-Type':binary?'application/octet-stream':'application/json'}:{})},
  ...(method==='GET'?{}:{body:binary?payload:JSON.stringify(payload??{})})
 };
 return read<T>(await fetch(path,init));
}
export const studioHealth=async(signal?:AbortSignal):Promise<StudioHealth>=>
 read<StudioHealth>(await fetch('/api/v1/member/health',{credentials:'same-origin',mode:'same-origin',cache:'no-store',redirect:'error',signal}));
export const studioList=(signal?:AbortSignal)=>request<{projects:StudioProject[];uploadsReady:boolean;canReview:boolean}>(projectPath(), 'GET',undefined,signal);
export const studioGet=(id:string,signal?:AbortSignal)=>request<{project:StudioProject;uploadsReady:boolean;reviewHistory:StudioReviewHistory[]}>(projectPath(id),'GET',undefined,signal);
export const studioCreate=(draft:StudioDraft,clientRequestId:string)=>request<{project:StudioProject;replayed:boolean}>(projectPath(),'POST',{draft,clientRequestId:validId(clientRequestId)});
export const studioUpdate=(id:string,revision:number,draft:StudioDraft)=>request<{project:StudioProject}>(projectPath(id),'PATCH',{revision,draft});
export const studioSubmit=(id:string,revision:number)=>request<{project:StudioProject;note:string}>(projectPath(id)+'/submit','POST',{revision});
export const studioWithdraw=(id:string,revision:number)=>request<{project:StudioProject}>(projectPath(id)+'/withdraw','POST',{revision});
export const studioReviewReceipts=(id:string,signal?:AbortSignal)=>
 request<{submissions:StudioReviewReceipt[];note:string}>(projectPath(id)+'/submissions','GET',undefined,signal);
export const studioDeleteProject=(id:string,revision:number)=>request<{deleted:boolean}>(projectPath(id),'DELETE',{revision});
function assetsPath(projectId:string,assetId?:string){return projectPath(projectId)+'/assets'+(assetId?'/'+validAsset(assetId):'');}
export const studioAssets=(projectId:string,signal?:AbortSignal)=>
 request<{assets:StudioAsset[];quotaBytes:number;projectAssetLimit:number;
  memberUsedBytes:number;projectUsedBytes:number;globalUsedBytes:number;globalQuotaBytes:number;
  storageReady:boolean;uploadsReady:boolean}>(
  assetsPath(projectId),'GET',undefined,signal);
const LIMITS:Record<string,[string,number]>={
 png:['image/png',10],jpg:['image/jpeg',10],jpeg:['image/jpeg',10],webp:['image/webp',10],
 gif:['image/gif',10],mp3:['audio/mpeg',20],wav:['audio/wav',20],
 mp4:['video/mp4',20],webm:['video/webm',20],pdf:['application/pdf',10],
 txt:['text/plain',1],md:['text/markdown',1],zip:['application/zip',20]
};
export function studioCheckFile(file:File):{ok:true;contentType:string;kind:string}|{ok:false;reason:string}{
 if(file.name.length<1||file.name.length>160||/[\\/\u0000-\u001f\u007f]/.test(file.name)||file.name.startsWith('.')||file.name.includes('..'))
  return {ok:false,reason:'Filename is not permitted.'};
 const ext=file.name.split('.').at(-1)?.toLowerCase()||'',rule=LIMITS[ext];
 if(!rule)return {ok:false,reason:'Supported: PNG, JPG, WebP, GIF, MP3, WAV, MP4, WebM, PDF, TXT, MD and ZIP.'};
 if(file.size<1||file.size>rule[1]*1048576)return {ok:false,reason:'This file exceeds its '+rule[1]+' MiB limit.'};
 // The server validates binary signatures. Do not trust the browser MIME claim.
 if(file.type&&file.type!==rule[0]&&!(ext==='md'&&file.type==='text/plain')&&!(ext==='zip'&&file.type==='application/x-zip-compressed'))
  return {ok:false,reason:'This extension and file type do not match.'};
 const kind=['png','jpg','jpeg','webp','gif'].includes(ext)?'image':
 ['mp3','wav'].includes(ext)?'audio':['mp4','webm'].includes(ext)?'video':
 ext==='zip'?'package':'document';
 return {ok:true,contentType:rule[0],kind};
}
export async function studioUpload(projectId:string,file:File,signal?:AbortSignal){
 const checked=studioCheckFile(file);if(!checked.ok)throw Error(checked.reason);
 const reserved=await request<{id:string}>(assetsPath(projectId),'POST',
  {name:file.name,sizeBytes:file.size,contentType:checked.contentType},signal);
 if(!ASSET.test(reserved.id))throw Error('Invalid upload reservation from server');
 return request<{id:string;status:string;sha256:string}>(assetsPath(projectId,reserved.id),'PUT',file,signal);
}
export const studioDeleteAsset=(id:string,assetId:string)=>
 request<{deleted:boolean;withdrawnFromReview:boolean}>(assetsPath(id,assetId),'DELETE');
export const studioDownloadUrl=(id:string,assetId:string)=>assetsPath(id,assetId)+'/file';

export interface StudioReviewProject{
 id:string;title:string;summary:string;category:string;status:string;revision:number;
 submitted_at:number;demo_url:string|null;source_url:string|null;
 attachment_count:number;attachment_bytes:number;
 license_name:string;ai_disclosure:string;human_contribution:string;user_id:string;handle:string;
}
export const studioReviewQueue=(signal?:AbortSignal)=>
 request<{projects:StudioReviewProject[]}>(ROOT+'/review','GET',undefined,signal);
export const studioReviewManifest=(id:string,signal?:AbortSignal)=>
 request<StudioReviewManifest>(ROOT+'/review/'+validId(id)+'/manifest','GET',undefined,signal);
export const studioReviewDecision=(projectId:string,revision:number,action:'changes_requested'|'rejected',reason:string)=>
 request<{ok:boolean;status:string}>(ROOT+'/review','POST',{projectId:validId(projectId),revision,action,reason});


// Same canonical Studio account, additive resumable channel for large R2
// packages and motion media. Files remain private/untrusted after completion.
export interface StudioLargeAsset {
 id:string;name:string;kind:'package'|'video';contentType:string;
 sizeBytes:number;partCount:number;completedParts:number;
 status:'reserved'|'uploading'|'quarantined'|'deleting';
 manifestSha256:string|null;uploadedAt:number|null;
}
export interface StudioLargeUsage {
 assets:StudioLargeAsset[];memberUsedBytes:number;globalUsedBytes:number;
 projectUsedBytes:number;memberCapacityBytes:number;globalCapacityBytes:number;
 maxFileBytes:number;partSizeBytes:number;uploadsReady:boolean;storageReady:boolean;
 mode:'private-quarantine';
}
const LARGE_MIN=20*1048576,LARGE_MAX=1073741824;
const LARGE_FORMATS:Record<string,string>={
 zip:'application/zip',mp4:'video/mp4',webm:'video/webm'
};
const largePath=(projectId:string,assetId?:string,action?:string)=>
 projectPath(projectId)+'/assets-large'+(assetId?'/'+validAsset(assetId):'')+
 (action?'/'+action:'');
export const studioLargeAssets=(projectId:string,signal?:AbortSignal)=>
 request<StudioLargeUsage>(largePath(projectId),'GET',undefined,signal);
export function studioCheckLargeFile(file:File):{ok:true;contentType:string}|{ok:false;reason:string}{
 if(file.name.length<5||file.name.length>160||/[\\/\u0000-\u001f\u007f]/.test(file.name)||
  file.name.startsWith('.')||file.name.includes('..'))return {ok:false,reason:'Invalid filename.'};
 const ext=file.name.split('.').at(-1)?.toLowerCase()||'',mime=LARGE_FORMATS[ext];
 if(!mime)return {ok:false,reason:'Large uploads currently accept ZIP, MP4 and WebM.'};
 if(file.size<=LARGE_MIN||file.size>LARGE_MAX)
  return {ok:false,reason:'Use the standard vault for files up to 20 MiB; large files must be at most 1 GiB.'};
 if(file.type&&file.type!==mime&&!(ext==='zip'&&file.type==='application/x-zip-compressed'))
  return {ok:false,reason:'File extension and MIME type differ.'};
 return {ok:true,contentType:mime};
}
function hashHex(bytes:ArrayBuffer){
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function studioUploadLarge(
 projectId:string,file:File,
 onProgress?:(uploadedBytes:number,totalBytes:number)=>void,
 signal?:AbortSignal,resumeId?:string
):Promise<{id:string;status:'quarantined';manifestSha256:string}>{
 const allowed=studioCheckLargeFile(file);
 if(!allowed.ok)throw Error(allowed.reason);
 const reserved=resumeId?{id:validAsset(resumeId)}:
  await request<{id:string}>(largePath(projectId),'POST',
   {name:file.name,sizeBytes:file.size,contentType:allowed.contentType},signal);
 const path=largePath(projectId,reserved.id);
 const started=await request<{partSize:number;partCount:number}>(path+'/start','POST',{},signal);
 if(started.partSize!==8388608||started.partCount!==Math.ceil(file.size/8388608))
  throw new StudioError(503,'Upload session parameters changed; do not resume this file.');
 const remote=await request<{completedParts:{partNumber:number;sizeBytes:number;sha256:string}[]}>(path+'/parts','GET',undefined,signal);
 const existing=new Map(remote.completedParts.map(part=>[part.partNumber,part]));
 if(existing.size!==remote.completedParts.length)throw new StudioError(503,'Duplicate remote part receipts.');
 let completed=0;
 for(let index=1;index<=started.partCount;index++){
  if(signal?.aborted)throw new DOMException('Upload cancelled','AbortError');
  const begin=(index-1)*started.partSize,end=Math.min(file.size,index*started.partSize);
  const part=existing.get(index),data=file.slice(begin,end);
  if(part){
   if(part.sizeBytes!==data.size)throw new StudioError(409,'Resume file length differs from the saved upload.');
   const digest=hashHex(await crypto.subtle.digest('SHA-256',await data.arrayBuffer()));
   if(digest!==part.sha256)throw new StudioError(409,'Resume file content differs; restart with the original file.');
  }else await request<{partNumber:number;sha256:string}>(path+'/parts/'+index,'PUT',data,signal);
  completed=end;onProgress?.(completed,file.size);
 }
 const result=await request<{id:string;status:string;manifestSha256:string}>(path+'/complete','POST',{},signal);
 if(result.id!==reserved.id||result.status!=='quarantined'||!/^[a-f0-9]{64}$/.test(result.manifestSha256))
  throw new StudioError(503,'Private upload completion could not be verified.');
 return {id:reserved.id,status:'quarantined',manifestSha256:result.manifestSha256};
}
export const studioDeleteLargeAsset=(projectId:string,assetId:string)=>
 request<{deleted:boolean;withdrawnFromReview:boolean}>(largePath(projectId,assetId),'DELETE');
export const studioDownloadLargeUrl=(projectId:string,assetId:string)=>
 largePath(projectId,assetId,'file');
