/* ANEVUM / Continuance Institute / Package Creator 003
 * Focused UI with functional affordances instead of ornamental effects.
 */
export const CSS = String.raw`
:root{color-scheme:dark;--bg:#080c13;--surface:#111925;--surface2:#182332;--line:#354357;--text:#f3f0e9;--muted:#aab8c9;--gold:#e3c18b;--red:#efa9a0;--green:#a7ddc4}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--text);background:radial-gradient(ellipse at 80% -10%,#172536 0%,transparent 46%),var(--bg);font:15px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,select,textarea{font:inherit}a{color:var(--gold)}button,.button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:43px;padding:10px 16px;border:1px solid #657288;border-radius:9px;background:#263449;color:var(--text);text-decoration:none;font-size:13px;font-weight:680;cursor:pointer}button:hover,.button:hover{background:#31435b}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid var(--gold);outline-offset:3px}button:disabled{opacity:.5;cursor:not-allowed}.primary{background:var(--gold);color:#0b121d;border-color:var(--gold)}.primary:hover{background:#f4d7a7;color:#080e16}.quiet{background:transparent;border-color:#526075}.danger{color:#ffd9d5;border-color:#7e4a53;background:#38232c}header{position:sticky;top:0;z-index:2;border-bottom:1px solid #3a4758;background:#0c121dde;backdrop-filter:blur(18px)}.top{max-width:1250px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 22px}.brand{text-decoration:none;color:var(--text);font-weight:760;font-size:14px;letter-spacing:.15em}.brand small{display:block;letter-spacing:.12em;color:var(--gold);font-size:9px;font-weight:600}.top nav{display:flex;flex-wrap:wrap;align-items:center;gap:16px}.top nav a{font-size:12px;color:#c7d2df;text-decoration:none}.top nav a:hover{text-decoration:underline;color:var(--gold)}main{width:min(1150px,calc(100% - 36px));margin:0 auto;padding:44px 0 90px}.ey{font:700 11px/1.5 system-ui,sans-serif;color:var(--gold);letter-spacing:.16em;text-transform:uppercase}.intro{max-width:780px;margin:5px 0 28px}h1{font-size:clamp(33px,5.7vw,66px);letter-spacing:-.062em;line-height:1.04;margin:9px 0 18px;font-weight:720}h2{font-size:clamp(21px,2.6vw,30px);letter-spacing:-.045em;margin:0 0 10px}h3{font-size:19px;letter-spacing:-.025em;margin:0 0 8px}p{margin:9px 0 13px;color:var(--muted)}.lead{font-size:clamp(15px,2vw,18px);max-width:660px}.meta{color:#92a1b4;font-size:12px}.grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,1fr);gap:20px;align-items:start}.panel{border:1px solid var(--line);border-radius:14px;background:linear-gradient(145deg,#151e2b,#101823);padding:clamp(18px,3vw,30px);box-shadow:0 15px 35px #0003}.panel h2{margin:0 0 4px}.panel+.panel{margin-top:15px}label{display:block;color:#d1dae6;font-size:12px;font-weight:650;margin:15px 0 7px}.field{width:100%;min-height:44px;padding:11px 13px;color:var(--text);background:#0a121d;border:1px solid #56657b;border-radius:8px}.field::placeholder{color:#77879d}textarea.field{min-height:92px;resize:vertical}.drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:175px;text-align:center;background:#0a131f;border:1.5px dashed #697991;border-radius:12px;padding:20px;cursor:pointer;transition:border-color .15s,background .15s}.drop:hover,.drop.drag,.drop:focus-within{border-color:var(--gold);background:#152130}.drop input{position:absolute;opacity:0;width:1px;height:1px}.drop strong{font-size:17px}.drop span{color:#acbbcc;font-size:12px}.drop .symbol{display:grid;place-items:center;width:41px;height:41px;border-radius:11px;background:#25344b;color:var(--gold);font-size:22px}.actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin:20px 0 0}.tip{border-left:2px solid var(--gold);padding:3px 0 3px 13px;margin:17px 0;color:#c6d0de;font-size:13px}.steps{display:grid;gap:14px;margin:18px 0}.step{display:flex;gap:13px;align-items:flex-start;padding-bottom:14px;border-bottom:1px solid #344355}.step:last-child{border-bottom:0;padding-bottom:0}.num{width:27px;height:27px;border:1px solid #6e7b8d;border-radius:8px;display:grid;place-items:center;color:var(--gold);flex:none;font-size:12px}.step strong{display:block;font-size:14px}.step p{font-size:12px;margin:1px 0}.status{min-height:23px;margin-top:14px;color:var(--green);font-size:13px}.status.bad{color:var(--red)}.titlebar{margin:50px 0 14px;display:flex;gap:16px;justify-content:space-between;align-items:end;flex-wrap:wrap}.titlebar p{margin:0}.project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(278px,1fr));gap:12px}.project{border:1px solid #45546a;background:#151e2a;border-radius:12px;padding:19px;display:flex;flex-direction:column;gap:9px}.project h3{margin:3px 0}.project p{font-size:13px;margin:0;flex:1;overflow-wrap:anywhere}.project .actions{margin:8px 0 0}.project .actions>*{flex:1}.chip{display:inline-block;width:max-content;max-width:100%;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#c8d9e6;border:1px solid #526177;border-radius:6px;padding:4px 7px}.chip.ready,.chip.published{color:var(--green);border-color:#436e61}.chip.rejected{color:var(--red);border-color:#824b50}.notice{border:1px dashed #728096;border-radius:11px;padding:18px 19px;background:#111927;color:#c5cfdc}.notice p{margin:0}.player-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap}.player-head h1{font-size:clamp(28px,4vw,48px)}.viewport{position:relative;display:grid;place-items:center;margin:26px 0 0;background:#020509;border:1px solid #53637b;border-radius:13px;overflow:hidden;min-height:340px;box-shadow:0 24px 80px #0008}.viewport iframe{display:block;width:100%;height:clamp(390px,70vh,820px);border:0;background:#03070c}.viewport:fullscreen{width:100%;height:100%;border:0;border-radius:0}.viewport:fullscreen iframe{height:100%;min-height:100%}.player-controls{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:12px}.details{margin:26px 0;padding-top:20px;border-top:1px solid #334256}.queue{display:grid;gap:12px}.queue .project{display:block}.small{font-size:12px}.foot{border-top:1px solid #2c3b4e;color:#8491a5;padding:22px;text-align:center;font-size:11px}.foot a{color:#bfcadc;text-decoration:none}.hidden{display:none!important}dialog{color:var(--text);background:#151f2b;border:1px solid #62728a;border-radius:13px;max-width:480px;padding:25px}dialog::backdrop{background:#000b}@media(max-width:800px){.grid{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column;gap:10px}.top nav{gap:11px}main{padding-top:30px}.viewport iframe{height:64dvh;min-height:290px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.drop{transition:none}}.resource-panel{position:relative;overflow:hidden;margin:0 0 23px;padding:20px 22px;border:1px solid #3b5269;border-radius:14px;background:linear-gradient(110deg,#17283b,#101b2b 72%)}.resource-panel:before{content:"";position:absolute;right:-70px;top:-100px;width:310px;height:240px;background:radial-gradient(ellipse,#6abac11e,transparent 68%);pointer-events:none}.resource-head{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:10px}.resource-head strong{font-size:1.3rem;color:#f4f7fa}.resource-track{height:6px;border-radius:20px;background:#334559;overflow:hidden;margin:14px 0 8px}.resource-track>span{display:block;height:100%;background:linear-gradient(90deg,#7ed4dc,#d7b6d5);border-radius:20px}.resource-foot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;color:#aebfd1;font-size:12px}.subtle-note{font-size:12px;line-height:1.5;color:#b3c9d8}.upload-assurance{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:19px 0}.upload-assurance>div{border:1px solid #35485d;border-radius:10px;padding:12px;background:#0d1928}.upload-assurance strong{display:block;color:#eaf4f7;font-size:12px}.upload-assurance span{display:block;color:#9bb0c4;font-size:11px;margin-top:4px}.actions .subdued{font-size:12px;color:#a9b9c9}.build-retention{font-size:12px;color:#b6ccdb;background:#12273a;border-left:2px solid #86cbd0;padding:10px 13px;border-radius:0 7px 7px 0}.chip.saved{border-color:#697bb4;color:#d9cefc}.chip.test{border-color:#60888a;color:#ace4dd}.status[aria-busy="true"]:before{content:"";display:inline-block;width:8px;height:8px;margin-right:8px;border-radius:50%;background:#a6d9df;box-shadow:0 0 0 4px #9ed9df26;animation:packagePulse 1.1s ease-in-out infinite}@keyframes packagePulse{50%{opacity:.35;transform:scale(.65)}}.operations-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:22px 0}.operations-grid>div{border:1px solid #3b5269;border-radius:10px;padding:17px;background:#142133}.operations-grid span{display:block;color:#a8bbd0;font-size:12px}.operations-grid strong{display:block;color:#ecf5fa;font-size:clamp(17px,2vw,28px);margin:5px 0}.operations-grid small{color:#aec2d4;font-size:11px}@media(max-width:780px){.operations-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.resource-panel{padding:17px}.upload-assurance{grid-template-columns:1fr}.upload-assurance>div{padding:9px 11px}.project .actions>*{flex:1 1 42%}}@media(prefers-reduced-motion:reduce){.status[aria-busy="true"]:before{animation:none}}.compatibility-panel{margin:16px 0;padding:18px;border:1px solid #577389;border-radius:12px;background:#0d2030}.compatibility-panel[hidden]{display:none}.compatibility-panel strong{display:block;margin-top:7px;color:#e7f3fa}.compatibility-panel ul{padding-left:20px;color:#c5d5e2;font-size:12px}.compatibility-panel li{margin:9px 0}.compatibility-panel li strong{display:inline}.compatibility-panel p{font-size:12px}.viewport-mobile{max-width:420px;margin-left:auto;margin-right:auto}.viewport-mobile iframe{height:720px;max-height:75dvh}.preview-mode{margin:14px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
`;

