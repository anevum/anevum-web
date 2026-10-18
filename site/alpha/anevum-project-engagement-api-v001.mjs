/*
 * ANEVUM creator engagement alpha v001
 * Real votes, saves, staff-reviewed comments, and reports for published projects.
 * Sandboxed uploaded games never obtain member credentials or this API.
 * AUTH: canonical Better Auth Worker. DB: canonical member D1.
 */
const ORIGIN="https://anevum.com";
const PREFIX="/api/v1/alpha/social";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SECURITY={"content-type":"application/json; charset=utf-8","cache-control":"private,no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex,nofollow"};
const data=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:SECURITY});
const err=(status,message)=>data({error:message},status);
const now=()=>Math.floor(Date.now()/1000);
async function member(req,env){
 const cookie=req.headers.get("cookie");
 if(!cookie||cookie.length>8192)return null;
 try{
  const h=new Headers({cookie,accept:"application/json"});
  if(req.headers.get("user-agent"))h.set("user-agent",req.headers.get("user-agent"));
  const r=await env.AUTH.fetch(new Request(ORIGIN+"/api/v1/member/auth/get-session",{method:"GET",headers:h,redirect:"manual"}));
  if(!r.ok)return null;
  const x=await r.json().catch(()=>null),u=x?.user,s=x?.session;
  if(!s||!u||u.emailVerified!==true||typeof u.id!=="string"||s.userId!==u.id)return null;
  if(s.expiresAt&&Date.parse(s.expiresAt)<=Date.now())return null;
  return {id:u.id};
 }catch{return null}
}
async function published(db,id){
 if(!ID.test(id))return null;
 return db.prepare("SELECT id,owner_id,title,status FROM anevum_alpha_projects WHERE id=? AND status='published' LIMIT 1").bind(id).first();
}
async function staff(db,id){
 if(!id)return false;
 const g=await db.prepare("SELECT role FROM staff_access_grants WHERE member_id=? AND revoked_at IS NULL AND role IN ('owner','reviewer') LIMIT 1").bind(id).first();
 return !!g;
}
function verifiedMutation(req){
 const origin=req.headers.get("origin");
 if(origin!==ORIGIN)return false;
 if(req.headers.get("x-anevum-interaction")!=="1")return false;
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get("content-type")||""))return false;
 const length=Number(req.headers.get("content-length")||0);
 if(length>3500)return false;
 const site=req.headers.get("sec-fetch-site");
 return !site||site==="same-origin"||site==="none";
}
async function body(req){
 const value=await req.text();
 if(value.length>3500)throw Error("Request body too large");
 let obj;try{obj=JSON.parse(value)}catch{throw Error("Invalid JSON")}
 if(!obj||typeof obj!=="object"||Array.isArray(obj))throw Error("Expected an object");
 return obj;
}
async function stats(db,id){
 const [v,s,c]=await Promise.all([
  db.prepare("SELECT COUNT(*) n, ROUND(AVG(score),2) average FROM anevum_alpha_project_votes WHERE project_id=?").bind(id).first(),
  db.prepare("SELECT COUNT(*) n FROM anevum_alpha_project_saves WHERE project_id=?").bind(id).first(),
  db.prepare("SELECT COUNT(*) n FROM anevum_alpha_project_comments WHERE project_id=? AND status='published'").bind(id).first()
 ]);
 return {voteCount:Number(v?.n||0),averageScore:v?.average==null?null:Number(v.average),
   saveCount:Number(s?.n||0),commentCount:Number(c?.n||0)};
}
async function summary(req,env,id){
 const p=await published(env.DB,id);
 if(!p)return err(404,"Project not available");
 return data({projectId:id,...await stats(env.DB,id)});
}
async function me(req,env,id){
 const p=await published(env.DB,id);if(!p)return err(404,"Project not available");
 const u=await member(req,env);if(!u)return data({authenticated:false,score:null,saved:false,isCreator:false});
 const [v,s]=await Promise.all([
  env.DB.prepare("SELECT score FROM anevum_alpha_project_votes WHERE project_id=? AND member_id=?").bind(id,u.id).first(),
  env.DB.prepare("SELECT 1 present FROM anevum_alpha_project_saves WHERE project_id=? AND member_id=?").bind(id,u.id).first()
 ]);
 return data({authenticated:true,score:v?.score??null,saved:!!s,isCreator:u.id===p.owner_id});
}
async function listComments(req,env,id){
 const project=await published(env.DB,id);if(!project)return err(404,"Project not available");
 const u=new URL(req.url),cursor=u.searchParams.get("cursor")||"",limit=12;
 const match=/^(\d{10}):([0-9a-f-]{36})$/.exec(cursor);
 if(cursor&&!match)return err(400,"Invalid cursor");
 const base="SELECT c.id,c.body,c.published_at,p.handle AS creator_handle,p.display_name AS creator_name,CASE WHEN c.author_id=pr.owner_id THEN 1 ELSE 0 END AS is_creator FROM anevum_alpha_project_comments c JOIN anevum_alpha_projects pr ON pr.id=c.project_id LEFT JOIN member_creator_profiles p ON p.user_id=c.author_id AND p.visibility='public' WHERE c.project_id=? AND c.status='published'";
 const query=base+(match?" AND (c.published_at<? OR (c.published_at=? AND c.id<?))":"")+" ORDER BY c.published_at DESC,c.id DESC LIMIT 13";
 const args=match?[id,Number(match[1]),Number(match[1]),match[2]]:[id];
 const r=await env.DB.prepare(query).bind(...args).all();
 const found=r.results||[],hasMore=found.length>limit,selected=found.slice(0,limit),last=selected.at(-1);
 return data({items:selected.map(c=>({id:c.id,body:c.body,publishedAt:c.published_at,creatorHandle:c.creator_handle??null,creatorName:c.creator_name||"ANEVUM member",isCreator:!!c.is_creator})),
  nextCursor:hasMore&&last?last.published_at+":"+last.id:null});
}
async function vote(req,env,id,p,u){
 if(u.id===p.owner_id)return err(403,"Creators cannot rate their own releases");
 const x=await body(req),score=x.score;
 if(score!==null&&(!Number.isInteger(score)||score<1||score>5))return err(400,"Select a score from 1 to 5 or remove your vote");
 const t=now();
 if(score===null){
  const current=await env.DB.prepare("SELECT updated_at FROM anevum_alpha_project_votes WHERE project_id=? AND member_id=?").bind(id,u.id).first();
  if(current&&t-current.updated_at<3)return err(429,"Wait before changing your vote");
  await env.DB.prepare("DELETE FROM anevum_alpha_project_votes WHERE project_id=? AND member_id=?").bind(id,u.id).run();
 }else{
  const r=await env.DB.prepare("INSERT INTO anevum_alpha_project_votes(project_id,member_id,score,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(project_id,member_id) DO UPDATE SET score=excluded.score,updated_at=excluded.updated_at WHERE anevum_alpha_project_votes.updated_at<=?")
  .bind(id,u.id,score,t,t,t-3).run();
  if(Number(r.meta?.changes||0)===0)return err(429,"Wait before changing your vote");
 }
 return data({score,...await stats(env.DB,id)});
}
async function save(req,env,id,u){
 const x=await body(req);
 if(typeof x.saved!=="boolean")return err(400,"saved must be true or false");
 if(x.saved)await env.DB.prepare("INSERT OR IGNORE INTO anevum_alpha_project_saves(project_id,member_id,created_at) VALUES(?,?,?)").bind(id,u.id,now()).run();
 else await env.DB.prepare("DELETE FROM anevum_alpha_project_saves WHERE project_id=? AND member_id=?").bind(id,u.id).run();
 return data({saved:x.saved,...await stats(env.DB,id)});
}
async function comment(req,env,id,u){
 const x=await body(req),message=x.message,nonce=x.clientRequestId;
 if(typeof message!=="string"||message.trim().length<3||message.trim().length>1200||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(message))return err(400,"Comment must be 3–1200 characters of plain text");
 if(typeof nonce!=="string"||!ID.test(nonce))return err(400,"Request ID must be a UUID");
 const existing=await env.DB.prepare("SELECT id,status FROM anevum_alpha_project_comments WHERE author_id=? AND client_request_id=?").bind(u.id,nonce).first();
 if(existing)return data({id:existing.id,status:existing.status,duplicate:true},200);
 const t=now(),last=await env.DB.prepare("SELECT MAX(created_at) AS latest,COUNT(*) AS n FROM anevum_alpha_project_comments WHERE author_id=? AND created_at>?").bind(u.id,t-3600).first();
 if(Number(last?.n||0)>=6)return err(429,"You have reached the hourly comment limit");
 if(last?.latest&&t-Number(last.latest)<30)return err(429,"Wait 30 seconds before commenting again");
 const idComment=crypto.randomUUID();
 await env.DB.prepare("INSERT INTO anevum_alpha_project_comments(id,project_id,author_id,client_request_id,body,status,created_at) VALUES(?,?,?,?,?,'pending',?)")
  .bind(idComment,id,u.id,nonce,message.trim(),t).run();
 return data({id:idComment,status:"pending",message:"Submitted to staff for review"},201);
}
async function report(req,env,id,u){
 const x=await body(req),category=x.category,details=x.details;
 if(!["unsafe","abuse","spam","copyright","other"].includes(category)||typeof details!=="string"||details.trim().length<10||details.trim().length>800)return err(400,"Select a reason and describe the issue in 10–800 characters");
 const last=await env.DB.prepare("SELECT COUNT(*) n FROM anevum_alpha_project_reports WHERE reporter_id=? AND project_id=? AND created_at>?").bind(u.id,id,now()-86400).first();
 if(Number(last?.n||0)>0)return err(429,"You have already filed a report for this project in the last 24 hours");
 const reportId=crypto.randomUUID();
 await env.DB.prepare("INSERT INTO anevum_alpha_project_reports(id,project_id,reporter_id,category,details,created_at) VALUES(?,?,?,?,?,?)").bind(reportId,id,u.id,category,details.trim(),now()).run();
 return data({id:reportId,status:"pending",message:"Report sent to staff"},201);
}
async function moderation(req,env){
 const u=await member(req,env);if(!u)return err(401,"Verified sign-in required");
 if(!await staff(env.DB,u.id))return err(403,"Staff permission required");
 const [cs,rs]=await Promise.all([
  env.DB.prepare("SELECT c.id,c.project_id,c.body,c.created_at,p.title AS project_title FROM anevum_alpha_project_comments c JOIN anevum_alpha_projects p ON p.id=c.project_id WHERE c.status='pending' ORDER BY c.created_at ASC LIMIT 60").all(),
  env.DB.prepare("SELECT r.id,r.project_id,r.category,r.details,r.created_at,p.title AS project_title FROM anevum_alpha_project_reports r JOIN anevum_alpha_projects p ON p.id=r.project_id WHERE r.status='pending' ORDER BY r.created_at ASC LIMIT 60").all()
 ]);
 return data({comments:(cs.results||[]).map(x=>({id:x.id,projectId:x.project_id,body:x.body,createdAt:x.created_at,projectTitle:x.project_title})),
  reports:(rs.results||[]).map(x=>({id:x.id,projectId:x.project_id,category:x.category,details:x.details,createdAt:x.created_at,projectTitle:x.project_title}))});
}
async function reviewComment(req,env,id,u){
 const x=await body(req);
 if(!["publish","reject","hide"].includes(x.action))return err(400,"Invalid review decision");
 const reason=typeof x.reason==="string"?x.reason.trim():"";
 if(x.action!=="publish"&&(reason.length<10||reason.length>600))return err(400,"Provide a 10–600 character explanation");
 const t=now();
 const next=x.action==="publish"?"published":x.action==="reject"?"rejected":"hidden";
 const previous=x.action==="hide"?"published":"pending";
 const change=await env.DB.prepare("UPDATE anevum_alpha_project_comments SET status=?,reviewed_by=?,reviewed_at=?,published_at=CASE WHEN ?='published' THEN ? ELSE published_at END,review_reason=? WHERE id=? AND status=?")
 .bind(next,u.id,t,next,t,reason||null,id,previous).run();
 if(Number(change.meta?.changes||0)!==1)return err(409,"This comment is no longer eligible for that decision");
 await env.DB.prepare("INSERT INTO anevum_alpha_comment_review_log(id,comment_id,reviewer_id,action,reason,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),id,u.id,x.action,reason||null,t).run();
 return data({id,status:next});
}
async function reviewReport(req,env,id,u){
 const x=await body(req);if(!["resolve","dismiss"].includes(x.action))return err(400,"Invalid report decision");
 const next=x.action==="resolve"?"resolved":"dismissed";
 const r=await env.DB.prepare("UPDATE anevum_alpha_project_reports SET status=?,reviewer_id=?,resolved_at=? WHERE id=? AND status='pending'").bind(next,u.id,now(),id).run();
 if(Number(r.meta?.changes||0)!==1)return err(409,"Report no longer pending");
 return data({id,status:next});
}
export default{async fetch(req,env){
 const url=new URL(req.url),path=url.pathname;
 if(url.hostname!=="anevum.com"||!path.startsWith(PREFIX))return err(404,"Not found");
 if(path===PREFIX+"/health"&&req.method==="GET")return data({ok:true,version:1,publicRead:true,privateWrites:true});
 try{
  if(path===PREFIX+"/moderation"&&req.method==="GET")return moderation(req,env);
  const mod=path.match(/^\/api\/v1\/alpha\/social\/moderation\/(comments|reports)\/([0-9a-f-]{36})$/);
  if(mod){
   if(req.method!=="POST")return err(405,"Method not allowed");
   if(!ID.test(mod[2])||!verifiedMutation(req))return err(403,"Request not authorized");
   const u=await member(req,env);if(!u)return err(401,"Verified sign-in required");
   if(!await staff(env.DB,u.id))return err(403,"Staff permission required");
   return mod[1]==="comments"?reviewComment(req,env,mod[2],u):reviewReport(req,env,mod[2],u);
  }
  const item=path.match(/^\/api\/v1\/alpha\/social\/([0-9a-f-]{36})(?:\/(me|vote|save|comments|report))?$/);
  if(!item||!ID.test(item[1]))return err(404,"Not found");
  const id=item[1],action=item[2]||"summary";
  if(req.method==="GET"){
   if(action==="summary")return summary(req,env,id);
   if(action==="me")return me(req,env,id);
   if(action==="comments")return listComments(req,env,id);
   return err(405,"Method not allowed");
  }
  if(req.method!=="POST"||!["vote","save","comments","report"].includes(action))return err(405,"Method not allowed");
  if(!verifiedMutation(req))return err(403,"Request not authorized");
  const p=await published(env.DB,id);if(!p)return err(404,"Project not available");
  const u=await member(req,env);if(!u)return err(401,"Sign in with a verified ANEVUM account");
  if(action==="vote")return vote(req,env,id,p,u);
  if(action==="save")return save(req,env,id,u);
  if(action==="comments")return comment(req,env,id,u);
  return report(req,env,id,u);
 }catch(e){
  if(e instanceof SyntaxError||/Request body|Invalid JSON|Expected an object/.test(String(e.message)))return err(400,e.message||"Invalid request");
  return err(503,"Interaction service temporarily unavailable");
 }
}};