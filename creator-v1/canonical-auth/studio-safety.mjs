// ANEVUM V071 — independently authorized public-creation safety ledger.
// A moderator may remove reviewed PUBLIC METADATA, not files or uploads.
// Only the exact allowlisted safety role may take down a release. The entire
// takedown, proof audit, award reconciliation and obsolete popup removal use
// one database transaction. No self-moderation, XP changes or medal issuance.
import {boundedText} from './request-body.mjs';
import {recognitionReady} from './recognition.mjs';
import {studioPublicationReady} from './studio-publications.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CODE=new Set(['rights','unsafe_content','malicious_link','impersonation','fraud','other']);
const AWARDS=[['first_creation',1],['maker_five',5],['maker_twenty',20]];
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store',
 'x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin'};
const json=(body,status=200)=>Response.json(body,{status,headers:HEAD});
const fail=(status,error)=>json({error},status);
const rows=async(db,q,...args)=>{
 const result=await db.prepare(q).bind(...args).all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('Moderation database unavailable');
 return result.results;
};
const one=(db,q,...args)=>db.prepare(q).bind(...args).first();
const enabled=env=>env?.CANONICAL_STUDIO_PUBLICATION_ENABLED==='true'&&
 env?.CANONICAL_STUDIO_SAFETY_ENABLED==='true'&&
 env?.CANONICAL_CREATOR_STUDIO_ENABLED==='true';
export function approvedSafetyReviewer(env,userId){
 return typeof userId==='string'&&userId.length>0&&
  (env?.CANONICAL_STUDIO_SAFETY_REVIEWER_IDS||'').split(',').map(s=>s.trim())
  .filter(Boolean).includes(userId);
}
export async function studioSafetyReady(db){
 if(!await studioPublicationReady(db)||!await recognitionReady(db))return false;
 try{
  const names=await rows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN "+
   "('member_studio_publication_takedowns','member_studio_recognition_revocations','member_studio_safety_limits')");
  return new Set(names.map(x=>x.name)).size===3;
 }catch{return false;}
}
async function allowance(db,userId,now){
 const reset=now-3600;
 const result=await rows(db,
  'INSERT INTO member_studio_safety_limits(moderator_id,window_start,requests) VALUES(?,?,1) '+
  'ON CONFLICT(moderator_id) DO UPDATE SET '+
  'window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END,'+
  'requests=CASE WHEN window_start<? THEN 1 ELSE requests+1 END '+
  'WHERE window_start<? OR requests<10 RETURNING requests',
  userId,now,reset,reset,reset);
 return result.length===1;
}
/**
 * Historical verification counts ALL independently reviewed, genuine releases
 * including voluntary owner withdrawals. A voluntary unpublish never erases
 * achievements already earned. A staff takedown permanently disqualifies its
 * verified work, even if the owner has kept the historic publication record.
 */
const qualifyingLifetimeCount=
 "SELECT COUNT(DISTINCT q.project_id) FROM member_studio_publications q "+
 "JOIN member_studio_submissions s ON s.id=q.submission_id AND s.project_id=q.project_id "+
 "JOIN member_studio_publication_reviews r ON r.id=q.review_id AND r.submission_id=q.submission_id "+
 "JOIN member_studio_publication_links l ON l.project_id=q.project_id AND l.user_id=q.user_id "+
 "WHERE q.user_id=? AND r.owner_id=q.user_id AND r.reviewer_id<>q.user_id "+
 "AND r.rights_checked=1 AND r.content_checked=1 AND r.external_link_checked=1 "+
 "AND (s.demo_url IS NOT NULL OR s.source_url IS NOT NULL) "+
 "AND NOT EXISTS(SELECT 1 FROM member_studio_submission_assets a WHERE a.submission_id=q.submission_id) "+
 "AND NOT EXISTS(SELECT 1 FROM member_studio_publication_takedowns t WHERE t.project_id=q.project_id)";

