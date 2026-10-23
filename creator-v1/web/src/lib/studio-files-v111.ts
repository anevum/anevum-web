// W111 source tree: canonical member-session API. No project data is cached in
// browser storage and no text file can execute in the authenticated Studio origin.
const BASE='/api/v1/member/studio/projects';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const studioFileTreeEnabled=import.meta.env.VITE_CREATOR_FILE_TREE_V111==='true';
export type StudioNodeKind='folder'|'text';
export type StudioFileNode={
 id:string;projectId:string;parentId:string|null;name:string;kind:StudioNodeKind;
 revision:number;deletedAt:number|null;updatedAt:number;content?:string|null
};
export type StudioFileVersion={
 revision:number;name:string;parent_id:string|null;content:string;
 deleted_at:number|null;changed_at:number
};
export class StudioFileError extends Error{
 constructor(readonly status:number,message:string){super(message);this.name='StudioFileError';}
}
const validId=(id:string)=>{if(typeof id!=='string'||!UUID.test(id))throw new StudioFileError(400,'Invalid project or file identifier.');return id;};
const fileRoot=(projectId:string)=>BASE+'/'+validId(projectId)+'/files';
const nodePath=(projectId:string,nodeId:string)=>fileRoot(projectId)+'/'+validId(nodeId);
function validNode(node:unknown,contentRequired=false):node is StudioFileNode{
 if(!node||typeof node!=='object'||Array.isArray(node))return false;
 const n=node as Record<string,unknown>;
 return typeof n.id==='string'&&UUID.test(n.id)&&typeof n.projectId==='string'&&UUID.test(n.projectId)&&
  (n.parentId===null||(typeof n.parentId==='string'&&UUID.test(n.parentId)))&&
  typeof n.name==='string'&&n.name.length>0&&n.name.length<=80&&
  (n.kind==='folder'||n.kind==='text')&&Number.isSafeInteger(n.revision)&&Number(n.revision)>=1&&
  (n.deletedAt===null||Number.isSafeInteger(n.deletedAt))&&Number.isSafeInteger(n.updatedAt)&&
  (!contentRequired||typeof n.content==='string'||(n.kind==='folder'&&n.content===null));
}
function validVersion(version:unknown):version is StudioFileVersion{
 if(!version||typeof version!=='object'||Array.isArray(version))return false;
 const v=version as Record<string,unknown>;
 return Number.isSafeInteger(v.revision)&&Number(v.revision)>0&&
  typeof v.name==='string'&&typeof v.content==='string'&&
  (v.parent_id===null||(typeof v.parent_id==='string'&&UUID.test(v.parent_id)))&&
  (v.deleted_at===null||Number.isSafeInteger(v.deleted_at))&&Number.isSafeInteger(v.changed_at);
}
async function api(path:string,method:'GET'|'POST'|'PATCH'='GET',body?:unknown,signal?:AbortSignal):Promise<Record<string,unknown>>{
 let response:Response;
 try{response=await fetch(path,{
  method,credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',signal,
  headers:{accept:'application/json',...(method==='GET'?{}:{'content-type':'application/json'})},
  ...(method==='GET'?{}:{body:JSON.stringify(body)})
 });}
 catch(e){if(signal?.aborted)throw e;throw new StudioFileError(0,'File service could not be reached. Your unsaved work remains in this editor.');}
 let data:unknown=null;
 try{
  if(!response.headers.get('content-type')?.toLowerCase().includes('application/json'))
   throw Error('Non-JSON response');
  const raw=await response.text();if(raw.length>850000)throw Error('Oversized response');
  data=JSON.parse(raw);
 }catch{throw new StudioFileError(response.status,'File service returned an invalid response. No save has been confirmed.');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new StudioFileError(response.status,'File service returned malformed data.');
 const obj=data as Record<string,unknown>;
 if(!response.ok){
  const message=response.status===404?'Private files are unavailable or you cannot access this resource.':
   response.status===409?'This file changed, conflicts with another file, or the project is locked for review.':
   response.status===413?'The private source storage limit was reached.':
   response.status===422?'The file name or source contents are invalid.':
   response.status===503?'File storage has not yet been enabled in this environment.':
   response.status===401||response.status===403?'Verified member permission is required.':
   'File operation failed. Your unsaved source remains in this editor.';
  throw new StudioFileError(response.status,message);
 }
 return obj;
}
export async function studioFileList(projectId:string,signal?:AbortSignal):Promise<StudioFileNode[]>{
 const data=await api(fileRoot(projectId),'GET',undefined,signal);
 if(!Array.isArray(data.nodes)||data.nodes.length>101||
  !data.nodes.every(n=>validNode(n)&&n.projectId===projectId&&n.deletedAt===null))
  throw new StudioFileError(503,'Invalid private file listing.');
 return data.nodes as StudioFileNode[];
}
export async function studioFileGet(projectId:string,nodeId:string,signal?:AbortSignal):Promise<StudioFileNode>{
 const data=await api(nodePath(projectId,nodeId),'GET',undefined,signal);
 if(!validNode(data.node,true)||data.node.projectId!==projectId||data.node.id!==nodeId)
  throw new StudioFileError(503,'File contents could not be verified.');
 return data.node;
}
export async function studioFileCreate(projectId:string,kind:StudioNodeKind,name:string,parentId:string|null,requestId:string){
 const data=await api(fileRoot(projectId),'POST',{kind,name,parentId:parentId===null?null:validId(parentId),clientRequestId:validId(requestId)});
 if(!validNode(data.node,true)||data.node.projectId!==projectId)
  throw new StudioFileError(503,'Creation response could not be verified. Check the file list before retrying.');
 return{node:data.node,replayed:data.replayed===true};
}
export async function studioFileUpdate(projectId:string,nodeId:string,input:{
 revision:number;name:string;parentId:string|null;content:string;deleted:boolean
}):Promise<StudioFileNode>{
 if(new TextEncoder().encode(input.content).length>32768)throw new StudioFileError(413,'Individual text files must stay under 32 KiB.');
 const data=await api(nodePath(projectId,nodeId),'PATCH',input);
 if(!validNode(data.node,true)||data.node.id!==nodeId||data.node.projectId!==projectId||
    data.node.revision!==input.revision+1)
  throw new StudioFileError(503,'Saving returned an unexpected revision. Reload history before retrying.');
 return data.node;
}
export async function studioFileVersions(projectId:string,nodeId:string,signal?:AbortSignal){
 const data=await api(nodePath(projectId,nodeId)+'/versions','GET',undefined,signal);
 if(!Array.isArray(data.versions)||data.versions.length>12||!data.versions.every(validVersion))
  throw new StudioFileError(503,'File version history could not be verified.');
 return data.versions as StudioFileVersion[];
}

/** Metadata only. The server must not return deleted source bodies in bulk. */
export async function studioFileTrash(projectId:string,signal?:AbortSignal):Promise<StudioFileNode[]>{
 const data=await api(fileRoot(projectId)+'/trash','GET',undefined,signal);
 if(!Array.isArray(data.nodes)||data.nodes.length>250||
  !data.nodes.every(n=>validNode(n)&&n.projectId===projectId&&n.deletedAt!==null&&!('content' in n)))
  throw new StudioFileError(503,'Private Trash listing could not be verified.');
 return data.nodes as StudioFileNode[];
}
/** Restore a deleted item to its previous name and folder; conflicts fail closed. */
export async function studioFileRestore(projectId:string,nodeId:string,revision:number):Promise<StudioFileNode>{
 if(!Number.isSafeInteger(revision)||revision<1)throw new StudioFileError(400,'Invalid restore revision.');
 const data=await api(nodePath(projectId,nodeId)+'/restore','POST',{revision});
 if(!validNode(data.node,true)||data.node.projectId!==projectId||data.node.id!==nodeId||
    data.node.deletedAt!==null||data.node.revision!==revision+1)
  throw new StudioFileError(503,'Restore response could not be verified. Check your file tree.');
 return data.node;
}
