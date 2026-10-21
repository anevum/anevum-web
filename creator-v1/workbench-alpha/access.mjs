// Server-only, fail-closed private alpha admission. Not a substitute for Better Auth.
const MEMBER=/^[A-Za-z0-9_-]{1,128}$/;
// All backend invite timestamps use UNIX SECONDS, never browser milliseconds.
const seconds=()=>Math.floor(Date.now()/1000);
export function validateMemberId(id){return typeof id==='string'&&MEMBER.test(id)}
export function parseAccess(row,now=seconds()){
 if(!row||!Number.isSafeInteger(now)||!validateMemberId(row.member_id))return {allowed:false,reason:'not-invited'};
 if(row.enabled!==1)return {allowed:false,reason:'revoked'};
 if(!Number.isSafeInteger(row.expires_at)||row.expires_at<=now)return {allowed:false,reason:'expired'};
 return {allowed:true,reason:'invited',expiresAt:row.expires_at,revision:row.revision};
}
export async function requireWorkbenchAccess({db,memberId,now=seconds(),featureEnabled=false}){
 if(!featureEnabled)return {allowed:false,reason:'disabled'};
 if(!validateMemberId(memberId)||!db||typeof db.prepare!=='function')return {allowed:false,reason:'not-invited'};
 try{
  const row=await db.prepare('SELECT member_id, enabled, expires_at, revision FROM member_workbench_access WHERE member_id = ? LIMIT 1').bind(memberId).first();
  return parseAccess(row,now);
 }catch{return {allowed:false,reason:'unavailable'};}
}
export function validateGrant({memberId,actorId,expiresAt,reason,now=seconds()}){
 if(!validateMemberId(memberId)||!validateMemberId(actorId))throw Error('Invalid verified member ID');
 if(!Number.isSafeInteger(expiresAt)||expiresAt<=now||expiresAt>now+30*86400)throw Error('Pilot access must expire within 30 days');
 if(typeof reason!=='string'||reason.trim().length<10||reason.length>240)throw Error('A concise audit reason is required');
 return {memberId,actorId,expiresAt,reason:reason.trim()};
}
