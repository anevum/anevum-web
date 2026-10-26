// ANEVUM Studio V050: PRIVATE review snapshot service. No asset rendering,
// public release, approval, R2 object access or executable app hosting.
const selectProject='id,slug,title,summary,description,category,free_to_use,license_name,source_url,demo_url,ai_disclosure,human_contribution,status,revision,created_at,updated_at,submitted_at';
const hex32=/^[a-f0-9]{32}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function results(rows){return Array.isArray(rows?.results)?rows.results:[];}
async function query(db,sql,args=[]){
 const out=await db.prepare(sql).bind(...args).all();
 if(out?.success===false||!Array.isArray(out?.results))throw Error('Private review snapshot unavailable');
 return out.results;
}
function viewAsset(a){return {
 id:a.asset_id,name:a.filename,kind:a.kind,contentType:a.content_type,
 sizeBytes:Number(a.size_bytes),sha256:a.sha256,digestType:'file-sha256'
};}
function viewLargeAsset(a){return {
 id:a.asset_id,name:a.filename,kind:a.kind,contentType:a.content_type,
 sizeBytes:Number(a.size_bytes),sha256:a.manifest_sha256,digestType:'part-manifest'
};}
async function largeReviewReady(db){
 const r=await query(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN "+
  "('member_studio_large_assets','member_studio_submission_large_assets')");
 return r.length===2;
}
function viewSubmission(s){return {
 id:s.id,projectId:s.project_id,revision:Number(s.project_revision),slug:s.slug,
 title:s.title,summary:s.summary,description:s.description,category:s.category,
 freeToUse:s.free_to_use===1,license:s.license_name,sourceUrl:s.source_url,
 demoUrl:s.demo_url,aiDisclosure:s.ai_disclosure,humanContribution:s.human_contribution,
 status:s.status,submittedAt:Number(s.submitted_at),
 resolvedAt:s.resolved_at===null?null:Number(s.resolved_at)
};}
const fields='id,project_id,user_id,project_revision,slug,title,summary,description,category,free_to_use,license_name,source_url,demo_url,ai_disclosure,human_contribution,status,submitted_at,resolved_at';
export async function listStudioReviewReceipts(db,projectId,userId){
 const subs=await query(db,
  'SELECT '+fields+' FROM member_studio_submissions WHERE project_id=? AND user_id=? '+
  'ORDER BY project_revision DESC LIMIT 40',[projectId,userId]);
 if(!subs.length)return [];
 const all=await query(db,
  'SELECT a.submission_id,a.asset_id,a.filename,a.kind,a.content_type,a.size_bytes,a.sha256 '+
  'FROM member_studio_submission_assets a JOIN member_studio_submissions s ON s.id=a.submission_id '+
  'WHERE s.project_id=? AND s.user_id=? ORDER BY s.project_revision DESC,a.asset_id',[projectId,userId]);
 const large=await largeReviewReady(db)?await query(db,
  'SELECT a.submission_id,a.asset_id,a.filename,a.kind,a.content_type,a.size_bytes,a.manifest_sha256 '+
  'FROM member_studio_submission_large_assets a JOIN member_studio_submissions s ON s.id=a.submission_id '+
  'WHERE s.project_id=? AND s.user_id=? ORDER BY s.project_revision DESC,a.asset_id',[projectId,userId]):[];
 return subs.map(row=>({...viewSubmission(row),
  assets:[...all.filter(x=>x.submission_id===row.id).map(viewAsset),
   ...large.filter(x=>x.submission_id===row.id).map(viewLargeAsset)]}));
}
export async function getStudioReviewReceipt(db,project,reviewerId){
 const row=(await query(db,
  'SELECT '+fields+' FROM member_studio_submissions WHERE project_id=? AND user_id=? '+
  "AND project_revision=? AND status='pending_review' LIMIT 1",
  [project.id,project.user_id,project.revision]))[0];
 if(!row||project.user_id===reviewerId)return null;
 const assets=await query(db,
  'SELECT asset_id,filename,kind,content_type,size_bytes,sha256 '+
  'FROM member_studio_submission_assets WHERE submission_id=? ORDER BY asset_id LIMIT 21',[row.id]);
 const large=await largeReviewReady(db)?await query(db,
  'SELECT asset_id,filename,kind,content_type,size_bytes,manifest_sha256 FROM '+
  'member_studio_submission_large_assets WHERE submission_id=? ORDER BY asset_id LIMIT 41',[row.id]):[];
 return {...viewSubmission(row),assets:[...assets.map(viewAsset),...large.map(viewLargeAsset)]};
}
export async function freezeStudioReview(db,selected,ownerId,now,kinds,external,includeLarge=false){
 // Every private review receipt represents an immutable exact revision.
 // The legacy V050 upload path and small-file snapshot remain unchanged.
 const id=crypto.randomUUID(),next=Number(selected.revision)+1;
 if(!UUID.test(id)||!Number.isSafeInteger(next)||next<2)throw Error('Invalid snapshot');
 const kindsSlots=kinds.map(()=>'?').join(',');
 const smallProof=kinds.length?(
  "EXISTS (SELECT 1 FROM member_studio_assets WHERE project_id=? AND user_id=? "+
  "AND status='quarantined' AND sha256 IS NOT NULL AND kind IN ("+kindsSlots+"))"
 ):'0=1';
 const largeProof=includeLarge&&kinds.length?(
  "EXISTS (SELECT 1 FROM member_studio_large_assets WHERE project_id=? AND user_id=? "+
  "AND status='quarantined' AND manifest_sha256 IS NOT NULL AND kind IN ("+kindsSlots+"))"
 ):'0=1';
 const proof=includeLarge?'('+smallProof+' OR '+largeProof+')':smallProof;
 const proofArgs=[...(kinds.length?[selected.id,ownerId,...kinds]:[]),
  ...(includeLarge&&kinds.length?[selected.id,ownerId,...kinds]:[])];
 const eligibility=external?'1=1':proof;
 const extraGuard=includeLarge?
  "AND NOT EXISTS (SELECT 1 FROM member_studio_large_assets WHERE project_id=? AND status<>'quarantined') ":'';
 const mutation=db.prepare(
  "UPDATE member_studio_projects SET status='pending_review',revision=revision+1,updated_at=?,submitted_at=? "+
  "WHERE id=? AND user_id=? AND revision=? AND status IN ('draft','changes_requested') "+
  "AND NOT EXISTS (SELECT 1 FROM member_studio_assets WHERE project_id=? AND status<>'quarantined') "+
  extraGuard+'AND '+eligibility+' RETURNING '+selectProject
 ).bind(now,now,selected.id,ownerId,selected.revision,selected.id,
  ...(includeLarge?[selected.id]:[]),...(external?[]:proofArgs));
 const copy=db.prepare(
  'INSERT INTO member_studio_submissions('+
   'id,project_id,user_id,project_revision,slug,title,summary,description,category,free_to_use,'+
   'license_name,source_url,demo_url,ai_disclosure,human_contribution,status,submitted_at) '+
  'SELECT ?,id,user_id,revision,slug,title,summary,description,category,free_to_use,'+
   "license_name,source_url,demo_url,ai_disclosure,human_contribution,'pending_review',? "+
  "FROM member_studio_projects WHERE id=? AND user_id=? AND revision=? AND status='pending_review' "+
  'RETURNING id'
 ).bind(id,now,selected.id,ownerId,next);
 const assets=db.prepare(
  'INSERT INTO member_studio_submission_assets(submission_id,asset_id,filename,kind,content_type,size_bytes,sha256) '+
  'SELECT ?,id,filename,kind,content_type,size_bytes,sha256 FROM member_studio_assets '+
  "WHERE project_id=? AND user_id=? AND status='quarantined' AND sha256 IS NOT NULL RETURNING asset_id"
 ).bind(id,selected.id,ownerId);
 const large=includeLarge?db.prepare(
  'INSERT INTO member_studio_submission_large_assets '+
  '(submission_id,asset_id,filename,kind,content_type,size_bytes,manifest_sha256) '+
  'SELECT ?,id,filename,kind,content_type,size_bytes,manifest_sha256 FROM member_studio_large_assets '+
  "WHERE project_id=? AND user_id=? AND status='quarantined' AND manifest_sha256 IS NOT NULL RETURNING asset_id"
 ).bind(id,selected.id,ownerId):null;
 const batch=await db.batch([mutation,copy,assets,...(large?[large]:[])]);
 if(results(batch?.[0]).length!==1||results(batch?.[1]).length!==1)return null;
 return {project:results(batch[0])[0],submissionId:id,
  assetCount:results(batch[2]).length+(large?results(batch[3]).length:0)};
}
export async function withdrawStudioReview(db,selected,ownerId,now){
 // Both tables must transition together or not at all.
 const revision=selected.revision;
 const p=db.prepare("UPDATE member_studio_projects SET status='draft',revision=revision+1,updated_at=?,submitted_at=NULL "+
  "WHERE id=? AND user_id=? AND status='pending_review' AND revision=? "+
  "AND EXISTS(SELECT 1 FROM member_studio_submissions WHERE project_id=? AND user_id=? "+
   "AND project_revision=? AND status='pending_review') RETURNING "+selectProject
 ).bind(now,selected.id,ownerId,revision,selected.id,ownerId,revision);
 const sub=db.prepare(
  "UPDATE member_studio_submissions SET status='withdrawn',resolved_at=? "+
  "WHERE project_id=? AND user_id=? AND project_revision=? AND status='pending_review' "+
  "AND EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? AND status='draft' AND revision=?) RETURNING id"
 ).bind(now,selected.id,ownerId,revision,selected.id,ownerId,revision+1);
 const result=await db.batch([p,sub]);
 return results(result?.[0]).length===1&&results(result?.[1]).length===1?results(result[0])[0]:null;
}
export async function decideStudioReview(db,selected,reviewerId,action,reason,now){
 if(!['changes_requested','rejected'].includes(action)||selected.user_id===reviewerId)return false;
 const next=selected.revision+1;
 const p=db.prepare("UPDATE member_studio_projects SET status=?,revision=revision+1,updated_at=? "+
  "WHERE id=? AND status='pending_review' AND revision=? AND "+
  "EXISTS(SELECT 1 FROM member_studio_submissions WHERE project_id=? AND user_id=? AND project_revision=? "+
  "AND status='pending_review') RETURNING id")
  .bind(action,now,selected.id,selected.revision,selected.id,selected.user_id,selected.revision);
 const sub=db.prepare("UPDATE member_studio_submissions SET status=?,resolved_at=? "+
  "WHERE project_id=? AND user_id=? AND project_revision=? AND status='pending_review' "+
  "AND EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND status=? AND revision=?) RETURNING id")
  .bind(action,now,selected.id,selected.user_id,selected.revision,selected.id,action,next);
 const logId=crypto.randomUUID();
 const audit=db.prepare('INSERT INTO member_studio_review_log(id,project_id,reviewer_id,action,reason,created_at,submission_id) '+
  'SELECT ?,?,?,?,?,?,id FROM member_studio_submissions WHERE project_id=? '+
  'AND project_revision=? AND status=? RETURNING id')
  .bind(logId,selected.id,reviewerId,action,reason,now,selected.id,selected.revision,action);
 const batch=await db.batch([p,sub,audit]);
 return results(batch?.[0]).length===1&&results(batch?.[1]).length===1&&results(batch?.[2]).length===1;
}
export async function studioReviewSchemaReady(db){
 try{
  const names=await query(db,
   "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_studio_submissions','member_studio_submission_assets')");
  if(names.length!==2)return false;
  const auditColumns=await query(db,'PRAGMA table_info(member_studio_review_log)');
  return auditColumns.some(x=>x.name==='submission_id');
 }catch{return false;}
}
