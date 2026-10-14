// ANEVUM Creator V1 / moderated public conversations in isolated staging.
// Public GET returns approved messages + verified contributor identity ONLY.
// POST remains invite-only, origin-checked by the existing Member Worker.
// Never award XP for posts, mentions, reactions or message volume.
import {progressionFromXp} from './community.mjs';
import {deriveAchievements} from './social.mjs';

const ROOT='/api/v1/member/forum';
const ROOMS=Object.freeze([
 Object.freeze({id:'arcade',name:'The Arcade',subject:'Games, playtesting and interactive worlds'}),
 Object.freeze({id:'workshop',name:'The Workshop',subject:'Independent apps, open source and practical making'}),
 Object.freeze({id:'lab',name:'The Lab',subject:'Experiments, AI and creative problem-solving'}),
 Object.freeze({id:'commons',name:'The Commons',subject:'Questions, introductions and collaboration'})
]);
const ROOM_IDS=new Set(ROOMS.map(room=>room.id));
const ID=/^[a-f0-9]{32}$/;
const CURSOR=/^(\d{1,12})\.([a-f0-9]{32})$/;
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'public, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'};
const respond=(req,value,status=200)=>new Response(req.method==='HEAD'?null:JSON.stringify(value),{status,headers:HEADERS});
const failure=(req,detail,status)=>respond(req,{error:detail},status);
const prepare=(db,statement,args=[])=>{const q=db.prepare(statement);return args.length?q.bind(...args):q};
async function rows(db,statement,args=[]){
 const result=await prepare(db,statement,args).all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('Forum unavailable');
 return result.results;
}
async function batch(db,statements){
 const result=await db.batch(statements);
 if(!Array.isArray(result)||result.some(entry=>entry.success===false))throw Error('Forum unavailable');
 return result;
}
const changes=result=>Number(result?.meta?.changes??result?.meta?.rows_written??0);
const number=(v)=>Math.max(0,Number(v)||0);
const dt=id=>crypto.randomUUID().replaceAll('-','');
function cursor(value){
 if(!value)return null;
 const m=CURSOR.exec(value);
 if(!m)return false;
 const stamp=Number(m[1]);
 if(!Number.isSafeInteger(stamp)||stamp<0)return false;
 return {stamp,id:m[2]};
}
function parseQuery(url,validKeys){
 if([...url.searchParams.keys()].some(key=>!validKeys.includes(key))||
   validKeys.some(key=>url.searchParams.getAll(key).length>1))return false;
 const parsed=cursor(url.searchParams.get('cursor'));
 return parsed;
}
function clean(value,min,max,multiline=false){
 if(typeof value!=='string'||value.length>max+80)return null;
 const v=value.trim().replace(/\r\n?/g,'\n');
 if(v.length<min||v.length>max)return null;
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))return null;
 if(!multiline&&/[\n\t]/.test(v))return null;
 return v;
}
async function input(req,keys,maxBytes){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))return null;
 const length=req.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>maxBytes))return null;
 if(!req.body)return null;
 const reader=req.body.getReader(),parts=[];let lengthRead=0;
 try{
  for(;;){
   const {value,done}=await reader.read();if(done)break;
   lengthRead+=value.byteLength;
   if(lengthRead>maxBytes){await reader.cancel();return null;}
   parts.push(value);
  }
 }finally{reader.releaseLock()}
 const bytes=new Uint8Array(lengthRead);let off=0;
 for(const p of parts){bytes.set(p,off);off+=p.byteLength;}
 let data;
 try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{return null}
 if(!data||typeof data!=='object'||Array.isArray(data)||
  Object.keys(data).length!==keys.length||keys.some(key=>!Object.hasOwn(data,key)))return null;
 return data;
}
const visibleThread=`t.status='visible' AND starter.status='visible' AND starter.starter=1
 AND ta.status='active' AND tc.status='active'`;
