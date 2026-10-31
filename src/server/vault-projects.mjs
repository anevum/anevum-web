// ANEVUM Creator Vault: private project metadata foundation.
// Does not upload/download files, create payment orders or issue capacity.
// Feature absent in production; available only for a separately configured,
// independently verified member preview with additive schema.
const FREE_BYTES = 2 * 1024 ** 3;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function response(data,status=200) {
  return Response.json(data,{status,headers:{
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow, noarchive"
  }});
}
export function validateVaultProjectName(name) {
  if(typeof name!=="string" || name!==name.trim() ||
     name.length<1 || name.length>100 || /[\x00-\x1f\x7f]/.test(name)) {
    throw new Error("Invalid project name");
  }
  return name;
}
export function vaultProjectsEnabled(env) {
  return env?.ANEVUM_VAULT_PROJECTS_PREVIEW_ENABLED==="true" &&
    !!env?.MEMBER_DB && typeof env.MEMBER_DB.prepare==="function";
}
export async function vaultProjectSchemaReady(db) {
  try {
    const result=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('vault_projects','vault_usage','vault_files')").all();
    const names=new Set((result?.results||[]).map(row=>row.name));
    return ["vault_projects","vault_usage","vault_files"].every(name=>names.has(name));
  } catch { return false; }
}
// Bound request bodies by actual streamed bytes, not just a spoofable Content-Length.
export async function readTinyProjectJson(request) {
  const declared=Number(request.headers.get("content-length"));
  if(Number.isFinite(declared)&&declared>256) throw new RangeError("Body too large");
  if(!request.body) throw new TypeError("JSON object required");
  const reader=request.body.getReader();
  const pieces=[];let bytes=0;
  try {
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      if(!(value instanceof Uint8Array))throw new TypeError("Invalid stream");
      bytes+=value.byteLength;
      if(bytes>256)throw new RangeError("Body too large");
      pieces.push(value);
    }
  } finally { try{await reader.cancel();}catch{} }
  if(bytes===0)throw new TypeError("JSON object required");
  const buffer=new Uint8Array(bytes);
  let offset=0;for(const value of pieces){buffer.set(value,offset);offset+=value.byteLength;}
  const obj=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buffer));
  if(!obj||typeof obj!=="object"||Array.isArray(obj)||
    Object.keys(obj).length!==1||!Object.hasOwn(obj,"name"))
    throw new TypeError("Only a project name is permitted");
  return {name:validateVaultProjectName(obj.name)};
}

export async function vaultProjectEndpoint(request,env,user,pathname) {
  if(typeof user?.id!=="string"||!user.id) return response({message:"Sign in required"},401);
  // No anonymous availability or custom account-selection query is possible.
  if(new URL(request.url).search) return response({message:"Account or project query selection is forbidden"},400);
  if(!vaultProjectsEnabled(env)) return response({message:"Private Vault is not available"},503);
  const db=env.MEMBER_DB;
  if(!await vaultProjectSchemaReady(db)) return response({message:"Private Vault schema is not ready"},503);
  if(pathname==="/api/member/vault/projects"&&request.method==="GET") {
    try {
      const rows=await db.prepare("SELECT id,name,created_at_ms FROM vault_projects WHERE user_id=? ORDER BY created_at_ms DESC LIMIT 100").bind(user.id).all();
      return response({available:true,filesEnabled:false,projects:rows?.results||[]});
    }catch{return response({message:"Vault projects unavailable"},503);}
  }
  if(pathname==="/api/member/vault/quota"&&request.method==="GET") {
    try{
      const usage=await db.prepare("SELECT included_bytes,used_bytes,reserved_bytes FROM vault_usage WHERE user_id=?").bind(user.id).first();
      return response({available:true,paymentAcceptance:false,uploadsEnabled:false,
        includedBytes:usage?.included_bytes??FREE_BYTES,
        usedBytes:usage?.used_bytes??0,
        reservedBytes:usage?.reserved_bytes??0,
        additionalPaidBytes:0});
    }catch{return response({message:"Vault quota unavailable"},503);}
  }
  if(pathname==="/api/member/vault/projects"&&request.method==="POST") {
    if(request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase()!=="application/json")
      return response({message:"JSON required"},415);
    let parsed;
    try { parsed=await readTinyProjectJson(request); }
    catch(error) {
      return response({message:"Invalid project name or JSON body"},
        error instanceof RangeError ? 413 : 400);
    }
    const {name}=parsed;
    try {
      const id=crypto.randomUUID(),now=Date.now();
      // D1.batch executes a single transactional batch.
      await db.batch([
        db.prepare("INSERT OR IGNORE INTO vault_usage(user_id,updated_at_ms) VALUES (?,?)").bind(user.id,now),
        db.prepare("INSERT INTO vault_projects(id,user_id,name,created_at_ms) VALUES (?,?,?,?)").bind(id,user.id,name,now)
      ]);
      return response({project:{id,name,createdAtMs:now},filesEnabled:false},201);
    }catch{return response({message:"Private project storage unavailable"},503);}
  }
  const match=pathname.match(/^\/api\/member\/vault\/projects\/([0-9a-f-]{36})\/files$/i);
  if(match&&request.method==="GET"&&UUID.test(match[1])){
    try{
      const project=await db.prepare("SELECT id,name FROM vault_projects WHERE id=? AND user_id=?").bind(match[1],user.id).first();
      if(!project) return response({message:"Project not found"},404);
      const files=await db.prepare("SELECT id,filename,content_type,size_bytes,created_at_ms FROM vault_files WHERE project_id=? AND user_id=? AND state='active' ORDER BY created_at_ms DESC LIMIT 200").bind(match[1],user.id).all();
      return response({project,files:files?.results||[],downloadsEnabled:false});
    }catch{return response({message:"Private project files unavailable"},503);}
  }
  return response({message:"File uploads, payments and other Vault actions are not enabled"},503);
}
