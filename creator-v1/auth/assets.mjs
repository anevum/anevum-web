import {declaration,signature} from "./assets-policy.mjs";
const root=/^\/api\/v1\/member\/projects\/([a-f0-9]{32})\/assets(?:\/([a-f0-9]{32}))?$/;
const json=(body,status=200)=>Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
const fail=(message,status)=>json({error:message},status);
const q=(db,sql,...args)=>db.prepare(sql).bind(...args);
const get=async(db,sql,...args)=>(await q(db,sql,...args).all()).results;
async function read(req,cap){
 const length=Number(req.headers.get("content-length"));if(length>cap)throw Error("Oversized payload");
 const buffer=await req.arrayBuffer();if(buffer.byteLength>cap)throw Error("Oversized payload");
 return new Uint8Array(buffer);
}
export async function creatorAssets(req,env,member,limit,now){
 const m=root.exec(new URL(req.url).pathname);if(!m)return fail("Not found",404);
 if(!member)return fail("Sign-in required",401);
 if(!member.handle)return fail("Creator profile required",409);
 if(env.CREATOR_UPLOADS_ENABLED!=="true"||!env.CREATOR_ASSETS)return fail("Uploads are not enabled",503);
 const db=env.COMMUNITY_DB,projectId=m[1],assetId=m[2];
 const owner=await get(db,"SELECT p.status FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.id=? AND p.owner_member_id=? AND c.status='active'",projectId,member.id);
 if(!owner.length)return fail("Project not found",404);
 const editable=["draft","changes_requested"].includes(owner[0].status);
 if(!assetId&&["GET","HEAD"].includes(req.method)){
  const assets=await get(db,"SELECT id,filename AS name,kind,content_type AS contentType,size_bytes AS sizeBytes,status,sha256 FROM project_assets WHERE project_id=? AND owner_member_id=? ORDER BY created_at DESC LIMIT 50",projectId,member.id);
  const result=json({assets});return req.method==="HEAD"?new Response(null,{headers:result.headers}):result;
 }
 if(!editable)return fail("Project is locked for review",409);
 if(!await limit(db,"asset:"+member.id,now,50,3600))return fail("Upload rate limit",429);
 if(!assetId&&req.method==="POST"){
  if(!req.headers.get("content-type")?.startsWith("application/json"))return fail("JSON required",415);
  let data,r;try{const b=await read(req,2048);data=JSON.parse(new TextDecoder().decode(b));r=declaration(data)}catch{return fail("Invalid asset declaration",400)}
  const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,"0")).join("");
  const key="private-quarantine/"+member.id+"/"+projectId+"/"+id;
  const result=await q(db,`INSERT INTO project_assets(id,project_id,owner_member_id,filename,extension,kind,content_type,size_bytes,status,storage_key)
    SELECT ?,?,?,?,?,?,?,?,'reserved',? WHERE (SELECT COUNT(*) FROM project_assets WHERE project_id=?)<20 AND
    (SELECT COALESCE(SUM(size_bytes),0) FROM project_assets WHERE owner_member_id=?)+?<=104857600
    AND EXISTS(SELECT 1 FROM projects WHERE id=? AND owner_member_id=? AND status IN ('draft','changes_requested'))`,
    id,projectId,member.id,r.name,r.extension,r.kind,r.mime,r.size,key,projectId,member.id,r.size,projectId,member.id).run();
  return result.meta.changes===1?json({id,status:"reserved"},201):fail("Project quota reached",409);
 }
 if(!assetId||req.method!=="PUT")return fail("Not found",404);
 if(req.headers.get("content-type")!=="application/octet-stream")return fail("Binary upload required",415);
 const asset=(await get(db,"SELECT * FROM project_assets WHERE id=? AND project_id=? AND owner_member_id=?",assetId,projectId,member.id))[0];
 if(!asset)return fail("Asset not found",404);
 const locked=await q(db,"UPDATE project_assets SET status='uploading' WHERE id=? AND status='reserved'",assetId).run();
 if(locked.meta.changes!==1)return fail("Upload already used",409);
 try {
  const bytes=await read(req,asset.size_bytes);
  if(bytes.length!==asset.size_bytes)throw Error("Size mismatch");
  const rule=declaration({name:asset.filename,sizeBytes:asset.size_bytes,contentType:asset.content_type});
  if(!signature(bytes,rule))throw Error("Signature mismatch");
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),x=>x.toString(16).padStart(2,"0")).join("");
  await env.CREATOR_ASSETS.put(asset.storage_key,bytes,{httpMetadata:{contentType:"application/octet-stream"},customMetadata:{quarantine:"true",sha256:hash}});
  await q(db,"UPDATE project_assets SET status='quarantined',sha256=?,uploaded_at=CURRENT_TIMESTAMP WHERE id=? AND status='uploading'",hash,assetId).run();
  return json({id:assetId,status:"quarantined",sha256:hash});
 }catch{
  // Object remains private; incomplete uploads require explicit operator recovery.
  return fail("Upload rejected or storage unavailable",422);
 }
}