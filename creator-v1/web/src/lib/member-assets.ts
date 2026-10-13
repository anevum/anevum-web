import {memberProjectId,MemberApiError} from "./member-api";
import {classifyFile} from "./upload-policy";
export interface CreatorAsset {id:string;name:string;kind:string;contentType:string;sizeBytes:number;status:string;sha256:string|null}
const idPattern=/^[a-f0-9]{32}$/;
function path(projectId:string,assetId?:string){
  const prefix="/api/v1/member/projects/"+memberProjectId(projectId)+"/assets";
  if(assetId&&!idPattern.test(assetId))throw Error("Invalid asset identifier");
  return prefix+(assetId?"/"+assetId:"");
}
async function result<T>(r:Response):Promise<T>{
  if(!r.ok){
    let error="Private upload service unavailable";
    if(r.status===401)error="Sign in to manage project files";
    if(r.status===403)error="Access to these project files is denied";
    if(r.status===409)error="The project or upload has changed. Refresh before retrying.";
    if(r.status===413)error="File exceeds the upload limit";
    if(r.status===503)error="Private uploads are not enabled on this staging environment";
    throw new MemberApiError(r.status,error);
  }
  if(!r.headers.get("content-type")?.toLowerCase().includes("application/json"))throw new MemberApiError(503,"Unexpected upload response");
  return r.json() as Promise<T>;
}
export async function listPrivateAssets(projectId:string):Promise<{assets:CreatorAsset[]}> {
  return result(await fetch(path(projectId),{credentials:"same-origin",mode:"same-origin",redirect:"error",cache:"no-store",headers:{Accept:"application/json"}}));
}
export async function uploadPrivateAsset(projectId:string,file:File,signal?:AbortSignal):Promise<void>{
  const c=classifyFile(file);
  if(!c.ok)throw Error(c.reason);
  const reserved=await result<{id:string}>(await fetch(path(projectId),{
    method:"POST",credentials:"same-origin",mode:"same-origin",redirect:"error",cache:"no-store",signal,
    headers:{"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({name:file.name,sizeBytes:file.size,contentType:c.contentType})
  }));
  if(!idPattern.test(reserved.id))throw new MemberApiError(503,"Invalid upload reservation");
  await result(await fetch(path(projectId,reserved.id),{
    method:"PUT",credentials:"same-origin",mode:"same-origin",redirect:"error",cache:"no-store",signal,
    headers:{"Content-Type":"application/octet-stream",Accept:"application/json"},
    body:file
  }));
}
