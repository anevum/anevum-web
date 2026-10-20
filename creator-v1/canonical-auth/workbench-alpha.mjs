// ANEVUM.WEB.BUILD.2026-10-20.001.CREATOR-WORKBENCH-PRIVATE-ALPHA
// Same canonical identity and project table; no second Studio or publish API.
import {canonicalStudio} from './studio.mjs';
import {boundedText} from './request-body.mjs';
import {canonicalRequestOrigin} from './policy.mjs';
import {decode} from '../workbench-alpha/document.mjs';
export const WORKBENCH_ROOT='/api/v1/member/workbench';
export const PILOT_CAP=10;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const CONTROL=/[\u0000-\u001f\u007f]/;
const HEAD={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8',
 'x-content-type-options':'nosniff','x-robots-tag':'noindex,nofollow,noarchive','referrer-policy':'no-referrer',
 'cross-origin-resource-policy':'same-origin'};
const out=(data,status=200)=>Response.json(data,{status,headers:HEAD});
const fail=(status,error)=>out({error},status);
const exact=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===k.sort().join(',');
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
async function rows(db,sql,...args){const r=await db.prepare(sql).bind(...args).all();
 if(r?.success===false||!Array.isArray(r?.results))throw Error('Storage unavailable');return r.results;}
async function jsonBody(req,cap){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const raw=await boundedText(req,cap);if(raw===null)return null;
 try{return JSON.parse(raw);}catch{return null;}
}
async function ready(db){
 const [tables,triggers]=await Promise.all([
  rows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_workbench_access','member_workbench_access_log','staff_access_grants','member_studio_projects')"),
  rows(db,"SELECT name FROM sqlite_master WHERE type='trigger' AND name IN ('workbench_access_insert','workbench_access_update')")]);
 return tables.length===4&&triggers.length===2;
}
const OWNER="EXISTS(SELECT 1 FROM staff_access_grants s JOIN \"user\" u ON u.id=s.member_id WHERE s.member_id=? AND s.role='owner' AND s.revoked_at IS NULL AND u.emailVerified=1)";
const VERIFIED='EXISTS(SELECT 1 FROM "user" WHERE id=? AND emailVerified=1)';
// The worker supplies `user` only after canonical Better Auth session validation.
export async function canonicalWorkbench(req,env,user,now=Math.floor(Date.now()/1000)){
 if(env?.CANONICAL_WORKBENCH_ALPHA_ENABLED!=='true')return fail(404,'Workbench alpha is not activated.');
 const url=new URL(req.url),path=url.pathname,db=env?.MEMBER_DB;
 if(url.origin!==canonicalRequestOrigin(env)||!path.startsWith(WORKBENCH_ROOT+'/'))return fail(404,'Not found');
 if(!user?.id||typeof user.id!=='string'||user.id.length>128||user.emailVerified!==true)return fail(401,'Verified sign-in required.');
 if(!['GET','POST','PATCH'].includes(req.method))return fail(405,'Method not allowed');
 if(req.method!=='GET'&&(req.headers.get('origin')!==url.origin||
   ![null,'same-origin','none'].includes(req.headers.get('sec-fetch-site'))))return fail(403,'Same-origin request required.');
 if(env.CANONICAL_WORKBENCH_SCHEMA_APPROVED!=='true'||!db?.prepare)return fail(503,'Workbench staging schema is not approved.');
 try{
  if(!await ready(db))return fail(503,'Workbench alpha storage is unavailable.');
  if(!await one(db,'SELECT id FROM "user" WHERE id=? AND emailVerified=1',user.id))return fail(401,'Verified account required.');
  const owner=Boolean(await one(db,'SELECT 1 AS ok WHERE '+OWNER,user.id));
  const grant=await one(db,'SELECT enabled,revision,expires_at FROM member_workbench_access WHERE member_id=?',user.id);
  const allowed=owner||Boolean(grant?.enabled===1&&grant.expires_at>now);
  if(path===WORKBENCH_ROOT+'/status'&&req.method==='GET'&&!url.search)return out({
   memberId:user.id,allowed,canManage:owner,level:owner?'owner':allowed?'tester':'none',
   expiresAt:owner?null:allowed?grant.expires_at:null,
   capabilities:{privateDrafts:allowed,visualPreview:allowed,ai:false,codeExecution:false,publish:false},pilotCap:PILOT_CAP});
  if(path===WORKBENCH_ROOT+'/access'){
   if(!owner)return fail(403,'Owner permission required.');
   if(url.search)return fail(400,'Unexpected query');
   if(req.method==='GET')return out({members:await rows(db,
    'SELECT a.member_id AS memberId,p.handle,a.enabled,a.revision,a.expires_at AS expiresAt FROM member_workbench_access a '+
    'LEFT JOIN member_creator_profiles p ON p.user_id=a.member_id ORDER BY a.updated_at DESC,a.member_id LIMIT 100'),pilotCap:PILOT_CAP});
   if(req.method!=='POST')return fail(405,'Method not allowed');
   const body=await jsonBody(req,1200);
   if(!exact(body,['memberId','expectedRevision','action','days','reason'])||typeof body.memberId!=='string'||!body.memberId||body.memberId.length>128||
     !Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0||!['grant','revoke'].includes(body.action)||
     ![7,30,90].includes(body.days)||typeof body.reason!=='string'||body.reason.trim().length<10||body.reason.length>240||CONTROL.test(body.reason))
    return fail(422,'Select a verified account, expiry, current revision and a reason of 10 to 240 characters.');
   if(body.memberId===user.id)return fail(422,'The existing owner grant already controls your access.');
   if(await one(db,'SELECT 1 AS ok WHERE '+OWNER,body.memberId))return fail(422,'Existing owner access is managed separately.');
   const enabled=body.action==='grant'?1:0,expires=enabled?now+body.days*86400:now;
   // Authorization, cap and revision are rechecked inside each atomic write.
   const guard=OWNER+' AND '+VERIFIED+
    ' AND (?=0 OR (SELECT COUNT(*) FROM member_workbench_access WHERE enabled=1 AND expires_at>? AND member_id<>?)<?)'+
    ' AND (SELECT COUNT(*) FROM member_workbench_access_log WHERE actor_id=? AND created_at>?)<60';
   const guardArgs=[user.id,body.memberId,enabled,now,body.memberId,PILOT_CAP,user.id,now-3600];
   let changed;
   if(body.expectedRevision===0){
    if(!enabled)return fail(409,'No active invitation to revoke.');
    changed=await rows(db,'INSERT INTO member_workbench_access(member_id,enabled,revision,expires_at,updated_by,updated_at,reason) '+
     'SELECT ?,?,1,?,?,?,? WHERE '+guard+' ON CONFLICT(member_id) DO NOTHING RETURNING revision',
     body.memberId,enabled,expires,user.id,now,body.reason.trim(),...guardArgs);
   }else changed=await rows(db,
    'UPDATE member_workbench_access SET enabled=?,revision=revision+1,expires_at=?,updated_by=?,updated_at=?,reason=? '+
    'WHERE member_id=? AND revision=? AND '+guard+' RETURNING revision',
    enabled,expires,user.id,now,body.reason.trim(),body.memberId,body.expectedRevision,...guardArgs);
   return changed.length===1?out({ok:true,revision:changed[0].revision,enabled,expiresAt:expires}):
    fail(409,'Access changed, pilot capacity was reached, or the change limit was reached. Refresh before retrying.');
  }
  if(path===WORKBENCH_ROOT+'/member'&&req.method==='GET'){
   if(!owner)return fail(403,'Owner permission required.');
   const handle=url.searchParams.get('handle');
   if([...url.searchParams.keys()].join(',')!=='handle'||!HANDLE.test(handle||''))return fail(422,'Enter an exact existing member handle.');
   const member=await one(db,'SELECT u.id AS memberId,p.handle,p.display_name AS displayName,COALESCE(a.revision,0) AS revision,'+
    'COALESCE(a.enabled,0) AS enabled,a.expires_at AS expiresAt FROM "user" u JOIN member_creator_profiles p ON p.user_id=u.id '+
    'LEFT JOIN member_workbench_access a ON a.member_id=u.id WHERE p.handle=? AND u.emailVerified=1',handle);
   return member?out({member}):fail(404,'No eligible account with that handle.');
  }
  if(!allowed)return fail(403,'This account does not have active Workbench pilot access.');
  const match=path.match(/^\/api\/v1\/member\/workbench\/projects(?:\/([0-9a-f-]{36}))?$/);
  if(!match||url.search||(match[1]&&!UUID.test(match[1])))return fail(404,'Not found');
  if(req.method==='GET')return canonicalStudio(new Request(url.origin+'/api/v1/member/studio/projects'+(match[1]?'/'+match[1]:''),{headers:req.headers}),env,user,now);
  if((req.method==='POST'&&match[1])||(req.method==='PATCH'&&!match[1]))return fail(405,'Method not allowed');
  const input=await jsonBody(req,16000);
  if(!input?.draft||!decode(input.draft.description))return fail(422,'A valid V054 text-only Workbench document is required.');
  // GET/revision and updates use the established owner-bound Studio APIs.
  // Only this user's data is forwarded. No submit, review, upload or public API.
  return canonicalStudio(new Request(url.origin+'/api/v1/member/studio/projects'+(match[1]?'/'+match[1]:''),{
   method:req.method,headers:req.headers,body:JSON.stringify(input)}),env,user,now);
 }catch{return fail(503,'Workbench alpha is temporarily unavailable. No save has been confirmed.');}
}
