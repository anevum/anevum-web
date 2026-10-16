// Source-only V007 pilot: canonical MEMBER_DB saves of published public projects.
// No legacy identity bridge, ratings, achievements, uploads or gameplay XP.
// Routes are disabled unless CANONICAL_PROJECT_SAVES_ENABLED === "true" AND
// an independently approved schema is present in the correct isolated D1.
// The Creator COMMUNITY_DB is queried ONLY for published visibility.
const PATH=/^\/api\/v1\/member\/project-saves\/([a-f0-9]{32})$/;
const LIST_PATH="/api/v1/member/project-saves";
const DEFAULT_PAGE=12,MAX_PAGE=24;
const SAFE_PUBLIC_PROJECTS="SELECT p.id,p.title,p.summary,p.category,p.published_at AS publishedAt,"+
 "c.handle AS creatorHandle,c.display_name AS creatorName "+
 "FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id "+
 "WHERE p.status='published' AND c.status='active' "+
 "AND julianday(p.published_at)<=julianday('now') AND p.id IN (";
const PUBLIC_VISIBLE="SELECT p.id FROM projects p JOIN creator_profiles c "+
 "ON c.member_id=p.owner_member_id WHERE p.id=? AND p.status='published' "+
 "AND c.status='active' AND julianday(p.published_at)<=julianday('now') LIMIT 1";