const SCRIPT = String.raw`
(function(){
 const q=id=>document.getElementById(id),file=q("bundle"),drop=q("drop"),
   form=q("publish-form"),status=q("activity");
 function note(message,error,busy){
   if(!status)return;
   status.textContent=message;
   status.classList.toggle("bad",!!error);
   status.setAttribute("aria-busy",busy?"true":"false");
 }
 function updateFile(f){
   if(!f)return;
   const ext=f.name.split(".").pop().toLowerCase();
   if(!["zip","html"].includes(ext)){note("Choose a .zip or self-contained .html file.",true);return;}
   if(f.size>20*1048576){note("Maximum archive size is 20 MiB.",true);return;}
   q("file-label").textContent=f.name+" · "+(f.size/1048576).toFixed(2)+" MiB";
   note("Ready for private validation. Your build is not uploaded until you continue.");
 }
 function showCompatibility(report){
   const panel=q("compatibility-result");if(!panel)return;
   panel.hidden=false;
   q("compatibility-status").textContent=report.playableCandidate?"Browser build candidate · not yet reviewed":"Needs a browser export before it can be played";
   const list=q("compatibility-issues");list.replaceChildren();
   for(const issue of report.issues||[]){
     const item=document.createElement("li"),heading=document.createElement("strong"),detail=document.createElement("span");
     heading.textContent=issue.message;detail.textContent=" "+issue.fix;
     item.append(heading,detail);list.append(item);
   }
   if(!report.issues?.length){
     const item=document.createElement("li");item.textContent="No obvious structural issues detected. This is not a malware or mobile compatibility clearance.";list.append(item);
   }
   const button=q("upload-button");if(button)button.disabled=!report.playableCandidate;
 }
 async function checkCompatibility(f){
   const panel=q("compatibility-result");if(panel)panel.hidden=true;
   const button=q("upload-button");if(button)button.disabled=true;
   if(!f)return;
   note("IREN is checking package format and supported runtime…",false,true);
   try{
     const body=new FormData();body.set("file",f);
     const data=await post("/api/v1/packages/compatibility",body,true);
     if(file?.files?.[0]!==f)return;
     showCompatibility(data.report);
     note(data.report.playableCandidate?"Compatibility report ready. Upload still requires server validation.":"This source needs an exported web build. Nothing has been stored.",!data.report.playableCandidate);
   }catch(e){note(e.message||"Compatibility check unavailable. Try again.",true);}
 }
 if(file)file.addEventListener("change",()=>{updateFile(file.files[0]);void checkCompatibility(file.files[0]);});
 if(drop){
   drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("drag")});
   drop.addEventListener("dragleave",()=>drop.classList.remove("drag"));
   drop.addEventListener("drop",e=>{
     e.preventDefault();drop.classList.remove("drag");
     if(e.dataTransfer.files.length){file.files=e.dataTransfer.files;updateFile(file.files[0]);void checkCompatibility(file.files[0]);}
   });
 }
 async function post(url,data,isFile=false){
   const r=await fetch(url,{method:"POST",credentials:"same-origin",
     headers:isFile?{"x-anevum-package":"v003"}:{"x-anevum-package":"v003","content-type":"application/json"},
     body:isFile?data:JSON.stringify(data||{})});
   let payload={};try{payload=await r.json()}catch{}
   if(!r.ok)throw Error(payload.error||("Request failed ("+r.status+")"));
   return payload;
 }
 async function localStructureCheck(f){
   const ext=f.name.split(".").pop().toLowerCase();
   if(ext==="html"){
     const start=await f.slice(0,4096).text();
     if(!/<(?:!doctype\s+html|html\b|head\b|body\b|script\b|div\b)/i.test(start))
       throw Error("This HTML file does not look like a playable web page.");
     return;
   }
   if(ext!=="zip")throw Error("Choose a .zip or .html build.");
   const b=new Uint8Array(await f.arrayBuffer());
   if(b.length<22)throw Error("This ZIP is empty or incomplete.");
   const v=new DataView(b.buffer,b.byteOffset,b.byteLength);
   let end=-1;
   for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--){
     if(v.getUint32(p,true)===0x06054b50&&p+22+v.getUint16(p+20,true)===b.length){end=p;break;}
   }
   if(end<0)throw Error("ZIP is incomplete. Export the finished project and ZIP its contents.");
   const count=v.getUint16(end+10,true);
   const total=v.getUint16(end+8,true);
   const at=v.getUint32(end+16,true),size=v.getUint32(end+12,true);
   if(count<1||count>180||total!==count||at+size!==end)
     throw Error("ZIP has an invalid file directory or exceeds 180 entries.");
   let found=false,expanded=0,p=at;
   const decode=new TextDecoder("utf-8",{fatal:true});
   for(let i=0;i<count;i++){
     if(p+46>end||v.getUint32(p,true)!==0x02014b50)
       throw Error("ZIP file list is corrupt. Re-export your build.");
     const len=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),
       comment=v.getUint16(p+32,true),unpacked=v.getUint32(p+24,true);
     const next=p+46+len+extra+comment;
     if(!len||next>end)throw Error("ZIP has an invalid file name.");
     let name;
     try{name=decode.decode(b.subarray(p+46,p+46+len));}
     catch{throw Error("ZIP contains an invalid UTF-8 file name.");}
     if(name==="index.html")found=true;
     if(!name.endsWith("/")){
       if(unpacked>12*1048576)throw Error("A file inside the ZIP exceeds the 12 MiB limit.");
       expanded+=unpacked;
       if(expanded>48*1048576)throw Error("Your ZIP expands beyond 48 MiB. Optimize assets before upload.");
     }
     p=next;
   }
   if(!found)
     throw Error("Your ZIP needs index.html at its root. ZIP the contents of your built dist folder, not the folder itself.");
 }
 async function digest(f){
   if(!globalThis.crypto||!crypto.subtle)return null;
   const b=await f.arrayBuffer(),hash=await crypto.subtle.digest("SHA-256",b);
   return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");
 }
 if(form)form.addEventListener("submit",async e=>{
   e.preventDefault();
   const button=q("upload-button"),chosen=file?.files?.[0];
   if(!chosen){note("Choose a ZIP/HTML file first.",true);return;}
   button.disabled=true;form.setAttribute("aria-busy","true");
   note("Checking file size and detecting identical builds locally…",false,true);
   try{
     const ext=chosen.name.split(".").pop().toLowerCase();
     if(!["zip","html"].includes(ext)||chosen.size<1||chosen.size>20*1048576)
       throw Error("Choose a ZIP or HTML build under 20 MiB.");
     note("Checking entry point, ZIP structure and expanded size on your device…",false,true);
     await localStructureCheck(chosen);
     const hash=await digest(chosen);
     if(hash){
       note("Checking whether this project already has the same build…",false,true);
       const check=await post("/api/v1/packages/preflight",{
         projectId:q("existing-project").value,filename:chosen.name,
         size:chosen.size,sha256:hash
       });
       if(check.duplicate){
         note("Identical build already stored. No new upload or storage used.");
         location.assign(check.play_url);
         return;
       }
       if(check.needsReplace&&q("replace-draft").value!=="1")
         throw Error("Choose Replace test build to confirm changing the current private build.");
     }
     note("Validating package structure and creating a temporary private test…",false,true);
     const result=await post("/api/v1/packages/upload",new FormData(form),true);
     if(result.duplicate)note("Identical package found; no additional bytes were stored.");
     if(result.compatibility)showCompatibility(result.compatibility);
     location.assign(result.play_url);
   }catch(e){note(e.message||"Upload failed. Your existing release was not changed.",true);}
   finally{button.disabled=false;form.setAttribute("aria-busy","false");}
 });
 function chooseProject(btn,isReplacement){
   if(!form)return;
   q("existing-project").value=btn.dataset.project;
   q("replace-draft").value=isReplacement?"1":"0";
   q("title").value=btn.dataset.title||"";
   q("summary").value=btn.dataset.summary||"";
   q("category").value=btn.dataset.category||"game";
   q("project-version").textContent=isReplacement?"Replace private test build":"New version of an existing project";
   form.scrollIntoView({behavior:"smooth",block:"start"});
   note(isReplacement?"The current build remains playable if the new upload fails.":"Upload a new version under the existing project.");
 }
 document.addEventListener("click",async e=>{
   const btn=e.target.closest("[data-package-action]");if(!btn)return;
   const id=btn.dataset.project,action=btn.dataset.packageAction;
   if(!id)return;
   if(action==="version"||action==="replace"){chooseProject(btn,action==="replace");return;}
   if(action==="fullscreen"){
     const v=q("game-viewport");if(v?.requestFullscreen)await v.requestFullscreen().catch(()=>{});
     return;
   }
   if(action==="restart"){
     const frame=q("game-frame");if(frame)frame.src=frame.getAttribute("src");return;
   }
   if(action==="submit"&&!confirm("Submit this private build to staff for review?"))return;
   if(action==="publish"&&!confirm("Make this approved build publicly playable?"))return;
   if(action==="discard"&&!confirm("Discard this private build? Your project identity and any published version stay intact."))return;
   if(action==="delete"&&!confirm("Remove this unpublished project? Its private assets will be queued for cleanup."))return;
   let reason="";
   if(action==="reject"){
     reason=prompt("Give a reason for changes (10 or more characters):")||"";
     if(reason.trim().length<10)return;
   }
   btn.disabled=true;note("Processing "+action+"…",false,true);
   try{
     await post("/api/v1/packages/projects/"+id+"/"+
       (action==="publish"||action==="reject"?"review":action),{action,reason});
     location.reload();
   }catch(e){note(e.message||"Action failed",true);btn.disabled=false;}
 });
})();
`;

