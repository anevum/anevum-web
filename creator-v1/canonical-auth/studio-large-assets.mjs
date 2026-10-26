// ANEVUM.WEB.BUILD.2026-10-26.001.CREATOR-UPLOAD-FOUNDATION
// Private, authenticated, resumable R2 transport. Never exposes R2 keys,
// upload IDs, arbitrary URLs, public downloads, executable previews, or publish rights.
// The 20 MiB legacy vault is unchanged. New data requires migration 0014.
const MiB=1048576,GiB=1073741824,PART=8*MiB,MAX_FILE=GiB;
const ACCOUNT_CAP=5*GiB,GLOBAL_CAP=25*GiB,MAX_PROJECT_FILES=40;
const HEX=/^[a-f0-9]{32}$/;
const RULES=Object.freeze({
 zip:['application/zip','package'],mp4:['video/mp4','video'],webm:['video/webm','video']
});
const HEAD={'cache-control':'private, no-store','x-content-type-options':'nosniff',
 'cross-origin-resource-policy':'same-origin','referrer-policy':'no-referrer',
 'x-robots-tag':'noindex,nofollow','content-security-policy':"sandbox; default-src 'none'"};
const json=(body,status=200)=>Response.json(body,{status,headers:HEAD});
const fail=(status,error)=>json({error},status);
const view=x=>({id:x.id,name:x.filename,kind:x.kind,contentType:x.content_type,
 sizeBytes:Number(x.size_bytes),partCount:Number(x.part_count),
 completedParts:Number(x.completed_parts||0),status:x.status,
 manifestSha256:x.manifest_sha256||null,uploadedAt:x.uploaded_at??null});
const hex=b=>Array.from(b,c=>c.toString(16).padStart(2,'0')).join('');
const cleanName=s=>typeof s==='string'&&s.length>=5&&s.length<=160&&
 !/[\\/\u0000-\u001f\u007f]/.test(s)&&!s.startsWith('.')&&!s.includes('..');
