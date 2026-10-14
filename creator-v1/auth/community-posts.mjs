// STAGING-ONLY moderated community submissions and one-account post reactions.
// Member identity and same-origin CSRF checks come from auth/worker.mjs.
// No anonymous writes, no self-votes, no client-awarded XP.
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow"};
const ROOT="/api/v1/member/community/posts";
const ID=/^[a-f0-9]{32}$/;
const TOPICS=new Set(["games","tools","creative","learning","libraries","research","automation","other"]);
const respond=(req,data,status=200)=>new Response(req.method==="HEAD"?null:JSON.stringify(data),{status,headers:HEADERS});
function stmt(db,sql,args=[]){const s=db.prepare(sql);return args.length?s.bind(...args):s;}
async function rows(db,sql,args=[]){const r=await stmt(db,sql,args).all();if(r.success===false||!Array.isArray(r.results))throw Error("Storage unavailable");return r.results;}
async function run(db,sql,args=[]){const r=await stmt(db,sql,args).run();if(r.success===false)throw Error("Storage unavailable");return r;}
async function payload(req,max=6500){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get("content-type")||""))throw Error("JSON required");
 const length=Number(req.headers.get("content-length"));
 if(Number.isFinite(length)&&length>max)throw Error("Payload too large");
 const reader=req.body?.getReader();if(!reader)throw Error("Body required");
 const chunks=[];let total=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>max){await reader.cancel();throw Error("Payload too large");}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let i=0;for(const chunk of chunks){bytes.set(chunk,i);i+=chunk.byteLength;}
 const parsed=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("Invalid post");
 return parsed;
}
function text(value,min,max,name){
 if(typeof value!=="string"||value.trim().length<min||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw Error("Invalid "+name);
 return value.trim();
}
async function active(db,memberId){
 const got=await rows(db,"SELECT member_id FROM creator_profiles WHERE member_id=? AND status='active'",[memberId]);
 return got.length===1;
}
function item(row){return {id:row.id,title:row.title,topic:row.topic,status:row.status,
 body:row.body,createdAt:row.created_at,publishedAt:row.published_at,revision:row.revision};}
export async function communityPostRoutes(req,db,member,limiter,now){
 const url=new URL(req.url),path=url.pathname;
 if(!path.startsWith(ROOT))return respond(req,{error:"Not found"},404);
 if(!member)return respond(req,{error:"Sign-in required"},401);
 if(!member.handle)return respond(req,{error:"Complete your creator profile first"},409);
 if(!await active(db,member.id))return respond(req,{error:"Creator profile unavailable"},403);
 try{
   if(path===ROOT+"/mine"&&["GET","HEAD"].includes(req.method)){
     const list=await rows(db,"SELECT id,title,body,topic,status,revision,created_at,published_at FROM community_posts WHERE author_member_id=? ORDER BY created_at DESC,id DESC LIMIT 30",[member.id]);
     return respond(req,{items:list.map(item)});
   }
   if(path===ROOT&&req.method==="POST"){
     if(!await limiter(db,"community-post:"+member.id,now,4,3600))return respond(req,{error:"Discussion submission limit reached"},429);
     const count=await rows(db,"SELECT COUNT(*) AS n FROM community_posts WHERE author_member_id=? AND status='pending_review'",[member.id]);
     if(Number(count[0]?.n||0)>=3)return respond(req,{error:"Wait for your current discussions to be reviewed"},429);
     let data;
     try{
       const p=await payload(req);
       if(Object.keys(p).some(key=>!["title","body","topic"].includes(key)))throw Error("Unexpected field");
       data={title:text(p.title,8,120,"title"),body:text(p.body,20,5000,"body"),topic:p.topic};
       if(!TOPICS.has(data.topic))throw Error("Invalid topic");
     }catch(e){return respond(req,{error:e.message||"Invalid post"},400);}
     const id=crypto.randomUUID().replaceAll("-","");
     const r=await run(db,"INSERT INTO community_posts(id,author_member_id,title,body,topic,status,revision,created_at,updated_at) SELECT ?,?,?,?,?,'pending_review',1,?,? WHERE EXISTS(SELECT 1 FROM creator_profiles WHERE member_id=? AND status='active')",[id,member.id,data.title,data.body,data.topic,now,now,member.id]);
     if(Number(r.meta?.changes??r.meta?.rows_written)!==1)return respond(req,{error:"Creator not available"},403);
     return respond(req,{id,status:"pending_review",revision:1,notice:"Your discussion was submitted privately for staff review. It is not public."},201);
   }
   const reaction=/^\/api\/v1\/member\/community\/posts\/([a-f0-9]{32})\/react$/.exec(path);
   if(reaction&&["GET","HEAD"].includes(req.method)){
     const id=reaction[1];
     const publicRows=await rows(db,"SELECT p.id FROM community_posts p JOIN creator_profiles c ON c.member_id=p.author_member_id JOIN member_accounts a ON a.id=p.author_member_id WHERE p.id=? AND p.status='published' AND c.status='active' AND a.status='active' AND julianday(p.published_at)<=julianday('now')",[id]);
     if(!publicRows.length)return respond(req,{error:"Discussion unavailable"},404);
     const own=await rows(db,"SELECT score,revision FROM community_post_votes WHERE post_id=? AND member_id=?",[id,member.id]);
     return respond(req,{myReaction:own.length?{score:Number(own[0].score),revision:Number(own[0].revision)}:null});
   }
   if(reaction&&["GET","HEAD"].includes(req.method)){
     const id=reaction[1];
     const found=await rows(db,"SELECT p.id FROM community_posts p JOIN creator_profiles c ON c.member_id=p.author_member_id JOIN member_accounts a ON a.id=p.author_member_id WHERE p.id=? AND p.status='published' AND c.status='active' AND a.status='active' AND julianday(p.published_at)<=julianday('now')",[id]);
     if(!found.length)return respond(req,{error:"Discussion unavailable"},404);
     const mine=await rows(db,"SELECT score,revision FROM community_post_votes WHERE member_id=? AND post_id=?",[member.id,id]);
     return respond(req,{myReaction:mine[0]||null});
   }
   if(reaction&&req.method==="POST"){
     const id=reaction[1];
     const found=await rows(db,"SELECT p.id,p.author_member_id FROM community_posts p JOIN creator_profiles c ON c.member_id=p.author_member_id JOIN member_accounts a ON a.id=p.author_member_id WHERE p.id=? AND p.status='published' AND c.status='active' AND a.status='active' AND julianday(p.published_at)<=julianday('now')",[id]);
     if(!found.length)return respond(req,{error:"Discussion unavailable"},404);
     if(found[0].author_member_id===member.id)return respond(req,{error:"You cannot react to your own post"},403);
     let data;
     try{
       data=await payload(req,400);
       if(Object.keys(data).some(key=>!["score","revision"].includes(key))||![0,1].includes(data.score)||
         !Number.isSafeInteger(data.revision)||data.revision<0||data.revision>2147483647)throw Error("Invalid reaction");
     }catch{return respond(req,{error:"Invalid reaction"},400);}
     if(!await limiter(db,"community-react:"+member.id,now,40,3600))return respond(req,{error:"Reaction rate limit reached"},429);
     const old=await rows(db,"SELECT score,revision FROM community_post_votes WHERE member_id=? AND post_id=?",[member.id,id]);
     const previous=old[0]||null;
     if((previous?.revision||0)!==data.revision)return respond(req,{error:"Reaction changed; refresh first"},409);
     if(previous?.score===data.score)return respond(req,{score:previous.score,revision:previous.revision,changed:false});
     let result;
     if(previous){
       result=await run(db,"UPDATE community_post_votes SET score=?,revision=revision+1,updated_at=? WHERE post_id=? AND member_id=? AND revision=? AND EXISTS(SELECT 1 FROM community_posts WHERE id=? AND status='published')",
         [data.score,now,id,member.id,previous.revision,id]);
     }else{
       result=await run(db,"INSERT INTO community_post_votes(member_id,post_id,score,revision,created_at,updated_at) SELECT ?,?,?,1,?,? WHERE EXISTS(SELECT 1 FROM community_posts WHERE id=? AND status='published') ON CONFLICT(member_id,post_id) DO NOTHING",
         [member.id,id,data.score,now,now,id]);
     }
     if(Number(result.meta?.changes??result.meta?.rows_written)!==1)return respond(req,{error:"Reaction changed; refresh first"},409);
     return respond(req,{score:data.score,revision:data.revision+1,changed:true});
   }
   return respond(req,{error:"Not found"},404);
 }catch{return respond(req,{error:"Discussion service unavailable"},503);}
}
