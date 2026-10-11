// Invite-only V5 Commons discussion foundation. NO PUBLIC SOCIAL LAUNCH.
// Called only after Better Auth identity + same-origin mutation validation.
// The production Worker and normal F0/Alpaca migration routes must not enable it.
const TOPICS=new Set(["systems","engineering","research","releases"]);
const REASONS=new Set(["spam","harassment","privacy","misinformation","other"]);
const TABLES=[
  "commons_v5_posts","commons_v5_replies","commons_v5_reports",
  "commons_v5_moderation_events"
];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reply(value,status=200){
  return Response.json(value,{status,headers:{
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  }});
}
export function socialConfigured(env,verifiedOrigin){
  try{
    const expected=new URL(String(env?.MEMBER_PREVIEW_ORIGIN||""));
    return !!verifiedOrigin && expected.protocol==="https:" &&
      expected.origin===verifiedOrigin && expected.hostname.endsWith(".workers.dev") &&
      verifiedOrigin!=="https://anevum.com" &&
      env?.ANEVUM_MEMBER_PREVIEW_ENABLED==="true" &&
      env?.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED==="true";
  }catch{return false;}
}
export async function socialSchemaReady(db){
  if(typeof db?.prepare!=="function")return false;
  try{
    const rows=await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'commons_v5_%'"
    ).all();
    const names=new Set((rows.results||[]).map(x=>x.name));
    return TABLES.every(name=>names.has(name));
  }catch{return false;}
}
function validText(value,min,max){
  if(typeof value!=="string")return null;
  const text=value.trim();
  if(text.length<min||text.length>max ||
     /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))return null;
  return text;
}
export function validatePost(value){
  if(!value || typeof value!=="object" || Array.isArray(value) ||
     Object.keys(value).sort().join(",")!=="body,title,topic" ||
     !TOPICS.has(value.topic))throw Error("Invalid post fields.");
  const title=validText(value.title,8,120);
  const body=validText(value.body,20,3000);
  if(!title || !body)throw Error("Invalid post length or content.");
  return {topic:value.topic,title,body};
}
export function validateReply(value){
  if(!value || typeof value!=="object" || Array.isArray(value) ||
    Object.keys(value).join(",")!=="body")throw Error("Invalid reply fields.");
  const body=validText(value.body,2,1000);
  if(!body)throw Error("Invalid reply content.");
  return {body};
}
export function validateReport(value){
  if(!value || typeof value!=="object" || Array.isArray(value) ||
     Object.keys(value).join(",")!=="reason" || !REASONS.has(value.reason))
    throw Error("Invalid report reason.");
  return {reason:value.reason};
}
async function jsonBody(request){
  if(request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase()!=="application/json")
    throw Error("JSON required.");
  const raw=await request.text();
  if(raw.length>4400)throw Error("Request too large.");
  return JSON.parse(raw);
}
const SCHEMA="anevum.commons-discussions.v1";
function memberReply(user,value,status=200){return reply({schemaVersion:SCHEMA,viewerMemberId:user.id,...value},status);}
function encodeCursor(kind,scope,row){
  return btoa(JSON.stringify({v:1,kind,scope,at:row.created_at,id:row.id})).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
}
function pageCursor(url,kind,scope,allowed){
  if([...url.searchParams.keys()].some(key=>!allowed.includes(key))||allowed.some(key=>url.searchParams.getAll(key).length>1))throw Error("Invalid paging query");
  const raw=url.searchParams.get("cursor");if(raw===null)return null;
  if(!/^[A-Za-z0-9_-]{1,350}$/.test(raw))throw Error("Invalid cursor");
  const value=JSON.parse(atob(raw.replaceAll("-","+").replaceAll("_","/")));
  if(!value||Object.keys(value).sort().join(",")!=="at,id,kind,scope,v"||value.v!==1||value.kind!==kind||value.scope!==scope||
     !Number.isSafeInteger(value.at)||value.at<0||value.at>8640000000000||typeof value.id!=="string"||!UUID.test(value.id))throw Error("Invalid cursor");
  return value;
}
function pageResult(rows,cap,kind,scope){
  const hasMore=rows.length>cap,items=rows.slice(0,cap);
  return {items,pageCap:cap,hasMore,nextCursor:hasMore?encodeCursor(kind,scope,items.at(-1)):null};
}
function presentPost(row,owner){
  return {
    id:row.id,topic:row.topic,title:row.title,body:row.body,
    createdAt:row.created_at,updatedAt:row.updated_at,
    ownedByMe:row.author_user_id===owner,authorLabel:"Commons member"
  };
}
function presentReply(row,owner){
  return {id:row.id,postId:row.post_id,body:row.body,createdAt:row.created_at,
    ownedByMe:row.author_user_id===owner,authorLabel:"Commons member"};
}
export async function exportMemberSocial(db,userId){
  // A member's account export includes their own contributions and reports
  // regardless of whether new posting is currently enabled.
  if(!await socialSchemaReady(db))return null;
  const [posts,replies,reports]=await Promise.all([
    db.prepare(
      "SELECT id,topic,title,body,status,created_at,updated_at FROM commons_v5_posts "+
      "WHERE author_user_id=? ORDER BY created_at ASC,id ASC"
    ).bind(userId).all(),
    db.prepare(
      "SELECT id,post_id,body,status,created_at FROM commons_v5_replies "+
      "WHERE author_user_id=? ORDER BY created_at ASC,id ASC"
    ).bind(userId).all(),
    db.prepare(
      "SELECT id,post_id,reason,status,created_at FROM commons_v5_reports "+
      "WHERE reporter_user_id=? ORDER BY created_at ASC,id ASC"
    ).bind(userId).all()
  ]);
  return {posts:posts.results||[],replies:replies.results||[],reports:reports.results||[]};
}

