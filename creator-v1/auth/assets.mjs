// ANEVUM Creator V1 — strictly private, owner-bound upload reservations and R2 quarantine.
// This is not a malware scanner, public asset host, media transcoder, or game execution service.
import {declaration,signature} from "./assets-policy.mjs";

const ROUTE=/^\/api\/v1\/member\/projects\/([a-f0-9]{32})\/assets(?:\/([a-f0-9]{32})(?:\/(file))?)?$/;
const HEADERS={
  "cache-control":"private, no-store",
  "x-content-type-options":"nosniff",
  "referrer-policy":"no-referrer",
  "x-robots-tag":"noindex, nofollow",
  "cross-origin-resource-policy":"same-origin"
};
const MiB=1048576;
const MAX_FILE_BYTES=20*MiB;
const MAX_MEMBER_BYTES=100*MiB;
const MAX_PROJECT_ASSETS=20;
const RESERVATION_TTL=24*3600;
const UPLOAD_LEASE=15*60;
const json=(value,status=200)=>new Response(JSON.stringify(value),{
  status,headers:{"content-type":"application/json; charset=utf-8",...HEADERS}
});
const fail=(message,status)=>json({error:message},status);
const statement=(db,sql,params=[])=>params.length?db.prepare(sql).bind(...params):db.prepare(sql);
async function rows(db,sql,params=[]){
  const data=await statement(db,sql,params).all();
  if(data?.success===false||!Array.isArray(data?.results))throw Error("Database unavailable");
  return data.results;
}
async function changes(db,sql,params=[]){
  const data=await statement(db,sql,params).run();
  if(data?.success===false)throw Error("Database unavailable");
  return Number(data?.meta?.changes??data?.meta?.rows_written??0);
}
async function limitedBytes(req,cap){
  const len=req.headers.get("content-length");
  if(len!==null&&(!/^\d+$/.test(len)||Number(len)>cap))throw Error("Payload too large");
  if(!req.body)throw Error("Body required");
  const reader=req.body.getReader();
  const chunks=[];let length=0;
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      length+=value.byteLength;
      if(length>cap){await reader.cancel();throw Error("Payload too large");}
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  const joined=new Uint8Array(length);let offset=0;
  for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}
  return joined;
}
async function requestJson(req){
  if(!/^application\/json(?:;|$)/i.test(req.headers.get("content-type")||""))throw Error("JSON required");
  const bytes=await limitedBytes(req,2048);
  const value=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid JSON object");
  return value;
}
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
const editable=status=>status==="draft"||status==="changes_requested";
function presentation(row){
  return {
    id:row.id,name:row.filename,kind:row.kind,contentType:row.content_type,
    sizeBytes:row.size_bytes,status:row.status,sha256:row.sha256||null
  };
}
const assetColumns="id,project_id,owner_member_id,filename,extension,kind,content_type,size_bytes,status,storage_key,sha256,lease_until";

