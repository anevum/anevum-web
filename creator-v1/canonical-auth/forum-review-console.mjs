// ANEVUM.WEB.BUILD.2026-10-16.002.MODERATOR-CONSOLE
// Private, verified-staff-only snapshot. This module never decides reviewer authority:
// canonicalForums enforces authorization before calling it.
const PAGE_SIZE=50;
const AUDIT_SIZE=25;

const memberFields=(owner)=>[
  "p.handle,p.display_name,p.visibility,u.emailVerified AS email_verified,",
  "s.featured_json,s.show_stats,",
  "EXISTS(SELECT 1 FROM member_space_media m WHERE m.user_id=p.user_id AND m.slot='avatar') AS avatar,",
  "(1+CAST(SQRT(MAX(0,(",
  "COALESCE((SELECT SUM(amount) FROM member_xp_events x WHERE x.user_id="+owner+"),0)+",
  "COALESCE((SELECT SUM(CASE milestone WHEN 'first_signal' THEN 10 WHEN 'world_shaper' THEN 25 ELSE 0 END)",
  "FROM member_space_milestones z WHERE z.user_id="+owner+"),0)",
  ")/25.0)) AS INTEGER)) AS level"
].join(" ");

function safeAwards(raw){
 try{
  const value=JSON.parse(raw||'[]');
  return Array.isArray(value)?value.filter(x=>x==='first_signal'||x==='world_shaper').slice(0,3):[];
 }catch{return [];}
}
function memberCard(row){
 const isPublic=row.visibility==='public'&&(row.email_verified===1||row.email_verified===true);
 return {
  handle:row.handle,displayName:row.display_name,
  visibility:isPublic?'public':'private',
  avatar:isPublic&&Boolean(row.avatar),
  level:isPublic&&row.show_stats!==0?Number(row.level)||1:null,
  featuredAwards:isPublic?safeAwards(row.featured_json):[]
 };
}
const countSql=[
 "SELECT",
 "(SELECT COUNT(*) FROM member_forum_threads WHERE status='pending_review') AS threads,",
 "(SELECT COUNT(*) FROM member_forum_replies WHERE status='pending_review') AS replies,",
 "(SELECT COUNT(*) FROM member_forum_reports WHERE resolved_at IS NULL) AS reports,",
 "(SELECT MIN(created_at) FROM member_forum_threads WHERE status='pending_review') AS oldest_thread_at,",
 "(SELECT MIN(created_at) FROM member_forum_replies WHERE status='pending_review') AS oldest_reply_at,",
 "(SELECT MIN(created_at) FROM member_forum_reports WHERE resolved_at IS NULL) AS oldest_report_at"
].join(" ");

const pendingThreadsSql=[
 "SELECT t.id,t.author_id,t.topic,t.title,t.body,t.created_at,",
 memberFields('t.author_id'),
 "FROM member_forum_threads t",
 "JOIN member_creator_profiles p ON p.user_id=t.author_id",
 "JOIN \"user\" u ON u.id=t.author_id",
 "LEFT JOIN member_space_settings s ON s.user_id=t.author_id",
 "WHERE t.status='pending_review'",
 "ORDER BY t.created_at ASC,t.id ASC LIMIT 50"
].join(" ");

const pendingRepliesSql=[
 "SELECT r.id,r.author_id,r.thread_id,r.body,r.created_at,",
 "parent.title AS thread_title,parent.topic AS thread_topic,parent.status AS parent_status,",
 "parentAuthor.visibility AS parent_visibility,parentUser.emailVerified AS parent_verified,",
 memberFields('r.author_id'),
 "FROM member_forum_replies r",
 "JOIN member_forum_threads parent ON parent.id=r.thread_id",
 "LEFT JOIN member_creator_profiles parentAuthor ON parentAuthor.user_id=parent.author_id",
 "LEFT JOIN \"user\" parentUser ON parentUser.id=parent.author_id",
 "JOIN member_creator_profiles p ON p.user_id=r.author_id",
 "JOIN \"user\" u ON u.id=r.author_id",
 "LEFT JOIN member_space_settings s ON s.user_id=r.author_id",
 "WHERE r.status='pending_review'",
 "ORDER BY r.created_at ASC,r.id ASC LIMIT 50"
].join(" ");

