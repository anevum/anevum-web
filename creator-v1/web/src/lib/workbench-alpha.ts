import type {StudioDraft,StudioProject} from './canonical-studio';
import {readWithDeadline} from '../../../shared/read-deadline.mjs';
export const workbenchAlphaEnabled=import.meta.env.VITE_CREATOR_WORKBENCH_ALPHA==='true';
const ROOT='/api/v1/member/workbench';
export interface Access {memberId:string;allowed:boolean;canManage:boolean;level:'owner'|'tester'|'none';expiresAt:number|null;pilotCap:number;capabilities:{ai:false;publish:false;codeExecution:false}}
export interface Pilot {memberId:string;handle:string;displayName?:string;revision:number;enabled:number;expiresAt:number|null}
export class WorkbenchError extends Error {constructor(public status:number,message:string){super(message);this.name='WorkbenchError';}}
async function request<T>(path:string,method='GET',body?:unknown,signal?:AbortSignal,bounded=false):Promise<T>{
 if(method==='GET'&&!bounded)return readWithDeadline(next=>request<T>(path,method,body,next,true),signal);
 const r=await fetch(ROOT+path,{method,signal,credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',
  headers:{accept:'application/json',...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 let data:unknown;
 try{if(!r.headers.get('content-type')?.includes('application/json'))throw Error();data=await r.json();}
 catch{throw new WorkbenchError(r.ok?503:r.status,'Workbench is unavailable in this environment.');}
 if(!r.ok){const text=(data as {error?:unknown})?.error;throw new WorkbenchError(r.status,typeof text==='string'&&text.length<400?text:'Workbench request could not be completed.');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new WorkbenchError(503,'Invalid Workbench response.');
 return data as T;
}
export async function workbenchAccess(memberId:string,signal?:AbortSignal){
 const a=await request<Access>('/status','GET',undefined,signal);
 if(a.memberId!==memberId||typeof a.allowed!=='boolean'||typeof a.canManage!=='boolean')throw new WorkbenchError(403,'Member identity changed. Sign in again.');
 return a;
}
const id=(s:string)=>{if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s))throw Error('Invalid project ID');return s;};
export const workbenchList=(signal?:AbortSignal)=>request<{projects:StudioProject[]}>('/projects','GET',undefined,signal);
export const workbenchGet=(key:string,signal?:AbortSignal)=>request<{project:StudioProject}>('/projects/'+id(key),'GET',undefined,signal);
export const workbenchCreate=(draft:StudioDraft,clientRequestId:string)=>request<{project:StudioProject}>('/projects','POST',{draft,clientRequestId:id(clientRequestId)});
export const workbenchSave=(key:string,revision:number,draft:StudioDraft)=>request<{project:StudioProject}>('/projects/'+id(key),'PATCH',{revision,draft});
export const workbenchRoster=(signal?:AbortSignal)=>request<{members:Pilot[];pilotCap:number}>('/access','GET',undefined,signal);
export const workbenchFind=(handle:string)=>request<{member:Pilot}>('/member?handle='+encodeURIComponent(handle));
export const workbenchGrant=(p:Pilot,action:'grant'|'revoke',days:number,reason:string)=>request<{ok:boolean}>('/access','POST',{memberId:p.memberId,expectedRevision:p.revision,action,days,reason});