export async function creatorAssets(req,env,member,limiter,now){
  const match=ROUTE.exec(new URL(req.url).pathname);
  if(!match)return fail("Not found",404);
  if(!member)return fail("Sign-in required",401);
  if(!member.handle)return fail("Creator profile required",409);
  if(env.CREATOR_UPLOADS_ENABLED!=="true"||!env.CREATOR_ASSETS)return fail("Private uploads unavailable",503);
  const projectId=match[1],assetId=match[2],file=match[3],db=env.COMMUNITY_DB;
  const owner=await rows(db,
    "SELECT p.status FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.id=? AND p.owner_member_id=? AND c.status='active'",
    [projectId,member.id]);
  if(owner.length!==1)return fail("Project not found",404);

  if(!assetId){
    if(req.method==="GET"||req.method==="HEAD"){
      const results=await rows(db,
        "SELECT id,filename,kind,content_type,size_bytes,status,sha256 FROM project_assets WHERE project_id=? AND owner_member_id=? ORDER BY created_at DESC,id DESC LIMIT 50",
        [projectId,member.id]);
      const r=json({assets:results.map(presentation)});
      return req.method==="HEAD"?new Response(null,{status:200,headers:r.headers}):r;
    }
    if(req.method!=="POST")return fail("Method not allowed",405);
    if(!editable(owner[0].status))return fail("Project locked for review",409);
    if(!await limiter(db,"asset:reserve:"+member.id,now,30,3600))return fail("Too many upload reservations",429);
    let input;
    try{input=declaration(await requestJson(req));}
    catch{return fail("Unsupported file, mismatched type or invalid private file size",400);}
    const id=hex(crypto.getRandomValues(new Uint8Array(16)));
    const objectKey="private-quarantine/"+member.id+"/"+projectId+"/"+id;
    // A single guarded D1 INSERT is used for quota checks to prevent concurrent
    // requests from defeating a read-then-write limit.
    const sql="INSERT INTO project_assets(id,project_id,owner_member_id,filename,extension,kind,content_type,size_bytes,status,storage_key) "+
      "SELECT ?,?,?,?,?,?,?,?,'reserved',? WHERE "+
      "(SELECT COUNT(*) FROM project_assets WHERE project_id=?)<? AND "+
      "(SELECT COALESCE(SUM(size_bytes),0) FROM project_assets WHERE owner_member_id=?)+?<=? AND "+
      "EXISTS(SELECT 1 FROM projects WHERE id=? AND owner_member_id=? AND status IN ('draft','changes_requested'))";
    const changed=await changes(db,sql,[id,projectId,member.id,input.name,input.extension,input.kind,input.mime,input.size,
      objectKey,projectId,MAX_PROJECT_ASSETS,member.id,input.size,MAX_MEMBER_BYTES,projectId,member.id]);
    return changed===1?json({id,status:"reserved"},201):fail("Private project asset or account storage limit reached",409);
  }

  const selected=(await rows(db,"SELECT "+assetColumns+" FROM project_assets WHERE id=? AND project_id=? AND owner_member_id=?",
    [assetId,projectId,member.id]))[0];
  if(!selected)return fail("Asset not found",404);

  if(file==="file"){
    if(req.method!=="GET"&&req.method!=="HEAD")return fail("Method not allowed",405);
    if(selected.status!=="quarantined")return fail("Asset is not ready for private download",409);
    let object;
    try{object=await env.CREATOR_ASSETS.get(selected.storage_key);}
    catch{return fail("Private object unavailable",503);}
    if(!object)return fail("Private object unavailable",503);
    const headers=new Headers({
      ...HEADERS,"content-type":"application/octet-stream",
      "content-disposition":"attachment; filename=\"anevum-private-asset\"",
      "content-security-policy":"sandbox; default-src 'none'",
      "content-length":String(selected.size_bytes)
    });
    return new Response(req.method==="HEAD"?null:object.body,{headers});
  }
  if(file)return fail("Not found",404);

  if(req.method==="DELETE"){
    if(!editable(owner[0].status))return fail("Project locked for review",409);
    if(selected.status==="uploading")return fail("Upload in progress; retry after recovery",409);
    if(!await limiter(db,"asset:remove:"+member.id,now,30,3600))return fail("Too many asset changes",429);
    const claimed=await changes(db,
      "UPDATE project_assets SET status='deleting',updated_at=CURRENT_TIMESTAMP WHERE id=? AND project_id=? AND owner_member_id=? "+
      "AND status IN ('reserved','quarantined','deleting') AND EXISTS(SELECT 1 FROM projects WHERE id=? AND owner_member_id=? AND status IN ('draft','changes_requested'))",
      [assetId,projectId,member.id,projectId,member.id]);
    if(claimed!==1)return fail("Asset is being processed",409);
    try{await env.CREATOR_ASSETS.delete(selected.storage_key);}
    catch{return fail("Private storage deletion unavailable; retry removal",503);}
    const deleted=await changes(db,"DELETE FROM project_assets WHERE id=? AND project_id=? AND owner_member_id=? AND status='deleting'",
      [assetId,projectId,member.id]);
    return deleted===1?json({deleted:true}):fail("Asset removal requires recovery",503);
  }

  if(req.method!=="PUT")return fail("Method not allowed",405);
  if(!editable(owner[0].status))return fail("Project locked for review",409);
  if(req.headers.get("content-type")!=="application/octet-stream")return fail("Binary upload required",415);
  if(selected.status!=="reserved")return fail("Upload reservation already used",409);
  if(!await limiter(db,"asset:upload:"+member.id,now,40,3600))return fail("Too many uploads",429);
  const leaseUntil=now+UPLOAD_LEASE;
  const claim=await changes(db,
    "UPDATE project_assets SET status='uploading',lease_until=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND project_id=? AND owner_member_id=? AND status='reserved' "+
    "AND EXISTS(SELECT 1 FROM projects WHERE id=? AND owner_member_id=? AND status IN ('draft','changes_requested'))",
    [leaseUntil,assetId,projectId,member.id,projectId,member.id]);
  if(claim!==1)return fail("Upload reservation changed",409);
  let bytes;
  try{
    bytes=await limitedBytes(req,Math.min(MAX_FILE_BYTES,selected.size_bytes));
    if(bytes.byteLength!==selected.size_bytes)throw Error("Upload size differs from reservation");
    const rule=declaration({name:selected.filename,sizeBytes:selected.size_bytes,contentType:selected.content_type});
    if(!signature(bytes,rule))throw Error("File signature does not match its type");
  }catch{
    await changes(db,"UPDATE project_assets SET status='reserved',lease_until=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND project_id=? AND status='uploading' AND lease_until=?",
      [assetId,projectId,leaseUntil]);
    return fail("Invalid file bytes, signature or size",422);
  }
  const sha256=hex(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)));
  try{
    await env.CREATOR_ASSETS.put(selected.storage_key,bytes,{
      httpMetadata:{contentType:"application/octet-stream"},
      customMetadata:{quarantine:"true",sha256,kind:selected.kind}
    });
  }catch{
    await changes(db,"UPDATE project_assets SET status='reserved',lease_until=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND project_id=? AND status='uploading' AND lease_until=?",
      [assetId,projectId,leaseUntil]);
    return fail("Private object storage unavailable",503);
  }
  const committed=await changes(db,
    "UPDATE project_assets SET status='quarantined',sha256=?,lease_until=NULL,uploaded_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP "+
    "WHERE id=? AND project_id=? AND owner_member_id=? AND status='uploading' AND lease_until=? "+
    "AND EXISTS(SELECT 1 FROM projects WHERE id=? AND owner_member_id=? AND status IN ('draft','changes_requested'))",
    [sha256,assetId,projectId,member.id,leaseUntil,projectId,member.id]);
  if(committed!==1)return fail("Private upload requires recovery",503);
  return json({id:assetId,status:"quarantined",sha256});
}

