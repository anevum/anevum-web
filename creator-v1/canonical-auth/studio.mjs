// ANEVUM.WEB.BUILD.2026-10-16.001.CREATOR-STUDIO-UPLOADS
// Canonical Better Auth drafts. Never infer a legacy Creator V1 session or grant XP.
// No project in this service is public, installed, approved, or executable.
import {boundedText} from './request-body.mjs';
import {canonicalStudioAssets,studioUploadReady} from './studio-assets.mjs';

const PREFIX='/api/v1/member/studio';
const COLLECTION=PREFIX+'/projects';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CATS=new Set(['games','tools','creative','music','art','video','writing','learning','research','other']);
// Quarantined files count as *submission evidence*, not as publishable media.
// Games/tools require a ZIP; video still needs an external public HTTPS link.
const ELIGIBLE_ASSET_KINDS=Object.freeze({
 games:['package'],tools:['package'],creative:['image','audio','document','package'],
 music:['audio'],art:['image'],video:[],writing:['document'],
 learning:['document','package'],research:['document','package'],
 other:['image','audio','document','package']
});
const CTRL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const SLUG=/^[a-z0-9](?:[a-z0-9-]{1,88}[a-z0-9])$/;
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin'};
const json=(body,status=200)=>Response.json(body,{status,headers:HEAD});
const fail=(status,error)=>json({error},status);
const exactly=(value,keys)=>Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
const FIELDS=['slug','title','summary','description','category','freeToUse','license','sourceUrl','demoUrl','aiDisclosure','humanContribution'];
const dbRow=row=>({
 id:row.id,slug:row.slug,title:row.title,summary:row.summary,description:row.description,
 category:row.category,freeToUse:row.free_to_use===1,license:row.license_name,
 sourceUrl:row.source_url,demoUrl:row.demo_url,aiDisclosure:row.ai_disclosure,
 humanContribution:row.human_contribution,status:row.status,revision:Number(row.revision),
 createdAt:Number(row.created_at),updatedAt:Number(row.updated_at),
 submittedAt:row.submitted_at===null?null:Number(row.submitted_at)
});
const COLS='id,slug,title,summary,description,category,free_to_use,license_name,source_url,demo_url,ai_disclosure,human_contribution,status,revision,created_at,updated_at,submitted_at';
function cleanText(value,min,max){
 if(typeof value!=='string'||value.length>max||CTRL.test(value))throw Error('Invalid text');
 const s=value.trim();if(s.length<min)return (()=>{throw Error('Required text missing')})();return s;
}
function safeLink(value){
 if(value===null||value==='')return null;
 const s=cleanText(value,1,1500);
 let parsed;try{parsed=new URL(s);}catch{throw Error('Invalid project URL');}
 if(parsed.protocol!=='https:'||!parsed.hostname||parsed.username||parsed.password||
    /^(?:localhost|.*\.localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/i.test(parsed.hostname))
   throw Error('Only public HTTPS destinations are permitted');
 return parsed.href;
}
function normalize(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!exactly(raw,FIELDS))throw Error('Invalid project fields');
 const slug=cleanText(raw.slug,3,90).toLowerCase();
 if(!SLUG.test(slug))throw Error('Invalid slug');
 if(!CATS.has(raw.category)||typeof raw.freeToUse!=='boolean')throw Error('Invalid project category or access');
 return {
  slug,title:cleanText(raw.title,3,100),summary:cleanText(raw.summary,10,280),
  description:cleanText(raw.description,0,8000),category:raw.category,freeToUse:raw.freeToUse?1:0,
  license:cleanText(raw.license,0,80),sourceUrl:safeLink(raw.sourceUrl),demoUrl:safeLink(raw.demoUrl),
  aiDisclosure:cleanText(raw.aiDisclosure,0,1200),humanContribution:cleanText(raw.humanContribution,0,1200)
 };
}
function readyToSubmit(row,eligibleAttachment){
 return Boolean((row.demo_url||row.source_url||eligibleAttachment) && row.license_name.trim().length>=2 &&
  row.ai_disclosure.trim().length>=6 && row.human_contribution.trim().length>=10);
}
async function body(req,cap=16000){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const raw=await boundedText(req,cap);if(raw===null)return null;
 try{const value=JSON.parse(raw);return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}
 catch{return null;}
}
async function rows(db,sql,params=[]){
 const result=await db.prepare(sql).bind(...params).all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('Database unavailable');
 return result.results;
}
async function change(db,sql,params=[]){
 const result=await db.prepare(sql).bind(...params).run();
 if(result?.success===false)throw Error('Database unavailable');
 return Number(result?.meta?.changes??0);
}
const getOne=async(db,sql,params=[])=>db.prepare(sql).bind(...params).first();
async function pace(db,user,action,now,limit){
 const reset=now-3600;
 const n=await change(db,
  'INSERT INTO member_studio_rate_limits(user_id,action,window_start,requests) VALUES(?,?,?,1) '+
  'ON CONFLICT(user_id,action) DO UPDATE SET window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END, '+
  'requests=CASE WHEN window_start<? THEN 1 ELSE requests+1 END WHERE window_start<? OR requests<?',
  [user,action,now,reset,reset,reset,limit]);
 return n===1;
}
export async function canonicalStudioSchemaReady(env){
 const db=env?.MEMBER_DB;
 if(!db?.prepare)return false;
 try{
  const names=await rows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_studio_projects','member_studio_assets','member_studio_rate_limits','member_studio_review_log')");
  if(new Set(names.map(x=>x.name)).size!==4)return false;
  const required=[
   ['member_studio_projects',['id','user_id','revision','status','source_url','demo_url']],
   ['member_studio_assets',['project_id','user_id','status','storage_key','size_bytes','lease_until']]
  ];
  for(const [table,columns] of required){
   const found=new Set((await rows(db,'PRAGMA table_info('+table+')')).map(x=>x.name));
   if(!columns.every(x=>found.has(x)))return false;
  }
  return true;
 }catch{return false;}
}
export async function studioReadiness(env){
 if(env?.CANONICAL_CREATOR_STUDIO_ENABLED!=='true')return {studioReady:false,studioUploadsReady:false};
 const ready=await canonicalStudioSchemaReady(env);
 return {studioReady:ready,studioUploadsReady:Boolean(ready&&studioUploadReady(env))};
}
export async function canonicalStudio(req,env,user,now=Math.floor(Date.now()/1000)){
 if(env?.CANONICAL_CREATOR_STUDIO_ENABLED!=='true')return fail(404,'Creator Studio is not activated');
 if(!await canonicalStudioSchemaReady(env))return fail(503,'Creator Studio schema is unavailable');
 if(typeof user?.id!=='string'||!user.id||user.emailVerified!==true)return fail(403,'Verified member required');
 const db=env.MEMBER_DB,url=new URL(req.url),path=url.pathname;
 if(url.search)return fail(400,'Unexpected query');
 const match=path.match(/^\/api\/v1\/member\/studio\/projects(?:\/([0-9a-f-]{36})(?:\/(submit|withdraw|assets)(?:\/([a-f0-9]{32})(?:\/(file))?)?)?)?$/);
 if(!match)return fail(404,'Not found');
 const id=match[1],sub=match[2],asset=match[3],file=match[4];
 if(id&&!UUID.test(id))return fail(404,'Not found');
 const profile=await getOne(db,'SELECT handle FROM member_creator_profiles WHERE user_id=?', [user.id]);
 if(!profile)return fail(409,'Complete your creator profile first');
 try{
  if(!id){
   if(req.method==='GET'){
    const items=await rows(db,'SELECT '+COLS+' FROM member_studio_projects WHERE user_id=? ORDER BY updated_at DESC,id DESC LIMIT 50',[user.id]);
    return json({projects:items.map(dbRow),uploadsReady:studioUploadReady(env,user.id)});
   }
   if(req.method!=='POST')return fail(405,'Method not allowed');
   const incoming=await body(req);
   if(!incoming||!exactly(incoming,['clientRequestId','draft'])||!UUID.test(incoming.clientRequestId))
    return fail(400,'Invalid project request');
   let v;try{v=normalize(incoming.draft)}catch(e){return fail(422,e.message);}
   const existing=await getOne(db,'SELECT '+COLS+' FROM member_studio_projects WHERE user_id=? AND client_request_id=?',[user.id,incoming.clientRequestId]);
   if(existing)return json({project:dbRow(existing),replayed:true});
   if(!await pace(db,user.id,'project',now,30))return fail(429,'Too many project updates');
   const created=await rows(db,
    'INSERT INTO member_studio_projects(id,user_id,client_request_id,slug,title,summary,description,category,free_to_use,license_name,source_url,demo_url,ai_disclosure,human_contribution,created_at,updated_at) '+
    'SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE '+
    "(SELECT COUNT(*) FROM member_studio_projects WHERE user_id=? AND status IN ('draft','pending_review','changes_requested'))<20 "+
    'ON CONFLICT(user_id,client_request_id) DO NOTHING RETURNING '+COLS,
    [crypto.randomUUID(),user.id,incoming.clientRequestId,v.slug,v.title,v.summary,v.description,
     v.category,v.freeToUse,v.license,v.sourceUrl,v.demoUrl,v.aiDisclosure,v.humanContribution,now,now,user.id]);
   if(created.length===1)return json({project:dbRow(created[0]),replayed:false},201);
   const replay=await getOne(db,'SELECT '+COLS+' FROM member_studio_projects WHERE user_id=? AND client_request_id=?',[user.id,incoming.clientRequestId]);
   return replay?json({project:dbRow(replay),replayed:true}):fail(409,'Project capacity or slug conflict');
  }
  const selected=await getOne(db,'SELECT '+COLS+' FROM member_studio_projects WHERE id=? AND user_id=?',[id,user.id]);
  if(!selected)return fail(404,'Project not found');
  if(sub==='assets')return canonicalStudioAssets(req,env,user,selected,{asset,file,now,pace});
  // Withdrawal preserves the private project record while removing it from
  // the staff queue. A pending review never prevents a member from withdrawing.
  if(sub==='withdraw'){
   if(req.method!=='POST')return fail(405,'Method not allowed');
   const input=await body(req,500);
   if(!input||!exactly(input,['revision'])||!Number.isSafeInteger(input.revision))return fail(400,'Invalid revision');
   if(selected.revision!==input.revision||selected.status!=='pending_review')return fail(409,'Submission changed');
   const changes=await rows(db,
    "UPDATE member_studio_projects SET status='draft',revision=revision+1,updated_at=?,submitted_at=NULL "+
    "WHERE id=? AND user_id=? AND status='pending_review' AND revision=? RETURNING "+COLS,
    [now,id,user.id,input.revision]);
   return changes.length===1?json({project:dbRow(changes[0])}):fail(409,'Submission already reviewed or withdrawn');
  }
  if(sub==='submit'){
   if(req.method!=='POST')return fail(405,'Method not allowed');
   const value=await body(req,500);
   if(!value||!exactly(value,['revision'])||!Number.isSafeInteger(value.revision))return fail(400,'Invalid revision');
   if(selected.revision!==value.revision||!['draft','changes_requested'].includes(selected.status))
    return fail(409,'Project revision changed');
   const kinds=ELIGIBLE_ASSET_KINDS[selected.category]||[];
   const hasExternal=Boolean(selected.demo_url||selected.source_url);
   const proof=kinds.length?
    "EXISTS(SELECT 1 FROM member_studio_assets a WHERE a.project_id=? AND a.user_id=? AND a.status='quarantined' AND a.kind IN ("+
     kinds.map(()=>'?').join(',')+"))":"0=1";
   const proofArgs=[id,user.id,...kinds];
   const eligible=hasExternal?true:kinds.length?Boolean(await getOne(db,
    'SELECT a.id FROM member_studio_assets a WHERE a.project_id=? AND a.user_id=? AND a.status=\'quarantined\' AND a.kind IN ('+
    kinds.map(()=>'?').join(',')+') LIMIT 1',proofArgs)):false;
   if(!readyToSubmit(selected,eligible))return fail(422,
    'Add a matching quarantined creation file OR a public HTTPS destination, plus license and accurate contribution disclosures before review');
   if(!await pace(db,user.id,'project',now,30))return fail(429,'Too many project updates');
   // Recheck file existence atomically with submission to defeat concurrent
   // private file withdrawals. No object becomes public.
   const found=await rows(db,
    "UPDATE member_studio_projects SET status='pending_review',revision=revision+1,updated_at=?,submitted_at=? "+
    "WHERE id=? AND user_id=? AND revision=? AND status IN ('draft','changes_requested') "+
    (hasExternal?'':"AND "+proof+" ")+"RETURNING "+COLS,
    [now,now,id,user.id,value.revision,...(hasExternal?[]:proofArgs)]);
   return found.length===1?json({project:dbRow(found[0]),note:'Private review queue only; no publication or gameplay activation'}):fail(409,'Project revision changed');
  }
  if(sub)return fail(404,'Not found');
  if(req.method==='GET'){
   const history=await rows(db,
    'SELECT action,reason,created_at FROM member_studio_review_log WHERE project_id=? ORDER BY created_at DESC LIMIT 20',[id]);
   return json({project:dbRow(selected),uploadsReady:studioUploadReady(env,user.id),reviewHistory:history.map(x=>({action:x.action,reason:x.reason,createdAt:Number(x.created_at)}))});
  }
  if(req.method==='DELETE'){
   const input=await body(req,500);
   if(!input||!exactly(input,['revision'])||!Number.isSafeInteger(input.revision))return fail(400,'Invalid revision');
   if(selected.revision!==input.revision||!['draft','changes_requested','rejected'].includes(selected.status))
    return fail(409,'Project must be withdrawn from review before deletion');
   if(!await pace(db,user.id,'project',now,30))return fail(429,'Too many project updates');
   const result=await rows(db,
    "DELETE FROM member_studio_projects WHERE id=? AND user_id=? AND revision=? "+
    "AND status IN ('draft','changes_requested','rejected') AND "+
    'NOT EXISTS(SELECT 1 FROM member_studio_assets WHERE project_id=?) RETURNING id',
    [id,user.id,input.revision,id]);
   return result.length===1?json({deleted:true}):fail(409,'Remove private files or withdraw review before deleting this project');
  }
  if(req.method!=='PATCH')return fail(405,'Method not allowed');
  const incoming=await body(req);
  if(!incoming||!exactly(incoming,['revision','draft'])||!Number.isSafeInteger(incoming.revision))
   return fail(400,'Invalid update');
  if(selected.revision!==incoming.revision||!['draft','changes_requested'].includes(selected.status))
   return fail(409,'Project is locked or has changed');
  let v;try{v=normalize(incoming.draft)}catch(e){return fail(422,e.message);}
  if(!await pace(db,user.id,'project',now,30))return fail(429,'Too many project updates');
  const changed=await rows(db,
   "UPDATE member_studio_projects SET slug=?,title=?,summary=?,description=?,category=?,free_to_use=?,license_name=?,source_url=?,demo_url=?,ai_disclosure=?,human_contribution=?,revision=revision+1,updated_at=? "+
   "WHERE id=? AND user_id=? AND revision=? AND status IN ('draft','changes_requested') RETURNING "+COLS,
   [v.slug,v.title,v.summary,v.description,v.category,v.freeToUse,v.license,v.sourceUrl,v.demoUrl,
    v.aiDisclosure,v.humanContribution,now,id,user.id,incoming.revision]);
  return changed.length===1?json({project:dbRow(changed[0])}):fail(409,'Project changed, reload your draft');
 }catch{return fail(503,'Creator Studio transaction unavailable');}
}
export async function canonicalStudioReview(req,env,user,now=Math.floor(Date.now()/1000)){
 if(env?.CANONICAL_CREATOR_STUDIO_ENABLED!=='true'||!await canonicalStudioSchemaReady(env))
  return fail(404,'Studio review not active');
 if(typeof user?.id!=='string'||user.emailVerified!==true)return fail(401,'Sign in required');
 // Studio reviewer privilege is NOT inherited from forum moderation.
 const reviewers=(env.CANONICAL_STUDIO_REVIEWER_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
 if(!reviewers.includes(user.id))return fail(403,'Reviewer access required');
 const url=new URL(req.url),path=url.pathname;
 if(url.search)return fail(400,'Unexpected query');
 const manifest=path.match(/^\/api\/v1\/member\/studio\/review\/([0-9a-f-]{36})\/manifest$/);
 if(manifest&&!UUID.test(manifest[1]))return fail(404,'Not found');
 if(!manifest&&path!==PREFIX+'/review')return fail(404,'Not found');
 const db=env.MEMBER_DB;
 try{
  if(req.method==='GET'){
   if(manifest){
    // Only vetted metadata, NEVER object keys, download credentials, file
    // bodies or executable previews on the site origin. No self-review.
    const project=await getOne(db,
     "SELECT id,user_id,status,revision FROM member_studio_projects WHERE id=? AND status='pending_review'",
     [manifest[1]]);
    if(!project||project.user_id===user.id)return fail(404,'Submission not available for review');
    const list=await rows(db,
     'SELECT id,filename,kind,content_type,size_bytes,status,sha256,uploaded_at '+
     'FROM member_studio_assets WHERE project_id=? AND user_id=? ORDER BY created_at,id LIMIT 21',
     [project.id,project.user_id]);
    return json({projectId:project.id,revision:Number(project.revision),
     note:'Quarantined bytes have NOT passed malware scanning; no rendering or download is authorized.',
     assets:list.map(x=>({id:x.id,name:x.filename,kind:x.kind,contentType:x.content_type,
      sizeBytes:Number(x.size_bytes),status:x.status,sha256:x.sha256||null,
      uploadedAt:x.uploaded_at===null?null:Number(x.uploaded_at)}))});
   }
   const projects=await rows(db,
    'SELECT s.id,s.title,s.summary,s.category,s.status,s.revision,s.submitted_at,s.demo_url,s.source_url,'+
    's.license_name,s.ai_disclosure,s.human_contribution,s.user_id,p.handle,'+
    "(SELECT COUNT(*) FROM member_studio_assets a WHERE a.project_id=s.id AND a.status='quarantined') AS attachment_count,"+
    "(SELECT COALESCE(SUM(a.size_bytes),0) FROM member_studio_assets a WHERE a.project_id=s.id AND a.status='quarantined') AS attachment_bytes "+
    'FROM member_studio_projects s JOIN member_creator_profiles p ON p.user_id=s.user_id '+
    "WHERE s.status='pending_review' AND s.user_id<>? ORDER BY s.submitted_at ASC LIMIT 50",[user.id]);
   return json({projects});
  }
  if(manifest)return fail(405,'Manifest is read-only');
  if(req.method!=='POST')return fail(405,'Method not allowed');
  const raw=await body(req,1800);
  if(!raw||!exactly(raw,['projectId','action','reason','revision'])||!UUID.test(raw.projectId)||
    !['changes_requested','rejected'].includes(raw.action)||!Number.isSafeInteger(raw.revision))
   return fail(400,'Invalid review decision');
  let reason;try{reason=cleanText(raw.reason,12,1200)}catch{return fail(422,'Explain your decision');}
  const target=await getOne(db,'SELECT user_id,status,revision FROM member_studio_projects WHERE id=?',[raw.projectId]);
  if(!target||target.status!=='pending_review'||target.revision!==raw.revision)
   return fail(409,'Submission changed or is unavailable');
  if(target.user_id===user.id)return fail(403,'Independent review required');
  // D1 batch is transactionally atomic: no decision without its audit record.
  const auditId=crypto.randomUUID();
  const statements=[
    db.prepare("UPDATE member_studio_projects SET status=?,revision=revision+1,updated_at=? WHERE id=? AND status='pending_review' AND revision=?")
      .bind(raw.action,now,raw.projectId,raw.revision),
    db.prepare('INSERT INTO member_studio_review_log(id,project_id,reviewer_id,action,reason,created_at) '+
      'SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND status=? AND revision=?)')
      .bind(auditId,raw.projectId,user.id,raw.action,reason,now,raw.projectId,raw.action,raw.revision+1)
  ];
  const result=await db.batch(statements);
  return result[0]?.meta?.changes===1&&result[1]?.meta?.changes===1?
    json({ok:true,status:raw.action}):fail(409,'Submission changed during review');
 }catch{return fail(503,'Studio review unavailable');}
}

/**
 * Export member-owned Studio metadata even if the feature is paused. Raw asset
 * bytes stay accessible through authenticated private downloads while enabled;
 * never include internal R2 keys, auth credentials or a public object URL.
 */
export async function canonicalStudioExport(env,userId){
 if(!await canonicalStudioSchemaReady(env))return null;
 const projects=(await rows(env.MEMBER_DB,'SELECT '+COLS+' FROM member_studio_projects WHERE user_id=? ORDER BY created_at ASC LIMIT 50',[userId])).map(dbRow);
 const assets=await rows(env.MEMBER_DB,
  'SELECT id,project_id,filename,kind,content_type,size_bytes,status,sha256,uploaded_at FROM member_studio_assets WHERE user_id=? ORDER BY created_at ASC LIMIT 500',
  [userId]);
 return {projects,assets:assets.map(a=>({
  id:a.id,projectId:a.project_id,name:a.filename,kind:a.kind,contentType:a.content_type,
  sizeBytes:Number(a.size_bytes),status:a.status,sha256:a.sha256,uploadedAt:a.uploaded_at
 }))};
}
