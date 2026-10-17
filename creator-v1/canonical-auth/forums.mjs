import {boundedText} from './request-body.mjs';
import {forumReviewSnapshot,forumReviewPage,parseReviewPage} from './forum-review-console.mjs';
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'};
const json=(data,status=200)=>Response.json(data,{status,headers:HEAD});
const fail=(status,message)=>json({error:message},status);
const TOPICS=new Set(['games','making','arts','community']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const CTRL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const permitted=(v,keys)=>Object.keys(v).sort().join('|')===keys.sort().join('|');
function decodeCursor(value){
 if(value===null)return null;
 if(value.length>180)return false;
 try{
  const data=JSON.parse(atob(value));
  return Array.isArray(data)&&data.length===2&&Number.isSafeInteger(data[0])&&data[0]>0&&UUID.test(data[1])?data:false;
 }catch{return false}
}
const encodeCursor=(at,id)=>btoa(JSON.stringify([Number(at),id]));
async function payload(req){if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;const s=await boundedText(req,7000);try{const p=JSON.parse(s);return p&&typeof p==='object'&&!Array.isArray(p)?p:null}catch{return null}}
const card=(r)=>({handle:r.handle,displayName:r.display_name,avatar:Boolean(r.avatar),level:r.show_stats===0?null:Number(r.level)||1,featuredAwards:JSON.parse(r.featured_json||'[]').filter(x=>['first_signal','world_shaper'].includes(x)).slice(0,3)});
const authorSql=`JOIN member_creator_profiles p ON p.user_id=t.author_id JOIN "user" u ON u.id=p.user_id
 LEFT JOIN member_space_settings s ON s.user_id=p.user_id
 WHERE p.visibility='public' AND u.emailVerified=1`;
const selectThread=`SELECT t.id,t.topic,t.title,t.body,t.status,t.created_at,t.published_at,t.updated_at,
 p.handle,p.display_name,s.featured_json,s.show_stats,
 EXISTS(SELECT 1 FROM member_space_media m WHERE m.user_id=p.user_id AND m.slot='avatar') AS avatar,
 (1+CAST(SQRT(MAX(0,
   (COALESCE((SELECT SUM(amount) FROM member_xp_events x WHERE x.user_id=t.author_id),0)+
   COALESCE((SELECT SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END)
   FROM member_space_milestones z WHERE z.user_id=t.author_id),0))/25.0
 )) AS INTEGER)) AS level,
 (SELECT COUNT(*) FROM member_forum_replies r JOIN member_creator_profiles rp ON rp.user_id=r.author_id
 JOIN "user" ru ON ru.id=rp.user_id WHERE r.thread_id=t.id AND r.status='published'
 AND rp.visibility='public' AND ru.emailVerified=1) AS reply_count,
 (SELECT COUNT(*) FROM member_forum_reactions v WHERE v.thread_id=t.id) AS reactions
 FROM member_forum_threads t ${authorSql} AND t.status='published'`;
const threadRow=r=>({id:r.id,topic:r.topic,title:r.title,body:r.body,createdAt:r.created_at,publishedAt:r.published_at,updatedAt:r.updated_at,author:card(r),replyCount:r.reply_count,reactions:r.reactions});
async function dbReady(db){try{const r=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_forum_threads','member_forum_replies','member_forum_reactions','member_forum_reports','member_forum_review_log')").all();return r.results.length===5}catch{return false}}
export async function canonicalForums(req,env,user=null,now=Math.floor(Date.now()/1000)){
 if(env.CANONICAL_FORUM_ENABLED!=='true')return fail(404,'Forums are not enabled');
 const db=env.MEMBER_DB;if(!await dbReady(db))return fail(503,'Forum database is not prepared');
 const url=new URL(req.url),path=url.pathname;
 // Staff-only cursors and public forum filters have independent validation.
 // Staff auth and reviewer grants run before page cursors are parsed.
 const review=path==='/api/v1/member/forum-review';
 if(!review&&([...url.searchParams.keys()].some(x=>!['topic','after'].includes(x))||[...url.searchParams.keys()].some(x=>url.searchParams.getAll(x).length!==1)))return fail(400,'Invalid filters');
 const topic=review?null:url.searchParams.get('topic');if(topic&&!TOPICS.has(topic))return fail(400,'Invalid topic');
 const after=review?null:decodeCursor(url.searchParams.get('after'));if(after===false)return fail(400,'Invalid cursor');
 const item=path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})$/);
 const reply=path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})\/replies$/);
 const react=path.match(/^\/api\/v1\/community\/threads\/([a-f0-9-]{36})\/reaction$/);
 const report=path==='/api/v1/community/reports';
 const mine=path==='/api/v1/member/forum-submissions';
 const mineId=path.match(/^\/api\/v1\/member\/forum-submissions\/([a-f0-9-]{36})$/);
 if(!item&&!reply&&!react&&!report&&!mine&&!mineId&&!review&&path!=='/api/v1/community/threads')return fail(404,'Not found');
 if((item&&!UUID.test(item[1]))||(reply&&!UUID.test(reply[1]))||(react&&!UUID.test(react[1]))||(mineId&&!UUID.test(mineId[1])))return fail(404,'Not found');
 const publicRead=req.method==='GET'&&!mine&&!mineId&&!react&&!report&&!review;
 if(!publicRead&&(!user?.id||user.emailVerified!==true))return fail(401,'Sign in with a verified account');
 try{
  if(publicRead){
   if((topic&&path!=='/api/v1/community/threads')||(after&&path!=='/api/v1/community/threads'&&!reply))
    return fail(400,'Unexpected filters');
   if(!item&&!reply&&path==='/api/v1/community/threads'){
    const a=[...(topic?[topic]:[]),...(after?[after[0],after[0],after[1]]:[])];
    const sql=selectThread+(topic?' AND t.topic=?':'')+
      (after?' AND (t.published_at<? OR (t.published_at=? AND t.id<?))':'')+
      ' ORDER BY t.published_at DESC,t.id DESC LIMIT 21';
    const result=await db.prepare(sql).bind(...a).all();
    const rows=result.results.slice(0,20),last=rows.at(-1);
    return json({items:rows.map(threadRow),nextCursor:result.results.length>20&&last?encodeCursor(last.published_at,last.id):null});
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
      (1+CAST(SQRT(MAX(0,(COALESCE((SELECT SUM(amount) FROM member_xp_events x WHERE x.user_id=r.author_id),0)+COALESCE((SELECT SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END) FROM member_space_milestones z WHERE z.user_id=r.author_id),0))/25.0)) AS INTEGER)) AS level FROM member_forum_replies r JOIN member_creator_profiles p ON r.author_id=p.user_id JOIN "user" u ON u.id=p.user_id
      LEFT JOIN member_space_settings s ON s.user_id=p.user_id
      WHERE r.thread_id=? AND r.status='published' AND p.visibility='public' AND u.emailVerified=1
      ${after?'AND (r.published_at>? OR (r.published_at=? AND r.id>?))':''}
      ORDER BY r.published_at ASC,r.id ASC LIMIT 26`).bind(reply[1],...(after?[after[0],after[0],after[1]]:[])).all();
    const visible=r.results.slice(0,25),last=visible.at(-1);
    return json({items:visible.map(v=>({id:v.id,body:v.body,publishedAt:v.published_at,author:card(v)})),
      nextCursor:r.results.length>25&&last?encodeCursor(last.published_at,last.id):null});
   }
  }
  if(review){
   // Only a server-configured verified Better Auth user ID may review content.
   // Preserve all existing owner-configured reviewers when adding a separately
   // provisioned, verified second reviewer. Never replace the primary secret.
   const reviewers=new Set([env.CANONICAL_FORUM_REVIEWER_IDS||'',
    env.CANONICAL_FORUM_ADDITIONAL_REVIEWER_IDS||''].flatMap(value=>value.split(',').map(x=>x.trim()).filter(Boolean)));
   if(!reviewers.has(user.id))return fail(403,'Reviewer access required');
   if(req.method==='GET'){
    if(!url.search)return json(await forumReviewSnapshot(db,user.id,now));
    const page=parseReviewPage(url.searchParams);
    return page?json(await forumReviewPage(db,user.id,now,page)):fail(400,'Invalid review cursor');
   }
   if(req.method!=='POST'||url.search)return fail(405,'Method not allowed');
   const v=await payload(req);
   if(!v||!permitted(v,['targetKind','targetId','action'])||!UUID.test(v.targetId)||
      !['thread','reply','report'].includes(v.targetKind)||
      !['publish','reject','hide','dismiss_report'].includes(v.action)||
      (v.targetKind==='report')!==(v.action==='dismiss_report'))
    return fail(400,'Invalid review');
   const auditId=crypto.randomUUID();
   if(v.targetKind==='report'){
    const results=await db.batch([
     db.prepare("UPDATE member_forum_reports SET resolved_at=?,resolution='dismissed',resolved_by=? WHERE id=? AND resolved_at IS NULL").bind(now,user.id,v.targetId),
     db.prepare("INSERT INTO member_forum_review_log(id,reviewer_id,target_kind,target_id,action,created_at) SELECT ?,?,'report',?,'dismiss_report',? WHERE changes()=1").bind(auditId,user.id,v.targetId,now)
    ]);
    return results[0].meta?.changes===1?json({ok:true,status:'dismissed'}):fail(409,'Report already reviewed');
   }
   const table=v.targetKind==='thread'?'member_forum_threads':'member_forum_replies';
   const target=await db.prepare(`SELECT status,author_id FROM ${table} WHERE id=?`).bind(v.targetId).first();
   if(!target)return fail(404,'Not found');
   if(v.action==='hide'?target.status!=='published':target.status!=='pending_review')
    return fail(409,'Review state changed');
   if(v.action==='publish'){
    if(target.author_id===user.id)return fail(403,'Independent review is required');
    const author=await db.prepare("SELECT p.visibility,u.emailVerified AS verified FROM member_creator_profiles p JOIN \"user\" u ON u.id=p.user_id WHERE p.user_id=?").bind(target.author_id).first();
    if(author?.visibility!=='public'||!author.verified)return fail(409,'Author is not public and verified');
    if(v.targetKind==='reply'){
     const parent=await db.prepare("SELECT t.status,p.visibility,u.emailVerified AS verified FROM member_forum_replies r JOIN member_forum_threads t ON t.id=r.thread_id JOIN member_creator_profiles p ON p.user_id=t.author_id JOIN \"user\" u ON u.id=t.author_id WHERE r.id=?").bind(v.targetId).first();
     if(parent?.status!=='published'||parent?.visibility!=='public'||!parent.verified)return fail(409,'Parent thread is not public');
    }
   }
   const next=v.action==='publish'?'published':v.action==='reject'?'rejected':'hidden';
   const statements=[
    db.prepare(`UPDATE ${table} SET status=?,published_at=CASE WHEN ?='published' THEN ? ELSE published_at END,updated_at=?,revision=revision+1 WHERE id=? AND status=?`).bind(next,next,now,now,v.targetId,target.status),
    db.prepare("INSERT INTO member_forum_review_log(id,reviewer_id,target_kind,target_id,action,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1").bind(auditId,user.id,v.targetKind,v.targetId,v.action,now)
   ];
   if(v.action==='hide')statements.push(
    db.prepare("UPDATE member_forum_reports SET resolved_at=?,resolution='hidden',resolved_by=? WHERE target_kind=? AND target_id=? AND resolved_at IS NULL AND EXISTS(SELECT 1 FROM member_forum_review_log WHERE id=?)").bind(now,user.id,v.targetKind,v.targetId,auditId)
   );
   const results=await db.batch(statements);
   return results[0].meta?.changes===1?json({ok:true,status:next}):fail(409,'Review state changed');
  }
  if(mine&&req.method==='GET'){
   const r=await db.prepare("SELECT id,topic,title,body,status,created_at FROM member_forum_threads WHERE author_id=? ORDER BY created_at DESC LIMIT 30").bind(user.id).all();
   return json({items:r.results});
  }
  if(mineId){
   if(req.method!=='DELETE')return fail(405,'Method not allowed');
   if(url.search)return fail(400,'Unexpected filters');
   const withdrawn=await db.prepare("UPDATE member_forum_threads SET status='hidden',updated_at=?,revision=revision+1 WHERE id=? AND author_id=? AND status IN ('pending_review','published') RETURNING id").bind(now,mineId[1],user.id).all();
   if(withdrawn.results?.length===1)return json({ok:true,status:'hidden'});
   const existing=await db.prepare('SELECT status FROM member_forum_threads WHERE id=? AND author_id=?').bind(mineId[1],user.id).first();
   return existing?fail(409,'Thread is already closed'):fail(404,'Submission not found');
  }
  if(req.method!=='POST'&&req.method!=='DELETE'&&!(react&&req.method==='GET'))return fail(405,'Method not allowed');
  if(url.search)return fail(400,'Query unsupported for writes');
  // Reporting and private reactions do not force members to publish their identities.
  // Public identity is required only for authored thread/reply submissions.
  if(report&&req.method==='POST'){
   const v=await payload(req);
   if(!v||!permitted(v,['targetKind','targetId','reason'])||!['thread','reply'].includes(v.targetKind)||!UUID.test(v.targetId)||!['spam','harassment','unsafe','other'].includes(v.reason))return fail(400,'Invalid report');
   // Only reports on currently public, approved content are accepted.
   const publicTarget=v.targetKind==='thread'
    ?await db.prepare(selectThread+' AND t.id=?').bind(v.targetId).first()
    :await db.prepare(`SELECT r.id FROM member_forum_replies r
      JOIN member_forum_threads t ON t.id=r.thread_id
      JOIN member_creator_profiles author ON author.user_id=r.author_id
      JOIN member_creator_profiles parent ON parent.user_id=t.author_id
      JOIN "user" a ON a.id=author.user_id JOIN "user" b ON b.id=parent.user_id
      WHERE r.id=? AND r.status='published' AND t.status='published'
      AND author.visibility='public' AND parent.visibility='public'
      AND a.emailVerified=1 AND b.emailVerified=1`).bind(v.targetId).first();
   if(!publicTarget)return fail(404,'Content is not public');
   const result=await db.prepare(`INSERT OR IGNORE INTO member_forum_reports
     (id,reporter_id,target_kind,target_id,reason,created_at)
     SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM member_forum_reports
     WHERE reporter_id=? AND created_at>?)<10`)
     .bind(crypto.randomUUID(),user.id,v.targetKind,v.targetId,v.reason,now,user.id,now-86400).run();
   if(result.meta?.changes===1)return json({ok:true},201);
   const old=await db.prepare('SELECT id FROM member_forum_reports WHERE reporter_id=? AND target_kind=? AND target_id=?').bind(user.id,v.targetKind,v.targetId).first();
   return old?json({ok:true,previouslyReported:true}):fail(429,'Daily report limit reached');
  }
  if(react&&['GET','POST','DELETE'].includes(req.method)){
   if(!await db.prepare(selectThread+' AND t.id=?').bind(react[1]).first())return fail(404,'Thread is not public');
   if(req.method==='GET'){
    const mine=await db.prepare('SELECT 1 AS found FROM member_forum_reactions WHERE thread_id=? AND user_id=?').bind(react[1],user.id).first();
    return json({reacted:Boolean(mine)});
   }
   if(req.method==='POST')await db.prepare('INSERT OR IGNORE INTO member_forum_reactions(thread_id,user_id,created_at) VALUES(?,?,?)').bind(react[1],user.id,now).run();
   else await db.prepare('DELETE FROM member_forum_reactions WHERE thread_id=? AND user_id=?').bind(react[1],user.id).run();
   return json({ok:true});
  }
  if(req.method!=='POST')return fail(405,'Method not allowed');
  const profile=await db.prepare("SELECT handle,visibility FROM member_creator_profiles WHERE user_id=?").bind(user.id).first();
  if(!profile||profile.visibility!=='public')return fail(403,'Enable your public member profile before posting');
  const v=await payload(req);
  if(!v||!permitted(v,reply?['body','requestId']:['title','body','topic','requestId'])||!UUID.test(v.requestId)||typeof v.body!=='string'||CTRL.test(v.body))return fail(400,'Invalid submission');
  const body=v.body.trim(),isReply=Boolean(reply);
  if(body.length<(isReply?10:20)||body.length>(isReply?2000:5000))return fail(400,'Invalid message length');
  if(!isReply&&(typeof v.title!=='string'||v.title.trim().length<8||v.title.trim().length>120||CTRL.test(v.title)||!TOPICS.has(v.topic)))return fail(400,'Invalid thread');
  if(isReply&&!await db.prepare(selectThread+' AND t.id=?').bind(reply[1]).first())return fail(404,'Thread is not public');
  const table=isReply?'member_forum_replies':'member_forum_threads';
  const existing=await db.prepare(`SELECT id,status FROM ${table} WHERE author_id=? AND client_request_id=?`).bind(user.id,v.requestId).first();
  if(existing)return json({id:existing.id,status:existing.status,replayed:true});
  const id=crypto.randomUUID(),limit=isReply?12:4;
  const saved=isReply?
   await db.prepare(`INSERT INTO member_forum_replies
    (id,thread_id,author_id,client_request_id,body,created_at,updated_at)
    SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM member_forum_replies WHERE author_id=? AND created_at>?)<?
    ON CONFLICT(author_id,client_request_id) DO NOTHING RETURNING id,status`)
    .bind(id,reply[1],user.id,v.requestId,body,now,now,user.id,now-3600,limit).all():
   await db.prepare(`INSERT INTO member_forum_threads
    (id,author_id,client_request_id,topic,title,body,created_at,updated_at)
    SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM member_forum_threads WHERE author_id=? AND created_at>?)<?
    ON CONFLICT(author_id,client_request_id) DO NOTHING RETURNING id,status`)
    .bind(id,user.id,v.requestId,v.topic,v.title.trim(),body,now,now,user.id,now-3600,limit).all();
  const inserted=saved.results?.[0];
  if(inserted)return json({id:inserted.id,status:inserted.status},201);
  const replay=await db.prepare(`SELECT id,status FROM ${table} WHERE author_id=? AND client_request_id=?`).bind(user.id,v.requestId).first();
  return replay?json({id:replay.id,status:replay.status,replayed:true}):fail(429,'Community posting limit reached. Try again later');
 }catch{return fail(503,'Community service unavailable')}
}
