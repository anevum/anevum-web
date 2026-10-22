// ANEVUM V065 — earned recognition, display preferences and institutional honors.
// This module never grants achievements. No client mutation awards XP, medals or
// ribbons; every public claim must resolve from canonical saved evidence.
import {MILESTONES} from './rewards.mjs';
import {progressionReset} from './progression-epoch.mjs';
import {boundedText} from './request-body.mjs';

const BADGE_IDS=new Set([
 'first_signal','world_shaper','first_orbit','returning_signal',
 'first_thread','first_reply','conversationalist','signal_booster',
 'first_creation','maker_five','maker_twenty','revision_keeper',
 'first_source','sound_weaver','image_maker','story_teller','playwright',
 'first_collection','thoughtful_review','pathfinder','first_collab',
 'cross_discipline','good_neighbor','accessibility_builder',
 'archive_keeper','annual_return'
]);
const RIBBON_IDS=new Set([
 'steadfast_signal','makers_service','open_hand','bridge_of_worlds',
 'stewards_watch','living_archive'
]);
const MEDAL_IDS=new Set([
 'first_light','constellation_laureate','continuance_medal',
 'atlas_medal','worldbuilder_medal','lightkeeper_medal'
]);
const AURAS=new Set(['none','aurora','eclipse','ember','nebula','transcosmic']);
const MODES=new Set(['automatic','curated','hidden']);
const HEADERS={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
const json=(body,status=200)=>Response.json(body,{status,headers:HEADERS});
const bad=(status,message)=>json({error:message},status);
const uniq=xs=>[...new Set(xs)];
const validItems=(xs,set,limit)=>Array.isArray(xs)&&xs.length<=limit&&xs.every(x=>typeof x==='string'&&set.has(x))&&uniq(xs).length===xs.length;
function list(raw){
 try{const v=JSON.parse(raw||'[]');return Array.isArray(v)?v:[]}catch{return []}
}
async function getRows(db,query,...args){
 const result=await db.prepare(query).bind(...args).all();
 if(result.success===false)throw Error('Recognition query unavailable');
 return result.results||[];
}
// Cache only validated schema presence for 30s per D1 binding.
// User data, permissions and mutations are never cached.
const verifiedRecognitionSchema=new WeakMap();
export async function recognitionReady(db){
 if((verifiedRecognitionSchema.get(db)||0)>Date.now())return true;
 try{
  const rows=await getRows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_recognition_grants','member_recognition_preferences')");
  const ready=rows.length===2;
  if(ready)verifiedRecognitionSchema.set(db,Date.now()+30_000);
  return ready;
 }catch{return false}
}
export async function memberRecognitionState(db,userId){
 const reset=await progressionReset(db);
 const [pref,milestones,issued]=await Promise.all([
  db.prepare('SELECT badge_mode,badge_ids_json,medal_id,ribbon_ids_json,aura,revision FROM member_recognition_preferences WHERE user_id=?').bind(userId).first(),
  getRows(db,reset?
   'SELECT milestone,earned_at FROM member_progression_epoch_milestones WHERE epoch=1 AND user_id=?':
   'SELECT milestone,earned_at FROM member_space_milestones WHERE user_id=?',userId),
  getRows(db,'SELECT kind,recognition_id,earned_at FROM member_recognition_grants WHERE user_id=? AND revoked_at IS NULL ORDER BY earned_at DESC',userId)
 ]);
 return buildRecognitionState(pref,milestones,issued);
}
function buildRecognitionState(pref,milestones,issued){
 const badgeMap=new Map();
 for(const row of milestones)if(BADGE_IDS.has(row.milestone)&&Number(row.earned_at)>0)
  badgeMap.set(row.milestone,{id:row.milestone,earnedAt:Number(row.earned_at)});
 const medalMap=new Map(),ribbonMap=new Map();
 for(const row of issued){
  const entry={id:row.recognition_id,earnedAt:Number(row.earned_at)};
  if(!Number.isSafeInteger(entry.earnedAt)||entry.earnedAt<1)continue;
  if(row.kind==='badge'&&BADGE_IDS.has(entry.id)&&!badgeMap.has(entry.id))badgeMap.set(entry.id,entry);
  else if(row.kind==='medal'&&MEDAL_IDS.has(entry.id))medalMap.set(entry.id,entry);
  else if(row.kind==='ribbon'&&RIBBON_IDS.has(entry.id))ribbonMap.set(entry.id,entry);
 }
 const newest=(a,b)=>b.earnedAt-a.earnedAt||a.id.localeCompare(b.id);
 const badges=[...badgeMap.values()].sort(newest);
 const medals=[...medalMap.values()].sort(newest);
 const ribbons=[...ribbonMap.values()].sort(newest);
 const mode=MODES.has(pref?.badge_mode)?pref.badge_mode:'automatic';
 const heldBadge=new Set(badges.map(x=>x.id));
 const savedIds=list(pref?.badge_ids_json).filter(x=>heldBadge.has(x));
 const visibleIds=mode==='hidden'?[]:mode==='curated'?uniq(savedIds).slice(0,3):badges.slice(0,3).map(x=>x.id);
 const featuredBadges=visibleIds.map(id=>badgeMap.get(id)).filter(Boolean);
 // NULL means the newest earned medal; empty string means explicitly hidden.
 const medalId=pref?.medal_id===''?'':
  pref?.medal_id===undefined||pref?.medal_id===null
  ?(medals[0]?.id??null)
  :medalMap.has(pref.medal_id)?pref.medal_id:null;
 const ribbonIds=pref?.ribbon_ids_json===undefined||pref?.ribbon_ids_json===null||
  pref.ribbon_ids_json==='null'
   ?ribbons.slice(0,2).map(x=>x.id)
   :uniq(list(pref.ribbon_ids_json)).filter(id=>ribbonMap.has(id)).slice(0,2);
 return {
  badgeMode:mode,badgeIds:uniq(savedIds).slice(0,3),
  earnedBadges:badges,featuredBadges,
  earnedMedals:medals,earnedRibbons:ribbons,
  medalId,ribbonIds,
  aura:AURAS.has(pref?.aura)?pref.aura:'none',
  revision:Number(pref?.revision)||0
 };
}
/** Privacy projection for a VERIFIED, PUBLIC member only.
 * Callers own public visibility verification and never return userId.
 * Never include unselected grants, issuer/evidence records or raw XP.
 */
export async function publicRecognitionSummary(db,userId){
 if(!await recognitionReady(db))return null;
 return publicRecognitionFields(await memberRecognitionState(db,userId));
}
function publicRecognitionFields(state){
 return {
  featuredAwards:state.featuredBadges.map(x=>x.id),
  earnedBadges:state.featuredBadges,
  badgeDisplay:{mode:state.badgeMode==='hidden'?'hidden':'curated',
   ids:state.featuredBadges.map(x=>x.id)},
  distinctions:{medals:state.medalId?[state.medalId]:[],ribbons:state.ribbonIds},
  aura:state.aura
 };
}
/** Resolve a bounded list of verified owner IDs with FOUR total D1 queries.
 * Map keys remain server-local; no account IDs appear in public responses.
 */
export async function publicRecognitionMap(db,ownerIds){
 const ids=uniq(ownerIds.filter(id=>typeof id==='string'&&id.length>=1)).slice(0,25);
 if(!ids.length||!await recognitionReady(db))return new Map();
 const marks=ids.map(()=>'?').join(',');
 const reset=await progressionReset(db);
 const [prefs,milestones,grants]=await Promise.all([
  getRows(db,'SELECT user_id,badge_mode,badge_ids_json,medal_id,ribbon_ids_json,aura,revision FROM member_recognition_preferences WHERE user_id IN ('+marks+')',...ids),
  getRows(db,(reset?
   'SELECT user_id,milestone,earned_at FROM member_progression_epoch_milestones WHERE epoch=1 AND user_id IN (':
   'SELECT user_id,milestone,earned_at FROM member_space_milestones WHERE user_id IN (')+marks+')',...ids),
  getRows(db,'SELECT user_id,kind,recognition_id,earned_at FROM member_recognition_grants WHERE revoked_at IS NULL AND user_id IN ('+marks+')',...ids)
 ]);
 const group=items=>{
  const byUser=new Map();
  for(const x of items){
   if(!byUser.has(x.user_id))byUser.set(x.user_id,[]);
   byUser.get(x.user_id).push(x);
  }
  return byUser;
 };
 const settings=new Map(prefs.map(p=>[p.user_id,p]));
 const milestonesByUser=group(milestones),grantsByUser=group(grants);
 return new Map(ids.map(id=>[
  id,publicRecognitionFields(buildRecognitionState(
   settings.get(id),milestonesByUser.get(id)||[],grantsByUser.get(id)||[]
  ))
 ]));
}
async function requestBody(req){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const raw=await boundedText(req,1100);if(raw===null)return null;
 try{const b=JSON.parse(raw);return b&&typeof b==='object'&&!Array.isArray(b)?b:null}catch{return null}
}
async function editAllowed(db,userId,now){
 const sql="INSERT INTO member_creator_edit_limits(user_id,window_start,requests) VALUES(?,?,1) ON CONFLICT(user_id) DO UPDATE SET window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END,requests=CASE WHEN window_start<? THEN 1 ELSE requests+1 END WHERE window_start<? OR requests<20 RETURNING requests";
 const result=await getRows(db,sql,userId,now,now-3600,now-3600,now-3600);
 return result.length===1;
}
export async function canonicalRecognition(req,env,user,now=Math.floor(Date.now()/1000)){
 if(env.CANONICAL_RECOGNITION_ENABLED!=='true')return bad(404,'Recognition settings are not enabled');
 if(!user?.id||user.emailVerified!==true)return bad(401,'Verified member sign-in required');
 if(new URL(req.url).search)return bad(400,'Unexpected query');
 const db=env.MEMBER_DB;
 if(!await recognitionReady(db))return bad(503,'Recognition archive is being prepared');
 try{
  const profile=await db.prepare('SELECT handle FROM member_creator_profiles WHERE user_id=?').bind(user.id).first();
  if(!profile)return bad(409,'Create your member space first');
  if(req.method==='GET'){
   const data=await memberRecognitionState(db,user.id);
   return json(data);
  }
  if(req.method!=='PATCH')return bad(405,'Unsupported method');
  const b=await requestBody(req);
  if(!b||Object.keys(b).sort().join('|')!=='aura|badgeIds|badgeMode|medalId|revision|ribbonIds'
   ||!MODES.has(b.badgeMode)||!validItems(b.badgeIds,BADGE_IDS,3)
   ||!AURAS.has(b.aura)||!validItems(b.ribbonIds,RIBBON_IDS,2)
   ||!(b.medalId===null||b.medalId===''||(typeof b.medalId==='string'&&MEDAL_IDS.has(b.medalId)))
   ||!Number.isSafeInteger(b.revision)||b.revision<0)
   return bad(400,'Invalid recognition display preferences');
  const current=await memberRecognitionState(db,user.id);
  if(b.badgeIds.some(id=>!current.earnedBadges.some(x=>x.id===id))||
   b.ribbonIds.some(id=>!current.earnedRibbons.some(x=>x.id===id))||
   (b.medalId&& !current.earnedMedals.some(x=>x.id===b.medalId)))
   return bad(400,'Only earned recognition may be displayed');
  if(current.revision!==b.revision)return bad(409,'Recognition display was changed. Reload');
  if(!await editAllowed(db,user.id,now))return bad(429,'Too many changes. Try again later');
  const sql=b.revision===0
   ?"INSERT INTO member_recognition_preferences(user_id,badge_mode,badge_ids_json,medal_id,ribbon_ids_json,aura) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING RETURNING revision"
   :"UPDATE member_recognition_preferences SET badge_mode=?,badge_ids_json=?,medal_id=?,ribbon_ids_json=?,aura=?,revision=revision+1 WHERE user_id=? AND revision=? RETURNING revision";
  const values=b.revision===0
   ?[user.id,b.badgeMode,JSON.stringify(b.badgeIds),b.medalId,JSON.stringify(b.ribbonIds),b.aura]
   :[b.badgeMode,JSON.stringify(b.badgeIds),b.medalId,JSON.stringify(b.ribbonIds),b.aura,user.id,b.revision];
  const saved=await getRows(db,sql,...values);
  if(!saved.length)return bad(409,'Recognition display was changed. Reload');
  return json(await memberRecognitionState(db,user.id));
 }catch{return bad(503,'Recognition archive is unavailable');}
}
