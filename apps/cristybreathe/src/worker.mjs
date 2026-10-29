import {identity} from './auth.mjs';

export const VERSION = '1.1.0';
const COLUMNS = 'id,kind,title,body,status,created_at,updated_at,pinned,archived,priority,is_draft,collection,tags,due_date,deferred_until,revision';
const HEADERS = {
  'cache-control':'private, no-store', 'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer', 'strict-transport-security':'max-age=31536000',
  'x-frame-options':'DENY', 'x-robots-tag':'noindex, nofollow, noarchive',
  'permissions-policy':'camera=(), microphone=(), geolocation=()',
  'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'x-cristybreathe-version': VERSION
};
export class ApiError extends Error { constructor(message, status = 400) {super(message); this.status = status;} }
function reply(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {status, headers:{...HEADERS, 'content-type':'application/json; charset=utf-8', ...extra}});
}
async function body(request, limit = 90000) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw new ApiError('Use application/json.',415);
  if (Number(request.headers.get('content-length')) > limit) throw new ApiError('This request is too large.',413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('A JSON object is required.');
  let size = 0; const chunks = [];
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.length;
    if (size > limit) {await reader.cancel(); throw new ApiError('This request is too large.',413);}
    chunks.push(next.value);
  }
  const joined = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) {joined.set(chunk, offset); offset += chunk.length;}
  let value;
  try {value = JSON.parse(new TextDecoder().decode(joined));} catch {throw new ApiError('The JSON could not be read.');}
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError('A JSON object is required.');
  return value;
}
const string = (v, max, label) => {
  if (typeof v !== 'string' || v.length > max) throw new ApiError(`${label} must be text of at most ${max} characters.`);
  return v;
};
function date(v, label) {
  string(v,10,label);
  if (v && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v+'T12:00:00Z')) || new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)) throw new ApiError(`${label} must be a valid date.`);
  return v;
}
export function validateEntry(value) {
  const defaults = {kind:'note',title:'',body:'',status:'open',pinned:0,archived:0,priority:0,is_draft:0,collection:'',tags:[],due_date:'',deferred_until:''};
  const allowed = new Set([...Object.keys(defaults),'id','revision']);
  if (Object.keys(value).some(k=>!allowed.has(k))) throw new ApiError('An unsupported field was supplied.');
  const item = {...defaults,...value};
  if (!['note','journal','idea','task'].includes(item.kind)) throw new ApiError('Choose a valid entry type.');
  if (!['open','done'].includes(item.status)) throw new ApiError('Choose a valid review status.');
  item.title = string(item.title,160,'Title').trim();
  item.body = string(item.body,20000,'Note');
  if (!item.title) item.title = item.body.trim().split('\n')[0].slice(0,80) || 'Untitled thought';
  for (const k of ['pinned','archived','priority','is_draft']) {
    if (![0,1,false,true].includes(item[k])) throw new ApiError(`${k} must be true or false.`);
    item[k] = Number(item[k]);
  }
  item.collection = string(item.collection,60,'Collection').trim();
  if (!Array.isArray(item.tags) || item.tags.length>12) throw new ApiError('Use up to 12 tags.');
  item.tags = [...new Set(item.tags.map(t=>string(t,32,'Tag').trim()).filter(Boolean))];
  item.due_date=date(item.due_date,'Reminder date'); item.deferred_until=date(item.deferred_until,'Deferred date');
  if (item.id !== undefined && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(item.id)) throw new ApiError('Invalid entry id.');
  return item;
}
function unpack(row) {if (!row) return null; return {...row,tags:JSON.parse(row.tags)};}
async function getEntry(db, owner, id) {return unpack(await db.prepare(`SELECT ${COLUMNS} FROM entries WHERE owner=? AND id=?`).bind(owner,id).first());}
function insert(db, owner, item, now, id, createdAt=now, updatedAt=now) {
  return db.prepare(`INSERT INTO entries (id,owner,kind,title,body,status,created_at,updated_at,pinned,archived,priority,is_draft,collection,tags,due_date,deferred_until,revision) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`)
    .bind(id,owner,item.kind,item.title,item.body,item.status,createdAt,updatedAt,item.pinned,item.archived,item.priority,item.is_draft,item.collection,JSON.stringify(item.tags),item.due_date,item.deferred_until);
}
const THEMES=['sage','lavender','autumn','teal','porcelain'];
export const DEFAULT_PREFS={theme:'sage',motion:'system',haptics:true,review_reminder:false,review_time:'20:00'};
function preferences(v) {
  if (!v || typeof v!=='object' || Array.isArray(v) || Object.keys(v).some(k=>!Object.hasOwn(DEFAULT_PREFS,k))) throw new ApiError('Invalid preferences.');
  const p={...DEFAULT_PREFS,...v};
  if (!THEMES.includes(p.theme) || !['system','reduced'].includes(p.motion) || typeof p.haptics!=='boolean' || typeof p.review_reminder!=='boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.review_time)) throw new ApiError('Invalid preferences.');
  return p;
}
export async function api(request, env, owner) {
  const url = new URL(request.url), path=url.pathname, method=request.method;
  if (!env.DB) return reply({error:'Your storage is unavailable. Please try again.'},503);
  if (!['GET','HEAD'].includes(method)) {
    if (!['POST','PATCH','PUT','DELETE'].includes(method)) return reply({error:'Method not allowed.'},405);
    if (request.headers.get('origin')!==url.origin || request.headers.get('sec-fetch-site')==='cross-site' || request.headers.get('x-cristybreathe')!=='1') return reply({error:'This request must come from your workspace.'},403);
  }
  if (method==='GET' && path==='/api/session') {
    const saved=await env.DB.prepare('SELECT value FROM preferences WHERE owner=?').bind(owner).first();
    return reply({email:owner,preferences:{...DEFAULT_PREFS,...(saved?JSON.parse(saved.value):{})},version:VERSION});
  }
  if (method==='PUT' && path==='/api/preferences') {
    const p=preferences(await body(request));
    await env.DB.prepare('INSERT INTO preferences(owner,value,updated_at) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(owner,JSON.stringify(p),new Date().toISOString()).run();
    return reply({preferences:p});
  }
  if (method==='GET' && path==='/api/entries') {
    const filters=['owner=?'],args=[owner];
    const q=(url.searchParams.get('q')||'').trim();
    if (q.length>200) throw new ApiError('Search is limited to 200 characters.');
    if (q) {filters.push('(instr(lower(title),lower(?))>0 OR instr(lower(body),lower(?))>0 OR instr(lower(collection),lower(?))>0 OR instr(lower(tags),lower(?))>0)');args.push(q,q,q,q);}
    const archived=url.searchParams.get('archived');
    if (archived==='0'||archived==='1') {filters.push('archived=?');args.push(Number(archived));}
    const offset=Number(url.searchParams.get('offset')||0);
    if (!Number.isSafeInteger(offset)||offset<0||offset>100000) throw new ApiError('Invalid page.');
    const {results}=await env.DB.prepare(`SELECT ${COLUMNS} FROM entries WHERE ${filters.join(' AND ')} ORDER BY pinned DESC,updated_at DESC,id ASC LIMIT 101 OFFSET ?`).bind(...args,offset).all();
    return reply({entries:results.slice(0,100).map(unpack),has_more:results.length>100,offset,email:owner,version:VERSION});
  }
  if (method==='POST' && path==='/api/entries') {
    const b=await body(request), item=validateEntry(b), id=item.id||crypto.randomUUID();
    const existing=await getEntry(env.DB,owner,id);
    if (existing) {
      // A retried POST may acknowledge the same snapshot, never a different one.
      const same=['kind','title','body','status','pinned','archived','priority','is_draft','collection','tags','due_date','deferred_until'].every(k=>JSON.stringify(existing[k])===JSON.stringify(item[k]));
      if (!same) return reply({error:'This draft was saved earlier with different text. Copy your open text, close without saving, and reopen the saved draft.'},409);
      return reply({entry:existing},200);
    }
    const occupied=await env.DB.prepare('SELECT id FROM entries WHERE id=?').bind(id).first();
    if (occupied) return reply({error:'This entry id is unavailable.'},409);
    await insert(env.DB,owner,item,new Date().toISOString(),id).run();
    return reply({entry:await getEntry(env.DB,owner,id),id},201);
  }
  if (method==='GET' && path==='/api/export') {
    const {results}=await env.DB.prepare(`SELECT ${COLUMNS} FROM entries WHERE owner=? ORDER BY created_at,id LIMIT 10001`).bind(owner).all();
    if (results.length>10000) throw new ApiError('This large export needs an administrator-assisted backup.',413);
    const saved=await env.DB.prepare('SELECT value FROM preferences WHERE owner=?').bind(owner).first();
    return reply({application:'CristyBreathe',schema_version:1,exported_at:new Date().toISOString(),entries:results.map(unpack),preferences:saved?JSON.parse(saved.value):DEFAULT_PREFS},200,{'content-disposition':'attachment; filename="cristybreathe-backup.json"'});
  }
  if (method==='POST' && path==='/api/import') {
    const b=await body(request,2200000);
    if (b.application!=='CristyBreathe'||b.schema_version!==1||!Array.isArray(b.entries)||!b.entries.length||b.entries.length>500) throw new ApiError('Choose a CristyBreathe backup with 1–500 entries.');
    // Validate the entire file before a transactional batch. Fresh IDs ensure restore never overwrites data or ownership.
    const now=new Date().toISOString();
    const items=b.entries.map(row=> {
      if (!row || typeof row!=='object'||Array.isArray(row)) throw new ApiError('Invalid backup entry.');
      const {id,revision,created_at,updated_at,...fields}=row;
      const timestamp=value=>{
        if(value===undefined)return now;
        if(typeof value!=='string'||value.length>30||Number.isNaN(Date.parse(value)))throw new ApiError('The backup contains an invalid timestamp.');
        return new Date(value).toISOString();
      };
      return {entry:validateEntry(fields),createdAt:timestamp(created_at),updatedAt:timestamp(updated_at)};
    });
    await env.DB.batch(items.map(item=>insert(env.DB,owner,item.entry,now,crypto.randomUUID(),item.createdAt,item.updatedAt)));
    return reply({restored:items.length},201);
  }
  const m=path.match(/^\/api\/entries\/([a-f0-9-]{36})$/);
  if (m) {
    const existing=await getEntry(env.DB,owner,m[1]);
    if (!existing) return reply({error:'This entry was not found in your space.'},404);
    if (method==='GET') return reply({entry:existing});
    if (method==='DELETE') {
      const revision=Number(request.headers.get('if-match'));
      if (!Number.isInteger(revision)||revision<1) return reply({error:'Refresh this entry before deleting.'},428);
      const result=await env.DB.prepare('DELETE FROM entries WHERE id=? AND owner=? AND revision=?').bind(m[1],owner,revision).run();
      if (!result.meta?.changes) return reply({error:'This entry changed on another device. Reload before deleting.'},409);
      return reply({deleted:true});
    }
    if (method==='PATCH') {
      const b=await body(request);
      if (!Number.isInteger(b.revision)||b.revision!==existing.revision) return reply({error:'This entry changed on another device. Your text is still open; copy it before reloading.'},409);
      const {created_at,updated_at,...previous}=existing;
      const item=validateEntry({...previous,...b,id:existing.id});
      const result=await env.DB.prepare('UPDATE entries SET kind=?,title=?,body=?,status=?,pinned=?,archived=?,priority=?,is_draft=?,collection=?,tags=?,due_date=?,deferred_until=?,updated_at=?,revision=revision+1 WHERE id=? AND owner=? AND revision=?')
        .bind(item.kind,item.title,item.body,item.status,item.pinned,item.archived,item.priority,item.is_draft,item.collection,JSON.stringify(item.tags),item.due_date,item.deferred_until,new Date().toISOString(),existing.id,owner,b.revision).run();
      if (!result.meta?.changes) return reply({error:'This entry changed on another device. Copy your text before reloading.'},409);
      return reply({entry:await getEntry(env.DB,owner,existing.id),updated:true});
    }
  }
  return reply({error:'Not found.'},404);
}

export function createWorker(assets = {}) {
  return {async fetch(request,env) {
    const requestId=crypto.randomUUID();
    try {
      const owner=await identity(request,env);
      if (!owner) return reply({error:'Please sign in through Cloudflare Access.'},401);
      const url=new URL(request.url);
      if (url.pathname.startsWith('/api/')) return await api(request,env,owner);
      if (url.pathname==='/healthz') {await env.DB.prepare('SELECT 1 AS ok').first();return reply({service:'CristyBreathe',status:'ok',version:VERSION});}
      const asset=assets[url.pathname];
      if (asset && ['GET','HEAD'].includes(request.method)) {
        const bytes=asset.base64?Uint8Array.from(atob(asset.content),c=>c.charCodeAt(0)):asset.content;
        return new Response(request.method==='HEAD'?null:bytes,{headers:{...HEADERS,'content-type':asset.type,...(url.pathname==='/sw.js'?{'service-worker-allowed':'/'}:{})}});
      }
      return reply({error:'Not found.'},404);
    } catch(error) {
      if (error instanceof ApiError) return reply({error:error.message},error.status);
      // Do not log request bodies, query strings, identity, titles, or exception messages.
      console.error(JSON.stringify({event:'request_failed',request_id:requestId,version:VERSION}));
      return reply({error:'We could not complete that request. Your open text has been kept. Please retry.',request_id:requestId},500);
    }
  }};
}
