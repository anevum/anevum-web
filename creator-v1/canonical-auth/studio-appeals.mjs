// ANEVUM V072 — creator challenge and second-person institutional adjudication.
// Private verified sessions only. No auto-republish, XP, restored grants, medals,
// public creator claims, or implied forum/Studio/safety moderator privileges.
import {boundedText} from './request-body.mjs';
import {studioSafetyReady} from './studio-safety.mjs';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const REASONS=new Set(['ownership','false_positive','missing_context','other']);
const DECISIONS=new Set(['upheld','eligible_for_re_review']);
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store',
 'x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin'};
const json=(data,status=200)=>Response.json(data,{status,headers:HEAD});
const fail=(status,error)=>json({error},status);
const allowed=env=>env?.CANONICAL_CREATOR_STUDIO_ENABLED==='true'&&
 env?.CANONICAL_STUDIO_PUBLICATION_ENABLED==='true'&&
 env?.CANONICAL_STUDIO_SAFETY_ENABLED==='true'&&
 env?.CANONICAL_STUDIO_APPEALS_ENABLED==='true'&&
 String(env?.CANONICAL_STUDIO_APPEAL_REVIEWER_IDS||'').trim().length>0;
export function approvedAppealReviewer(env,id){
 return Boolean(id)&&String(env?.CANONICAL_STUDIO_APPEAL_REVIEWER_IDS||'')
  .split(',').map(x=>x.trim()).filter(Boolean).includes(id);
}
async function rows(db,sql,...args){
 const result=await db.prepare(sql).bind(...args).all();
 if(result?.success===false||!Array.isArray(result?.results))
  throw Error('Appeal storage unavailable');
 return result.results;
}
export async function studioAppealsReady(db){
 if(!await studioSafetyReady(db))return false;
 try{
  const found=await rows(db,
   "SELECT name FROM sqlite_master WHERE type='table' AND name IN "+
   "('member_studio_publication_appeals','member_studio_appeal_decisions','member_studio_appeal_limits')");
  return new Set(found.map(x=>x.name)).size===3;
 }catch{return false}
}
async function limit(db,actor,action,now){
 const past=now-3600,maximum=action==='file'?3:10;
 const inserted=await rows(db,
  'INSERT INTO member_studio_appeal_limits(actor_id,action,window_start,requests) VALUES(?,?,?,1) '+
  'ON CONFLICT(actor_id,action) DO UPDATE SET '+
  'window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END,'+
  'requests=CASE WHEN window_start<? THEN 1 ELSE requests+1 END '+
  'WHERE window_start<? OR requests<? RETURNING requests',
  actor,action,now,past,past,past,maximum);
 return inserted.length===1;
}
async function parseBody(req,limitBytes=2400){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))
  return null;
 const text=await boundedText(req,limitBytes);
 if(text===null)return null;
 try{const x=JSON.parse(text);return x&&!Array.isArray(x)&&typeof x==='object'?x:null;}
 catch{return null}
}
const exact=(body,keys)=>Object.keys(body).sort().join(',')===keys.slice().sort().join(',');