const reportsSql=[
 "SELECT x.id,x.target_kind,x.target_id,x.reason,x.created_at,",
 "CASE WHEN x.target_kind='thread' THEN t.status ELSE r.status END AS target_status,",
 "CASE WHEN x.target_kind='thread' THEN t.id ELSE parent.id END AS thread_id,",
 "CASE WHEN x.target_kind='thread' THEN t.title ELSE parent.title END AS thread_title,",
 "CASE WHEN x.target_kind='thread' THEN t.topic ELSE parent.topic END AS topic,",
 "CASE WHEN x.target_kind='thread' THEN t.body ELSE r.body END AS content_body,",
 "parent.status AS parent_status,",
 "p.handle AS author_handle,p.display_name AS author_display_name,",
 "p.visibility AS author_visibility",
 "FROM member_forum_reports x",
 "LEFT JOIN member_forum_threads t ON x.target_kind='thread' AND t.id=x.target_id",
 "LEFT JOIN member_forum_replies r ON x.target_kind='reply' AND r.id=x.target_id",
 "LEFT JOIN member_forum_threads parent ON parent.id=r.thread_id",
 "LEFT JOIN member_creator_profiles p ON p.user_id=COALESCE(t.author_id,r.author_id)",
 "WHERE x.resolved_at IS NULL",
 "ORDER BY CASE x.reason WHEN 'unsafe' THEN 0 WHEN 'harassment' THEN 1 WHEN 'spam' THEN 2 ELSE 3 END,",
 "x.created_at ASC,x.id ASC LIMIT 50"
].join(" ");

const auditSql=[
 "SELECT l.id,l.target_kind,l.target_id,l.action,l.created_at,",
 "COALESCE(p.handle,'') AS reviewer_handle",
 "FROM member_forum_review_log l",
 "LEFT JOIN member_creator_profiles p ON p.user_id=l.reviewer_id",
 "ORDER BY l.created_at DESC,l.id DESC LIMIT 25"
].join(" ");

