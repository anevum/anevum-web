// ANEVUM.WEB.BUILD.2026-10-16.002.MODERATOR-CONSOLE
// Cloudflare Access-protected Lab Backstage workbench. LOCAL cases only.
// Canonical community decisions MUST occur in the separately authenticated
// a.anevum.com member forum reviewer service, never through this module.

export const MODERATOR_LAB_CSS = String.raw`
:root{color-scheme:dark;--bg:#080911;--panel:#171621;--raised:#262031;--edge:#705b73;--mute:#d0bfcf;--ink:#faf0f4;--pink:#ebbdd1;--gold:#e9c79b;--ok:#a9e0c4;--warn:#ffd1c4}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;color:var(--ink);font:14px/1.6 system-ui,-apple-system,sans-serif;background:radial-gradient(ellipse at 72% -15%,#492d49 0,transparent 53%),linear-gradient(158deg,#17131d,#090a11 78%)}
button,input,textarea,select{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}
a{color:inherit}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #f4d2e0;outline-offset:3px}
main{width:min(1580px,100%);padding:clamp(18px,3.3vw,52px);margin:0 auto}
.kicker{color:var(--pink);font-size:10px;letter-spacing:.2em;font-weight:800}
.mast{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;border-bottom:1px solid var(--edge);padding-bottom:25px;margin-bottom:24px}
.mast h1{font:500 clamp(37px,5vw,67px)/1.07 Georgia,serif;letter-spacing:-.04em;margin:10px 0}
.mast h1 em{color:var(--pink);font-weight:400}
.mast p{color:var(--mute);max-width:69ch;margin:0;line-height:1.7}
.go-back,.action-link{display:inline-flex;align-items:center;justify-content:center;padding:13px 17px;border:1px solid #a4819b;border-radius:13px;background:#302438;text-decoration:none;font-size:11px;font-weight:800;letter-spacing:.09em;min-height:44px;white-space:nowrap}
.go-back:hover,.action-link:hover{background:#4a3051}
.boundary{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;background:linear-gradient(135deg,#302438,#1a1b29);padding:20px;border:1px solid #98738e;border-radius:20px;margin:0 0 25px}
.boundary strong{display:block;font-size:14px}.boundary p{font-size:12px;color:var(--mute);max-width:80ch;margin:5px 0 0}.boundary .actions{display:flex;gap:9px;flex-wrap:wrap}
.action-link.real{border-color:#83b7a2;background:#254038;color:#d3f4e1}
.action-link.real:hover{background:#35594d}
.layout{display:grid;grid-template-columns:minmax(215px,250px) minmax(0,1fr);gap:24px;align-items:start}
.sidebar{position:sticky;top:20px;border:1px solid #504558;border-radius:18px;padding:16px;background:linear-gradient(145deg,#282230,#17171f)}
.sidebar>p{font-size:10px;letter-spacing:.15em;color:#dcb0c6;margin:0 5px 14px}
.sidebar nav{display:grid;gap:7px}
.sidebar nav button{display:flex;gap:14px;align-items:center;text-align:left;min-height:47px;border:1px solid transparent;background:transparent;color:var(--mute);padding:9px 12px;border-radius:12px}
.sidebar nav button span{font:11px ui-monospace,monospace;color:var(--pink)}
.sidebar nav button b{font-size:13px}
.sidebar nav button.active{background:#463449;border-color:#9c7c98;color:#fff5f9}
.sidebar nav button:hover:not(.active){background:#352a39}
.sidebar .notice{border-top:1px solid #55445a;padding:15px 6px 2px;margin:20px 0 0;font-size:11px;color:#cbb9c8}
.screen{min-width:0}
.section-head{display:flex;align-items:end;justify-content:space-between;flex-wrap:wrap;gap:15px;margin-bottom:17px}
.section-head h2{font:500 clamp(26px,3vw,37px)/1.2 Georgia,serif;margin:5px 0}
.section-head p{color:var(--mute);margin:0;font-size:12px}
.pill{padding:6px 10px;font-size:10px;letter-spacing:.12em;border:1px solid #9e768d;background:#342537;border-radius:100px;color:#f5cfde;white-space:nowrap}
.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 23px}
.metric{display:grid;gap:8px;align-content:center;border:1px solid #76607c;border-radius:18px;background:linear-gradient(145deg,#372b42,#1a1a25);min-height:133px;padding:19px}
.metric small{font-size:10px;letter-spacing:.12em;color:var(--pink);font-weight:750}
.metric strong{font:500 45px/1 Georgia,serif}.metric span{font-size:11px;color:var(--mute)}
.toolrow{display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:22px 0}
.toolrow label{display:grid;gap:6px;color:var(--pink);font-size:10px;letter-spacing:.12em;font-weight:700;flex:1;min-width:180px}
input,textarea,select{width:100%;padding:12px;color:#fff0f8;border:1px solid #88738c;background:#12111b;border-radius:11px;min-height:44px}
textarea{resize:vertical;min-height:110px;line-height:1.65}
input::placeholder,textarea::placeholder{color:#bbabbc}
.toolrow select{max-width:160px}
.btn{min-height:44px;border:1px solid #977d99;border-radius:11px;background:#3c2d43;color:#f8e9f3;padding:11px 15px;font-size:11px;font-weight:800;letter-spacing:.07em}
.btn.primary{background:#6b455e;border-color:#d5a9bd}.btn.primary:hover{background:#81516e}
.btn:hover{border-color:#e2b7ce}
.cards{display:grid;gap:12px}
.case{border:1px solid #66546e;background:linear-gradient(135deg,#302639,#1b1a25);padding:21px;border-radius:18px;overflow-wrap:anywhere}
.case-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.case small{font-size:10px;letter-spacing:.1em;color:#efc2d7;font-weight:750}
.case h3{font:500 24px/1.2 Georgia,serif;margin:11px 0}
.case p{color:var(--mute);font-size:13px;margin:0 0 15px;white-space:pre-wrap}
.case .case-buttons{display:flex;flex-wrap:wrap;gap:9px}
.case button{min-height:42px}
.case .target{color:#c5dfd4;overflow-wrap:anywhere}
.empty{padding:27px;border:1px dashed #785e77;border-radius:18px;background:#241f2b;color:#d5c6d4;font-size:13px}
.audit{display:grid;gap:9px}
.event{border:1px solid #574763;border-left:3px solid #e0afc8;background:#211d28;padding:15px;border-radius:10px}
.event strong{display:block;font-size:12px;letter-spacing:.06em}.event small{font-size:11px;color:#cebacc}
.stack{display:grid;gap:15px}
.panel{border:1px solid #5d4c66;border-radius:18px;background:#1e1b27;padding:clamp(16px,2.6vw,29px)}
.panel h3{font:500 23px Georgia,serif;margin:0 0 10px}
.panel p,.panel li{color:var(--mute);font-size:13px;line-height:1.7}
.panel ol{padding-left:20px}.panel code{color:#e6c2d6}
.field{display:grid;gap:6px;color:#eac0d4;font-size:11px;letter-spacing:.03em}
.editor{display:grid;gap:13px}
.editor .inline{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.feedback{border:1px solid #6a926f;color:#d7f5dc;background:#182c28;border-radius:12px;padding:12px 15px;font-size:12px}
.feedback.error{border-color:#a77474;background:#3a232e;color:#ffced0}
.detail{display:grid;gap:17px}
.detail h3{font:500 29px Georgia,serif;margin:0}.detail p{margin:0;color:var(--mute);white-space:pre-wrap;overflow-wrap:anywhere}
.detail .row{display:flex;gap:9px;flex-wrap:wrap}.detail .row>span{border:1px solid #705878;border-radius:7px;padding:6px 9px;font-size:10px}
.detail .events{display:grid;gap:10px}
.footer{border-top:1px solid #604b64;margin-top:32px;padding-top:18px;font-size:12px;color:#c2b3c3;line-height:1.65}
[hidden]{display:none!important}
@media(max-width:840px){.layout{grid-template-columns:minmax(0,1fr)}.sidebar{position:static}.sidebar>p,.sidebar .notice{display:none}.sidebar nav{display:flex;overflow-x:auto;scrollbar-width:thin;padding-bottom:2px}.sidebar nav button{flex:0 0 auto;min-width:125px}.mast{align-items:start;flex-direction:column}.boundary{align-items:start}}
@media(max-width:560px){main{padding:15px}.metrics{gap:7px}.metric{padding:13px 9px;min-height:112px}.metric strong{font-size:35px}.metric small{font-size:9px;letter-spacing:.03em}.metric span{font-size:10px}.editor .inline{grid-template-columns:1fr}.toolrow select{max-width:100%}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;

export const MODERATOR_LAB_JS = String.raw`
(()=>{
 'use strict';
 const KEY='anevum.lab.backstage.cases.v1';
 const PRIORITIES=['low','normal','high','urgent'];
 const STATES=['open','review','escalated','closed'];
 const CATEGORIES=['moderation','publishing','support','community','members','operations'];
 const get=id=>document.getElementById(id);
 const entries=get('caseList'),feedback=get('feedback');
 let cases=[],filter='',stateFilter='all',selected=null,storageHealthy=true,currentTab='overview';

 function safeCase(item){
  if(!item||typeof item!=='object'||!/^LOCAL-[0-9]{8}-[A-Z0-9]{6}$/.test(item.id)||!CATEGORIES.includes(item.category)
   ||!STATES.includes(item.status)||!PRIORITIES.includes(item.priority)
   ||typeof item.title!=='string'||item.title.length>140
   ||typeof item.target!=='string'||item.target.length>180
   ||typeof item.description!=='string'||item.description.length>5000
   ||!Array.isArray(item.events)||item.events.length>60)return null;
  const events=item.events.map(e=>e&&typeof e.action==='string'&&e.action.length<=60
   &&typeof e.note==='string'&&e.note.length<=1500&&Number.isFinite(e.at)
   ?{at:e.at,action:e.action,note:e.note}:null);
  if(events.some(x=>!x))return null;
  return {...item,created:Number.isFinite(item.created)?item.created:Date.now(),
   updated:Number.isFinite(item.updated)?item.updated:Date.now(),events};
 }
 const fmt=time=>new Date(time).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
 const element=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
 const button=(text,fn,primary=false)=>{const b=element('button','btn'+(primary?' primary':''),text);b.type='button';b.addEventListener('click',fn);return b};
 function notify(text,error=false){feedback.textContent=text;feedback.hidden=false;feedback.className='feedback'+(error?' error':'');}
 function load(){
  try{const raw=localStorage.getItem(KEY);if(!raw){cases=[];return}
   const parsed=JSON.parse(raw);if(parsed.schema!=='backstage-local-v1'||!Array.isArray(parsed.cases)){notify('Unsupported local case format. Nothing has been overwritten.',true);return}
   cases=parsed.cases.map(safeCase).filter(Boolean).slice(0,200);
  }catch{storageHealthy=false;notify('Browser storage unavailable. Local changes cannot be saved. Export existing records from Backstage.',true);}
 }
 function persist(){
  try{localStorage.setItem(KEY,JSON.stringify({schema:'backstage-local-v1',cases}));
   storageHealthy=true;notify('Saved to this device. No member account or public post was changed.');return true;
  }catch{storageHealthy=false;notify('Local save failed. No community action was performed.',true);return false;}
 }
 function moderationCases(){return cases.filter(x=>x.category==='moderation')}
 function updateCounters(){
  const entries=moderationCases();
  get('countOpen').textContent=entries.filter(x=>x.status==='open').length;
  get('countReview').textContent=entries.filter(x=>x.status==='review').length;
  get('countEscalated').textContent=entries.filter(x=>x.status==='escalated').length;
 }
 function switchTab(tab){
  if(!['overview','queue','new','protocol','audit'].includes(tab))return;
  currentTab=tab;
  document.querySelectorAll('[data-screen]').forEach(el=>{el.hidden=el.dataset.screen!==tab});
  document.querySelectorAll('[data-tab]').forEach(el=>{
   const on=el.dataset.tab===tab;el.classList.toggle('active',on);
   if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  });
  if(tab==='queue'||tab==='overview')renderQueue();
  if(tab==='audit')renderAudit();
 }
 function renderQueue(){
  updateCounters();entries.replaceChildren();
  const list=moderationCases().sort((a,b)=>b.updated-a.updated)
   .filter(x=>(stateFilter==='all'||x.status===stateFilter)&&(!filter||(x.title+' '+x.target+' '+x.description+' '+x.priority).toLowerCase().includes(filter)));
  get('caseCount').textContent=list.length;
  for(const item of list){
   const c=element('article','case'),top=element('div','case-top');
   top.append(element('small','',item.id),element('small','',item.priority.toUpperCase()+' / '+item.status.toUpperCase()));
   const title=element('h3','',item.title),description=element('p','',item.description.slice(0,240)||'No description yet');
   const row=element('div','case-buttons');row.append(button('OPEN CASE ↗',()=>openCase(item.id)));
   c.append(top,title,description,row);entries.append(c);
  }
  get('emptyQueue').hidden=list.length!==0;
  get('caseList').hidden=list.length===0;
  const overview=get('overviewList');overview.replaceChildren();
  const last=moderationCases().sort((a,b)=>b.updated-a.updated).slice(0,3);
  for(const item of last){
   const c=element('article','case'),top=element('div','case-top');
   top.append(element('small','',item.id),element('small','',item.status.toUpperCase()));
   c.append(top,element('h3','',item.title),button('INSPECT LOCAL CASE',()=>openCase(item.id)));
   overview.append(c);
  }
  get('overviewEmpty').hidden=last.length!==0;
 }
 function openCase(id){
  const item=moderationCases().find(x=>x.id===id);if(!item){notify('Case unavailable on this device.',true);return}
  selected=id;const panel=get('caseDetail');panel.replaceChildren();
  panel.append(element('small','kicker',item.id),element('h3','',item.title));
  const meta=element('div','row');
  [item.priority.toUpperCase(),item.status.toUpperCase(),'LOCAL DEVICE ONLY'].forEach(x=>meta.append(element('span','',x)));
  panel.append(meta,element('p','',item.description||'No description added.'));
  if(item.target)panel.append(element('p','',item.target));
  const form=element('form','editor');form.noValidate=true;
  const statLabel=element('label','field','STATUS'),stat=document.createElement('select');
  for(const state of STATES){const opt=element('option','',state.toUpperCase());opt.value=state;stat.append(opt)}
  stat.value=item.status;statLabel.append(stat);
  const noteLabel=element('label','field','REASON OR PRIVATE NOTE (REQUIRED)'),note=document.createElement('textarea');
  note.maxLength=1500;note.placeholder='Record what was reviewed, and why…';noteLabel.append(note);
  const submit=element('button','btn primary','RECORD LOCAL DECISION');submit.type='submit';
  form.append(statLabel,noteLabel,submit);
  form.addEventListener('submit',event=>{
   event.preventDefault();const text=note.value.trim();
   if(text.length<3){notify('Enter a review note of at least 3 characters.',true);note.focus();return}
   if(item.events.length>=60){notify('Local event limit reached. Export and archive the case.',true);return}
   const now=Date.now();
   item.status=stat.value;item.updated=now;item.events.push({at:now,action:'LOCAL STATUS '+stat.value.toUpperCase(),note:text});
   if(persist()){renderQueue();openCase(id)}
  });
  panel.append(form,element('h3','','RECORDED LOCAL NOTES'));
  const audit=element('div','events');
  for(const e of item.events.slice().reverse()){
   const node=element('article','event');
   node.append(element('strong','',e.action),element('small','',fmt(e.at)),element('p','',e.note));audit.append(node);
  }
  panel.append(audit,button('BACK TO QUEUE',()=>switchTab('queue')));
  switchTab('queue');get('caseDetailWrap').hidden=false;
  get('caseDetailWrap').scrollIntoView({block:'nearest'});
 }
 function renderAudit(){
  const audit=get('auditList');audit.replaceChildren();
  const events=moderationCases().flatMap(c=>c.events.map(e=>({caseId:c.id,caseTitle:c.title,...e})))
   .sort((a,b)=>b.at-a.at).slice(0,50);
  for(const e of events){const node=element('article','event');
   node.append(element('strong','',e.action+' / '+e.caseTitle),element('small','',e.caseId+' · '+fmt(e.at)),element('p','',e.note));
   audit.append(node)}
  get('emptyAudit').hidden=events.length!==0;
 }
 function newCase(event){
  event.preventDefault();
  if(!storageHealthy){notify('Storage unavailable. Case not created.',true);return}
  if(cases.length>=200){notify('200-case local storage limit reached. Export/archive in Backstage.',true);return}
  const title=get('newTitle').value.trim(),detail=get('newDetail').value.trim(),target=get('newTarget').value.trim();
  if(title.length<5){notify('Enter a case title with at least 5 characters.',true);return}
  if(detail.length<3){notify('Record enough detail to make this case actionable.',true);return}
  const status='open',priority=get('newPriority').value;
  if(!PRIORITIES.includes(priority))return;
  const now=Date.now(),id='LOCAL-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
  const item={id,title:title.slice(0,140),target:target.slice(0,180),description:detail.slice(0,5000),
   category:'moderation',priority,status,created:now,updated:now,
   events:[{at:now,action:'CREATED LOCALLY',note:'Lab moderation case planning only; no community report synchronized.'}]};
  cases.push(item);
  if(persist()){get('newForm').reset();openCase(id);renderQueue()}
 }
 document.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>switchTab(el.dataset.tab)));
 get('caseSearch').addEventListener('input',event=>{filter=event.target.value.trim().toLowerCase();renderQueue()});
 get('statusFilter').addEventListener('change',event=>{stateFilter=event.target.value;renderQueue()});
 get('newForm').addEventListener('submit',newCase);
 window.addEventListener('storage',event=>{if(event.key===KEY){load();renderQueue();if(currentTab==='audit')renderAudit()}});
 load();renderQueue();switchTab('overview');
})();
`;

export function renderLabModeratorConsole(){
 return String.raw`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark"><meta name="robots" content="noindex,nofollow,noarchive">
