// ANEVUM.IREN.BUILD.2026-10-17.001.MODERATOR-COMMAND-PORTAL
// Protected, additive staff collaboration. Invitations are manual records,
// never credentials, registration approvals or reviewer-role grants.
import {boundedText} from './request-body.mjs';

export const STAFF_OPS_PATH='/api/v1/member/staff-ops';
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'};
const json=(data,status=200)=>Response.json(data,{status,headers:HEAD});
const fail=(status,error)=>json({error},status);
const ROOMS=new Set(['operations','review','projects']);
const STAGES=new Set(['invited','responded','joined','staff-candidate','closed']);
const TASK_STAGES=new Set(['open','in-progress','blocked','done']);
const PRIORITIES=new Set(['routine','important','urgent']);
const CHANNELS=new Set(['direct','email','social','other']);
const COLORS=new Set(['#f67c73','#a99aff','#f5d2a0','#a6dece','#e4e7f5']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const splitIds=(value)=>typeof value==='string'?value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,40):[];
const unique=(array)=>[...new Set(array)];

// Server-authoritative roles: only verified canonical D1 grants confer access.
export async function staffOpsPermission(env,user){
 if(!user?.id||user.emailVerified!==true||!env?.MEMBER_DB)return null;
 try{
  const row=await env.MEMBER_DB.prepare("SELECT role FROM staff_access_grants WHERE member_id=? AND revoked_at IS NULL").bind(user.id).first();
  return row&&['owner','reviewer'].includes(row.role)?{memberId:user.id,role:row.role}:null;
 }catch{return null}
}
export async function staffRosterIds(db){
 try{
  const rows=await db.prepare("SELECT g.member_id AS id FROM staff_access_grants g JOIN \"user\" u ON u.id=g.member_id WHERE g.revoked_at IS NULL AND u.emailVerified=1 ORDER BY CASE g.role WHEN 'owner' THEN 0 ELSE 1 END,g.created_at LIMIT 40").all();
  return (rows.results||[]).map(x=>x.id);
 }catch{return []}
}
export function validCanvasStroke(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 if(!exact(value,['points','color','width'])||!COLORS.has(value.color)||
    !Number.isInteger(value.width)||value.width<1||value.width>5||
    !Array.isArray(value.points)||value.points.length<2||value.points.length>64)return false;
 return value.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1));
}
const exact=(obj,keys)=>Object.keys(obj).sort().join('|')===keys.slice().sort().join('|');
const clean=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.trim().length<=max&&!CONTROL.test(s)?s.trim():null;
const roomOf=(s)=>ROOMS.has(s)?s:null;

