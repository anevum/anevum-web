import {normalizeAchievementDraft,UUID_V4,type AchievementDraft} from '../../../shared/creator-achievements-v114.mjs';
export type AchievementRecord=AchievementDraft&{id:string;projectId:string;revision:number;archivedAt:number|null;createdAt:number;updatedAt:number;status:'private_draft'};
export type AchievementHistory={revision:number;snapshot:AchievementDraft&{archivedAt:number|null};changedAt:number};
export type AchievementInventory={project:{id:string;title:string;status:string};achievements:AchievementRecord[];issuanceEnabled:false};
export interface AchievementTransport {
 list(projectId:string,signal:AbortSignal):Promise<AchievementInventory>;
 save(projectId:string,draft:AchievementDraft,options:{id?:string;revision?:number;archived?:boolean;clientRequestId?:string},signal:AbortSignal):Promise<AchievementRecord>;
 history(projectId:string,id:string,signal:AbortSignal):Promise<AchievementHistory[]>;
}
export class AchievementError extends Error {constructor(readonly status:number,message:string){super(message);this.name='AchievementError';}}
const validId=(s:string)=>{if(!UUID_V4.test(s))throw new AchievementError(400,'Invalid project or achievement identifier.');return s;};
const path=(projectId:string,id?:string)=>'/api/v1/member/studio/projects/'+validId(projectId)+'/achievements'+(id?'/'+validId(id):'');
async function request(url:string,method:'GET'|'POST'|'PATCH',body:unknown,signal:AbortSignal){
 const ac=new AbortController(),abort=()=>ac.abort();
 if(signal.aborted)ac.abort();else signal.addEventListener('abort',abort,{once:true});
 const timeout=setTimeout(abort,15000);
 try{
  const r=await fetch(url,{method,signal:ac.signal,mode:'same-origin',credentials:'same-origin',cache:'no-store',redirect:'error',referrerPolicy:'same-origin',
   headers:body===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json'},
   ...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!r.ok)throw new AchievementError(r.status,r.status===404?'Achievement drafts are not enabled or this project is unavailable.':
   r.status===409?'The saved revision, project review status, or draft limit changed. Reload before continuing.':
   r.status===429?'The private edit limit was reached. Try again later.':
   r.status===401||r.status===403?'Your verified session cannot access this project.':'Achievement drafts could not be confirmed.');
  if(!r.headers.get('content-type')?.includes('application/json'))throw new AchievementError(503,'Invalid draft response.');
  return await r.json() as Record<string,unknown>;
 }finally{clearTimeout(timeout);signal.removeEventListener('abort',abort);}
}
function record(raw:unknown,projectId:string):AchievementRecord{
 if(!raw||typeof raw!=='object')throw new AchievementError(503,'Invalid achievement record.');
 const r=raw as AchievementRecord;
 const draft=normalizeAchievementDraft({stableKey:r.stableKey,title:r.title,description:r.description,triggerKey:r.triggerKey,targetCount:r.targetCount,visibility:r.visibility,motif:r.motif,rewardLabel:r.rewardLabel});
 if(!UUID_V4.test(r.id)||r.projectId!==projectId||r.status!=='private_draft'||!Number.isSafeInteger(r.revision)||r.revision<1||
  !Number.isSafeInteger(r.createdAt)||r.createdAt<1||!Number.isSafeInteger(r.updatedAt)||r.updatedAt<r.createdAt||
  !(r.archivedAt===null||(Number.isSafeInteger(r.archivedAt)&&r.archivedAt>=r.createdAt)))throw new AchievementError(503,'Invalid private achievement identity.');
 return {...draft,id:r.id,projectId,revision:r.revision,createdAt:r.createdAt,updatedAt:r.updatedAt,archivedAt:r.archivedAt,status:'private_draft'};
}
export const studioAchievementApi:AchievementTransport={
 async list(projectId,signal){
  const data=await request(path(projectId),'GET',undefined,signal),p=data.project as AchievementInventory['project'];
  if(data.issuanceEnabled!==false||!p||p.id!==projectId||typeof p.title!=='string'||p.title.length>100||
   !['draft','pending_review','changes_requested','rejected'].includes(p.status)||!Array.isArray(data.achievements)||data.achievements.length>100)
   throw new AchievementError(503,'Invalid private achievement inventory.');
  const achievements=data.achievements.map(r=>record(r,projectId));
  if(new Set(achievements.map(r=>r.id)).size!==achievements.length)throw new AchievementError(503,'Duplicate achievement records.');
  return {project:{id:p.id,title:p.title,status:p.status},achievements,issuanceEnabled:false};
 },
 async save(projectId,draft,options,signal){
  const input=normalizeAchievementDraft(draft);
  if(options.id&&(!Number.isSafeInteger(options.revision)||Number(options.revision)<1))throw new AchievementError(400,'Invalid saved revision.');
  const data=await request(path(projectId,options.id),options.id?'PATCH':'POST',options.id?
   {revision:options.revision,draft:input,archived:options.archived===true}:
   {clientRequestId:validId(options.clientRequestId||''),draft:input},signal);
  const saved=record(data.achievement,projectId);
  if(options.id&&(saved.id!==options.id||saved.revision!==Number(options.revision)+1))throw new AchievementError(503,'Saved revision could not be verified. Reload before retrying.');
  return saved;
 },
 async history(projectId,id,signal){
  const data=await request(path(projectId,id)+'/versions','GET',undefined,signal);
  if(!Array.isArray(data.versions)||data.versions.length>12)throw new AchievementError(503,'Invalid revision history.');
  return data.versions.map(raw=>{
   const v=raw as AchievementHistory,s=v.snapshot;
   if(!s||!Number.isSafeInteger(v.revision)||v.revision<1||!Number.isSafeInteger(v.changedAt)||v.changedAt<1||
    !(s.archivedAt===null||(Number.isSafeInteger(s.archivedAt)&&s.archivedAt>0)))throw new AchievementError(503,'Invalid revision history.');
   const {archivedAt,...draft}=s;
   return {revision:v.revision,snapshot:{...normalizeAchievementDraft(draft),archivedAt},changedAt:v.changedAt};
  });
 }
};
