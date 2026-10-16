import {boundedText} from './request-body.mjs';
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'};
const json=(data,status=200)=>Response.json(data,{status,headers:HEAD});
const fail=(status,message)=>json({error:message},status);
const TOPICS=new Set(['games','making','arts','community']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const CTRL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const permitted=(v,keys)=>Object.keys(v).sort().join('|')===keys.sort().join('|');
async function payload(req){if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;const s=await boundedText(req,7000);try{const p=JSON.parse(s);return p&&typeof p==='object'&&!Array.isArray(p)?p:null}catch{return null}}
const card=(r)=>({handle:r.handle,displayName:r.display_name,avatar:Boolean(r.avatar),level:r.show_stats===0?null:Number(r.level)||1,featuredAwards:JSON.parse(r.featured_json||'[]').filter(x=>['first_signal','world_shaper'].includes(x)).slice(0,3)});
const authorSql=`JOIN member_creator_profiles p ON p.user_id=t.author_id JOIN "user" u ON u.id=p.user_id
 LEFT JOIN member_space_settings s ON s.user_id=p.user_id
 WHERE p.visibility='public' AND u.emailVerified=1`;
const selectThread=`SELECT t.id,t.topic,t.title,t.body,t.status,t.created_at,t.published_at,t.updated_at,
 p.handle,p.display_name,s.featured_json,s.show_stats,
 EXISTS(SELECT 1 FROM member_space_media m WHERE m.user_id=p.user_id AND m.slot='avatar') AS avatar,
 (SELECT 1+CAST(SQRT(MAX(0,COALESCE((SELECT SUM(amount) FROM member_xp_events x WHERE x.user_id=t.author_id),0)+
 COALESCE((SELECT SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END)
 FROM member_space_milestones z WHERE z.user_id=t.author_id),0))/25)) AS INT)) AS level,
 (SELECT COUNT(*) FROM member_forum_replies r WHERE r.thread_id=t.id AND r.status='published') AS reply_count,
 (SELECT COUNT(*) FROM member_forum_reactions v WHERE v.thread_id=t.id) AS reactions
 FROM member_forum_threads t ${authorSql} AND t.status='published'`;
const threadRow=r=>({id:r.id,topic:r.topic,title:r.title,body:r.body,createdAt:r.created_at,publishedAt:r.published_at,updatedAt:r.updated_at,author:card(r),replyCount:r.reply_count,reactions:r.reactions});
async function dbReady(db){try{const r=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_forum_threads','member_forum_replies','member_forum_reactions','member_forum_reports','member_forum_review_log')").all();return r.results.length===5}catch{return false}}
export async function canonicalForums(req,env,user=null,now=Math.floor(Date.now()/1000)){
 if(env.CANONICAL_FORUM_ENABLED!=='true')return fail(404,'Forums are not enabled');
 const db=env.MEMBER_DB;if(!await dbReady(db))return fail(503,'Forum database is not prepared');
 const url=new URL(req.url),path=url.pathname;
 if([...url.searchParams.keys()].some(x=>!['topic','after'].includes(x))||[...url.searchParams.keys()].some(x=>url.searchParams.getAll(x).length!==1))return fail(400,'Invalid filters');
 const topic=url.searchParams.get('topic');if(topic&&!TOPICS.has(topic))return fail(400,'Invalid topic');
 const after=url.searchParams.get('after');if(after&&!UUID.test(after))return fail(400,'Invalid cursor');
 const item=path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})$/);
 const reply=path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})\/replies$/);
 const react=path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})\/reaction$/);
 const report=path==='/api/v1/community/reports';
 const mine=path==='/api/v1/member/forum-submissions';
 if(!item&&!reply&&!react&&!report&&!mine&&path!=='/api/v1/community/threads')return fail(404,'Not found');
 if((item&&!UUID.test(item[1]))||(reply&&!UUID.test(reply[1]))||(react&&!UUID.test(react[1])))return fail(404,'Not found');
 const publicRead=req.method==='GET'&&!mine&&!react&&!report;
 if(!publicRead&&(!user?.id||user.emailVerified!==true))return fail(401,'Sign in with a verified account');
 try{
  if(publicRead){
   if(!item&&!reply&&path==='/api/v1/community/threads'){
    const a=[...(topic?[topic]:[]),...(after?[after]:[])];
    const sql=selectThread+(topic?' AND t.topic=?':'')+(after?' AND t.id<?':'')+' ORDER BY t.published_at DESC,t.id DESC LIMIT 21';
    const result=await db.prepare(sql).bind(...a).all();
    const rows=result.results.slice(0,20);
    return json({items:rows.map(threadRow),nextCursor:result.results.length>20?rows.at(-1).id:null});
   }
   if(item){
    const row=await db.prepare(selectThread+' AND t.id=?').bind(item[1]).first();
    return row?json({thread:threadRow(row)}):fail(404,'Thread is not public');
   }
   if(reply){
    const parent=await db.prepare(selectThread+' AND t.id=?').bind(reply[1]).first();
    if(!parent)return fail(404,'Thread is not public');
    const r=await db.prepare(`SELECT r.id,r.body,r.published_at,p.handle,p.display_name,s.featured_json,s.show_stats,
      EXISTS(SELECT 1 FROM member_space_media m WHERE m.user_id=p.user_id AND m.slot='avatar') AS avatar,
      1 AS level FROM member_forum_replies r JOIN member_creator_profiles p ON r.author_id=p.user_id JOIN "user" u ON u.id=p.user_id
      LEFT JOIN member_space_settings s ON s.user_id=p.user_id
      WHERE r.thread_id=? AND r.status='published' AND p.visibility='public' AND u.emailVerified=1
      ORDER BY r.published_at ASC,r.id ASC LIMIT 100`).bind(reply[1]).all();
    return json({items:r.results.map(v=>({id:v.id,body:v.body,publishedAt:v.published_at,author:card(v)}))});
   }
  }
  if(mine&&req.method==='GET'){
   const r=await db.prepare("SELECT id,topic,title,body,status,created_at FROM member_forum_threads WHERE author_id=? ORDER BY created_at DESC LIMIT 30").bind(user.id).all();
   return json({items:r.results});
  }
  if(req.method!=='POST'&&req.method!=='DELETE')return fail(405,'Method not allowed');
  if(url.search)return fail(400,'Query unsupported for writes');
  const profile=await db.prepare("SELECT handle,visibility FROM member_creator_profiles WHERE user_id=?").bind(user.id).first();
  if(!profile||profile.visibility!=='public')return fail(403,'Enable your public member profile before participating');
  if(report&&req.method==='POST'){
   const v=await payload(req);
   if(!v||!permitted(v,['targetKind','targetId','reason'])||!['thread','reply'].includes(v.targetKind)||!UUID.test(v.targetId)||!['spam','harassment','unsafe','other'].includes(v.reason))return fail(400,'Invalid report');
   await db.prepare('INSERT OR IGNORE INTO member_forum_reports(id,reporter_id,target_kind,target_id,reason,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),user.id,v.targetKind,v.targetId,v.reason,now).run();
   return json({ok:true},201);
  }
  if(react&&['POST','DELETE'].includes(req.method)){
   if(!await db.prepare(selectThread+' AND t.id=?').bind(react[1]).first())return fail(404,'Thread is not public');
   if(req.method==='POST')await db.prepare('INSERT OR IGNORE INTO member_forum_reactions(thread_id,user_id,created_at) VALUES(?,?,?)').bind(react[1],user.id,now).run();
   else await db.prepare('DELETE FROM member_forum_reactions WHERE thread_id=? AND user_id=?').bind(react[1],user.id).run();
   return json({ok:true});
  }
  if(req.method!=='POST')return fail(405,'Method not allowed');
  const v=await payload(req);
  if(!v||!permitted(v,reply?['body','requestId']:['title','body','topic','requestId'])||!UUID.test(v.requestId)||typeof v.body!=='string'||CTRL.test(v.body))return fail(400,'Invalid submission');
  const body=v.body.trim(),isReply=Boolean(reply);
  if(body.length<(isReply?10:20)||body.length>(isReply?2000:5000))return fail(400,'Invalid message length');
  if(!isReply&&(typeof v.title!=='string'||v.title.trim().length<8||v.title.trim().length>120||CTRL.test(v.title)||!TOPICS.has(v.topic)))return fail(400,'Invalid thread');
  if(isReply&&!await db.prepare(selectThread+' AND t.id=?').bind(reply[1]).first())return fail(404,'Thread is not public');
  const table=isReply?'member_forum_replies':'member_forum_threads';
  const existing=await db.prepare(`SELECT id,status FROM ${table} WHERE author_id=? AND client_request_id=?`).bind(user.id,v.requestId).first();
  if(existing)return json({id:existing.id,status:existing.status,replayed:true});
  const count=await db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE author_id=? AND created_at>?`).bind(user.id,now-3600).first();
  if(count.n>=(isReply?12:4))return fail(429,'Community posting limit reached. Try again later');
  const id=crypto.randomUUID();
  const statement=isReply?
   db.prepare("INSERT INTO member_forum_replies(id,thread_id,author_id,client_request_id,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(id,reply[1],user.id,v.requestId,body,now,now):
   db.prepare("INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)").bind(id,user.id,v.requestId,v.topic,v.title.trim(),body,now,now);
  await statement.run();
  return json({id,status:'pending_review'},201);
 }catch{return fail(503,'Community service unavailable')}
}
