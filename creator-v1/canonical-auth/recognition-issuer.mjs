// Canonical earned-only issuer, V066.
// Badges derive from approved public records; nothing accepts a client-selected
// recognition ID, member ID, review decision, source key or amount.
import {recognitionReady} from './recognition.mjs';

const BADGE_NAMES=Object.freeze({
 first_orbit:'First Orbit',
 first_thread:'First Transmission',
 first_reply:'First Response',
 conversationalist:'Open Channel',
 first_creation:'First Creation',
 maker_five:'Five Worlds',
 maker_twenty:'Architect of Worlds'
});
export function recognitionBadgeName(id){return BADGE_NAMES[id]||null;}

/** Perform after saving a VERIFIED, public profile. Idempotent and gated.
 * Call this only from the profile owner PATCH server route after it has
 * returned a committed public profile row.
 */
export async function awardPublicProfileBadge(db,userId,now,enabled){
 if(!enabled||!await recognitionReady(db))return false;
 const sql="INSERT OR IGNORE INTO member_recognition_grants"+
  "(user_id,kind,recognition_id,earned_at,granted_by,evidence_ref) "+
  "SELECT user_id,'badge','first_orbit',?,'canonical-profile','public-profile:'||handle "+
  "FROM member_creator_profiles WHERE user_id=? AND visibility='public'";
 const out=await db.prepare(sql).bind(now,userId).run();
 await db.prepare(
  "INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,created_at) "+
  "SELECT user_id,'award','first_orbit',earned_at FROM member_recognition_grants "+
  "WHERE user_id=? AND kind='badge' AND recognition_id='first_orbit' AND revoked_at IS NULL"
 ).bind(userId).run();
 return Boolean(out?.meta?.changes);
}

/**
 * Statements are appended AFTER a moderator's publication update + audit row
 * within the SAME D1 batch. An unapproved post cannot issue recognition.
 * The review is independent; the caller must reject approving own content.
 */
export async function forumApprovalBadgeStatements(db,{kind,targetId,reviewId,reviewerId,enabled,now}){
 if(!enabled||!await recognitionReady(db))return [];
 if(kind!=='thread'&&kind!=='reply')return [];
 const table=kind==='thread'?'member_forum_threads':'member_forum_replies';
 const baseId=kind==='thread'?'first_thread':'first_reply';
 const evidence='forum-'+kind+':'+targetId;
 const exists=
  "t.id=? AND t.status='published' AND EXISTS ("+
  "SELECT 1 FROM member_forum_review_log a WHERE a.id=? AND a.target_kind=? "+
  "AND a.target_id=t.id AND a.action='publish' AND a.reviewer_id=?)"+
   " AND t.author_id<>?";
 const first=db.prepare(
  "INSERT OR IGNORE INTO member_recognition_grants "+
  "(user_id,kind,recognition_id,earned_at,granted_by,evidence_ref,reviewed_by) "+
  "SELECT t.author_id,'badge',?,?,'canonical-forum-review',?,? FROM "+table+
  " t WHERE "+exists
 ).bind(baseId,now,evidence,reviewerId,targetId,reviewId,kind,reviewerId,reviewerId);
 const out=[first];
 if(kind==='thread'){
  // An approved substantive discussion on ten separate UTC dates, not
  // ten rapid posts. Duplicate/rejected/hidden content does not qualify.
  const qualification=
   "(SELECT COUNT(DISTINCT CAST(f.published_at/86400 AS INTEGER)) "+
   "FROM member_forum_threads f WHERE f.author_id=t.author_id "+
   "AND f.status='published' AND f.published_at IS NOT NULL "+
   "AND length(trim(f.body))>=100)>=10";
  out.push(db.prepare(
   "INSERT OR IGNORE INTO member_recognition_grants "+
   "(user_id,kind,recognition_id,earned_at,granted_by,evidence_ref,reviewed_by) "+
   "SELECT t.author_id,'badge','conversationalist',?,'canonical-forum-review',?,? "+
   "FROM member_forum_threads t WHERE "+exists+" AND "+qualification
  ).bind(now,evidence,reviewerId,targetId,reviewId,kind,reviewerId,reviewerId));
 }
 // Notifications only for recorded, active grants. UNIQUE makes retries safe.
 // These MUST run after the matching grant insert in the same D1 transaction.
 for(const id of (kind==='thread'?[baseId,'conversationalist']:[baseId])){
  out.push(db.prepare(
   "INSERT OR IGNORE INTO member_reward_notifications (user_id,kind,reference,created_at) "+
   "SELECT t.user_id,'award',t.recognition_id,t.earned_at "+
   "FROM member_recognition_grants t "+
   "WHERE t.kind='badge' AND t.recognition_id=? AND t.revoked_at IS NULL "+
   "AND t.user_id=(SELECT author_id FROM "+table+" WHERE id=?)"
  ).bind(id,targetId));
 }
 return out;
}