export async function takedownReviewedCreation(db,{
 projectId,expectedPublishedAt,reasonCode,reason,moderatorId,now,allow
}){
 if(!allow||!UUID.test(projectId)||!Number.isSafeInteger(expectedPublishedAt)||
   expectedPublishedAt<1||!Number.isSafeInteger(now)||now<1||
   !CODE.has(reasonCode)||typeof reason!=='string'||reason.trim().length<25||
   reason.length>1200||typeof moderatorId!=='string'||!moderatorId||
   !await studioSafetyReady(db))return {ok:false,reason:'Invalid safety review or inactive publication evidence'};
 const target=await one(db,
  "SELECT p.project_id,p.user_id,p.submission_id,p.published_at,p.status,p.withdrawn_at,r.reviewer_id "+
  "FROM member_studio_publications p JOIN member_studio_publication_reviews r ON r.id=p.review_id "+
  "WHERE p.project_id=? AND p.status IN ('published','withdrawn') "+
  "AND p.published_at=? AND NOT EXISTS ("+
  "SELECT 1 FROM member_studio_publication_takedowns t WHERE t.project_id=p.project_id)",
  projectId,expectedPublishedAt);
 if(!target)return {ok:false,reason:'Publication removed, already reviewed or changed'};
 if(target.user_id===moderatorId||target.reviewer_id===moderatorId)
  return {ok:false,reason:'Safety officer must differ from both creator and publication approver'};
 // Every statement below is evidence-bound to the new takedown row and
 // scoped exclusively to the affected author, not another user's grants.
 const deactivate=db.prepare(
  "UPDATE member_studio_publications SET status='withdrawn',withdrawn_at="+
   (target.status==='published'?'?':'withdrawn_at')+" "+
  "WHERE project_id=? AND user_id=? AND status=? AND published_at=? "+
  "AND NOT EXISTS(SELECT 1 FROM member_studio_publication_takedowns t "+
  "WHERE t.project_id=member_studio_publications.project_id) RETURNING project_id"
 ).bind(...(target.status==='published'?[now]:[]),projectId,target.user_id,target.status,expectedPublishedAt);
 const audit=db.prepare(
  "INSERT INTO member_studio_publication_takedowns("+
   "project_id,submission_id,owner_id,moderator_id,reason_code,reason,taken_down_at) "+
  "SELECT p.project_id,p.submission_id,p.user_id,?,?,?,? "+
  "FROM member_studio_publications p "+
  "WHERE p.project_id=? AND p.user_id=? AND p.status='withdrawn' "+
  "AND p.withdrawn_at=? AND p.published_at=? AND p.user_id<>? "+
  "AND NOT EXISTS(SELECT 1 FROM member_studio_publication_takedowns t WHERE t.project_id=p.project_id) "+
  "RETURNING project_id"
 ).bind(moderatorId,reasonCode,reason.trim(),now,projectId,target.user_id,
  target.status==='published'?now:target.withdrawn_at,expectedPublishedAt,moderatorId);
 const statements=[deactivate,audit],expected=[];
 for(const [badge,min] of AWARDS){
  // The grant's unique primary key remains in place as historical evidence.
  // A disqualified badge becomes hidden in all owner and public views.
  const revoke=db.prepare(
   "UPDATE member_recognition_grants SET revoked_at=? "+
   "WHERE user_id=(SELECT t.owner_id FROM member_studio_publication_takedowns t "+
   "WHERE t.project_id=? AND t.taken_down_at=? AND t.moderator_id=?) "+
   "AND kind='badge' AND recognition_id=? AND granted_by='canonical-studio-publication' "+
   "AND revoked_at IS NULL AND ("+qualifyingLifetimeCount+")<? RETURNING recognition_id"
  ).bind(now,projectId,now,moderatorId,badge,target.user_id,min);
  const revocation=db.prepare(
   "INSERT OR IGNORE INTO member_studio_recognition_revocations("+
    "project_id,user_id,kind,recognition_id,moderator_id,reason_code,revoked_at) "+
   "SELECT t.project_id,t.owner_id,'badge',g.recognition_id,t.moderator_id,t.reason_code,? "+
   "FROM member_studio_publication_takedowns t "+
   "JOIN member_recognition_grants g ON g.user_id=t.owner_id "+
   "WHERE t.project_id=? AND t.moderator_id=? AND t.taken_down_at=? "+
   "AND g.kind='badge' AND g.granted_by='canonical-studio-publication' "+
   "AND g.recognition_id=? AND g.revoked_at=? RETURNING recognition_id"
  ).bind(now,projectId,moderatorId,now,badge,now);
  const removePopup=db.prepare(
   "DELETE FROM member_reward_notifications WHERE user_id=? AND kind='award' "+
   "AND reference=? AND EXISTS(SELECT 1 FROM member_recognition_grants g "+
   "WHERE g.user_id=? AND g.kind='badge' AND g.recognition_id=? "+
   "AND g.revoked_at=? AND g.granted_by='canonical-studio-publication')"
  ).bind(target.user_id,badge,target.user_id,badge,now);
  statements.push(revoke,revocation,removePopup);
  expected.push(badge);
 }
 const result=await db.batch(statements);
 if(result?.[0]?.results?.length!==1||result?.[1]?.results?.length!==1)
  return {ok:false,reason:'Safety decision changed during transaction'};
 return {ok:true,projectId,publicationStatus:'withdrawn',reasonCode,
  revokedBadges:expected.filter((_,i)=>result?.[2+i*3]?.results?.length===1),
  keptHistoricalEvidence:true};
}

