// ANEVUM V115 — creator-attested Project Marks.
// SOURCE-ONLY, default-OFF. Not a public achievement or XP issuer.
// Published projects, immutable definitions and server credentials are provisioned
// by separately approved staff operations, never by private Studio draft creation.
import {boundedText} from './request-body.mjs';
import {UUID_V4} from '../shared/creator-achievements-v114.mjs';

export const MARK_MEMBER_ROUTE=/^\/api\/v1\/member\/marks(?:\/(connect|disconnect|display))?$/;
export const MARK_PUBLISHER_ROUTE=/^\/api\/v1\/marks\/publisher\/(exchange|events)$/;
export const MARK_PROJECT_ROUTE=/^\/api\/v1\/public\/marks\/projects\/([0-9a-f-]{36})$/;
export const MARK_PUBLIC_ROUTE=/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})\/marks$/;
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','cross-origin-resource-policy':'same-origin'};
const json=(value,status=200)=>Response.json(value,{status,headers:HEADERS});
const fail=(status,message)=>json({error:message},status);
const KEY=/^[a-z][a-z0-9_]{2,47}$/;
const STATE=/^[a-f0-9]{32,128}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const AUTH=/^Bearer ([0-9a-f-]{36})\.([a-f0-9]{64})$/;
const TABLES=['member_mark_publishers','member_mark_publisher_keys','member_mark_link_codes',
 'member_mark_links','member_mark_definitions','member_mark_events',
 'member_mark_progress','member_mark_grants','member_mark_preferences'];
const exact=(data,names)=>data&&typeof data==='object'&&!Array.isArray(data)&&
 Object.keys(data).sort().join('|')===names.slice().sort().join('|');