const mutable=p=>['draft','changes_requested'].includes(p.status);
const safeInt=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
async function rows(db,sql,args=[]){
 const r=await db.prepare(sql).bind(...args).all();
 if(r?.success===false||!Array.isArray(r?.results))throw Error('D1 unavailable');
 return r.results;
}
async function change(db,sql,args=[]){
 const r=await db.prepare(sql).bind(...args).run();
 if(r?.success===false)throw Error('D1 unavailable');
 return Number(r?.meta?.changes??0);
}
async function limited(req,max){
 const len=req.headers.get('content-length');
 if(len!==null&&(!/^\d+$/.test(len)||Number(len)>max))throw Error('Size invalid');
 const reader=req.body?.getReader();if(!reader)throw Error('Body absent');
 let total=0;const chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;
  total+=value.byteLength;if(total>max){await reader.cancel();throw Error('Too large');}
  chunks.push(value);
 }}finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let n=0;
 for(const c of chunks){bytes.set(c,n);n+=c.byteLength;}
 return bytes;
}
async function readJson(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))return null;
 try{const raw=await limited(req,1024);
  const v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  return v&&typeof v==='object'&&!Array.isArray(v)?v:null;
 }catch{return null;}
}
function declaration(v){
 if(!v||Object.keys(v).sort().join(',')!=='contentType,name,sizeBytes'||!cleanName(v.name))
  throw Error('Invalid declaration');
 const ext=v.name.split('.').at(-1).toLowerCase(),rule=RULES[ext];
 if(!rule||v.contentType!==rule[0]||!safeInt(v.sizeBytes,20*MiB+1,MAX_FILE))
  throw Error('Unsupported large build');
 return {filename:v.name,extension:ext,contentType:rule[0],kind:rule[1],
  sizeBytes:v.sizeBytes,partCount:Math.ceil(v.sizeBytes/PART)};
}
function magic(bytes,ext){
 if(ext==='zip')return bytes.length>=4&&bytes[0]===80&&bytes[1]===75&&
  bytes[2]===3&&bytes[3]===4;
 if(ext==='mp4')return bytes.length>=12&&String.fromCharCode(...bytes.slice(4,8))==='ftyp';
 if(ext==='webm')return bytes.length>=4&&bytes[0]===0x1a&&bytes[1]===0x45&&
  bytes[2]===0xdf&&bytes[3]===0xa3;
 return false;
}
export function studioLargeStorageReady(env){
 return Boolean(env?.MEMBER_DB?.prepare&&env?.CREATOR_ASSETS?.get&&
  env?.CREATOR_ASSETS?.delete&&env?.CREATOR_ASSETS?.createMultipartUpload&&
  env?.CREATOR_ASSETS?.resumeMultipartUpload);
}
export function studioLargeUploadReady(env,userId){
 if(env?.CANONICAL_CREATOR_STUDIO_ENABLED!=='true'||
  env?.CANONICAL_CREATOR_LARGE_UPLOADS_ENABLED!=='true'||
  !studioLargeStorageReady(env))return false;
 // Full verified-member access is a distinct, explicit review-gated rollout.
 if(env?.CANONICAL_CREATOR_LARGE_ACCESS==='verified')return true;
 const ids=String(env?.CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS||'')
  .split(',').map(x=>x.trim()).filter(Boolean);
 return ids.length>0&&(userId===undefined||ids.includes(userId));
}
export async function studioLargeSchemaReady(env){
 if(!env?.MEMBER_DB?.prepare)return false;
 try{const found=await rows(env.MEMBER_DB,
  "SELECT name FROM sqlite_master WHERE type='table' AND name IN "+
  "('member_studio_large_assets','member_studio_large_parts','member_studio_submission_large_assets')");
  return new Set(found.map(x=>x.name)).size===3;
 }catch{return false;}
}
async function usage(db,user,project){
 const u=(await rows(db,
  'SELECT (SELECT COALESCE(SUM(size_bytes),0) FROM member_studio_large_assets WHERE user_id=?) AS account_bytes,'+
  '(SELECT COALESCE(SUM(size_bytes),0) FROM member_studio_large_assets) AS global_bytes,'+
  '(SELECT COALESCE(SUM(size_bytes),0) FROM member_studio_large_assets WHERE project_id=?) AS project_bytes',
  [user,project]))[0];
 return {memberUsedBytes:Number(u?.account_bytes||0),globalUsedBytes:Number(u?.global_bytes||0),
  projectUsedBytes:Number(u?.project_bytes||0),memberCapacityBytes:ACCOUNT_CAP,
  globalCapacityBytes:GLOBAL_CAP,maxFileBytes:MAX_FILE,partSizeBytes:PART};
}
function expectedPartSize(row,n){
 const count=Number(row.part_count);
 return n<count?PART:Number(row.size_bytes)-(count-1)*PART;
}
async function erase(db,store,row){
 if(row.upload_id){
  try{await store.resumeMultipartUpload(row.storage_key,row.upload_id).abort();}
  catch{/* already completed or expired; delete any resulting object next */}
 }
 await store.delete(row.storage_key);
 await change(db,"DELETE FROM member_studio_large_assets WHERE id=? AND status='deleting'",[row.id]);
}
export async function canonicalStudioLargeAssets(req,env,user,project,
 {asset=null,action=null,part=null,now=Math.floor(Date.now()/1000),pace}={}){
 if(!await studioLargeSchemaReady(env))return fail(503,'Large-file storage schema is not ready');
 const db=env.MEMBER_DB,store=env.CREATOR_ASSETS;
 const active=studioLargeUploadReady(env,user.id),storage=studioLargeStorageReady(env);
 if(asset&&!HEX.test(asset))return fail(404,'File not found');
 try{
  if(!asset){
   if(req.method==='GET'){
    const files=await rows(db,'SELECT a.*, (SELECT COUNT(*) FROM member_studio_large_parts p WHERE p.asset_id=a.id) AS completed_parts '+
     'FROM member_studio_large_assets a WHERE a.project_id=? AND a.user_id=? ORDER BY a.created_at DESC LIMIT 60',
     [project.id,user.id]);
    return json({assets:files.map(view),...await usage(db,user.id,project.id),
     uploadsReady:active,storageReady:storage,mode:'private-quarantine'});
   }
   if(req.method!=='POST')return fail(405,'Method not allowed');
   if(!active)return fail(404,'Large uploads are not enabled');
   if(!mutable(project))return fail(409,'Project is locked for review');
   const raw=await readJson(req);let v;
   try{v=declaration(raw);}catch{return fail(422,'Use a ZIP, MP4 or WebM larger than 20 MiB, up to 1 GiB');}
   if(!await pace(db,user.id,'asset',now,60))return fail(429,'Too many upload reservations');
   const id=hex(crypto.getRandomValues(new Uint8Array(16)));
   const key='private-quarantine/large/'+project.id+'/'+id;
   const n=await change(db,
    'INSERT INTO member_studio_large_assets '+
    '(id,project_id,user_id,filename,extension,kind,content_type,size_bytes,status,storage_key,part_size,part_count,created_at,updated_at,lease_until) '+
    "SELECT ?,?,?,?,?,?,?,?,'reserved',?,?,?,?,?,? WHERE "+
    '(SELECT COUNT(*) FROM member_studio_large_assets WHERE project_id=?)<? AND '+
    '(SELECT COALESCE(SUM(size_bytes),0) FROM member_studio_large_assets WHERE user_id=?)+?<=? AND '+
    '(SELECT COALESCE(SUM(size_bytes),0) FROM member_studio_large_assets)+?<=? AND '+
    "EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? AND status IN ('draft','changes_requested'))",
    [id,project.id,user.id,v.filename,v.extension,v.kind,v.contentType,v.sizeBytes,key,
     PART,v.partCount,now,now,now+86400,
     project.id,MAX_PROJECT_FILES,user.id,v.sizeBytes,ACCOUNT_CAP,v.sizeBytes,GLOBAL_CAP,
     project.id,user.id]);
   return n===1?json({id,status:'reserved',partSize:PART,partCount:v.partCount},201):
    fail(409,'Creator capacity reached; the draft remains unchanged');
  }
  const selected=(await rows(db,'SELECT * FROM member_studio_large_assets WHERE id=? AND project_id=? AND user_id=?',
   [asset,project.id,user.id]))[0];
  if(!selected)return fail(404,'File not found');
  if(action==='file'){
   if(!['GET','HEAD'].includes(req.method))return fail(405,'Method not allowed');
   if(selected.status!=='quarantined')return fail(409,'File incomplete');
   if(!storage)return fail(503,'Private storage disconnected');
   const o=await store.get(selected.storage_key);
   if(!o||Number(o.size)!==Number(selected.size_bytes))return fail(503,'Private file unavailable');
   const headers=new Headers({...HEAD,'content-type':'application/octet-stream',
    'content-disposition':'attachment; filename="anevum-private-build"',
    'content-length':String(selected.size_bytes)});
   return new Response(req.method==='HEAD'?null:o.body,{headers});
  }
  if(req.method==='DELETE'&&!action){
   if(!storage)return fail(503,'Private storage disconnected; file retained');
   if(!await pace(db,user.id,'asset',now,60))return fail(429,'Too many asset changes');
   // Invalidate any frozen review in the same D1 transaction as byte withdrawal.
   const results=await db.batch([
    db.prepare("UPDATE member_studio_large_assets SET status='deleting',updated_at=? WHERE id=? "+
      "AND user_id=? AND status IN ('reserved','uploading','quarantined','deleting')").bind(now,asset,user.id),
    db.prepare("UPDATE member_studio_projects SET status='draft',revision=revision+1,updated_at=?,submitted_at=NULL "+
      "WHERE id=? AND user_id=? AND status='pending_review' AND revision=? "+
      "AND EXISTS(SELECT 1 FROM member_studio_large_assets WHERE id=? AND status='deleting')")
     .bind(now,project.id,user.id,project.revision,asset),
    db.prepare("UPDATE member_studio_submissions SET status='withdrawn',resolved_at=? "+
      "WHERE project_id=? AND user_id=? AND project_revision=? AND status='pending_review' "+
      "AND EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? AND status='draft' AND revision=?) "+
      "AND EXISTS(SELECT 1 FROM member_studio_large_assets WHERE id=? AND status='deleting')")
     .bind(now,project.id,user.id,project.revision,project.id,user.id,project.revision+1,asset)
   ]);
   if(Number(results?.[0]?.meta?.changes??0)!==1)return fail(409,'File changed');
   if(Number(results?.[1]?.meta?.changes??0)===1&&Number(results?.[2]?.meta?.changes??0)!==1)
    return fail(503,'Review withdrawal needs reconciliation');
   try{await erase(db,store,{...selected,status:'deleting'});}
   catch{return fail(503,'File deletion queued for retry');}
   return json({deleted:true,withdrawnFromReview:Number(results?.[1]?.meta?.changes??0)===1});
  }
  if(action==='start'){
   if(req.method!=='POST')return fail(405,'Method not allowed');
   if(!active||!mutable(project)||!storage)return fail(404,'Large uploads are paused');
   if(selected.status==='uploading'&&selected.upload_id)
    return json({id:asset,status:'uploading',partSize:PART,partCount:Number(selected.part_count)});
   if(selected.status!=='reserved'||now>Number(selected.lease_until))
    return fail(409,'Reservation expired or changed');
   if(!await pace(db,user.id,'asset',now,60))return fail(429,'Too many upload sessions');
   const upload=await store.createMultipartUpload(selected.storage_key,{
    httpMetadata:{contentType:'application/octet-stream'},
    customMetadata:{quarantine:'true',kind:selected.kind}});
   const changed=await change(db,
    "UPDATE member_studio_large_assets SET status='uploading',upload_id=?,lease_until=?,updated_at=? "+
    "WHERE id=? AND user_id=? AND status='reserved' AND lease_until>=? "+
    "AND EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? "+
    "AND status IN ('draft','changes_requested'))",
    [upload.uploadId,now+86400,now,asset,user.id,now,project.id,user.id]);
   if(changed!==1){await upload.abort();return fail(409,'Reservation changed');}
   return json({id:asset,status:'uploading',partSize:PART,partCount:Number(selected.part_count)});
  }
  if(action==='parts'){
   if(req.method==='GET'&&part===0){
    const saved=await rows(db,'SELECT part_number,size_bytes,sha256 FROM member_studio_large_parts '+
     'WHERE asset_id=? ORDER BY part_number',[asset]);
    return json({id:asset,status:selected.status,partSize:PART,partCount:Number(selected.part_count),
     completedParts:saved.map(p=>({partNumber:Number(p.part_number),sizeBytes:Number(p.size_bytes),sha256:p.sha256}))});
   }
   if(req.method!=='PUT')return fail(405,'Method not allowed');
   if(!active||!mutable(project)||!storage)return fail(404,'Uploads are paused');
   if(selected.status!=='uploading'||!selected.upload_id||Number(selected.lease_until)<now)
    return fail(409,'Upload expired or not started');
   if(!safeInt(part,1,Number(selected.part_count)))return fail(404,'Part not found');
   if(req.headers.get('content-type')!=='application/octet-stream')
    return fail(415,'Binary chunks required');
   let bytes;try{bytes=await limited(req,PART);}catch{return fail(413,'Chunk exceeds 8 MiB');}
   if(bytes.length!==expectedPartSize(selected,part))return fail(422,'Wrong chunk size');
   if(part===1&&!magic(bytes,selected.extension))return fail(422,'File signature mismatch');
   const digest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
   const existing=(await rows(db,'SELECT sha256,etag FROM member_studio_large_parts WHERE asset_id=? AND part_number=?',
    [asset,part]))[0];
   if(existing)return existing.sha256===digest?json({partNumber:part,sha256:digest,replayed:true}):
    fail(409,'Part number already committed with different bytes');
   const remote=await store.resumeMultipartUpload(selected.storage_key,selected.upload_id)
    .uploadPart(part,bytes);
   if(!remote?.etag||remote.partNumber!==part)return fail(503,'Object storage rejected part');
   const added=await change(db,
    'INSERT INTO member_studio_large_parts(asset_id,part_number,size_bytes,sha256,etag) '+
    'SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM member_studio_large_assets '+
    "WHERE id=? AND user_id=? AND status='uploading' AND lease_until>=?) "+
    'ON CONFLICT(asset_id,part_number) DO NOTHING',
    [asset,part,bytes.length,digest,String(remote.etag),asset,user.id,now]);
   return added===1?json({partNumber:part,sha256:digest,replayed:false}):
    fail(409,'Part state changed; refresh your upload');
  }
  if(action==='complete'){
   if(req.method!=='POST')return fail(405,'Method not allowed');
   if(selected.status==='quarantined'&&selected.manifest_sha256)
    return json({id:asset,status:'quarantined',manifestSha256:selected.manifest_sha256,
     note:'Existing private quarantine; not published'});
   if(!active||!mutable(project)||!storage)return fail(404,'Uploads are paused');
   if(selected.status!=='uploading'||!selected.upload_id||Number(selected.lease_until)<now)
    return fail(409,'Upload not ready');
   const parts=await rows(db,
    'SELECT part_number,size_bytes,sha256,etag FROM member_studio_large_parts WHERE asset_id=? ORDER BY part_number',
    [asset]);
   if(parts.length!==Number(selected.part_count)||
     parts.some((p,i)=>p.part_number!==i+1||Number(p.size_bytes)!==expectedPartSize(selected,i+1)))
    return fail(409,'Upload incomplete; resume missing chunks');
   const fingerprint=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode('anevum-parts-v1:'+selected.size_bytes+':'+
     parts.map(p=>p.part_number+':'+p.size_bytes+':'+p.sha256).join('|')))));
   const remote=await store.resumeMultipartUpload(selected.storage_key,selected.upload_id)
    .complete(parts.map(p=>({partNumber:Number(p.part_number),etag:p.etag})));
   if(Number(remote?.size)!==Number(selected.size_bytes)){
    await store.delete(selected.storage_key);return fail(503,'Stored size mismatch');
   }
   const committed=await change(db,
    "UPDATE member_studio_large_assets SET status='quarantined',manifest_sha256=?,"+
    'upload_id=NULL,lease_until=NULL,uploaded_at=?,updated_at=? '+
    "WHERE id=? AND user_id=? AND status='uploading' AND upload_id=? AND "+
    "EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? "+
    "AND status IN ('draft','changes_requested'))",
    [fingerprint,now,now,asset,user.id,selected.upload_id,project.id,user.id]);
   if(committed!==1){await store.delete(selected.storage_key);
    return fail(503,'Upload state changed; private object removed');}
   return json({id:asset,status:'quarantined',manifestSha256:fingerprint,
    note:'Private quarantine only; not scanned, executed or published'});
  }
  return fail(405,'Method not allowed');
 }catch{return fail(503,'Large file service temporarily unavailable');}
}
export async function cleanupCanonicalStudioLargeAssets(env,now=Math.floor(Date.now()/1000)){
 if(!await studioLargeSchemaReady(env)||!studioLargeStorageReady(env))return {cleaned:0};
 const db=env.MEMBER_DB,store=env.CREATOR_ASSETS;
 const files=await rows(db,'SELECT id,status,storage_key,upload_id FROM member_studio_large_assets WHERE '+
  "(status IN ('reserved','uploading') AND lease_until<?) OR "+
  "(status='deleting' AND updated_at<?) ORDER BY created_at LIMIT 25",
  [now,now-900]);
 let cleaned=0;
 for(const row of files){
  try{const n=await change(db,"UPDATE member_studio_large_assets SET status='deleting',updated_at=? "+
   'WHERE id=? AND status=?',[now,row.id,row.status]);
   if(n!==1)continue;
   await erase(db,store,row);cleaned++;
  }catch{/* Retain deletion marker and retry; never serve in this state. */}
 }
 return {cleaned};
}
