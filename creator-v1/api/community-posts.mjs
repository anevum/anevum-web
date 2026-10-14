// ANEVUM staging/public read-only discussions. Never return unreviewed posts.
const BASE={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
const POSTS="/api/v1/community/posts";
const FROM="FROM community_posts p JOIN creator_profiles c ON c.member_id=p.author_member_id JOIN member_accounts a ON a.id=p.author_member_id WHERE p.status='published' AND c.status='active' AND a.status='active' AND julianday(p.published_at)<=julianday('now')";
const FIELDS="p.id,p.title,p.topic,p.published_at AS publishedAt,c.handle AS authorHandle,c.display_name AS authorName,"+
 "COALESCE((SELECT SUM(v.score) FROM community_post_votes v WHERE v.post_id=p.id),0) AS score,"+
 "(SELECT COUNT(*) FROM community_post_replies r WHERE r.post_id=p.id AND r.status='published' AND julianday(r.published_at)<=julianday('now')) AS replyCount";
const answer=(req,data,status=200)=>new Response(req.method==="HEAD"?null:JSON.stringify(data),{status,headers:BASE});
function stmt(db,sql,args=[]){const prepared=db.prepare(sql);return args.length?prepared.bind(...args):prepared;}
async function rows(db,sql,args=[]){const value=await stmt(db,sql,args).all();if(value.success===false||!Array.isArray(value.results))throw Error("Storage unavailable");return value.results;}
function dto(row){
 return {id:row.id,title:row.title,excerpt:(row.body||"").slice(0,230),topic:row.topic,
  authorHandle:row.authorHandle,authorName:row.authorName,publishedAt:row.publishedAt,
  score:Number(row.score||0),replyCount:Number(row.replyCount||0)};
}
function parameters(url,detail){
 if(detail){if(url.search)return null;return {detail:true};}
 const allowed=new Set(["limit","sort"]);
 for(const key of url.searchParams.keys())
   if(!allowed.has(key)||url.searchParams.getAll(key).length!==1)return null;
 const sort=url.searchParams.get("sort")||"hot";
 const limitText=url.searchParams.get("limit")||"6";
 if(!["hot","new"].includes(sort)||!/^[1-9]\d?$/.test(limitText)||Number(limitText)>24)return null;
 return {sort,limit:Number(limitText)};
}
export async function publicCommunityPosts(req,db){
 const url=new URL(req.url),path=url.pathname,detail=/^\/api\/v1\/community\/posts\/([a-f0-9]{32})$/.exec(path);
 if(path!==POSTS&&!detail)return answer(req,{error:"Not found"},404);
 if(req.method!=="GET"&&req.method!=="HEAD")return answer(req,{error:"Read-only"},405);
 const params=parameters(url,detail);
 if(!params)return answer(req,{error:"Invalid community post query"},400);
 if(!db)return answer(req,{error:"Public post data unavailable"},503);
 try{
   if(detail){
     const found=await rows(db,"SELECT "+FIELDS+",p.body "+FROM+" AND p.id=? LIMIT 1",[detail[1]]);
     if(!found.length)return answer(req,{error:"Post not found"},404);
     const replies=await rows(db,"SELECT r.id,r.body,r.published_at AS publishedAt,c.handle AS authorHandle,c.display_name AS authorName "+
       "FROM community_post_replies r JOIN creator_profiles c ON c.member_id=r.author_member_id "+
       "JOIN member_accounts a ON a.id=r.author_member_id "+
       "WHERE r.post_id=? AND r.status='published' AND c.status='active' AND a.status='active' "+
       "AND julianday(r.published_at)<=julianday('now') ORDER BY r.published_at ASC,r.id ASC LIMIT 50",[detail[1]]);
     const {excerpt,...info}=dto(found[0]);
     return answer(req,{post:{...info,body:found[0].body},replies});
   }
   const order=params.sort==="new"?
     "p.published_at DESC,p.id DESC":
     "(COALESCE((SELECT SUM(v.score) FROM community_post_votes v WHERE v.post_id=p.id),0)*2+"+
     "(SELECT COUNT(*) FROM community_post_replies r WHERE r.post_id=p.id AND r.status='published'))*3 DESC,p.published_at DESC,p.id DESC";
   const found=await rows(db,"SELECT "+FIELDS+",p.body "+FROM+" ORDER BY "+order+" LIMIT ?",[params.limit]);
   return answer(req,{items:found.map(dto),count:found.length,nextCursor:null,sort:params.sort});
 }catch{return answer(req,{error:"Community post service unavailable"},503);}
}