const ownId=id=>typeof id==='string'&&UUID_V4.test(id);
const fresh=bytes=>Array.from(crypto.getRandomValues(new Uint8Array(bytes)),x=>x.toString(16).padStart(2,'0')).join('');
async function digest(value){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
function equalHex(a,b){
 if(!DIGEST.test(a)||!DIGEST.test(b))return false;
 let diff=0;for(let i=0;i<64;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
async function all(db,sql,...bind){
 const result=await db.prepare(sql).bind(...bind).all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('D1 unavailable');
 return result.results;
}
const first=(db,sql,...bind)=>db.prepare(sql).bind(...bind).first();
async function body(req,limit=1536){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 const raw=await boundedText(req,limit);if(raw===null)return null;
 try{const parsed=JSON.parse(raw);return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:null;}catch{return null;}
}
export const markBridgeEnabled=env=>env?.CANONICAL_PROJECT_MARK_BRIDGE_V115==='true'&&
 env?.CANONICAL_CREATOR_ACHIEVEMENTS_V114==='true'&&env?.CANONICAL_CREATOR_STUDIO_ENABLED==='true';
export async function markBridgeReady(db){
 if(!db?.prepare)return false;
 try{
  const found=await all(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ("+TABLES.map(()=>'?').join(',')+")",...TABLES);
  return found.length===TABLES.length;
 }catch{return false;}
}
const isSafeRedirect=uri=>{
 try{const u=new URL(uri);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&
   u.hostname.indexOf('.')>0&&u.port===''&&u.pathname.startsWith('/')&&u.href===uri;}
 catch{return false;}
};
async function approved(db,projectId){
 return first(db,"SELECT project_id,public_title,release_ref,redirect_uri,status FROM member_mark_publishers WHERE project_id=? AND status='approved'",projectId);
}
async function project(db,projectId){
 const p=await approved(db,projectId);
 return p&&isSafeRedirect(p.redirect_uri)?p:null;
}
const projectOut=p=>({projectId:p.project_id,title:p.public_title,connection:'optional',trust:'creator_attested'});
const markOut=r=>({id:r.definition_id,projectId:r.project_id,projectTitle:r.public_title,
 stableKey:r.stable_key,title:r.title,description:r.description,motif:r.motif,
 rewardLabel:r.reward_label,earnedAt:r.earned_at,trust:'creator_attested'});
const grantQuery="SELECT g.definition_id,g.earned_at,d.project_id,d.stable_key,d.title,d.description,d.motif,d.reward_label,p.public_title "+
 "FROM member_mark_grants g JOIN member_mark_definitions d ON d.id=g.definition_id "+
 "JOIN member_mark_publishers p ON p.project_id=d.project_id "+
 "WHERE g.member_id=? AND g.revoked_at IS NULL AND d.revoked_at IS NULL AND p.status='approved' "+
 "ORDER BY g.earned_at DESC,d.id LIMIT 100";
export async function projectMarkDiscovery(req,env,projectId){
 if(!markBridgeEnabled(env))return fail(404,'Not found');
 if(req.method!=='GET'||new URL(req.url).search||!ownId(projectId))return fail(404,'Not found');
 if(!await markBridgeReady(env.MEMBER_DB))return fail(503,'Project marks unavailable');
 try{const p=await project(env.MEMBER_DB,projectId);
  return p?json(projectOut(p)):fail(404,'Project not available');
 }catch{return fail(503,'Project marks unavailable');}
}
export async function projectMarkMember(req,env,user,now=Math.floor(Date.now()/1000)){
 if(!markBridgeEnabled(env))return fail(404,'Not found');
 if(!user?.id||user.emailVerified!==true)return fail(401,'Verified sign-in required');
 const u=new URL(req.url);if(u.search)return fail(400,'Unexpected query');
 const action=u.pathname.match(MARK_MEMBER_ROUTE)?.[1]||'';
 if(!action&&!['GET'].includes(req.method))return fail(405,'Method not allowed');
 if(action==='connect'&&req.method!=='POST'||action==='disconnect'&&req.method!=='POST'||
  action==='display'&&req.method!=='PATCH')return fail(405,'Method not allowed');
 const db=env.MEMBER_DB;
 if(!await markBridgeReady(db))return fail(503,'Project marks unavailable');
 try{
  if(!action){
   const [prefs,marks,links]=await Promise.all([
    first(db,'SELECT mode,pinned_json,revision FROM member_mark_preferences WHERE member_id=?',user.id),
    all(db,grantQuery,user.id),
    all(db,"SELECT l.id AS link_id,l.project_id,p.public_title FROM member_mark_links l "+
      "JOIN member_mark_publishers p ON p.project_id=l.project_id "+
      "WHERE l.member_id=? AND l.revoked_at IS NULL AND p.status='approved' ORDER BY l.created_at DESC LIMIT 50",user.id)
   ]);
   let pinned=[];try{pinned=JSON.parse(prefs?.pinned_json||'[]');}catch{}
   return json({marks:marks.map(markOut),links:links.map(l=>({linkId:l.link_id,projectId:l.project_id,title:l.public_title})),
     display:{mode:prefs?.mode==='curated'?'curated':'hidden',pinnedIds:Array.isArray(pinned)?pinned.filter(ownId).slice(0,6):[],revision:prefs?.revision||0},
     platformXp:0,source:'creator_attested'});
  }
  if(action==='connect'){
   const b=await body(req,512);
   if(!exact(b,['projectId','state'])||!ownId(b.projectId)||typeof b.state!=='string'||!STATE.test(b.state))
    return fail(400,'Invalid connection request');
   const p=await project(db,b.projectId);
   if(!p)return fail(404,'Project unavailable');
   const recent=await first(db,'SELECT COUNT(*) AS n FROM member_mark_link_codes WHERE member_id=? AND created_at>?',user.id,now-3600);
   if(Number(recent?.n)>=10)return fail(429,'Connection limit reached');
   const code=fresh(32),codeHash=await digest(code);
   const inserted=await all(db,'INSERT INTO member_mark_link_codes(code_hash,project_id,member_id,redirect_uri,created_at,expires_at) '+
    "SELECT ?,p.project_id,?,?,?,? FROM member_mark_publishers p WHERE p.project_id=? AND p.status='approved' AND p.redirect_uri=? RETURNING code_hash",
    codeHash,user.id,p.redirect_uri,now,now+120,b.projectId,p.redirect_uri);
   if(!inserted.length)return fail(409,'Project connection unavailable');
   const redirect=new URL(p.redirect_uri);redirect.searchParams.set('code',code);redirect.searchParams.set('state',b.state);
   return json({redirectUrl:redirect.href,expiresIn:120,project:projectOut(p)});
  }
  if(action==='disconnect'){
   const b=await body(req,300);
   if(!exact(b,['linkId'])||!ownId(b.linkId))return fail(400,'Invalid connection');
   const changed=await all(db,'UPDATE member_mark_links SET revoked_at=? WHERE id=? AND member_id=? AND revoked_at IS NULL RETURNING id',
    now,b.linkId,user.id);
   return changed.length?json({disconnected:true}):fail(404,'Connection not found');
  }
  if(action==='display'){
   const b=await body(req,800);
   if(!exact(b,['mode','pinnedIds','revision'])||!['hidden','curated'].includes(b.mode)||
     !Array.isArray(b.pinnedIds)||b.pinnedIds.length>6||!b.pinnedIds.every(ownId)||
     new Set(b.pinnedIds).size!==b.pinnedIds.length||
     !Number.isSafeInteger(b.revision)||b.revision<0)return fail(400,'Invalid display preferences');
   if(b.mode==='hidden'&&b.pinnedIds.length)return fail(400,'Hidden mode cannot feature marks');
   const eligible=await all(db,grantQuery,user.id),allowed=new Set(eligible.map(x=>x.definition_id));
   if(b.pinnedIds.some(x=>!allowed.has(x)))return fail(400,'Only earned active marks can be featured');
   const changed=b.revision===0
    ?await all(db,'INSERT INTO member_mark_preferences(member_id,mode,pinned_json) VALUES(?,?,?) ON CONFLICT(member_id) DO NOTHING RETURNING revision',user.id,b.mode,JSON.stringify(b.pinnedIds))
    :await all(db,'UPDATE member_mark_preferences SET mode=?,pinned_json=?,revision=revision+1 WHERE member_id=? AND revision=? RETURNING revision',b.mode,JSON.stringify(b.pinnedIds),user.id,b.revision);
   return changed.length?json({display:{mode:b.mode,pinnedIds:b.pinnedIds,revision:changed[0].revision}}):fail(409,'Display preferences changed; reload');
  }
  return fail(404,'Not found');
 }catch{return fail(503,'Project marks temporarily unavailable');}
}
export async function projectMarkPublic(req,env,handle){
 if(!markBridgeEnabled(env)||req.method!=='GET'||new URL(req.url).search)return fail(404,'Not found');
 if(!await markBridgeReady(env.MEMBER_DB))return fail(503,'Project marks unavailable');
 try{
  const db=env.MEMBER_DB;
  const profile=await first(db,"SELECT p.user_id FROM member_creator_profiles p JOIN \"user\" u ON u.id=p.user_id "+
    "WHERE p.handle=? AND p.visibility='public' AND u.emailVerified=1 LIMIT 1",handle);
  if(!profile)return fail(404,'Profile unavailable');
  const pref=await first(db,'SELECT mode,pinned_json FROM member_mark_preferences WHERE member_id=?',profile.user_id);
  if(pref?.mode!=='curated')return json({marks:[]});
  let selected;try{selected=JSON.parse(pref.pinned_json);}catch{return json({marks:[]});}
  if(!Array.isArray(selected)||selected.length>6||selected.some(x=>!ownId(x)))return json({marks:[]});
  const earned=await all(db,grantQuery,profile.user_id),map=new Map(earned.map(x=>[x.definition_id,x]));
  return json({marks:selected.map(x=>map.get(x)).filter(Boolean).map(markOut)});
 }catch{return fail(503,'Public marks unavailable');}
}
async function publisherKey(req,db,projectId,now){
 // Browser-authenticated or cookie-bearing requests MUST NOT become publisher
 // operations; this API accepts confidential backend calls only.
 if(req.headers.has('origin')||req.headers.has('cookie')||req.headers.has('sec-fetch-site'))return null;
 const auth=(req.headers.get('authorization')||'').match(AUTH);
 if(!auth||!ownId(auth[1]))return null;
 const row=await first(db,"SELECT k.secret_sha256 FROM member_mark_publisher_keys k "+
  "JOIN member_mark_publishers p ON p.project_id=k.project_id "+
  "WHERE k.key_id=? AND k.project_id=? AND k.revoked_at IS NULL AND k.expires_at>? "+
  "AND p.status='approved' LIMIT 1",auth[1],projectId,now);
 if(!row)return null;
 return equalHex(await digest(auth[2]),row.secret_sha256)?{keyId:auth[1]}:null;
}
export async function projectMarkPublisher(req,env,now=Math.floor(Date.now()/1000)){
 if(!markBridgeEnabled(env))return fail(404,'Not found');
 const url=new URL(req.url),action=url.pathname.match(MARK_PUBLISHER_ROUTE)?.[1];
 if(!action||req.method!=='POST'||url.search)return fail(404,'Not found');
 const db=env.MEMBER_DB;if(!await markBridgeReady(db)||typeof db.batch!=='function')return fail(503,'Publisher service unavailable');
 try{
  const b=await body(req,1152);
  if(!b||!ownId(b.projectId))return fail(400,'Invalid request');
  if(!await publisherKey(req,db,b.projectId,now))return fail(401,'Publisher authorization unavailable');
  if(action==='exchange'){
   if(!exact(b,['projectId','code'])||typeof b.code!=='string'||!DIGEST.test(b.code))return fail(400,'Invalid exchange request');
   const nonce=crypto.randomUUID(),hash=await digest(b.code);
   const result=await db.batch([
    db.prepare("UPDATE member_mark_link_codes SET consumed_at=?,consumed_nonce=? "+
      "WHERE code_hash=? AND project_id=? AND consumed_at IS NULL AND expires_at>? "+
      "AND EXISTS(SELECT 1 FROM member_mark_publishers WHERE project_id=? AND status='approved') RETURNING member_id").bind(now,nonce,hash,b.projectId,now,b.projectId),
    db.prepare("INSERT INTO member_mark_links(id,project_id,member_id,created_at) "+
      "SELECT ?,c.project_id,c.member_id,? FROM member_mark_link_codes c WHERE c.consumed_nonce=? "+
      "ON CONFLICT(project_id,member_id) DO UPDATE SET revoked_at=NULL RETURNING id").bind(crypto.randomUUID(),now,nonce)
   ]);
   const issued=result?.[0]?.results||[],links=result?.[1]?.results||[];
   return issued.length===1&&links.length===1?json({linkId:links[0].id,projectId:b.projectId,trust:'creator_attested'},201)
     :fail(409,'Connection code expired or used');
  }
  if(!exact(b,['projectId','linkId','eventId','stableKey','evidenceDigest'])||
   !ownId(b.linkId)||!ownId(b.eventId)||!KEY.test(b.stableKey)||
   typeof b.evidenceDigest!=='string'||!DIGEST.test(b.evidenceDigest))return fail(400,'Invalid milestone event');
  const definition=await first(db,"SELECT d.id,d.target_count,l.member_id FROM member_mark_definitions d "+
   "JOIN member_mark_publishers p ON p.project_id=d.project_id "+
   "JOIN member_mark_links l ON l.project_id=d.project_id "+
   "WHERE d.project_id=? AND d.stable_key=? AND d.release_ref=p.release_ref AND d.revoked_at IS NULL "+
   "AND p.status='approved' AND l.id=? AND l.revoked_at IS NULL LIMIT 1",b.projectId,b.stableKey,b.linkId);
  if(!definition)return fail(404,'Active link or published achievement not found');
  const existing=await first(db,"SELECT id,link_id,definition_id,evidence_digest FROM member_mark_events WHERE project_id=? AND client_event_id=?",b.projectId,b.eventId);
  if(existing)return existing.link_id===b.linkId&&existing.definition_id===definition.id&&equalHex(existing.evidence_digest,b.evidenceDigest)?
    json({status:'duplicate',platformXp:0,trust:'creator_attested'}):fail(409,'Event identifier already used');
  const eventDbId=crypto.randomUUID();
  const result=await db.batch([
   db.prepare("INSERT INTO member_mark_events(id,project_id,link_id,member_id,definition_id,client_event_id,evidence_digest,created_at) "+
    "SELECT ?,p.project_id,l.id,l.member_id,d.id,?,?,? FROM member_mark_publishers p "+
    "JOIN member_mark_links l ON l.project_id=p.project_id "+
    "JOIN member_mark_definitions d ON d.project_id=p.project_id "+
    "WHERE p.project_id=? AND p.status='approved' AND l.id=? AND l.revoked_at IS NULL "+
    "AND d.id=? AND d.stable_key=? AND d.release_ref=p.release_ref AND d.revoked_at IS NULL "+
    "AND (SELECT COUNT(*) FROM member_mark_events e WHERE e.project_id=? AND e.link_id=? AND e.created_at>?)<120 "+
    "AND NOT EXISTS(SELECT 1 FROM member_mark_grants g WHERE g.member_id=l.member_id AND g.project_id=p.project_id AND g.stable_key=d.stable_key) "+
    "ON CONFLICT(project_id,client_event_id) DO NOTHING RETURNING id").bind(
      eventDbId,b.eventId,b.evidenceDigest,now,b.projectId,b.linkId,definition.id,b.stableKey,b.projectId,b.linkId,now-3600),
   db.prepare("INSERT INTO member_mark_progress(member_id,definition_id,count,updated_at) "+
    "SELECT e.member_id,e.definition_id,1,? FROM member_mark_events e WHERE e.id=? "+
    "ON CONFLICT(member_id,definition_id) DO UPDATE SET count=MIN(count+1,?),updated_at=? RETURNING count").bind(
      now,eventDbId,definition.target_count,now),
   db.prepare("INSERT INTO member_mark_grants(member_id,project_id,stable_key,definition_id,source_event_id,earned_at) "+
    "SELECT e.member_id,e.project_id,?,e.definition_id,e.id,? FROM member_mark_events e "+
    "JOIN member_mark_progress pr ON pr.member_id=e.member_id AND pr.definition_id=e.definition_id "+
    "JOIN member_mark_definitions d ON d.id=e.definition_id "+
    "WHERE e.id=? AND pr.count>=d.target_count "+
    "ON CONFLICT DO NOTHING RETURNING definition_id").bind(b.stableKey,now,eventDbId)
  ]);
  const accepted=result?.[0]?.results||[];
  if(accepted.length!==1){
   const retry=await first(db,"SELECT id,link_id,definition_id,evidence_digest FROM member_mark_events WHERE project_id=? AND client_event_id=?",b.projectId,b.eventId);
   return retry&&retry.link_id===b.linkId&&retry.definition_id===definition.id&&equalHex(retry.evidence_digest,b.evidenceDigest)?
    json({status:'duplicate',platformXp:0,trust:'creator_attested'}):fail(409,'Milestone rejected or rate limit exceeded');
  }
  const count=result?.[1]?.results?.[0]?.count;
  const earned=(result?.[2]?.results||[]).length===1;
  return json({status:earned?'earned':'recorded',progress:Number(count)||0,target:definition.target_count,
    achievementId:earned?definition.id:null,trust:'creator_attested',platformXp:0},earned?201:200);
 }catch{return fail(503,'Publisher event unavailable');}
}
