import {CREST,SIGIL,ORBITAL_ART,V005_CSS} from "./continuance-visuals.mjs";

/* ANEVUM / Continuance Institute / Package Creator 003
 * Focused UI with functional affordances instead of ornamental effects.
 */
export const CSS = String.raw`
:root{color-scheme:dark;--bg:#080c13;--surface:#111925;--surface2:#182332;--line:#354357;--text:#f3f0e9;--muted:#aab8c9;--gold:#e3c18b;--red:#efa9a0;--green:#a7ddc4}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--text);background:radial-gradient(ellipse at 80% -10%,#172536 0%,transparent 46%),var(--bg);font:15px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,select,textarea{font:inherit}a{color:var(--gold)}button,.button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:43px;padding:10px 16px;border:1px solid #657288;border-radius:9px;background:#263449;color:var(--text);text-decoration:none;font-size:13px;font-weight:680;cursor:pointer}button:hover,.button:hover{background:#31435b}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid var(--gold);outline-offset:3px}button:disabled{opacity:.5;cursor:not-allowed}.primary{background:var(--gold);color:#0b121d;border-color:var(--gold)}.primary:hover{background:#f4d7a7;color:#080e16}.quiet{background:transparent;border-color:#526075}.danger{color:#ffd9d5;border-color:#7e4a53;background:#38232c}header{position:sticky;top:0;z-index:2;border-bottom:1px solid #3a4758;background:#0c121dde;backdrop-filter:blur(18px)}.top{max-width:1250px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 22px}.brand{text-decoration:none;color:var(--text);font-weight:760;font-size:14px;letter-spacing:.15em}.brand small{display:block;letter-spacing:.12em;color:var(--gold);font-size:9px;font-weight:600}.top nav{display:flex;flex-wrap:wrap;align-items:center;gap:16px}.top nav a{font-size:12px;color:#c7d2df;text-decoration:none}.top nav a:hover{text-decoration:underline;color:var(--gold)}main{width:min(1150px,calc(100% - 36px));margin:0 auto;padding:44px 0 90px}.ey{font:700 11px/1.5 system-ui,sans-serif;color:var(--gold);letter-spacing:.16em;text-transform:uppercase}.intro{max-width:780px;margin:5px 0 28px}h1{font-size:clamp(33px,5.7vw,66px);letter-spacing:-.062em;line-height:1.04;margin:9px 0 18px;font-weight:720}h2{font-size:clamp(21px,2.6vw,30px);letter-spacing:-.045em;margin:0 0 10px}h3{font-size:19px;letter-spacing:-.025em;margin:0 0 8px}p{margin:9px 0 13px;color:var(--muted)}.lead{font-size:clamp(15px,2vw,18px);max-width:660px}.meta{color:#92a1b4;font-size:12px}.grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,1fr);gap:20px;align-items:start}.panel{border:1px solid var(--line);border-radius:14px;background:linear-gradient(145deg,#151e2b,#101823);padding:clamp(18px,3vw,30px);box-shadow:0 15px 35px #0003}.panel h2{margin:0 0 4px}.panel+.panel{margin-top:15px}label{display:block;color:#d1dae6;font-size:12px;font-weight:650;margin:15px 0 7px}.field{width:100%;min-height:44px;padding:11px 13px;color:var(--text);background:#0a121d;border:1px solid #56657b;border-radius:8px}.field::placeholder{color:#77879d}textarea.field{min-height:92px;resize:vertical}.drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:175px;text-align:center;background:#0a131f;border:1.5px dashed #697991;border-radius:12px;padding:20px;cursor:pointer;transition:border-color .15s,background .15s}.drop:hover,.drop.drag,.drop:focus-within{border-color:var(--gold);background:#152130}.drop input{position:absolute;opacity:0;width:1px;height:1px}.drop strong{font-size:17px}.drop span{color:#acbbcc;font-size:12px}.drop .symbol{display:grid;place-items:center;width:41px;height:41px;border-radius:11px;background:#25344b;color:var(--gold);font-size:22px}.actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin:20px 0 0}.tip{border-left:2px solid var(--gold);padding:3px 0 3px 13px;margin:17px 0;color:#c6d0de;font-size:13px}.steps{display:grid;gap:14px;margin:18px 0}.step{display:flex;gap:13px;align-items:flex-start;padding-bottom:14px;border-bottom:1px solid #344355}.step:last-child{border-bottom:0;padding-bottom:0}.num{width:27px;height:27px;border:1px solid #6e7b8d;border-radius:8px;display:grid;place-items:center;color:var(--gold);flex:none;font-size:12px}.step strong{display:block;font-size:14px}.step p{font-size:12px;margin:1px 0}.status{min-height:23px;margin-top:14px;color:var(--green);font-size:13px}.status.bad{color:var(--red)}.titlebar{margin:50px 0 14px;display:flex;gap:16px;justify-content:space-between;align-items:end;flex-wrap:wrap}.titlebar p{margin:0}.project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(278px,1fr));gap:12px}.project{border:1px solid #45546a;background:#151e2a;border-radius:12px;padding:19px;display:flex;flex-direction:column;gap:9px}.project h3{margin:3px 0}.project p{font-size:13px;margin:0;flex:1;overflow-wrap:anywhere}.project .actions{margin:8px 0 0}.project .actions>*{flex:1}.chip{display:inline-block;width:max-content;max-width:100%;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#c8d9e6;border:1px solid #526177;border-radius:6px;padding:4px 7px}.chip.ready,.chip.published{color:var(--green);border-color:#436e61}.chip.rejected{color:var(--red);border-color:#824b50}.notice{border:1px dashed #728096;border-radius:11px;padding:18px 19px;background:#111927;color:#c5cfdc}.notice p{margin:0}.player-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap}.player-head h1{font-size:clamp(28px,4vw,48px)}.viewport{position:relative;display:grid;place-items:center;margin:26px 0 0;background:#020509;border:1px solid #53637b;border-radius:13px;overflow:hidden;min-height:340px;box-shadow:0 24px 80px #0008}.viewport iframe{display:block;width:100%;height:clamp(390px,70vh,820px);border:0;background:#03070c}.viewport:fullscreen{width:100%;height:100%;border:0;border-radius:0}.viewport:fullscreen iframe{height:100%;min-height:100%}.player-controls{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:12px}.details{margin:26px 0;padding-top:20px;border-top:1px solid #334256}.queue{display:grid;gap:12px}.queue .project{display:block}.small{font-size:12px}.foot{border-top:1px solid #2c3b4e;color:#8491a5;padding:22px;text-align:center;font-size:11px}.foot a{color:#bfcadc;text-decoration:none}.hidden{display:none!important}dialog{color:var(--text);background:#151f2b;border:1px solid #62728a;border-radius:13px;max-width:480px;padding:25px}dialog::backdrop{background:#000b}@media(max-width:800px){.grid{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column;gap:10px}.top nav{gap:11px}main{padding-top:30px}.viewport iframe{height:64dvh;min-height:290px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.drop{transition:none}}

/* ANEVUM / Continuance Uplink v004 — focused, phone-first shipping experience */
:root{--bg:#071020;--surface:#101c2d;--surface2:#182940;--line:#344c66;--text:#eef4fb;--muted:#b5c5d9;--gold:#c8e9ee;--green:#a9dfc8}
body{background:radial-gradient(ellipse 58% 35% at 88% -8%,rgba(61,101,146,.2),transparent),linear-gradient(165deg,#091427,#07101f 68%);min-width:0}
main{width:min(1140px,calc(100% - 38px));padding:33px 0 90px}
header{backdrop-filter:blur(18px);background:rgba(8,17,32,.94);border-bottom-color:rgba(153,193,231,.19)}
.top{padding:12px 22px}.top nav a{min-height:44px;display:inline-flex;align-items:center}
.brand small{font-size:9px;color:#a9d8df;letter-spacing:.12em}.brand{letter-spacing:.08em;font-size:15px}
h1{font-size:clamp(35px,5.1vw,57px);font-weight:650;line-height:1.09;letter-spacing:-.047em}
h2{font-weight:630;letter-spacing:-.03em}
.ey{font-size:10px;color:#a9dce5;letter-spacing:.145em}
.lead{line-height:1.6;max-width:690px}
.grid{grid-template-columns:minmax(0,1.45fr) minmax(275px,.85fr);gap:17px}
.panel{background:linear-gradient(155deg,#122037,#0b1729);border-color:rgba(151,191,224,.21);box-shadow:0 13px 36px #0004;border-radius:16px}
.panel.soft{background:#101c2e}.panel+.panel{margin-top:14px}
label{font-size:13px;margin:14px 0 7px}
.field{min-height:49px;border-color:#516983;background:#091426;padding:13px 15px;border-radius:10px}
textarea.field{min-height:105px;line-height:1.5}
.field:focus{border-color:#a9dce5}
button,.button{min-height:46px;border-radius:10px;border-color:#506a86;font-size:13px;font-weight:650}
.primary{background:#c5e8ee;color:#09182a;border-color:#c5e8ee}.primary:hover{background:#edfcff;color:#071323}
button:focus-visible,.button:focus-visible,select:focus-visible{outline-color:#b8ebf3}
.drop{border:1.5px dashed #5e8aab;background:linear-gradient(145deg,#0b1a2f,#0b1524);min-height:160px;padding:22px 16px;border-radius:13px;gap:7px}
.drop:hover,.drop.drag,.drop:focus-within{background:#112941;border-color:#a3e8f2}
.drop strong{font-size:16px}.drop span{font-size:12px}.drop .symbol{background:#17344d;color:#b5e9ef;width:46px;height:46px;font-size:21px}
.drop[aria-invalid=true]{border-color:#f4a2a2}
.drop input{position:absolute;opacity:0;width:1px;height:1px}
.file-check{display:flex;gap:8px;align-items:center;font-size:12px;margin:10px 0 13px;color:#a8d8da}
.form-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 13px}
.form-grid>.full{grid-column:1/-1}
.format-options{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:4px 0 15px}
.format-option{padding:12px 13px;border:1px solid #405975;border-radius:11px;background:rgba(12,26,45,.8)}
.format-option strong{font-size:13px;display:block;margin:1px 0 4px}
.format-option span{font-size:11px;color:#acc0d5;line-height:1.4;display:block}
.subheading{font-size:11px;color:#acc0d5;letter-spacing:.08em;text-transform:uppercase;margin:10px 0}
.stepper{display:flex;align-items:center;justify-content:flex-start;flex-wrap:wrap;gap:7px;margin:0 0 21px}
.stepper span{font-size:11px;border:1px solid #37516d;border-radius:99px;padding:5px 10px;color:#a9b9ce}
.stepper .active{background:#1b3647;border-color:#79b9c6;color:#e2f7f8}
.upload-guide{position:sticky;top:80px}
.tip{border-left-color:#8fbfce;font-size:12px;line-height:1.6}
.tip a{color:#b8e8f1}
.status{min-height:23px;color:#b5e8d3}
.status.bad{color:#ffb2ad}
.foot{border-top-color:#2d4059}
.help-quick{display:grid;gap:10px}.help-quick article{border:1px solid #2d4761;padding:11px 13px;border-radius:10px;background:#101e33}
.help-quick p{font-size:12px;margin:4px 0}
.bordered-link{display:inline-flex;align-items:center;min-height:43px;font-size:12px}
.project{background:linear-gradient(150deg,#142239,#0e1a2b);border-color:#35506b;border-radius:15px;padding:19px}
.project h3{font-size:19px}.project .actions>*{min-width:0}
.project .meta{color:#9ab0c9}.project .chip{border-radius:99px}
.chip.pending_review{border-color:#9b8164;color:#e7c9a4}
.chip.rejected{color:#ffbbb4}
.notice{background:#101c2d;border-color:#526982}
.notice strong{color:#e7f3fd}
.notice a{color:#b9eaf1}
.titlebar{margin-top:40px}
.viewport{background:#020609;border-color:#3a526d;border-radius:14px;min-height:280px}
.viewport iframe{height:clamp(360px,70vh,760px)}
.viewport .exit-immersive{display:none;position:absolute;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));z-index:5;background:#091727ee;border:1px solid #a3cbd8;color:#fff;min-width:70px;min-height:46px}
.viewport:fullscreen .exit-immersive,.viewport.immersive .exit-immersive{display:flex}
.viewport:fullscreen,.viewport.immersive{position:fixed;inset:0;z-index:100;width:100%;height:100%;max-width:none;margin:0;border:0;border-radius:0;background:#000}
.viewport:fullscreen iframe,.viewport.immersive iframe{height:100%;min-height:100%;width:100%}
body.player-immersive{overflow:hidden}
.player-head h1{font-size:clamp(28px,4.5vw,48px)}
.player-controls{gap:9px}
.player-controls button{flex:0 0 auto}
.inline-note{font-size:12px;color:#aabbd1}
.inline-note strong{color:#eff7ff}
.detail-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.detail-row>*{border:1px solid #3b5471;border-radius:8px;padding:7px 11px;color:#c7d8e9;font-size:12px}
.empty-state{display:grid;gap:5px;border:1px dashed #47637e;border-radius:14px;padding:24px;background:#0e1b2d}
.empty-state strong{font-size:17px;color:#e9f4fd}
dialog{width:min(92vw,500px);background:#101f33;border-radius:16px;border-color:#62859f;color:var(--text);padding:24px}
dialog::backdrop{background:#010715c7}
dialog textarea{width:100%}
.dialog-actions{display:flex;flex-wrap:wrap;gap:9px;justify-content:flex-end;margin-top:18px}
.review-confirm{display:flex;gap:10px;align-items:flex-start;color:#d5e3f2;font-size:12px;line-height:1.45}
.review-confirm input{margin:3px 0;flex:none;width:18px;height:18px}
.review-confirm strong{display:block}
.file-form-note{font-size:12px;margin:7px 0 0}
@media(max-width:800px){
 .grid{grid-template-columns:1fr;gap:12px}.top{flex-direction:row;align-items:center;gap:8px}
 .top nav{justify-content:flex-end;gap:11px}
 main{padding-top:24px}
 .upload-guide{position:static}
 .viewport iframe{height:62dvh;min-height:290px}
 .player-head{gap:8px}
}
@media(max-width:500px){
 body{font-size:14px}.top{padding:10px 14px}
 .brand{font-size:13px}.brand small{font-size:7px}
 .top nav{gap:8px}.top nav a{font-size:11px;min-height:44px}
 .top nav a:last-child{display:none}
 main{width:min(100% - 26px,1140px);padding-top:20px}
 h1{font-size:clamp(31px,9vw,39px);margin:6px 0 12px}
 .panel{padding:17px}.grid{gap:12px}
 .format-options{gap:7px}.format-option{padding:10px}
 .drop{min-height:151px;padding:16px}
 .form-grid{grid-template-columns:1fr}.form-grid>.full{grid-column:auto}
 .actions{gap:8px}.actions>*{flex:1}
 .project-grid{grid-template-columns:1fr}
 .viewport{margin-top:12px}.viewport iframe{height:61dvh;min-height:300px}
 .player-controls button{flex:1}
 .stepper span{padding:4px 7px;font-size:10px}
 .titlebar{margin-top:27px}
 .help-quick article{padding:10px}
}
@media(max-width:350px){.format-options{grid-template-columns:1fr}.format-option{padding:10px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}

`;