export const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
const state = x => x === "published" ? "Published" : x === "pending_review" ? "In review" : x === "ready" ? "Ready to submit" : x === "saved" ? "Saved private draft" : x === "expired" ? "Expired test" : x === "test" ? "Private test" : x === "rejected" ? "Needs revision" : x;
const action = (project, verb, label, extra = "") =>
  '<button class="'+(verb==="delete"?"danger":"quiet")+'" data-package-action="'+verb+'" data-project="'+esc(project.id)+'" '+extra+'>'+esc(label)+'</button>';
export function layout(title, body, runner = "") {
  const frame = runner ? "frame-src " + runner + "; " : "frame-src 'none'; ";
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#080c13"><title>'+esc(title)+' · ANEVUM</title><style>'+CSS+'</style></head><body>'+
    '<header><div class="top"><a class="brand" href="/">ANEVUM<small>THE CONTINUANCE INSTITUTE</small></a><nav aria-label="Creator navigation"><a href="/upload/v3">Create</a><a href="/packages">Discover</a><a href="/help/packages">Help</a><a href="/alpha">Legacy alpha</a></nav></div></header><main>'+body+'</main><footer class="foot">ANEVUM / Creator infrastructure alpha · <a href="/help/packages">Publishing guide</a></footer><script>'+SCRIPT+'</script></body></html>';
  return new Response(html, { headers: { "content-type":"text/html; charset=utf-8", "cache-control":"private, no-store",
    "x-content-type-options":"nosniff", "referrer-policy":"no-referrer", "x-robots-tag":"noindex",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; "+frame+" connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'" } });
}
export function card(p,owner=false,reviewer=false){
  const hasDraft=!!p.draft_release_id,ready=hasDraft&&p.draft_status==="ready";
  const expired=!!(ready&&p.draft_mode==="test"&&p.draft_expires_at&&p.draft_expires_at<=Math.floor(Date.now()/1000));
  const preview=(owner||reviewer)&&hasDraft&&!expired?"/play/v3/"+p.id+"?preview=1":"/play/v3/"+p.id;
  const summary=p.summary.length>190?p.summary.slice(0,190)+"…":p.summary;
  const badge=expired?"expired":ready?(p.draft_mode==="saved"?"saved":"test"):(hasDraft?p.draft_status:p.status);
  const meta=' data-title="'+esc(p.title)+'" data-summary="'+esc(p.summary)+'" data-category="'+esc(p.category)+'"';
  const when=expired?'<div class="build-retention">This private test has expired. Replace or discard it; your project remains.</div>':
    ready&&p.draft_mode==="test"&&p.draft_expires_at
    ?'<div class="build-retention">Private test expires '+new Date(p.draft_expires_at*1000).toLocaleString("en-US")+'. Save it to keep it.</div>':
    ready&&p.draft_mode==="saved"?'<div class="build-retention">Saved private draft · Occupies your storage until replaced or discarded.</div>':"";
  const actions=
    (!reviewer&&(!owner||(hasDraft&&!expired)||p.status==="published")
      ?'<a class="button" href="'+preview+'">'+(expired?"Play published version":hasDraft&&owner?"Test build":"Play project")+'</a>':"")+
    (owner&&ready
      ?(!expired&&p.draft_mode!=="saved"?action(p,"save","Save draft"):"")+
       action(p,"replace",expired?"Replace expired build":p.draft_mode==="saved"?"Replace saved draft":"Replace test build",meta)+
       action(p,"discard","Discard build")+
       (!expired?action(p,"submit","Submit for review"):""):"")+
    (owner&&!hasDraft
      ?action(p,"version",p.status==="published"?"Upload update":"Revise project",meta):"")+
    (owner&&!hasDraft&&!p.live_release_id?action(p,"delete","Delete project"):"")+
    (reviewer?'<a class="button primary" href="/play/v3/'+esc(p.id)+'?preview=1">Review build</a>':"");
  return '<article class="project"><span class="chip '+esc(badge)+'">'+esc(state(badge))+' · '+esc(p.category)+'</span>'+
    '<h3>'+esc(p.title)+'</h3><p>'+esc(summary)+'</p>'+
    '<div class="meta">'+(p.release_version?"Build v"+Number(p.release_version)+" · ":"")+
      'Updated '+new Date(p.updated_at*1000).toLocaleDateString("en-US")+'</div>'+
    (p.review_reason?'<p class="status bad">Review: '+esc(p.review_reason)+'</p>':"")+
    when+'<div class="actions">'+actions+'</div></article>';
}
export function uploadScreen(projects,loggedIn,pilot,updateId,usage=null){
 const selected=projects.find(p=>p.id===updateId)||null;
 const title=selected?esc(selected.title):"",summary=selected?esc(selected.summary):"";
 const chosenCategory=selected?.category||"game";
 const kinds=[["game","Game"],["app","Interactive app"],["simulation","Simulation"],["story","Interactive story"]];
 const intro='<div class="ey">ANEVUM / CREATOR UPLINK / BUILD LAB 004</div>'+
   '<h1>Create freely.<br>Keep what works.</h1>'+
   '<p class="lead">Bring a real HTML5 game, web app, interactive story or simulation. Test private builds as often as your storage allowance permits. Save only the versions that matter.</p>';
 const num=bytes=>(bytes/1048576).toFixed(1)+" MiB";
 const fill=usage?Math.max(0,Math.min(100,Math.round(100*usage.memberPhysicalBytes/usage.memberPhysicalLimit))):0;
 const storage=usage?'<section class="resource-panel" aria-label="Private creator storage">'+
   '<div class="resource-head"><div><div class="ey">YOUR PRIVATE BUILD VAULT</div>'+
   '<strong>'+num(usage.memberPhysicalBytes)+' <span class="subtle-note">/ '+num(usage.memberPhysicalLimit)+'</span></strong></div>'+
   '<span class="chip">Storage used</span></div>'+
   '<div class="resource-track" role="progressbar" aria-label="Storage used" aria-valuenow="'+fill+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+fill+'%"></span></div>'+
   '<div class="resource-foot"><span>'+num(usage.memberArchiveBytes)+' compressed · '+usage.cleanupPending+' awaiting cleanup</span>'+
   '<span>Shared pilot storage '+num(usage.pilotPhysicalBytes)+' / '+num(usage.pilotPhysicalLimit)+'</span></div>'+
   '<p class="subtle-note">Expired test builds are cleared automatically once cleanup runs. Saved drafts and published releases are retained; removing a file may take a short time to free space.</p></section>':"";
 const upload=!loggedIn
   ?'<div class="notice"><strong>Member sign-in required.</strong><p>Sign in using your ANEVUM account to create a project.</p><div class="actions"><a class="button primary" href="/join">Sign in</a></div></div>'
   :!pilot
   ?'<div class="notice"><strong>New uploads are paused or restricted.</strong><p>You can still manage, save and discard your existing private projects below. IREN will guide you when the uploader becomes available.</p></div>'
   :'<form id="publish-form" aria-busy="false">'+
     '<input type="hidden" name="project_id" id="existing-project" value="'+esc(updateId)+'">'+
     '<input type="hidden" name="replace_draft" id="replace-draft" value="'+(selected?.draft_release_id?"1":"0")+'">'+
     '<div class="ey" id="project-version">'+(selected?.draft_release_id?"Replace private test build":updateId?"New version":"Start a new project")+'</div>'+
     '<h2>Prepare a private build</h2>'+
     '<p class="subtle-note">A new build is initially temporary for 48 hours. Your live release is never replaced until staff approves the update.</p>'+
     '<label for="bundle">Upload your finished web package</label>'+
     '<label class="drop" id="drop" for="bundle"><span class="symbol" aria-hidden="true">↑</span>'+
     '<strong id="file-label">Drop a ZIP or HTML file</strong>'+
     '<span>Or tap to browse · up to 20 MiB compressed · multiple game assets supported</span>'+
     '<input id="bundle" name="file" type="file" accept=".zip,.html" required></label>'+
     '<section class="compatibility-panel" id="compatibility-result" aria-live="polite" hidden><div class="ey">IREN / FORMAT ANALYSIS</div><strong id="compatibility-status"></strong><ul id="compatibility-issues"></ul><p>Format detection is advisory. Private player tests and staff review remain required.</p></section>'+ 
     '<label for="title">Project title</label>'+
     '<input class="field" id="title" name="title" minlength="3" maxlength="100" value="'+title+'" placeholder="The name people will remember" required>'+
     '<label for="category">Experience type</label>'+
     '<select class="field" id="category" name="category">'+kinds.map(([v,label])=>
       '<option value="'+v+'"'+(chosenCategory===v?" selected":"")+'>'+label+'</option>').join("")+'</select>'+
     '<label for="summary">Tell people what you built</label>'+
     '<textarea class="field" id="summary" name="summary" minlength="10" maxlength="500" placeholder="What can players do?" required>'+summary+'</textarea>'+
     '<div class="upload-assurance">'+
       '<div><strong>Private first</strong><span>No automatic publication</span></div>'+
       '<div><strong>Duplicate-aware</strong><span>No new copy for identical files</span></div>'+
       '<div><strong>Safe updates</strong><span>Keep your last playable release</span></div></div>'+
     '<div class="tip"><strong>Before upload:</strong> ZIP the built app files with a root <code>index.html</code>; omit dependencies, private keys and source-only folders. Large files and invalid archives are rejected.</div>'+
     '<div class="actions"><button class="primary" type="submit" id="upload-button">Validate & open private test →</button></div>'+
     '<p class="status" id="activity" role="status" aria-live="polite"></p></form>';
 const guide='<div class="ey">IREN / BUILD ASSIST</div><h2>Experiment without accumulating clutter.</h2>'+
   '<div class="steps">'+
   '<div class="step"><div class="num">01</div><div><strong>Check locally</strong><p>Export the web build, make sure the root index.html works, and use ZIP/HTML. No server storage until upload.</p></div></div>'+
   '<div class="step"><div class="num">02</div><div><strong>Test for 48 hours</strong><p>Upload one temporary build and open it in ANEVUM’s isolated player. Fix errors and replace the same project’s private test.</p></div></div>'+
   '<div class="step"><div class="num">03</div><div><strong>Save draft or submit</strong><p>Keep a working build privately, or submit for human review. Published releases stay live during updates.</p></div></div>'+
   '<div class="step"><div class="num">04</div><div><strong>Discard broken builds</strong><p>Unused temporary files enter cleanup. Your project page, progression and existing published version remain intact.</p></div></div></div>'+
   '<a href="/help/packages">View package requirements →</a>';
 return layout("Creator upload",intro+storage+
   '<div class="grid"><section class="panel">'+upload+'</section><aside class="panel">'+guide+'</aside></div>'+
   (loggedIn?'<div class="titlebar"><div><div class="ey">YOUR CREATOR WORKSPACE</div><h2>Projects and versions</h2></div>'+
     '<p>Upload, test, save, revise and review</p></div>'+
     (projects.length?'<div class="project-grid">'+projects.map(p=>card(p,true)).join("")+'</div>':
       '<div class="notice">No projects yet. Your first upload starts a private project space.</div>'):""));
}
export function catalogScreen(projects) {
  return layout("Playable projects",'<div class="ey">ANEVUM / EXPLORE</div><h1>Created to be experienced.</h1><p class="lead">Real games, apps, interactive stories, and simulations. Every release is verified and published by a creator.</p><div class="actions"><a href="/upload/v3" class="button primary">Publish a project →</a></div><div class="titlebar"><h2>Playable releases</h2></div>'+(projects.length?'<div class="project-grid">'+projects.map(p=>card(p)).join("")+'</div>':'<div class="notice">No projects have cleared review in the new package runtime yet.</div>'));
}
export function playerScreen(p, release, runnerURL, isPreview, canEdit, isStaff) {
  const actions = (canEdit&&isPreview&&release.status==="ready"?action(p,"submit","Submit for review"):'')+
    (isStaff&&isPreview&&release.status==="pending_review"?action(p,"publish","Approve and publish") +action(p,"reject","Request changes"):'');
  const html='<div class="ey">ANEVUM / '+esc(p.category.toUpperCase())+' / BUILD '+release.version+'</div>'+
    '<div class="player-head"><div><h1>'+esc(p.title)+'</h1><p class="lead">'+esc(p.summary)+'</p><span class="chip '+esc(release.status)+'">'+esc(state(release.status))+(isPreview?' · Private preview':'')+'</span></div><div class="actions"><a class="button quiet" href="/upload/v3">Creator space</a><a class="button quiet" href="/packages">All projects</a></div></div>'+
    (runnerURL?'<section class="viewport" id="game-viewport" aria-label="Interactive experience"><iframe id="game-frame" title="'+esc(p.title)+'" src="'+esc(runnerURL)+'" sandbox="allow-scripts allow-pointer-lock" allow="fullscreen; gamepad" referrerpolicy="no-referrer" loading="eager"></iframe></section>':'<div class="notice">Playable runtime is not configured on this environment.</div>')+
    '<div class="player-controls">'+action(p,"restart","Restart")+action(p,"fullscreen","Fullscreen")+actions+'</div>'+
    '<p id="activity" class="status" role="status" aria-live="polite"></p>'+
    '<div class="details"><div class="ey">RELEASE DETAILS</div><p>Package v'+release.version+' · '+release.file_count+' assets · '+(release.expanded_bytes/1048576).toFixed(1)+' MiB installed</p>'+
    (isPreview?'<p class="tip">This is a private, short-lived preview link. Refresh this page if it expires. Your build is not public until a reviewer approves it.</p>':'')+
    '<p>Problems loading? Verify your ZIP contains relative local assets and an <code>index.html</code> entry point. Remote APIs are disabled for browser builds.</p></div>';
  return layout(p.title,html,runnerURL?new URL(runnerURL).origin:"");
}
export function queueScreen(items,metrics=null) {
 const operations=metrics?'<section aria-label="Package storage operations">'+
  '<div class="ey">STORAGE GUARDIAN / OPERATIONS</div>'+
  '<div class="operations-grid">'+
  '<div><span>Private tests</span><strong>'+Number(metrics.temporary||0)+'</strong><small>Auto-expire unless saved</small></div>'+
  '<div><span>Expired tests</span><strong>'+Number(metrics.expired||0)+'</strong><small>Queued for removal</small></div>'+
  '<div><span>Cleanup backlog</span><strong>'+Number(metrics.cleanupPending||0)+'</strong><small>R2 erasure with retries</small></div>'+
  '<div><span>Interrupted uploads</span><strong>'+Number(metrics.orphanReservations||0)+'</strong><small>Reclaimed after lease expiry</small></div>'+
  '</div><p class="subtle-note">Cleanup never removes the currently published release. Archive bytes and active project metadata stay intact until private R2 erasure is confirmed. Detailed totals require the staff-only metrics API.</p></section>':"";
 return layout("Package review",'<div class="ey">ANEVUM / STAFF REVIEW</div>'+
  '<h1>Review playable builds.</h1><p class="lead">Every executable release requires staff approval. Inspect isolated previews and review actual functionality before publication.</p>'+
  operations+'<div class="titlebar"><h2>Awaiting review</h2></div>'+
  (items.length?'<div class="queue">'+items.map(p=>card(p,false,true)).join("")+'</div>':
  '<div class="notice">The package review queue is clear.</div>'));
}
export function helpScreen() {
  return layout("Package help",'<div class="ey">ANEVUM / PUBLISHING GUIDE</div><h1>Ship the build.<br>Not a screenshot.</h1><p class="lead">ANEVUM accepts complete browser projects. The easiest route is to export a static web build, ZIP its contents, and upload the archive.</p><div class="grid"><section class="panel"><h2>Required structure</h2><p>Your ZIP must contain a root <code>index.html</code> and local scripts, styles, textures, audio or models referenced by relative paths.</p><pre aria-label="Example ZIP directory">index.html\njs/game.js\nassets/ship.glb\nassets/music.ogg</pre><h2>Limits for this alpha</h2><p>20 MiB compressed ZIP · 48 MiB uncompressed assets · 180 files · 12 MiB per file. Temporary private builds expire after 48 hours unless explicitly saved; save drafts within your private storage allowance. Only supported browser asset extensions are accepted. ZIP64, encrypted archives, symlinks and executables are rejected.</p><h2>AI-generated applications</h2><p>Publish the built client-side output, such as a Vite <code>dist/</code> directory exported with relative asset URLs. Do not upload <code>node_modules</code> or development secrets. Apps requiring a server, database or private AI keys need the future hosted-app runtime.</p></section><aside class="panel"><div class="ey">SECURITY MODEL</div><h2>Execution is isolated.</h2><p>Uploaded code runs on a separate host, inside a sandboxed player. Local web assets may load, but camera, microphone, network APIs, and parent-account access are blocked by default.</p><p>Projects are staged privately. You can test them before submitting for review. A published project keeps its existing playable release online while you prepare an update.</p><a class="button primary" href="/upload/v3">Open uploader →</a></aside></div>');
}
