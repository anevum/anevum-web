// Catalog metadata only. No source cloning, dependency installation, app proxying or execution.
export const CATEGORIES = Object.freeze(['APP', 'GAME', 'TOOL', 'EXPERIMENT']);
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const FIELDS = ['creator','title','summary','description','category','sourceUrl','liveUrl','license','previewEnabled'];
const PUBLIC_COLUMNS = 'id,creator,title,summary,description,category,source_url,live_url,license,preview_enabled,published_at,revision';
const PRIVATE_COLUMNS = PUBLIC_COLUMNS + ',status,rights_confirmed,created_at,updated_at';
const MAX_PROJECTS=25, MAX_SAVES=200;
function json(data,status=200) {
  return Response.json(data,{status,headers:{'Cache-Control':'private, no-store',
    'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive',
    ...(status===429?{'Retry-After':'60'}:{})}});
}
function text(value,min,max) {
  if(typeof value!=='string') return null;
  const s=value.trim();
  return s.length>=min && s.length<=max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s)?s:null;
}
export function sourceURL(value) {
  if(value==='' || value===null) return null;
  if(typeof value!=='string' || value.length>250 || /[\s\\]/.test(value)) return false;
  try {
    const u=new URL(value);
    if(u.protocol!=='https:' || u.hostname!=='github.com' || u.port || u.username || u.password || u.search || u.hash) return false;
    const m=u.pathname.match(/^\/([A-Za-z0-9][A-Za-z0-9-]{0,38})\/([A-Za-z0-9_.-]{1,100})\/?$/);
    if(!m || ['.','..'].includes(m[2])) return false;
    const repo=m[2].replace(/\.git$/,'');
    if(!repo || ['.','..'].includes(repo)) return false;
    return `https://github.com/${m[1]}/${repo}`;
  } catch {return false;}
}
export function liveURL(value) {
  if(value==='' || value===null) return null;
  if(typeof value!=='string' || value.length>1500 || /[\s\\\u0000-\u001f]/.test(value)) return false;
  try {
    const u=new URL(value), h=u.hostname.toLowerCase();
    if(u.protocol!=='https:' || u.username || u.password || u.port || u.hash ||
       !h.includes('.') || h.endsWith('.') || !/^[a-z0-9.-]+$/.test(h) ||
       h.split('.').some(label=>!label || label.length>63 || label.startsWith('-') || label.endsWith('-')) ||
       /^\d+(\.\d+){3}$/.test(h) || /(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(h) ||
       h==='anevum.com' || h.endsWith('.anevum.com')) return false;
    if([...u.searchParams.keys()].some(k=>/(token|secret|password|api.?key|authorization|signature)/i.test(k))) return false;
    return u.href;
  } catch {return false;}
}
export function validateProject(data,updating=false) {
  if(!data || typeof data!=='object' || Array.isArray(data)) return null;
  const keys=[...FIELDS,...(updating?['expectedRevision']:[])].sort().join(',');
  if(Object.keys(data).sort().join(',')!==keys) return null;
  const creator=text(data.creator,2,60), title=text(data.title,3,100), summary=text(data.summary,15,300);
  const description=text(data.description,0,4000), license=text(data.license,1,80);
  const sourceUrl=sourceURL(data.sourceUrl), liveUrl=liveURL(data.liveUrl);
  if(!creator || !title || !summary || description===null || !license || !CATEGORIES.includes(data.category) ||
     typeof data.previewEnabled!=='boolean' || sourceUrl===false || liveUrl===false || (!sourceUrl && !liveUrl) ||
     (data.previewEnabled && !liveUrl) || (updating && (!Number.isSafeInteger(data.expectedRevision) || data.expectedRevision<1))) return null;
  return {creator,title,summary,description,category:data.category,sourceUrl,liveUrl,license,
    previewEnabled:data.previewEnabled,...(updating?{expectedRevision:data.expectedRevision}:{})};
}
export async function boundedJSON(request,max=10000) {
  const ct=request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if(ct!=='application/json' && !ct?.endsWith('+json')) return null;
  const reader=request.body?.getReader(); if(!reader) return null;
  const parts=[]; let size=0, chunks=0;
  try {
    for(;;) {
      const {done,value}=await reader.read(); if(done) break;
      size+=value.byteLength; chunks++;
      if(size>max || chunks>1000) {await reader.cancel();return null;}
      parts.push(value);
    }
    const all=new Uint8Array(size);let at=0;
    for(const p of parts) {all.set(p,at);at+=p.byteLength;}
    const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
    return data && typeof data==='object' && !Array.isArray(data)?data:null;
  } catch {return null;} finally {reader.releaseLock();}
}
export async function catalogSchemaReady(db) {
  if(!db?.prepare) return false;
  try {
    const r=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('creator_projects','creator_project_events','creator_library','creator_mutation_limits')").all();
    return new Set((r.results||[]).map(x=>x.name)).size===4;
  } catch {return false;}
}
function record(row,own=false) {
  return {id:row.id,creator:row.creator,title:row.title,summary:row.summary,description:row.description,
    category:row.category,sourceUrl:row.source_url,liveUrl:row.live_url,license:row.license,
    previewEnabled:row.preview_enabled===1,repositoryOwnership:'UNVERIFIED_LINK',
    publishedAt:row.published_at,revision:row.revision,
    ...(own?{status:row.status,rightsConfirmed:row.rights_confirmed===1,updatedAt:row.updated_at}:{})};
}
function expectedBody(data,extras=[]) {
  return data && Object.keys(data).sort().join(',')===['expectedRevision',...extras].sort().join(',') &&
    Number.isSafeInteger(data.expectedRevision) && data.expectedRevision>0;
}
async function audited(db,statement,projectId,actor,action,revision,now,note='') {
  const result=await db.batch([statement,db.prepare(
    'INSERT INTO creator_project_events(id,project_id,actor_id,action,revision,note,created_at) SELECT ?,?,?,?,?,?,? WHERE changes()=1'
  ).bind(crypto.randomUUID(),projectId,actor,action,revision,note,now),db.prepare(
    'DELETE FROM creator_project_events WHERE project_id=? AND id NOT IN (SELECT id FROM creator_project_events WHERE project_id=? ORDER BY revision DESC LIMIT 100)'
  ).bind(projectId,projectId)]);
  return result[0]?.meta?.changes===1;
}
async function permitMutation(db,userId,now) {
  const start=Math.floor(now/60)*60;
  const row=await db.prepare('INSERT INTO creator_mutation_limits(user_id,window_start,count) VALUES (?,?,1) ON CONFLICT(user_id) DO UPDATE SET window_start=excluded.window_start,count=CASE WHEN creator_mutation_limits.window_start=excluded.window_start THEN creator_mutation_limits.count+1 ELSE 1 END RETURNING count')
    .bind(userId,start).first();
  return row?.count<=20;
}
export async function importRepository(input,fetchImpl=fetch) {
  const source=sourceURL(input); if(!source) return null;
  const path=new URL(source).pathname;
  // This constant host is the ONLY outbound fetch. No source files or user app URL are fetched.
  const response=await fetchImpl('https://api.github.com/repos'+path,{
    headers:{Accept:'application/vnd.github+json','User-Agent':'ANEVUM-Catalog'},
    redirect:'error',signal:AbortSignal.timeout(4500),cf:{cacheTtl:300,cacheEverything:true}});
  if(!response.ok) return null;
  const repo=await boundedJSON(response,32000);
  if(!repo || repo.private!==false || typeof repo.full_name!=='string' ||
    repo.full_name.toLowerCase()!==path.slice(1).toLowerCase() ||
    String(sourceURL(repo.html_url)||'').toLowerCase()!==source.toLowerCase()) return null;
  return {title:text(repo.name,1,100)||'',summary:text(repo.description,0,300)||'',
    sourceUrl:source,liveUrl:liveURL(repo.homepage)||'',license:text(repo.license?.spdx_id,1,80)||'Not specified',
    ownership:'UNVERIFIED_LINK',notice:'Public metadata imported. Linking a repository does not verify ownership or permission to publish it.'};
}
// user/reviewer are server-only capabilities, never request JSON.
export async function catalogEndpoint(request,env,{user=null,reviewer=false,fetchImpl=fetch}={}) {
  const u=new URL(request.url), path=u.pathname, method=request.method, db=env?.MEMBER_DB;
  if(path==='/api/catalog/status') {
    if(method!=='GET' || u.search) return json({message:'Read-only status.'},405);
    const available=env?.ANEVUM_CATALOG_ENABLED==='true' && await catalogSchemaReady(db);
    return json({available,publishingEnabled:available && env?.ANEVUM_CATALOG_PUBLISH_ENABLED==='true',
      hosting:'EXTERNAL_ONLY',repositoryConnection:'PUBLIC_METADATA_ONLY',categories:CATEGORIES});
  }
  if(env?.ANEVUM_CATALOG_ENABLED!=='true' || !await catalogSchemaReady(db)) return json({available:false,message:'Creator publishing is not activated yet.'},503);
  const publicList=path==='/api/catalog/projects', publicDetail=path.match(/^\/api\/catalog\/projects\/([^/]+)$/);
  if(publicList || publicDetail) {
    if(method!=='GET') return json({message:'Read-only catalog.'},405);
    if(env?.ANEVUM_CATALOG_PUBLISH_ENABLED!=='true') return publicList?json({projects:[],nextOffset:null}):json({message:'Project not found.'},404);
    if(publicDetail) {
      if(!ID.test(publicDetail[1]) || u.search) return json({message:'Project not found.'},404);
      const row=await db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM creator_projects WHERE id=? AND status='PUBLISHED'`).bind(publicDetail[1]).first();
      return row?json({project:record(row)}):json({message:'Project not found.'},404);
    }
    if([...u.searchParams.keys()].some(k=>!['q','category','offset'].includes(k)) || [...new Set(u.searchParams.keys())].some(k=>u.searchParams.getAll(k).length!==1)) return json({message:'Invalid filter.'},400);
    const q=u.searchParams.get('q')||'',category=u.searchParams.get('category')||'',raw=u.searchParams.get('offset')||'0';
    if(q.length>80 || (category && !CATEGORIES.includes(category)) || !/^\d{1,5}$/.test(raw) || Number(raw)>10000) return json({message:'Invalid filter.'},400);
    const escaped=q.replace(/[\\%_]/g,'\\$&');
    const result=await db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM creator_projects WHERE status='PUBLISHED' AND (?='' OR category=?) AND (title LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\') ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET ?`)
      .bind(category,category,`%${escaped}%`,`%${escaped}%`,Number(raw)).all();
    return json({projects:(result.results||[]).slice(0,24).map(r=>record(r)),nextOffset:result.results?.length>24?Number(raw)+24:null});
  }
  if(!user?.id || user.emailVerified!==true) return json({message:'A verified member account is required.'},401);
  if(u.search) return json({message:'Query-selected accounts are not supported.'},400);
  const now=Math.floor(Date.now()/1000), viewer={viewerMemberId:user.id};
  if(!['GET','HEAD'].includes(method)) {
    if(request.headers.get('X-ANEVUM-EXPECTED-MEMBER-ID')!==user.id) return json({message:'Your account changed. Reload before saving.'},409);
    if(!await permitMutation(db,user.id,now)) return json({message:'Too many changes. Try again in one minute.'},429);
  }
  if(path==='/api/catalog/import') {
    if(method!=='POST') return json({message:'Method not allowed.'},405);
    const data=await boundedJSON(request,400);
    if(!data || Object.keys(data).join(',')!=='sourceUrl') return json({message:'A public GitHub repository URL is required.'},400);
    try {const imported=await importRepository(data.sourceUrl,fetchImpl);
      return imported?json({...viewer,imported}):json({message:'Public repository metadata unavailable. Enter the details manually.'},422);
    } catch {return json({message:'GitHub is unavailable or rate-limited. Enter the details manually.'},503);}
  }
  if(path==='/api/catalog/mine' || path==='/api/catalog/export') {
    if(method==='GET') {
      const rows=await db.prepare(`SELECT ${PRIVATE_COLUMNS} FROM creator_projects WHERE owner_id=? ORDER BY updated_at DESC,id DESC LIMIT 25`).bind(user.id).all();
      if(path.endsWith('/export')) {
        const saves=await db.prepare('SELECT project_id,created_at FROM creator_library WHERE user_id=? ORDER BY created_at DESC LIMIT 200').bind(user.id).all();
        return json({...viewer,projects:(rows.results||[]).map(r=>record(r,true)),savedProjects:saves.results||[]});
      }
      return json({...viewer,projects:(rows.results||[]).map(r=>record(r,true)),limit:MAX_PROJECTS});
    }
    if(method!=='POST' || path.endsWith('/export')) return json({message:'Method not allowed.'},405);
    const p=validateProject(await boundedJSON(request)); if(!p) return json({message:'Check the project details. Use public HTTPS links without credentials.'},400);
    const id=crypto.randomUUID();
    const stmt=db.prepare('INSERT INTO creator_projects(id,owner_id,creator,title,summary,description,category,source_url,live_url,license,preview_enabled,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM creator_projects WHERE owner_id=?)<?')
      .bind(id,user.id,p.creator,p.title,p.summary,p.description,p.category,p.sourceUrl,p.liveUrl,p.license,Number(p.previewEnabled),now,now,user.id,MAX_PROJECTS);
    if(!await audited(db,stmt,id,user.id,'CREATE',1,now)) return json({message:'Your 25-project limit has been reached.'},409);
    const row=await db.prepare(`SELECT ${PRIVATE_COLUMNS} FROM creator_projects WHERE id=? AND owner_id=?`).bind(id,user.id).first();
    return json({...viewer,project:record(row,true)},201);
  }
  const mine=path.match(/^\/api\/catalog\/mine\/([^/]+)(?:\/(submit|withdraw))?$/);
  if(mine) {
    const [,id,action]=mine; if(!ID.test(id)) return json({message:'Project not found.'},404);
    const row=await db.prepare('SELECT id,revision,status FROM creator_projects WHERE id=? AND owner_id=?').bind(id,user.id).first();
    if(!row) return json({message:'Project not found.'},404);
    const data=await boundedJSON(request);
    if(method==='DELETE' && !action) {
      if(!expectedBody(data)) return json({message:'Expected revision required.'},400);
      const r=await db.prepare('DELETE FROM creator_projects WHERE id=? AND owner_id=? AND revision=?').bind(id,user.id,data.expectedRevision).run();
      return r.meta.changes===1?json({...viewer,deleted:true}):json({message:'Project changed. Reload.'},409);
    }
    if(method==='PUT' && !action) {
      const p=validateProject(data,true);if(!p) return json({message:'Invalid project details.'},400);
      const stmt=db.prepare("UPDATE creator_projects SET creator=?,title=?,summary=?,description=?,category=?,source_url=?,live_url=?,license=?,preview_enabled=?,status='DRAFT',rights_confirmed=0,published_at=NULL,revision=revision+1,updated_at=? WHERE id=? AND owner_id=? AND revision=?")
        .bind(p.creator,p.title,p.summary,p.description,p.category,p.sourceUrl,p.liveUrl,p.license,Number(p.previewEnabled),now,id,user.id,p.expectedRevision);
      const ok=await audited(db,stmt,id,user.id,'EDIT',p.expectedRevision+1,now);
      return ok?json({...viewer,updated:true}):json({message:'Project changed. Reload.'},409);
    }
    if(method==='POST' && action) {
      const submit=action==='submit';
      if(!expectedBody(data,submit?['rightsConfirmed']:[]) || (submit && data.rightsConfirmed!==true)) return json({message:'Confirm your publishing rights and the current revision.'},400);
      const states=submit?"('DRAFT','REJECTED','WITHDRAWN')":"('PENDING','PUBLISHED')",target=submit?'PENDING':'WITHDRAWN';
      const stmt=db.prepare(`UPDATE creator_projects SET status=?,rights_confirmed=?,published_at=NULL,revision=revision+1,updated_at=? WHERE id=? AND owner_id=? AND revision=? AND status IN ${states}`)
        .bind(target,Number(submit),now,id,user.id,data.expectedRevision);
      const ok=await audited(db,stmt,id,user.id,target,data.expectedRevision+1,now);
      return ok?json({...viewer,status:target}):json({message:'Project changed or cannot make this transition.'},409);
    }
    return json({message:'Method not allowed.'},405);
  }
  if(path==='/api/catalog/library' && method==='GET') {
    const rows=await db.prepare(`SELECT ${PUBLIC_COLUMNS.split(',').map(c=>'p.'+c).join(',')} FROM creator_library s JOIN creator_projects p ON p.id=s.project_id WHERE s.user_id=? AND p.status='PUBLISHED' ORDER BY s.created_at DESC,p.id DESC LIMIT 200`).bind(user.id).all();
    return json({...viewer,projects:env?.ANEVUM_CATALOG_PUBLISH_ENABLED==='true'?(rows.results||[]).map(r=>record(r)):[]});
  }
  const save=path.match(/^\/api\/catalog\/library\/([^/]+)$/);
  if(save && ID.test(save[1])) {
    if(!['PUT','DELETE'].includes(method)) return json({message:'Method not allowed.'},405);
    const payload=await boundedJSON(request,100);
    if(!payload || Object.keys(payload).length) return json({message:'An empty JSON object is required.'},400);
    if(method==='DELETE') {await db.prepare('DELETE FROM creator_library WHERE user_id=? AND project_id=?').bind(user.id,save[1]).run();return json({...viewer,saved:false});}
    if(env?.ANEVUM_CATALOG_PUBLISH_ENABLED!=='true') return json({message:'Project not found.'},404);
    const published=await db.prepare("SELECT id FROM creator_projects WHERE id=? AND status='PUBLISHED'").bind(save[1]).first();
    if(!published) return json({message:'Project not found.'},404);
    await db.prepare('INSERT OR IGNORE INTO creator_library(user_id,project_id,created_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM creator_library WHERE user_id=?)<?')
      .bind(user.id,save[1],now,user.id,MAX_SAVES).run();
    const saved=await db.prepare('SELECT project_id FROM creator_library WHERE user_id=? AND project_id=?').bind(user.id,save[1]).first();
    return saved?json({...viewer,saved:true}):json({message:'Your 200-project library is full.'},409);
  }
  if(path==='/api/catalog/review' || path.startsWith('/api/catalog/review/')) {
    if(!reviewer) return json({message:'Independent Studio authorization is required.'},403);
    if(path==='/api/catalog/review' && method==='GET') {
      const r=await db.prepare(`SELECT ${PRIVATE_COLUMNS} FROM creator_projects WHERE status IN ('PENDING','PUBLISHED') ORDER BY CASE WHEN status='PENDING' THEN 0 ELSE 1 END,updated_at DESC,id DESC LIMIT 101`).all();
      return json({...viewer,projects:(r.results||[]).slice(0,100).map(row=>record(row,true)),more:r.results?.length>100});
    }
    const match=path.match(/^\/api\/catalog\/review\/([^/]+)$/);
    if(!match || !ID.test(match[1]) || method!=='POST') return json({message:'Review not found.'},404);
    const data=await boundedJSON(request,1500);
    if(!expectedBody(data,['decision','note']) || !['PUBLISHED','REJECTED','WITHDRAWN'].includes(data.decision) || text(data.note,5,500)===null)
      return json({message:'Choose a decision and record a review note.'},400);
    if(data.decision==='PUBLISHED' && env?.ANEVUM_CATALOG_PUBLISH_ENABLED!=='true') return json({message:'Public listing activation is still disabled.'},503);
    const allowed=data.decision==='WITHDRAWN'?"('PUBLISHED')":"('PENDING')";
    const stmt=db.prepare(`UPDATE creator_projects SET status=?,published_at=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND rights_confirmed=1 AND status IN ${allowed}`)
      .bind(data.decision,data.decision==='PUBLISHED'?now:null,now,match[1],data.expectedRevision);
    const ok=await audited(db,stmt,match[1],user.id,data.decision,data.expectedRevision+1,now,data.note.trim());
    return ok?json({...viewer,status:data.decision}):json({message:'Project changed or is not ready for this review.'},409);
  }
  return json({message:'Catalog endpoint not found.'},404);
}