/** Verified-session, distinct safety role only; no raw user-ID arguments. */
export async function canonicalStudioSafety(req,env,user,now=Math.floor(Date.now()/1000)){
 if(!enabled(env)||!approvedSafetyReviewer(env,user?.id))return fail(403,'Independent safety review unavailable');
 if(user?.emailVerified!==true)return fail(401,'Verified sign-in required');
 const path=new URL(req.url);
 if(path.pathname!=='/api/v1/member/studio/safety'||path.search)return fail(404,'Not found');
 if(!['GET','POST'].includes(req.method))return fail(405,'Unsupported method');
 const db=env.MEMBER_DB;
 if(!await studioSafetyReady(db))return fail(503,'Safety review schema unavailable');
 try{
  if(req.method==='GET'){
   const data=await rows(db,
    "SELECT p.project_id AS id,s.title,s.summary,s.category,p.published_at,p.status,profile.handle "+
    "FROM member_studio_publications p "+
    "JOIN member_studio_submissions s ON s.id=p.submission_id "+
    "JOIN member_creator_profiles profile ON profile.user_id=p.user_id "+
    "JOIN member_studio_publication_reviews r ON r.id=p.review_id "+
    "WHERE p.status IN ('published','withdrawn') AND p.user_id<>? "+
    "AND r.reviewer_id<>? "+
    "AND NOT EXISTS(SELECT 1 FROM member_studio_publication_takedowns t WHERE t.project_id=p.project_id) "+
    "ORDER BY p.published_at DESC,p.project_id DESC LIMIT 50",user.id,user.id);
   return json({creations:data.map(x=>({id:x.id,title:x.title,summary:x.summary,
    category:x.category,handle:x.handle,publishedAt:Number(x.published_at),
    publicationStatus:x.status}))});
  }
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))
   return fail(400,'Invalid request type');
  const raw=await boundedText(req,1800);
  if(raw===null)return fail(413,'Request too large');
  let body;
  try{body=JSON.parse(raw)}catch{return fail(400,'Invalid safety decision')}
  if(!body||typeof body!=='object'||Array.isArray(body)||
   Object.keys(body).sort().join(',')!=='action,expectedPublishedAt,projectId,reason,reasonCode'||
   body.action!=='takedown')return fail(400,'Invalid safety decision');
  if(!UUID.test(body.projectId)||!CODE.has(body.reasonCode)||
   !Number.isSafeInteger(body.expectedPublishedAt)||body.expectedPublishedAt<1||
   typeof body.reason!=='string'||body.reason.trim().length<25||body.reason.length>1200)
   return fail(400,'Bounded evidence and reason required');
  if(!await allowance(db,user.id,now))return fail(429,'Safety review rate limit reached');
  const decision=await takedownReviewedCreation(db,{
   projectId:body.projectId,expectedPublishedAt:body.expectedPublishedAt,
   reasonCode:body.reasonCode,reason:body.reason,moderatorId:user.id,
   now,allow:true
  });
  return decision.ok?json(decision):fail(409,decision.reason);
 }catch{return fail(503,'Safety decision unavailable');}
}