export const SCRIPT = String.raw`
(function(){
  const q=id=>document.getElementById(id);
  const file=q("bundle"),drop=q("drop"),form=q("publish-form"),status=q("activity");
  const MiB=1048576;
  function note(message,error){if(status){status.textContent=message;status.classList.toggle("bad",!!error);status.setAttribute("role",error?"alert":"status");}}
  function validFile(f){
    if(!f)return "Choose a ZIP or HTML build.";
    const ext=f.name.split(".").at(-1)?.toLowerCase();
    if(ext!=="zip"&&ext!=="html")return "Choose a .zip build or a self-contained .html file.";
    if(f.size===0)return "This file is empty. Export a complete browser build.";
    if(f.size>(ext==="html"?5:20)*MiB)return ext==="html"?"Standalone HTML is limited to 5 MiB. Export a ZIP for multi-file builds.":"ZIP uploads are limited to 20 MiB in this pilot.";
    return "";
  }
  function updateFile(f){
    const error=validFile(f);
    if(drop)drop.setAttribute("aria-invalid",String(!!error));
    if(f&&q("file-label"))q("file-label").textContent=f.name+" · "+(f.size/MiB).toFixed(2)+" MiB";
    if(error)note(error,true);
    else note("File selected. Add the project details, then prepare a private preview.");
    if(q("upload-button"))q("upload-button").disabled=!!error||!!coverError;
  }
  if(file){
    file.addEventListener("change",()=>updateFile(file.files[0]));
  }
  const cover=q("cover"),coverPreview=q("cover-preview"),coverArt=q("cover-preview-wrap"),coverNote=q("cover-hint");
  let coverObjectURL=null,coverError="",coverValidation=0;
  function coverStatus(message,isError=false){
    if(coverNote){coverNote.textContent=message;coverNote.classList.toggle("bad",isError);}
    coverError=isError?message:"";
    if(q("upload-button"))q("upload-button").disabled=!!coverError||!!validFile(file?.files?.[0]);
  }
  if(cover)cover.addEventListener("change",()=>{
    const token=++coverValidation;
    const uploaded=cover.files?.[0];
    if(coverObjectURL){URL.revokeObjectURL(coverObjectURL);coverObjectURL=null;}
    if(coverPreview){coverPreview.hidden=true;coverPreview.removeAttribute("src");}
    coverArt?.classList.remove("has-image");
    if(!uploaded){coverStatus("Optional. Use an original PNG cover you have rights to.");return;}
    if(uploaded.size>3*MiB||uploaded.size<70||!/\.png$/i.test(uploaded.name)){
      coverStatus("Choose a PNG cover between 70 bytes and 3 MiB.",true);return;
    }
    coverObjectURL=URL.createObjectURL(uploaded);
    const image=new Image();
    image.onload=()=>{
      if(token!==coverValidation)return;
      const w=image.naturalWidth,h=image.naturalHeight;
      if(w<640||h<360||w>4096||h>4096||w*h>12000000||w/h<0.5||w/h>3){
        coverStatus("Use a PNG from 640×360 to 4096×4096 pixels with a sensible aspect ratio.",true);
        return;
      }
      if(coverPreview){
        coverPreview.src=coverObjectURL;
        coverPreview.hidden=false;
        coverArt?.classList.add("has-image");
      }
      coverStatus("Artwork ready · "+w+" × "+h+" · "+(uploaded.size/MiB).toFixed(2)+" MiB");
    };
    image.onerror=()=>{if(token===coverValidation)coverStatus("The selected PNG could not be displayed.",true);};
    image.src=coverObjectURL;
  });
  addEventListener("pagehide",()=>{if(coverObjectURL)URL.revokeObjectURL(coverObjectURL);});
  if(drop){
    for(const event of ["dragenter","dragover"])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.add("drag");});
    for(const event of ["dragleave","dragend"])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.remove("drag");});
    drop.addEventListener("drop",e=>{
      e.preventDefault();drop.classList.remove("drag");
      const f=e.dataTransfer?.files?.[0];
      if(!f)return;
      if(validFile(f)){updateFile(f);return;}
      try{const list=new DataTransfer();list.items.add(f);file.files=list.files;updateFile(f);}
      catch{note("Your browser cannot attach this dropped file. Tap Browse instead.",true);}
    });
  }
  async function post(url,data,isFile){
    const r=await fetch(url,{method:"POST",credentials:"same-origin",
      headers:isFile?{"x-anevum-package":"v003"}:{"x-anevum-package":"v003","content-type":"application/json"},
      body:isFile?data:JSON.stringify(data||{})});
    let body={};try{body=await r.json()}catch{}
    if(!r.ok)throw Error(body.error||"The request failed ("+r.status+"). Your public release has not changed.");
    return body;
  }
  if(form)form.addEventListener("submit",async e=>{
    e.preventDefault();
    const b=q("upload-button"),f=file?.files?.[0],error=validFile(f);
    if(error){note(error,true);if(file)file.focus();return;}
    if(coverError){note(coverError,true);cover?.focus();return;}
    if(!form.reportValidity())return;
    b.disabled=true;
    note("Uploading and validating your files. Keep this page open until the private build is ready.");
    try{
      const result=await post("/api/v1/packages/upload",new FormData(form),true);
      note("Private build prepared. Opening your real playtest.");
      location.assign("/play/v3/"+encodeURIComponent(result.id)+"?preview=1");
    }catch(err){note(err.message||"Upload failed. Retry without leaving the page.",true);b.disabled=false;}
  });
  function modalAction(btn){
    const d=q("review-dialog"),kind=btn.dataset.packageAction;
    if(!d||!d.showModal)return false;
    d.dataset.project=btn.dataset.project;
    d.dataset.action=kind;
    q("review-title").textContent=kind==="publish"?"Approve this build?":"Request changes";
    q("review-copy").textContent=kind==="publish"
      ?"Approve only after reviewing the actual playable build and its safety, rights and device compatibility. Publication makes it accessible to everyone."
      :"Explain what the creator should fix. The current approved release, if any, will remain playable.";
    q("decision-reason-wrap").hidden=kind!=="reject";
    q("decision-reason").required=kind==="reject";
    q("decision-reason").value="";
    q("decision-confirm").checked=false;
    q("review-accept").textContent=kind==="publish"?"Approve and publish":"Send changes request";
    q("review-accept").classList.toggle("danger",kind==="reject");
    q("decision-confirm-label").textContent=kind==="publish"
      ?"I reviewed this actual build and I am independently authorized to approve it."
      :"I reviewed this build and explained a specific actionable change.";
    q("review-error").textContent="";
    d.showModal();
    return true;
  }
  const modal=q("review-dialog"),modalForm=q("review-form");
  if(modalForm)modalForm.addEventListener("submit",async e=>{
    e.preventDefault();
    const id=modal.dataset.project,action=modal.dataset.action,reason=q("decision-reason").value.trim();
    if(!q("decision-confirm").checked){q("review-error").textContent="Confirm the review before continuing.";return;}
    if(action==="reject"&&(reason.length<10||reason.length>1000)){q("review-error").textContent="Give the creator a reason of 10–1000 characters.";return;}
    const accept=q("review-accept");accept.disabled=true;
    q("review-error").textContent="Recording your review…";
    try{await post("/api/v1/packages/projects/"+id+"/review",{action,reason},false);location.reload();}
    catch(err){q("review-error").textContent=err.message;accept.disabled=false;}
  });
  document.addEventListener("click",async e=>{
    const close=e.target.closest("[data-review-close]");
    if(close){modal?.close();return;}
    const btn=e.target.closest("[data-package-action]");
    if(!btn)return;
    const id=btn.dataset.project,action=btn.dataset.packageAction;
    if(!id)return;
    if(action==="publish"||action==="reject"){modalAction(btn);return;}
    if(action==="fullscreen"){
      const v=q("game-viewport");if(!v)return;
      if(document.fullscreenElement){await document.exitFullscreen().catch(()=>{});return;}
      try{if(v.requestFullscreen){await v.requestFullscreen();return;}}catch{}
      v.classList.add("immersive");document.body.classList.add("player-immersive");
      try{history.pushState({anevumImmersive:true},"","#play");}catch{}
      q("exit-immersive")?.focus();
      return;
    }
    if(action==="exit-immersive"){
      const v=q("game-viewport");
      if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});
      v?.classList.remove("immersive");document.body.classList.remove("player-immersive");
      return;
    }
    if(action==="restart"){
      const frame=q("game-frame");
      if(frame){frame.src=frame.getAttribute("src");note("Restarting the experience.");}
      return;
    }
    if(action==="share"){
      const url=new URL(location.href);
      url.searchParams.delete("preview");url.hash="";
      if(location.search.includes("preview=1")){note("Private previews cannot be shared. Submit your build for review first.",true);return;}
      try{if(navigator.share)await navigator.share({title:document.title,url:url.href});
      else if(navigator.clipboard){await navigator.clipboard.writeText(url.href);note("Public project link copied.");}
      else note("Copy the page address to share this released project.");}
      catch(err){if(err.name!=="AbortError")note("Sharing was unavailable. Copy the page address instead.",true);}
      return;
    }
    if(action==="submit"&&!confirm("Submit this exact private build for independent review?"))return;
    if(action==="delete"&&!confirm("Permanently remove this unpublished project and its uploaded files?"))return;
    btn.disabled=true;note(action==="submit"?"Submitting for review…":"Removing private project…");
    try{await post("/api/v1/packages/projects/"+id+"/"+action,{action},false);location.reload();}
    catch(err){note(err.message,true);btn.disabled=false;}
  });
  function leaveImmersive(){
    const v=q("game-viewport");
    if(!v?.classList.contains("immersive"))return;
    v.classList.remove("immersive");document.body.classList.remove("player-immersive");
  }
  addEventListener("popstate",leaveImmersive);
  addEventListener("keydown",e=>{if(e.key==="Escape")leaveImmersive();});
  document.addEventListener("fullscreenchange",()=>{
    if(!document.fullscreenElement)document.body.classList.remove("player-immersive");
  });
})();

`;

