/* ANEVUM Sites V005 Experience Lab — no third-party runtime dependencies. */
(() => {
"use strict";
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let stopHero=null,stopLab=null,stopGame=null;
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function resizeCanvas(canvas){const r=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.max(1,Math.floor(r.width*dpr)),h=Math.max(1,Math.floor(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}return{w,h,dpr};}
function makeWebGL(canvas){
 const gl=canvas.getContext("webgl",{alpha:true,antialias:true,depth:true,preserveDrawingBuffer:false,powerPreference:"low-power"});
 if(!gl)return null;
 const vertex="attribute vec3 p;attribute vec3 n;uniform mat4 proj;uniform mat4 rot;varying vec3 normal;varying vec3 pos;void main(){vec4 v=rot*vec4(p,1.0);pos=v.xyz;normal=normalize((rot*vec4(n,0.0)).xyz);gl_Position=proj*vec4(v.xyz+vec3(0.0,0.0,-4.6),1.0);}";
 const fragment="precision mediump float;varying vec3 normal;varying vec3 pos;uniform float t;uniform vec3 tint;void main(){vec3 N=normalize(normal);vec3 L=normalize(vec3(-0.45,0.85,1.1));float lam=max(dot(N,L),0.0);float rim=pow(1.0-max(dot(N,normalize(vec3(0.0,0.0,1.0))),0.0),2.5);float bands=0.5+0.5*sin(pos.y*5.5+pos.x*3.0+t*0.4);vec3 c=tint*(0.20+lam*0.95)+vec3(0.32,0.48,0.36)*rim+vec3(0.08,0.12,0.10)*bands;gl_FragColor=vec4(c,1.0);}";
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 let program;
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("Shader link failed");}catch(e){console.warn("WebGL fallback:",e);return null;}
 gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
 const posLoc=gl.getAttribLocation(program,"p"),normalLoc=gl.getAttribLocation(program,"n");
 const uProj=gl.getUniformLocation(program,"proj"),uRot=gl.getUniformLocation(program,"rot"),uTime=gl.getUniformLocation(program,"t"),uTint=gl.getUniformLocation(program,"tint");
 let geometry="orb",pointer=false,lastX=0,lastY=0,rotationX=-.24,rotationY=.35,zoom=1,frame=0,disposed=false,active=true;
 let vertexCount=0,buffer=null;
 function generate(shape){
  const N=48,M=48,positions=[],normals=[];
  function point(u,v){
   const a=u*Math.PI*2,b=v*Math.PI;
   let x,y,z;
   if(shape==="torus"){const R=1.04,r=.46,theta=u*2*Math.PI,phi=v*2*Math.PI;x=(R+r*Math.cos(phi))*Math.cos(theta);y=(R+r*Math.cos(phi))*Math.sin(theta);z=r*Math.sin(phi);}
   else if(shape==="crystal"){const rad=(.78+.22*Math.cos(6*a))*(.85+.12*Math.cos(8*b));x=rad*Math.sin(b)*Math.cos(a);y=rad*Math.cos(b);z=rad*Math.sin(b)*Math.sin(a);}
   else {const r=1.05+.16*Math.sin(5*a+2*b)*Math.sin(4*b)+.08*Math.cos(9*a-3*b);x=r*Math.sin(b)*Math.cos(a);y=r*Math.cos(b);z=r*Math.sin(b)*Math.sin(a);}
   return[x,y,z];
  }
  function triangle(a,b,c){const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];let n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];let d=Math.hypot(...n)||1;n=n.map(x=>x/d);for(const p of[a,b,c]){positions.push(...p);normals.push(...n);}}
  for(let j=0;j<M;j++)for(let i=0;i<N;i++){const u=i/N,u2=(i+1)/N,v=j/M,v2=(j+1)/M;const a=point(u,v),b=point(u2,v),c=point(u2,v2),d=point(u,v2);triangle(a,b,c);triangle(a,c,d);}
  const data=new Float32Array(positions.length*2);for(let i=0;i<positions.length/3;i++){data.set(positions.slice(i*3,i*3+3),i*6);data.set(normals.slice(i*3,i*3+3),i*6+3);}
  if(buffer)gl.deleteBuffer(buffer);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(normalLoc);gl.vertexAttribPointer(normalLoc,3,gl.FLOAT,false,24,12);vertexCount=positions.length/3;geometry=shape;
 }
 function matrix(ax,ay){const cx=Math.cos(ax),sx=Math.sin(ax),cy=Math.cos(ay),sy=Math.sin(ay);return new Float32Array([cy,sx*sy,-cx*sy,0,0,cx,sx,0,sy,-sx*cy,cx*cy,0,0,0,0,1]);}
 function projection(w,h){const aspect=w/h,f=1/Math.tan(Math.PI/6),near=.1,far=100;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,(2*far*near)/(near-far),0]);}
 function draw(now){if(disposed)return;frame=requestAnimationFrame(draw);if(!active)return;const{w,h}=resizeCanvas(canvas);gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!prefersReduced&&!pointer)rotationY+=.003;gl.useProgram(program);gl.uniformMatrix4fv(uProj,false,projection(w,h));const mat=matrix(rotationX,rotationY);for(const i of[0,1,2,4,5,6,8,9,10])mat[i]*=zoom;gl.uniformMatrix4fv(uRot,false,mat);gl.uniform1f(uTime,now*.001);gl.uniform3f(uTint,...(geometry==="torus"?[.62,.77,.99]:geometry==="crystal"?[.95,.71,.82]:[.70,.96,.76]));gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.vertexAttribPointer(posLoc,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(normalLoc,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,vertexCount);}
 function down(e){pointer=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);}
 function move(e){if(!pointer)return;rotationY+=(e.clientX-lastX)*.008;rotationX=clamp(rotationX+(e.clientY-lastY)*.008,-1.6,1.6);lastX=e.clientX;lastY=e.clientY;}
 function up(){pointer=false;}
 function wheel(e){if(e.cancelable)e.preventDefault();zoom=clamp(zoom-e.deltaY*.0006,.55,1.4);}
 canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);canvas.addEventListener("wheel",wheel,{passive:false});
 generate("orb");frame=requestAnimationFrame(draw);
 return{setShape:generate,setActive(v){active=v;},reset(){rotationX=-.24;rotationY=.35;zoom=1;},dispose(){disposed=true;cancelAnimationFrame(frame);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);canvas.removeEventListener("wheel",wheel);if(buffer)gl.deleteBuffer(buffer);gl.deleteProgram(program);}};
}
function mount3D(container,hero=false){
 const canvas=document.createElement("canvas");canvas.setAttribute("aria-label","Drag to rotate the interactive WebGL sculpture");canvas.style.width="100%";canvas.style.height="100%";canvas.style.display="block";container.append(canvas);
 const webgl=makeWebGL(canvas);
 if(!webgl){canvas.remove();container.innerHTML='<div class="art-fallback"><span class="fallback-core"></span><span class="fallback-ring"></span><span class="fallback-ring alt"></span></div>';return null;}
 if(!hero){const controls=document.createElement("div");controls.className="lab-controls";for(const shape of["orb","torus","crystal"]){const button=document.createElement("button");button.type="button";button.textContent=shape.toUpperCase();button.className=shape==="orb"?"active":"";button.addEventListener("click",()=>{webgl.setShape(shape);$$("button",controls).forEach(b=>b.classList.toggle("active",b===button));});controls.append(button);}const reset=document.createElement("button");reset.type="button";reset.textContent="RESET ↺";reset.addEventListener("click",()=>webgl.reset());controls.append(reset);container.append(controls);}
 const observer=new IntersectionObserver(entries=>webgl.setActive(entries[0]?.isIntersecting??false),{threshold:.01});observer.observe(container);return()=>{observer.disconnect();webgl.dispose();};
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
 const entries=[{id:"3d",number:"01",label:"3D OBJECT",icon:"◈",title:"A world you can touch.",description:"A real-time WebGL artifact built from generated geometry and shaded on your device. Rotate it, swap its form, and inspect the light. No prerecorded video.",tags:["WEBGL","GPU SHADERS","POINTER INPUT"],footer:"LIVE 3D / PROCEDURAL"},{id:"game",number:"02",label:"PLAYABLE",icon:"⌁",title:"A game, not a GIF.",description:"Signal Run is a miniature playable arcade prototype. Dodge debris with touch or keyboard. Score and shields update as you play. The logic runs locally.",tags:["CANVAS 2D","GAME LOOP","TOUCH CONTROLS"],footer:"PLAYABLE / LOCAL"},{id:"app",number:"03",label:"APP SYSTEM",icon:"▤",title:"Interfaces that respond.",description:"Switch between creator, commerce, and research views. Watch the dashboard state and illustrative data change. A functional interaction sketch—not a connected client backend.",tags:["STATEFUL UI","DASHBOARD","APPLICATION DESIGN"],footer:"INTERACTIVE / SAMPLE DATA"},{id:"pwa",number:"04",label:"INSTALLABLE",icon:"⬡",title:"Software beyond a tab.",description:"Install this studio to your Home Screen where your browser supports it. The service worker caches a safe offline shell so the core experience can reopen without a connection.",tags:["WEB MANIFEST","SERVICE WORKER","OFFLINE CACHE"],footer:"PWA / DEVICE SUPPORT"}];
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