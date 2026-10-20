// ANEVUM.IREN.BUILD.2026-10-19.001.VERIFIED-ROLE-APPROVALS
// Independent optional Worker. No live route, grant or migration is created.
const PAGE = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><meta name=\"theme-color\" content=\"#07111f\"><title>IREN | Verified Insignias | ANEVUM</title><link rel=\"stylesheet\" href=\"/staff/insignias/styles.css\"><script src=\"/staff/insignias/app.js\" defer></script></head><body><main class=\"stage\"><header class=\"masthead\"><div><div class=\"kicker\">ANEVUM / IREN / CONTINUANCE INSTITUTE</div><h1>Verified <em>insignias.</em></h1><p>Independently approved public designation marks. No staff permissions, XP, or private rewards are issued here.</p></div><nav aria-label=\"Operations navigation\"><a href=\"/staff/observatory\">Staff observatory</a><a href=\"/staff/projects\">Project reviews</a><a href=\"/member\">My member world</a></nav></header><div id=\"notice\" class=\"notice\" role=\"status\">Verifying institutional role ledger...</div><div id=\"error\" class=\"error\" role=\"alert\" hidden></div><section class=\"columns\"><article class=\"panel\"><div class=\"eyebrow\">REVIEW REGISTRY / TWO-PERSON CONTROL</div><h2>Pending nominations</h2><p class=\"minor\">A nomination requires an owner. Only a different authorized reviewer can issue the designation after examining the linked evidence.</p><div id=\"queue\" class=\"queue\"><div class=\"empty\">Connecting...</div></div><button type=\"button\" id=\"refresh\" class=\"button\">Refresh verified queue</button></article><article class=\"panel\"><div class=\"eyebrow\">OWNER CLEARANCE / NOMINATIONS</div><h2>Member identity registry</h2><p class=\"minor\">Founder, Administrator, Moderator, and Curator are separate from staff clearance and personal aura. Review-case references must not expose private information.</p><div id=\"ownerTools\" hidden><form id=\"memberSearchForm\"><label for=\"memberSearch\">Find verified member by name or handle</label><div class=\"search-row\"><input id=\"memberSearch\" type=\"search\" maxlength=\"64\" placeholder=\"Search members\" autocomplete=\"off\"><button class=\"button\" type=\"submit\">Find</button></div></form><div id=\"members\" class=\"members\"></div></div><div id=\"reviewerInfo\" class=\"empty\">Member search and nominations require owner clearance.</div></article></section><footer>IREN / AUDITED INSTITUTIONAL IDENTITY · Public display requires a separate approved release.</footer></main></body></html>";
const STYLES = ":root{color-scheme:dark;--bg:#070f1b;--panel:#11243a;--line:#314e68;--white:#f1f6fd;--muted:#b3c9dc;--gold:#e1c38d;--cyan:#a4ddea}*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--white);background:radial-gradient(ellipse at 18% -10%,#203d59,#070f1b 64%);min-height:100vh}.stage{width:min(100% - 32px,1150px);margin:auto;padding:38px 0 22px}h1,h2,p{margin-top:0}h1{font-size:clamp(32px,5vw,62px);line-height:1.05;letter-spacing:-.045em;margin:8px 0 16px}h1 em{font-style:normal;color:var(--gold)}h2{font-size:21px;letter-spacing:-.02em;margin-bottom:5px}.kicker,.eyebrow{color:var(--gold);font:700 10px/1.4 ui-monospace,monospace;letter-spacing:.17em}.masthead{display:flex;justify-content:space-between;gap:18px;align-items:end;padding:25px 8px 30px}.masthead p,.minor{color:var(--muted);max-width:60ch}.masthead nav{display:flex;gap:7px;flex-wrap:wrap;justify-content:end}.masthead nav a,.button{border-radius:8px;padding:9px 12px;background:#172f49;border:1px solid #52718a;color:#e7f2fb;font-weight:650;text-decoration:none;cursor:pointer;font-size:12px;line-height:1.4}.button:hover,.masthead nav a:hover{border-color:var(--gold)}.notice{background:#102c3e;border:1px solid #41748a;color:#d7effa;padding:13px 15px;border-radius:11px;margin:0 0 15px;font-size:13px}.notice.disabled{background:#282318;border-color:#796444;color:#ead5ac}.error{color:#ffceba;border:1px solid #a36b60;padding:11px;background:#3b211e;border-radius:8px;margin:0 0 12px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}.panel{border:1px solid #344d67;background:linear-gradient(152deg,#10263c,#0b1b2e);box-shadow:0 13px 40px #01071387;border-radius:16px;padding:21px;min-width:0}.panel h2{margin-top:9px}.minor{font-size:12px}.queue,.members{display:grid;gap:10px;margin:18px 0}.member,.request{border:1px solid #3f5b74;border-radius:10px;padding:13px;background:#102236;display:grid;gap:9px;min-width:0}.member strong,.request strong{font-size:15px;letter-spacing:.015em}.small,.member small,.request small{font-size:11px;color:var(--muted);overflow-wrap:anywhere}.tag{display:inline-flex;padding:4px 8px;border:1px solid #af9876;border-radius:7px;color:#edcfa1;background:#c2984324;letter-spacing:.06em;font:800 10px/1.25 ui-monospace,monospace;text-transform:uppercase}.request-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.role-actions{display:flex;flex-wrap:wrap;align-items:center;gap:7px}.role-actions .button{min-height:40px}.danger{border-color:#9c6557;color:#ffd8c6}.evidence{color:#bedbed;font-size:12px;overflow-wrap:anywhere}.empty{color:#a5bed0;font-size:12px;padding:20px;border:1px dashed #3e586b;border-radius:10px;text-align:center}label{display:block;font-size:12px;color:#d9e6f3;margin:12px 0 6px}.search-row{display:flex;gap:8px}.search-row input{flex:1}.search-row input,select,input[type=url]{min-width:0;max-width:100%;padding:11px;border:1px solid #54718a;border-radius:8px;background:#07182b;color:#f3f8fe;font-size:13px}input[type=url]{width:100%;font-size:12px}select{min-width:128px}button:disabled{opacity:.5;cursor:not-allowed}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--gold);outline-offset:3px}footer{padding:28px 8px;color:#8daabd;font:700 10px/1.5 ui-monospace,monospace;letter-spacing:.08em}a{color:#c3e6ff}@media(max-width:800px){.columns{grid-template-columns:1fr}.masthead{flex-direction:column;align-items:start}.masthead nav{justify-content:start}.stage{width:min(100% - 24px,700px);padding-top:18px}}@media(max-width:390px){.panel{padding:14px}.masthead nav{gap:5px}.masthead nav a{font-size:11px;padding:7px}.role-actions .button{flex:1}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}";
const CLIENT = "(()=>{\n'use strict';\nconst BASE='/staff/insignias/api/';\nconst $=id=>document.getElementById(id);\nconst esc=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\nconst CASE=/^https:\\/\\/github\\.com\\/anevum\\/anevum-web\\/(?:issues|pull)\\/[1-9][0-9]{0,8}$/;\nconst ROLES=['founder','administrator','moderator','curator'];\nconst state={role:'reviewer',enabled:false,requests:[],members:[]};\nfunction tell(message,error=false){$(error?'error':'notice').textContent=message;$(error?'error':'notice').hidden=!message;}\nasync function get(url){const r=await fetch(BASE+url,{method:'GET',credentials:'same-origin',redirect:'error',cache:'no-store',headers:{accept:'application/json'}});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'Registry unavailable');return data;}\nasync function post(action,payload){const r=await fetch(BASE+action,{method:'POST',credentials:'same-origin',redirect:'error',cache:'no-store',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'Designation change rejected');return data;}\nfunction renderQueue(){\n $('queue').innerHTML=!state.enabled?'<div class=\"empty\">Role ledger not yet activated.</div>':!state.requests.length?'<div class=\"empty\">No pending nominations.</div>':state.requests.map(r=>{\n  const link=typeof r.evidenceRef==='string'&&CASE.test(r.evidenceRef)?'<a class=\"evidence\" href=\"'+esc(r.evidenceRef)+'\" target=\"_blank\" rel=\"noopener noreferrer\">Review evidence case ↗</a>':'<small>Case reference unavailable</small>';\n  const review=state.role==='reviewer'&&!r.nominatedByMe&&!r.targetsMe?\n   '<div class=\"role-actions\"><button class=\"button\" data-decision=\"approved\" data-request=\"'+esc(r.id)+'\" type=\"button\">Approve mark</button><button class=\"button danger\" data-decision=\"rejected\" data-request=\"'+esc(r.id)+'\" type=\"button\">Reject</button></div>':\n   '<small>Awaiting a different authorized reviewer.</small>';\n  return '<article class=\"request\"><div class=\"request-head\"><strong>'+esc(r.memberName||'Member')+(r.handle?' <small>@'+esc(r.handle)+'</small>':'')+'</strong><span class=\"tag\">'+esc(r.role)+'</span></div><small>Proposed '+new Date(Number(r.nominatedAt)*1000).toLocaleDateString()+'</small>'+link+review+'</article>';\n }).join('');\n}\nfunction renderMembers(){\n $('members').innerHTML=!state.members.length?'<div class=\"empty\">No matching verified members.</div>':state.members.map(m=>\n  '<article class=\"member\" data-member=\"'+esc(m.id)+'\"><div><strong>'+esc(m.name||'Member')+'</strong> '+(m.handle?'<small>@'+esc(m.handle)+'</small>':'')+'</div><span class=\"small\">Active public seal: '+esc(m.designation||'none')+'</span>'+\n  '<label>Proposed designation<select data-role>'+ROLES.map(r=>'<option value=\"'+r+'\">'+r+'</option>').join('')+'</select></label>'+\n  '<label>Documented ANEVUM review case<input data-evidence type=\"url\" placeholder=\"https://github.com/anevum/anevum-web/issues/123\" spellcheck=\"false\" autocomplete=\"off\"></label>'+\n  '<div class=\"role-actions\"><button data-nominate type=\"button\" class=\"button\">Nominate for independent review</button>'+\n   (m.designation?'<button data-revoke type=\"button\" class=\"button danger\">Revoke '+esc(m.designation)+'</button>':'')+'</div></article>'\n ).join('');\n}\nasync function loadQueue(){\n const data=await get('queue');state.enabled=data.enabled===true;state.role=data.clearance==='owner'?'owner':'reviewer';state.requests=Array.isArray(data.requests)?data.requests:[];\n $('ownerTools').hidden=!state.enabled||state.role!=='owner';$('reviewerInfo').hidden=state.enabled&&state.role==='owner';\n $('notice').classList.toggle('disabled',!state.enabled);\n tell(state.enabled?'Audited role approvals are available. Public display still requires a separate approved release.':'Display-role operations are disabled until schema review, migration and explicit activation.');\n renderQueue();\n}\nasync function loadMembers(){\n if(!state.enabled||state.role!=='owner')return;\n const q=$('memberSearch').value.trim();\n if(q.length>64){tell('Search exceeds the 64-character limit.',true);return;}\n const d=await get('members?q='+encodeURIComponent(q));state.members=Array.isArray(d.members)?d.members:[];renderMembers();\n}\nasync function act(request,decision){\n if(state.role!=='reviewer'||!state.enabled)return;\n if(!window.confirm((decision==='approved'?'Approve':'Reject')+' this public-display mark after independent evidence review? No staff permissions change.'))return;\n try{await post('review',{requestId:request,decision});await loadQueue();tell('Independent decision recorded.')}\n catch(e){tell(e.message||'Review unavailable',true)}\n}\nasync function nominate(card){\n if(state.role!=='owner'||!state.enabled)return;\n const role=card.querySelector('[data-role]')?.value,evidenceRef=card.querySelector('[data-evidence]')?.value?.trim();\n if(!ROLES.includes(role)||!CASE.test(evidenceRef||'')){tell('Choose a role and a valid ANEVUM GitHub issue or PR URL without personal details.',true);return;}\n const memberId=card.dataset.member;\n if(!window.confirm('Propose '+role+'? A different reviewer must approve this display-only designation.'))return;\n try{await post('nominate',{memberId,role,evidenceRef});await loadQueue();await loadMembers();tell('Nomination submitted for independent review.')}\n catch(e){tell(e.message||'Nomination unavailable',true)}\n}\nasync function revoke(card){\n if(state.role!=='owner'||!state.enabled)return;\n const memberId=card.dataset.member,m=state.members.find(x=>x.id===memberId);\n if(!m?.designation||!window.confirm('Revoke public '+m.designation+' designation? Staff access is unchanged.'))return;\n try{await post('revoke',{memberId,role:m.designation});await loadMembers();await loadQueue();tell('Designation revoked; staff permissions unchanged.')}\n catch(e){tell(e.message||'Revocation unavailable',true)}\n}\n$('refresh').addEventListener('click',()=>loadQueue().catch(e=>tell(e.message,true)));\n$('memberSearchForm').addEventListener('submit',event=>{event.preventDefault();loadMembers().catch(e=>tell(e.message,true))});\ndocument.addEventListener('click',event=>{\n const target=event.target.closest('button');if(!target)return;\n if(target.hasAttribute('data-decision'))act(target.dataset.request,target.dataset.decision);\n const card=target.closest('[data-member]');if(!card)return;\n if(target.hasAttribute('data-nominate'))nominate(card);\n if(target.hasAttribute('data-revoke'))revoke(card);\n});\nloadQueue().catch(e=>tell(e.message||'Role ledger unavailable',true));\n})();";

