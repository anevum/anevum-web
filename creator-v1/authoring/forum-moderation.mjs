// Reviewed staff-side forum moderation, staging only.
// The Studio Worker verifies Cloudflare Access JWT, owner allowlist and
// same-origin writes before routing here. No public API bypass is available.
const ROOT='/api/forum';
const IDENT=/^[a-f0-9]{32}$/;
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'};
const output=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const sql=(db,s,params=[])=>params.length?db.prepare(s).bind(...params):db.prepare(s);
async function rows(db,s,params=[]){const r=await sql(db,s,params).all();if(r?.success===false||!Array.isArray(r?.results))throw Error('Forum moderation unavailable');return r.results;}
async function transact(db,queries){const out=await db.batch(queries);if(!Array.isArray(out)||out.some(x=>x?.success===false))throw Error('Forum moderation unavailable');return out;}
const changes=v=>Number(v?.meta?.changes??v?.meta?.rows_written??0);
const id=()=>crypto.randomUUID().replaceAll('-','');
async function body(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))return null;
 const raw=await req.text();if(raw.length>1000)return null;
 let parsed;try{parsed=JSON.parse(raw)}catch{return null}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||Object.keys(parsed).length!==1||typeof parsed.reason!=='string')return null;
 const reason=parsed.reason.trim();
 if(reason.length<12||reason.length>600||/[\u0000-\u001f\u007f]/.test(reason))return null;
 return reason;
}
export async function forumModeration(req,db,actor){
 const u=new URL(req.url),path=u.pathname;
 if(!path.startsWith(ROOT))return output({error:'Not found'},404);
 if(u.search)return output({error:'Invalid query'},400);
 if(req.method==='GET'&&path===ROOT+'/queue'){
  const list=await rows(db,`SELECT p.id,p.thread_id AS threadId,p.body,p.starter,p.status,
     p.created_at AS createdAt,t.title,t.room,c.handle
    FROM forum_posts p JOIN forum_threads t ON t.id=p.thread_id
    JOIN member_accounts a ON a.id=p.author_member_id JOIN creator_profiles c ON c.member_id=a.id
    WHERE p.status='pending' AND a.status='active' AND c.status='active'
    ORDER BY p.created_at,p.id LIMIT 60`);
  return output({items:list});
 }
 if(req.method==='GET'&&path===ROOT+'/reports'){
  const list=await rows(db,`SELECT r.id,r.post_id AS postId,r.reason,r.details,r.created_at AS createdAt,
    p.body,c.handle,p.status AS postStatus,t.title AS threadTitle,t.room
    FROM forum_reports r JOIN forum_posts p ON p.id=r.post_id
    JOIN forum_threads t ON t.id=p.thread_id
    JOIN creator_profiles c ON c.member_id=p.author_member_id
    WHERE r.status='open' ORDER BY r.created_at,r.id LIMIT 60`);
  return output({items:list});
 }
 if(req.method!=='POST')return output({error:'Method not allowed'},405);
 const reason=await body(req);
 if(!reason)return output({error:'A recorded moderation reason of 12–600 characters is required'},400);
 const postMatch=new RegExp('^'+ROOT+'/posts/([a-f0-9]{32})/(approve|hide|restore)$').exec(path);
 if(postMatch){
  const postId=postMatch[1],action=postMatch[2];
  const matched=await rows(db,`SELECT p.status,p.starter,p.thread_id AS threadId,t.status AS threadStatus
    FROM forum_posts p JOIN forum_threads t ON t.id=p.thread_id WHERE p.id=? LIMIT 1`,[postId]);
  if(!matched.length)return output({error:'Post not found'},404);
  const p=matched[0],before=p.status;
  const after=action==='hide'?'hidden':'visible';
  if(action==='approve'&&before!=='pending'||action==='restore'&&before!=='hidden'||
    action==='hide'&&!['pending','visible'].includes(before))return output({error:'Post already changed'},409);
  if(!p.starter&&after==='visible'&&p.threadStatus!=='visible')return output({error:'Parent discussion is not approved'},409);
  const clock=Math.floor(Date.now()/1000),eventId=id();
  const stmts=[
   sql(db,`UPDATE forum_posts SET status=?,reviewed_at=? WHERE id=? AND status=? AND
     (starter=1 OR ?='hidden' OR EXISTS(SELECT 1 FROM forum_threads t
       WHERE t.id=forum_posts.thread_id AND t.status='visible'))`,[after,clock,postId,before,after]),
   sql(db,`INSERT INTO forum_moderation_events(id,post_id,actor_email,action,reason,from_status,to_status,created_at)
     SELECT ?,?,?,?,?,?,?,? WHERE changes()=1`,[eventId,postId,actor,action,reason,before,after,clock])
  ];
  if(p.starter){
   stmts.push(sql(db,`UPDATE forum_threads SET status=?,updated_at=?,visible_at=
     CASE WHEN ?='visible' THEN COALESCE(visible_at,?) ELSE visible_at END
     WHERE id=? AND status=? AND EXISTS
       (SELECT 1 FROM forum_posts WHERE id=? AND starter=1 AND status=?)`,
     [after,clock,after,clock,p.threadId,p.threadStatus,postId,after]));
  }
  const result=await transact(db,stmts);
  if(changes(result[0])!==1||changes(result[1])!==1||(p.starter&&changes(result[2])!==1))
   return output({error:'Moderation state changed; refresh queue'},409);
  return output({id:postId,status:after,reviewed:true});
 }
 const reportMatch=new RegExp('^'+ROOT+'/reports/([a-f0-9]{32})/(resolve|dismiss)$').exec(path);
 if(reportMatch){
  const reportId=reportMatch[1],action=reportMatch[2];
  const clock=Math.floor(Date.now()/1000);
  const result=await transact(db,[
   sql(db,"UPDATE forum_reports SET status=?,reviewed_at=? WHERE id=? AND status='open'",[action==='resolve'?'resolved':'dismissed',clock,reportId]),
   sql(db,`INSERT INTO forum_report_events(id,report_id,actor_email,action,reason,created_at)
     SELECT ?,?,?,?,?,? WHERE changes()=1`,[id(),reportId,actor,action,reason,clock])
  ]);
  if(changes(result[0])!==1||changes(result[1])!==1)return output({error:'Report not found or already reviewed'},409);
  return output({id:reportId,status:action==='resolve'?'resolved':'dismissed',reviewed:true});
 }
 return output({error:'Not found'},404);
}