const HEADERS={
 "cache-control":"private, no-store",
 "content-type":"application/json; charset=utf-8",
 "x-content-type-options":"nosniff",
 "cross-origin-resource-policy":"same-origin",
 "referrer-policy":"no-referrer",
 "x-robots-tag":"noindex, nofollow, noarchive"
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const error=(status,message)=>json({error:message},status);
const SAVES=["member_project_saves","member_project_save_rate_limits"];
const PUBLIC=["projects","creator_profiles"];
// Readiness must verify usable *column contracts*, not only table names.
// LIMIT 0 compiles without fetching private records or public project data.
const PRIVATE_SCHEMA_CHECK='SELECT s.member_user_id,s.public_project_id,s.saved_at,'+
 'r.member_user_id AS rate_member,r.window_start,r.requests,u.id AS owner_id '+
 'FROM member_project_saves s JOIN "user" u ON u.id=s.member_user_id '+
 'LEFT JOIN member_project_save_rate_limits r ON r.member_user_id=s.member_user_id LIMIT 0';
const PUBLIC_SCHEMA_CHECK='SELECT p.id,p.slug,p.title,p.summary,p.category,'+
 'p.source_url,p.demo_url,p.free_to_use,p.license_name,p.published_at,'+
 'p.owner_member_id,p.status,c.member_id,c.handle,c.display_name,c.status '+
 "FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id "+
 "WHERE p.status='published' AND c.status='active' "+
 "AND julianday(p.published_at)<=julianday('now') LIMIT 0";

function validDatabases(env){
 return env?.CANONICAL_PROJECT_SAVES_ENABLED==="true"&&
   env.MEMBER_DB&&env.COMMUNITY_DB&&env.MEMBER_DB!==env.COMMUNITY_DB&&
   typeof env.MEMBER_DB.prepare==="function"&&
   typeof env.COMMUNITY_DB.prepare==="function";
}
async function hasTables(db,tables){
 const result=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ("+
   tables.map(()=>"?").join(",")+")").bind(...tables).all();
 return result?.success!==false && Array.isArray(result?.results) &&
   tables.every(name=>result.results.some(row=>row.name===name));
}
async function canCompile(db,sql){
 const result=await db.prepare(sql).all();
 return result?.success!==false&&Array.isArray(result?.results);
}
export async function canonicalProjectSaveReady(env){
 if(!validDatabases(env))return false;
 try{
   const [privateReady,publicReady]=await Promise.all([
     hasTables(env.MEMBER_DB,SAVES),hasTables(env.COMMUNITY_DB,PUBLIC)
   ]);
   if(!privateReady||!publicReady)return false;
   const [privateColumns,publicColumns]=await Promise.all([
     canCompile(env.MEMBER_DB,PRIVATE_SCHEMA_CHECK),
     canCompile(env.COMMUNITY_DB,PUBLIC_SCHEMA_CHECK)
   ]);
   return privateColumns&&publicColumns;
 }catch{return false}
}
async function first(db,sql,...params){return db.prepare(sql).bind(...params).first()}
async function published(env,id){
 const match=await first(env.COMMUNITY_DB,PUBLIC_VISIBLE,id);
 return Boolean(match?.id===id);
}
async function saved(db,userId,id){
 return Boolean(await first(db,
  "SELECT 1 AS present FROM member_project_saves "+
  "WHERE member_user_id=? AND public_project_id=? LIMIT 1",userId,id));
}

/** The cursor includes no account identifier, and cannot select another
 * member's records. The SQL always applies the server-verified user ID.
 * Strict URL-safe encoding and bounded parsing reject noncanonical forms.
 */
export function parseProjectSaveCursor(value){
 if(value===null)return null;
 if(typeof value!=="string"||value.length<8||value.length>160||
   !/^[A-Za-z0-9_-]+$/.test(value))return false;
 try{
   const text=atob(value.replace(/-/g,"+").replace(/_/g,"/"));
   const tuple=JSON.parse(text);
   if(!Array.isArray(tuple)||tuple.length!==2||
      !Number.isSafeInteger(tuple[0])||tuple[0]<=0||
      typeof tuple[1]!=="string"||!/^[a-f0-9]{32}$/.test(tuple[1]))return false;
   return tuple;
 }catch{return false}
}
const encodeCursor=(timestamp,id)=>
 btoa(JSON.stringify([timestamp,id])).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

async function privateList(request,env,user){
 const url=new URL(request.url);
 if(request.method!=="GET")return error(405,"Method not allowed");
 const keys=[...url.searchParams.keys()];
 if(keys.some(k=>!["after","limit"].includes(k)||
      url.searchParams.getAll(k).length!==1))return error(400,"Invalid library filters");
 const limitParam=url.searchParams.get("limit");
 if(limitParam!==null&&(!/^(?:[1-9]|1[0-9]|2[0-4])$/.test(limitParam)||
   Number(limitParam)>MAX_PAGE))return error(400,"Invalid library filters");
 const limit=limitParam===null?DEFAULT_PAGE:Number(limitParam);
 const after=parseProjectSaveCursor(url.searchParams.get("after"));
 if(after===false)return error(400,"Invalid library cursor");
 const binds=[user.id],where=["member_user_id=?"];
 if(after){
   where.push("(saved_at<? OR (saved_at=? AND public_project_id<?))");
   binds.push(after[0],after[0],after[1]);
 }
 const result=await env.MEMBER_DB.prepare(
  "SELECT public_project_id,saved_at FROM member_project_saves "+
  "WHERE "+where.join(" AND ")+" ORDER BY saved_at DESC,public_project_id DESC LIMIT ?"
 ).bind(...binds,limit+1).all();
 if(result?.success===false||!Array.isArray(result?.results))
   throw Error("Private collection unavailable");
 const rows=result.results.slice(0,limit),last=rows.at(-1);
 const ids=rows.map(row=>row.public_project_id);
 let visible=[];
 if(ids.length){
   const prepared=await env.COMMUNITY_DB.prepare(
     SAFE_PUBLIC_PROJECTS+ids.map(()=>"?").join(",")+")"
   ).bind(...ids).all();
   if(prepared?.success===false||!Array.isArray(prepared?.results))
     throw Error("Public publication verification unavailable");
   const byId=new Map(prepared.results.map(item=>[item.id,item]));
   visible=rows.flatMap(row=>{
     const item=byId.get(row.public_project_id);
     if(!item)return [];
     return [{
       id:item.id,title:item.title,summary:item.summary,category:item.category,
       creatorHandle:item.creatorHandle,creatorName:item.creatorName,
       publishedAt:item.publishedAt,savedAt:Number(row.saved_at)
     }];
   });
 }
 // Withdrawn IDs may make this page shorter or empty, but must never be
 // included in results. Cursor progresses over private saved rows.
 const nextCursor=result.results.length>limit&&last?
   encodeCursor(Number(last.saved_at),last.public_project_id):null;
 return json({items:visible,nextCursor});
}

async function allowance(db,userId,now){
 // One atomic conditional upsert prevents an unlimited number of mutations.
 // Successful idempotent requests do not consume allowance.
 const current=Math.floor(now/1000),threshold=current-3600;
 const accepted=await first(db,
   "INSERT INTO member_project_save_rate_limits(member_user_id,window_start,requests) "+
   "VALUES(?,?,1) ON CONFLICT(member_user_id) DO UPDATE SET "+
   "window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END,"+
   "requests=CASE WHEN window_start<=? THEN 1 ELSE requests+1 END "+
   "WHERE window_start<=? OR requests<60 RETURNING requests",
   userId,current,threshold,threshold,threshold);
 return Boolean(accepted);
}

/** Called exclusively after the outer canonical Worker verified Better Auth
 * and exact same-origin mutation protections. Never accept a member id from
 * request body or URL. GET/PUT first verify the approved public publication;
 * DELETE is available even after a withdrawal so the owner can clean up.
 */
export async function canonicalProjectSave(request,env,user,{now=Date.now()}={}){
 const url=new URL(request.url);
 const found=url.pathname.match(PATH),isList=url.pathname===LIST_PATH;
 if(!found&&!isList)return error(404,"Not found");
 if((isList&&request.method!=="GET")||
    (found&&!["GET","PUT","DELETE"].includes(request.method)))
   return error(405,"Method not allowed");
 if(found&&url.search)return error(404,"Not found");
 if(!validDatabases(env))return error(404,"Project saves not active");
 if(typeof user?.id!=="string"||!user.id||user.emailVerified!==true)
   return error(403,"Verified account required");
 if(request.body!==null || request.headers.has("content-length")&&
     Number(request.headers.get("content-length"))>0)
   return error(400,"Request must not include a body");
 if(!await canonicalProjectSaveReady(env))return error(503,"Project saves unavailable");
 const db=env.MEMBER_DB;
 try{
   if(isList)return await privateList(request,env,user);
   const id=found[1];
   if(request.method==="DELETE"){
     if(!await saved(db,user.id,id))return json({saved:false,changed:false});
     if(!await allowance(db,user.id,now))return error(429,"Save changes temporarily limited");
     const gone=await first(db,"DELETE FROM member_project_saves "+
       "WHERE member_user_id=? AND public_project_id=? RETURNING public_project_id",
       user.id,id);
     return json({saved:false,changed:Boolean(gone)});
   }
   if(!await published(env,id))return error(404,"Project not available");
   if(request.method==="GET")return json({available:true,saved:await saved(db,user.id,id)});
   if(await saved(db,user.id,id))return json({saved:true,changed:false});
   // A full library is not a member mutation; reject before consuming an
   // hourly allowance. The atomic INSERT below still rechecks the cap.
   const current=await first(db,
     "SELECT COUNT(*) AS total FROM member_project_saves WHERE member_user_id=?",user.id);
   if(Number(current?.total)>=200)return error(409,"Private library limit reached");
   if(!await allowance(db,user.id,now))return error(429,"Save changes temporarily limited");
   // Count and insertion are on the same authoritative MEMBER_DB statement.
   // D1 cannot transact across the two isolated databases. Withdrawal causes
   // future reads to return 404; this marker is never made public.
   const added=await first(db,"INSERT INTO member_project_saves "+
     "(member_user_id,public_project_id,saved_at) "+
     "SELECT ?,?,? WHERE (SELECT COUNT(*) FROM member_project_saves WHERE member_user_id=?)<200 "+
     "ON CONFLICT(member_user_id,public_project_id) DO NOTHING RETURNING public_project_id",
     user.id,id,Math.floor(now/1000),user.id);
   if(added)return json({saved:true,changed:true});
   if(await saved(db,user.id,id))return json({saved:true,changed:false});
   return error(409,"Private library limit reached");
 }catch{return error(503,"Project saves unavailable")}
}


/** Account export includes owned save IDs even if the rollout is disabled or
 * an underlying public project has been withdrawn. The IDs are never public.
 * A missing proposed migration omits this field, preserving old exports.
 */
export async function canonicalProjectSaveExport(memberDb,userId){
 if(!memberDb||typeof memberDb.prepare!=="function")return null;
 if(!await hasTables(memberDb,["member_project_saves"]))return null;
 const result=await memberDb.prepare(
  "SELECT public_project_id FROM member_project_saves "+
  "WHERE member_user_id=? ORDER BY saved_at DESC,public_project_id DESC LIMIT 200"
 ).bind(userId).all();
 if(result?.success===false||!Array.isArray(result?.results))
  throw Error("Private saved project export unavailable");
 return result.results.map(row=>row.public_project_id);
}