export async function canonicalStudioAppeals(req,env,user,now=Math.floor(Date.now()/1000)){
 if(!allowed(env))return fail(404,'Appeals are not activated');
 if(user?.emailVerified!==true||typeof user?.id!=='string'||!user.id)
  return fail(401,'Verified account required');
 const path=new URL(req.url);
 const reviewing=path.pathname==='/api/v1/member/studio/appeals/review';
 if(path.search||(!reviewing&&path.pathname!=='/api/v1/member/studio/appeals'))
  return fail(404,'Not found');
 if(!['GET','POST'].includes(req.method))return fail(405,'Method not allowed');
 if(reviewing&&!approvedAppealReviewer(env,user.id))
  return fail(403,'Independent appeal reviewer required');
 const db=env.MEMBER_DB;
 if(!await studioAppealsReady(db))return fail(503,'Appeal audit not available');
 try{
  if(req.method==='GET'&&!reviewing){
   const cases=await rows(db,
    'SELECT t.project_id,s.title,t.reason_code AS takedown_reason,t.taken_down_at,'+
    'a.id AS appeal_id,a.reason_code,a.statement,a.filed_at,'+
    'd.decision,d.explanation AS review_explanation,d.decided_at '+
    'FROM member_studio_publication_takedowns t '+
    'JOIN member_studio_submissions s ON s.id=t.submission_id '+
    'LEFT JOIN member_studio_publication_appeals a ON a.project_id=t.project_id AND a.owner_id=t.owner_id '+
    'LEFT JOIN member_studio_appeal_decisions d ON d.appeal_id=a.id '+
    'WHERE t.owner_id=? ORDER BY t.taken_down_at DESC LIMIT 30',user.id);
   return json({cases:cases.map(x=>({
    projectId:x.project_id,title:x.title,
    takedownReason:x.takedown_reason,takenDownAt:Number(x.taken_down_at),
    appealId:x.appeal_id||null,reasonCode:x.reason_code||null,
    statement:x.statement||null,filedAt:x.filed_at?Number(x.filed_at):null,
    decision:x.decision||null,reviewExplanation:x.review_explanation||null,
    decidedAt:x.decided_at?Number(x.decided_at):null
   }))});
  }
  if(req.method==='GET'){
   const cases=await rows(db,
    'SELECT a.id,a.project_id,a.reason_code,a.statement,a.filed_at,'+
    't.reason_code AS takedown_reason,t.taken_down_at,s.title,p.handle '+
    'FROM member_studio_publication_appeals a '+
    'JOIN member_studio_publication_takedowns t ON t.project_id=a.project_id AND t.owner_id=a.owner_id '+
    'JOIN member_studio_publication_reviews pub ON pub.project_id=a.project_id '+
    'JOIN member_studio_submissions s ON s.id=t.submission_id '+
    'JOIN member_creator_profiles p ON p.user_id=a.owner_id '+
    'LEFT JOIN member_studio_appeal_decisions d ON d.appeal_id=a.id '+
    'WHERE d.appeal_id IS NULL AND a.owner_id<>? AND t.moderator_id<>? AND pub.reviewer_id<>? '+
    'ORDER BY a.filed_at ASC,a.id ASC LIMIT 25',user.id,user.id,user.id);
   return json({cases:cases.map(x=>({
    id:x.id,projectId:x.project_id,title:x.title,handle:x.handle,
    takedownReason:x.takedown_reason,takenDownAt:Number(x.taken_down_at),
    reasonCode:x.reason_code,statement:x.statement,filedAt:Number(x.filed_at)
   }))});
  }
  const b=await parseBody(req);
  if(!b)return fail(400,'A bounded JSON appeal is required');
  if(!reviewing){
   if(!exact(b,['projectId','expectedTakenDownAt','reasonCode','statement'])||
    typeof b.projectId!=='string'||!UUID.test(b.projectId)||
    !Number.isSafeInteger(b.expectedTakenDownAt)||b.expectedTakenDownAt<1||
    !REASONS.has(b.reasonCode)||typeof b.statement!=='string'||
    b.statement.trim().length<40||b.statement.length>2000)
    return fail(400,'Provide your specific appeal and matching takedown');
   const claim=await rows(db,
    'SELECT t.project_id FROM member_studio_publication_takedowns t '+
    'WHERE t.project_id=? AND t.owner_id=? AND t.taken_down_at=? '+
    'AND NOT EXISTS(SELECT 1 FROM member_studio_publication_appeals a WHERE a.project_id=t.project_id)',
    b.projectId,user.id,b.expectedTakenDownAt);
   if(claim.length!==1)return fail(409,'Appeal already filed or record changed');
   if(!await limit(db,user.id,'file',now))return fail(429,'Appeal submission limit reached');
   const id=crypto.randomUUID();
   const result=await rows(db,
    'INSERT INTO member_studio_publication_appeals '+
    '(id,project_id,owner_id,reason_code,statement,filed_at) '+
    'SELECT ?,t.project_id,t.owner_id,?,?,? FROM member_studio_publication_takedowns t '+
    'WHERE t.project_id=? AND t.owner_id=? AND t.taken_down_at=? '+
    'ON CONFLICT(project_id) DO NOTHING RETURNING id',
    id,b.reasonCode,b.statement.trim(),now,b.projectId,user.id,b.expectedTakenDownAt);
   return result.length===1?json({appealId:id,status:'pending_independent_review'},201):
    fail(409,'Appeal changed before submission');
  }
  if(!exact(b,['appealId','expectedFiledAt','decision','explanation'])||
   typeof b.appealId!=='string'||!UUID.test(b.appealId)||
   !Number.isSafeInteger(b.expectedFiledAt)||b.expectedFiledAt<1||
   !DECISIONS.has(b.decision)||typeof b.explanation!=='string'||
   b.explanation.trim().length<40||b.explanation.length>1800)
   return fail(400,'Provide an independent evidence-based decision');
  const eligible=await rows(db,
   'SELECT a.id FROM member_studio_publication_appeals a '+
   'JOIN member_studio_publication_takedowns t ON t.project_id=a.project_id AND t.owner_id=a.owner_id '+
   'JOIN member_studio_publication_reviews pub ON pub.project_id=a.project_id '+
   'WHERE a.id=? AND a.filed_at=? AND a.owner_id<>? AND t.moderator_id<>? '+
   'AND pub.reviewer_id<>? AND NOT EXISTS('+
   'SELECT 1 FROM member_studio_appeal_decisions d WHERE d.appeal_id=a.id)',
   b.appealId,b.expectedFiledAt,user.id,user.id,user.id);
  if(eligible.length!==1)return fail(403,'Independent decision unavailable or already recorded');
  if(!await limit(db,user.id,'review',now))return fail(429,'Independent review limit reached');
  const result=await rows(db,
   'INSERT INTO member_studio_appeal_decisions '+
   '(appeal_id,reviewer_id,decision,explanation,decided_at) '+
   'SELECT a.id,?,?,?,? FROM member_studio_publication_appeals a '+
   'JOIN member_studio_publication_takedowns t ON t.project_id=a.project_id AND t.owner_id=a.owner_id '+
   'JOIN member_studio_publication_reviews pub ON pub.project_id=a.project_id '+
   'WHERE a.id=? AND a.filed_at=? AND a.owner_id<>? AND t.moderator_id<>? AND pub.reviewer_id<>? '+
   'ON CONFLICT(appeal_id) DO NOTHING RETURNING appeal_id',
   user.id,b.decision,b.explanation.trim(),now,b.appealId,b.expectedFiledAt,user.id,user.id,user.id);
  return result.length===1?json({
   appealId:b.appealId,decision:b.decision,recordedAt:now,
   publicationRestored:false,awardsRestored:false,
   note:'A favorable finding only authorizes a separate future rights and re-publication review.'
  }):fail(409,'Decision changed during review');
 }catch{return fail(503,'Appeal ledger unavailable');}
}
