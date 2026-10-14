// Owner/Access-gated staging moderation for real community discussions.
// Only the already authenticated Studio Worker may call this module.
const ROOT="/api/community-posts";
const HEADER={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff"};
const answer=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADER});
const stmt=(db,sql,args=[])=>{const s=db.prepare(sql);return args.length?s.bind(...args):s;};
async function rows(db,sql,args=[]){const r=await stmt(db,sql,args).all();if(r.success===false||!Array.isArray(r.results))throw Error("Storage unavailable");return r.results;}
async function body(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get("content-type")||""))throw Error("JSON expected");
 if(Number(req.headers.get("content-length"))>1600)throw Error("Payload too large");
 const source=await req.text();if(source.length>1600)throw Error("Payload too large");
 const parsed=JSON.parse(source);
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)||Object.keys(parsed).some(key=>!["reason","revision"].includes(key)))throw Error("Invalid payload");
 if(typeof parsed.reason!=="string"||parsed.reason.trim().length<12||parsed.reason.length>800||/[\u0000-\u001f\u007f]/.test(parsed.reason))throw Error("An editorial reason of at least 12 characters is required");
 if(!Number.isSafeInteger(parsed.revision)||parsed.revision<1||parsed.revision>2147483647)throw Error("Invalid revision");
 return {reason:parsed.reason.trim(),revision:parsed.revision};
}
export async function communityPostModeration(req,db,actor){
 const url=new URL(req.url),path=url.pathname;
 if(path===ROOT&&req.method==="GET"){
   if(url.search&&url.search!=="?status=pending_review")return answer({error:"Invalid review filter"},400);
   try{
     const found=await rows(db,"SELECT p.id,p.title,p.body,p.topic,p.status,p.revision,p.created_at AS createdAt,c.handle AS authorHandle,c.display_name AS authorName FROM community_posts p JOIN creator_profiles c ON c.member_id=p.author_member_id JOIN member_accounts a ON a.id=p.author_member_id WHERE p.status='pending_review' AND c.status='active' AND a.status='active' ORDER BY p.created_at ASC,p.id ASC LIMIT 75");
     return answer({items:found,count:found.length});
   }catch{return answer({error:"Review queue unavailable"},503);}
 }
 const match=/^\/api\/community-posts\/([a-f0-9]{32})\/(publish|reject|hide)$/.exec(path);
 if(!match)return answer({error:"Not found"},404);
 if(req.method!=="POST")return answer({error:"Method not allowed"},405);
 let parsed;try{parsed=await body(req)}catch(e){return answer({error:e.message||"Invalid review"},400);}
 const [,id,action]=match,expected=action==="hide"?"published":"pending_review",next=action==="publish"?"published":action==="reject"?"rejected":"hidden";
 try{
   const existed=await rows(db,"SELECT status,revision FROM community_posts WHERE id=?",[id]);
   if(!existed.length)return answer({error:"Post not found"},404);
   if(existed[0].status!==expected||existed[0].revision!==parsed.revision)return answer({error:"Review status changed; reload"},409);
   const now=Math.floor(Date.now()/1000),eventId=crypto.randomUUID();
   const timestamp=action==="publish"?new Date(now*1000).toISOString().replace("T"," ").replace(".000Z","") :null;
   const ops=[
     stmt(db,"UPDATE community_posts SET status=?,revision=revision+1,updated_at=?,published_at=CASE WHEN ?='published' THEN ? ELSE published_at END WHERE id=? AND status=? AND revision=?",[next,now,next,timestamp,id,expected,parsed.revision]),
     stmt(db,"INSERT INTO community_post_review_events(id,post_id,staff_identity,action,from_status,to_status,reason,created_at) SELECT ?,?,?,?,?,?,?,? WHERE changes()=1",[eventId,id,actor,action,expected,next,parsed.reason,now])
   ];
   const result=await db.batch(ops);
   if(!Array.isArray(result)||result.some(item=>item.success===false))throw Error("Transaction unavailable");
   if(Number(result[0]?.meta?.changes??result[0]?.meta?.rows_written)!==1)return answer({error:"Review status changed; reload"},409);
   return answer({id,status:next,revision:parsed.revision+1});
 }catch{return answer({error:"Moderation unavailable"},503);}
}
