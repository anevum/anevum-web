import {communityContextEnabled,communityPostFrom} from '../shared/community-post-context.mjs';
// STAGING: owner-only reply review, invoked exclusively after Studio signed Access verification.
// No anonymous reply publication, no public write handlers, no XP or artificial engagement.
const ROOT="/api/community-post-replies";
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff"};
const answer=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
function stmt(db,sql,args=[]){const s=db.prepare(sql);return args.length?s.bind(...args):s;}
async function rows(db,sql,args=[]){const result=await stmt(db,sql,args).all();if(result.success===false||!Array.isArray(result.results))throw Error("Storage unavailable");return result.results;}
async function reasonBody(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get("content-type")||""))throw Error("JSON required");
 if(Number(req.headers.get("content-length"))>1200)throw Error("Payload too large");
 const raw=await req.text();if(raw.length>1200)throw Error("Payload too large");
 const data=JSON.parse(raw);
 if(!data||typeof data!=="object"||Array.isArray(data)||Object.keys(data).some(key=>!["reason","revision"].includes(key)))throw Error("Invalid review");
 if(typeof data.reason!=="string"||data.reason.trim().length<12||data.reason.length>800||/[\u0000-\u001f\u007f]/.test(data.reason))throw Error("An editorial reason of 12–800 characters is required");
 if(!Number.isSafeInteger(data.revision)||data.revision<1||data.revision>2147483647)throw Error("Invalid revision");
 return {reason:data.reason.trim(),revision:data.revision};
}
export async function communityReplyModeration(req,db,actor){
 const url=new URL(req.url),path=url.pathname;
 if(path===ROOT&&req.method==="GET"){
   const query=url.searchParams;
   if([...query.keys()].some(key=>key!=="status")||query.getAll("status").length>1)return answer({error:"Invalid filter"},400);
   const status=query.get("status")||"pending_review";
   if(!["pending_review","published"].includes(status))return answer({error:"Invalid review status"},400);
   try{
     const found=await rows(db,"SELECT r.id,r.body,r.status,r.revision,r.created_at AS createdAt,p.id AS postId,p.title AS postTitle,p.status AS postStatus,c.handle AS authorHandle FROM community_post_replies r JOIN community_posts p ON p.id=r.post_id JOIN creator_profiles c ON c.member_id=r.author_member_id WHERE r.status=? ORDER BY r.created_at DESC,r.id DESC LIMIT 75",[status]);
     return answer({items:found,count:found.length,status});
   }catch{return answer({error:"Reply queue unavailable"},503);}
 }
 const match=/^\/api\/community-post-replies\/([a-f0-9]{32})\/(publish|reject|hide)$/.exec(path);
 if(!match)return answer({error:"Not found"},404);
 if(req.method!=="POST")return answer({error:"Method not allowed"},405);
 if(url.search)return answer({error:"Unexpected review query"},400);
 let data;try{data=await reasonBody(req);}catch(e){return answer({error:e.message||"Invalid review"},400);}
 const [,id,action]=match;
 const expected=action==="hide"?"published":"pending_review";
 const target=action==="publish"?"published":"hidden";
 try{
   const found=await rows(db,"SELECT r.status,r.revision,p.status AS postStatus FROM community_post_replies r JOIN community_posts p ON p.id=r.post_id WHERE r.id=?",[id]);
   if(!found.length)return answer({error:"Reply not found"},404);
   if(found[0].status!==expected||found[0].revision!==data.revision)return answer({error:"Reply changed; refresh review queue"},409);
   if(action==="publish"&&found[0].postStatus!=="published")return answer({error:"Approve the parent discussion first"},409);
   const context=await communityContextEnabled(db);
   const now=Math.floor(Date.now()/1000),eventId=crypto.randomUUID();
   const published=action==="publish"?new Date(now*1000).toISOString().replace("T"," ").replace(".000Z",""):null;
   const queries=[
     stmt(db,"UPDATE community_post_replies SET status=?,revision=revision+1,published_at=CASE WHEN ?='published' THEN ? ELSE published_at END WHERE id=? AND status=? AND revision=? AND (?!='published' OR EXISTS(SELECT p.id "+communityPostFrom(context)+" AND p.id=community_post_replies.post_id))",[target,target,published,id,expected,data.revision,target]),
     stmt(db,"INSERT INTO community_reply_review_events(id,reply_id,staff_identity,action,from_status,to_status,reason,created_at) SELECT ?,?,?,?,?,?,?,? WHERE changes()=1",[eventId,id,actor,action,expected,target,data.reason,now])
   ];
   const result=await db.batch(queries);
   if(!Array.isArray(result)||result.some(row=>row.success===false))throw Error("Review transaction unavailable");
   if(Number(result[0]?.meta?.changes??result[0]?.meta?.rows_written)!==1)return answer({error:"Reply changed; refresh review queue"},409);
   return answer({id,status:target,revision:data.revision+1});
 }catch{return answer({error:"Reply moderation temporarily unavailable"},503);}
}
