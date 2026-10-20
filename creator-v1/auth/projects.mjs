// ANEVUM V1: member-owned drafts and submission (staging only).
// Authentication and Origin/Fetch Metadata enforcement are in worker.mjs.
const CATEGORIES=new Set(['tools','games','automation','research','creative','learning','libraries','other']);
const ID=/^[a-f0-9]{32}$/;
const SLUG=/^[a-z0-9](?:[a-z0-9-]{1,88}[a-z0-9])$/;
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'};
const respond=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...HEADERS,...extra}});
const text=(v,min,max,label)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v))throw Error(`Invalid ${label}`);return v.trim()};
const https=(v)=>{
 if(v===null||v===undefined||v==='')return null;
 if(typeof v!=='string'||v.length>1500)throw Error('Invalid external URL');
 let u;try{u=new URL(v)}catch{throw Error('Invalid external URL')}
 if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||u.hostname.includes(':')||!u.hostname.includes('.')||
  /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(u.hostname)||/^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
  [...u.searchParams.keys()].some(k=>/^(?:token|api_key|secret|password|access_token)$/i.test(k)))throw Error('Only public HTTPS links without credentials are supported');
 return u.href;
};
async function jsonBody(req){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))throw Error('JSON body required');
 if(Number(req.headers.get('content-length'))>16000)throw Error('Request too large');
 const reader=req.body?.getReader();if(!reader)throw Error('JSON body required');
 let total=0;const parts=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>16000){await reader.cancel();throw Error('Request too large')}parts.push(value)}}finally{reader.releaseLock()}
 const buf=new Uint8Array(total);let offset=0;for(const part of parts){buf.set(part,offset);offset+=part.length}
 const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buf));
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('JSON object required');
 return value;
}
function validated(v){
 const slug=text(v.slug,3,90,'slug').toLowerCase();if(!SLUG.test(slug))throw Error('Invalid slug');
 const title=text(v.title,3,100,'title'),summary=text(v.summary,10,280,'summary');
 if(!CATEGORIES.has(v.category))throw Error('Invalid category');
 if(typeof v.freeToUse!=='boolean')throw Error('Invalid free-use setting');
 const description=v.description==null?'':text(v.description,0,8000,'description');
 const aiDisclosure=v.aiDisclosure==null?'':text(v.aiDisclosure,0,1200,'AI disclosure');
 const humanContribution=v.humanContribution==null?'':text(v.humanContribution,0,1200,'human contribution');
 const license=v.license==null||v.license===''?null:text(v.license,1,80,'license');
 return {slug,title,summary,category:v.category,freeToUse:v.freeToUse?1:0,description,aiDisclosure,humanContribution,license,sourceUrl:https(v.sourceUrl),demoUrl:https(v.demoUrl)};
}
const row=(p)=>({id:p.id,slug:p.slug,title:p.title,summary:p.summary,description:p.description,category:p.category,freeToUse:p.free_to_use===1,sourceUrl:p.source_url,demoUrl:p.demo_url,license:p.license_name,aiDisclosure:p.ai_disclosure,humanContribution:p.human_contribution,status:p.status,revision:p.revision,publishedAt:p.published_at,updatedAt:p.updated_at});
function q(db,sql,args=[]){const s=db.prepare(sql);return args.length?s.bind(...args):s}
async function list(db,sql,args=[]){const r=await q(db,sql,args).all();if(r.success===false||!Array.isArray(r.results))throw Error('Database unavailable');return r.results;}
async function run(db,sql,args=[]){const r=await q(db,sql,args).run();if(r.success===false)throw Error('Database unavailable');return r;}
async function atomic(db,queries){const r=await db.batch(queries);if(!Array.isArray(r)||r.some(x=>x.success===false))throw Error('Database unavailable');return r}
const cols='id,slug,title,summary,description,category,free_to_use,source_url,demo_url,license_name,ai_disclosure,human_contribution,status,revision,published_at,updated_at';
const event=(db,id,actor,action,from,to,reason)=>q(db,`INSERT INTO project_submission_events(id,project_id,actor_kind,actor_identity,action,from_status,to_status,reason) SELECT ?,?,'creator',?,?,?,?,? WHERE changes()=1`,[crypto.randomUUID(),id,actor,action,from,to,reason]);
const revision=(v)=>Number.isSafeInteger(v)&&v>=1&&v<=2147483647;
export async function creatorProjects(req,db,member,limiter,now){
 const path=new URL(req.url).pathname.replace(/^\/api\/v1\/member/,'');
 const collection=path==='/projects',match=/^\/projects\/([a-f0-9]{32})(?:\/(submit))?$/.exec(path);
 if(!collection&&!match)return respond({error:'Not found'},404);
 if(!member)return respond({error:'Sign-in required'},401);
 if(!member.handle)return respond({error:'Complete your creator profile first'},409);
 const active=await list(db,"SELECT member_id FROM creator_profiles WHERE member_id=? AND status='active'",[member.id]);
 if(active.length!==1)return respond({error:'Creator profile unavailable'},403);
 const owner=member.id;
 if(collection&&['GET','HEAD'].includes(req.method)){
  const rows=await list(db,`SELECT ${cols} FROM projects WHERE owner_member_id=? ORDER BY updated_at DESC,id DESC LIMIT 50`,[owner]);
  return respond({projects:rows.map(row)});
 }
 if(match&&match[2]===undefined&&['GET','HEAD'].includes(req.method)){
  const entries=await list(db,`SELECT ${cols} FROM projects WHERE id=? AND owner_member_id=?`,[match[1],owner]);
  if(!entries.length)return respond({error:'Project not found'},404);
  const feedback=await list(db,"SELECT action,to_status,reason,created_at FROM project_submission_events WHERE project_id=? AND actor_kind='staff' ORDER BY rowid DESC LIMIT 5",[match[1]]);
  return respond({project:row(entries[0]),reviewHistory:feedback});
 }
 if(!['POST','PATCH'].includes(req.method))return respond({error:'Method not allowed'},405,{'allow':'GET, HEAD, POST, PATCH'});
 // Rate limiting is shared with the Member Worker and fails closed when D1 unavailable.
 if(!await limiter(db,`project:${owner}`,now,30,3600))return respond({error:'Too many project updates'},429);
 if(collection&&req.method==='POST'){
  let data;try{data=validated(await jsonBody(req))}catch(e){return respond({error:e.message||'Invalid project'},400)}
  const count=await list(db,"SELECT COUNT(*) AS n FROM projects WHERE owner_member_id=? AND status IN ('draft','changes_requested','pending_review')",[owner]);
  if(Number(count[0]?.n||0)>=20)return respond({error:'Active project limit reached'},429);
  const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
  try{
   const r=await atomic(db,[q(db,`INSERT INTO projects(id,owner_member_id,slug,title,summary,description,category,status,free_to_use,license_name,source_url,demo_url,ai_disclosure,human_contribution,revision)
    VALUES (?,?,?,?,?,?,?,'draft',?,?,?,?,?,?,1)`,[id,owner,data.slug,data.title,data.summary,data.description,data.category,data.freeToUse,data.license,data.sourceUrl,data.demoUrl,data.aiDisclosure,data.humanContribution]),
    event(db,id,owner,'create',null,'draft','Draft created by verified member')]);
   if(Number(r[0]?.meta?.changes??r[0]?.meta?.rows_written)!==1)return respond({error:'Could not create draft'},503);
   return respond({id,status:'draft',revision:1},201);
  }catch{return respond({error:'Project could not be saved; check the slug and try again'},409)}
 }
 if(!match)return respond({error:'Not found'},404);
 const id=match[1];const results=await list(db,`SELECT ${cols} FROM projects WHERE id=? AND owner_member_id=?`,[id,owner]);
 if(!results.length)return respond({error:'Project not found'},404);
 const current=results[0];
 if(req.method==='PATCH'&&!match[2]){
  let input,data;try{input=await jsonBody(req);data=validated(input)}catch(e){return respond({error:e.message||'Invalid update'},400)}
  if(!revision(input.revision))return respond({error:'Current project revision required'},400);
  if(!['draft','changes_requested'].includes(current.status))return respond({error:'Project is locked for review'},409);
  if(current.revision!==input.revision)return respond({error:'Project changed; refresh first'},409);
  try{
   const out=await atomic(db,[q(db,`UPDATE projects SET slug=?,title=?,summary=?,description=?,category=?,free_to_use=?,license_name=?,source_url=?,demo_url=?,ai_disclosure=?,human_contribution=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP
     WHERE id=? AND owner_member_id=? AND revision=? AND status IN ('draft','changes_requested')`,[data.slug,data.title,data.summary,data.description,data.category,data.freeToUse,data.license,data.sourceUrl,data.demoUrl,data.aiDisclosure,data.humanContribution,id,owner,input.revision]),
     event(db,id,owner,'edit',current.status,current.status,'Member updated project draft')]);
   if(Number(out[0]?.meta?.changes??out[0]?.meta?.rows_written)!==1)return respond({error:'Project changed; refresh first'},409);
   return respond({id,status:current.status,revision:input.revision+1});
  }catch{return respond({error:'Update failed; check the slug and retry'},409)}
 }
 if(req.method==='POST'&&match[2]==='submit'){
  let input;try{input=await jsonBody(req)}catch(e){return respond({error:e.message||'Invalid request'},400)}
  if(!revision(input.revision))return respond({error:'Current project revision required'},400);
  if(current.revision!==input.revision)return respond({error:'Project changed; refresh first'},409);
  if(!['draft','changes_requested'].includes(current.status))return respond({error:'Project already submitted'},409);
  if(!(current.source_url||current.demo_url)||current.ai_disclosure?.trim().length<10||current.human_contribution?.trim().length<10)
   return respond({error:'A source or demo link and meaningful AI/human contribution disclosures are required'},422);
  if(!await limiter(db,`submit:${owner}`,now,6,86400))return respond({error:'Submission limit reached'},429);
  try{
   const out=await atomic(db,[q(db,"UPDATE projects SET status='pending_review',revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_member_id=? AND revision=? AND status IN ('draft','changes_requested')",[id,owner,input.revision]),
     event(db,id,owner,'submit',current.status,'pending_review','Submitted for editorial review')]);
   if(Number(out[0]?.meta?.changes??out[0]?.meta?.rows_written)!==1)return respond({error:'Project changed; refresh first'},409);
   return respond({id,status:'pending_review',revision:input.revision+1});
  }catch{return respond({error:'Submission unavailable'},503)}
 }
 return respond({error:'Not found'},404);
}