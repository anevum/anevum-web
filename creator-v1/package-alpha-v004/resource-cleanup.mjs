/* ANEVUM PACKAGE V004 — bounded private R2 garbage collection.
 * Fail closed: no public release or active draft can be deleted.
 * Cron and owner discard can invoke this. R2 removal must succeed before D1 file deletion.
 */
import {POLICY,sourcePrefix} from "./resource-policy.mjs";
import {jobStatement,resourcePolicyReady} from "./resource-service.mjs";
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();

async function purgePrefix(media,prefix) {
  for(let batch=0;batch<4;batch++){
    const result=await media.list({prefix,limit:100});
    const keys=(result.objects||[]).map(x=>x.key);
    if(keys.length===0)return;
    await media.delete(keys);
  }
  const remain=await media.list({prefix,limit:1});
  if(remain.objects?.length)throw new Error("Scoped private R2 cleanup incomplete");
}
async function expireTemporaryBuilds(env,now){
  const exp=(await env.DB.prepare(
    "SELECT r.id release_id,r.project_id FROM anevum_package_build_retention b "+
    "JOIN anevum_package_releases r ON r.id=b.release_id JOIN anevum_package_projects p ON p.id=r.project_id "+
    "WHERE b.mode='test' AND b.expires_at<=? AND r.status='ready' AND p.draft_release_id=r.id "+
    "ORDER BY b.expires_at LIMIT 10").bind(now).all()).results||[];
  let expired=0,errors=0;
  for(const item of exp){
    try{
      const z=await env.DB.batch([
        env.DB.prepare(
          "UPDATE anevum_package_projects SET draft_release_id=NULL,updated_at=?,"+
          "status=CASE WHEN live_release_id IS NULL THEN 'draft' ELSE status END "+
          "WHERE id=? AND draft_release_id=? "+
          "AND EXISTS(SELECT 1 FROM anevum_package_releases WHERE id=? AND status='ready') "+
          "AND EXISTS(SELECT 1 FROM anevum_package_build_retention WHERE release_id=? AND mode='test' AND expires_at<=?)")
          .bind(now,item.project_id,item.release_id,item.release_id,item.release_id,now),
        env.DB.prepare("UPDATE anevum_package_releases SET status='revoked' WHERE id=? AND status='ready' "+
          "AND EXISTS(SELECT 1 FROM anevum_package_build_retention WHERE release_id=? AND mode='test' AND expires_at<=?)")
          .bind(item.release_id,item.release_id,now),
        jobStatement(env.DB,item.release_id,"expired",now)
      ]);
      if(z[0]?.meta?.changes===1&&z[1]?.meta?.changes===1)expired++;
    }catch{errors++;}
  }
  return {expired,errors};
}
async function reapErasureQueue(env,now){
  const due=(await env.DB.prepare(
    "SELECT j.release_id,j.attempts,r.source_key,r.status,p.live_release_id,p.draft_release_id "+
    "FROM anevum_package_cleanup_jobs j JOIN anevum_package_releases r ON r.id=j.release_id "+
    "JOIN anevum_package_projects p ON p.id=r.project_id WHERE j.not_before<=? "+
    "ORDER BY j.not_before LIMIT ?").bind(now,POLICY.cleanupBatch).all()).results||[];
  let processed=0,errors=0,protectedCount=0;
  for(const j of due){
    if(!["revoked","rejected","failed"].includes(j.status)||j.live_release_id===j.release_id||j.draft_release_id===j.release_id){
      protectedCount++;
      continue;
    }
    try{
      if(j.source_key)await purgePrefix(env.MEDIA,sourcePrefix(j.source_key));
      await env.DB.batch([
        env.DB.prepare("DELETE FROM anevum_package_files WHERE release_id=?").bind(j.release_id),
        env.DB.prepare("DELETE FROM anevum_package_build_retention WHERE release_id=?").bind(j.release_id),
        env.DB.prepare("UPDATE anevum_package_releases SET source_key=NULL WHERE id=? AND status IN ('revoked','rejected','failed')").bind(j.release_id),
        env.DB.prepare("DELETE FROM anevum_package_cleanup_jobs WHERE release_id=?").bind(j.release_id)
      ]);
      processed++;
    }catch(e){
      errors++;
      await run(env.DB,"UPDATE anevum_package_cleanup_jobs SET attempts=attempts+1,last_error=?,updated_at=?,not_before=? WHERE release_id=?",
        String(e?.message||"cleanup failed").slice(0,160),now,
        now+Math.min(86400,60*2**Math.min(10,j.attempts||0)),j.release_id).catch(()=>{});
    }
  }
  return {processed,errors,protectedCount};
}
async function reapInterruptedUploads(env,now){
  const stale=(await env.DB.prepare(
    "SELECT id,object_prefix,release_id FROM anevum_package_upload_reservations "+
    "WHERE expires_at<=? ORDER BY expires_at LIMIT ?").bind(now,POLICY.orphanBatch).all()).results||[];
  let orphans=0,errors=0;
  for(const r of stale){
    try{
      const committed=await one(env.DB,"SELECT id FROM anevum_package_releases WHERE id=?",r.release_id);
      if(!committed){
        // Abort only private release-root objects created by our uploader.
        sourcePrefix(r.object_prefix+"source/placeholder.zip");
        await purgePrefix(env.MEDIA,r.object_prefix);
      }
      await run(env.DB,"DELETE FROM anevum_package_upload_reservations WHERE id=?",r.id);
      orphans++;
    }catch{
      errors++;
      await run(env.DB,
        "UPDATE anevum_package_upload_reservations SET status='cleanup',expires_at=? WHERE id=?",
        now+3600,r.id).catch(()=>{});
    }
  }
  return {orphans,errors};
}
async function pruneHistory(env,now){
  // Preserve all published releases, current drafts, pending reviews, and unresolved R2 jobs.
  const old=(await env.DB.prepare(
    "SELECT r.id FROM anevum_package_releases r JOIN anevum_package_projects p ON p.id=r.project_id "+
    "LEFT JOIN anevum_package_cleanup_jobs j ON j.release_id=r.id "+
    "WHERE r.status IN ('revoked','rejected','failed') AND r.source_key IS NULL "+
    "AND r.created_at<? AND j.release_id IS NULL AND (p.live_release_id IS NULL OR p.live_release_id!=r.id) "+
    "AND (p.draft_release_id IS NULL OR p.draft_release_id!=r.id) ORDER BY r.created_at LIMIT 10")
    .bind(now-POLICY.historySeconds).all()).results||[];
  let pruned=0,errors=0;
  for(const r of old){
    try{
      const z=await env.DB.batch([
        env.DB.prepare("DELETE FROM anevum_package_build_retention WHERE release_id=?").bind(r.id),
        env.DB.prepare("DELETE FROM anevum_package_releases WHERE id=? AND source_key IS NULL AND status IN ('revoked','rejected','failed')").bind(r.id)
      ]);
      if(z[1]?.meta?.changes===1)pruned++;
    }catch{errors++;}
  }
  return {pruned,errors};
}
export async function cleanupPackageResources(env,now=Math.floor(Date.now()/1000)){
  if(!env?.DB||!env?.MEDIA||!(await resourcePolicyReady(env.DB)))
    return {processed:0,expired:0,orphans:0,pruned:0,errors:0,paused:true};
  const a=await expireTemporaryBuilds(env,now);
  const b=await reapErasureQueue(env,now);
  const c=await reapInterruptedUploads(env,now);
  const d=await pruneHistory(env,now);
  return {expired:a.expired,processed:b.processed,orphans:c.orphans,pruned:d.pruned,
    protectedCount:b.protectedCount,errors:a.errors+b.errors+c.errors+d.errors,paused:false};
}
export async function staffMetrics(db,now=Math.floor(Date.now()/1000)){
  const releases=await one(db,"SELECT COUNT(*) n FROM anevum_package_releases WHERE status IN ('ready','pending_review','published','rejected')");
  const tests=await one(db,"SELECT SUM(CASE WHEN expires_at>? THEN 1 ELSE 0 END) temporary, "+
    "SUM(CASE WHEN expires_at<=? THEN 1 ELSE 0 END) expired FROM anevum_package_build_retention WHERE mode='test'",
    now,now);
  const cleanup=await one(db,"SELECT COUNT(*) pending,COALESCE(SUM(physical_bytes),0) bytes FROM anevum_package_cleanup_jobs");
  const reservation=await one(db,"SELECT COUNT(*) pending FROM anevum_package_upload_reservations");
  return {releases:Number(releases?.n||0),temporary:Number(tests?.temporary||0),
    expired:Number(tests?.expired||0),cleanupPending:Number(cleanup?.pending||0),
    cleanupBytes:Number(cleanup?.bytes||0),orphanReservations:Number(reservation?.pending||0),
    checkedAt:now};
}
