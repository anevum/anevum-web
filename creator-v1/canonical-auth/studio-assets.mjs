// Private only. Files are quarantined, never executed or published.
// Creating/updating uploads requires the separate upload flag and an isolated R2
// binding. Owners may still list/withdraw EXISTING files while uploads are paused.
const MiB=1048576;
const QUOTA=100*MiB;
const MAX_ASSETS=20;
const RULES=Object.freeze({
 png:['image/png',10*MiB,'image'],jpg:['image/jpeg',10*MiB,'image'],
 jpeg:['image/jpeg',10*MiB,'image'],webp:['image/webp',10*MiB,'image'],
 gif:['image/gif',10*MiB,'image'],mp3:['audio/mpeg',20*MiB,'audio'],
 wav:['audio/wav',20*MiB,'audio'],pdf:['application/pdf',10*MiB,'document'],
 txt:['text/plain',MiB,'document'],md:['text/markdown',MiB,'document'],
 zip:['application/zip',20*MiB,'package']
});
const HEX=/^[a-f0-9]{32}$/;
const HEAD={'cache-control':'private, no-store','x-content-type-options':'nosniff',
 'cross-origin-resource-policy':'same-origin','referrer-policy':'no-referrer',
 'x-robots-tag':'noindex,nofollow','content-security-policy':"sandbox; default-src 'none'"};
const out=(value,status=200)=>Response.json(value,{status,headers:{...HEAD,'content-type':'application/json; charset=utf-8'}});
const fail=(status,error)=>out({error},status);
const cleanName=x=>typeof x==='string'&&x.length>=1&&x.length<=160&&
 !/[\\/\u0000-\u001f\u007f]/.test(x)&&!x.startsWith('.')&&!x.includes('..');
function declaration(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||
    Object.keys(v).sort().join(',')!=='contentType,name,sizeBytes')throw Error('Invalid declaration');
 if(!cleanName(v.name))throw Error('Invalid filename');
 const ext=v.name.split('.').at(-1).toLowerCase(),rule=RULES[ext];
 if(!rule||v.contentType!==rule[0]||!Number.isSafeInteger(v.sizeBytes)||v.sizeBytes<1||v.sizeBytes>rule[1])
  throw Error('Unsupported format or file size');
 return {name:v.name,extension:ext,contentType:rule[0],sizeBytes:v.sizeBytes,kind:rule[2]};
}
async function limited(req,max){
 const header=req.headers.get('content-length');
 if(header!==null&&(!/^\d+$/.test(header)||Number(header)>max))throw Error('Oversize');
 if(!req.body)throw Error('Empty stream');
 const reader=req.body.getReader();let count=0;const chunks=[];
 try{
  for(;;){
   const next=await reader.read();if(next.done)break;
   count+=next.value.byteLength;
   if(count>max){await reader.cancel();throw Error('Oversize');}
   chunks.push(next.value);
  }
 }finally{reader.releaseLock();}
 const bytes=new Uint8Array(count);let i=0;
 for(const part of chunks){bytes.set(part,i);i+=part.byteLength;}
 return bytes;
}
async function body(req){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return null;
 try{const bytes=await limited(req,2048),v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  return v&&typeof v==='object'&&!Array.isArray(v)?v:null;
 }catch{return null;}
}
const starts=(b,text,offset=0)=>b.length>=offset+text.length&&
 [...text].every((char,i)=>b[offset+i]===char.charCodeAt(0));