export async function forumReviewSnapshot(db,reviewerId,now){
 const [totals,threads,replies,reports,recent]=await Promise.all([
  db.prepare(countSql).first(),
  db.prepare(pendingThreadsSql).all(),
  db.prepare(pendingRepliesSql).all(),
  db.prepare(reportsSql).all(),
  db.prepare(auditSql).all()
 ]);
 if(!totals)throw Error('Moderation count read unavailable');
 const list=rows=>Array.isArray(rows?.results)?rows.results:[];
 const threadItems=list(threads).map(row=>({
  id:row.id,topic:row.topic,title:row.title,body:row.body,createdAt:row.created_at,
  author:memberCard(row),selfAuthored:row.author_id===reviewerId,
  canPublish:row.author_id!==reviewerId&&row.visibility==='public'&&Boolean(row.email_verified)
 }));
 const replyItems=list(replies).map(row=>({
  id:row.id,threadId:row.thread_id,threadTitle:row.thread_title,threadTopic:row.thread_topic,
  body:row.body,createdAt:row.created_at,author:memberCard(row),
  selfAuthored:row.author_id===reviewerId,
  canPublish:row.author_id!==reviewerId&&row.visibility==='public'&&Boolean(row.email_verified)&&
   row.parent_status==='published'&&row.parent_visibility==='public'&&Boolean(row.parent_verified)
 }));
 const reportItems=list(reports).map(row=>({
  id:row.id,targetKind:row.target_kind,targetId:row.target_id,
  threadId:row.thread_id||null,threadTitle:row.thread_title||null,topic:row.topic||null,
  reason:row.reason,createdAt:row.created_at,targetStatus:row.target_status||'missing',
  parentStatus:row.target_kind==='reply'?row.parent_status||'missing':null,
  contentPreview:typeof row.content_body==='string'?row.content_body.slice(0,600):'',
  authorHandle:row.author_handle||null,
  authorDisplayName:row.author_display_name||null,
  authorVisibility:row.author_visibility||null,
  canHide:row.target_status==='published'&&(row.target_kind==='thread'||row.parent_status==='published')
 }));
 return {
  threads:threadItems,replies:replyItems,reports:reportItems,
  totals:{
   threads:Number(totals.threads)||0,replies:Number(totals.replies)||0,reports:Number(totals.reports)||0,
   oldestThreadAt:totals.oldest_thread_at??null,
   oldestReplyAt:totals.oldest_reply_at??null,
   oldestReportAt:totals.oldest_report_at??null
  },
  recent:list(recent).map(row=>({
   id:row.id,targetKind:row.target_kind,targetId:row.target_id,
   action:row.action,createdAt:row.created_at,
   reviewerHandle:row.reviewer_handle||null
  })),
  nextCursors:{
   threads:threadItems.length&&Number(totals.threads)>threadItems.length?reviewCursor('threads',list(threads).at(-1)):null,
   replies:replyItems.length&&Number(totals.replies)>replyItems.length?reviewCursor('replies',list(replies).at(-1)):null,
   reports:reportItems.length&&Number(totals.reports)>reportItems.length?reviewCursor('reports',list(reports).at(-1)):null,
   activity:list(recent).length===AUDIT_SIZE?reviewCursor('activity',list(recent).at(-1)):null
  },
  pageSize:PAGE_SIZE,auditSize:AUDIT_SIZE,checkedAt:now
 };
}


// V043 STAFF-ONLY KEYSET PAGINATION
// The V042 snapshot provides the first batch. Subsequent pages use bound SQL
// parameters instead of OFFSET while the moderation queue changes.
const ID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CURSOR_RE=/^(0|[1-9]\d{0,12})\.([0-9a-f-]{36})$/i;
const REPORT_CURSOR_RE=/^([0-3])\.(0|[1-9]\d{0,12})\.([0-9a-f-]{36})$/i;
const PRIORITY={unsafe:0,harassment:1,spam:2,other:3};
const REVIEW_LANES=new Set(['threads','replies','reports','activity']);

function reviewCursor(lane,row){
 if(!row)return null;
 const stamp=Number(row.created_at);
 if(!Number.isSafeInteger(stamp)||stamp<0||!ID_RE.test(row.id))return null;
 const basic=String(stamp)+'.'+row.id;
 return lane==='reports'?String(PRIORITY[row.reason])+'.'+basic:basic;
}
export function parseReviewPage(searchParams){
 if(!searchParams||typeof searchParams.get!=='function')return null;
 const keys=[...searchParams.keys()];
 if(keys.length!==2||keys.filter(x=>x==='lane').length!==1||keys.filter(x=>x==='after').length!==1)return null;
 const lane=searchParams.get('lane'),after=searchParams.get('after');
 if(!REVIEW_LANES.has(lane)||typeof after!=='string'||after.length>80)return null;
 const parts=after.match(lane==='reports'?REPORT_CURSOR_RE:CURSOR_RE);
 if(!parts||!ID_RE.test(parts.at(-1)))return null;
 const priority=lane==='reports'?Number(parts[1]):null;
 const stamp=Number(parts[lane==='reports'?2:1]);
 if(!Number.isSafeInteger(stamp)||stamp<0)return null;
 return {lane,stamp,priority,id:parts.at(-1)};
}

