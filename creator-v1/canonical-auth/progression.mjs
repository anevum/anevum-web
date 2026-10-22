import ARTIFACTS from '../shared/level-artifacts.json' with {type:'json'};
import {MILESTONES} from './rewards.mjs';
import {boundedText} from './request-body.mjs';
import {recognitionBadgeName} from './recognition-issuer.mjs';
import {recognitionReady} from './recognition.mjs';
import {progressionReset} from './progression-epoch.mjs';
export {progressionReset} from './progression-epoch.mjs';
const headers={'cache-control':'private, no-store','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'};
const json=(data,status=200)=>Response.json(data,{status,headers});
const error=(status,message)=>json({error:message},status);
const rows=async(db,sql,...args)=>{const r=await db.prepare(sql).bind(...args).all();if(r.success===false)throw Error('Storage unavailable');return r.results};
// Cache only validated schema presence for 30s per D1 binding.
// User data, permissions and mutations are never cached.
const verifiedProgressionSchema=new WeakMap();
export async function progressionReady(db){
 if((verifiedProgressionSchema.get(db)||0)>Date.now())return true;
 try{
  const ready=(await rows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_xp_events','member_reward_notifications','member_notification_receipts')")).length===3;
  if(ready)verifiedProgressionSchema.set(db,Date.now()+30_000);
  return ready;
 }catch{return false}
}
export function levelProgress(raw){
 const xp=Number.isSafeInteger(raw)&&raw>=0?raw:0;
 const level=Math.min(30,1+Math.floor(Math.sqrt(xp/75)));
 return {xp,level,maxLevel:30,levelStart:75*(level-1)**2,nextLevel:level===30?null:75*level**2,artifact:ARTIFACTS[level-1]?.name??null};
}
export async function readProgression(db,id){
 const reset=await progressionReset(db);
 const earned=await rows(db,reset?
  'SELECT milestone,earned_at FROM member_progression_epoch_milestones WHERE epoch=1 AND user_id=?':
  'SELECT milestone,earned_at FROM member_space_milestones WHERE user_id=?',id);
 // Once migration 0011 is installed, XP reads are O(1) per member.
 // The ledger remains the source of truth and triggers maintain its total.
 // Until that migration is deployed, retain the exact legacy behavior.
 let total;
 if(reset){
  // Reset affects current calculations only; complete XP history stays in D1.
  total=await db.prepare('SELECT COALESCE(SUM(amount),0) AS xp FROM member_xp_events WHERE user_id=? AND id>?').bind(id,reset.cutoffEventId).first();
 }else{
  try{total=await db.prepare('SELECT xp FROM member_xp_totals WHERE user_id=?').bind(id).first();}
  catch(err){
   if(!/no such table:\s*member_xp_totals/i.test(String(err?.message||err)))throw err;
   total=await db.prepare('SELECT COALESCE(SUM(amount),0) AS xp FROM member_xp_events WHERE user_id=?').bind(id).first();
  }
 }
 const active=earned;
 const milestoneXp=MILESTONES.reduce((n,a)=>n+(active.some(e=>e.milestone===a.id)?a.xp:0),0),testXp=Number(total?.xp)||0;
 return {...levelProgress(milestoneXp+testXp),testXp,milestoneXp,awards:MILESTONES.map(a=>({...a,earnedAt:active.find(e=>e.milestone===a.id)?.earned_at??null}))};
}
export async function syncRewardNotifications(db,id,now){
 const p=await readProgression(db,id);
 const reset=await progressionReset(db);
 const prefix=reset?'evo60-e1-':'evo60-';
 const last=await db.prepare("SELECT COALESCE(MAX(level),1) AS level FROM member_reward_notifications WHERE user_id=? AND kind='level' AND reference LIKE ? AND level<=? AND created_at>?").bind(id,prefix+'%',p.level,reset?.cutoffAt??0).first();
 const statements=p.awards.filter(a=>a.earnedAt!==null).map(a=>db.prepare("INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,created_at) VALUES(?,'award',?,?)").bind(id,reset?'epoch1:'+a.id:a.id,a.earnedAt));
 for(let level=Number(last?.level||1)+1;level<=p.level;level++)statements.push(db.prepare("INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,level,created_at) VALUES(?,'level',?,?,?)").bind(id,prefix+level,level,now));
 if(statements.length){const results=await db.batch(statements);if(results.some(r=>r.success===false))throw Error('Notification save unavailable')}
 return p;
}
function notification(row){
 if(row.kind==='level')return {id:row.id,kind:'level',level:row.level,title:'Level '+row.level+' reached',detail:ARTIFACTS[row.level-1]?.name??'Your continuance expands.',createdAt:row.created_at};
 const awardId=row.reference.startsWith('epoch1:')?row.reference.slice(7):row.reference;
 const a=MILESTONES.find(a=>a.id===awardId);return {id:row.id,kind:'award',award:awardId,title:a?.name??recognitionBadgeName(awardId)??'Badge earned',detail:a?`Badge earned · +${a.xp} XP`:'Verified achievement recorded · badge earned',createdAt:row.created_at};
}
async function body(req){if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;const raw=await boundedText(req,200);try{const v=JSON.parse(raw);return v&&typeof v==='object'&&!Array.isArray(v)?v:null}catch{return null}}
export async function canonicalProgression(req,env,user,now=Math.floor(Date.now()/1000)){
 const path=new URL(req.url).pathname,db=env.MEMBER_DB,test=env.CANONICAL_XP_TEST_ENABLED==='true';
 if(path.endsWith('/xp-test')&&!test)return error(404,'Not found');
 if(!user?.id||user.emailVerified!==true)return error(403,'Verified member email required');
 if(new URL(req.url).search)return error(400,'Query not supported');
 if(!await progressionReady(db))return error(503,'Progression is being prepared. Try again shortly.');
 try{
  const reset=await progressionReset(db);
  // The discontinued +5 calibration route cannot repopulate a reset XP balance.
  if(path.endsWith('/xp-test')&&reset)return error(404,'Not found');
  if(!await db.prepare('SELECT handle FROM member_creator_profiles WHERE user_id=?').bind(user.id).first())return error(409,'Create your member space first.');
  if(path.endsWith('/progression')&&req.method==='GET')return json({progression:await readProgression(db,user.id),testButtonEnabled:test&&!reset});
  if(path.endsWith('/notifications')&&req.method==='GET'){
   await syncRewardNotifications(db,user.id,now);
   // Repair a notification if a committed badge grant outlived an interrupted
   // delivery write. Grant evidence remains in the immutable recognition ledger.
   if(env.CANONICAL_RECOGNITION_ENABLED==='true'&&await recognitionReady(db))
    await db.prepare("INSERT OR IGNORE INTO member_reward_notifications(user_id,kind,reference,created_at) "+
     "SELECT user_id,'award',recognition_id,earned_at FROM member_recognition_grants "+
     "WHERE user_id=? AND kind='badge' AND revoked_at IS NULL").bind(user.id).run();
   const receipt=await db.prepare('SELECT through_id FROM member_notification_receipts WHERE user_id=?').bind(user.id).first();
   const after=Number(receipt?.through_id)||0;
   // Keep independent recognition messages, but do not resurface old epoch level/milestone notices.
   const visible=reset?
    "(kind='award' AND reference NOT IN ('first_signal','world_shaper') AND reference NOT LIKE 'epoch1:%') OR "+
    "(created_at>? AND ((kind='award' AND reference IN ('epoch1:first_signal','epoch1:world_shaper')) OR "+
    "(kind='level' AND reference LIKE 'evo60-e1-%' AND level<=30)))":
    "(kind!='level' OR (reference LIKE 'evo60-%' AND level<=30))";
   const items=await rows(db,`SELECT id,kind,reference,level,created_at FROM member_reward_notifications WHERE user_id=? AND id>? AND (${visible}) ORDER BY id LIMIT 24`,user.id,after,...(reset?[reset.cutoffAt]:[]));
   const recent=await rows(db,`SELECT id,kind,reference,level,created_at FROM member_reward_notifications WHERE user_id=? AND (${visible}) ORDER BY id DESC LIMIT 12`,user.id,...(reset?[reset.cutoffAt]:[]));
   return json({items:items.map(notification),recent:recent.map(notification)});
  }
  if(path.endsWith('/notifications/ack')&&req.method==='POST'){
   const v=await body(req);if(!v||Object.keys(v).join(',')!=='id'||!Number.isSafeInteger(v.id)||v.id<1)return error(400,'Invalid notification');
   if(!await db.prepare('SELECT id FROM member_reward_notifications WHERE user_id=? AND id=?').bind(user.id,v.id).first())return error(404,'Notification not found');
   await db.prepare('INSERT INTO member_notification_receipts(user_id,through_id) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET through_id=MAX(through_id,excluded.through_id)').bind(user.id,v.id).run();
   return json({ok:true});
  }
  if(path.endsWith('/xp-test')&&req.method==='POST'){
   const v=await body(req);if(!v||Object.keys(v).join(',')!=='requestId'||typeof v.requestId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(v.requestId))return error(400,'Invalid button press');
   // Atomic per-member minute limit, fixed server XP and idempotent retries.
   const old=await db.prepare('SELECT id FROM member_xp_events WHERE user_id=? AND request_id=?').bind(user.id,v.requestId).first();
   let inserted=[];
   if(!old)inserted=await rows(db,"INSERT INTO member_xp_events(user_id,request_id,source,amount,created_at) SELECT ?,?,'test_button',5,? WHERE (SELECT COUNT(*) FROM member_xp_events WHERE user_id=? AND created_at>?)<120 ON CONFLICT(user_id,request_id) DO NOTHING RETURNING id",user.id,v.requestId,now,user.id,now-60);
   const saved=old||inserted[0]||await db.prepare('SELECT id FROM member_xp_events WHERE user_id=? AND request_id=?').bind(user.id,v.requestId).first();
   if(!saved)return error(429,'The button is cooling down. Try again in a minute.');
   return json({awarded:inserted.length?5:0,progression:await syncRewardNotifications(db,user.id,now),replayed:!inserted.length});
  }
  return error(405,'Method not allowed');
 }catch{return error(503,'Progression could not be confirmed. Retry the same press.');}
}
