// Server-authoritative public member identity for forums, wall posts and directory.
// Query only verified members with visibility='public' at every caller.
import {levelProgress} from './progression.mjs';
import {MILESTONES} from './rewards.mjs';
import {publicRecognitionSummary,publicRecognitionMap} from './recognition.mjs';
import {memberReputationMap,publicReputationProjection} from './member-reputation.mjs';
import {memberVerifiedRoleMap} from './member-verified-roles.mjs';
import {publicForumSupporterAppearanceMap} from './supporter-rewards.mjs';
const awardIds=new Set(MILESTONES.map(item=>item.id));
const ownerColumns=new Set(['t.author_id','r.author_id','p.user_id']);

/** Columns are SQL constants, never generated from requests or member input. */
export function publicMemberColumns(owner){
 if(!ownerColumns.has(owner))throw Error('Unsafe identity column');
 return `${owner} AS member_identity_key,s.featured_json,s.show_stats,
 COALESCE((SELECT m.version FROM member_space_media m WHERE m.user_id=${owner} AND m.slot='avatar'),0) AS avatar_version,
 (COALESCE((SELECT SUM(amount) FROM member_xp_events x WHERE x.user_id=${owner} AND x.id>COALESCE((SELECT cutoff_event_id FROM member_progression_reset_epoch WHERE epoch=1),-1)),0)+
  COALESCE((SELECT SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END)
   FROM member_space_milestones z WHERE z.user_id=${owner} AND NOT EXISTS(SELECT 1 FROM member_progression_reset_epoch WHERE epoch=1)),0)+
  COALESCE((SELECT SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END)
   FROM member_progression_epoch_milestones z WHERE z.user_id=${owner} AND z.epoch=1),0)) AS member_xp,
 (SELECT GROUP_CONCAT(milestone) FROM (
   SELECT milestone FROM member_space_milestones e WHERE e.user_id=${owner} AND NOT EXISTS(SELECT 1 FROM member_progression_reset_epoch WHERE epoch=1)
    AND e.milestone IN ('first_signal','world_shaper')
   UNION ALL
   SELECT milestone FROM member_progression_epoch_milestones e WHERE e.user_id=${owner} AND e.epoch=1
    AND e.milestone IN ('first_signal','world_shaper')
 )) AS earned_awards`;
}
/** Never expose XP, user IDs, emails, private profile settings, or unearned medals. */
export function publicMemberCard(row){
 let requested=[];
 try{const array=JSON.parse(row.featured_json||'[]');if(Array.isArray(array))requested=array;}catch{/* invalid settings fail closed */}
 const earned=new Set(typeof row.earned_awards==='string'?row.earned_awards.split(','):[]);
 const featuredAwards=[...new Set(requested.filter(id=>typeof id==='string'&&awardIds.has(id)&&earned.has(id)))].slice(0,3);
 const number=Number(row.member_xp);
 const xp=Number.isSafeInteger(number)&&number>=0?number:0;
 return {
  handle:row.handle,displayName:row.display_name,
  avatar:Boolean(row.avatar_version??row.avatar),
  ...(Number.isSafeInteger(Number(row.avatar_version))&&Number(row.avatar_version)>0?
   {avatarVersion:Number(row.avatar_version)}:{}),
  level:row.show_stats===0?null:levelProgress(xp).level,
  featuredAwards
 };
}

/** Extend only verified opted-in public member cards. The DB identity key is\n * queried server-side and never returned to the browser. When an additive\n * migration is not yet installed, the V061 projection remains unchanged. */
export async function hydratedPublicMemberCard(db,row,enabled=false,reputationEnabled=false,rolesEnabled=false,publicAppearanceEnv=null){
 const legacy=publicMemberCard(row);
 if(!enabled&&!reputationEnabled&&!rolesEnabled&&!publicAppearanceEnv)return legacy;
 const [recognition,activity,roles,appearance]=await Promise.all([
  enabled?publicRecognitionSummary(db,row.member_identity_key):Promise.resolve(null),
  reputationEnabled?memberReputationMap(db,[row.member_identity_key]):Promise.resolve(new Map()),
  rolesEnabled?memberVerifiedRoleMap(db,[row.member_identity_key]):Promise.resolve(new Map()),
  publicAppearanceEnv?publicForumSupporterAppearanceMap(publicAppearanceEnv,[row.member_identity_key]):Promise.resolve(new Map())
 ]);
 const role=roles.get(row.member_identity_key);
 return {...legacy,...(recognition||{}),
  ...publicReputationProjection(activity.get(row.member_identity_key),row.show_stats),
  ...(role?{role}:{}),...(appearance.get(row.member_identity_key)||{})};
}

/** Hydrate one public forum/directory page with a bounded number of D1 reads.
 * Accept only rows from public verified member queries, not raw user input.
 * The server-owned user ID is never serialized in the returned card.
 */
export async function hydratedPublicMemberCards(db,rows,enabled=false,reputationEnabled=false,rolesEnabled=false,publicAppearanceEnv=null){
 const base=rows.map(publicMemberCard);
 if((!enabled&&!reputationEnabled&&!rolesEnabled&&!publicAppearanceEnv)||!rows.length)return base;
 const ids=rows.map(row=>row.member_identity_key);
 const [recognition,activity,roles,appearance]=await Promise.all([
  enabled?publicRecognitionMap(db,ids):Promise.resolve(new Map()),
  reputationEnabled?memberReputationMap(db,ids):Promise.resolve(new Map()),
  rolesEnabled?memberVerifiedRoleMap(db,ids):Promise.resolve(new Map()),
  publicAppearanceEnv?publicForumSupporterAppearanceMap(publicAppearanceEnv,ids):Promise.resolve(new Map())
 ]);
 return base.map((card,i)=>({
  ...card,...(recognition.get(ids[i])||{}),
  ...publicReputationProjection(activity.get(ids[i]),rows[i].show_stats),
  ...(roles.has(ids[i])?{role:roles.get(ids[i])}:{}),
  ...(appearance.get(ids[i])||{})
 }));
}
