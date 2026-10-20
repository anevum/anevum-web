/* ANEVUM Sites V005 Experience Lab — no third-party runtime dependencies. */
(() => {
"use strict";
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let stopHero=null,stopLab=null,stopGame=null;
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function resizeCanvas(canvas){const r=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.max(1,Math.floor(r.width*dpr)),h=Math.max(1,Math.floor(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}return{w,h,dpr};}
function mount3D(container,hero=false){
  const canvas=document.createElement("canvas");
  canvas.setAttribute("aria-label","Cinematic 3D industrial Continuance artifact; drag to orbit the camera");
  canvas.setAttribute("role","img");
  canvas.className="cinematic-canvas";
  container.append(canvas);
  const engine=window.ANEVUMImmersive?.mount?.(canvas,{yaw:hero?.18:.30,pitch:hero?.13:.11});
  if(!engine){
    canvas.remove();
    const fallback=document.createElement("div");fallback.className="cinematic-fallback";
    fallback.setAttribute("role","img");
    fallback.setAttribute("aria-label","Illustrated Continuance chamber with suspended metal artifact and atmospheric industrial lighting");
    fallback.innerHTML='<span class="chamber-back"></span><span class="chamber-portal"></span><span class="chamber-halo"></span><span class="artifact-shell shell-one"></span><span class="artifact-shell shell-two"></span><span class="artifact-core"></span><span class="artifact-aperture"></span><span class="artifact-glow"></span><span class="chamber-dais"></span><span class="chamber-grain"></span>';
    container.append(fallback);
    if(!hero){const msg=document.createElement("p");msg.className="cinematic-unsupported";msg.textContent="WebGL2 is unavailable on this device. This is a static visual reference; try a supported browser for the interactive environment.";container.append(msg);}
    return()=>fallback.remove();
  }
  if(!hero){
    const controls=document.createElement("div");
    controls.className="lab-controls cinematic-controls";
    for(const [mode,label] of [["alloy","ALLOY / 01"],["obsidian","OBSIDIAN / 02"],["arctic","ARCTIC / 03"]]){
      const button=document.createElement("button");button.type="button";button.textContent=label;button.className=mode==="alloy"?"active":"";
      button.addEventListener("click",()=>{engine.setMode(mode);$$("button",controls).forEach(b=>b.classList.toggle("active",b===button));});
      controls.append(button);
    }
    const reset=document.createElement("button");reset.type="button";reset.textContent="RESET VIEW ↺";reset.addEventListener("click",()=>engine.reset());controls.append(reset);container.append(controls);
  }
  const observer=new IntersectionObserver(entries=>engine.setActive(!!entries[0]?.isIntersecting),{threshold:.01});
  observer.observe(container);
  return()=>{observer.disconnect();engine.dispose();};
}
function createGame(container){
 let canvas=document.createElement("canvas");canvas.width=600;canvas.height=375;canvas.setAttribute("aria-label","Signal Run: dodge incoming objects, move with arrow keys or on-screen controls");let ctx=canvas.getContext("2d");let state={running:false,over:false,score:0,lives:3,x:300,objects:[],last:0,spawn:0};let raf=0,keys={left:false,right:false},stopped=false;
 const hud=document.createElement("div");hud.className="game-hud";
 const controls=document.createElement("div");controls.className="game-control-row";
 const hint=document.createElement("div");hint.className="game-hint";hint.textContent="MOVE WITH ← / → OR TOUCH THE CONTROLS · AVOID THE DEBRIS";
 const overlay=document.createElement("div");overlay.className="game-overlay";
 function overlayScreen(title,subtitle,buttonText){overlay.innerHTML='<div class="game-overlay-inner"><h4></h4><p></p><button type="button"></button></div>';overlay.querySelector("h4").textContent=title;overlay.querySelector("p").textContent=subtitle;const b=overlay.querySelector("button");b.textContent=buttonText;b.addEventListener("click",start);overlay.style.display="flex";}
 function makeButton(label,dir){const b=document.createElement("button");b.type="button";b.className="game-control";b.textContent=label;b.setAttribute("aria-label",dir==="left"?"Move left":"Move right");b.addEventListener("pointerdown",e=>{e.preventDefault();keys[dir]=true;b.setPointerCapture?.(e.pointerId);});for(const ev of["pointerup","pointercancel","lostpointercapture","pointerleave"])b.addEventListener(ev,()=>{keys[dir]=false;});return b;}
 controls.append(makeButton("◀","left"),makeButton("▶","right"));container.append(hud,canvas,controls,hint,overlay);
 function keyboard(e){if(!state.running||document.activeElement?.matches("input,textarea,select"))return;if(e.key==="ArrowLeft"||e.key==="a"){keys.left=e.type==="keydown";e.preventDefault();}if(e.key==="ArrowRight"||e.key==="d"){keys.right=e.type==="keydown";e.preventDefault();}}
 window.addEventListener("keydown",keyboard);window.addEventListener("keyup",keyboard);
 function start(){state={running:true,over:false,score:0,lives:3,x:300,objects:[],last:0,spawn:0};overlay.style.display="none";}
 function render(time){if(stopped)return;raf=requestAnimationFrame(render);let dt=state.last?Math.min((time-state.last)/1000,.045):.016;state.last=time;ctx.clearRect(0,0,600,375);ctx.fillStyle="#091719";ctx.fillRect(0,0,600,375);ctx.strokeStyle="#27433c";ctx.lineWidth=1;for(let x=0;x<600;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,375);ctx.stroke();}for(let y=0;y<375;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(600,y);ctx.stroke();}
 if(state.running){if(keys.left)state.x-=270*dt;if(keys.right)state.x+=270*dt;state.x=clamp(state.x,25,575);state.spawn+=dt;if(state.spawn>Math.max(.28,.85-state.score*.006)){state.spawn=0;state.objects.push({x:20+Math.random()*560,y:-20,size:12+Math.random()*15,speed:135+Math.min(180,state.score*2)+Math.random()*50});}
 for(const obj of state.objects){obj.y+=obj.speed*dt;if(Math.abs(obj.x-state.x)<obj.size+14&&Math.abs(obj.y-325)<obj.size+12){obj.y=500;state.lives--;if(state.lives<=0){state.running=false;state.over=true;overlayScreen("SIGNAL LOST","Final score: "+state.score+" · Try again.","RESTART MISSION");}}else if(obj.y>385&&obj.y<450){obj.y=500;state.score++;}}
 state.objects=state.objects.filter(o=>o.y<450);}
 for(const o of state.objects){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(time*.0006);ctx.strokeStyle="#e3b7c8";ctx.fillStyle="#795469";ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;const r=o.size*(i%2?.72:1);if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 ctx.save();ctx.translate(state.x,325);ctx.shadowColor="#b4e5b1";ctx.shadowBlur=20;ctx.fillStyle="#c8e8b1";ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(18,17);ctx.lineTo(0,10);ctx.lineTo(-18,17);ctx.closePath();ctx.fill();ctx.restore();
 hud.innerHTML='<span>SCORE / '+String(state.score).padStart(3,"0")+'</span><span>SHIELDS / '+("◆ ".repeat(Math.max(0,state.lives)))+'</span>';}
 overlayScreen("SIGNAL RUN","A real Canvas game. Survive the incoming debris.","START MISSION");raf=requestAnimationFrame(render);
 return()=>{stopped=true;cancelAnimationFrame(raf);window.removeEventListener("keydown",keyboard);window.removeEventListener("keyup",keyboard);};
}
function createApp(container){
 let mode="studio";const modes={studio:{title:"CREATOR CONTROL",subtitle:"An interactive sample dashboard",stats:[["PROJECTS","12"],["BUILDS","48"],["UPTIME","99%"]],bars:[40,73,53,87,63,92,70]},commerce:{title:"SHOP COMMAND",subtitle:"Illustrative storefront operations",stats:[["ORDERS","28"],["CARTS","14"],["ITEMS","86"]],bars:[50,62,90,73,82,64,98]},research:{title:"DATA OBSERVATORY",subtitle:"Illustrative research workspace",stats:[["SETS","09"],["RUNS","42"],["SIGNALS","17"]],bars:[80,32,58,95,47,88,74]}};
 const card=document.createElement("div");card.className="app-preview";const options=document.createElement("div");options.className="app-options";const output=document.createElement("div");output.className="app-output";
 function render(){const d=modes[mode];card.innerHTML='<div class="app-windowbar"><i></i><i></i><i></i><span>ANEVUM / STATEFUL UI PROTOTYPE</span></div><div class="app-windowbody"><h4></h4><p></p><div class="app-stats"></div><div class="app-bars"></div></div>';card.querySelector("h4").textContent=d.title;card.querySelector("p").textContent=d.subtitle;card.querySelector(".app-stats").innerHTML=d.stats.map(s=>'<div class="app-stat"><span>'+s[0]+'</span><strong>'+s[1]+'</strong></div>').join("");card.querySelector(".app-bars").innerHTML=d.bars.map(n=>'<i style="height:'+n+'%"></i>').join("");$$("button",options).forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));output.textContent="LIVE CONFIG / "+mode.toUpperCase()+" · SAMPLE DATA · LOCAL STATE";}
 for(const [key,label] of[["studio","CREATOR"],["commerce","COMMERCE"],["research","RESEARCH"]]){const b=document.createElement("button");b.type="button";b.textContent=label;b.dataset.mode=key;b.addEventListener("click",()=>{mode=key;render();});options.append(b);}
 const wrapper=document.createElement("div");wrapper.style.width="100%";wrapper.style.maxWidth="540px";wrapper.append(card,options,output);container.append(wrapper);render();return()=>{};
}
function createPWA(container){
 const phone=document.createElement("div");phone.className="pwa-phone";phone.innerHTML='<span class="phone-time">09:41</span><h4>THE WORLD<br>IS YOURS.</h4><p>ANEVUM / POCKET LAB</p><div class="pwa-tile">A.</div><p>BUILT FOR THE HOME SCREEN</p>';
 const controls=document.createElement("div");controls.className="pwa-controls";const install=document.createElement("button");install.type="button";install.className="install-action";install.textContent="INSTALL EXPERIENCE ↗";const status=document.createElement("div");status.className="pwa-state";const instructions=document.createElement("div");instructions.className="pwa-instructions";instructions.textContent="iPhone: Share → Add to Home Screen. Android: browser menu → Install app. Browser support varies.";
 controls.append(install,status,instructions);container.append(phone,controls);
 let deferred=null;const before=e=>{e.preventDefault();deferred=e;status.textContent="INSTALL READY — TAP TO ADD TO YOUR DEVICE";};const installed=()=>{deferred=null;status.textContent="APP INSTALLED ON THIS DEVICE";};window.addEventListener("beforeinstallprompt",before);window.addEventListener("appinstalled",installed);
 install.addEventListener("click",async()=>{if(deferred){const p=deferred;deferred=null;await p.prompt();const choice=await p.userChoice;status.textContent=choice.outcome==="accepted"?"INSTALL ACCEPTED":"INSTALL DISMISSED";}else if(window.matchMedia("(display-mode: standalone)").matches||navigator.standalone){status.textContent="ALREADY RUNNING AS AN INSTALLED APP";}else{status.textContent="USE YOUR BROWSER'S INSTALL OR ADD TO HOME SCREEN MENU";}});
 if("serviceWorker"in navigator){navigator.serviceWorker.ready.then(()=>{status.textContent=status.textContent||"OFFLINE SHELL AVAILABLE AFTER FIRST LOAD";}).catch(()=>{});}
 return()=>{window.removeEventListener("beforeinstallprompt",before);window.removeEventListener("appinstalled",installed);};
}
function mountLab(){
 const root=$("#experience-react-root");if(!root)return;
 const entries=[{id:"3d",number:"01",label:"3D OBJECT",icon:"◈",title:"A world you can touch.",description:"A raymarched industrial environment with layered metal, ceramic, microtexture, cinematic area-light reflections, soft shadows and atmospheric depth. Drag to orbit; change the finish. GPU-rendered, not prerecorded.",tags:["WEBGL2","PBR / GGX","PROCEDURAL DETAIL","INTERACTIVE CAMERA"],footer:"LIVE 3D / MATERIAL STUDY"},{id:"game",number:"02",label:"PLAYABLE",icon:"⌁",title:"A game, not a GIF.",description:"Signal Run is a miniature playable arcade prototype. Dodge debris with touch or keyboard. Score and shields update as you play. The logic runs locally.",tags:["CANVAS 2D","GAME LOOP","TOUCH CONTROLS"],footer:"PLAYABLE / LOCAL"},{id:"app",number:"03",label:"APP SYSTEM",icon:"▤",title:"Interfaces that respond.",description:"Switch between creator, commerce, and research views. Watch the dashboard state and illustrative data change. A functional interaction sketch—not a connected client backend.",tags:["STATEFUL UI","DASHBOARD","APPLICATION DESIGN"],footer:"INTERACTIVE / SAMPLE DATA"},{id:"pwa",number:"04",label:"INSTALLABLE",icon:"⬡",title:"Software beyond a tab.",description:"Install this studio to your Home Screen where your browser supports it. The service worker caches a safe offline shell so the core experience can reopen without a connection.",tags:["WEB MANIFEST","SERVICE WORKER","OFFLINE CACHE"],footer:"PWA / DEVICE SUPPORT"}];
 root.innerHTML='<div class="lab-shell"><div class="lab-nav" role="tablist" aria-label="Interactive demonstrations"></div><div class="lab-body"><div class="lab-stage" role="tabpanel" id="lab-panel" aria-labelledby="lab-tab-3d"></div><div class="lab-side"><span class="micro">EXPERIMENT / <span id="lab-current">01</span> · RUNNING IN YOUR BROWSER</span><h3></h3><p class="lab-description"></p><div class="lab-tech"></div><div class="lab-side-footer"><span></span><a href="#contact">BUILD SOMETHING LIKE THIS ↗</a></div></div></div></div>';
 const nav=$(".lab-nav",root),stage=$(".lab-stage",root),side=$(".lab-side",root);let current=0,cleanup=()=>{};
 entries.forEach((item,i)=>{const button=document.createElement("button");button.type="button";button.className="lab-tab"+(i===0?" active":"");button.id="lab-tab-"+item.id;button.setAttribute("role","tab");button.setAttribute("aria-selected",i===0?"true":"false");button.setAttribute("aria-controls","lab-panel");button.innerHTML='<span class="tab-index">'+item.number+'</span><span class="tab-label">'+item.label+'</span><span class="tab-icon">'+item.icon+'</span>';button.addEventListener("click",()=>select(i));button.addEventListener("keydown",e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const next=(i+(e.key==="ArrowRight"?1:entries.length-1))%entries.length;nav.children[next].focus();select(next);}});nav.append(button);});
 function select(i){cleanup();current=i;const item=entries[i];$$(".lab-tab",nav).forEach((b,j)=>{b.classList.toggle("active",j===i);b.setAttribute("aria-selected",j===i?"true":"false");b.tabIndex=j===i?0:-1;});stage.innerHTML="";const holder=document.createElement("div");holder.className=i===0?"demo-3d-stage":i===1?"game-stage":i===2?"app-stage":"pwa-stage";stage.append(holder);const top=document.createElement("div");top.className="lab-stage-top";top.innerHTML='<span>ANV / EXPERIMENT '+item.number+'</span><span class="green">● LIVE</span>';holder.append(top);$("#lab-current",root).textContent=item.number;$("h3",side).textContent=item.title;$(".lab-description",side).textContent=item.description;$(".lab-tech",side).innerHTML=item.tags.map(t=>'<span>'+t+'</span>').join("");$(".lab-side-footer span",side).textContent=item.footer;cleanup=(i===0?mount3D(holder):i===1?createGame(holder):i===2?createApp(holder):createPWA(holder))||(()=>{});}
 select(0);return()=>cleanup();
}
function initInquiry(){
 const form=$("#site-inquiry");if(!form)return;
 const status=document.createElement("p");status.className="form-note";status.setAttribute("role","status");status.setAttribute("aria-live","polite");form.append(status);
 form.addEventListener("submit",async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const submit=$('button[type="submit"]',form);submit.disabled=true;status.textContent="Transmitting your inquiry...";
 const data=Object.fromEntries(new FormData(form).entries());
 // Preserve existing API contract. Server validates consent, honeypot, and fields.
 const payload=new URLSearchParams({name:data.name||"",business:data.business||"",email:data.email||"",phone:data.phone||"",website:data.website||"",package:data.package||"undecided",goal:data.goal||"",consent:data.consent||"",fax_number:data.fax_number||""});
 try{const response=await fetch("/api/inquiries",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","accept":"application/json"},body:payload.toString()});let result={};try{result=await response.json();}catch{}if(!response.ok||result.ok===false)throw Error(result.error||"Inquiry could not be submitted. Please email devon@anevum.com.");form.reset();status.textContent="Inquiry received. We will review your project and reply by email.";}
 catch(err){status.textContent=err.message||"Submission failed. Please email devon@anevum.com.";}
 finally{submit.disabled=false;}
 });
}
function initPWA(){if("serviceWorker"in navigator&&location.protocol==="https:"){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(err=>console.warn("Offline support unavailable:",err)));}}
function init(){const hero=$("#hero-react-root");if(hero){hero.innerHTML="";stopHero=mount3D(hero,true);}stopLab=mountLab();initInquiry();initPWA();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();