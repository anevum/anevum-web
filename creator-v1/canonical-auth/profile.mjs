import {canonicalConfigState,permitCanonicalUserCreation} from "./policy.mjs";
// ANEVUM Phase 1 / canonical Better Auth creator identity.
// Does NOT read legacy Creator V1 OTP tables or broker/owner entitlements.
const STAGING_ORIGIN="https://a.anevum.com";
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
const RESERVED=new Set(["anevum","admin","root","staff","moderator","mod","official","support",
  "help","account","owner","api","auth","join","signin","sign-in","security","system",
  "delete","null","undefined","create","settings","lab","rhen","studio","command"]);
const CONTROLS=/[\u0000-\u001f\u007f]/;
const HEADERS={"cache-control":"private, no-store","content-type":"application/json; charset=utf-8",
  "x-content-type-options":"nosniff","x-robots-tag":"noindex, nofollow, noarchive",
  "referrer-policy":"no-referrer"};
const answer=(req,payload,status=200)=>new Response(req.method==="HEAD"?null:JSON.stringify(payload),
 {status,headers:HEADERS});
export function canonicalBetaConfigured(env,origin){
 return origin===STAGING_ORIGIN && canonicalConfigState(env).operational;
}
export function invitedCanonicalEmail(env,email){
 return permitCanonicalUserCreation(env,email);
}
// Better Auth user.create.before rejects all uninvited NEW OAuth identities.
export async function verifyInvitedCanonicalCreation(env,newUser){
 return invitedCanonicalEmail(env,newUser?.email)?{data:newUser}:false;
}
export async function canonicalCreatorSchemaReady(db){
 if(!db||typeof db.prepare!=="function")return false;
 try{
  const result=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user','member_creator_profiles','member_creator_edit_limits')").all();
  const names=new Set((result?.results||[]).map(x=>x.name));
  return ["user","member_creator_profiles","member_creator_edit_limits"].every(x=>names.has(x));
 }catch{return false}
}
function safeHandle(raw){
 if(typeof raw!=="string"||!HANDLE.test(raw)||RESERVED.has(raw))return null;
 return raw;
}
function normalizeCopy(value,max,required){
 if(typeof value!=="string"||value.length>max||CONTROLS.test(value))return null;
 const copy=value.trim().normalize("NFC");
 if(copy.length>max||(required&&!copy))return null;
 return copy;
}
function properMember(user){return user&&typeof user.id==="string"&&user.id.length>0&&
  user.id.length<=128&&typeof user.email==="string"&&user.emailVerified===true;}
async function changedRows(db,sql,values){
 const result=await db.prepare(sql).bind(...values).all();
 if(result?.success===false||!Array.isArray(result.results))throw Error("D1 write unavailable");
 return result.results;
}
async function ownProfile(db,id){
 return await db.prepare("SELECT handle,display_name,bio,visibility,revision,created_at,updated_at FROM member_creator_profiles WHERE user_id=?").bind(id).first();
}
const privateProfile=row=>row?({handle:row.handle,displayName:row.display_name,bio:row.bio,
  visibility:row.visibility,revision:Number(row.revision),createdAt:Number(row.created_at),
  updatedAt:Number(row.updated_at)}):null;
