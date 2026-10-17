import type {SpaceAward} from './canonical-beta';
export type MemberProgression={xp:number;testXp:number;milestoneXp:number;level:number;levelStart:number;nextLevel:number;artifact:string|null;awards:SpaceAward[]};
export type RewardNotice={id:number;kind:'level'|'award';level?:number;award?:string;title:string;detail:string;createdAt:number};
export type RewardInbox={items:RewardNotice[];recent:RewardNotice[]};
export async function progressionRequest<T>(route:'progression'|'notifications'|'notifications/ack'|'xp-test',body?:unknown,signal?:AbortSignal):Promise<T>{
 const response=await fetch('/api/v1/member/'+route,{method:body===undefined?'GET':'POST',mode:'same-origin',credentials:'same-origin',cache:'no-store',redirect:'error',referrerPolicy:'same-origin',signal,
  headers:body===undefined?{Accept:'application/json'}:{'Content-Type':'application/json',Accept:'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data)throw Error(typeof data?.error==='string'?data.error:'Progression is temporarily unavailable.');
 return data as T;
}
