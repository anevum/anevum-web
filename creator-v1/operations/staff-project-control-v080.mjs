/* ANEVUM IREN / STAFF V080 — explicit owner lifecycle controls.
   Intended for staff-only Worker behind Cloudflare Access and a verified
   canonical Better Auth session + unrevoked staff_access_grants row.
   Keep the D1 migration and Worker deployment in one reviewed release. */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UNPUBLISHED="OWNER_UNPUBLISHED_V080";
const actions=new Set(["unpublish","restore","delete","retry_cleanup"]);
const now=()=>Math.floor(Date.now()/1000);
const items=out=>Array.isArray(out?.results)?out.results:[];
const changed=out=>Number(out?.meta?.changes||0)===1||items(out).length===1;
async function all(db,sql,args=[]){
 const out=await db.prepare(sql).bind(...args).all();
 if(out?.success===false||!Array.isArray(out?.results))throw Error("Staff database unavailable");
 return out.results;
}
async function row(db,sql,args=[]){return (await all(db,sql,args))[0]||null;}
export async function controlSchemaReady(db){
 try{
  const results=await all(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('anevum_alpha_project_admin_events','anevum_alpha_project_deletions')");
  return results.length===2;
 }catch{return false;}
}
export async function staffInventory(db,role){
 if(!["owner","reviewer"].includes(role))throw Error("Reviewer authorization required");
 const scope=role==="owner"?"":"WHERE p.status='pending_review'";
 const projects=await all(db,"SELECT p.id,p.title,p.summary,p.kind,p.filename,p.size_bytes,p.status,p.created_at,p.submitted_at,p.published_at,p.rejection_reason,COALESCE(cp.display_name,u.name,'ANEVUM member') AS creator FROM anevum_alpha_projects p JOIN \"user\" u ON u.id=p.owner_id LEFT JOIN member_creator_profiles cp ON cp.user_id=p.owner_id "+scope+" ORDER BY CASE WHEN p.status='pending_review' THEN 0 ELSE 1 END,p.submitted_at ASC,p.created_at DESC LIMIT 250");
 const recent=await all(db,"SELECT title,status,reviewed_at FROM anevum_alpha_projects WHERE status IN ('published','rejected') AND reviewed_at IS NOT NULL ORDER BY reviewed_at DESC LIMIT 8");
 const enabled=role==="owner"&&await controlSchemaReady(db);
 let cleanups=[];
 if(enabled)cleanups=await all(db,"SELECT project_id,title,requested_at,attempts FROM anevum_alpha_project_deletions WHERE cleaned_at IS NULL ORDER BY requested_at DESC LIMIT 20");
 return {projects,recent,controlsReady:enabled,cleanups};
}
function safeInput(value){
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid action payload");
 if(!actions.has(value.action)||!UUID.test(String(value.projectId||"")))throw Error("Unknown project action");
 return value;
}
export async function staffOwnerAction(env,memberId,role,input){
 if(role!=="owner"||!memberId)return {status:403,body:{error:"Owner clearance required"}};
 let data;try{data=safeInput(input)}catch{return {status:400,body:{error:"Invalid project action"}}}
 const db=env.DB;if(!db||!await controlSchemaReady(db))return {status:503,body:{error:"Project management schema not ready"}};
 const {projectId,action}=data;
 if(action==="retry_cleanup"){
  const old=await row(db,"SELECT project_id,object_key,cleaned_at FROM anevum_alpha_project_deletions WHERE project_id=?",[projectId]);
  if(!old)return {status:404,body:{error:"No deletion cleanup record"}};
  if(old.cleaned_at!==null)return {status:200,body:{ok:true,deleted:true,storageCleanup:"complete"}};
  return finishCleanup(env,old);
 }
 const p=await row(db,"SELECT id,owner_id,title,kind,status,object_key,sha256,published_at,rejection_reason FROM anevum_alpha_projects WHERE id=?",[projectId]);
 if(!p)return {status:404,body:{error:"Project no longer exists"}};
 if(typeof data.confirmedTitle!=="string"||data.confirmedTitle!==p.title)return {status:422,body:{error:"Type the exact project title to confirm"}};
 const t=now();
 if(action==="unpublish"){
  if(p.status!=="published")return {status:409,body:{error:"Only published projects can be unpublished"}};
  const batch=await db.batch([
   db.prepare("INSERT INTO anevum_alpha_project_admin_events(id,project_id,actor_id,action,previous_status,next_status,title,created_at) SELECT ?,id,?,'unpublish','published','rejected',title,? FROM anevum_alpha_projects WHERE id=? AND status='published' RETURNING id").bind(crypto.randomUUID(),memberId,t,projectId),
   db.prepare("UPDATE anevum_alpha_projects SET status='rejected',rejection_reason=? WHERE id=? AND status='published' RETURNING id").bind(UNPUBLISHED,projectId)
  ]);
  if(!changed(batch[0])||!changed(batch[1]))return {status:409,body:{error:"Publication changed; refresh project library"}};
  return {status:200,body:{ok:true,status:"unpublished",note:"Removed from public Discover and anonymous player access."}};
 }
 if(action==="restore"){
  if(p.status!=="rejected"||p.rejection_reason!==UNPUBLISHED||!p.published_at)
   return {status:409,body:{error:"This project was not unpublished by the owner"}};
  const batch=await db.batch([
   db.prepare("INSERT INTO anevum_alpha_project_admin_events(id,project_id,actor_id,action,previous_status,next_status,title,created_at) SELECT ?,id,?,'restore','rejected','published',title,? FROM anevum_alpha_projects WHERE id=? AND status='rejected' AND rejection_reason=? AND published_at IS NOT NULL RETURNING id").bind(crypto.randomUUID(),memberId,t,projectId,UNPUBLISHED),
   db.prepare("UPDATE anevum_alpha_projects SET status='published',rejection_reason=NULL WHERE id=? AND status='rejected' AND rejection_reason=? AND published_at IS NOT NULL RETURNING id").bind(projectId,UNPUBLISHED)
  ]);
  if(!changed(batch[0])||!changed(batch[1]))return {status:409,body:{error:"Publication changed; refresh project library"}};
  return {status:200,body:{ok:true,status:"published",note:"Restored approved publication."}};
 }
 // Destructive project removal: SQL batch is atomic; the R2 object is removed
 // only after the project and dependents have been removed from public access.
 // An immutable tombstone retains the object key for idempotent recovery.
 if(action==="delete"){
  if(data.confirmDelete!==true)return {status:422,body:{error:"Permanent deletion confirmation required"}};
  const batch=await db.batch([
   db.prepare("INSERT INTO anevum_alpha_project_deletions(project_id,title,owner_id,object_key,sha256,requested_by,requested_at,attempts) SELECT id,title,owner_id,object_key,sha256,?,?,0 FROM anevum_alpha_projects WHERE id=? AND status=? RETURNING project_id").bind(memberId,t,projectId,p.status),
   db.prepare("INSERT INTO anevum_alpha_project_admin_events(id,project_id,actor_id,action,previous_status,next_status,title,created_at) SELECT ?,id,?,'delete',status,'deleted',title,? FROM anevum_alpha_projects WHERE id=? AND status=? RETURNING id").bind(crypto.randomUUID(),memberId,t,projectId,p.status),
   db.prepare("DELETE FROM anevum_alpha_projects WHERE id=? AND status=? RETURNING id").bind(projectId,p.status)
  ]);
  if(batch.some(result=>!changed(result)))return {status:409,body:{error:"Project state changed; refresh before deleting"}};
  return finishCleanup(env,{project_id:projectId,object_key:p.object_key});
 }
 return {status:400,body:{error:"Unknown action"}};
}
async function finishCleanup(env,tombstone){
 const db=env.DB;
 if(!env.MEDIA)return {status:202,body:{ok:true,deleted:true,storageCleanup:"pending",note:"Project removed; object storage is unavailable. Retry cleanup from Staff."}};
 try{
  await env.MEDIA.delete(tombstone.object_key);
  await db.prepare("UPDATE anevum_alpha_project_deletions SET cleaned_at=?,last_error=NULL,attempts=attempts+1 WHERE project_id=? AND cleaned_at IS NULL").bind(now(),tombstone.project_id).run();
  return {status:200,body:{ok:true,deleted:true,storageCleanup:"complete"}};
 }catch{
  // Never resurrect deleted DB records or lose the R2 key for a later retry.
  try{await db.prepare("UPDATE anevum_alpha_project_deletions SET last_error='cleanup_pending',attempts=attempts+1 WHERE project_id=? AND cleaned_at IS NULL").bind(tombstone.project_id).run()}catch{}
  return {status:202,body:{ok:true,deleted:true,storageCleanup:"pending",note:"Project removed from the database. Private file cleanup is pending; retry from Staff."}};
 }
}
export {UNPUBLISHED};
