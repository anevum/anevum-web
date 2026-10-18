/*
 * ANEVUM Alpha v003 — pending-project visibility overlay.
 * Reversible presentation-only proxy. No mutation of storage, accounts or review states.
 */
const ORIGIN="https://anevum.com";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const STYLE="\nmain>.panel{order:40}\nmain{display:flex;flex-direction:column}\n.alpha-review-notice{order:0;border:1px solid #c2a981;border-radius:12px;background:linear-gradient(135deg,#25384b,#142233);padding:17px;margin:17px 0;color:#ecece8}\n.alpha-review-notice strong{font-size:17px;font-weight:710;color:#f2e5ce}\n.alpha-review-notice p{font-size:13px;color:#ced9e6;margin:8px 0 12px}\n.alpha-review-actions{display:flex;align-items:center;flex-wrap:wrap;gap:9px}\n.alpha-review-actions a{display:inline-flex;text-decoration:none;align-items:center;justify-content:center;border:1px solid #bba27f;border-radius:8px;padding:10px 12px;background:#e2c28d;color:#152130;font:650 12px system-ui;min-height:40px}\n.alpha-review-actions a.secondary{background:#27394d;color:#f4e8d7;border-color:#60758b}\n.alpha-queue-count{border:1px solid #657c8c;background:#1c3040;border-radius:8px;padding:10px 13px;margin:12px 0;color:#e7efed;font-size:12px}\n.alpha-queue-count strong{color:#edd3a4}\nmain>.section-title{scroll-margin-top:100px}\n.card{scroll-margin-top:100px}\nmain>.panel h2{margin-bottom:12px}\n@media(max-width:580px){.alpha-review-notice{padding:14px}.alpha-review-actions a{font-size:11px}}\n";
async function member(req,env){
 const cookie=req.headers.get("cookie");
 if(!cookie)return null;
 const h=new Headers({cookie,accept:"application/json"});
 if(req.headers.get("user-agent"))h.set("user-agent",req.headers.get("user-agent"));
 const r=await env.AUTH.fetch(new Request(ORIGIN+"/api/v1/member/auth/get-session",{headers:h,redirect:"manual"}));
 if(!r.ok)return null;
 const x=await r.json().catch(()=>null);
 return x?.session&&x?.user?.emailVerified===true&&typeof x.user.id==="string"?{id:x.user.id}:null;
}
async function isStaff(req,env){
 const h=new Headers({accept:"application/json"});
 if(req.headers.get("cookie"))h.set("cookie",req.headers.get("cookie"));
 if(req.headers.get("user-agent"))h.set("user-agent",req.headers.get("user-agent"));
 const r=await env.UPSTREAM.fetch(new Request(ORIGIN+"/api/v1/alpha/me",{headers:h,redirect:"manual"}));
 return r.ok&&((await r.json().catch(()=>null))?.staff===true);
}
const anchor=id=>"project-"+id;
const action=(href,value,secondary=false)=>'<a class="'+(secondary?"secondary":"")+'" href="'+esc(href)+'">'+esc(value)+'</a>';
function pendingNotice(items,staff){
 const first=items[0],n=items.length;
 const actions=action("/play/"+first.id,"Reopen saved preview")+(staff?action("/staff/projects#"+anchor(first.id),"Review & publish",true):action("/upload#my-projects","Track submissions",true));
 return '<section class="alpha-review-notice" id="project-status" aria-label="Submitted projects">'+
  '<strong>'+n+' project'+(n===1?" is":"s are")+' safely submitted for approval</strong>'+
  '<p>'+esc(first.title)+(n>1?" and your other submissions are":" is")+' stored privately in your ANEVUM account. Submission does not delete or publish a file. Review is the next step.</p>'+
  '<div class="alpha-review-actions">'+actions+'</div></section>';
}
export default {async fetch(req,env){
 const url=new URL(req.url),path=url.pathname;
 if((path==="/alpha/review"||path==="/alpha/review/")&&req.method==="GET")return new Response(null,{status:302,headers:{"location":ORIGIN+"/staff/projects","cache-control":"private,no-store","x-robots-tag":"noindex"}});
 const upstream=await env.UPSTREAM.fetch(req);
 if(req.method!=="GET"||upstream.status!==200||!(upstream.headers.get("content-type")||"").includes("text/html"))return upstream;
 if(!["/upload","/upload/","/alpha","/alpha/","/alpha/review"].includes(path)&&!/^\/play\/[0-9a-f-]{36}\/?$/.test(path))return upstream;
 try{
  const who=await member(req,env);
  if(!who)return upstream;
  const staff=await isStaff(req,env);
  let inject="",ids=[];
  if(path==="/upload"||path==="/upload/"||path==="/alpha"||path==="/alpha/"){
   const r=await env.DB.prepare("SELECT id,title FROM anevum_alpha_projects WHERE owner_id=? AND status='pending_review' ORDER BY submitted_at DESC LIMIT 20").bind(who.id).all();
   const pending=(r.results||[]).filter(x=>UUID.test(x.id));
   if(pending.length)inject=pendingNotice(pending,staff);
  }else if(path==="/alpha/review"&&staff){
   const r=await env.DB.prepare("SELECT id FROM anevum_alpha_projects WHERE status='pending_review' ORDER BY submitted_at ASC LIMIT 50").all();
   ids=(r.results||[]).filter(x=>UUID.test(x.id)).map(x=>x.id);
   inject='<div class="alpha-queue-count"><strong>'+ids.length+' waiting for approval.</strong> Preview each file and then use Publish or Reject below.</div>';
  }else if(path.startsWith("/play/")){
   const id=path.split("/")[2];
   if(!UUID.test(id))return upstream;
   const p=await env.DB.prepare("SELECT id,title,owner_id,status FROM anevum_alpha_projects WHERE id=?").bind(id).first();
   if(p&&p.status==="pending_review"&&(p.owner_id===who.id||staff))inject=pendingNotice([{id:p.id,title:p.title}],staff);
  }
  if(!inject&&!ids.length)return upstream;
  const headers=new Headers(upstream.headers);
  ["content-length","content-encoding","etag","last-modified"].forEach(k=>headers.delete(k));
  headers.set("cache-control","private, no-store");
  headers.set("x-anevum-alpha-tracker","v005");
  const body=new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers});
  let article=0;
  const rewritten=new HTMLRewriter()
    .on("head",{element(e){e.append("<style>"+STYLE+"</style>",{html:true})}})
    .on("main > p",{element(e){if(inject){e.after(inject,{html:true});inject=""}}})
    .on("article.card",{element(e){if(article<ids.length)e.setAttribute("id",anchor(ids[article++]));}});
  return rewritten.transform(body);
 }catch{return upstream;}
}};