// A bounded scheduled reaper removes expired reservations and abandoned private
// upload/deletion records. Never publishes files, never uses public R2 buckets.
// Caller must invoke this on an isolated staging cron after approved migration.
export async function cleanupExpiredAssets(env,now){
  if(!env?.COMMUNITY_DB||!env?.CREATOR_ASSETS)return {cleaned:0};
  const db=env.COMMUNITY_DB;
  const expired=await rows(db,
    "SELECT id,storage_key,status FROM project_assets WHERE "+
    "(status='reserved' AND created_at < datetime(?,'unixepoch','-1 day')) OR "+
    "(status='uploading' AND lease_until IS NOT NULL AND lease_until < ?) OR "+
    "(status='deleting' AND updated_at < datetime(?,'unixepoch','-15 minutes')) "+
    "ORDER BY created_at ASC LIMIT 25",[now,now,now]);
  let cleaned=0;
  for(const asset of expired){
    try{
      let condition="";
      if(asset.status==="reserved")condition=" AND created_at < datetime(?,'unixepoch','-1 day')";
      else if(asset.status==="uploading")condition=" AND lease_until IS NOT NULL AND lease_until < ?";
      else condition=" AND updated_at < datetime(?,'unixepoch','-15 minutes')";
      const claimed=await changes(db,"UPDATE project_assets SET status='deleting',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status=?"+condition,
        [asset.id,asset.status,now]);
      if(claimed!==1)continue;
      await env.CREATOR_ASSETS.delete(asset.storage_key);
      const n=await changes(db,"DELETE FROM project_assets WHERE id=? AND status='deleting'",[asset.id]);
      cleaned+=n;
    }catch{ /* Keep the private object/record for retry on the next scheduled sweep. */ }
  }
  return {cleaned};
}
