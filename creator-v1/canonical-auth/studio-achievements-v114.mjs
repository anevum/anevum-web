// PRIVATE draft CRUD, not a gameplay SDK or issuer. Caller supplies a canonical
// verified session after the existing host/config/Origin/cookie policy checks.
import {boundedText} from './request-body.mjs';
import {UUID_V4,exactFields,normalizeAchievementDraft,ACHIEVEMENT_LIMITS} from '../shared/creator-achievements-v114.mjs';
export const STUDIO_ACHIEVEMENT_PATH=/^\/api\/v1\/member\/studio\/projects\/([0-9a-f-]{36})\/achievements(?:\/([0-9a-f-]{36})(?:\/(versions))?)?$/;
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin'};
const json=(body,status=200)=>Response.json(body,{status,headers});
const fail=(status,error)=>json({error},status);
const all=async(db,sql,args=[])=>{const r=await db.prepare(sql).bind(...args).all();if(r.success===false||!Array.isArray(r.results))throw Error('Storage unavailable');return r.results;};
const first=(db,sql,args=[])=>db.prepare(sql).bind(...args).first();
const rowDraft=r=>({stableKey:r.stable_key,title:r.title,description:r.description,triggerKey:r.trigger_key,
 targetCount:r.target_count,visibility:r.visibility,motif:r.motif,rewardLabel:r.reward_label});
const rowOut=r=>({id:r.id,projectId:r.project_id,...rowDraft(r),revision:r.revision,archivedAt:r.archived_at,
 createdAt:r.created_at,updatedAt:r.updated_at,status:'private_draft'});