const ORIGIN = 'https://anevum.com';
const BASE = '/staff/insignias';
const HEADERS = Object.freeze({
  'cache-control': 'private, no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'referrer-policy': 'no-referrer',
  'vary': 'Cookie',
});
const CSP = [
  "default-src 'none'", "script-src 'self'", "style-src 'self'",
  "connect-src 'self'", "img-src 'self' data:", "font-src 'self'",
  "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'",
  "object-src 'none'",
].join('; ');

function respond(body, status = 200, contentType = 'application/json; charset=utf-8', isPage = false) {
  const headers = { ...HEADERS, 'content-type': contentType };
  if (isPage) headers['content-security-policy'] = CSP;
  return new Response(body, { status, headers });
}
const json = (value, status = 200) => respond(JSON.stringify(value), status);
const error = (status, message) => json({ error: message }, status);

async function getStaff(request, env) {
  if (!env || !env.APEX_AUTH || !env.MEMBER_DB) return null;
  const cookie = request.headers.get('cookie');
  if (!cookie || cookie.length > 8192) return null;
  try {
    const identity = new Request(`${ORIGIN}/api/v1/member/auth/get-session`, {
      method: 'GET',
      headers: { cookie, accept: 'application/json' },
      redirect:"manual",
      cache: 'no-store',
    });
    const result = await env.APEX_AUTH.fetch(identity);
    if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) return null;
    const { session, user } = await result.json();
    if (!session || !user || typeof user.id !== 'string' || user.id.length < 1 || user.id.length > 128 ||
        typeof session.id !== 'string' || session.id.length === 0 ||
        session.userId !== user.id || user.emailVerified !== true ||
        typeof session.expiresAt !== 'string' || !Number.isFinite(Date.parse(session.expiresAt)) ||
        Date.parse(session.expiresAt) <= Date.now()) return null;
    const grant = await env.MEMBER_DB.prepare(
      'SELECT g.role FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id ' +
      'WHERE g.member_id=? AND g.revoked_at IS NULL AND u.emailVerified=1 LIMIT 1'
    ).bind(user.id).first();
    if (!grant || !['owner', 'reviewer'].includes(grant.role)) return null;
    return { id: user.id, role: grant.role };
  } catch {
    return null;
  }
}