export async function commonsSocialEndpoint(request,env,user,origin,pathname){
  if(!user?.id)return reply({message:"Authentication required."},401);
  if(user.emailVerified!==true)return reply({message:"Verified member account required."},403);
  if(!socialConfigured(env,origin))return reply({
    available:false,message:"Commons discussion posting has not been enabled."
  },503);
  const db=env?.MEMBER_DB;
  if(!await socialSchemaReady(db))return reply({
    available:false,message:"Commons discussion storage is not available."
  },503);
  const url=new URL(request.url);
  if(url.origin!==origin)return reply({message:"Origin not allowed."},403);
  const now=Math.floor(Date.now()/1000);

  if(pathname==="/api/member/commons/posts"){
    if(request.method==="GET"){
      const topic=url.searchParams.get("topic");
      if(topic!==null && !TOPICS.has(topic))return reply({message:"Invalid topic."},400);
      let cursor;
      try{cursor=pageCursor(url,"posts",topic||"all",["topic","cursor"]);}
      catch{return reply({message:"Invalid feed cursor or filter."},400);}
      try{
        const args=[],clauses=["status='PUBLISHED'"];
        if(topic){clauses.push("topic=?");args.push(topic);}
        if(cursor){clauses.push("(created_at<? OR (created_at=? AND id<?))");args.push(cursor.at,cursor.at,cursor.id);}
        const values=await db.prepare("SELECT id,author_user_id,topic,title,body,created_at,updated_at FROM commons_v5_posts WHERE "+
          clauses.join(" AND ")+" ORDER BY created_at DESC,id DESC LIMIT 31").bind(...args).all();
        const {items,...page}=pageResult(values.results||[],30,"posts",topic||"all");
        return memberReply(user,{available:true,pilot:true,posts:items.map(x=>presentPost(x,user.id)),
          moderationStatus:"PILOT_REVIEW_REQUIRED",...page,olderPostsMayExist:page.hasMore});
      }catch{return reply({message:"Commons feed temporarily unavailable."},503);}
    }
    if(request.method!=="POST")return reply({message:"Method not allowed."},405);
    if(url.search)return reply({message:"Unrecognized post query."},400);
    let content;
    try{content=validatePost(await jsonBody(request));}
    catch{return reply({message:"Valid topic, title and body are required."},400);}
    const id=crypto.randomUUID();
    try{
      // One statement enforces a bounded quota under concurrent submissions.
      const saved=await db.prepare(
        "INSERT INTO commons_v5_posts(id,author_user_id,topic,title,body,status,created_at,updated_at) "+
        "SELECT ?,?,?,?,?,'PUBLISHED',?,? WHERE "+
        "(SELECT COUNT(*) FROM commons_v5_posts WHERE author_user_id=? AND created_at>=?)<3"
      ).bind(id,user.id,content.topic,content.title,content.body,now,now,user.id,now-86400).run();
      if(saved.meta?.changes!==1)return reply({message:"Daily post limit reached."},429);
      return memberReply(user,{created:true,post:{
        id,...content,createdAt:now,updatedAt:now,ownedByMe:true,authorLabel:"Commons member"
      }},201);
    }catch{return reply({message:"Could not publish this post."},503);}
  }

  const removal=pathname.match(/^\/api\/member\/commons\/posts\/([0-9a-f-]{36})\/replies\/([0-9a-f-]{36})$/i);
  if(removal){
    if(!UUID.test(removal[1])||!UUID.test(removal[2])||url.search)return reply({message:"Unrecognized reply removal."},400);
    if(request.method!=="DELETE")return reply({message:"Method not allowed."},405);
    if(await request.text())return reply({message:"Reply removal takes no body."},400);
    try{
      const result=await db.prepare("UPDATE commons_v5_replies SET status='REMOVED',body='Removed by author request.' "+
        "WHERE id=? AND post_id=? AND author_user_id=? AND status='PUBLISHED'").bind(removal[2],removal[1],user.id).run();
      return result.meta?.changes===1?memberReply(user,{removed:true,postId:removal[1],replyId:removal[2]}):reply({message:"Reply not found in your account."},404);
    }catch{return reply({message:"Reply removal is unavailable."},503);}
  }
  const m=pathname.match(/^\/api\/member\/commons\/posts\/([0-9a-f-]{36})(?:\/(replies|report))?$/i);
  if(!m || !UUID.test(m[1]) || (url.search && !(m[2]==="replies"&&request.method==="GET")))return reply({message:"Commons endpoint not found."},404);
  const postId=m[1],verb=m[2]||"";
  if(verb===""){
    if(request.method!=="DELETE")return reply({message:"Method not allowed."},405);
    if(await request.text())return reply({message:"Post removal takes no body."},400);
    try{
      const out=await db.prepare(
        "UPDATE commons_v5_posts SET status='REMOVED',title='Removed post',"+
        "body='Removed by author request.',updated_at=? "+
        "WHERE id=? AND author_user_id=? AND status='PUBLISHED'"
      ).bind(now,postId,user.id).run();
      return out.meta?.changes===1 ? memberReply(user,{removed:true,postId})
        : reply({message:"Post not found in your account."},404);
    }catch{return reply({message:"Post removal is unavailable."},503);}
  }
  if(verb==="replies"){
    if(request.method==="GET"){
      let cursor;
      try{cursor=pageCursor(url,"replies",postId,["cursor"]);}
      catch{return reply({message:"Invalid replies cursor."},400);}
      try{
        const args=[postId,postId];
        let after="";
        if(cursor){after=" AND (created_at>? OR (created_at=? AND id>?))";args.push(cursor.at,cursor.at,cursor.id);}
        const rows=await db.prepare(
          "SELECT id,post_id,author_user_id,body,created_at FROM commons_v5_replies "+
          "WHERE post_id=? AND status='PUBLISHED' AND EXISTS "+
          "(SELECT 1 FROM commons_v5_posts WHERE id=? AND status='PUBLISHED')"+after+
          " ORDER BY created_at ASC,id ASC LIMIT 51"
        ).bind(...args).all();
        const {items,...page}=pageResult(rows.results||[],50,"replies",postId);
        return memberReply(user,{postId,replies:items.map(x=>presentReply(x,user.id)),...page});
      }catch{return reply({message:"Replies unavailable."},503);}
    }
    if(request.method!=="POST")return reply({message:"Method not allowed."},405);
    let value;
    try{value=validateReply(await jsonBody(request));}
    catch{return reply({message:"A valid reply is required."},400);}
    const id=crypto.randomUUID();
    try{
      const result=await db.prepare(
        "INSERT INTO commons_v5_replies(id,post_id,author_user_id,body,status,created_at) "+
        "SELECT ?,id,?,?,'PUBLISHED',? FROM commons_v5_posts "+
        "WHERE id=? AND status='PUBLISHED' AND "+
        "(SELECT COUNT(*) FROM commons_v5_replies WHERE author_user_id=? AND created_at>=?)<12"
      ).bind(id,user.id,value.body,now,postId,user.id,now-86400).run();
      if(result.meta?.changes!==1)return reply({message:"Post unavailable or reply limit reached."},409);
      return memberReply(user,{created:true,reply:{
        id,postId,body:value.body,createdAt:now,ownedByMe:true,authorLabel:"Commons member"
      }},201);
    }catch{return reply({message:"Could not save reply."},503);}
  }
  if(request.method!=="POST")return reply({message:"Method not allowed."},405);
  let report;
  try{report=validateReport(await jsonBody(request));}
  catch{return reply({message:"Select an approved report reason."},400);}
  try{
    const result=await db.prepare(
      "INSERT OR IGNORE INTO commons_v5_reports(id,post_id,reporter_user_id,reason,status,created_at) "+
      "SELECT ?,id,?,?,'PENDING',? FROM commons_v5_posts "+
      "WHERE id=? AND status='PUBLISHED' AND author_user_id!=?"
    ).bind(crypto.randomUUID(),user.id,report.reason,now,postId,user.id).run();
    if(result.meta?.changes!==1)return reply({message:"Report not accepted for this post."},409);
    return memberReply(user,{reported:true,postId,reviewStatus:"PENDING"},201);
  }catch{return reply({message:"Report service unavailable."},503);}
}
