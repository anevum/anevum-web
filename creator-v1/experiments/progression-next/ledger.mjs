/** Isolated candidate engine; not imported by any Worker, route or live reader.
 * All evidence/decisions must come from independently authenticated server adapters.
 * No API accepts a member ID, amount, approval, or contribution kind from clients.
 */
export const POLICY='continuance-candidate-1';
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9:_-]{1,160}$/.test(id);
const validTime=now=>Number.isSafeInteger(now)&&now>0&&now<=253402300799;
export function windows(now){
 if(!validTime(now))throw Error('Invalid trusted clock');
 const d=new Date(now*1000);
 return {day:Math.floor(now/86400)*86400,week:Math.floor((now-345600)/604800)*604800+345600,
  month:Math.floor(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)/1000)};
}
/** One INSERT SELECT, including caps, ownership and duplicate checks: no check-then-write race. */
export async function awardContribution(db,evidenceId,now,{enabled=false}={}){
 if(enabled!==true)return {status:'disabled'};
 if(!validId(evidenceId)||!validTime(now))throw Error('Invalid award request');
 const {day,week,month}=windows(now);
 const result=await db.prepare(`
 INSERT INTO next_xp_grants(id,user_id,kind,subject,scope,points,policy,awarded_at)
 SELECT e.id,e.user_id,e.kind,e.subject,e.scope,
 CASE e.kind WHEN 'review' THEN 15 WHEN 'bug' THEN 30 WHEN 'thread' THEN 25 WHEN 'reply' THEN 20
 WHEN 'release' THEN 60 WHEN 'project' THEN CASE WHEN EXISTS(
 SELECT 1 FROM next_xp_grants g WHERE g.user_id=e.user_id AND g.kind='project') THEN 100 ELSE 150 END END,?,?
 FROM next_xp_evidence e WHERE e.id=? AND e.status='approved' AND e.approved_at>0 AND e.approved_at<=?
 AND e.reviewer_id<>e.user_id
 AND ((e.kind IN ('project','release','thread') AND e.owner_id=e.user_id)
 OR (e.kind IN ('review','bug','reply') AND e.owner_id<>e.user_id))
 AND NOT EXISTS(SELECT 1 FROM next_xp_grants g WHERE g.id=e.id OR (g.user_id=e.user_id AND g.kind=e.kind AND g.subject=e.subject))
 AND (e.kind NOT IN ('thread','reply') OR NOT EXISTS(SELECT 1 FROM next_xp_grants g WHERE g.user_id=e.user_id AND g.kind=e.kind))
 AND (e.kind<>'review' OR (SELECT COUNT(*) FROM next_xp_grants g WHERE g.user_id=e.user_id AND g.kind='review' AND g.awarded_at>=?)<2)
 AND (e.kind<>'bug' OR (SELECT COUNT(*) FROM next_xp_grants g WHERE g.user_id=e.user_id AND g.kind='bug' AND g.awarded_at>=?)<3)
 AND (e.kind<>'project' OR NOT EXISTS(SELECT 1 FROM next_xp_grants g WHERE g.user_id=e.user_id AND g.kind='project' AND g.awarded_at>?))
 AND (e.kind<>'release' OR NOT EXISTS(SELECT 1 FROM next_xp_grants g WHERE g.user_id=e.user_id AND g.kind='release' AND g.scope=e.scope AND g.awarded_at>=?))
 AND (SELECT COALESCE(SUM(points),0) FROM next_xp_grants WHERE user_id=e.user_id)<9007199254730000
 ON CONFLICT DO NOTHING`).bind(POLICY,now,evidenceId,now,day,week,now-14*86400,month).run();
 if(result?.success===false)throw Error('Award storage unavailable');
 return {status:Number(result?.meta?.changes)>0?'awarded':'ineligible-or-duplicate'};
}
/** Appeals restore exactly the original points. Revocations do not refund earning caps. */
export async function applyReviewDecision(db,decisionId,now,{enabled=false}={}){
 if(enabled!==true)return {status:'disabled'};
 if(!validId(decisionId)||!validTime(now))throw Error('Invalid decision request');
 const result=await db.prepare(`UPDATE next_xp_grants SET active=1-active,revision=revision+1,last_decision=?
 WHERE id=(SELECT grant_id FROM next_xp_decisions WHERE id=?)
 AND EXISTS(SELECT 1 FROM next_xp_decisions d WHERE d.id=? AND d.grant_id=next_xp_grants.id
 AND d.expected_revision=next_xp_grants.revision
 AND d.reviewer_id<>next_xp_grants.user_id AND d.reviewed_at<=? AND d.reviewed_at>=next_xp_grants.awarded_at
 AND d.reviewed_at>=(SELECT MAX(created_at) FROM next_xp_events WHERE grant_id=next_xp_grants.id)
 AND ((d.action='revoke' AND active=1) OR (d.action='restore' AND active=0)))
 AND NOT EXISTS(SELECT 1 FROM next_xp_events WHERE decision_id=?)`).bind(decisionId,decisionId,decisionId,now,decisionId).run();
 if(result?.success===false)throw Error('Decision storage unavailable');
 return {status:Number(result?.meta?.changes)>0?'applied':'ineligible-or-duplicate'};
}
export async function readCandidateTotal(db,userId){
 if(!validId(userId))throw Error('Invalid member');
 const row=await db.prepare('SELECT COALESCE(SUM(delta),0) AS xp FROM next_xp_events WHERE user_id=?').bind(userId).first();
 if(!Number.isSafeInteger(row?.xp)||row.xp<0)throw Error('Candidate balance failed integrity check');
 return row.xp;
}