async function ready(db){
 if(!db||typeof db.prepare!=='function')return false;
 try{
  const rows=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'staff_%'").all();
  const tables=new Set((rows.results||[]).map(x=>x.name));
  return ['staff_invitation_log','staff_task_log','staff_chat_log','staff_canvas_log',
   'staff_presence','staff_webrtc_signals','staff_ops_audit','staff_ops_limits','staff_access_grants','staff_access_audit'].every(x=>tables.has(x));
 }catch{return false;}
}
async function limited(db,memberId,operation,now,max){
 const bucket=Math.floor(now/60);
 const query=db.prepare("INSERT INTO staff_ops_limits(member_id,operation,minute_bucket,attempts) VALUES(?,?,?,1) ON CONFLICT(member_id,operation,minute_bucket) DO UPDATE SET attempts=attempts+1");
 await query.bind(memberId,operation,bucket).run();
 const row=await db.prepare("SELECT attempts FROM staff_ops_limits WHERE member_id=? AND operation=? AND minute_bucket=?")
  .bind(memberId,operation,bucket).first();
 return row?.attempts<=max;
}
const audit=(db,type,id,memberId,now)=>db.prepare(
 "INSERT INTO staff_ops_audit(event_type,entity_id,actor_id,created_at) VALUES(?,?,?,?)"
).bind(type,id,memberId,now);
async function readSnapshot(db,env,permit,room,now){
 const rosterResult=await db.prepare(
  "SELECT g.member_id AS id,g.role,COALESCE(p.display_name,u.name,'STAFF') AS name,COALESCE(p.handle,'') AS handle "+
  "FROM staff_access_grants g JOIN \"user\" u ON u.id=g.member_id "+
  "LEFT JOIN member_creator_profiles p ON p.user_id=g.member_id "+
  "WHERE g.revoked_at IS NULL AND u.emailVerified=1 "+
  "ORDER BY CASE g.role WHEN 'owner' THEN 0 ELSE 1 END,g.created_at LIMIT 40"
 ).all();
 const roster=rosterResult.results||[];
 const rosterIds=roster.map(r=>r.id);
 const [invites,tasks,messages,canvas,history,peers,memberMetrics,eligibleMembers]=await Promise.all([
  db.prepare("SELECT id,alias,channel,stage,note,created_at AS createdAt,updated_at AS updatedAt FROM staff_invitation_log ORDER BY updated_at DESC LIMIT 80").all(),
  db.prepare("SELECT id,title,stage,priority,updated_at AS updatedAt FROM staff_task_log ORDER BY updated_at DESC LIMIT 80").all(),
  db.prepare("SELECT m.seq,m.id,m.room,m.author_id AS authorId,m.body,m.created_at AS createdAt,COALESCE(p.display_name,u.name,'STAFF') AS author FROM staff_chat_log m JOIN \"user\" u ON u.id=m.author_id LEFT JOIN member_creator_profiles p ON p.user_id=m.author_id WHERE m.room=? ORDER BY m.seq DESC LIMIT 70").bind(room).all(),
  db.prepare("SELECT seq,id,actor_id AS authorId,event_type AS eventType,event_data AS eventData,created_at AS createdAt FROM staff_canvas_log WHERE room=? ORDER BY seq DESC LIMIT 240").bind(room).all(),
  db.prepare("SELECT a.seq,a.event_type AS eventType,a.entity_id AS entityId,a.created_at AS createdAt,COALESCE(p.handle,'STAFF') AS actor FROM staff_ops_audit a LEFT JOIN member_creator_profiles p ON p.user_id=a.actor_id ORDER BY a.seq DESC LIMIT 40").all(),
  db.prepare("SELECT member_id AS id,last_seen_at AS lastSeen FROM staff_presence WHERE room='bridge' AND last_seen_at>? ORDER BY last_seen_at DESC").bind(now-50).all(),
  permit.role==='owner'?db.prepare(
   "SELECT COUNT(*) AS total,"+
   "COALESCE(SUM(CASE WHEN emailVerified=1 THEN 1 ELSE 0 END),0) AS verified,"+
   "COALESCE(SUM(CASE WHEN julianday(createdAt)>=julianday('now')-1 THEN 1 ELSE 0 END),0) AS new24h,"+
   "COALESCE(SUM(CASE WHEN julianday(createdAt)>=julianday('now')-7 THEN 1 ELSE 0 END),0) AS new7d,"+
   "COALESCE(SUM(CASE WHEN julianday(createdAt)>=julianday('now')-30 THEN 1 ELSE 0 END),0) AS new30d,"+
   "(SELECT COUNT(*) FROM member_creator_profiles) AS profiles FROM \"user\""
  ).first():Promise.resolve(null),
  permit.role==='owner'?db.prepare(
   "SELECT u.id,COALESCE(p.display_name,u.name,'MEMBER') AS name,COALESCE(p.handle,'') AS handle "+
   "FROM \"user\" u LEFT JOIN member_creator_profiles p ON p.user_id=u.id "+
   "LEFT JOIN staff_access_grants g ON g.member_id=u.id AND g.revoked_at IS NULL "+
   "WHERE u.emailVerified=1 AND g.member_id IS NULL ORDER BY u.createdAt DESC LIMIT 40"
  ).all():Promise.resolve({results:[]})
 ]);
 return {
  role:permit.role,memberId:permit.memberId,room,checkedAt:now,
  memberMetrics:memberMetrics?{total:memberMetrics.total,verified:memberMetrics.verified,profiles:memberMetrics.profiles,new24h:memberMetrics.new24h,new7d:memberMetrics.new7d,new30d:memberMetrics.new30d}:null,
  eligibleMembers:permit.role==='owner'?(eligibleMembers.results||[]):[],
  invitationMode:'manual-only',liveMode:'short-poll',callMode:'peer-preview',
  invitations:invites.results||[],tasks:tasks.results||[],
  messages:(messages.results||[]).reverse(),
  canvas:(canvas.results||[]).reverse().map(x=>({
   seq:x.seq,id:x.id,authorId:x.authorId,eventType:x.eventType,
   data:parseSafe(x.eventData),createdAt:x.createdAt
  })),
  history:history.results||[],roster,peers:(peers.results||[]).filter(p=>rosterIds.includes(p.id)),
  limits:{messages:70,canvas:240,roster:40}
 };
}
const parseSafe=(value)=>{try{return JSON.parse(value)}catch{return null}};
async function postCommand(req,db,env,permit,now){
 if(new URL(req.url).search)return fail(400,'Unexpected query');
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return fail(415,'JSON required');
 const raw=await boundedText(req,18000);
 if(raw===null)return fail(413,'Request too large');
 let v;
 try{v=JSON.parse(raw)}catch{return fail(400,'Invalid JSON')}
 if(!v||typeof v!=='object'||Array.isArray(v)||typeof v.kind!=='string')return fail(400,'Invalid command');
 const memberId=permit.memberId;
 const isOwner=permit.role==='owner';
 if(v.kind==='staff-grant'||v.kind==='staff-revoke'){
  if(!isOwner)return fail(403,'Owner authorization required');
  if(!exact(v,['kind','memberId'])||typeof v.memberId!=='string'||v.memberId===memberId||
    v.memberId.length<1||v.memberId.length>128)return fail(400,'Invalid staff member');
  if(!await limited(db,memberId,'staff-role',now,12))return fail(429,'Role change limit reached');
  if(v.kind==='staff-grant'){
   // Role is intentionally fixed to REVIEWER. Only existing verified accounts
   // are selectable, and no account can elevate itself to FOUNDER.
   const results=await db.batch([
    db.prepare(
     "INSERT INTO staff_access_grants(member_id,role,granted_by,created_at,updated_at,revoked_at) "+
     "SELECT ?,'reviewer',?,?,?,NULL WHERE EXISTS(SELECT 1 FROM \"user\" WHERE id=? AND emailVerified=1) "+
     "ON CONFLICT(member_id) DO UPDATE SET role='reviewer',granted_by=excluded.granted_by,"+
     "updated_at=excluded.updated_at,revoked_at=NULL "+
     "WHERE staff_access_grants.role='reviewer' AND staff_access_grants.revoked_at IS NOT NULL"
    ).bind(v.memberId,memberId,now,now,v.memberId),
    db.prepare("INSERT INTO staff_access_audit(id,actor_id,member_id,action,created_at) SELECT ?,?,?,'grant-reviewer',? WHERE changes()=1")
     .bind(crypto.randomUUID(),memberId,v.memberId,now)
   ]);
   return results[0].meta?.changes===1?json({ok:true,role:'reviewer'}):fail(409,'Member already authorized, unverified or unavailable');
  }
  const results=await db.batch([
   db.prepare(
    "UPDATE staff_access_grants SET revoked_at=?,updated_at=?,granted_by=? "+
    "WHERE member_id=? AND role='reviewer' AND revoked_at IS NULL"
   ).bind(now,now,memberId,v.memberId),
   db.prepare("INSERT INTO staff_access_audit(id,actor_id,member_id,action,created_at) SELECT ?,?,?,'revoke-reviewer',? WHERE changes()=1")
    .bind(crypto.randomUUID(),memberId,v.memberId,now)
  ]);
  return results[0].meta?.changes===1?json({ok:true,revoked:true}):fail(409,'Reviewer not active or protected role');
 }
 if(v.kind==='invite-create'){
  if(!isOwner)return fail(403,'Owner authorization required');
  if(!exact(v,['kind','alias','channel','note'])||
    !clean(v.alias,1,64)||!CHANNELS.has(v.channel)||!clean(v.note,0,240) && v.note!=='')return fail(400,'Invalid invitation');
  if(!await limited(db,memberId,'invite',now,12))return fail(429,'Invitation limit reached');
  const id=crypto.randomUUID();
  await db.batch([
   db.prepare("INSERT INTO staff_invitation_log(id,alias,channel,stage,note,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,'invited',?,?,?,?,?)")
    .bind(id,v.alias.trim(),v.channel,(v.note||'').trim(),memberId,memberId,now,now),
   audit(db,'invite-created',id,memberId,now)
  ]);
  return json({ok:true,id,stage:'invited'},201);
 }
 if(v.kind==='invite-update'){
  if(!isOwner)return fail(403,'Owner authorization required');
  if(!exact(v,['kind','id','stage'])||!UUID.test(v.id)||!STAGES.has(v.stage))return fail(400,'Invalid stage');
  if(!await limited(db,memberId,'invite',now,20))return fail(429,'Invitation limit reached');
  const result=await db.prepare("UPDATE staff_invitation_log SET stage=?,updated_at=?,updated_by=? WHERE id=? AND stage<>?")
   .bind(v.stage,now,memberId,v.id,v.stage).run();
  if(result.meta?.changes!==1)return fail(409,'Invitation already updated or missing');
  await audit(db,'invite-updated',v.id,memberId,now).run();
  return json({ok:true});
 }
 if(v.kind==='task-create'){
  if(!exact(v,['kind','title','priority'])||!clean(v.title,4,140)||!PRIORITIES.has(v.priority))return fail(400,'Invalid task');
  if(!await limited(db,memberId,'task',now,20))return fail(429,'Task limit reached');
  const id=crypto.randomUUID();
  await db.batch([
   db.prepare("INSERT INTO staff_task_log(id,title,stage,priority,created_by,updated_by,created_at,updated_at) VALUES(?,?,'open',?,?,?,?,?)")
    .bind(id,v.title.trim(),v.priority,memberId,memberId,now,now),
   audit(db,'task-created',id,memberId,now)
  ]);
  return json({ok:true,id},201);
 }
 if(v.kind==='task-update'){
  if(!exact(v,['kind','id','stage'])||!UUID.test(v.id)||!TASK_STAGES.has(v.stage))return fail(400,'Invalid task stage');
  if(!await limited(db,memberId,'task',now,25))return fail(429,'Task limit reached');
  const result=await db.prepare("UPDATE staff_task_log SET stage=?,updated_at=?,updated_by=? WHERE id=? AND stage<>?")
   .bind(v.stage,now,memberId,v.id,v.stage).run();
  if(result.meta?.changes!==1)return fail(409,'Task already updated or missing');
  await audit(db,'task-updated',v.id,memberId,now).run();
  return json({ok:true});
 }
 if(v.kind==='message'){
  const room=roomOf(v.room),body=clean(v.body,1,1200);
  if(!exact(v,['kind','room','body'])||!room||!body)return fail(400,'Invalid message');
  if(!await limited(db,memberId,'message',now,24))return fail(429,'Message rate limit reached');
  const id=crypto.randomUUID();
  await db.prepare("INSERT INTO staff_chat_log(id,room,author_id,body,created_at) VALUES(?,?,?,?,?)")
   .bind(id,room,memberId,body,now).run();
  return json({ok:true,id},201);
 }
 if(v.kind==='stroke'){
  const room=roomOf(v.room);
  if(!exact(v,['kind','room','stroke'])||!room||!validCanvasStroke(v.stroke))return fail(400,'Invalid stroke');
  if(!await limited(db,memberId,'stroke',now,90))return fail(429,'Drawing rate limit reached');
  const id=crypto.randomUUID();
  await db.prepare("INSERT INTO staff_canvas_log(id,room,actor_id,event_type,event_data,created_at) VALUES(?,?,?,'stroke',?,?)")
   .bind(id,room,memberId,JSON.stringify(v.stroke),now).run();
  return json({ok:true,id},201);
 }
 if(v.kind==='clear-canvas'){
  const room=roomOf(v.room);
  if(!exact(v,['kind','room'])||!room)return fail(400,'Invalid room');
  if(!await limited(db,memberId,'clear',now,3))return fail(429,'Canvas clear limit reached');
  const id=crypto.randomUUID();
  await db.batch([
   db.prepare("INSERT INTO staff_canvas_log(id,room,actor_id,event_type,event_data,created_at) VALUES(?,?,?,'clear','{}',?)")
    .bind(id,room,memberId,now),
   audit(db,'board-cleared',id,memberId,now)
  ]);
  return json({ok:true,id},201);
 }
 if(v.kind==='presence'){
  if(!exact(v,['kind','room'])||!['bridge','off'].includes(v.room))return fail(400,'Invalid presence');
  if(!await limited(db,memberId,'presence',now,12))return fail(429,'Presence rate limit reached');
  await db.prepare("INSERT INTO staff_presence(member_id,room,last_seen_at) VALUES(?,?,?) ON CONFLICT(member_id) DO UPDATE SET room=excluded.room,last_seen_at=excluded.last_seen_at")
   .bind(memberId,v.room,now).run();
  return json({ok:true});
 }
 if(v.kind==='signal'){
  const roster=await staffRosterIds(db);
  if(!exact(v,['kind','recipientId','signalType','data'])||
   typeof v.recipientId!=='string'||v.recipientId===memberId||!roster.includes(v.recipientId)||
   !['offer','answer','candidate','leave'].includes(v.signalType)||
   !v.data||typeof v.data!=='object'||Array.isArray(v.data))return fail(400,'Invalid call signal');
  const serialized=JSON.stringify(v.data);
  if(serialized.length>16000)return fail(413,'Signal too large');
  if(!await limited(db,memberId,'signal',now,120))return fail(429,'Signaling rate limit reached');
  if(v.signalType==='offer')await db.prepare("DELETE FROM staff_webrtc_signals WHERE created_at<?").bind(now-600).run();
  await db.prepare("INSERT INTO staff_webrtc_signals(room,sender_id,recipient_id,signal_type,signal_data,created_at) VALUES('bridge',?,?,?,?,?)")
   .bind(memberId,v.recipientId,v.signalType,serialized,now).run();
  return json({ok:true},201);
 }
 return fail(400,'Unsupported staff command');
}
// Routine retention: call descriptions and network ICE candidates are temporary.
// Staff chat, review decisions and shared assignments intentionally remain durable.
export async function cleanupStaffOps(env,now=Math.floor(Date.now()/1000)){
 if(env?.CANONICAL_STAFF_OPS_ENABLED!=='true'||!await ready(env.MEMBER_DB))return {skipped:true};
 const db=env.MEMBER_DB;
 try{
  await db.batch([
   db.prepare("DELETE FROM staff_webrtc_signals WHERE created_at<?").bind(now-600),
   db.prepare("DELETE FROM staff_presence WHERE last_seen_at<?").bind(now-3600),
   db.prepare("DELETE FROM staff_ops_limits WHERE minute_bucket<?").bind(Math.floor(now/60)-1440)
  ]);
  return {ok:true};
 }catch{return {ok:false}}
}

