
/* ANEVUM ALPHA v001 - single-file sandbox player + owner-only upload + approval. */
const A="https://anevum.com",MB=1048576,ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CSS="*{box-sizing:border-box}:root{color-scheme:dark}body{margin:0;background:#090f1a;color:#eee;font:15px/1.5 system-ui,sans-serif}header{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;padding:16px 4vw;background:#101928;border-bottom:1px solid #425167}header strong{letter-spacing:.2em}header a{margin-right:13px}main{max-width:980px;padding:35px 16px 80px;margin:auto}h1{font-size:clamp(35px,6vw,59px);line-height:1.08;letter-spacing:-.05em;margin:8px 0}h2{font-size:23px}p,small{color:#bac5d2}.ey{color:#e1c48f;font-size:10px;letter-spacing:.17em}a{color:#e5c99e}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}.card,.panel{border:1px solid #49576a;background:#172234;padding:18px;border-radius:12px}.card{display:flex;flex-direction:column}.card p{flex:1}.card .actions{margin:12px 0 0}.actions{display:flex;flex-wrap:wrap;gap:8px;margin:17px 0}.button,button{font:600 13px system-ui;text-decoration:none;background:#233649;color:#f2f3f6;border:1px solid #6b7988;border-radius:8px;padding:11px 15px;cursor:pointer}.primary{background:#ddc08e;color:#101827;border-color:#ddc08e}.button:hover,button:hover{filter:brightness(1.08)}button:disabled{opacity:.5}input,textarea{width:100%;border:1px solid #667687;background:#0c1421;border-radius:8px;padding:13px;color:#f3f4f5;font:inherit}textarea{min-height:100px}label{display:block;margin:14px 0 6px;font-size:12px;font-weight:600}.status{margin:15px 0}.player{display:flex;align-items:center;justify-content:center;min-height:330px;background:#04080c;border:1px solid #506176;border-radius:10px;overflow:hidden}.player iframe{width:100%;height:68dvh;min-height:340px;border:0;background:white}.player img,.player video{max-width:100%;max-height:70dvh}.player audio{width:85%}.badge{color:#ddc08e;font:700 11px system-ui;letter-spacing:.08em;text-transform:uppercase}.muted{color:#b4becd}.notice{border:1px dashed #718092;border-radius:10px;padding:18px;margin:17px 0}.section-title{border-bottom:1px solid #3b4a5b;padding-bottom:12px;margin-top:30px}footer{text-align:center;padding:20px;border-top:1px solid #344256;color:#95a3b4;font-size:11px}@media(max-width:550px){header nav{width:100%}.cards{grid-template-columns:1fr}.player iframe{min-height:270px;height:55dvh}}",CLIENT="(function(){var f=document.getElementById(\"alpha-upload\"),msg=document.getElementById(\"alpha-status\");function note(t,bad){if(msg){msg.textContent=t;msg.style.color=bad?\"#ffb5a8\":\"#b7e6d6\"}}async function post(path,data){var r=await fetch(path,{method:\"POST\",credentials:\"include\",headers:{\"content-type\":\"application/json\",\"x-anevum-alpha\":\"1\"},body:JSON.stringify(data)});var x=await r.json();if(!r.ok)throw Error(x.error||\"Request failed\");return x}if(f)f.addEventListener(\"submit\",async function(e){e.preventDefault();var b=f.querySelector(\"button\");b.disabled=true;note(\"Uploading...\",false);try{var r=await fetch(\"/api/v1/alpha/upload\",{method:\"POST\",credentials:\"include\",headers:{\"x-anevum-alpha\":\"1\"},body:new FormData(f)});var x=await r.json();if(!r.ok)throw Error(x.error||\"Upload failed\");location.href=\"/play/\"+x.id}catch(err){note(err.message,true);b.disabled=false}});document.addEventListener(\"click\",async function(e){var b=e.target.closest(\"[data-submit],[data-publish],[data-reject]\");if(!b)return;var id=b.dataset.submit||b.dataset.publish||b.dataset.reject,action=b.dataset.submit?\"submit\":b.dataset.publish?\"publish\":\"reject\";var reason=\"\";if(action===\"publish\"&&!confirm(\"Publish this file publicly?\"))return;if(action===\"reject\"){reason=prompt(\"Reason for rejection (10+ characters):\")||\"\";if(reason.trim().length<10)return}b.disabled=true;try{await post(\"/api/v1/alpha/projects/\"+id+(action===\"submit\"?\"/submit\":\"/review\"),action===\"submit\"?{}:{action:action,reason:reason});location.reload()}catch(err){note(err.message,true);b.disabled=false}})})();";
const R={html:["text/html",MB,"html"],png:["image/png",8*MB,"image"],jpg:["image/jpeg",8*MB,"image"],jpeg:["image/jpeg",8*MB,"image"],webp:["image/webp",8*MB,"image"],gif:["image/gif",8*MB,"image"],mp3:["audio/mpeg",16*MB,"audio"],wav:["audio/wav",16*MB,"audio"],mp4:["video/mp4",20*MB,"video"],webm:["video/webm",20*MB,"video"],pdf:["application/pdf",8*MB,"document"]};
const H={"cache-control":"private,no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex"};
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reply=(o,s=200)=>Response.json(o,{status:s,headers:{...H,"content-type":"application/json; charset=utf-8"}});
const err=(s,m)=>reply({error:m},s);
const first=(db,sql,...a)=>db.prepare(sql).bind(...a).first(),list=(db,sql,...a)=>db.prepare(sql).bind(...a).all(),execute=(db,sql,...a)=>db.prepare(sql).bind(...a).run();
const COL="id,owner_id,title,summary,filename,kind,mime,size_bytes,object_key,sha256,status,created_at,submitted_at,published_at,rejection_reason";
const pilot=(env,id)=>!!id&&String(env.PILOT_IDS||"").split(",").includes(id);
const staff=(env,id)=>!!id&&String(env.STAFF_IDS||"").split(",").includes(id);
const cs=req=>req.headers.get("origin")===A&&req.headers.get("x-anevum-alpha")==="1"&&!["cross-site","same-site"].includes(req.headers.get("sec-fetch-site")||"");
async function user(req,env){
 const cookie=req.headers.get("cookie");if(!cookie)return null;
 const h=new Headers({cookie,accept:"application/json"});
 if(req.headers.get("user-agent"))h.set("user-agent",req.headers.get("user-agent"));
 const r=await env.AUTH.fetch(new Request(A+"/api/v1/member/auth/get-session",{headers:h,redirect:"manual"}));
 const x=r.ok?await r.json().catch(()=>null):null;return x?.user?.emailVerified===true&&x?.session&&typeof x.user.id==="string"?{id:x.user.id}:null;
}
function page(title,inside){
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#090f1a"><title>'+escape(title)+' · ANEVUM</title><style>'+CSS+'</style></head><body><header><strong>ANEVUM /</strong><nav><a href="/">Home</a><a href="/discover">Discover</a><a href="/alpha">Alpha releases</a><a href="/upload">Upload</a></nav></header><main>'+inside+'</main><footer>ANEVUM ALPHA / Real uploads only · Reviewed publication · Creator Studio independent</footer><script>'+CLIENT+'</script></body></html>';
 return new Response(html,{headers:{...H,"content-type":"text/html; charset=utf-8","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; media-src 'self'; frame-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'"}});
}
const link=(url,text)=>'<a class="button" href="'+url+'">'+escape(text)+'</a>';
function cards(xs,role){
 if(!xs.length)return '<div class="notice">Nothing published or submitted in this section yet.</div>';
 return '<div class="cards">'+xs.map(p=>'<article class="card"><span class="badge">'+escape(p.status)+' / '+escape(p.kind)+'</span><h3>'+escape(p.title)+'</h3><p>'+escape(p.summary)+'</p><small>'+escape(p.filename)+' · '+Math.round(p.size_bytes/1024)+' KB</small>'+(p.rejection_reason?'<p>Review: '+escape(p.rejection_reason)+'</p>':'')+'<div class="actions">'+link("/play/"+p.id,role==="public"?"Open player":"Preview")+(role==="owner"&&p.status==="draft"?'<button data-submit="'+p.id+'">Submit</button>':'')+(role==="staff"?'<button class="primary" data-publish="'+p.id+'">Publish</button><button data-reject="'+p.id+'">Reject</button>':'')+'</div></article>').join("")+'</div>';
}
async function upload(req,env){
 const u=await user(req,env);let entry="",mine="";
 if(!u)entry='<div class="notice">Sign in to upload. '+link("/join","Sign in")+'</div>';
 else if(!pilot(env,u.id))entry='<div class="notice">Alpha uploads are currently available to invited testers only.</div>';
 else{
 entry='<section class="panel"><h2>New upload</h2><form id="alpha-upload"><label for="t">Project title</label><input id="t" name="title" minlength="3" maxlength="100" required><label for="s">Description</label><textarea id="s" name="summary" minlength="10" maxlength="280" required></textarea><label for="f">Project file</label><input id="f" type="file" name="file" accept=".html,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.mp4,.webm,.pdf" required><p><small>Self-contained HTML game (1 MB), images, audio, video, or PDF (up to 20 MB). No ZIP packages yet. HTML games run offline without network access.</small></p><button class="primary" type="submit">Upload privately</button></form><p id="alpha-status" role="status"></p></section>';
 const r=await list(env.DB,"SELECT "+COL+" FROM anevum_alpha_projects WHERE owner_id=? ORDER BY created_at DESC LIMIT 25",u.id);
 mine='<h2 class="section-title">Your projects</h2>'+cards(r.results,"owner");
 }
 return page("Upload",'<div class="ey">CREATOR ALPHA / UPLINK</div><h1>Upload something real.</h1><p>Upload, preview, and submit without Creator Studio. Every file stays private until reviewed.</p>'+entry+mine);
}
async function index(env){
 const r=await list(env.DB,"SELECT "+COL+" FROM anevum_alpha_projects WHERE status='published' ORDER BY published_at DESC LIMIT 50");
 return page("Alpha releases",'<div class="ey">ANEVUM / PLAYABLE RELEASES</div><h1>See what people build.</h1><p>Real published experiences, not sample projects. Play interactive HTML, watch video, listen to audio, or explore original work.</p><div class="actions">'+link("/upload","Upload your work")+link("/discover","Discover community")+'</div><h2 class="section-title">Approved public projects</h2>'+cards(r.results,"public"));
}
async function review(req,env){
 const u=await user(req,env);if(!u||!staff(env,u.id))return page("Restricted",'<h1>Staff access required.</h1>');
 const r=await list(env.DB,"SELECT "+COL+" FROM anevum_alpha_projects WHERE status='pending_review' ORDER BY submitted_at ASC LIMIT 50");
 return page("Review",'<div class="ey">STAFF / MODERATION</div><h1>Review before release.</h1><p>Preview each file in the restricted player before publishing.</p><p id="alpha-status" role="status"></p>'+cards(r.results,"staff"));
}
async function project(env,id){return first(env.DB,"SELECT "+COL+" FROM anevum_alpha_projects WHERE id=?",id)}
async function play(req,env,id){
 const p=await project(env,id);
 if(!p)return page("Unavailable",'<h1>Project unavailable.</h1>');
 if(p.status!=="published"){const u=await user(req,env);if(!u||(u.id!==p.owner_id&&!staff(env,u.id)))return page("Unavailable",'<h1>Project unavailable.</h1>')}
 const f="/api/v1/alpha/projects/"+id+"/file";
 const media=p.kind==="html"?'<iframe title="Offline sandboxed game" sandbox="allow-scripts" referrerpolicy="no-referrer" src="'+f+'"></iframe>':p.kind==="image"?'<img alt="'+escape(p.title)+'" src="'+f+'">':p.kind==="audio"?'<audio controls preload="metadata" src="'+f+'"></audio>':p.kind==="video"?'<video controls playsinline preload="metadata" src="'+f+'"></video>':link(f,"Download PDF");
 return page(p.title,'<div class="ey">ANEVUM / '+escape(p.kind.toUpperCase())+' PLAYER</div><h1>'+escape(p.title)+'</h1><p>'+escape(p.summary)+'</p><p class="badge">'+escape(p.status)+(p.kind==="html"?" / offline sandbox":"")+'</p><div class="player">'+media+'</div>'+(p.status!=="published"?'<div class="notice">Private preview — not yet published.</div>':'')+'<div class="actions">'+link("/alpha","Alpha releases")+link("/upload","Your uploads")+'</div>');
}
function signature(b,e){
 const a=new Uint8Array(b),st=(...n)=>n.every((v,i)=>a[i]===v),at=(i,s)=>a.length>=i+s.length&&[...s].every((c,k)=>a[i+k]===c.charCodeAt(0));
 if(e==="html"){try{return /<(!doctype\s+html|html[\s>])/i.test(new TextDecoder("utf-8",{fatal:true}).decode(a).slice(0,1600))}catch{return false}}
 return e==="png"?st(137,80,78,71,13,10,26,10):["jpg","jpeg"].includes(e)?st(255,216,255):e==="webp"?at(0,"RIFF")&&at(8,"WEBP"):e==="gif"?at(0,"GIF87a")||at(0,"GIF89a"):e==="mp3"?at(0,"ID3")||(a[0]===255&&(a[1]&224)===224):e==="wav"?at(0,"RIFF")&&at(8,"WAVE"):e==="mp4"?at(4,"ftyp"):e==="webm"?st(26,69,223,163):e==="pdf"?at(0,"%PDF-"):false;
}
async function media(req,env,p){
 const ob=await env.MEDIA.get(p.object_key);
 if(!ob||ob.size!==p.size_bytes||ob.customMetadata?.sha256!==p.sha256)return err(503,"File unavailable");
 const h=new Headers({...H,"content-type":p.mime,"content-length":String(p.size_bytes)});
 if(p.kind==="html")h.set("content-security-policy","sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; connect-src 'none'; worker-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'");
 else if(p.kind==="document"){h.set("content-security-policy","sandbox; default-src 'none'");h.set("content-disposition","attachment")}
 else h.set("content-security-policy","default-src 'none'");
 return new Response(req.method==="HEAD"?null:ob.body,{headers:h});
}
async function api(req,env,path){
 if(path==="/api/v1/alpha/health"&&req.method==="GET")return reply({ok:true,version:"001",storage:!!env.MEDIA,db:!!env.DB});
 if(path==="/api/v1/alpha/projects"&&req.method==="GET"){const r=await list(env.DB,"SELECT "+COL+" FROM anevum_alpha_projects WHERE status='published' ORDER BY published_at DESC LIMIT 50");return reply({projects:r.results.map(p=>({id:p.id,title:p.title,kind:p.kind,summary:p.summary}))})}
 if(path==="/api/v1/alpha/me"&&req.method==="GET"){const u=await user(req,env);return reply({authenticated:!!u,pilot:!!u&&pilot(env,u.id),staff:!!u&&staff(env,u.id)})}
 const m=path.match(/^\/api\/v1\/alpha\/projects\/([0-9a-f-]{36})\/(file|submit|review)$/);
 if(m&&ID.test(m[1])&&m[2]==="file"&&["GET","HEAD"].includes(req.method)){const p=await project(env,m[1]);if(!p)return err(404,"Not found");if(p.status!=="published"){const u=await user(req,env);if(!u||(u.id!==p.owner_id&&!staff(env,u.id)))return err(404,"Not found")}return media(req,env,p)}
 const u=await user(req,env);if(!u)return err(401,"Verified ANEVUM sign-in required");
 if(req.method!=="POST"||!cs(req))return err(403,"Request not authorized");
 if(path==="/api/v1/alpha/upload"){
  if(!pilot(env,u.id))return err(403,"Pilot access required");
  if(!String(req.headers.get("content-type")||"").startsWith("multipart/form-data;"))return err(415,"Multipart file expected");
  if(Number(req.headers.get("content-length")||0)>22*MB)return err(413,"Upload exceeds limit");
  const f=await req.formData().catch(()=>null);if(!f)return err(400,"Invalid form");
  const t=f.get("title"),s=f.get("summary"),file=f.get("file");
  if(typeof t!=="string"||typeof s!=="string"||t.trim().length<3||t.trim().length>100||s.trim().length<10||s.trim().length>280||/[\x00-\x1f]/.test(t+s)||!file||typeof file.arrayBuffer!=="function"||!file.name||!file.name.match(/^[^\\/\x00-\x1f]{3,160}$/)||file.name.includes(".."))return err(422,"Check project details and filename");
  const ext=file.name.split(".").at(-1).toLowerCase(),rule=R[ext];
  if(!rule||file.type!==rule[0]||file.size<1||file.size>rule[1])return err(422,"Unsupported file type or size");
  const usage=await first(env.DB,"SELECT COUNT(*) n,COALESCE(SUM(size_bytes),0) bytes FROM anevum_alpha_projects WHERE owner_id=?",u.id);
  if(usage.n>=20||usage.bytes+file.size>100*MB)return err(409,"Pilot storage quota exceeded");
  const now=Math.floor(Date.now()/1000),rat=await first(env.DB,"INSERT INTO anevum_alpha_upload_limits(owner_id,window_start,attempts) VALUES(?,?,1) ON CONFLICT(owner_id) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END RETURNING attempts",u.id,now,now-3600,now-3600);
  if(rat.attempts>10)return err(429,"Too many uploads this hour");
  const b=await file.arrayBuffer();if(b.byteLength!==file.size||!signature(b,ext))return err(422,"File content does not match format");
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",b))).map(x=>x.toString(16).padStart(2,"0")).join(""),id=crypto.randomUUID(),key="quarantine/alpha/"+u.id+"/"+id;
  await env.MEDIA.put(key,b,{httpMetadata:{contentType:"application/octet-stream"},customMetadata:{sha256:sha}});
  try{await execute(env.DB,"INSERT INTO anevum_alpha_projects(id,owner_id,title,summary,filename,kind,mime,size_bytes,object_key,sha256,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,'draft',?)",id,u.id,t.trim(),s.trim(),file.name,rule[2],rule[0],file.size,key,sha,now)}
  catch{await env.MEDIA.delete(key).catch(()=>{});return err(503,"Storage record failure")}
  return reply({id,status:"draft"},201);
 }
 if(!m||!ID.test(m[1]))return err(404,"Not found");const p=await project(env,m[1]);if(!p)return err(404,"Not found");
 if(m[2]==="submit"){
  if(!pilot(env,u.id)||p.owner_id!==u.id)return err(403,"Not allowed");if(p.status!=="draft")return err(409,"Already submitted");
  const file=await env.MEDIA.head(p.object_key);if(!file||file.size!==p.size_bytes||file.customMetadata?.sha256!==p.sha256)return err(503,"File integrity mismatch");
  const x=await execute(env.DB,"UPDATE anevum_alpha_projects SET status='pending_review',submitted_at=? WHERE id=? AND owner_id=? AND status='draft'",Math.floor(Date.now()/1000),p.id,u.id);
  return x.meta?.changes===1?reply({status:"pending_review"}):err(409,"State changed");
 }
 if(m[2]==="review"){
  if(!staff(env,u.id))return err(403,"Reviewer only");if(p.status!=="pending_review")return err(409,"Not pending");
  const x=await req.json().catch(()=>null),type=x?.action;if(!["publish","reject"].includes(type))return err(400,"Action required");
  if(type==="reject"&&(typeof x.reason!=="string"||x.reason.trim().length<10||x.reason.length>1000))return err(422,"Rejection reason required");
  if(type==="publish"){const file=await env.MEDIA.head(p.object_key);if(!file||file.size!==p.size_bytes||file.customMetadata?.sha256!==p.sha256)return err(503,"File integrity mismatch")}
  const now=Math.floor(Date.now()/1000),state=type==="publish"?"published":"rejected";
  const x2=await execute(env.DB,"UPDATE anevum_alpha_projects SET status=?,reviewed_by=?,reviewed_at=?,published_at=?,rejection_reason=? WHERE id=? AND status='pending_review'",state,u.id,now,type==="publish"?now:null,type==="reject"?x.reason.trim():null,p.id);
  return x2.meta?.changes===1?reply({status:state}):err(409,"Review changed");
 }
 return err(405,"Unsupported operation");
}
export default {async fetch(req,env){
 const u=new URL(req.url),path=u.pathname;
 try{
  if(u.hostname!=="anevum.com")return err(404,"Unknown host");
  if(path.startsWith("/api/v1/alpha/"))return await api(req,env,path);
  if(req.method!=="GET")return new Response("Method not allowed",{status:405});
  if(path==="/upload"||path==="/upload/")return upload(req,env);
  if(path==="/alpha"||path==="/alpha/")return index(env);
  if(path==="/alpha/review")return review(req,env);
  const m=path.match(/^\/play\/([0-9a-f-]{36})\/?$/);if(m&&ID.test(m[1]))return play(req,env,m[1]);
  return new Response("Not found",{status:404});
 }catch{return path.startsWith("/api/")?err(503,"Alpha temporarily unavailable"):page("Unavailable","<h1>Temporarily unavailable</h1>")}
}};