const activeAuthor=`a.status='active' AND c.status='active'`;
async function authorMap(db,ids){
 const unique=[...new Set(ids)];
 if(unique.length===0)return new Map();
 const placeholders=unique.map(()=>'?').join(',');
 const found=await rows(db,`SELECT a.id,c.handle,c.display_name AS displayName,
   (SELECT COUNT(*) FROM community_project_votes v WHERE v.member_id=a.id AND v.status='active') AS ratings,
   (SELECT COUNT(*) FROM projects p WHERE p.owner_member_id=a.id AND p.status='published' AND julianday(p.published_at)<=julianday('now')) AS publishedProjects,
   (SELECT COUNT(*) FROM project_releases r JOIN projects p ON p.id=r.project_id WHERE p.owner_member_id=a.id AND p.status='published' AND julianday(p.published_at)<=julianday('now')) AS releases,
   (SELECT COALESCE(SUM(x.amount),0) FROM community_xp_events x WHERE x.member_id=a.id) AS xp
   FROM member_accounts a JOIN creator_profiles c ON c.member_id=a.id
   WHERE a.id IN (${placeholders}) AND ${activeAuthor}`,unique);
 return new Map(found.map(person=>{
  const stats={ratings:number(person.ratings),publishedProjects:number(person.publishedProjects),releases:number(person.releases)};
  const progress=progressionFromXp(number(person.xp));
  return [person.id,Object.freeze({
    handle:person.handle,displayName:person.displayName,level:progress.level,
    artifact:progress.artifact,
    badges:deriveAchievements(stats).filter(x=>x.earned).map(x=>({key:x.key,name:x.name,symbol:x.symbol}))
  })];
 }));
}
async function memberAllowed(db,member){
 if(!member?.id||!member.handle)return false;
 const result=await rows(db,`SELECT c.member_id FROM creator_profiles c JOIN member_accounts a ON a.id=c.member_id
   WHERE c.member_id=? AND a.status='active' AND c.status='active' AND c.handle=? LIMIT 1`,[member.id,member.handle]);
 return result.length===1;
}
async function threadItems(db,room,pagination){
 const where=pagination?`AND (t.visible_at<? OR (t.visible_at=? AND t.id<?))`:'';
 const values=pagination?[room,pagination.stamp,pagination.stamp,pagination.id]:[room];
 const list=await rows(db,`SELECT t.id,t.room,t.title,t.visible_at AS visibleAt,t.author_member_id AS authorId,
    (SELECT COUNT(*) FROM forum_posts v JOIN creator_profiles vc ON vc.member_id=v.author_member_id
       JOIN member_accounts va ON va.id=v.author_member_id
       WHERE v.thread_id=t.id AND v.status='visible' AND vc.status='active' AND va.status='active') AS postCount
   FROM forum_threads t JOIN forum_posts starter ON starter.thread_id=t.id AND starter.starter=1
   JOIN creator_profiles tc ON tc.member_id=t.author_member_id
   JOIN member_accounts ta ON ta.id=t.author_member_id
   WHERE t.room=? AND ${visibleThread} ${where}
   ORDER BY t.visible_at DESC,t.id DESC LIMIT 13`,values);
 const authors=await authorMap(db,list.map(t=>t.authorId));
 const published=list.slice(0,12).filter(x=>authors.has(x.authorId));
 return {items:published.map(x=>({id:x.id,room:x.room,title:x.title,createdAt:x.visibleAt,
   postCount:number(x.postCount),author:authors.get(x.authorId)})),
   nextCursor:list.length>12&&published.length===12?`${published[11].createdAt}.${published[11].id}`:null};
}
async function oneThread(db,id){
 const results=await rows(db,`SELECT t.id,t.title,t.room,t.visible_at AS visibleAt,t.author_member_id AS authorId
 FROM forum_threads t JOIN forum_posts starter ON starter.thread_id=t.id AND starter.starter=1
 JOIN member_accounts ta ON ta.id=t.author_member_id JOIN creator_profiles tc ON tc.member_id=t.author_member_id
 WHERE t.id=? AND ${visibleThread} LIMIT 1`,[id]);
 return results[0]||null;
}
function publishedPostDto(post,authors){
 const author=authors.get(post.authorId);
 return author?{id:post.id,body:post.body,createdAt:post.createdAt,starter:post.starter===1,author}:null;
}
export async function forumRoutes(req,db,member,rateLimit,now){
 const u=new URL(req.url),path=u.pathname;
 if(!path.startsWith(ROOT))return failure(req,'Not found',404);
 if(!['GET','HEAD','POST'].includes(req.method))return failure(req,'Method not allowed',405);
 try{
  if(path===ROOT+'/rooms'&&(req.method==='GET'||req.method==='HEAD')){
   if(u.search)return failure(req,'Invalid query',400);
   const counts=await rows(db,`SELECT t.room,COUNT(*) AS total FROM forum_threads t
      JOIN forum_posts starter ON starter.thread_id=t.id AND starter.starter=1
      JOIN member_accounts ta ON ta.id=t.author_member_id JOIN creator_profiles tc ON tc.member_id=t.author_member_id
      WHERE ${visibleThread} GROUP BY t.room`);
   const map=new Map(counts.map(row=>[row.room,number(row.total)]));
   return respond(req,{rooms:ROOMS.map(room=>({...room,threads:map.get(room.id)||0})),access:'staging-moderated'});
  }
  const roomMatch=new RegExp('^'+ROOT+'/rooms/([a-z]+)$').exec(path);
  if(roomMatch&&(req.method==='GET'||req.method==='HEAD')){
   const id=roomMatch[1];
   if(!ROOM_IDS.has(id))return failure(req,'Room not found',404);
   const pagination=parseQuery(u,['cursor']);
   if(pagination===false)return failure(req,'Invalid pagination',400);
   return respond(req,{room:ROOMS.find(x=>x.id===id),...await threadItems(db,id,pagination)});
  }
  const threadMatch=new RegExp('^'+ROOT+'/threads/([a-f0-9]{32})$').exec(path);
  if(threadMatch&&(req.method==='GET'||req.method==='HEAD')){
   const id=threadMatch[1],pagination=parseQuery(u,['cursor']);
   if(pagination===false)return failure(req,'Invalid pagination',400);
   const thread=await oneThread(db,id);
   if(!thread)return failure(req,'Discussion unavailable',404);
   const extra=pagination?`AND (p.created_at>? OR (p.created_at=? AND p.id>?))`:'';
   const parameters=pagination?[id,pagination.stamp,pagination.stamp,pagination.id]:[id];
   const list=await rows(db,`SELECT p.id,p.body,p.starter,p.created_at AS createdAt,p.author_member_id AS authorId
     FROM forum_posts p JOIN member_accounts a ON a.id=p.author_member_id JOIN creator_profiles c ON c.member_id=p.author_member_id
     WHERE p.thread_id=? AND p.status='visible' AND ${activeAuthor} ${extra}
     ORDER BY p.created_at,p.id LIMIT 41`,parameters);
   const authors=await authorMap(db,[thread.authorId,...list.map(x=>x.authorId)]);
   const posts=list.slice(0,40).map(p=>publishedPostDto(p,authors)).filter(Boolean);
   const last=posts.at(-1);
   return respond(req,{thread:{id:thread.id,room:thread.room,title:thread.title,createdAt:thread.visibleAt,
       author:authors.get(thread.authorId)||null},
     posts,nextCursor:list.length>40&&last?`${last.createdAt}.${last.id}`:null});
  }
  if(req.method!=='POST')return failure(req,'Not found',404);
  if(u.search)return failure(req,'Invalid query',400);
  if(!member)return failure(req,'Sign-in required',401);
  if(!await memberAllowed(db,member))return failure(req,'Complete your active creator profile to participate',403);
  if(path===ROOT+'/threads'){
   const data=await input(req,['room','title','body'],3500);
   if(!data||!ROOM_IDS.has(data.room))return failure(req,'Invalid discussion',400);
   const title=clean(data.title,5,110),body=clean(data.body,2,2400,true);
   if(!title||!body)return failure(req,'Discussion title or message is invalid',400);
   if(!await rateLimit(db,'forum:new:'+member.id,now,3,3600))return failure(req,'Discussion limit reached',429);
   const id=dt(),first=dt();
   const out=await batch(db,[
     prepare(db,`INSERT INTO forum_threads(id,room,author_member_id,title,status,created_at,updated_at)
       SELECT ?,?,?,?,'pending',?,? WHERE EXISTS
       (SELECT 1 FROM creator_profiles c JOIN member_accounts a ON a.id=c.member_id
        WHERE c.member_id=? AND c.status='active' AND a.status='active')`,
       [id,data.room,member.id,title,now,now,member.id]),
     prepare(db,`INSERT INTO forum_posts(id,thread_id,author_member_id,body,starter,status,created_at)
       SELECT ?,?,?,?,1,'pending',? WHERE EXISTS(SELECT 1 FROM forum_threads WHERE id=? AND status='pending')`,
       [first,id,member.id,body,now,id])
   ]);
   if(changes(out[0])!==1||changes(out[1])!==1)return failure(req,'Discussion could not be submitted',403);
   return respond(req,{id,status:'pending',notice:'Your discussion is awaiting human moderation; it is not publicly visible.'},202);
  }
  const replyMatch=new RegExp('^'+ROOT+'/threads/([a-f0-9]{32})/replies$').exec(path);
  if(replyMatch){
   const data=await input(req,['body'],3300);
   const body=data&&clean(data.body,2,2400,true);
   if(!body)return failure(req,'Message is invalid',400);
   const thread=await oneThread(db,replyMatch[1]);
   if(!thread)return failure(req,'Discussion unavailable',404);
   if(!await rateLimit(db,'forum:reply:'+member.id,now,8,3600))return failure(req,'Reply limit reached',429);
   const id=dt();
   const result=await prepare(db,`INSERT INTO forum_posts(id,thread_id,author_member_id,body,starter,status,created_at)
      SELECT ?,?,?,?,0,'pending',? WHERE EXISTS(
      SELECT 1 FROM forum_threads t JOIN forum_posts s ON s.thread_id=t.id AND s.starter=1
      WHERE t.id=? AND t.status='visible' AND s.status='visible')`,[id,thread.id,member.id,body,now,thread.id]).run();
   if(result?.success===false||changes(result)!==1)return failure(req,'Discussion changed; reload first',409);
   return respond(req,{id,status:'pending',notice:'Your reply is awaiting human moderation.'},202);
  }
  const reportMatch=new RegExp('^'+ROOT+'/posts/([a-f0-9]{32})/report$').exec(path);
  if(reportMatch){
   const data=await input(req,['reason','details'],750);
   const reasons=new Set(['spam','harassment','unsafe','copyright','other']);
   const details=data&&clean(data.details,0,500,true);
   if(!data||!reasons.has(data.reason)||details===null)return failure(req,'Invalid report',400);
   const found=await rows(db,`SELECT p.id,p.author_member_id AS authorId FROM forum_posts p
      JOIN forum_threads t ON t.id=p.thread_id
      JOIN forum_posts starter ON starter.thread_id=t.id AND starter.starter=1
      JOIN member_accounts a ON a.id=p.author_member_id JOIN creator_profiles c ON c.member_id=p.author_member_id
      JOIN member_accounts ta ON ta.id=t.author_member_id JOIN creator_profiles tc ON tc.member_id=t.author_member_id
      WHERE p.id=? AND p.status='visible' AND ${activeAuthor} AND ${visibleThread} LIMIT 1`,[reportMatch[1]]);
   if(!found.length)return failure(req,'Message unavailable',404);
   if(found[0].authorId===member.id)return failure(req,'Cannot report your own message',403);
   if(!await rateLimit(db,'forum:report:'+member.id,now,12,3600))return failure(req,'Report limit reached',429);
   const response=await prepare(db,`INSERT INTO forum_reports(id,post_id,reporter_member_id,reason,details,status,created_at)
      SELECT ?,?,?,?,?, 'open',? WHERE EXISTS(SELECT 1 FROM forum_posts WHERE id=? AND status='visible')
      ON CONFLICT(post_id,reporter_member_id) DO NOTHING`,[dt(),reportMatch[1],member.id,data.reason,details,now,reportMatch[1]]).run();
   if(response?.success===false)return failure(req,'Report unavailable',503);
   return respond(req,{recorded:true,notice:'Your report has been submitted to the staff review queue.'},202);
  }
  return failure(req,'Not found',404);
 }catch{
  return failure(req,'Forum temporarily unavailable',503);
 }
}