export async function canonicalStaffOps(req,env,user,now=Math.floor(Date.now()/1000)){
 if(env?.CANONICAL_STAFF_OPS_ENABLED!=='true')return fail(404,'Not found');
 if(!user?.id||user.emailVerified!==true)return fail(401,'Verified sign-in required');
 const permit=await staffOpsPermission(env,user);
 if(!permit)return fail(403,'Staff authorization required');
 const db=env.MEMBER_DB;
 if(!await ready(db))return fail(503,'Staff database not prepared');
 try{
  if(req.method==='POST')return postCommand(req,db,env,permit,now);
  if(req.method!=='GET')return fail(405,'Method not allowed');
  const url=new URL(req.url);
  if([...url.searchParams.keys()].some(k=>!['room','lane','after','member','q','page'].includes(k)||url.searchParams.getAll(k).length!==1))return fail(400,'Invalid query');
  const lane=url.searchParams.get('lane')||'snapshot';
  if(lane==='member-rewards'){
   if(permit.role!=='owner')return fail(403,'Owner authorization required');
   if(url.searchParams.has('room')||url.searchParams.has('after')||url.searchParams.has('q')||url.searchParams.has('page'))return fail(400,'Invalid query');
   const target=url.searchParams.get('member');
   if(!target||target.length>128||CONTROL.test(target))return fail(400,'Invalid member');
   const verified=await db.prepare('SELECT id FROM "user" WHERE id=? AND emailVerified=1').bind(target).first();
   if(!verified)return fail(404,'Verified member not found');
   const schema=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_recognition_grants','member_space_milestones','member_recognition_preferences')").all();
   const exists=new Set((schema.results||[]).map(x=>x.name));
   if(!exists.has('member_recognition_grants')||!exists.has('member_space_milestones'))return fail(503,'Reward ledger unavailable');
   const [grants,milestones,preference,rolesSchema]=await Promise.all([
    db.prepare("SELECT kind,recognition_id AS id,earned_at AS earnedAt FROM member_recognition_grants WHERE user_id=? AND revoked_at IS NULL ORDER BY earned_at DESC LIMIT 70").bind(target).all(),
    db.prepare("SELECT milestone AS id,earned_at AS earnedAt FROM member_space_milestones WHERE user_id=? ORDER BY earned_at DESC LIMIT 20").bind(target).all(),
    exists.has('member_recognition_preferences')?
     db.prepare("SELECT aura,badge_mode AS badgeMode FROM member_recognition_preferences WHERE user_id=?").bind(target).first():Promise.resolve(null),
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_role_grants'").all()
   ]);
   if(grants.success===false||milestones.success===false||rolesSchema.success===false)return fail(503,'Reward ledger unavailable');
   const roleRegistryReady=(rolesSchema.results||[]).length===1;
   const roleDistinctions=roleRegistryReady?
    await db.prepare("SELECT role,granted_at AS grantedAt FROM member_role_grants WHERE user_id=? AND revoked_at IS NULL ORDER BY granted_at DESC LIMIT 4").bind(target).all():null;
   if(roleDistinctions?.success===false)return fail(503,'Role ledger unavailable');
   return json({grants:grants.results||[],milestones:milestones.results||[],memberVerified:true,
    cosmeticAura:preference?.aura||'none',badgeDisplayMode:preference?.badgeMode||'automatic',
    roleRegistryReady,roleDistinctions:roleDistinctions?.results||[],
    source:'earned-records',canIssue:false,canChangeXp:false,
    note:'Verified earned records; changing a member\'s cosmetic aura or honor requires an independently reviewed grant workflow.'});
  }
  if(lane==='members'){
   if(permit.role!=='owner')return fail(403,'Owner authorization required');
   if(url.searchParams.has('room')||url.searchParams.has('after')||url.searchParams.has('member'))return fail(400,'Invalid query');
   const q=(url.searchParams.get('q')||'').trim(),pageRaw=url.searchParams.get('page')||'0';
   if(q.length>64||(q.length>0&&q.length<2)||CONTROL.test(q)||!/^\d{1,3}$/.test(pageRaw))return fail(400,'Invalid directory search');
   const page=Number(pageRaw);
   if(!Number.isSafeInteger(page)||page>100)return fail(400,'Invalid directory page');
   const pattern='%'+q.replace(/[\\%_]/g,m=>'\\'+m)+'%';
   const filter=q?" WHERE (u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR p.handle LIKE ? ESCAPE '\\' OR p.display_name LIKE ? ESCAPE '\\') ":' ';
   const sql="SELECT u.id,COALESCE(p.display_name,u.name,'MEMBER') AS name,"+
    "COALESCE(p.handle,'') AS handle,u.email AS email,u.emailVerified AS verified,"+
    "u.createdAt AS joinedAt,COALESCE(p.visibility,'private') AS visibility,g.role AS staffRole,"+
    "COALESCE(r.aura,'none') AS cosmeticAura FROM \"user\" u "+
    "LEFT JOIN member_creator_profiles p ON p.user_id=u.id "+
    "LEFT JOIN staff_access_grants g ON g.member_id=u.id AND g.revoked_at IS NULL "+
    "LEFT JOIN member_recognition_preferences r ON r.user_id=u.id"+filter+
    "ORDER BY u.createdAt DESC,u.id DESC LIMIT ? OFFSET ?";
   const values=q?[pattern,pattern,pattern,pattern,26,page*25]:[26,page*25];
   const out=await db.prepare(sql).bind(...values).all();
   if(out.success===false)return fail(503,'Directory unavailable');
   const records=out.results||[];
   return json({members:records.slice(0,25).map(x=>({
    id:x.id,name:x.name,handle:x.handle,email:x.email,verified:Boolean(x.verified),
    joinedAt:x.joinedAt,visibility:x.visibility,staffRole:x.staffRole||null,cosmeticAura:x.cosmeticAura||'none'
   })),page,pageSize:25,hasMore:records.length>25,query:q,source:'canonical-verified-directory'});
  }
  if(lane==='release-evidence'){
   if(permit.role!=='owner')return fail(403,'Owner authorization required');
   if(url.searchParams.has('room')||url.searchParams.has('after')||url.searchParams.has('member')||url.searchParams.has('q')||url.searchParams.has('page'))return fail(400,'Invalid query');
   return json({stagingReady:false,
    stagingReason:'a.anevum.com is retired; production-accurate isolated staging requires a separate database and Worker.',
    releases:[
     {id:'v084',name:'V084 Continuance release',status:'live',environment:'production',
      summary:'Real production release, earned vector emblems, IREN onboarding, Continuance entry.',
      source:'https://github.com/anevum/anevum-web/actions/runs/39271162169',
      evidence:'https://github.com/anevum/anevum-web/actions/runs/39271162169/artifacts/12195298181'},
     {id:'v084-qa',name:'V084 compiled React review',status:'verified',environment:'browser-capture',
      summary:'Genuine compiled IREN/player cards on mobile and desktop; not a live development server.',
      source:'https://github.com/anevum/anevum-web/actions/runs/39266440691',
      evidence:'https://github.com/anevum/anevum-web/actions/runs/39266440691/artifacts/12192583247'},
     {id:'v081-cards',name:'V081 player-card artwork',status:'verified',environment:'browser-capture',
      summary:'High-resolution earned 2D emblem and card snapshots; historical 3D not active.',
      source:'https://github.com/anevum/anevum-web/actions/runs/39266440685',
      evidence:'https://github.com/anevum/anevum-web/actions/runs/39266440685/artifacts/12193611782'},
     {id:'lab-v001',name:'Lab concept simulator',status:'synthetic',environment:'owner-only Lab',
      summary:'A visual interaction mockup, NOT functional membership staging.',
      source:'https://github.com/anevum/anevum-web/pull/540',
      evidence:'https://lab.anevum.com/previews/'}
    ]});
  }
  if(lane==='signals'){
   if(url.searchParams.has('room'))return fail(400,'Unsupported signal room');
   const after=Number(url.searchParams.get('after')||0);
   if(!Number.isSafeInteger(after)||after<0)return fail(400,'Invalid signal cursor');
   const result=await db.prepare("SELECT seq,sender_id AS senderId,signal_type AS signalType,signal_data AS signalData FROM staff_webrtc_signals WHERE recipient_id=? AND seq>? AND created_at>? ORDER BY seq ASC LIMIT 80")
    .bind(permit.memberId,after,now-120).all();
   return json({signals:(result.results||[]).map(x=>({
    seq:x.seq,senderId:x.senderId,signalType:x.signalType,data:parseSafe(x.signalData)
   })),checkedAt:now});
  }
  if(lane!=='snapshot'||url.searchParams.has('after'))return fail(400,'Invalid snapshot query');
  const room=roomOf(url.searchParams.get('room')||'operations');
  if(!room)return fail(400,'Invalid room');
  return json(await readSnapshot(db,env,permit,room,now));
 }catch{
  // No database messages, account records, session identifiers or SQL internals escape.
  return fail(503,'Staff service unavailable');
 }
}
