// Append into the existing signed-Access Creator Studio only.
// Unsafe user messages are always DOM text nodes, never HTML/markdown.
export const FORUM_PANEL=`<section class="forum-studio" aria-label="Human-reviewed community moderation">
  <div class="forum-studio-head">
    <div><span class="forum-studio-eyebrow">STAGING / MEMBER SAFETY</span><h2>Community moderation</h2><p>Review text-only member discussions and reports before they become public. Badge level and XP never give moderation power.</p></div>
    <button id="forumStudioRefresh" type="button" class="secondary">Refresh queues</button>
  </div>
  <div class="forum-studio-columns">
    <div><h3>Awaiting publication review</h3><p class="muted">Every new topic and reply requires an explicit human approval.</p><div id="forumStudioQueue" aria-live="polite">Loading member submissions…</div></div>
    <div><h3>Member reports</h3><p class="muted">The report queue is private to authenticated staff.</p><div id="forumStudioReports" aria-live="polite">Checking unresolved reports…</div></div>
  </div>
  <div class="forum-studio-hidden"><h3>Hidden messages / possible restoration</h3><p class="muted">These messages are not public. Restore requires a separately recorded staff decision.</p><div id="forumStudioHidden" aria-live="polite">Checking hidden content…</div></div>
  <p id="forumStudioStatus" role="status" aria-live="polite"></p>
</section>`;
export const FORUM_STYLE=`
.forum-studio{margin-top:23px;padding:22px;border:1px solid #507695;border-radius:14px;background:linear-gradient(145deg,#1b3454,#0e1b32);box-shadow:0 8px 30px #0006}
.forum-studio-head{display:flex;align-items:center;justify-content:space-between;gap:13px}
.forum-studio-head h2{font-size:23px;color:#f4f9ff;margin:6px 0}
.forum-studio-head p,.forum-studio-columns p{font-size:12px;color:#c3d5e4;line-height:1.6}
.forum-studio-eyebrow{font-size:10px;letter-spacing:.11em;color:#95efed;font-weight:900}
.forum-studio-columns{display:grid;grid-template-columns:1fr 1fr;gap:17px;margin-top:20px}
.forum-studio-columns>div{min-width:0}
.forum-studio-columns h3,.forum-studio-hidden h3{margin:0;font-size:17px}
.forum-studio-hidden{margin-top:21px;border-top:1px solid #476c8e;padding-top:17px}
.forum-studio-hidden>.muted{font-size:12px;color:#bdd3e8}
#forumStudioHidden{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
#forumStudioHidden .forum-review-card{margin-top:0}
@media(max-width:800px){#forumStudioHidden{grid-template-columns:1fr}}
.forum-review-card{padding:15px 13px;margin-top:10px;border:1px solid #547491;border-radius:9px;background:#101d34;overflow-wrap:anywhere}
.forum-review-card>strong,.forum-review-card>span{display:block}
.forum-review-card>strong{font-size:13px;line-height:1.3;color:#f1fbff}
.forum-review-card>span{font-size:10px;color:#a5cbd8;margin:7px 0;line-height:1.4}
.forum-review-body{font-size:12px;line-height:1.65;color:#e0eafa;white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0;border-top:1px solid #334e70;padding-top:10px}
.forum-review-actions{display:flex;flex-wrap:wrap;gap:8px}
.forum-review-actions button{font-size:11px;min-height:39px}
.forum-review-actions .positive{background:#a1ebe0;color:#08223a}
.forum-review-card .report-details{color:#e9cc9c}
#forumStudioStatus{color:#b5ede5;font-size:12px;line-height:1.5;min-height:20px}
@media(max-width:800px){.forum-studio-columns{grid-template-columns:1fr}.forum-studio-head{align-items:flex-start;flex-direction:column}}
@media(prefers-reduced-motion:reduce){.forum-review-card *{transition:none!important}}
`;
export const FORUM_APP=`(()=>{
 const queue=document.getElementById('forumStudioQueue');
 const reports=document.getElementById('forumStudioReports');
 const hidden=document.getElementById('forumStudioHidden');
 const refresh=document.getElementById('forumStudioRefresh');
 const status=document.getElementById('forumStudioStatus');
 if(!queue||!reports||!hidden||!refresh||!status)return;
 const element=(name,className,content)=>{
   const node=document.createElement(name);if(className)node.className=className;
   if(content!==undefined)node.textContent=String(content);return node;
 };
 async function call(path,init={}){
   const res=await fetch(path,{credentials:'same-origin',cache:'no-store',headers:{"Accept":"application/json",...(init.method?{"Content-Type":"application/json"}:{})},...init});
   if(!res.ok)throw new Error("Moderation service unavailable ("+res.status+")");
   const body=await res.json();return body;
 }
 async function act(path,description){
   const reason=prompt("Record a staff-only reason (12–600 characters):");
   if(reason===null)return;
   const value=reason.trim();
   if(value.length<12||value.length>600){status.textContent="Reason must be 12–600 characters.";return;}
   if(!confirm("Confirm staff decision: "+description+"?"))return;
   status.textContent="Saving verified moderation action…";
   try{await call(path,{method:'POST',body:JSON.stringify({reason:value})});status.textContent="Moderation decision recorded.";await load();}
   catch(e){status.textContent=e.message;}
 }
 function buttons(parent,actions){
   const bar=element('div','forum-review-actions');
   for(const [name,path,label,positive] of actions){
     const button=element('button',positive?'positive':'secondary',label);
     button.type='button';button.addEventListener('click',()=>act(path,name));
     bar.append(button);
   }
   parent.append(bar);
 }
 function renderPosts(items){
   queue.replaceChildren();
   if(!items.length){queue.append(element('p','muted','No pending messages. The queue is genuinely empty.'));return;}
   for(const p of items){
     const card=element('article','forum-review-card');
     card.append(element('strong','',p.title||"Member discussion"));
     card.append(element('span','',p.handle+" · "+p.room+" · "+(p.starter?'Original topic':'Reply')+" · "+new Date(p.createdAt*1000).toLocaleString()));
     card.append(element('p','forum-review-body',p.body));
     buttons(card,[['approve','/api/forum/posts/'+p.id+'/approve','Approve',true],['hide','/api/forum/posts/'+p.id+'/hide','Hide',false]]);
     queue.append(card);
   }
 }
 function renderReports(items){
   reports.replaceChildren();
   if(!items.length){reports.append(element('p','muted','No open reports.'));return;}
   for(const r of items){
     const card=element('article','forum-review-card');
     card.append(element('strong','',r.threadTitle||"Discussion"));
     card.append(element('span','',r.handle+" · "+r.room+" · "+r.reason));
     card.append(element('p','forum-review-body',r.body));
     if(r.details)card.append(element('p','report-details',r.details));
     buttons(card,[...(r.postStatus==='visible'?[['hide','/api/forum/posts/'+r.postId+'/hide','Hide Message',false]]:[]),['resolve','/api/forum/reports/'+r.id+'/resolve','Resolve',true],['dismiss','/api/forum/reports/'+r.id+'/dismiss','Dismiss',false]]);
     reports.append(card);
   }
 }
 function renderHidden(items){
   hidden.replaceChildren();
   if(!items.length){hidden.append(element('p','muted','No hidden messages.'));return;}
   for(const p of items){
     const card=element('article','forum-review-card');
     card.append(element('strong','',p.title||"Discussion"));
     card.append(element('span','',p.handle+" · "+p.room+" · "+(p.starter?'Opening post':'Reply')+" · hidden"));
     card.append(element('p','forum-review-body',p.body));
     buttons(card,[['restore','/api/forum/posts/'+p.id+'/restore','Review + Restore',true]]);
     hidden.append(card);
   }
 }
 async function load(){
   refresh.disabled=true;status.textContent="Checking staff-only queues…";
   try{
     const [pending,flagged,hiddenPosts]=await Promise.all([call('/api/forum/queue'),call('/api/forum/reports'),call('/api/forum/hidden')]);
     renderPosts(pending.items);renderReports(flagged.items);renderHidden(hiddenPosts.items);
     status.textContent=pending.items.length+" pending messages · "+flagged.items.length+" unresolved reports · "+hiddenPosts.items.length+" hidden messages.";
   }catch(e){queue.textContent="Forum moderation is not provisioned in this staging build.";reports.textContent="No report queue available.";hidden.textContent="Hidden queue unavailable.";status.textContent=e.message;}
   finally{refresh.disabled=false;}
 }
 refresh.addEventListener('click',load);load();
})();`;