async function body(req){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const raw=await boundedText(req,8192);if(raw===null)return null;
 try{return JSON.parse(raw);}catch{return null;}
}
async function pace(db,userId,now){
 const rows=await all(db,"INSERT INTO member_studio_achievement_edit_limits(user_id,window_start,requests) VALUES(?,?,1) "+
  "ON CONFLICT(user_id) DO UPDATE SET window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END,"+
  "requests=CASE WHEN window_start<=? THEN 1 ELSE requests+1 END WHERE window_start<=? OR requests<40 RETURNING requests",
  [userId,now,now-3600,now-3600,now-3600]);
 return rows.length===1;
}
export async function studioAchievements(req,env,user,now=Math.floor(Date.now()/1000)){
 if(env?.CANONICAL_CREATOR_ACHIEVEMENTS_V114!=='true'||env?.CANONICAL_CREATOR_STUDIO_ENABLED!=='true')return fail(404,'Not found');
 if(!user?.id||user.emailVerified!==true)return fail(403,'Verified member required');
 const url=new URL(req.url),match=url.pathname.match(STUDIO_ACHIEVEMENT_PATH);
 if(!match||url.search||!UUID_V4.test(match[1])||(match[2]&&!UUID_V4.test(match[2])))return fail(404,'Not found');
 const [,projectId,id,sub]=match;
 if(!['GET','POST','PATCH'].includes(req.method)||(sub&&req.method!=='GET')||
  (req.method==='POST'&&id)||(req.method==='PATCH'&&!id))return fail(405,'Method not allowed');
 if(req.method!=='GET'){
  const site=req.headers.get('sec-fetch-site');
  if(req.headers.get('origin')!==url.origin||(site!==null&&!['same-origin','none'].includes(site)))return fail(403,'Same-origin request required');
 }
 const db=env.MEMBER_DB;if(!db?.prepare||!Number.isSafeInteger(now)||now<1)return fail(503,'Achievement drafts unavailable');
 try{
  const schema=await all(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_studio_achievements','member_studio_achievement_versions','member_studio_achievement_edit_limits')");
  if(schema.length!==3)return fail(503,'Achievement draft storage is not enabled');
  const project=await first(db,'SELECT id,title,status FROM member_studio_projects WHERE id=? AND user_id=?',[projectId,user.id]);
  if(!project)return fail(404,'Project not found');
  const old=id?await first(db,'SELECT * FROM member_studio_achievements WHERE id=? AND project_id=? AND user_id=?',[id,projectId,user.id]):null;
  if(id&&!old)return fail(404,'Achievement not found');
  if(req.method==='GET'){
   if(sub==='versions'){
    const versions=await all(db,'SELECT revision,snapshot_json,changed_at FROM member_studio_achievement_versions WHERE achievement_id=? ORDER BY revision DESC LIMIT 12',[id]);
    return json({versions:versions.map(v=>({revision:v.revision,snapshot:JSON.parse(v.snapshot_json),changedAt:v.changed_at}))});
   }
   if(old)return json({achievement:rowOut(old)});
   const rows=await all(db,'SELECT * FROM member_studio_achievements WHERE project_id=? AND user_id=? ORDER BY updated_at DESC,id LIMIT 101',[projectId,user.id]);
   if(rows.length>100)throw Error('Draft inventory exceeds limits');
   return json({project,achievements:rows.map(rowOut),limits:ACHIEVEMENT_LIMITS,issuanceEnabled:false});
  }
  if(!['draft','changes_requested'].includes(project.status))return fail(409,'Withdraw this project from review before editing achievement drafts');
  const input=await body(req);
  const keys=req.method==='POST'?['clientRequestId','draft']:['revision','draft','archived'];
  if(!exactFields(input,keys))return fail(400,'Invalid achievement request');
  let draft;try{draft=normalizeAchievementDraft(input.draft);}catch(e){return fail(422,e.message);}
  const requestJson=JSON.stringify(draft);
  if(req.method==='POST'){
   if(typeof input.clientRequestId!=='string'||!UUID_V4.test(input.clientRequestId))return fail(422,'Invalid request identifier');
   const replay=()=>first(db,'SELECT * FROM member_studio_achievements WHERE project_id=? AND user_id=? AND client_request_id=?',[projectId,user.id,input.clientRequestId]);
   const previous=await replay();
   if(previous)return previous.request_json===requestJson?json({achievement:rowOut(previous),replayed:true}):fail(409,'This request identifier belongs to different draft content');
   if(!await pace(db,user.id,now))return fail(429,'Achievement edit limit reached. Try again later');
   const rows=await all(db,'INSERT INTO member_studio_achievements(id,project_id,user_id,client_request_id,request_json,stable_key,title,description,trigger_key,target_count,visibility,motif,reward_label,created_at,updated_at) '+
    "SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? AND status IN ('draft','changes_requested')) "+
    'AND (SELECT COUNT(*) FROM member_studio_achievements WHERE project_id=?)<100 '+
    'AND (SELECT COUNT(*) FROM member_studio_achievements WHERE project_id=? AND archived_at IS NULL)<50 ON CONFLICT DO NOTHING RETURNING *',
    [crypto.randomUUID(),projectId,user.id,input.clientRequestId,requestJson,draft.stableKey,draft.title,draft.description,draft.triggerKey,draft.targetCount,draft.visibility,draft.motif,draft.rewardLabel,now,now,projectId,user.id,projectId,projectId]);
   if(rows.length)return json({achievement:rowOut(rows[0]),replayed:false},201);
   const concurrent=await replay();
   if(concurrent&&concurrent.request_json===requestJson)return json({achievement:rowOut(concurrent),replayed:true});
   return fail(409,'Stable key conflict, project review lock or achievement limit reached');
  }
  if(!Number.isSafeInteger(input.revision)||input.revision<1||typeof input.archived!=='boolean')return fail(422,'Invalid revision or archive state');
  if(draft.stableKey!==old.stable_key)return fail(422,'Stable keys cannot be changed after creation');
  if(input.revision!==old.revision)return fail(409,'This achievement changed. Reload before saving');
  if(!await pace(db,user.id,now))return fail(429,'Achievement edit limit reached. Try again later');
  const updated=Math.max(now,old.updated_at);
  const rows=await all(db,'UPDATE member_studio_achievements SET title=?,description=?,trigger_key=?,target_count=?,visibility=?,motif=?,reward_label=?,archived_at=?,revision=revision+1,updated_at=? '+
   "WHERE id=? AND project_id=? AND user_id=? AND revision=? AND EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? AND status IN ('draft','changes_requested')) "+
   'AND (?=1 OR archived_at IS NULL OR (SELECT COUNT(*) FROM member_studio_achievements WHERE project_id=? AND archived_at IS NULL)<50) RETURNING *',
   [draft.title,draft.description,draft.triggerKey,draft.targetCount,draft.visibility,draft.motif,draft.rewardLabel,input.archived?(old.archived_at??updated):null,updated,id,projectId,user.id,input.revision,projectId,user.id,input.archived?1:0,projectId]);
  return rows.length?json({achievement:rowOut(rows[0])}):fail(409,'Achievement changed, project is locked, or active limit reached');
 }catch{return fail(503,'Achievement draft operation unavailable. Reload before retrying');}
}