<title>ANEVUM / Backstage / Moderation Lab</title>
<link rel="stylesheet" href="/projects/backstage/moderation/console.css">
<script src="/projects/backstage/moderation/console.js" defer></script>
</head><body><main>
<header class="mast"><div><div class="kicker">ANEVUM / CONTINUANCE INSTITUTE / PRIVATE LAB</div><h1>Moderation <em>workstation.</em></h1>
<p>Plan cases and coordinate community integrity operations. Live member moderation takes place in the separately authenticated community reviewer.</p></div>
<a class="go-back" href="/projects/backstage/">← BACKSTAGE</a></header>
<section class="boundary" aria-label="System trust boundaries">
 <div><span class="kicker">VERIFIED AUTHORITY / SEPARATE SYSTEM</span><strong>Lab case planning is local to this browser.</strong>
 <p>These are not live reports or staff permissions. Opening the verified review desk requires an ANEVUM member session and server-side reviewer authorization.</p></div>
 <div class="actions"><a class="action-link real" href="https://a.anevum.com/community/review" target="_blank" rel="noopener noreferrer">OPEN VERIFIED REVIEW ↗</a>
 <a class="action-link" href="https://github.com/anevum/anevum-web/pull/451" target="_blank" rel="noopener noreferrer">V042 SOURCE REVIEW ↗</a></div>