async function readBoundedBody(request, maxBytes) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(total);
    let cursor = 0;
    for (const chunk of chunks) { merged.set(chunk,cursor); cursor += chunk.byteLength; }
    return new TextDecoder('utf-8',{fatal:true}).decode(merged);
  } catch { return null; }
  finally { reader.releaseLock(); }
}


/* V093 verified institutional display: OWNER nominates, independent REVIEWER
 * verifies evidence, public profiles render only the resulting active grant.
 * Never changes staff_access_grants, XP, account metadata or permissions.
 * Entire workflow remains unavailable without an explicit feature flag
 * AND the additive reviewed role-ledger schema.
 */
const DESIGNATIONS = new Set(['founder','administrator','moderator','curator']);
const DESIGNATION_PRIORITY = {curator:1,moderator:2,administrator:3,founder:4};
const EVIDENCE_CASE = /^https:\/\/github\.com\/anevum\/anevum-web\/(?:issues|pull)\/[1-9][0-9]{0,8}$/;
const ROLE_SCHEMA = ['member_role_grants','member_role_requests','member_role_events'];
async function roleOpsReady(db,env) {
 if (env.ANEVUM_VERIFIED_ROLE_OPERATIONS_ENABLED !== 'true') return false;
 try {
  const result = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_role_grants','member_role_requests','member_role_events')").all();
  return result.success !== false &&
   ROLE_SCHEMA.every(name => (result.results||[]).some(row=>row.name===name));
 } catch {return false}
}
async function roleQueue(db,staff,env) {
 if (!await roleOpsReady(db,env))
  return json({enabled:false,clearance:staff.role,reason:'Audited designation approvals are not activated',requests:[]});
 const list = await db.prepare(
  "SELECT r.id,r.role,r.state,r.nominated_at AS nominatedAt,"+
  "r.evidence_ref AS evidenceRef,"+
  "COALESCE(NULLIF(p.display_name,''),NULLIF(u.name,''),'Member') AS memberName,"+
  "COALESCE(p.handle,'') AS handle,"+
  "CASE WHEN r.nominated_by=? THEN 1 ELSE 0 END AS nominatedByMe,"+
  "CASE WHEN r.member_id=? THEN 1 ELSE 0 END AS targetsMe "+
  "FROM member_role_requests r JOIN \"user\" u ON u.id=r.member_id "+
  "LEFT JOIN member_creator_profiles p ON p.user_id=r.member_id "+
  "WHERE r.state='pending' ORDER BY r.nominated_at ASC,r.id ASC LIMIT 30"
 ).bind(staff.id,staff.id).all();
 if (list.success===false) return error(503,'Designation queue unavailable');
 return json({enabled:true,clearance:staff.role,requests:list.results||[],
  note:'Role seals are public display only; staff permissions are independently governed.'});
}
async function rolePayload(request,required) {
 if (request.headers.get('origin') !== ORIGIN ||
     ![null,'same-origin','none'].includes(request.headers.get('sec-fetch-site')))
  return {error:error(403,'Same-origin request required')};
 if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
  return {error:error(415,'JSON required')};
 const size=Number(request.headers.get('content-length')||'0');
 if (!Number.isSafeInteger(size)||size<0||size>1200)
  return {error:error(413,'Request too large')};
 const raw=await readBoundedBody(request,1100);
 if (raw===null)return {error:error(413,'Request too large')};
 let data;
 try{data=JSON.parse(raw)}catch{return {error:error(400,'Invalid JSON')}}
 if (!data||typeof data!=='object'||Array.isArray(data)||
     Object.keys(data).sort().join('|')!==[...required].sort().join('|'))
  return {error:error(400,'Invalid designation request')};
 return {data};
}
async function roleOperation(request,db,staff,env,kind) {
 if (!await roleOpsReady(db,env))return error(503,'Verified designation approvals are not enabled');
 const fields=kind==='nominate'?['memberId','role','evidenceRef']:
  kind==='review'?['requestId','decision']:['memberId','role'];
 const parsed=await rolePayload(request,fields);
 if(parsed.error)return parsed.error;
 const data=parsed.data;
 const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{2,128}$/.test(value);
 const now=Math.floor(Date.now()/1000);
 if(kind==='nominate'){
  if(staff.role!=='owner')return error(403,'Owner nomination required');
  if(!validId(data.memberId)||!DESIGNATIONS.has(data.role)||
   typeof data.evidenceRef!=='string'||data.evidenceRef.length>240||
   !EVIDENCE_CASE.test(data.evidenceRef))
   return error(400,'A role and an approved, non-personal review-case link are required');
  const user=await db.prepare('SELECT id FROM "user" WHERE id=? AND emailVerified=1')
   .bind(data.memberId).first();
  if(!user)return error(404,'Verified member not found');
  const existing=await db.prepare(
   'SELECT role FROM member_role_grants WHERE user_id=? AND role=? AND revoked_at IS NULL'
  ).bind(data.memberId,data.role).first();
  if(existing)return error(409,'This designation is already active');
  const limit=await db.prepare(
   "SELECT COUNT(*) AS n FROM member_role_requests WHERE nominated_by=? AND nominated_at>=?"
  ).bind(staff.id,now-3600).first();
  if(Number(limit?.n||0)>=8)return error(429,'Hourly nomination limit reached');
  try{
   const result=await db.prepare(
    "INSERT INTO member_role_requests(id,member_id,role,evidence_ref,nominated_by,nominated_at,state) "+
    "VALUES(?,?,?,?,?,?,'pending')"
   ).bind(crypto.randomUUID(),data.memberId,data.role,data.evidenceRef,staff.id,now).run();
   return result?.meta?.changes===1?
    json({ok:true,state:'pending',message:'Nomination recorded; independent review required'},201):
    error(409,'Nomination not recorded');
  }catch{return error(409,'Nomination already pending or database unavailable')}
 }
 if(kind==='review'){
  if(staff.role!=='reviewer')return error(403,'Independent moderator review required');
  if(typeof data.requestId!=='string'||
    !/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(data.requestId)||
    !['approved','rejected'].includes(data.decision))
   return error(400,'Invalid independent review');
  const requestRow=await db.prepare(
   'SELECT id,member_id,role,nominated_by,nominated_at,state FROM member_role_requests WHERE id=?'
  ).bind(data.requestId).first();
  if(!requestRow)return error(404,'Nomination not found');
  if(requestRow.state!=='pending')return error(409,'Nomination already decided');
  if(requestRow.nominated_by===staff.id||requestRow.member_id===staff.id)
   return error(403,'Reviewer must be independent of the nominator and the member');
  const recent=await db.prepare(
   'SELECT COUNT(*) AS n FROM member_role_events WHERE actor_id=? AND happened_at>=?'
  ).bind(staff.id,now-3600).first();
  if(Number(recent?.n||0)>=12)return error(429,'Hourly review limit reached');
  const decision=db.prepare(
   "UPDATE member_role_requests SET state=?,reviewed_by=?,reviewed_at=? "+
   "WHERE id=? AND state='pending' AND nominated_by<>? AND member_id<>?"
  ).bind(data.decision,staff.id,now,data.requestId,staff.id,staff.id);
  const record=db.prepare(
   "INSERT INTO member_role_events(id,request_id,member_id,role,action,actor_id,happened_at) "+
   "SELECT ?,r.id,r.member_id,r.role,?, ?,? FROM member_role_requests r "+
   "WHERE r.id=? AND r.state=? AND r.reviewed_by=? AND changes()=1"
  ).bind(crypto.randomUUID(),data.decision,staff.id,now,data.requestId,data.decision,staff.id);
  if(data.decision==='rejected'){
   const results=await db.batch([decision,record]);
   return results[0]?.meta?.changes===1&&results[1]?.meta?.changes===1?
    json({ok:true,state:'rejected'}):error(409,'Nomination changed during review');
  }
  // A conditional insert/upsert permits reissuance only after revocation.
  const issue=db.prepare(
   "INSERT INTO member_role_grants(user_id,role,granted_at,granted_by,reviewed_by,evidence_ref,revoked_at) "+
   "SELECT r.member_id,r.role,?,r.nominated_by,?,r.evidence_ref,NULL "+
   "FROM member_role_requests r WHERE r.id=? AND r.state='approved' "+
   "AND r.reviewed_by=? AND changes()=1 "+
   "ON CONFLICT(user_id,role) DO UPDATE SET "+
   "granted_at=excluded.granted_at,granted_by=excluded.granted_by,"+
   "reviewed_by=excluded.reviewed_by,evidence_ref=excluded.evidence_ref,revoked_at=NULL "+
   "WHERE member_role_grants.revoked_at IS NOT NULL"
  ).bind(now,staff.id,data.requestId,staff.id);
  const results=await db.batch([decision,issue,record]);
  return results[0]?.meta?.changes===1&&results[1]?.meta?.changes===1&&
   results[2]?.meta?.changes===1?
    json({ok:true,state:'approved',message:'Audited display designation issued'}):
    error(409,'Approval could not be finalized; audit the role ledger before retry');
 }
 if(staff.role!=='owner')return error(403,'Owner revocation required');
 if(!validId(data.memberId)||!DESIGNATIONS.has(data.role))
  return error(400,'Invalid revocation target');
 const active=await db.prepare(
  'SELECT granted_at FROM member_role_grants WHERE user_id=? AND role=? AND revoked_at IS NULL'
 ).bind(data.memberId,data.role).first();
 if(!active)return error(404,'No active designation to revoke');
 const updated=db.prepare(
  'UPDATE member_role_grants SET revoked_at=? WHERE user_id=? AND role=? AND revoked_at IS NULL'
 ).bind(Math.max(now,Number(active.granted_at)),data.memberId,data.role);
 const audit=db.prepare(
  "INSERT INTO member_role_events(id,member_id,role,action,actor_id,happened_at) "+
  "SELECT ?,? ,?,'revoked',?,? WHERE changes()=1"
 ).bind(crypto.randomUUID(),data.memberId,data.role,staff.id,now);
 const results=await db.batch([updated,audit]);
 return results[0]?.meta?.changes===1&&results[1]?.meta?.changes===1?
  json({ok:true,state:'revoked'}):error(409,'Revocation not applied');
}




