/* ANEVUM PACKAGE V004 — D1 storage leases, atomic R2 budgets and build policy. */
import {POLICY,ResourceError,sourcePrefix,physicalBytes} from "./resource-policy.mjs";
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
export async function resourcePolicyReady(db){
  // One zero-row compile-time readiness probe instead of five D1 round trips.
  try{
    await db.prepare("SELECT l.owner_id FROM anevum_package_upload_leases l "+
      "CROSS JOIN anevum_package_upload_reservations r "+
      "CROSS JOIN anevum_package_cleanup_jobs c "+
      "CROSS JOIN anevum_package_build_retention b "+
      "CROSS JOIN anevum_package_daily_limits d LIMIT 0").all();
    return true;
  }catch{return false;}
}
export async function acquireUploadLease(db,ownerId,token,now){
  return !!(await one(db,
    "INSERT INTO anevum_package_upload_leases(owner_id,token,expires_at,updated_at) VALUES(?,?,?,?) "+
    "ON CONFLICT(owner_id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at,updated_at=excluded.updated_at "+
    "WHERE anevum_package_upload_leases.expires_at<=? RETURNING token",
    ownerId,token,now+POLICY.leaseSeconds,now,now))?.token;
}
export async function releaseUploadLease(db,ownerId,token){
  return run(db,"DELETE FROM anevum_package_upload_leases WHERE owner_id=? AND token=?",ownerId,token);
}
export async function recordUploadAttempt(db,ownerId,now){
  const h=await one(db,
    "INSERT INTO anevum_package_upload_limits(owner_id,window_start,attempts) VALUES(?,?,1) "+
    "ON CONFLICT(owner_id) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,"+
    "window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END RETURNING attempts",
    ownerId,now,now-3600,now-3600);
  const day=Math.floor(now/86400)*86400;
  const d=await one(db,
    "INSERT INTO anevum_package_daily_limits(owner_id,window_start,attempts,upload_bytes) VALUES(?,?,1,0) "+
    "ON CONFLICT(owner_id) DO UPDATE SET attempts=CASE WHEN window_start<>excluded.window_start THEN 1 ELSE attempts+1 END,"+
    "upload_bytes=CASE WHEN window_start<>excluded.window_start THEN 0 ELSE upload_bytes END,"+
    "window_start=excluded.window_start RETURNING attempts,upload_bytes",
    ownerId,day);
  if(h.attempts>POLICY.hourlyAttempts)
    throw new ResourceError("Hourly upload limit reached. Try again after the window resets.",429);
  if(d.attempts>POLICY.dailyAttempts||d.upload_bytes>=POLICY.dailyArchiveBytes)
    throw new ResourceError("Daily upload budget reached. Continue testing locally or try again tomorrow.",429);
}
export async function recordUploadBytes(db,ownerId,bytes,now){
  if(!Number.isSafeInteger(bytes)||bytes<1||bytes>POLICY.maxSourceBytes)
    throw new ResourceError("Package exceeds the current archive limit",413);
  const day=Math.floor(now/86400)*86400;
  const accepted=await one(db,
    "UPDATE anevum_package_daily_limits SET upload_bytes=upload_bytes+? "+
    "WHERE owner_id=? AND window_start=? AND upload_bytes+?<=? RETURNING upload_bytes",
    bytes,ownerId,day,bytes,POLICY.dailyArchiveBytes);
  if(!accepted)throw new ResourceError("Daily upload budget reached. Try again tomorrow.",429);
}
export async function getStorageUsage(db,ownerId){
  const active=await one(db,
    "SELECT COALESCE(SUM(CASE WHEN p.owner_id=? THEN r.archive_bytes ELSE 0 END),0) member_archive,"+
    "COALESCE(SUM(CASE WHEN p.owner_id=? THEN r.archive_bytes+r.expanded_bytes ELSE 0 END),0) member_physical,"+
    "COALESCE(SUM(r.archive_bytes+r.expanded_bytes),0) pilot_physical "+
    "FROM anevum_package_releases r JOIN anevum_package_projects p ON p.id=r.project_id "+
    "LEFT JOIN anevum_package_cleanup_jobs j ON j.release_id=r.id "+
    "WHERE (r.status IN ('ready','pending_review','published','rejected') OR (r.status IN ('revoked','failed') AND r.source_key IS NOT NULL)) AND j.release_id IS NULL AND (p.status!='deleted' OR r.source_key IS NOT NULL)",
    ownerId,ownerId);
  const pending=await one(db,
    "SELECT COALESCE(SUM(CASE WHEN p.owner_id=? THEN j.physical_bytes ELSE 0 END),0) member_pending,"+
    "COALESCE(SUM(j.physical_bytes),0) pilot_pending,COUNT(*) cleanup_jobs "+
    "FROM anevum_package_cleanup_jobs j JOIN anevum_package_releases r ON r.id=j.release_id "+
    "JOIN anevum_package_projects p ON p.id=r.project_id",ownerId);
  const reserved=await one(db,
    "SELECT COALESCE(SUM(CASE WHEN owner_id=? THEN physical_bytes ELSE 0 END),0) member_reserved,"+
    "COALESCE(SUM(physical_bytes),0) pilot_reserved,COUNT(*) reservations "+
    "FROM anevum_package_upload_reservations",ownerId);
  return {
    memberArchiveBytes:Number(active?.member_archive||0)+Number(pending?.member_pending||0)+Number(reserved?.member_reserved||0),
    memberPhysicalBytes:Number(active?.member_physical||0)+Number(pending?.member_pending||0)+Number(reserved?.member_reserved||0),
    pilotPhysicalBytes:Number(active?.pilot_physical||0)+Number(pending?.pilot_pending||0)+Number(reserved?.pilot_reserved||0),
    memberArchiveLimit:POLICY.memberArchiveBytes,
    memberPhysicalLimit:POLICY.memberPhysicalBytes,
    pilotPhysicalLimit:POLICY.pilotPhysicalBytes,
    cleanupPending:Number(pending?.cleanup_jobs||0),
    reservations:Number(reserved?.reservations||0)
  };
}
export async function reserveUpload(db,{ownerId,projectId,releaseId,archiveBytes,expandedBytes,now,prefix}){
  const physical=physicalBytes(archiveBytes,expandedBytes),id=crypto.randomUUID();
  // D1 evaluates all capacity predicates in the one atomic INSERT; cleanup remains charged.
  const sql=[
    "INSERT INTO anevum_package_upload_reservations(id,owner_id,project_id,release_id,physical_bytes,object_prefix,status,created_at,expires_at)",
    "SELECT ?1,?2,?3,?4,?5,?6,'uploading',?7,?8 WHERE",
    "(SELECT COALESCE(SUM(r.archive_bytes),0) FROM anevum_package_releases r",
    "JOIN anevum_package_projects p ON p.id=r.project_id",
    "LEFT JOIN anevum_package_cleanup_jobs j ON j.release_id=r.id",
    "WHERE p.owner_id=?2 AND (p.status!='deleted' OR r.source_key IS NOT NULL) AND (r.status IN ('ready','pending_review','published','rejected') OR (r.status IN ('revoked','failed') AND r.source_key IS NOT NULL)) AND j.release_id IS NULL)",
    "+(SELECT COALESCE(SUM(j.physical_bytes),0) FROM anevum_package_cleanup_jobs j JOIN anevum_package_releases r ON r.id=j.release_id JOIN anevum_package_projects p ON p.id=r.project_id WHERE p.owner_id=?2)",
    "+(SELECT COALESCE(SUM(physical_bytes),0) FROM anevum_package_upload_reservations WHERE owner_id=?2)+?9<=?10",
    "AND (SELECT COALESCE(SUM(r.archive_bytes+r.expanded_bytes),0) FROM anevum_package_releases r",
    "JOIN anevum_package_projects p ON p.id=r.project_id",
    "LEFT JOIN anevum_package_cleanup_jobs j ON j.release_id=r.id",
    "WHERE p.owner_id=?2 AND (p.status!='deleted' OR r.source_key IS NOT NULL) AND (r.status IN ('ready','pending_review','published','rejected') OR (r.status IN ('revoked','failed') AND r.source_key IS NOT NULL)) AND j.release_id IS NULL)",
    "+(SELECT COALESCE(SUM(j.physical_bytes),0) FROM anevum_package_cleanup_jobs j",
    "JOIN anevum_package_releases r ON r.id=j.release_id JOIN anevum_package_projects p ON p.id=r.project_id WHERE p.owner_id=?2)",
    "+(SELECT COALESCE(SUM(physical_bytes),0) FROM anevum_package_upload_reservations WHERE owner_id=?2)+?5<=?11",
    "AND (SELECT COALESCE(SUM(r.archive_bytes+r.expanded_bytes),0) FROM anevum_package_releases r",
    "JOIN anevum_package_projects p ON p.id=r.project_id",
    "LEFT JOIN anevum_package_cleanup_jobs j ON j.release_id=r.id",
    "WHERE (p.status!='deleted' OR r.source_key IS NOT NULL) AND (r.status IN ('ready','pending_review','published','rejected') OR (r.status IN ('revoked','failed') AND r.source_key IS NOT NULL)) AND j.release_id IS NULL)",
    "+(SELECT COALESCE(SUM(physical_bytes),0) FROM anevum_package_cleanup_jobs)",
    "+(SELECT COALESCE(SUM(physical_bytes),0) FROM anevum_package_upload_reservations)+?5<=?12 RETURNING id"
  ].join(" ");
  const accepted=await one(db,sql,id,ownerId,projectId,releaseId,physical,
    prefix,now,now+POLICY.leaseSeconds,archiveBytes,
    POLICY.memberArchiveBytes,POLICY.memberPhysicalBytes,POLICY.pilotPhysicalBytes);
  if(!accepted?.id)throw new ResourceError("Storage allowance reached. Discard old test builds or free private storage before uploading.",409);
  return id;
}
export async function markReservationForCleanup(db,id,now){
  await run(db,"UPDATE anevum_package_upload_reservations SET status='cleanup',expires_at=? WHERE id=?",now,id);
}
export function jobStatement(db,releaseId,reason,now,notBefore=now){
  return db.prepare(
    "INSERT OR IGNORE INTO anevum_package_cleanup_jobs(release_id,physical_bytes,reason,not_before,created_at,updated_at) "+
    "SELECT r.id,r.archive_bytes+r.expanded_bytes,?,?,?,? FROM anevum_package_releases r WHERE r.id=? "+
    "AND r.status IN ('revoked','rejected','failed') "+
    "AND NOT EXISTS(SELECT 1 FROM anevum_package_projects p WHERE p.live_release_id=r.id OR p.draft_release_id=r.id)"
  ).bind(reason,notBefore,now,now,releaseId);
}
export async function findDuplicate(db,media,project,sha,size,metadata=null){
  if(!metadata)return null;
  if(!project||!/^[a-f0-9]{64}$/.test(sha||""))return null;
  const r=await one(db,
    "SELECT r.id,r.status,r.archive_sha256,r.archive_bytes,r.source_key,r.proposed_title,r.proposed_summary,r.proposed_category FROM anevum_package_releases r "+
    "LEFT JOIN anevum_package_build_retention b ON b.release_id=r.id "+
    "WHERE r.project_id=? AND r.archive_sha256=? AND r.archive_bytes=? "+
    "AND ((r.id=? AND r.status='ready' AND (b.release_id IS NULL OR b.mode='saved' OR (b.mode='test' AND b.expires_at>?))) "+
    "OR (r.id=? AND r.status='published')) LIMIT 1",
    project.id,sha,size,project.draft_release_id||"",Math.floor(Date.now()/1000),project.live_release_id||"");
  if(!r?.source_key||r.proposed_title!==metadata.title||r.proposed_summary!==metadata.summary||r.proposed_category!==metadata.category)return null;
  const cover=await one(db,"SELECT sha256 FROM anevum_package_files WHERE release_id=? AND path='_anevum/cover.png'",r.id);
  if((cover?.sha256||null)!==(metadata.coverSha||null))return null;
  const file=await media.head(r.source_key);
  if(!file||file.size!==size||file.customMetadata?.sha256!==sha)return null;
  return {duplicate:true,id:project.id,release_id:r.id,status:r.status,
    play_url:"/play/v3/"+project.id+(r.status==="ready"?"?preview=1":"")};
}
export async function saveDraft(env,ownerId,projectId,now,expectedRelease=null){
  const p=await one(env.DB,"SELECT * FROM anevum_package_projects WHERE id=? AND owner_id=? AND status!='deleted'",projectId,ownerId);
  if(!p)throw new ResourceError("Project unavailable",404);
  const r=p.draft_release_id?await one(env.DB,"SELECT * FROM anevum_package_releases WHERE id=? AND project_id=?",p.draft_release_id,p.id):null;
  if(expectedRelease!==null&&r?.id!==expectedRelease)throw new ResourceError("The private build changed. Reopen it before continuing.",409);
  if(r?.status!=="ready")throw new ResourceError("There is no private test build to save",409);
  // Atomically verify expiry, owner, pointer and status in the same retention write.
  // Previously uploaded V003 ready builds may not have a retention row yet.
  const saved=await one(env.DB,
    "INSERT INTO anevum_package_build_retention(release_id,mode,expires_at,created_at,updated_at) "+
    "SELECT r.id,'saved',NULL,?,? FROM anevum_package_releases r "+
    "JOIN anevum_package_projects p ON p.id=r.project_id "+
    "LEFT JOIN anevum_package_build_retention b ON b.release_id=r.id "+
    "WHERE r.id=? AND p.owner_id=? AND p.draft_release_id=r.id AND r.status='ready' "+
    "AND (b.release_id IS NULL OR b.mode='saved' OR (b.mode='test' AND b.expires_at>?)) "+
    "ON CONFLICT(release_id) DO UPDATE SET mode='saved',expires_at=NULL,updated_at=excluded.updated_at "+
    "RETURNING release_id",
    now,now,r.id,ownerId,now);
  if(!saved?.release_id)throw new ResourceError("This test build expired or changed. Replace the build to continue.",409);
  return {saved:true,id:projectId,release_id:r.id};
}
export async function discardDraft(env,ownerId,projectId,now,expectedRelease=null){
  const p=await one(env.DB,"SELECT * FROM anevum_package_projects WHERE id=? AND owner_id=? AND status!='deleted'",projectId,ownerId);
  if(!p)throw new ResourceError("Project unavailable",404);
  const r=p?.draft_release_id?await one(env.DB,"SELECT * FROM anevum_package_releases WHERE id=? AND project_id=?",p.draft_release_id,p.id):null;
  if(expectedRelease!==null&&r?.id!==expectedRelease)throw new ResourceError("The private build changed. Reopen it before continuing.",409);
  if(r?.status!=="ready")throw new ResourceError("Only an unsubmitted private build can be discarded",409);
  const result=await env.DB.batch([
    env.DB.prepare("UPDATE anevum_package_projects SET draft_release_id=NULL,updated_at=?,status=CASE WHEN live_release_id IS NULL THEN 'draft' ELSE status END WHERE id=? AND owner_id=? AND draft_release_id=? AND EXISTS(SELECT 1 FROM anevum_package_releases WHERE id=? AND status='ready')")
      .bind(now,projectId,ownerId,r.id,r.id),
    env.DB.prepare("UPDATE anevum_package_releases SET status='revoked' WHERE id=? AND status='ready' AND NOT EXISTS(SELECT 1 FROM anevum_package_projects WHERE draft_release_id=?)").bind(r.id,r.id),
    jobStatement(env.DB,r.id,"discarded",now)
  ]);
  if(result[0]?.meta?.changes!==1||result[1]?.meta?.changes!==1)
    throw new ResourceError("The private build changed during discard",409);
  return {discarded:true,id:projectId,cleanupQueued:true};
}