async function boundedMutation(db,userId,now){
 const start=now-3600;
 const rows=await changedRows(db,
  "INSERT INTO member_creator_edit_limits(user_id,window_start,requests) VALUES(?,?,1) "+
  "ON CONFLICT(user_id) DO UPDATE SET "+
  "window_start=CASE WHEN member_creator_edit_limits.window_start<? THEN excluded.window_start ELSE member_creator_edit_limits.window_start END, "+
  "requests=CASE WHEN member_creator_edit_limits.window_start<? THEN 1 ELSE member_creator_edit_limits.requests+1 END "+
  "WHERE member_creator_edit_limits.window_start<? OR member_creator_edit_limits.requests<20 "+
  "RETURNING requests",[userId,now,start,start,start]);
 return rows.length===1;
}
async function bodyJSON(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get("content-type")||""))
   throw Error("Expected JSON");
 if(Number(req.headers.get("content-length")||0)>1900)throw Error("Too large");
 const raw=await req.text();
 if(raw.length>1900)throw Error("Too large");
 const obj=JSON.parse(raw);
 if(!obj||typeof obj!=="object"||Array.isArray(obj))throw Error("Invalid profile");
 return obj;
}
function hasOnly(obj,keys){return Object.keys(obj).sort().join(",")===keys.slice().sort().join(",")}
function failure(req,status,message){return answer(req,{error:message},status)}
// A public profile is NOT the member's private Better Auth user or RHEN terminal.
export async function canonicalPublicCreator(req,env,origin,handle){
 if(!["GET","HEAD"].includes(req.method))return failure(req,405,"Method not allowed");
 if(!canonicalBetaConfigured(env,origin))return failure(req,404,"Not found");
 const normalized=safeHandle(handle);
 if(!normalized||new URL(req.url).search)return failure(req,404,"Not found");
 if(!await canonicalCreatorSchemaReady(env.MEMBER_DB))
   return failure(req,503,"Creator profiles unavailable");
 try{
  const row=await env.MEMBER_DB.prepare(
    "SELECT p.handle,p.display_name,p.bio,p.created_at "+
    "FROM member_creator_profiles p JOIN \"user\" u ON u.id=p.user_id "+
    "WHERE p.handle=? AND p.visibility='public' AND u.emailVerified=1 LIMIT 1"
  ).bind(normalized).first();
  if(!row)return failure(req,404,"Profile not public");
  return answer(req,{profile:{handle:row.handle,displayName:row.display_name,
    bio:row.bio,joinedAt:Number(row.created_at)}});
 }catch{return failure(req,503,"Creator profiles unavailable")}
}
export async function canonicalCreatorMember(req,env,user,origin,now=Math.floor(Date.now()/1000)){
 if(!canonicalBetaConfigured(env,origin))return failure(req,503,"Creator beta not available");
 if(!properMember(user))return failure(req,403,"Verified member email required");
 if(!await canonicalCreatorSchemaReady(env.MEMBER_DB))
   return failure(req,503,"Creator profile migration not installed");
 if(new URL(req.url).search)return failure(req,400,"Query not supported");
 const db=env.MEMBER_DB;
 if(!["GET","POST","PATCH"].includes(req.method))return failure(req,405,"Method not allowed");
 try{
  if(req.method==="GET")
   return answer(req,{memberId:user.id,profile:privateProfile(await ownProfile(db,user.id))});
  // Authenticated cookie/session and strict Origin are checked upstream.
  // No client-provided member ID, account linking, XP or role assignment.
  let payload;
  try{payload=await bodyJSON(req)}catch{return failure(req,400,"Invalid profile data")}
  if(req.method==="POST"){
   if(!hasOnly(payload,["handle","displayName","bio"]))return failure(req,400,"Invalid profile fields");
   const handle=safeHandle(payload.handle),name=normalizeCopy(payload.displayName,80,true),
     bio=normalizeCopy(payload.bio,1200,false);
   if(!handle||name===null||bio===null)return failure(req,400,"Invalid handle or profile text");
   if(!await boundedMutation(db,user.id,now))return failure(req,429,"Profile edit limit reached");
   // One immutable handle per canonical user. Unique constraint is race-safe.
   const rows=await changedRows(db,
      "INSERT INTO member_creator_profiles "+
      "(user_id,handle,display_name,bio,created_at,updated_at) "+
      "VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING "+
      "RETURNING handle,display_name,bio,visibility,revision,created_at,updated_at",
      [user.id,handle,name,bio,now,now]);
   if(rows.length!==1)return failure(req,409,"A profile already exists");
   return answer(req,{memberId:user.id,profile:privateProfile(rows[0])},201);
  }
  if(!hasOnly(payload,["displayName","bio","visibility","revision"]))
   return failure(req,400,"Invalid profile fields");
  const name=normalizeCopy(payload.displayName,80,true),
    bio=normalizeCopy(payload.bio,1200,false);
  if(name===null||bio===null||!["private","public"].includes(payload.visibility)||
     !Number.isSafeInteger(payload.revision)||payload.revision<1||payload.revision>2147483646)
    return failure(req,400,"Invalid profile data");
  if(!await boundedMutation(db,user.id,now))return failure(req,429,"Profile edit limit reached");
  const rows=await changedRows(db,
      "UPDATE member_creator_profiles "+
      "SET display_name=?,bio=?,visibility=?,revision=revision+1,updated_at=? "+
      "WHERE user_id=? AND revision=? AND revision<2147483647 "+
      "RETURNING handle,display_name,bio,visibility,revision,created_at,updated_at",
      [name,bio,payload.visibility,now,user.id,payload.revision]);
  if(rows.length!==1)return failure(req,409,"Profile changed; reload before saving");
  return answer(req,{memberId:user.id,profile:privateProfile(rows[0])});
 }catch(error){
  if(/UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(String(error?.message||"")))
    return failure(req,409,"That handle is unavailable");
  return failure(req,503,"Creator profile service unavailable");
 }
}