</section>
<div class="layout"><aside class="sidebar"><p>INSTITUTE OPERATIONS / MODERATION</p><nav aria-label="Moderator Lab workspace">
<button type="button" class="active" data-tab="overview" aria-current="page"><span>00</span><b>Overview</b></button>
<button type="button" data-tab="queue"><span>01</span><b>Local cases</b></button>
<button type="button" data-tab="new"><span>02</span><b>New case</b></button>
<button type="button" data-tab="protocol"><span>03</span><b>Protocol</b></button>
<button type="button" data-tab="audit"><span>04</span><b>Local record</b></button>
</nav><p class="notice">Protected by the private Lab gateway. No account bans, review approvals, public posts, API tokens or cross-domain session transfers can occur here.</p></aside>
<div class="screen"><p class="feedback" id="feedback" role="status" hidden></p>
<section data-screen="overview"><div class="section-head"><div><span class="kicker">BACKSTAGE / LOCAL CASE REGISTER</span><h2>Integrity overview</h2><p>Actual cases saved on this device. No simulated community statistics.</p></div><span class="pill">LOCAL PLANNING</span></div>
<div class="metrics"><div class="metric"><small>OPEN CASES</small><strong id="countOpen">0</strong><span>Needs triage</span></div><div class="metric"><small>IN REVIEW</small><strong id="countReview">0</strong><span>Active follow-up</span></div><div class="metric"><small>ESCALATED</small><strong id="countEscalated">0</strong><span>Requires decision</span></div></div>
<div class="section-head"><div><span class="kicker">MOST RECENT LOCAL RECORDS</span><h2>Case activity</h2></div><button class="btn" type="button" data-tab="queue">OPEN LOCAL QUEUE ↗</button></div>
<div id="overviewList" class="cards"></div><p id="overviewEmpty" class="empty">No local moderation cases yet. The actual ANEVUM forum queue is not mirrored into Lab.</p></section>
<section data-screen="queue" hidden><div class="section-head"><div><span class="kicker">CASE INDEX / THIS DEVICE</span><h2>Moderation case queue</h2><p>These records share the same local store as Backstage, filtered to moderation.</p></div><span class="pill"><span id="caseCount">0</span> SHOWN</span></div>
<div class="toolrow"><label>SEARCH LOCAL CASES<input id="caseSearch" type="search" placeholder="Case, subject, notes…"></label><label>STATUS<select id="statusFilter"><option value="all">All statuses</option><option value="open">Open</option><option value="review">In review</option><option value="escalated">Escalated</option><option value="closed">Closed</option></select></label><button class="btn primary" type="button" data-tab="new">+ CASE</button></div>
<p id="emptyQueue" class="empty">There are no cases matching these filters. This does not indicate whether the live community review queue is empty.</p>
<div class="cards" id="caseList"></div><section class="panel" id="caseDetailWrap" hidden><div class="detail" id="caseDetail"></div></section></section>
<section data-screen="new" hidden><div class="section-head"><div><span class="kicker">LAB CASE INTAKE</span><h2>Open local record</h2><p>Do not copy private emails, credentials or unnecessary sensitive evidence into browser storage.</p></div></div>
<form class="panel editor" id="newForm"><label class="field">CASE TITLE<input id="newTitle" required maxlength="140" placeholder="Brief, actionable description"></label>
<div class="inline"><label class="field">PRIORITY<select id="newPriority"><option value="normal">NORMAL</option><option value="low">LOW</option><option value="high">HIGH</option><option value="urgent">URGENT</option></select></label>
<label class="field">REFERENCE / PUBLIC URL (OPTIONAL)<input id="newTarget" maxlength="180" placeholder="Public thread or case reference"></label></div>
<label class="field">NEXT ACTION / CONTEXT<textarea id="newDetail" required maxlength="5000" placeholder="Describe what needs review. Avoid private account data."></textarea></label>
<button class="btn primary" type="submit">SAVE LOCAL CASE</button>
<p>Saved on this device only. Nothing is submitted to the community moderation API.</p></form></section>
<section data-screen="protocol" hidden><div class="section-head"><div><span class="kicker">INSTITUTE GUIDELINES</span><h2>Decision protocol</h2></div></div><div class="stack">
<article class="panel"><h3>01 / Identity and independence</h3><p>Staff must authenticate separately on the community reviewer service. A reviewer cannot publish their own forum submission. The server makes that determination, never a button in Lab.</p></article>
<article class="panel"><h3>02 / Evidence before action</h3><p>Review the actual text, author context, parent thread and member report category. Reported users are not automatically guilty; reporter identities remain private. Do not reproduce sensitive evidence in this local notebook.</p></article>
<article class="panel"><h3>03 / Proportionate response</h3><p>Approve eligible submissions, reject pending content or hide published material only through the verified reviewer. No silent bans, XP penalties, automated account restrictions or irreversible actions are issued here.</p></article>
<article class="panel"><h3>04 / Audit and reconciliation</h3><p>The canonical audit log records real review decisions. The Lab local event record tracks planning notes only. A local case can be closed after confirming the separate real-world decision.</p></article>
</div></section>
<section data-screen="audit" hidden><div class="section-head"><div><span class="kicker">LOCAL DEVICE RECORD</span><h2>Case event history</h2><p>Most recent 50 local moderation notes. Not the canonical forum audit log.</p></div></div>
<p id="emptyAudit" class="empty">No local moderation case events are stored on this device.</p><div class="audit" id="auditList"></div></section>
</div></div>
<footer class="footer">ANEVUM / CONTINUANCE INSTITUTE · BACKSTAGE MODERATION LAB V042 · PRIVATE PLANNING ONLY · VERIFIED STAFF ACTIONS REMAIN ON a.anevum.com · NO REAL USER DATA IMPORTED</footer>
</main></body></html>`;
}