const threadPageSql=pendingThreadsSql
 .replace("WHERE t.status='pending_review'","WHERE t.status='pending_review' AND (t.created_at>? OR (t.created_at=? AND t.id>?))")
 .replace('LIMIT 50','LIMIT 51');
const replyPageSql=pendingRepliesSql
 .replace("WHERE r.status='pending_review'","WHERE r.status='pending_review' AND (r.created_at>? OR (r.created_at=? AND r.id>?))")
 .replace('LIMIT 50','LIMIT 51');
const reportPrioritySql="CASE x.reason WHEN 'unsafe' THEN 0 WHEN 'harassment' THEN 1 WHEN 'spam' THEN 2 ELSE 3 END";
const reportPageSql=reportsSql
 .replace('WHERE x.resolved_at IS NULL',
   'WHERE x.resolved_at IS NULL AND ('+reportPrioritySql+'>? OR ('+reportPrioritySql+'=? AND (x.created_at>? OR (x.created_at=? AND x.id>?))))')
 .replace('LIMIT 50','LIMIT 51');
const activityPageSql=auditSql
 .replace('ORDER BY l.created_at DESC,l.id DESC LIMIT 25',
  'WHERE l.created_at<? OR (l.created_at=? AND l.id<?) ORDER BY l.created_at DESC,l.id DESC LIMIT 26');

export async function forumReviewPage(db,reviewerId,now,page){
 if(!page||!REVIEW_LANES.has(page.lane))throw Error('Invalid reviewer page request');
 const {lane,stamp,id,priority}=page;
 const prepared=lane==='threads'?db.prepare(threadPageSql).bind(stamp,stamp,id):
  lane==='replies'?db.prepare(replyPageSql).bind(stamp,stamp,id):
  lane==='reports'?db.prepare(reportPageSql).bind(priority,priority,stamp,stamp,id):
  db.prepare(activityPageSql).bind(stamp,stamp,id);
 const result=await prepared.all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('Reviewer page unavailable');
 const limit=lane==='activity'?AUDIT_SIZE:PAGE_SIZE;
 const raw=result.results.slice(0,limit);
 const items=raw.map(row=>lane==='threads'?({
    id:row.id,topic:row.topic,title:row.title,body:row.body,createdAt:row.created_at,
    author:memberCard(row),selfAuthored:row.author_id===reviewerId,
    canPublish:row.author_id!==reviewerId&&row.visibility==='public'&&Boolean(row.email_verified)
   }):lane==='replies'?({
    id:row.id,threadId:row.thread_id,threadTitle:row.thread_title,threadTopic:row.thread_topic,
    body:row.body,createdAt:row.created_at,author:memberCard(row),
    selfAuthored:row.author_id===reviewerId,
    canPublish:row.author_id!==reviewerId&&row.visibility==='public'&&Boolean(row.email_verified)&&
     row.parent_status==='published'&&row.parent_visibility==='public'&&Boolean(row.parent_verified)
   }):lane==='reports'?({
    id:row.id,targetKind:row.target_kind,targetId:row.target_id,
    threadId:row.thread_id||null,threadTitle:row.thread_title||null,topic:row.topic||null,
    reason:row.reason,createdAt:row.created_at,targetStatus:row.target_status||'missing',
    parentStatus:row.target_kind==='reply'?row.parent_status||'missing':null,
    contentPreview:typeof row.content_body==='string'?row.content_body.slice(0,600):'',
    authorHandle:row.author_handle||null,authorDisplayName:row.author_display_name||null,
    authorVisibility:row.author_visibility||null,
    canHide:row.target_status==='published'&&(row.target_kind==='thread'||row.parent_status==='published')
   }):({
    id:row.id,targetKind:row.target_kind,targetId:row.target_id,
    action:row.action,createdAt:row.created_at,reviewerHandle:row.reviewer_handle||null
   }));
 return {lane,items,nextCursor:result.results.length>limit?reviewCursor(lane,raw.at(-1)):null,checkedAt:now};
}
