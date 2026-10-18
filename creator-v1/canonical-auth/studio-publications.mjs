// ANEVUM V070: audited, metadata-only external publication.
// Quarantined files are NEVER rendered, linked, downloaded, executed or
// treated as approved. A submitted draft, consent alone, and reviewer role
// cannot mint achievement badges. No monetary or XP reward is generated.
import {boundedText} from './request-body.mjs';
import {recognitionReady} from './recognition.mjs';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const headers={'content-type':'application/json; charset=utf-8',
 'cache-control':'private, no-store','x-content-type-options':'nosniff',
 'cross-origin-resource-policy':'same-origin'};
const json=(value,status=200)=>Response.json(value,{status,headers});
const fail=(status,error)=>json({error},status);
const cap=async(req,limit=1400)=>{
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const raw=await boundedText(req,limit);
 if(raw===null)return null;
 try{const x=JSON.parse(raw);return x&&typeof x==='object'&&!Array.isArray(x)?x:null;}
 catch{return null;}
};
const keys=(o,items)=>Object.keys(o).sort().join('|')===items.slice().sort().join('|');
const read=async(db,sql,...args)=>{
 const result=await db.prepare(sql).bind(...args).all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('Publication database unavailable');
 return result.results;
};
const first=async(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const changes=result=>Number(result?.meta?.changes??result?.results?.length??0);
const flag=env=>env?.CANONICAL_STUDIO_PUBLICATION_ENABLED==='true'
 &&env?.CANONICAL_CREATOR_STUDIO_ENABLED==='true';
const safeExternal=value=>{
 if(typeof value!=='string'||value.length>1500)return false;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password
  &&u.hostname.length>3&&!/^(?:localhost|.*\.localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/i.test(u.hostname);
 }catch{return false;}
};
// No implicit feature activation from an old or partially installed schema.
export async function studioPublicationReady(db){
 try{
  if(!db?.prepare)return false;
  const names=await read(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN "+
   "('member_studio_publication_consents','member_studio_publication_reviews','member_studio_publications')");
  return new Set(names.map(x=>x.name)).size===3;
 }catch{return false;}
}
const eligibleSnapshot=async(db,projectId,userId,revision)=>{
 const s=await first(db,
  "SELECT s.id,s.project_id,s.user_id,s.project_revision,s.status,s.source_url,s.demo_url,"+
  "s.license_name,s.ai_disclosure,s.human_contribution,s.category,"+
  "p.status AS project_status,p.revision AS current_revision,pr.visibility,u.emailVerified "+
  "FROM member_studio_submissions s "+
  "JOIN member_studio_projects p ON p.id=s.project_id AND p.user_id=s.user_id "+
  "JOIN member_creator_profiles pr ON pr.user_id=s.user_id "+
  'JOIN "user" u ON u.id=s.user_id '+
  "WHERE s.project_id=? AND s.user_id=? AND s.project_revision=? "+
  "AND s.status='pending_review' AND p.status='pending_review' AND p.revision=s.project_revision "+
  "AND NOT EXISTS(SELECT 1 FROM member_studio_submission_assets a WHERE a.submission_id=s.id)",
  projectId,userId,revision);
 if(!s||s.visibility!=='public'||Number(s.emailVerified)!==1||
  !(safeExternal(s.source_url)||safeExternal(s.demo_url))||
  typeof s.license_name!=='string'||s.license_name.trim().length<2||
  typeof s.human_contribution!=='string'||s.human_contribution.trim().length<10||
  typeof s.ai_disclosure!=='string'||s.ai_disclosure.trim().length<6)
  return null;
 return s;
};

// Author consent applies to exactly ONE frozen snapshot. If the author
// withdraws it, the public projection hides the publication immediately.
export async function canonicalStudioPublicationConsent(req,env,user,projectId,now=Math.floor(Date.now()/1000)){
 if(!flag(env))return fail(404,'Metadata publication is not enabled');
 if(!user?.id||user.emailVerified!==true)return fail(401,'Verified sign-in required');
 if(!UUID.test(projectId)||new URL(req.url).search)return fail(400,'Invalid project');
 if(!['GET','POST','DELETE'].includes(req.method))return fail(405,'Unsupported method');
 const db=env.MEMBER_DB;
 if(!await studioPublicationReady(db))return fail(503,'Publication review unavailable');
 try{
  const owner=await first(db,
   'SELECT id,revision FROM member_studio_projects WHERE id=? AND user_id=?',
   projectId,user.id);
  if(!owner)return fail(404,'Project not found');
  const info=await first(db,
   'SELECT c.submission_id,c.consented_at,c.revoked_at,p.status AS publication_status '+
   'FROM member_studio_publication_consents c LEFT JOIN member_studio_publications p '+
   'ON p.submission_id=c.submission_id '+
   'WHERE c.project_id=? AND c.user_id=? ORDER BY c.consented_at DESC LIMIT 1',
   projectId,user.id);
  if(req.method==='GET')return json({consented:Boolean(info&&!info.revoked_at),
   publicationStatus:info?.publication_status||null,
   scope:'external_metadata_only',
   note:'Only reviewed metadata and external HTTPS links may become public; stored uploads remain quarantined.'});
  const body=await cap(req,450);
  if(!body||!keys(body,['submissionId','revision','scope','accepted'])||
   !UUID.test(body.submissionId)||!Number.isSafeInteger(body.revision)||
   body.scope!=='external_metadata_only'||body.accepted!==true)
   return fail(400,'Exact public-metadata consent is required');
  if(req.method==='POST'){
   if(owner.revision!==body.revision)return fail(409,'Submission revision changed');
   const snapshot=await eligibleSnapshot(db,projectId,user.id,body.revision);
   if(!snapshot||snapshot.id!==body.submissionId)
    return fail(409,'Only frozen, externally hosted metadata without private uploads may be consented to');
   const existing=await first(db,
    'SELECT status FROM member_studio_publications WHERE project_id=?',projectId);
   if(existing)return fail(409,'Publication already decided');
   const result=await db.prepare(
    'INSERT INTO member_studio_publication_consents(submission_id,project_id,user_id,consented_at) '+
    'SELECT id,project_id,user_id,? FROM member_studio_submissions WHERE id=? AND project_id=? AND user_id=? '+
    "AND project_revision=? AND status='pending_review' "+
    'ON CONFLICT(submission_id) DO UPDATE SET consented_at=excluded.consented_at,revoked_at=NULL '+
    'WHERE member_studio_publication_consents.user_id=excluded.user_id'
   ).bind(now,body.submissionId,projectId,user.id,body.revision).run();
   return changes(result)===1?json({consented:true,submissionId:body.submissionId,
    scope:'external_metadata_only'}):fail(409,'Consent changed');
  }
  if(info?.publication_status==='published')return fail(409,'Unpublish the public release before changing consent');
  const result=await db.prepare(
   'UPDATE member_studio_publication_consents SET revoked_at=? '+
   'WHERE submission_id=? AND project_id=? AND user_id=? AND revoked_at IS NULL'
  ).bind(now,body.submissionId,projectId,user.id).run();
  return json({consented:false,changed:changes(result)===1});
 }catch{return fail(503,'Publication consent unavailable');}
}

const qualifiedPublication=
 "p.status='published' AND c.revoked_at IS NULL "+
 "AND r.action='publish_metadata' AND r.rights_checked=1 AND r.content_checked=1 "+
 "AND r.external_link_checked=1 AND r.owner_id=p.user_id AND r.reviewer_id<>p.user_id "+
 "AND c.user_id=p.user_id AND c.project_id=p.project_id "+
 "AND s.user_id=p.user_id AND s.project_id=p.project_id "+
 "AND (s.demo_url IS NOT NULL OR s.source_url IS NOT NULL) "+
 "AND NOT EXISTS(SELECT 1 FROM member_studio_submission_assets a WHERE a.submission_id=p.submission_id)";

// Public list is meaningful only if it is actually routed and enabled.
// The projection never includes private user IDs, submission hashes, R2 URLs,
// reviewer names or identity secrets. Public profile visibility is rechecked.
export async function canonicalPublicStudioCreations(req,env){
 if(!flag(env))return fail(404,'Not found');
 if(!['GET','HEAD'].includes(req.method))return fail(405,'Method not allowed');
 const url=new URL(req.url),detail=url.pathname.match(/^\/api\/v1\/creations\/([0-9a-f-]{36})$/);
 if(url.search||(!detail&&url.pathname!=='/api/v1/creations')||
  (detail&&!UUID.test(detail[1])))return fail(404,'Not found');
 const db=env.MEMBER_DB;
 if(!await studioPublicationReady(db))return fail(503,'Creation registry unavailable');
 try{
  const cols="p.project_id AS id,s.title,s.summary,s.category,s.free_to_use,"+
   "s.license_name,s.source_url,s.demo_url,pr.handle,p.published_at";
  const from=" FROM member_studio_publications p "+
   "JOIN member_studio_publication_consents c ON c.submission_id=p.submission_id "+
   "JOIN member_studio_publication_reviews r ON r.id=p.review_id AND r.submission_id=p.submission_id "+
   "JOIN member_studio_submissions s ON s.id=p.submission_id "+
   "JOIN member_creator_profiles pr ON pr.user_id=p.user_id AND pr.visibility='public' "+
   'JOIN "user" u ON u.id=p.user_id AND u.emailVerified=1 '+
   "WHERE "+qualifiedPublication;
  const rows=await read(db,'SELECT '+cols+from+
   (detail?' AND p.project_id=? LIMIT 1':' ORDER BY p.published_at DESC,p.project_id DESC LIMIT 24'),
   ...(detail?[detail[1]]:[]));
  if(detail&&!rows.length)return fail(404,'Not found');
  const project=r=>({id:r.id,handle:r.handle,title:r.title,summary:r.summary,
   category:r.category,freeToUse:Number(r.free_to_use)===1,license:r.license_name,
   sourceUrl:safeExternal(r.source_url)?r.source_url:null,
   demoUrl:safeExternal(r.demo_url)?r.demo_url:null,publishedAt:Number(r.published_at),
   delivery:'external-link-only'});
  if(req.method==='HEAD')return new Response(null,{status:200,headers});
  return json(detail?{creation:project(rows[0])}:{creations:rows.map(project),nextCursor:null});
 }catch{return fail(503,'Creation registry unavailable');}
}

// These statements may ONLY be executed after a public publication row has
// been inserted from a server-authorized independent review. Never accept
// badge names, XP, user IDs, recipient handles or amounts from request bodies.
// Three threshold badges are idempotent on (user_id, kind, recognition_id).
export async function publishedCreationBadgeStatements(db,{projectId,reviewId,now,enabled}){
 if(!enabled||!UUID.test(projectId)||!UUID.test(reviewId)||!await recognitionReady(db)||
   !await studioPublicationReady(db))return [];
 const out=[];
 for(const [award,minimum] of [['first_creation',1],['maker_five',5],['maker_twenty',20]]){
  const proof=
   " FROM member_studio_publications p "+
   "JOIN member_studio_publication_consents c ON c.submission_id=p.submission_id "+
   "JOIN member_studio_publication_reviews r ON r.id=p.review_id AND r.submission_id=p.submission_id "+
   "JOIN member_studio_submissions s ON s.id=p.submission_id "+
   "JOIN member_creator_profiles pr ON pr.user_id=p.user_id AND pr.visibility='public' "+
   'JOIN "user" u ON u.id=p.user_id AND u.emailVerified=1 '+
   "WHERE p.project_id=? AND p.review_id=? AND "+qualifiedPublication+
   " AND (SELECT COUNT(DISTINCT q.project_id) FROM member_studio_publications q "+
   " JOIN member_studio_publication_consents qc ON qc.submission_id=q.submission_id "+
   " JOIN member_studio_publication_reviews qr ON qr.id=q.review_id "+
   " JOIN member_studio_submissions qs ON qs.id=q.submission_id "+
   " WHERE q.user_id=p.user_id AND q.status='published' AND qc.revoked_at IS NULL "+
   " AND qr.reviewer_id<>q.user_id AND qr.owner_id=q.user_id AND qr.rights_checked=1 "+
   " AND qr.content_checked=1 AND qr.external_link_checked=1 "+
   " AND NOT EXISTS(SELECT 1 FROM member_studio_submission_assets ax WHERE ax.submission_id=q.submission_id))>=?";
  out.push(db.prepare(
   "INSERT OR IGNORE INTO member_recognition_grants"+
   "(user_id,kind,recognition_id,earned_at,granted_by,evidence_ref,reviewed_by) "+
   "SELECT p.user_id,'badge',?,?,'canonical-studio-publication',"+
   "'public-creation:'||p.project_id,r.reviewer_id"+proof
  ).bind(award,now,projectId,reviewId,minimum));
  out.push(db.prepare(
   "INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,created_at) "+
   "SELECT user_id,'award',recognition_id,earned_at FROM member_recognition_grants "+
   "WHERE kind='badge' AND recognition_id=? AND revoked_at IS NULL AND "+
   "user_id=(SELECT user_id FROM member_studio_publications WHERE project_id=? AND review_id=?)"
  ).bind(award,projectId,reviewId));
 }
 return out;
}

// Server-side review entry point. Caller MUST be an authenticated, verified,
// explicitly allowlisted Studio reviewer. The function does not trust the
// reviewer ID or the publication attestation supplied by an end user.
export async function publishReviewedExternalStudioMetadata(db,{
 projectId,revision,reviewerId,reason,rightsChecked,contentChecked,externalLinkChecked,
 now,enabled
}){
 if(!enabled||!UUID.test(projectId)||!Number.isSafeInteger(revision)||revision<2||
  typeof reviewerId!=='string'||!reviewerId||
  typeof reason!=='string'||reason.trim().length<25||reason.length>1200||
  rightsChecked!==true||contentChecked!==true||externalLinkChecked!==true||
  !await studioPublicationReady(db))return {ok:false,reason:'Publication authorization or evidence missing'};
 const project=await first(db,
  'SELECT p.user_id,p.status,p.revision,s.id AS submission_id '+
  'FROM member_studio_projects p JOIN member_studio_submissions s '+
  'ON s.project_id=p.id AND s.user_id=p.user_id AND s.project_revision=p.revision '+
  "WHERE p.id=? AND p.revision=? AND p.status='pending_review' AND s.status='pending_review'",
  projectId,revision);
 if(!project||project.user_id===reviewerId)return {ok:false,reason:'Independent review required'};
 const snapshot=await eligibleSnapshot(db,projectId,project.user_id,revision);
 if(!snapshot||snapshot.id!==project.submission_id)return {ok:false,reason:'Content or external link ineligible'};
 const consent=await first(db,
  'SELECT submission_id FROM member_studio_publication_consents '+
  "WHERE submission_id=? AND project_id=? AND user_id=? AND revoked_at IS NULL AND scope='external_metadata_only'",
  snapshot.id,projectId,project.user_id);
 if(!consent)return {ok:false,reason:'Author did not consent to this frozen release'};
 // Same external project URL cannot count twice for one author, even if
 // submitted under a different Studio project slug.
 const url=snapshot.demo_url||snapshot.source_url;
 const duplicate=await first(db,
  "SELECT 1 FROM member_studio_publications p JOIN member_studio_submissions s ON s.id=p.submission_id "+
  "WHERE p.user_id=? AND p.status='published' AND COALESCE(s.demo_url,s.source_url)=? LIMIT 1",
  project.user_id,url);
 if(duplicate)return {ok:false,reason:'Identical external creation already published'};
 const id=crypto.randomUUID();
 const attestation=db.prepare(
  'INSERT INTO member_studio_publication_reviews('+
   'id,submission_id,project_id,reviewer_id,owner_id,rights_checked,content_checked,'+
   'external_link_checked,reason,reviewed_at) '+
  'SELECT ?,s.id,s.project_id,?,s.user_id,1,1,1,?,? '+
  'FROM member_studio_submissions s JOIN member_studio_projects p ON p.id=s.project_id '+
  'JOIN member_studio_publication_consents c ON c.submission_id=s.id '+
  "WHERE s.id=? AND s.project_id=? AND s.project_revision=? AND s.status='pending_review' "+
  "AND p.status='pending_review' AND p.revision=s.project_revision "+
  "AND p.user_id<>? AND c.revoked_at IS NULL "+
  "AND NOT EXISTS(SELECT 1 FROM member_studio_submission_assets a WHERE a.submission_id=s.id) "+
  'ON CONFLICT(submission_id) DO NOTHING RETURNING id'
 ).bind(id,reviewerId,reason.trim(),now,snapshot.id,projectId,revision,reviewerId);
 const publication=db.prepare(
  'INSERT INTO member_studio_publications(project_id,submission_id,user_id,review_id,published_at) '+
  'SELECT s.project_id,s.id,s.user_id,r.id,? FROM member_studio_submissions s '+
  'JOIN member_studio_publication_reviews r ON r.submission_id=s.id '+
  'JOIN member_studio_publication_consents c ON c.submission_id=s.id '+
  'JOIN member_studio_projects p ON p.id=s.project_id '+
  'JOIN member_creator_profiles prof ON prof.user_id=s.user_id '+
  'JOIN "user" u ON u.id=s.user_id '+
  "WHERE s.id=? AND s.project_id=? AND s.project_revision=? AND s.status='pending_review' "+
  "AND p.status='pending_review' AND p.revision=s.project_revision "+
  "AND r.id=? AND r.reviewer_id=? AND r.owner_id=s.user_id "+
  "AND c.revoked_at IS NULL AND c.scope='external_metadata_only' "+
  "AND prof.visibility='public' AND u.emailVerified=1 "+
  "AND NOT EXISTS(SELECT 1 FROM member_studio_submission_assets a WHERE a.submission_id=s.id) "+
  'ON CONFLICT(project_id) DO NOTHING RETURNING project_id'
 ).bind(now,snapshot.id,projectId,revision,id,reviewerId);
 const badges=await publishedCreationBadgeStatements(db,{projectId,reviewId:id,now,enabled});
 const result=await db.batch([attestation,publication,...badges]);
 const rows=(i)=>Array.isArray(result?.[i]?.results)?result[i].results:[];
 if(rows(0).length!==1||rows(1).length!==1)return {ok:false,reason:'Publication changed during review'};
 return {ok:true,projectId,publishedAt:now,issuedFrom:'verified-publication'};
}