export const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function hero(kicker,title,description,meta="ZIP / HTML",compact=false){
  return '<section class="av-scene-lead'+(compact?' av-scene-compact':'')+'" aria-label="'+esc(kicker)+'">'+
    '<div class="av-hero-copy"><div class="ey av-ey-line">'+esc(kicker)+'</div>'+
    '<h1>'+title+'</h1><p class="lead">'+description+'</p>'+
    '<div class="av-meta-strand"><span>'+esc(meta)+'</span><span>PRIVATE PREVIEW</span><span>REVIEWED RELEASES</span></div></div>'+
    ORBITAL_ART+'</section>';
}

const state = value => ({
  published:"Published",pending_review:"In review",ready:"Ready for review",rejected:"Changes requested",
  draft:"Draft",suspended:"Unavailable",deleted:"Deleted"
})[value] || "Draft";
const action=(p,verb,label,extra="")=>'<button type="button" class="'+(verb==="delete"||verb==="reject"?"danger":"quiet")+'" data-package-action="'+verb+'" data-project="'+esc(p.id)+'" '+extra+'>'+esc(label)+'</button>';
const projectURL=id=>"/play/v3/"+encodeURIComponent(id);
const limited=value=>(String(value??"").length>190?String(value).slice(0,190)+"…":String(value??""));
const displayDate=seconds=>{
  const value=Number(seconds);
  return Number.isFinite(value)&&value>0?new Date(value*1000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";
};
export function layout(title,body,runner=""){
  const runnerFrame=runner?"frame-src "+runner+"; ":"frame-src 'none'; ";
  const uploadActive=title==="Upload a creation"?' aria-current="page"':"";
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
    '<meta name="theme-color" content="#071020"><title>'+esc(title)+' · ANEVUM</title><style>'+CSS+V005_CSS+'</style></head><body>'+
    '<header><div class="top"><a class="brand" href="/"><span class="brand-mark">'+CREST+'</span><span class="brand-words"><strong>ANEVUM</strong><small>CONTINUANCE INSTITUTE</small></span></a>'+
    '<nav aria-label="Primary"><a href="/discover">Discover</a><a href="/upload/v3"'+uploadActive+' aria-label="Upload a creation">Upload</a><a href="/member">My Space</a><a href="/help/packages">Guide</a></nav>'+
    '<span class="header-readout" aria-hidden="true"><i></i> CREATOR / UPLINK</span></div></header>'+
    '<main id="main-content">'+body+'</main><footer class="foot">ANEVUM / Creator uplink · <a href="/help/packages">Upload guide</a> · Every playable release requires independent review.</footer>'+
    '<script>'+SCRIPT+'</script></body></html>';
  return new Response(html,{headers:{"content-type":"text/html; charset=utf-8",
    "cache-control":"private, no-store","x-content-type-options":"nosniff",
    "referrer-policy":"no-referrer","x-robots-tag":"noindex",
    "content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data: blob:; "+runnerFrame+" connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'"}});
}
export function card(p,owner=false,reviewer=false){
  const hasDraft=!!p.draft_release_id;
  const draftState=hasDraft?p.draft_status:p.status;
  const isUpdate=!!p.live_release_id;
  const preview=(owner||reviewer)&&hasDraft?projectURL(p.id)+"?preview=1":projectURL(p.id);
  const version=p.release_version?"Build "+esc(p.release_version):"New project";
  const date=displayDate(p.updated_at);
  let controls="";
  if(reviewer){
    controls='<a class="button primary" href="'+preview+'">Open private review</a>';
  }else if(owner){
    if(hasDraft&&(draftState==="ready"||draftState==="pending_review")){
      controls='<a class="button" href="'+preview+'">Preview build</a>'+
        (draftState==="ready"?action(p,"submit","Submit for review"):"");
      if(isUpdate)controls+='<a class="button quiet" href="'+projectURL(p.id)+'">Live version</a>';
    }else if(!hasDraft){
      controls+=(p.status==="published"?'<a class="button" href="'+projectURL(p.id)+'">Play live release</a>':"")+
        '<a class="button quiet" href="/upload/v3?update='+esc(p.id)+'">'+(p.status==="published"?"Upload an update":"Revise project")+'</a>';
    }
  }else controls='<a class="button primary" href="'+projectURL(p.id)+'">Open project</a>';
  const image=p.cover_release_id
    ?'<img class="av-project-cover" src="/api/v1/packages/covers/'+esc(p.cover_release_id)+'" loading="lazy" decoding="async" alt="Cover artwork for '+esc(p.title)+'">'
    :"";
  return '<article class="project" aria-label="'+esc(p.title)+'">'+
    '<div class="av-project-plate'+(image?' av-has-cover':'')+'" aria-label="'+(image?'Creator-supplied approved or private project cover':'ANEVUM record; no creator cover uploaded')+'">'+
    '<span class="av-project-plate-label">'+(owner?'YOUR PROJECT':reviewer?'AWAITING REVIEW':'PLAYABLE RELEASE')+'</span>'+
    SIGIL+image+'<span class="av-project-index">ANEVUM / '+esc(p.category||"PROJECT").toUpperCase()+'</span></div>'+
    '<span class="chip '+esc(draftState)+'">'+esc(state(draftState))+' / '+esc(p.category||"project")+'</span>'+
    '<h3>'+esc(p.title)+'</h3><p>'+esc(limited(p.summary))+'</p>'+
    '<div class="meta">'+version+(date?" · Updated "+date:"")+'</div>'+
    (p.review_reason?'<p class="status bad">Reviewer note: '+esc(p.review_reason)+'</p>':"")+
    '<div class="actions">'+controls+'</div></article>';
}
export function uploadScreen(projects,loggedIn,pilot,updateId){
  const selected=projects.find(p=>p.id===updateId)||null;
  const initialTitle=selected?esc(selected.title):"";
  const initialSummary=selected?esc(selected.summary):"";
  const category=selected?.category||"game";
  const update=!!selected;
  const intro=hero('CONTINUANCE / CREATOR UPLINK',
    'Upload a <em>creation.</em>',
    'You built it. Now give it a place in the Continuance. Upload your finished browser game or app, playtest privately, then submit it for an independent release review.',
    'ZIP / HTML · BROWSER BUILDS');
  const format='<div class="subheading">Accepted browser builds</div><div class="format-options">'+
    '<div class="format-option"><strong>ZIP · Complete project</strong><span>HTML, CSS, JavaScript, images and audio. The ZIP must contain index.html at its root.</span></div>'+
    '<div class="format-option"><strong>HTML · Single file</strong><span>One self-contained .html experience with no external dependencies.</span></div></div>';
  const stepper='<div class="stepper" aria-label="Release workflow">'+
    '<span class="active">01 Upload build</span><span>02 Private playtest</span><span>03 Staff review</span></div>';
  const form= !loggedIn
    ?'<div class="notice"><strong>Sign in to upload.</strong><p>Use your existing ANEVUM account. Projects stay private until approved.</p><div class="actions"><a class="button primary" href="/join">Sign in</a></div></div>'
    :!pilot
      ?'<div class="notice"><strong>Uploading is currently restricted to pilot creators.</strong><p>You can explore published projects while the independent player and security review are completed. No additional account is needed.</p><div class="actions"><a class="button" href="/discover">Discover</a></div></div>'
      :'<form id="publish-form" enctype="multipart/form-data"><input type="hidden" name="project_id" id="existing-project" value="'+esc(updateId)+'">'+
        '<div class="av-block-hd"><div class="ey" id="project-version">'+(update?"RELEASE REVISION":"NEW TRANSMISSION")+'</div>'+
        '<span class="av-section-no" aria-hidden="true">01</span></div>'+
        '<h2>'+(update?"Transmit a new version":"Package your creation")+'</h2>'+
        '<p class="small">'+(update?"Your current approved version stays live until the replacement passes review.":"Nothing goes public when you upload. You can test the exact build first.")+'</p>'+
        stepper+
        '<label class="drop" id="drop" for="bundle" aria-invalid="false">'+
        '<span class="symbol" aria-hidden="true">↑</span><strong id="file-label">Choose a ZIP or HTML file</strong>'+
        '<span>Tap to browse, or drag a file here</span>'+
        '<span>ZIP up to 20 MiB · HTML up to 5 MiB</span>'+
        '<input id="bundle" name="file" type="file" accept=".zip,.html,application/zip,text/html" required></label>'+
        '<div class="file-check"><span aria-hidden="true">●</span> Validates files and prepares an isolated private playtest.</div>'+
        format+
        '<div class="av-cover-field"><label for="cover">Cover artwork <span class="av-field-optional">/ OPTIONAL</span></label>'+
        '<div class="av-cover-select"><div class="av-cover-preview" id="cover-preview-wrap">'+SIGIL+
        '<img id="cover-preview" alt="Preview of your selected project artwork" hidden></div>'+
        '<div class="av-cover-copy"><strong>Give your creation a face.</strong>'+
        '<p>Use your own cover image, game screenshot or approved artwork. It stays private until the release is approved.</p>'+
        '<input type="file" class="av-cover-input" id="cover" name="cover" accept=".png,image/png" aria-describedby="cover-hint">'+
        '<p class="av-cover-hint" id="cover-hint" role="status">PNG only · Up to 3 MiB · Minimum 640 × 360 px · Recommended 1600 × 900 px.</p>'+
        '</div></div></div>'+
        '<div class="form-grid">'+
        '<div class="full"><label for="title">Project title</label><input class="field" id="title" name="title" type="text" minlength="3" maxlength="100" autocomplete="off" value="'+initialTitle+'" placeholder="e.g. Signal Drift" required></div>'+
        '<div class="full"><label for="category">Type</label><select class="field" id="category" name="category">'+
        ['game','app','simulation','story'].map(x=>'<option value="'+x+'"'+(category===x?" selected":"")+'>'+({game:"Game",app:"Application",simulation:"Interactive simulation",story:"Interactive story"}[x])+'</option>').join("")+'</select></div>'+
        '<div class="full"><label for="summary">What does someone do in it?</label>'+
        '<textarea class="field" id="summary" name="summary" minlength="10" maxlength="500" placeholder="Describe what people can play, explore or use." required>'+initialSummary+'</textarea></div></div>'+
        '<label class="review-confirm" for="rights-ack"><input id="rights-ack" type="checkbox" name="rights_ack" value="yes" required><span>I confirm that I own this project or have permission to publish its code, artwork, audio and other included files.</span></label>'+
        '<p class="file-form-note">A creator rights declaration is required for every version. This does not replace independent moderation or security review.</p>'+
        '<div class="actions"><button type="submit" class="primary" id="upload-button">Prepare private playtest →</button></div>'+
        '<p class="status" id="activity" role="status" aria-live="polite" aria-atomic="true"></p></form>';
  const guide='<div class="ey">THE CREATOR PROTOCOL</div><h2>Build elsewhere.<br>Belong here.</h2>'+
    '<div class="av-guide-art">'+SIGIL+'<div class="ey">CONTINUANCE / FORMAT CONTRACT</div>'+
    '<strong>One build.<br>One playable experience.</strong>'+
    '<p>ANEVUM hosts your approved browser build and gives it a place to be played. You keep your source and creative tools.</p></div>'+
    '<div class="help-quick">'+
    '<article><strong>1 / Export</strong><p>Use your AI coding tool or game engine to produce a static browser build. React/Vite users: build with relative asset paths.</p></article>'+
    '<article><strong>2 / Package</strong><p>ZIP the <em>contents</em> of your build directory, not its enclosing folder. index.html must be at the ZIP root.</p></article>'+
    '<article><strong>3 / Preview</strong><p>Run the uploaded experience on a phone and desktop before submitting it to staff for approval.</p></article>'+
    '</div><div class="tip"><strong>Does it need a server, login or private AI API key?</strong> That cannot run in this isolated ZIP player. Keep it hosted separately and use the existing <a href="/studio">Studio project-link workflow</a>; that is not an ANEVUM-hosted app.</div>'+
    '<a class="bordered-link" href="/help/packages">See supported files and limits →</a>';
  const shelf=loggedIn?'<div class="titlebar"><div><div class="ey">YOUR LIBRARY</div><h2>Uploaded builds</h2></div><p>Private drafts, reviews and released versions</p></div>'+
    (projects.length?'<div class="project-grid">'+projects.map(p=>card(p,true)).join("")+'</div>':
    '<div class="empty-state">'+SIGIL+'<div><strong>Your first transmission starts here.</strong><span>Your uploaded browser builds, real review statuses and releases will appear in this space. Existing HTML alpha projects remain intact during integration.</span></div></div>'):"";
  return layout("Upload a creation",intro+'<div class="grid"><section class="panel">'+form+'</section><aside class="panel soft upload-guide">'+guide+'</aside></div>'+shelf);
}
export function catalogScreen(projects){
  return layout("Playable browser releases",hero('ANEVUM / RELEASE ARCHIVE',
    'Made to be <em>played.</em>',
    'Real browser games and applications, shared by creators and independently reviewed before release.',
    'VERIFIED / PUBLISHED')+
    '<div class="actions"><a href="/upload/v3" class="button primary">Upload a creation →</a><a class="button quiet" href="/discover">All discoveries</a></div>'+
    '<div class="titlebar"><h2>Published builds</h2></div>'+
    (projects.length?'<div class="project-grid">'+projects.map(p=>card(p)).join("")+'</div>':
    '<div class="empty-state">'+SIGIL+'<div><strong>The release archive is awaiting its first entry.</strong><span>Approved ZIP and HTML creations appear here when they exist. No fabricated games or activity.</span></div></div>'));
}
function reviewDialog(){
  return '<dialog id="review-dialog" aria-labelledby="review-title" aria-describedby="review-copy">'+
  '<form id="review-form"><div class="ey">INDEPENDENT REVIEW</div><h2 id="review-title">Review build</h2><p id="review-copy"></p>'+
  '<div id="decision-reason-wrap" hidden><label for="decision-reason">What needs to change?</label>'+
  '<textarea class="field" id="decision-reason" maxlength="1000" minlength="10" rows="4" placeholder="Give the creator a specific reason."></textarea></div>'+
  '<label class="review-confirm" for="decision-confirm"><input id="decision-confirm" type="checkbox" required><span id="decision-confirm-label">I reviewed this build independently.</span></label>'+
  '<p class="status bad" id="review-error" role="alert"></p><div class="dialog-actions">'+
  '<button type="button" class="quiet" data-review-close>Cancel</button><button type="submit" class="primary" id="review-accept">Confirm review</button>'+
  '</div></form></dialog>';
}
export function playerScreen(p,release,runnerURL,isPreview,canEdit,isStaff){
  const label=isPreview?release.proposed_title||p.title:p.title;
  const synopsis=isPreview?release.proposed_summary||p.summary:p.summary;
  const kind=isPreview?release.proposed_category||p.category:p.category;
  const ready=Boolean(runnerURL)&&isPreview&&release.status==="ready";
  const review=Boolean(runnerURL)&&isStaff&&isPreview&&release.status==="pending_review";
  const controls='<div class="player-controls">'+
    (runnerURL?action(p,"restart","Restart")+action(p,"fullscreen","Expand"): "")+
    (!isPreview?action(p,"share","Share"): "")+
    (ready&&canEdit?action(p,"submit","Submit for review"): "")+
    (review?action(p,"publish","Approve and publish")+action(p,"reject","Request changes"):"")+
    '</div><p id="activity" class="status" role="status" aria-live="polite"></p>';
  const lead='<div class="ey">ANEVUM / '+esc(kind||"CREATION").toUpperCase()+' / BUILD '+esc(release.version)+'</div>'+
    '<div class="player-head"><div><h1>'+esc(label)+'</h1><span class="chip '+esc(release.status)+'">'+esc(state(release.status))+
    (isPreview?" · Private preview":"")+'</span></div></div>'+
    '<div class="av-stage-toolbar"><span>CONTINUANCE / PLAYER</span><span>'+(isPreview?'ISOLATED PRIVATE PLAYTEST':'PUBLIC EXPERIENCE')+'</span></div>';
  const stage=runnerURL?'<section class="viewport" id="game-viewport" aria-label="Playable project">'+
    '<iframe id="game-frame" title="'+esc(label)+'" src="'+esc(runnerURL)+'" sandbox="allow-scripts allow-pointer-lock" allow="fullscreen; gamepad" referrerpolicy="no-referrer" loading="eager"></iframe>'+
    '<button type="button" class="exit-immersive" id="exit-immersive" data-package-action="exit-immersive" data-project="'+esc(p.id)+'">Exit player</button></section>':
    '<div class="notice"><strong>Private playback is not configured.</strong><p>This build cannot be tested or approved until the isolated runtime is available.</p></div>';
  const artwork=release.cover_release_id
    ?'<div class="av-release-art"><img src="/api/v1/packages/covers/'+esc(release.cover_release_id)+'" loading="lazy" decoding="async" alt="Creator-supplied release artwork for '+esc(label)+'"><div><span class="ey">PROJECT ARTWORK</span><p>Artwork belongs to this specific '+(isPreview?'private':'approved')+' build. It does not replace the playable experience.</p></div></div>'
    :"";
  const notes='<div class="details"><div class="ey">ABOUT THIS RELEASE</div><p>'+esc(synopsis||"")+'</p>'+artwork+
    '<div class="detail-row"><span>Version '+esc(release.version)+'</span><span>'+esc(release.file_count)+' browser files</span><span>'+((Number(release.expanded_bytes)||0)/1048576).toFixed(1)+' MiB</span></div>'+
    (isPreview?'<p class="inline-note"><strong>Private playtest:</strong> Only the creator and authorized reviewers can open this build. Review and publication are separate steps.</p>':"")+
    '<p class="inline-note">If this build fails, check that its index.html and all local resources use relative URLs. External APIs and private service credentials are not supported.</p></div>';
  return layout(label,lead+stage+controls+notes+(review?reviewDialog():""),runnerURL?new URL(runnerURL).origin:"");
}
export function queueScreen(items){
  return layout("Package review",hero('CONTINUANCE / REVIEW DIVISION',
    'Review the <em>experience.</em>',
    'Inspect the isolated playable build, confirm independent review and record a clear release decision. Structural ZIP checks alone do not prove safety or content rights.',
    'RESTRICTED / STAFF')+
    '<div class="titlebar"><h2>Pending packages</h2></div>'+
    (items.length?'<div class="queue">'+items.map(p=>card(p,false,true)).join("")+'</div>':
    '<div class="empty-state">'+SIGIL+'<div><strong>The review queue is clear.</strong><span>New submissions will appear here after the creator completes a private playtest.</span></div></div>'));
}
export function helpScreen(){
  const copy='Build the project as a static browser app. Export the finished web build with an index.html entry point and relative CSS/JS/assets. ZIP the contents of the build folder, not the enclosing folder. Do not include node_modules, secrets, external CDNs or server code.';
  return layout("Upload format guide",hero('CONTINUANCE / FILE PROTOCOL',
    'Build it there. <em>Play it here.</em>',
    'Export a finished browser game or application from the creative tool you already use. ANEVUM accepts a ZIP package or a standalone HTML file.',
    'COMPATIBILITY / WEB BUILDS')+
    '<div class="grid"><section class="panel"><h2>Option A / Complete ZIP</h2><p>Best for games and apps that use multiple HTML, CSS, JavaScript, image, audio, font or supported WebAssembly files.</p>'+
    '<pre aria-label="Example project layout">my-project.zip\n  index.html\n  game.js\n  style.css\n  assets/\n    background.webp\n    music.ogg</pre>'+
    '<p class="tip">Put index.html at the root of the ZIP. For Vite-based apps, build with relative asset URLs (for example, Vite base ./), then ZIP the <strong>contents</strong> of dist.</p>'+
    '<h2>Option B / Standalone HTML</h2><p>A single .html file containing the entire creation. Its assets must be embedded, not loaded from external hosts.</p>'+
    '<div class="detail-row"><span>ZIP ≤ 20 MiB</span><span>Expanded ≤ 48 MiB</span><span>Single asset ≤ 12 MiB</span><span>≤ 180 files</span><span>Standalone HTML ≤ 5 MiB</span></div>'+
    '<h2 style="margin-top:22px">Prompt for your coding tool</h2><p class="tip">'+esc(copy)+'</p></section>'+
    '<aside class="panel soft"><div class="ey">BEFORE YOU UPLOAD</div><h2>Browser-only means browser-only.</h2>'+
    '<div class="help-quick"><article><strong>Works in the pilot</strong><p>Static HTML5 games, ordinary browser JavaScript, local assets and eligible client-side web apps.</p></article>'+
    '<article><strong>Not supported in the ZIP player</strong><p>Node/Python/PHP backends, databases, external logins, private API keys, remote scripts, camera or microphone, unrestricted network services, and native executables.</p></article>'+
    '<article><strong>Engine builds</strong><p>Some Godot/Unity WebGL builds need larger archives, extra asset extensions, streaming or threads. These are not automatically supported by this pilot.</p></article></div>'+
    '<p class="tip"><strong>Hosted AI app?</strong> If it requires a backend, continue hosting it on its current provider. Use the <a href="/studio">existing Studio link workflow</a> as a separately reviewed external project listing.</p>'+
    '<a class="button primary" href="/upload/v3">Upload a build →</a></aside></div>');
}
