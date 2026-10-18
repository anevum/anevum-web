import type {EarnedBadge,PlayerAura,PublicDistinctions} from './player-recognition';
export type RecognitionSettings={
 badgeMode:'automatic'|'curated'|'hidden';
 badgeIds:string[];
 earnedBadges:EarnedBadge[];
 featuredBadges:EarnedBadge[];
 earnedMedals:EarnedBadge[];
 earnedRibbons:EarnedBadge[];
 medalId:string|null;
 ribbonIds:string[];
 aura:PlayerAura;
 revision:number;
};
export type RecognitionUpdate={
 badgeMode:RecognitionSettings['badgeMode'];badgeIds:string[];
 medalId:string|null;ribbonIds:string[];aura:PlayerAura;revision:number;
};
async function request(method:'GET'|'PATCH',body?:RecognitionUpdate,signal?:AbortSignal):Promise<RecognitionSettings>{
 const res=await fetch('/api/v1/member/recognition',{
  method,credentials:'same-origin',mode:'same-origin',cache:'no-store',redirect:'error',
  referrerPolicy:'same-origin',signal,
  headers:body?{'Content-Type':'application/json',Accept:'application/json'}:{Accept:'application/json'},
  body:body?JSON.stringify(body):undefined
 });
 if(!res.ok) {
  const error=new Error(res.status===404?'Recognition archive not enabled':
   res.status===401?'Sign in to manage your player card':
   res.status===409?'Your display settings changed. Reload before saving':
   'Recognition settings could not be verified');
  Object.assign(error,{status:res.status});
  throw error;
 }
 if(!res.headers.get('content-type')?.includes('application/json'))throw Error('Invalid recognition response');
 const data=await res.json() as RecognitionSettings;
 if(!data||!Array.isArray(data.earnedBadges)||!Number.isSafeInteger(data.revision))
  throw Error('Invalid recognition response');
 return data;
}
export const readRecognition=(signal?:AbortSignal)=>request('GET',undefined,signal);
export const saveRecognition=(value:RecognitionUpdate)=>request('PATCH',value);
export function previewDistinctions(data:RecognitionSettings,medalId:string|null,ribbonIds:string[]):PublicDistinctions{
 return {
  medals:medalId&&data.earnedMedals.some(x=>x.id===medalId)?[medalId]:[],
  ribbons:ribbonIds.filter(id=>data.earnedRibbons.some(x=>x.id===id)).slice(0,2)
 };
}

export type RecognitionCatalog={
 version:1;
 activeBadgeIds:string[];
 activeRibbonIds:string[];
 activeMedalIds:string[];
};
export async function readRecognitionCatalog(signal?:AbortSignal):Promise<RecognitionCatalog>{
 const response=await fetch('/api/v1/public/recognition/catalog',{
  method:'GET',credentials:'omit',mode:'same-origin',cache:'no-store',
  referrerPolicy:'same-origin',redirect:'error',
  headers:{Accept:'application/json'},signal
 });
 if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))
  throw new Error('Public recognition status unavailable');
 const value=await response.json() as Partial<RecognitionCatalog>;
 const valid=(items:unknown,max:number)=>Array.isArray(items)&&items.length<=max&&
  items.every(item=>typeof item==='string'&&/^[a-z][a-z0-9_]{1,47}$/.test(item))&&
  new Set(items).size===items.length;
 if(value?.version!==1||!valid(value.activeBadgeIds,26)||
   !valid(value.activeRibbonIds,6)||!valid(value.activeMedalIds,6))
  throw new Error('Invalid public recognition status');
 return value as RecognitionCatalog;
}