async function roleMembers(db,staff,env,url){
 if(staff.role!=='owner')return error(403,'Owner clearance required');
 if(!await roleOpsReady(db,env))return error(503,'Designation approvals are not active');
 const params=url.searchParams;
 if([...params.keys()].some(k=>k!=='q'||params.getAll(k).length!==1))
  return error(400,'Invalid member search');
 const q=(params.get('q')||'').trim();
 if(q.length>64||/[\x00-\x1f\x7f]/.test(q))return error(400,'Invalid member search');
 const query=await db.prepare(
  "SELECT u.id,COALESCE(NULLIF(p.display_name,''),NULLIF(u.name,''),'Member') AS name,"+
  "COALESCE(p.handle,'') AS handle FROM \"user\" u "+
  "LEFT JOIN member_creator_profiles p ON p.user_id=u.id "+
  "WHERE u.emailVerified=1 AND (instr(lower(COALESCE(p.display_name,u.name,'')),lower(?))>0 "+
  "OR instr(lower(COALESCE(p.handle,'')),lower(?))>0) "+
  "ORDER BY u.createdAt DESC,u.id DESC LIMIT 25"
 ).bind(q,q).all();
 if(query.success===false)return error(503,'Member directory unavailable');
 const rows=query.results||[];
 if(!rows.length)return json({members:[]});
 const ids=rows.map(x=>x.id);
 const roles=await db.prepare(
  "SELECT user_id,role FROM member_role_grants WHERE revoked_at IS NULL AND user_id IN ("+
  ids.map(()=>'?').join(',')+") LIMIT 100"
 ).bind(...ids).all();
 if(roles.success===false)return error(503,'Role ledger unavailable');
 const selected=new Map();
 for(const x of roles.results||[]){
  if(!Object.hasOwn(DESIGNATION_PRIORITY,x.role))continue;
  if(!selected.has(x.user_id)||DESIGNATION_PRIORITY[x.role]>DESIGNATION_PRIORITY[selected.get(x.user_id)])
   selected.set(x.user_id,x.role);
 }
 return json({members:rows.map(x=>({...x,designation:selected.get(x.id)||null}))});
}


