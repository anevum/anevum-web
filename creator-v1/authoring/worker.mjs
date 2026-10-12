import {REVIEW_PANEL,REVIEW_STYLE,REVIEW_APP} from './review-snippets.mjs';
// ANEVUM Creator V1 — owner-only staging publishing studio.
// Does not provide public member authentication or grant XP/votes.
const ORIGIN = 'https://studio.next.anevum.com';
const OWNER = 'anevum-official';
const CATEGORIES = new Set(['tools','games','automation','research','creative','learning','libraries','other']);
const ID = /^[a-f0-9]{32}$/;
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,88}[a-z0-9])$/;
const BASE = {'cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','x-robots-tag':'noindex, nofollow','permissions-policy':'camera=(), microphone=(), geolocation=()'};
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";
const utf8 = text => new TextEncoder().encode(text);
function b64url(input) {
  if (!/^[A-Za-z0-9_-]+$/.test(input) || input.length > 22000) throw new Error('Invalid assertion encoding');
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
function response(data,status=200,extra={}) {return new Response(typeof data==='string'?data:JSON.stringify(data),{status,headers:{...BASE,'content-type':typeof data==='string'?'text/plain; charset=utf-8':'application/json; charset=utf-8',...extra}})}
function json(data,status=200,extra={}){return response(data,status,extra)}
function normalizedEmail(email) {return typeof email==='string'?email.trim().toLowerCase():''}
export async function verifyStaffAssertion(token,env,fetcher=fetch,now=Math.floor(Date.now()/1000)) {
  if(typeof token!=='string'||token.length>16384)throw new Error('No signed identity');
  const parts=token.split('.');if(parts.length!==3)throw new Error('Malformed identity');
  const head=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b64url(parts[0])));
  const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b64url(parts[1])));
  const issuer=String(env.STUDIO_ACCESS_ISSUER||'').replace(/\/$/,'');
  const audience=env.STUDIO_ACCESS_AUDIENCE;
  if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||!audience)throw new Error('Unconfigured identity');
  if(head?.alg!=='RS256'||typeof head.kid!=='string'||!/^[-\w]{1,200}$/.test(head.kid))throw new Error('Unexpected key');
  const aud=Array.isArray(payload?.aud)?payload.aud:[payload?.aud];
  if(payload?.iss!==issuer||!aud.includes(audience)||!Number.isFinite(payload.exp)||payload.exp<=now||
     (payload.nbf!==undefined&&(!Number.isFinite(payload.nbf)||payload.nbf>now))||
     (payload.iat!==undefined&&(!Number.isFinite(payload.iat)||payload.iat>now+60)))throw new Error('Invalid signed claims');
  const email=normalizedEmail(payload.email);
  const allow=String(env.STUDIO_ALLOWED_EMAILS||'').split(',').map(normalizedEmail).filter(Boolean);
  if(!email||!allow.includes(email))throw new Error('Unauthorized account');
  const certs=await fetcher(issuer+'/cdn-cgi/access/certs',{redirect:'error',signal:AbortSignal.timeout(7000)});
  if(!certs.ok)throw new Error('Signing keys unavailable');
  const keys=(await certs.json()).keys;
  const jwk=Array.isArray(keys)?keys.find(k=>k.kid===head.kid&&k.kty==='RSA'):null;
  if(!jwk)throw new Error('Unknown signing key');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const signature=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64url(parts[2]),utf8(parts[0]+'.'+parts[1]));
  if(!signature)throw new Error('Bad signature');
  return {email};
}
function publicUrl(input){
  if(input===null||input===undefined||input==='')return null;
  if(typeof input!=='string'||input.length>1500)throw new Error('Invalid URL');
  let u;try{u=new URL(input)}catch{throw new Error('Invalid URL')}
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||
    u.hostname.includes(':')||!u.hostname.includes('.')||
    /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(u.hostname)||
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
    [...u.searchParams.keys()].some(k=>/^(?:token|api_key|secret|password|access_token)$/i.test(k)))throw new Error('Only public HTTPS URLs without credentials are supported');
  return u.href;
}
function shortText(v,min,max,field){
  if(typeof v!=='string'||v.trim().length<min||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))throw new Error('Invalid '+field);
  return v.trim();
}
function record(input){
  const title=shortText(input.title,3,100,'title'),summary=shortText(input.summary,10,280,'summary');
  const slug=shortText(input.slug,3,90,'slug').toLowerCase();
  if(!SLUG.test(slug))throw new Error('Invalid slug');
  if(!CATEGORIES.has(input.category))throw new Error('Invalid category');
  const description=typeof input.description==='string'?shortText(input.description,0,12000,'description'):'';
  const aiDisclosure=typeof input.aiDisclosure==='string'?shortText(input.aiDisclosure,0,1200,'AI disclosure'):'';
  const humanContribution=typeof input.humanContribution==='string'?shortText(input.humanContribution,0,1200,'human contribution'):'';
  const license=typeof input.license==='string'?shortText(input.license,0,80,'license'):null;
  if(typeof input.freeToUse!=='boolean')throw new Error('Invalid free-access flag');
  return {title,summary,slug,category:input.category,description,aiDisclosure,humanContribution,license,demoUrl:publicUrl(input.demoUrl),sourceUrl:publicUrl(input.sourceUrl),freeToUse:input.freeToUse?1:0};
}
async function parseJson(req){
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers.get('content-type')||''))throw new Error('Content-Type must be application/json');
  const length=Number(req.headers.get('content-length'));
  if(Number.isFinite(length)&&length>16000)throw new Error('Request too large');
  const reader=req.body?.getReader();if(!reader)throw new Error('JSON body required');
  const chunks=[];let n=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>16000){await reader.cancel();throw new Error('Request too large')}chunks.push(value)}}finally{reader.releaseLock()}
  const b=new Uint8Array(n);let off=0;for(const chunk of chunks){b.set(chunk,off);off+=chunk.length}
  const obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
  if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Error('Object expected');
  return obj;
}
async function all(db,sql,args=[]){const stmt=db.prepare(sql);const r=await(args.length?stmt.bind(...args):stmt).all();if(r.success===false||!Array.isArray(r.results))throw new Error('Database unavailable');return r.results}
function stmt(db,sql,args=[]){const s=db.prepare(sql);return args.length?s.bind(...args):s}
async function atomic(db,statements){const results=await db.batch(statements);if(!Array.isArray(results)||results.some(r=>r.success===false))throw new Error('Database transaction failed');return results}
function safeProject(p){return {id:p.id,slug:p.slug,title:p.title,summary:p.summary,category:p.category,status:p.status,description:p.description,sourceUrl:p.source_url,demoUrl:p.demo_url,license:p.license_name,aiDisclosure:p.ai_disclosure,humanContribution:p.human_contribution,freeToUse:p.free_to_use===1,publishedAt:p.published_at,updatedAt:p.updated_at}}
const columns='id,slug,title,summary,category,status,description,source_url,demo_url,license_name,ai_disclosure,human_contribution,free_to_use,published_at,updated_at';
async function isOwner(db){const r=await all(db,"SELECT member_id FROM creator_profiles WHERE member_id=? AND is_staff=1 AND status='active'",[OWNER]);return r.length===1}
function audit(db,id,actor,action,from,to,reason){return stmt(db,'INSERT INTO project_workflow_events (id,project_id,actor,action,from_status,to_status,reason) SELECT ?,?,?,?,?,?,? WHERE changes()=1',[crypto.randomUUID(),id,actor,action,from,to,reason])}
async function updateStatus(db,projectId,actor,action,to,from,reason){
  const published=to==='published';
  const queries=[stmt(db,"UPDATE projects SET status=?, published_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_member_id=? AND status=?",[to,published?1:0,projectId,OWNER,from]),audit(db,projectId,actor,action,from,to,reason)];
  const r=await atomic(db,queries);const changes=r[0]?.meta?.changes??r[0]?.meta?.rows_written;
  return Number(changes)===1;
}
async function api(request,db,actor){
  const url=new URL(request.url),path=url.pathname;
  if(request.method==='GET'&&path==='/api/projects'){
    const projects=await all(db,'SELECT '+columns+' FROM projects WHERE owner_member_id=? ORDER BY updated_at DESC LIMIT 100',[OWNER]);
    return json({projects:projects.map(safeProject),mode:'owner-preview'});
  }
  if(request.method==='POST'&&path==='/api/projects'){
    let item;try{item=record(await parseJson(request))}catch(e){return json({error:e.message},400)}
    const id=crypto.randomUUID().replace(/-/g,'');
    try{
      await atomic(db,[
        stmt(db,"INSERT INTO projects (id,owner_member_id,slug,title,summary,description,category,status,free_to_use,license_name,source_url,demo_url,ai_disclosure,human_contribution) VALUES (?,?,?,?,?,?,?,'draft',?,?,?,?,?,?)",[id,OWNER,item.slug,item.title,item.summary,item.description,item.category,item.freeToUse,item.license,item.sourceUrl,item.demoUrl,item.aiDisclosure,item.humanContribution]),
        stmt(db,"INSERT INTO project_workflow_events(id,project_id,actor,action,from_status,to_status,reason) VALUES (?,?,?,'create',NULL,'draft','Created by verified staff')",[crypto.randomUUID(),id,actor])
      ]);
      return json({id,status:'draft'},201);
    }catch{return json({error:'Cannot create project. Check that the slug is unique.'},409)}
  }
  const edit=/^\/api\/projects\/([a-f0-9]{32})$/.exec(path);
  if(request.method==='PATCH'&&edit){
    const id=edit[1];let item;
    try{item=record(await parseJson(request))}catch(e){return json({error:e.message},400)}
    const found=await all(db,'SELECT status FROM projects WHERE id=? AND owner_member_id=?',[id,OWNER]);
    if(!found.length)return json({error:'Project not found'},404);
    if(!['draft','changes_requested'].includes(found[0].status))return json({error:'Only unapproved projects can be edited'},409);
    const status=found[0].status;
    try{
      const results=await atomic(db,[
        stmt(db,'UPDATE projects SET slug=?,title=?,summary=?,description=?,category=?,free_to_use=?,license_name=?,source_url=?,demo_url=?,ai_disclosure=?,human_contribution=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_member_id=? AND status=?',[item.slug,item.title,item.summary,item.description,item.category,item.freeToUse,item.license,item.sourceUrl,item.demoUrl,item.aiDisclosure,item.humanContribution,id,OWNER,status]),
        audit(db,id,actor,'edit',status,status,'Staff revised draft')
      ]);
      return (results[0]?.meta?.changes??results[0]?.meta?.rows_written)===1?json({id,status}):json({error:'Project changed; refresh and retry'},409);
    }catch{return json({error:'Unable to update project. Check slug uniqueness.'},409)}
  }
  const match=/^\/api\/projects\/([a-f0-9]{32})\/(submit|publish|archive)$/.exec(path);
  if(request.method==='POST'&&match){
    const [,id,action]=match;let data;
    try{data=await parseJson(request)}catch(e){return json({error:e.message},400)}
    const list=await all(db,'SELECT status,source_url,demo_url,ai_disclosure,human_contribution FROM projects WHERE id=? AND owner_member_id=? LIMIT 1',[id,OWNER]);
    if(!list.length)return json({error:'Project not found'},404);
    const p=list[0];let allowed,nowStatus,reason;
    if(action==='submit'){
      allowed=['draft','changes_requested'];nowStatus='pending_review';reason='Submitted for editorial review';
      if(!(p.source_url||p.demo_url)||!p.ai_disclosure?.trim()||!p.human_contribution?.trim())return json({error:'A source/demo URL and AI/human work disclosures are required'},422);
    }else if(action==='publish'){
      allowed=['pending_review'];nowStatus='published';
      try{reason=shortText(data.reason,10,800,'editorial reason')}catch(e){return json({error:e.message},400)}
    }else{
      allowed=['published','pending_review'];nowStatus='archived';
      try{reason=shortText(data.reason,10,800,'archive reason')}catch(e){return json({error:e.message},400)}
    }
    if(!allowed.includes(p.status))return json({error:'Action not permitted for this project state'},409);
    try{const changed=await updateStatus(db,id,actor,action,nowStatus,p.status,reason);return changed?json({id,status:nowStatus}):json({error:'Project changed; refresh and retry'},409)}catch{return json({error:'Project transition unavailable'},503)}
  }
  if(request.method==='GET'&&path==='/api/review-queue'){
    const rows=await all(db,`SELECT p.id,p.slug,p.title,p.summary,p.description,p.category,p.source_url,p.demo_url,p.ai_disclosure,p.human_contribution,p.free_to_use,p.revision,p.updated_at,c.handle AS creatorHandle,c.display_name AS creatorName
      FROM projects p JOIN member_accounts a ON a.id=p.owner_member_id JOIN creator_profiles c ON c.member_id=a.id
      WHERE p.status='pending_review' AND a.status='active' AND c.status='active'
      ORDER BY p.updated_at ASC,p.id ASC LIMIT 100`);
    return json({projects:rows.map(p=>({id:p.id,slug:p.slug,title:p.title,summary:p.summary,description:p.description,category:p.category,demoUrl:p.demo_url,sourceUrl:p.source_url,aiDisclosure:p.ai_disclosure,humanContribution:p.human_contribution,freeToUse:p.free_to_use===1,revision:p.revision,creatorHandle:p.creatorHandle,creatorName:p.creatorName}))});
  }
  const review=/^\/api\/review-queue\/([a-f0-9]{32})\/(publish|request-changes|reject)$/.exec(path);
  if(request.method==='POST'&&review){
    const [,id,action]=review;let payload;try{payload=await parseJson(request)}catch(e){return json({error:e.message},400)}
    let reason;try{reason=shortText(payload.reason,10,800,'review reason')}catch(e){return json({error:e.message},400)}
    if(!Number.isSafeInteger(payload.revision)||payload.revision<1)return json({error:'Current revision required'},400);
    const projects=await all(db,`SELECT p.revision,p.status,p.source_url,p.demo_url,p.ai_disclosure,p.human_contribution
      FROM projects p JOIN member_accounts a ON a.id=p.owner_member_id JOIN creator_profiles c ON c.member_id=a.id
      WHERE p.id=? AND p.status='pending_review' AND a.status='active' AND c.status='active'`,[id]);
    if(!projects.length)return json({error:'Submission not found or no longer pending'},404);
    const item=projects[0];if(item.revision!==payload.revision)return json({error:'Submission changed; refresh queue'},409);
    if(action==='publish'&&(!(item.demo_url||item.source_url)||!item.ai_disclosure?.trim()||!item.human_contribution?.trim()))return json({error:'Cannot publish incomplete submission'},422);
    const to=action==='publish'?'published':action==='request-changes'?'changes_requested':'rejected';
    try{
      const result=await atomic(db,[
        stmt(db,`UPDATE projects SET status=?,revision=revision+1,published_at=CASE WHEN ?='published' THEN CURRENT_TIMESTAMP ELSE published_at END,updated_at=CURRENT_TIMESTAMP
          WHERE id=? AND revision=? AND status='pending_review' AND owner_member_id IN (SELECT id FROM member_accounts WHERE status='active')`,[to,to,id,payload.revision]),
        stmt(db,`INSERT INTO project_submission_events(id,project_id,actor_kind,actor_identity,action,from_status,to_status,reason)
          SELECT ?,?,'staff',? ,?,'pending_review',?,? WHERE changes()=1`,[crypto.randomUUID(),id,actor,action==='request-changes'?'request_changes':action,to,reason])
      ]);
      if(Number(result[0]?.meta?.changes??result[0]?.meta?.rows_written)!==1)return json({error:'Submission changed; refresh queue'},409);
      return json({id,status:to,revision:payload.revision+1});
    }catch{return json({error:'Review transaction unavailable'},503)}
  }
  return json({error:'Not found'},404);
}
const PAGE=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ANEVUM / Creator Studio</title><link rel="stylesheet" href="/studio.css"></head><body><header><span class="mark">◬</span><strong>ANEVUM</strong><span class="muted">/ CREATOR STUDIO</span><span class="pill">STAGING ONLY</span></header><main><h1>Publish the first real projects.</h1><p class="muted">This staff-only tool writes to the separate staging database. Submissions begin as drafts and require review before publication.</p><section class="layout"><form id="newProject"><h2>New project draft</h2><label>Title<input name="title" minlength="3" maxlength="100" required></label><label>Slug<input name="slug" placeholder="my-first-tool" pattern="[a-z0-9-]+" required></label><label>Category<select name="category"><option>tools</option><option>games</option><option>automation</option><option>research</option><option>creative</option><option>learning</option><option>libraries</option><option>other</option></select></label><label>Summary<textarea name="summary" minlength="10" maxlength="280" required></textarea></label><label>Description<textarea name="description" maxlength="12000"></textarea></label><label>Live demo (HTTPS)<input name="demoUrl" type="url" placeholder="https://..."></label><label>Source (HTTPS)<input name="sourceUrl" type="url" placeholder="https://github.com/..."></label><label>License<input name="license" placeholder="MIT / Proprietary / Other"></label><label>What AI assisted with<textarea name="aiDisclosure" required></textarea></label><label>Human work / verification<textarea name="humanContribution" required></textarea></label><label class="inline"><input type="checkbox" name="freeToUse" checked> Free to use</label><button type="submit">Save draft</button><p id="feedback" role="status"></p></form><section class="panel"><h2>Owner submissions</h2><p class="muted">Only real submissions appear here. Publish requires a recorded editorial reason.</p><button id="reload" type="button" class="secondary">Refresh</button><div id="projects" aria-live="polite">Loading...</div></section></section></main><script type="module" src="/studio.js"></script></body></html>`;
const STYLE=`:root{color-scheme:dark;--bg:#080b13;--panel:#141826;--border:#303349;--accent:#ff9b45;--text:#f4f2f7;--muted:#adb2c4}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 25% 0%,#38213a 0%,transparent 34%),var(--bg);font:15px/1.5 system-ui,sans-serif;color:var(--text)}header{display:flex;align-items:center;gap:14px;border-bottom:1px solid var(--border);padding:16px max(20px,calc((100vw - 1140px)/2))}.mark{color:var(--accent);font-size:28px}.pill{margin-left:auto;background:#633b1a;color:#ffd9a8;padding:5px 10px;border-radius:99px;font-size:11px;font-weight:700}main{max-width:1140px;margin:auto;padding:36px 20px}h1{font-size:clamp(28px,4vw,46px);letter-spacing:-.035em;line-height:1.1}h2{font-size:18px}.muted{color:var(--muted)}.layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:20px;margin-top:28px}form,.panel{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:22px;min-width:0}label{display:block;margin:15px 0;font-weight:650;font-size:13px}input,textarea,select{display:block;width:100%;margin-top:6px;background:#080c18;color:var(--text);border:1px solid #48506a;border-radius:7px;padding:10px;font:inherit}textarea{min-height:70px;resize:vertical}.inline{display:flex;align-items:center;gap:8px}.inline input{width:auto;margin:0}button{background:var(--accent);border:0;color:#201208;font:700 14px system-ui;border-radius:8px;padding:11px 16px;cursor:pointer}.secondary{background:#252d40;color:var(--text)}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid #ffcc90;outline-offset:2px}.entry{padding:18px 0;border-bottom:1px solid var(--border);overflow-wrap:anywhere}.entry b{display:block}.entry small{color:var(--muted)}.entry button{margin:8px 6px 0 0;font-size:12px}.error{color:#f99}#feedback{min-height:1em}@media(max-width:740px){.layout{grid-template-columns:1fr}main{padding:20px 14px}header{padding:12px 14px}.pill{font-size:10px}}`;
const APP=`const root=document.getElementById('projects'),msg=document.getElementById('feedback');async function api(path,options){const r=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...options});let o;try{o=await r.json()}catch{o={error:'Unexpected server response'}}if(!r.ok)throw Error(o.error||'Request failed');return o}async function load(){root.replaceChildren();try{const {projects}=await api('/api/projects');if(!projects.length){root.textContent='No projects in staging yet.';return}for(const p of projects){const div=document.createElement('div');div.className='entry';const name=document.createElement('b');name.textContent=p.title;const status=document.createElement('small');status.textContent=p.status+' · '+p.slug;div.append(name,status);const actions=p.status==='draft'?[['edit','Edit draft'],['submit','Submit for review']]:p.status==='pending_review'?[['publish','Publish'],['archive','Archive']]:p.status==='published'?[['archive','Archive']]:[];for(const [action,text] of actions){const b=document.createElement('button');b.textContent=text;b.type='button';b.onclick=async()=>{if(action==='edit'){const f=document.getElementById('newProject');for(const [key,value] of Object.entries(p)){const field=f.elements.namedItem(key);if(!field)continue;if(key==='freeToUse')field.checked=value;else field.value=value??''}f.dataset.editId=p.id;f.querySelector('button[type=submit]').textContent='Save changes';f.scrollIntoView({behavior:'smooth'});return;}const reason=action==='submit'?'':prompt('Record an editorial reason for '+action+':');if(action!=='submit'&&(!reason||reason.length<10))return;try{await api('/api/projects/'+p.id+'/'+action,{method:'POST',body:JSON.stringify({reason})});await load()}catch(err){alert(err.message)}};div.append(b)}root.append(div)}}catch(e){root.textContent='Cannot load projects: '+e.message}}document.getElementById('newProject').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,d=new FormData(f);const fields=Object.fromEntries(d.entries());fields.freeToUse=d.has('freeToUse');try{const id=f.dataset.editId;const o=await api(id?'/api/projects/'+id:'/api/projects',{method:id?'PATCH':'POST',body:JSON.stringify(fields)});msg.textContent=(id?'Updated draft ':'Saved draft ')+o.id;f.reset();delete f.dataset.editId;f.querySelector('button[type=submit]').textContent='Save draft';await load()}catch(err){msg.textContent=err.message;msg.className='error'}});document.getElementById('reload').addEventListener('click',load);load();`;
export default {async fetch(request,env){
  const url=new URL(request.url);if(url.origin!==ORIGIN)return response({error:'Not found'},404);
  // Cloudflare Access must protect the full hostname, but signed verification is
  // enforced again by the Worker. No unverified path can disclose studio data.
  let principal;
  try{principal=await verifyStaffAssertion(request.headers.get('cf-access-jwt-assertion'),env)}catch{return response({error:'Owner authentication required'},401)}
  if(!env.COMMUNITY_DB)return response({error:'Staging data unavailable'},503);
  try{if(!await isOwner(env.COMMUNITY_DB))return response({error:'Studio not provisioned'},503)}catch{return response({error:'Staging data unavailable'},503)}
  const p=url.pathname;
  if(request.method==='GET'&&p==='/')return new Response(PAGE.replace('</main>',REVIEW_PANEL+'</main>'),{headers:{...BASE,'content-type':'text/html; charset=utf-8','content-security-policy':CSP}});
  if(request.method==='GET'&&p==='/studio.css')return new Response(STYLE+'\n'+REVIEW_STYLE,{headers:{...BASE,'content-type':'text/css; charset=utf-8'}});
  if(request.method==='GET'&&p==='/studio.js')return new Response(APP+'\n'+REVIEW_APP,{headers:{...BASE,'content-type':'text/javascript; charset=utf-8'}});
  if(request.method==='GET'&&p==='/health')return json({status:'ok',service:'anevum-creator-studio',mode:'staging'});
  if(!p.startsWith('/api/'))return response({error:'Not found'},404);
  if(!['GET','POST','PATCH'].includes(request.method))return json({error:'Method not allowed'},405,{allow:'GET, POST, PATCH'});
  if(request.method==='POST'||request.method==='PATCH'){
    if(request.headers.get('origin')!==ORIGIN)return json({error:'Origin rejected'},403);
    if(request.headers.get('sec-fetch-site')&&!['same-origin','none'].includes(request.headers.get('sec-fetch-site')))return json({error:'Cross-site request rejected'},403);
  }
  try{return await api(request,env.COMMUNITY_DB,principal.email)}catch{return json({error:'Staging operation unavailable'},503)}
}};