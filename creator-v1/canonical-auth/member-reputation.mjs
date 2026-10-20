/**
 * ANEVUM V092 / bounded community contribution reputation.
 * This read-only system grants neither privileges nor rewards. A submitted,
 * rejected or hidden post cannot add points. Test XP and paid appearance never
 * count. Unique non-self appreciators and per-category caps limit easy farming.
 * No score or privileged role is accepted from the client. Audited public
 * role display now uses the independent member-verified-roles.mjs read path.
 */
const TIER_THRESHOLDS=[['zenith',900],['nova',420],['orbit',160],['signal',40]];
const number=(input,cap)=>Math.max(0,Math.min(cap,Number.isSafeInteger(Number(input))?Number(input):0));
const tierFor=score=>TIER_THRESHOLDS.find(([,min])=>score>=min)?.[0]||'none';
const nextAt=score=>[40,160,420,900].find(min=>score<min)||null;
const unique=items=>[...new Set(items)];
// Bound every counted stream to the maximum creditable actions: the score
// must never repeatedly scan unbounded user history on public card reads.
const sqlCount=(available,table,sql,cap)=>available.has(table)?
 '(SELECT COUNT(*) FROM ('+sql+' LIMIT '+cap+'))':'0';

/** Returns server-only map keyed by account ID. Never serialize map keys.
 * Call only AFTER verifying member identity and public-profile visibility.
 */
export async function memberReputationMap(db,identities){
 const ids=unique(identities.filter(id=>typeof id==='string'&&id.length>0&&id.length<=128)).slice(0,25);
 if(!ids.length)return new Map();
 try{
  const schema=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_forum_threads','member_forum_replies','member_forum_reactions','member_recognition_grants')").all();
  if(schema.success===false)return new Map();
  const available=new Set((schema.results||[]).map(row=>row.name));
  // An uninstalled activity schema is unknown, not a real zero score.
  if(!available.has('member_forum_threads')||!available.has('member_forum_replies'))return new Map();
  const discussions=sqlCount(available,'member_forum_threads',
   "SELECT t.id FROM member_forum_threads t WHERE t.author_id=p.user_id AND t.status='published'",40);
  const replies=sqlCount(available,'member_forum_replies',
   "SELECT r.id FROM member_forum_replies r JOIN member_forum_threads t ON t.id=r.thread_id WHERE r.author_id=p.user_id AND r.status='published' AND t.status='published'",80);
  // One appreciation per distinct peer, never the author's own reaction.
  // DISTINCT is intentionally retained; the cap limits emitted peers, although
  // SQLite may inspect additional duplicate reactions to find those peers.
  const appreciations=sqlCount(available,'member_forum_reactions',
   "SELECT DISTINCT rx.user_id FROM member_forum_threads t JOIN member_forum_reactions rx ON rx.thread_id=t.id WHERE t.author_id=p.user_id AND t.status='published' AND rx.user_id<>p.user_id",60);
  const badges=sqlCount(available,'member_recognition_grants',
   "SELECT g.recognition_id FROM member_recognition_grants g WHERE g.user_id=p.user_id AND g.kind='badge' AND g.revoked_at IS NULL",20);
  const placeholders=ids.map(()=>'?').join(',');
  const statement=`SELECT p.user_id,(${discussions}) AS discussions,(${replies}) AS replies,(${appreciations}) AS appreciations,(${badges}) AS badges FROM member_creator_profiles p WHERE p.user_id IN (${placeholders})`;
  const stats=await db.prepare(statement).bind(...ids).all();
  if(stats.success===false)return new Map();
  const result=new Map();
  for(const row of stats.results||[]){
   const activity={discussions:number(row.discussions,40),replies:number(row.replies,80),
    appreciations:number(row.appreciations,60),badges:number(row.badges,20)};
   // A bounded, explainable quality-weighted score. No artificial daily login streak.
   const score=16*activity.discussions+4*activity.replies+
    3*activity.appreciations+10*activity.badges;
   const tier=tierFor(score);
   result.set(row.user_id,{
    reputation:{score,tier,nextAt:nextAt(score),stats:activity},earnedAura:tier
   });
  }
  return result;
 }catch{
  // Failed lookups do not invent status, role, or earned aura.
  return new Map();
 }
}

/** Honor explicit public stats privacy. Role seals are read independently. */
export function publicReputationProjection(record,showStats){
 if(!record)return {};
 if(showStats===0)return {};
 return record;
}