function signature(bytes,declared){
 switch(declared.extension){
 case 'png':return bytes[0]===137&&starts(bytes,'PNG',1);
 case 'jpg':case 'jpeg':return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 case 'gif':return starts(bytes,'GIF87a')||starts(bytes,'GIF89a');
 case 'webp':return starts(bytes,'RIFF')&&starts(bytes,'WEBP',8);
 case 'wav':return starts(bytes,'RIFF')&&starts(bytes,'WAVE',8);
 case 'mp3':return starts(bytes,'ID3')||(bytes[0]===255&&(bytes[1]&224)===224);
 case 'pdf':return starts(bytes,'%PDF-');
 case 'zip':return starts(bytes,'PK')&&bytes[2]===3&&bytes[3]===4;
 case 'txt':case 'md':
   try{return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
   catch{return false;}
 default:return false;
 }
}
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const view=a=>({id:a.id,name:a.filename,kind:a.kind,contentType:a.content_type,
 sizeBytes:Number(a.size_bytes),status:a.status,sha256:a.sha256||null,uploadedAt:a.uploaded_at});
const ALL='id,project_id,user_id,filename,extension,kind,content_type,size_bytes,status,storage_key,sha256,lease_until,uploaded_at';
async function rows(db,sql,args=[]){
 const r=await db.prepare(sql).bind(...args).all();
 if(r?.success===false||!Array.isArray(r?.results))throw Error('Storage unavailable');
 return r.results;
}
async function change(db,sql,args=[]){
 const r=await db.prepare(sql).bind(...args).run();
 if(r?.success===false)throw Error('Storage unavailable');
 return Number(r?.meta?.changes??0);
}
const mutable=project=>project.status==='draft'||project.status==='changes_requested';
export function studioStorageReady(env){
 return env?.CANONICAL_CREATOR_STUDIO_ENABLED==='true'&&
   Boolean(env?.CREATOR_ASSETS?.get&&env?.CREATOR_ASSETS?.put&&env?.CREATOR_ASSETS?.delete);
}
export function studioUploadReady(env){
 return env?.CANONICAL_CREATOR_UPLOADS_ENABLED==='true'&&studioStorageReady(env);
}
export async function canonicalStudioAssets(req,env,user,project,{asset=null,file=null,now=Math.floor(Date.now()/1000),pace}){
 const db=env.MEMBER_DB,store=env.CREATOR_ASSETS;
 const uploadsEnabled=studioUploadReady(env),storageConnected=studioStorageReady(env);
 if(asset&&!HEX.test(asset))return fail(404,'Not found');
 try{
  if(!asset){
   if(req.method==='GET'){
    const assets=await rows(db,
      'SELECT '+ALL+' FROM member_studio_assets WHERE project_id=? AND user_id=? ORDER BY created_at DESC LIMIT 50',
      [project.id,user.id]);
    return out({assets:assets.map(view),quotaBytes:QUOTA,projectAssetLimit:MAX_ASSETS,
     storageReady:storageConnected,uploadsReady:uploadsEnabled});
   }
   if(req.method!=='POST')return fail(405,'Method not allowed');
   if(!uploadsEnabled)return fail(404,'New private uploads are disabled');
   if(!mutable(project))return fail(409,'Project locked for review');
   const requested=await body(req);
   let v;try{v=declaration(requested);}catch{return fail(422,'Unsupported file or size');}
   if(!await pace(db,user.id,'asset',now,60))return fail(429,'Too many asset changes');
   const id=hex(crypto.getRandomValues(new Uint8Array(16)));
   const key='private-quarantine/studio/'+project.id+'/'+id;
   const n=await change(db,
     'INSERT INTO member_studio_assets(id,project_id,user_id,filename,extension,kind,content_type,size_bytes,status,storage_key,created_at,updated_at) '+
     "SELECT ?,?,?,?,?,?,?,?,'reserved',?,?,? WHERE "+
     '(SELECT COUNT(*) FROM member_studio_assets WHERE project_id=?)<? AND '+
     '(SELECT COALESCE(SUM(size_bytes),0) FROM member_studio_assets WHERE user_id=?)+?<=? AND '+
     "EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? AND status IN ('draft','changes_requested'))",
     [id,project.id,user.id,v.name,v.extension,v.kind,v.contentType,v.sizeBytes,key,now,now,
      project.id,MAX_ASSETS,user.id,v.sizeBytes,QUOTA,project.id,user.id]);
   return n===1?out({id,status:'reserved'},201):fail(409,'File quota or project limit reached');
  }
  const selected=(await rows(db,'SELECT '+ALL+' FROM member_studio_assets WHERE id=? AND project_id=? AND user_id=?',[asset,project.id,user.id]))[0];
  if(!selected)return fail(404,'File unavailable');
  if(file==='file'){
   if(!['GET','HEAD'].includes(req.method))return fail(405,'Method not allowed');
   if(!storageConnected)return fail(503,'Private storage is disconnected; file remains recorded');
   if(selected.status!=='quarantined')return fail(409,'File is not ready');
   const object=await store.get(selected.storage_key);
   if(!object||Number(object.size)!==Number(selected.size_bytes))
    return fail(503,'Private file storage unavailable');
   const headers=new Headers({...HEAD,'content-type':'application/octet-stream',
    'content-disposition':'attachment; filename="anevum-private-asset"','content-length':String(selected.size_bytes)});
   return new Response(req.method==='HEAD'?null:object.body,{headers});
  }
  if(file)return fail(404,'Not found');
  if(req.method==='DELETE'){
   // An owner may withdraw private bytes even when uploads are paused or the
   // project's metadata is locked for review. No orphaned R2 objects.
   if(!storageConnected)return fail(503,'Private storage is disconnected; file cannot be safely erased');
   if(selected.status==='uploading')return fail(409,'Upload is in progress');
   if(!await pace(db,user.id,'asset',now,60))return fail(429,'Too many asset changes');
   const n=await change(db,
    "UPDATE member_studio_assets SET status='deleting',updated_at=? WHERE id=? AND project_id=? AND user_id=? "+
    "AND status IN ('reserved','quarantined','deleting') AND EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=?)",
    [now,asset,project.id,user.id,project.id,user.id]);
   if(n!==1)return fail(409,'Asset changed');
   try{await store.delete(selected.storage_key);}
   catch{return fail(503,'Private file removal needs retry');}
   const deleted=await change(db,"DELETE FROM member_studio_assets WHERE id=? AND user_id=? AND status='deleting'",[asset,user.id]);
   return deleted===1?out({deleted:true}):fail(503,'Private file removal needs reconciliation');
  }
  if(req.method!=='PUT')return fail(405,'Method not allowed');
  if(!uploadsEnabled)return fail(404,'New private uploads are disabled');
  if(!mutable(project))return fail(409,'Project locked for review');
  if(req.headers.get('content-type')!=='application/octet-stream')return fail(415,'Binary upload required');
  if(selected.status!=='reserved')return fail(409,'Upload already in progress or finished');
  if(!await pace(db,user.id,'asset',now,60))return fail(429,'Too many asset changes');
  const lease=now+900;
  const n=await change(db,
   "UPDATE member_studio_assets SET status='uploading',lease_until=?,updated_at=? WHERE id=? AND project_id=? AND user_id=? AND status='reserved' "+
   "AND EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? AND status IN ('draft','changes_requested'))",
   [lease,now,asset,project.id,user.id,project.id,user.id]);
  if(n!==1)return fail(409,'Upload reservation changed');
  let bytes;
  try{
   bytes=await limited(req,Number(selected.size_bytes));
   if(bytes.byteLength!==Number(selected.size_bytes))throw Error('Size changed');
   const declared=declaration({name:selected.filename,sizeBytes:Number(selected.size_bytes),contentType:selected.content_type});
   if(!signature(bytes,declared))throw Error('Signature mismatch');
  }catch{
   await change(db,"UPDATE member_studio_assets SET status='reserved',lease_until=NULL WHERE id=? AND user_id=? AND status='uploading' AND lease_until=?",[asset,user.id,lease]);
   return fail(422,'File bytes differ from the declared type or size');
  }
  const digest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
  try{
   await store.put(selected.storage_key,bytes,{httpMetadata:{contentType:'application/octet-stream'},
    customMetadata:{quarantine:'true',sha256:digest,kind:selected.kind}});
  }catch{
   await change(db,"UPDATE member_studio_assets SET status='reserved',lease_until=NULL WHERE id=? AND user_id=? AND status='uploading' AND lease_until=?",[asset,user.id,lease]);
   return fail(503,'Private storage unavailable');
  }
  const committed=await change(db,
   "UPDATE member_studio_assets SET status='quarantined',sha256=?,lease_until=NULL,uploaded_at=?,updated_at=? "+
   "WHERE id=? AND project_id=? AND user_id=? AND status='uploading' AND lease_until=? "+
   "AND EXISTS(SELECT 1 FROM member_studio_projects WHERE id=? AND user_id=? AND status IN ('draft','changes_requested'))",
   [digest,now,now,asset,project.id,user.id,lease,project.id,user.id]);
  if(committed!==1){
   try{await store.delete(selected.storage_key);}catch{/* isolated orphan sweep needed before launch */}
   return fail(503,'Upload changed during storage, recovery required');
  }
  return out({id:asset,status:'quarantined',sha256:digest});
 }catch{return fail(503,'Private assets unavailable');}
}
// Called only by the existing staging scheduled handler. Pausing new uploads
// must not stop cleanup of billable expired reservations and abandoned R2 objects.
export async function cleanupCanonicalStudioAssets(env,now=Math.floor(Date.now()/1000)){
 if(!studioStorageReady(env)||!env.MEMBER_DB)return {cleaned:0};
 const db=env.MEMBER_DB,store=env.CREATOR_ASSETS;
 try{
  const schema=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_studio_assets'").first();
  if(!schema)return {cleaned:0};
 }catch{return {cleaned:0};}
 const candidates=await rows(db,
   "SELECT id,status,storage_key FROM member_studio_assets WHERE "+
   "(status='reserved' AND created_at<?) OR "+
   "(status='uploading' AND lease_until IS NOT NULL AND lease_until<?) OR "+
   "(status='deleting' AND updated_at<?) ORDER BY created_at LIMIT 25",
   [now-86400,now,now-900]);
 let cleaned=0;
 for(const item of candidates){
  try{
   const n=await change(db,
    "UPDATE member_studio_assets SET status='deleting',updated_at=? WHERE id=? AND status=? "+
    "AND ((status='reserved' AND created_at<?) OR (status='uploading' AND lease_until<?) OR (status='deleting' AND updated_at<?))",
    [now,item.id,item.status,now-86400,now,now-900]);
   if(n!==1)continue;
   await store.delete(item.storage_key);
   cleaned+=await change(db,"DELETE FROM member_studio_assets WHERE id=? AND status='deleting'",[item.id]);
  }catch{/* private storage stays inaccessible; retry later */}
 }
 return {cleaned};
}
