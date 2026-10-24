/**
 * Lightweight read-state for PUBLIC release notes only.
 * No member identity, marketing consent, device fingerprint or notification body.
 * This preference is local to a browser and does not change server-sourced XP.
 */
const KEY='anevum:iren:public-release-seen:v1';
const EVENT='anevum:public-release-seen';
const ID=/^[a-z0-9][a-z0-9-]{2,79}$/;
export function lastPublicReleaseSeen(){
 if(typeof window==='undefined')return '';
 try{return window.localStorage.getItem(KEY)||''}catch{return ''}
}
export function markPublicReleaseSeen(id:string){
 if(typeof window==='undefined'||!ID.test(id))return;
 try{window.localStorage.setItem(KEY,id)}catch{}
 window.dispatchEvent(new CustomEvent(EVENT,{detail:id}));
}
export const PUBLIC_RELEASE_SEEN_EVENT=EVENT;
