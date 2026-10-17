// Server-authoritative public member identity for forums, wall posts and directory.
// Query only verified members with visibility='public' at every caller.
import {levelProgress} from './progression.mjs';
import {MILESTONES} from './rewards.mjs';
import {publicRecognitionSummary,publicRecognitionMap} from './recognition.mjs';
const awardIds=new Set(MILESTONES.map(item=>item.id));
const ownerColumns=new Set(['t.author_id','r.author_id','p.user_id']);

/** Columns are SQL constants, never generated from requests or member input. */
export function publicMemberColumns(owner){
 if(!ownerColumns.has(owner))throw Error('Unsafe identity column');
 return `${owner} AS member_identity_key,s.featured_json,s.show_stats,
 (COALESCE((SELECT SUM(amount) FROM member_xp_events x WHERE x.user_id=${owner}),0)+
  COALESCE((SELECT SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END)
   FROM member_space_milestones z WHERE z.user_id=${owner}),0)) AS member_xp,
 (SELECT GROUP_CONCAT(milestone) FROM member_space_milestones e
  WHERE e.user_id=${owner} AND e.milestone IN ('first_signal','world_shaper')) AS earned_awards`;
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
  handle:row.handle,displayName:row.display_name,avatar:Boolean(row.avatar),
  level:row.show_stats===0?null:levelProgress(xp).level,
  featuredAwards
 };
}

/** Extend only verified opted-in public member cards. The DB identity key is\n * queried server-side and never returned to the browser. When an additive\n * migration is not yet installed, the V061 projection remains unchanged. */
export async function hydratedPublicMemberCard(db,row,enabled=false){
 const legacy=publicMemberCard(row);
 if(!enabled)return legacy;
 const extra=await publicRecognitionSummary(db,row.member_identity_key);
 return extra?{...legacy,...extra}:legacy;
}

/** Hydrate one public forum/directory page with a bounded number of D1 reads.
 * Accept only rows from public verified member queries, not raw user input.
 * The server-owned user ID is never serialized in the returned card.
 */
export async function hydratedPublicMemberCards(db,rows,enabled=false){
 const base=rows.map(publicMemberCard);
 if(!enabled||!rows.length)return base;
 const records=await publicRecognitionMap(db,rows.map(row=>row.member_identity_key));
 return base.map((card,i)=>({
  ...card,...(records.get(rows[i].member_identity_key)||{})
 }));
}