export default {
 async fetch(request,env){
  let url;try{url=new URL(request.url)}catch{return error(404,'Not found')}
  if(url.origin!==ORIGIN||url.protocol!=='https:'||url.username||url.password)return error(404,'Not found');
  if(![BASE,BASE+'/',BASE+'/styles.css',BASE+'/app.js',
       BASE+'/api/queue',BASE+'/api/members',BASE+'/api/nominate',BASE+'/api/review',BASE+'/api/revoke'].includes(url.pathname))
    return error(404,'Not found');
  if(url.search&&!(request.method==='GET'&&url.pathname===BASE+'/api/members'))
    return error(400,'Unexpected query');
  if(!['GET','POST'].includes(request.method))return error(405,'Method not allowed');
  const staff=await getStaff(request,env);
  if(!staff)return error(401,'Verified staff session required');
  try{
   if(request.method==='GET'){
    if(url.pathname===BASE||url.pathname===BASE+'/')return respond(PAGE,200,'text/html; charset=utf-8',true);
    if(url.pathname===BASE+'/styles.css')return respond(STYLES,200,'text/css; charset=utf-8');
    if(url.pathname===BASE+'/app.js')return respond(CLIENT,200,'application/javascript; charset=utf-8');
    if(url.pathname===BASE+'/api/queue')return await roleQueue(env.MEMBER_DB,staff,env);
    if(url.pathname===BASE+'/api/members')return await roleMembers(env.MEMBER_DB,staff,env,url);
    return error(405,'Method not allowed');
   }
   const kind=url.pathname===BASE+'/api/nominate'?'nominate':
    url.pathname===BASE+'/api/review'?'review':
    url.pathname===BASE+'/api/revoke'?'revoke':null;
   return kind?await roleOperation(request,env.MEMBER_DB,staff,env,kind):
    error(405,'Method not allowed');
  }catch{return error(503,'Insignia operations unavailable')}
 }
};
