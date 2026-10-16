// Source-only V007 pilot: canonical MEMBER_DB saves of published public projects.
// No legacy identity bridge, ratings, achievements, uploads or gameplay XP.
// Routes are disabled unless CANONICAL_PROJECT_SAVES_ENABLED === "true" AND
// an independently approved schema is present in the correct isolated D1.
// The Creator COMMUNITY_DB is queried ONLY for published visibility.
const PATH=/^\/api\/v1\/member\/project-saves\/([a-f0-9]{32})$/;
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
export async function canonicalProjectSaveReady(env){
 if(!validDatabases(env))return false;
 try{
   const [privateReady,publicReady]=await Promise.all([
     hasTables(env.MEMBER_DB,SAVES),hasTables(env.COMMUNITY_DB,PUBLIC)
   ]);
   return privateReady&&publicReady;
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
 const found=url.pathname.match(PATH);
 if(!found||url.search)return error(404,"Not found");
 if(!["GET","PUT","DELETE"].includes(request.method))return error(405,"Method not allowed");
 if(!validDatabases(env))return error(404,"Project saves not active");
 if(typeof user?.id!=="string"||!user.id||user.emailVerified!==true)
   return error(403,"Verified account required");
 if(request.body!==null || request.headers.has("content-length")&&
     Number(request.headers.get("content-length"))>0)
   return error(400,"Request must not include a body");
 if(!await canonicalProjectSaveReady(env))return error(503,"Project saves unavailable");
 const id=found[1],db=env.MEMBER_DB;
 try{
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
