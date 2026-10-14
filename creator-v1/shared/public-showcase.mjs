// V007 public creator identity projection. No client-provided XP, awards or
// ownership claims. Read-only output contains no member IDs, emails or drafts.
import {progressionFromXp,earnedArtifactsThroughLevel} from '../auth/community.mjs';
import {deriveAchievements} from '../auth/social.mjs';

export const MAX_FEATURED_AWARDS=3;
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/i;
const query=(db,sql,params=[])=>{const s=db.prepare(sql);return params.length?s.bind(...params):s;};
async function rows(db,sql,params=[]){
 const result=await query(db,sql,params).all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('Public showcase unavailable');
 return result.results;
}
export async function showcaseSchema(db){
 const found=await rows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_showcase_selections','community_posts')");
 const names=new Set(found.map(x=>x.name));
 return {selections:names.has('member_showcase_selections'),posts:names.has('community_posts')};
}
const publicProject="EXISTS(SELECT 1 FROM projects p WHERE p.owner_member_id=c.member_id AND p.status='published' AND julianday(p.published_at)<=julianday('now'))";
const publicPost="EXISTS(SELECT 1 FROM community_posts cp WHERE cp.author_member_id=c.member_id AND cp.status='published' AND julianday(cp.published_at)<=julianday('now'))";
export function publicSelection(saved,stats){
 const progression=progressionFromXp(stats.xp);
 const achievements=deriveAchievements(stats);
 const earned=achievements.filter(a=>a.earned);
 const artifacts=earnedArtifactsThroughLevel(progression.level);
 let awardKeys=[];
 try{
  const decoded=JSON.parse(saved?.award_keys_json??'[]');
  if(Array.isArray(decoded)&&decoded.length<=MAX_FEATURED_AWARDS&&decoded.every(x=>typeof x==='string'))
   awardKeys=decoded;
 }catch{}
 const unique=new Set();
 const featuredAwards=awardKeys.filter(key=>{
   if(unique.has(key)||!earned.some(a=>a.key===key))return false;
   unique.add(key);return true;
 }).map(key=>{
  const {name,description}=earned.find(a=>a.key===key);
  return {key,name,description};
 });
 const equippedArtifact=typeof saved?.artifact_key==='string'&&artifacts.includes(saved.artifact_key)
  ?{name:saved.artifact_key,series:'SERIES ONE'}:null;
 return {level:progression.level, currentArtifact:progression.artifactEarned?progression.artifact:null,
  equippedArtifact,featuredAwards,earnedAwardCount:earned.length};
}
export async function readPublicShowcase(db,handle,schema){
 if(!HANDLE.test(handle))return null;
 const safeSchema=schema||await showcaseSchema(db);
 const conditions=safeSchema.posts?'('+publicProject+' OR '+publicPost+')':publicProject;
 const found=await rows(db,`SELECT c.member_id AS id,c.handle FROM creator_profiles c
 LEFT JOIN member_accounts a ON a.id=c.member_id
 WHERE c.handle=? COLLATE NOCASE AND c.status='active'
 AND (a.status='active' OR (a.id IS NULL AND c.member_id='anevum-official'))
 AND ${conditions} LIMIT 1`,[handle]);
 const creator=found[0];if(!creator)return null;
 let saved=null;
 if(safeSchema.selections){
  const entries=await rows(db,'SELECT artifact_key,award_keys_json,is_public FROM member_showcase_selections WHERE member_id=?',[creator.id]);
  saved=entries[0]||null;
  if(saved&&Number(saved.is_public)!==1)return null;
 }
 const [ratings,publications,releases,xp]=await Promise.all([
  rows(db,"SELECT COUNT(*) AS n FROM community_project_votes WHERE member_id=? AND status='active'",[creator.id]),
  rows(db,`SELECT COUNT(*) AS n FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id
      WHERE p.owner_member_id=? AND p.status='published' AND c.status='active'
      AND julianday(p.published_at)<=julianday('now')`,[creator.id]),
  rows(db,`SELECT COUNT(*) AS n FROM project_releases r JOIN projects p ON p.id=r.project_id
      JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.owner_member_id=?
      AND p.status='published' AND c.status='active' AND julianday(p.published_at)<=julianday('now')`,[creator.id]),
  rows(db,'SELECT COALESCE(SUM(amount),0) AS n FROM community_xp_events WHERE member_id=?',[creator.id])
 ]);
 const stats={ratings:Number(ratings[0]?.n||0),publishedProjects:Number(publications[0]?.n||0),
  releases:Number(releases[0]?.n||0),xp:Number(xp[0]?.n||0)};
 return {handle:creator.handle,...publicSelection(saved,stats)};
}
export async function readPublicShowcases(db,handles){
 const schema=await showcaseSchema(db),items={};
 for(const handle of [...new Set(handles.map(s=>s.toLowerCase()))]){
  const result=await readPublicShowcase(db,handle,schema);
  if(result)items[result.handle]=result;
 }
 return items;
}
