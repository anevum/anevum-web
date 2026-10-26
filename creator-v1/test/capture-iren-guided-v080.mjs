/**
 * ANEVUM IREN V080 browser acceptance.
 * Tests only a local loopback synthetic fixture, never production accounts.
 * The browser exercises the real compiled React bundle at 320/390/768/1440px.
 */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)throw Error("IREN_V080_LOCAL_CHROME_REQUIRED");
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=26000){
 const deadline=Date.now()+timeout,last=[];
 while(Date.now()<deadline){
  try{const result=await fn();if(result)return result;}catch(e){last.push(String(e))}
  await pause(130);
 }
 throw Error("IREN_V080_BROWSER_TIMEOUT: "+last.slice(-2).join(" / "));
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-iren-v080-"));
const browser=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*","--no-first-run",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let socket=null;
const evidence=[];
try{
 const port=await until(()=>{
  const file=join(profile,"DevToolsActivePort");
  return existsSync(file)?readFileSync(file,"utf8").split("\n")[0]:null;
 });
 const url=await until(async()=>{
  const response=await fetch("http://127.0.0.1:"+port+"/json/list");
  return response.ok?(await response.json()).find(page=>page.type==="page")?.webSocketDebuggerUrl:null;
 });
 socket=new WebSocket(url);
 const pending=new Map();let n=0;
 socket.addEventListener("message",({data})=>{
  const reply=JSON.parse(String(data));
  if(typeof reply.id!=="number")return;
  const task=pending.get(reply.id);
  if(!task)return;
  pending.delete(reply.id);
  reply.error?task.reject(Error(reply.error.message)):task.resolve(reply.result||{});
 });
 await new Promise((res,rej)=>{
  socket.addEventListener("open",res,{once:true});
  socket.addEventListener("error",rej,{once:true});
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++n;pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expr=>{
  const result=await send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result?.value;
 };
 const capture=async name=>{
  const data=(await send("Page.captureScreenshot",{format:"png",fromSurface:true})).data;
  if(!data||data.length<4000)throw Error("IREN_SCREENSHOT_MISSING_"+name);
  writeFileSync(join(output,name+".png"),Buffer.from(data,"base64"));
 };
 const check=async (label,expr)=>{
  const result=await evaluate(expr);
  if(!result){
   const geometry=label.includes("inside-")?await evaluate('(()=>{const e=document.querySelector(".ir80-help");if(!e)return "no-panel";const r=e.getBoundingClientRect(),p=e.parentElement?.getBoundingClientRect(),s=getComputedStyle(e);return JSON.stringify({viewport:[innerWidth,innerHeight],panel:[r.left,r.top,r.right,r.bottom,r.width,r.height],parent:p?[p.left,p.top,p.right,p.bottom,p.width,p.height]:null,computed:{width:s.width,maxHeight:s.maxHeight,right:s.right,bottom:s.bottom,boxSizing:s.boxSizing},className:e.className,outer:document.querySelector(".ir88-companion")?.className});})()'):"";
   throw Error("IREN_V080_FAILED_"+label+(geometry?" / "+geometry:""));
  }
 };
 await send("Page.enable");await send("Runtime.enable");
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 for(const [width,height] of [[320,720],[390,844],[768,1024],[1440,900]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
  // Each viewport exercises a genuinely fresh visitor. Prior viewport history
  // is removed before the next navigation, never while the first page is blank.
  if(width!==320)await evaluate('localStorage.removeItem("anevum.iren.first-contact.v092")');
  // A background tab must not prompt or consume first contact. Keep the
  // visibility probe even though the welcome is now explicitly user initiated.
  let visibilityProbeId=null;
  if(width===320){
    const probe=await send("Page.addScriptToEvaluateOnNewDocument",{
      source:'Object.defineProperty(document,"visibilityState",{configurable:true,get(){return window.__irenQAVisibility||"hidden"}});window.__irenQAVisibility="hidden";'
    });
    visibilityProbeId=probe.identifier;
    if(!visibilityProbeId)throw Error("IREN_VISIBILITY_PROBE_NOT_INSTALLED");
  }
  await send("Page.navigate",{url:base+"/creator/"});
  await until(()=>evaluate('!!document.querySelector(".ir80-dock")&&!!document.querySelector(".av79-home")'));
  if(width===320){
    await pause(1430);
    await check("hidden-tab-does-not-consume-greeting",'document.visibilityState==="hidden"&&!document.querySelector(".ir92-first-contact")&&localStorage.getItem("anevum.iren.first-contact.v092")!=="seen"');
    await check("visible-but-editing-stays-undisturbed",`(()=>{
      const input=document.createElement("input");
      input.id="qa-iren-editing-probe";
      input.setAttribute("aria-label","Temporary typing safety probe");
      document.body.appendChild(input);input.focus();
      window.__irenQAVisibility="visible";
      document.dispatchEvent(new Event("visibilitychange"));
      return document.visibilityState==="visible"&&document.activeElement===input;
    })()`);
    await pause(1450);
    await check("typing-does-not-consume-greeting",'!document.querySelector(".ir92-first-contact")&&localStorage.getItem("anevum.iren.first-contact.v092")!=="seen"');
    await evaluate('(()=>{const input=document.getElementById("qa-iren-editing-probe");input.blur();input.remove();return true})()');
    await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:visibilityProbeId});
  }
  // V115 first load deliberately has no unsolicited welcome popup. The
  // visitor chooses "Meet IREN" inside the arrival console. Keyboard focus
  // moves to the requested companion panel, never on page load.
  await pause(1400);
  await check("no-unsolicited-first-contact-"+width,'!document.querySelector(".ir92-first-contact")&&localStorage.getItem("anevum.iren.first-contact.v092")!=="seen"');
  await evaluate('document.querySelector(".av115-iren-console button").click()');
  await until(()=>evaluate('!!document.querySelector(".ir92-first-contact")'),10000);
  await until(()=>evaluate('document.activeElement?.getAttribute("aria-label")==="Close IREN"'));
  await check("explicit-arrival-focus-"+width,'document.activeElement?.getAttribute("aria-label")==="Close IREN"');
  await check("welcome-live-region-"+width,'document.querySelector(".ir92-voice")?.getAttribute("role")==="status"');
  await check("first-contact-four-choices-"+width,'document.querySelectorAll(".ir92-intent-grid > a,.ir92-intent-grid > button").length===4');
  await check("first-contact-real-destinations-"+width,'(()=>{const paths=[...document.querySelectorAll(".ir92-intent-grid a")].map(a=>new URL(a.href).pathname);return paths.some(p=>p.endsWith("/discover"))&&paths.some(p=>p.endsWith("/studio"))&&paths.some(p=>p.endsWith("/community"));})()');
  await check("first-contact-one-companion-"+width,'document.querySelectorAll(".ir87-scout").length===1');
  await check("first-contact-no-modal-"+width,'!document.querySelector(".ir80-guide-card")');
  await check("first-contact-inside-viewport-"+width,'(()=>{const r=document.querySelector(".ir80-help").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;})()');
  await capture("iren-first-contact-"+width);
  if(width===320){
    await evaluate('document.querySelector(".ir92-intent-grid button").click()');
    await until(()=>evaluate('!!document.querySelector(".ir80-guide-card")&&location.pathname.endsWith("/creator/")'));
    await check("first-contact-tour-opt-in",'document.querySelector("#ir80-guide-title")?.textContent.includes("ANEVUM")');
    await evaluate('document.querySelector(".ir80-skip").click()');
    await until(()=>evaluate('!document.querySelector(".ir80-guide-card")'));
    await send("Page.navigate",{url:base+"/creator/"});
    await until(()=>evaluate('!!document.querySelector(".ir80-dock")&&!!document.querySelector(".av79-home")'));
    await pause(1400);
    await check("first-contact-does-not-repeat",'!document.querySelector(".ir92-first-contact")');
  }else if(width===390){
    await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
    await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
    await until(()=>evaluate('!document.querySelector(".ir92-first-contact")'));
    await check("escape-restores-dock-focus",'document.activeElement?.classList.contains("ir87-scout")');
  }else if(width===768){
    await evaluate('document.querySelector(".ir92-intent-grid a").click()');
    await until(()=>evaluate('location.pathname.endsWith("/discover")&&!document.querySelector(".ir92-first-contact")'));
    await send("Page.navigate",{url:base+"/creator/"});
    await until(()=>evaluate('!!document.querySelector(".ir80-dock")&&!!document.querySelector(".av79-home")'));
    await pause(1450);
    await check("destination-is-not-an-invitation-loop",'!document.querySelector(".ir92-first-contact")');
  }else{
    await evaluate('document.querySelector(".ir92-not-now").click()');
    await until(()=>evaluate('!document.querySelector(".ir92-first-contact")'));
    await until(()=>evaluate('document.activeElement?.classList.contains("ir87-scout")'));
    await check("not-now-restores-dock-focus",'document.activeElement?.classList.contains("ir87-scout")');
  }
  await check("first-contact-remembered-"+width,'localStorage.getItem("anevum.iren.first-contact.v092")==="seen"');
  await check("one-compact-helper-"+width,'(()=>{const buttons=document.querySelectorAll(".ir87-scout");if(buttons.length!==1||document.querySelector(".an-notification-center"))return false;const r=buttons[0].getBoundingClientRect();return r.width>=48&&r.width<=58&&r.height>=48&&r.height<=58;})()');
  // V137 selects the HD vector companion on all surfaces while preserving the
  // independent legacy 3D rig. Require actual high-resolution rendered SVG.
  await until(()=>evaluate('!!document.querySelector(".ir137-vector-pet .ir137-pet-art")'),16000);
  await check("one-HD-companion-"+width,'(()=>{const s=document.querySelector(".ir137-pet-art");return !!s&&s.viewBox.baseVal.width===128&&s.querySelectorAll(".ir137-pet-eye").length===2&&document.querySelectorAll(".ir88-3d-canvas").length===0;})()');
  await capture("iren-scout-"+width);
  await evaluate('document.querySelector(".ir80-dock").click()');
  await until(()=>evaluate('!!document.querySelector(".ir80-help")'));
  await until(()=>evaluate('document.activeElement?.getAttribute("aria-label")==="Close IREN"'));
  await check("explicit-help-focuses-panel-"+width,'document.activeElement===document.querySelector(".ir80-help .ir80-icon-button")');
  await check("help-accessible-"+width,'document.querySelector(".ir80-help").getAttribute("aria-label")==="IREN companion"');
  await check("home-station-"+width,'document.querySelector(".ir88-station")?.textContent.includes("THE WAYFINDER")');
  await check("home-dialogue-"+width,'document.querySelector(".ir88-voice-line")?.textContent.includes("Welcome, explorer")');
  await check("help-inside-"+width,'(()=>{const r=document.querySelector(".ir80-help").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;})()');
  await check("expanded-HD-pet-"+width,'document.querySelectorAll(".ir88-figure.ir137-vector-pet .ir137-pet-art").length===1');
  await capture("iren-help-"+width);
  await evaluate('document.querySelector("#ir87-updates-tab").click()');
  await until(()=>evaluate('!!document.querySelector("#ir87-updates-body")'));
  await check("signals-guest-boundary-"+width,'document.querySelector("#ir87-updates-body").textContent.includes("Sign in")');
  await capture("iren-signals-"+width);
  await evaluate('document.querySelector("#ir87-help-tab").click()');
  await evaluate('document.querySelector(".ir80-tour-launch").click()');
  await until(()=>evaluate('!!document.querySelector(".ir80-guide-card")&&location.pathname.endsWith("/creator/")'));
  await until(()=>evaluate('!!document.querySelector(".ir80-spotlight")'));
  await until(()=>evaluate('!!document.querySelector(".ir80-guide-layer .ir137-vector-pet .ir137-pet-art")'),16000);
  await check("guide-single-HD-pet-"+width,'document.querySelectorAll(".ir80-guide-layer .ir137-pet-art").length===1&&document.querySelectorAll(".ir88-3d-canvas").length===0');
  await check("tour-step-"+width,'document.querySelector("#ir80-guide-title")?.textContent.includes("ANEVUM")');
  await check("tour-modal-"+width,'document.querySelector(".ir80-guide-card").getAttribute("aria-modal")==="true"');
  await check("tour-inside-"+width,'(()=>{const r=document.querySelector(".ir80-guide-card").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;})()');
  await capture("iren-arrival-"+width);
  await evaluate('document.querySelector("[data-iren-next]").click()');
  await until(()=>evaluate('location.pathname.endsWith("/creator/")&&document.querySelector("#ir80-guide-title")?.textContent.includes("Choose your direction")'));
  await capture("iren-wayfinder-"+width);
  await evaluate('document.querySelector("[data-iren-next]").click()');
  await until(()=>evaluate('location.pathname.endsWith("/discover")&&document.querySelector("#ir80-guide-title")?.textContent.includes("interests you")'));
  await capture("iren-discover-"+width);
  await evaluate('document.querySelector("[data-iren-next]").click()');
  await until(()=>evaluate('location.pathname.endsWith("/community")&&!!document.querySelector(".ir80-guide-card")&&document.querySelector("#ir80-guide-title")?.textContent.includes("your people")'));
  await capture("iren-community-"+width);
  await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await until(()=>evaluate('!document.querySelector(".ir80-guide-card")'));
  await check("paused-"+width,'(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith("anevum.iren.guided-continuance.v080."));return k&&JSON.parse(localStorage.getItem(k)).status==="paused";})()');
  await evaluate('document.querySelector(".av9-menu-trigger").click()');
  await until(()=>evaluate('!!document.querySelector(".av79-navigation[open]")'));
  await check("four-routes-"+width,'document.querySelectorAll(".av79-navigation[open] .av79-navigation-primary .av79-destination").length===4');
  await check("help-route-"+width,'!!document.querySelector(".av79-navigation[open] .ir80-wayfinder-entry")');
  await evaluate('document.querySelector(".ir80-wayfinder-entry").click()');
  await until(()=>evaluate('!!document.querySelector(".ir80-help")&&!document.querySelector(".av79-navigation[open]")'));
  await check("community-station-"+width,'document.querySelector(".ir88-station")?.textContent.includes("THE COMMONS")');
  await check("community-topic-"+width,'document.querySelector(".ir80-topic-grid button[aria-pressed=true]")?.textContent.includes("Meet people")');
  await evaluate('document.querySelector(".ir80-tour-launch").click()');
  await until(()=>evaluate('document.querySelector("#ir80-guide-title")?.textContent.includes("your people")'));
  await evaluate('document.querySelector("[data-iren-next]").click()');
  await until(()=>evaluate('document.querySelector("#ir80-guide-title")?.textContent.includes("whole network")'));
  await evaluate('document.querySelector("[data-iren-next]").click()');
  await until(()=>evaluate('!document.querySelector(".ir80-guide-card")'));
  await check("finished-"+width,'(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith("anevum.iren.guided-continuance.v080."));return k&&JSON.parse(localStorage.getItem(k)).status==="completed";})()');
  // A user can drag the helper all the way to the top edge. Check its expanded
  // panel stays inside the 320px viewport and flips below the character.
  if(width===320){
   const key="anevum.iren.living.position.v088.anevum.iren.guided-continuance.v080.visitor";
   await evaluate('localStorage.setItem('+JSON.stringify(key)+',JSON.stringify({right:254,bottom:654}))');
   await send("Page.navigate",{url:base+"/creator/"});
   await until(()=>evaluate('!!document.querySelector(".ir80-dock")&&!!document.querySelector(".av79-home")'));
   await evaluate('document.querySelector(".ir80-dock").click()');
   await until(()=>evaluate('!!document.querySelector(".ir80-help")'));
   await check("docked-top-panel-bounds",'(()=>{const e=document.querySelector(".ir80-help"),r=e.getBoundingClientRect();return r.top>=0&&r.left>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1;})()');
   await check("docked-top-panel-flipped",'(()=>{const b=document.querySelector(".ir80-dock").getBoundingClientRect(),h=document.querySelector(".ir80-help").getBoundingClientRect();return h.top>=b.bottom-1;})()');
   await check("docked-clear-navigation",'(()=>{const b=document.querySelector(".ir80-dock").getBoundingClientRect(),h=document.querySelector(".av9-brand").getBoundingClientRect();return b.top>=h.bottom+2;})()');
   await capture("iren-docked-top-320");
   await evaluate('localStorage.removeItem('+JSON.stringify(key)+')');
  }
  await check("overflow-"+width,'document.documentElement.scrollWidth<=innerWidth+1');
  evidence.push({width,height,guestTour:"PASS",help:"PASS",spotlight:"PASS",skipResume:"PASS",completed:"PASS",navCount:4,overflow:false});
  console.log("IREN_V080_BROWSER_PASS_"+width);
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({source:"OFFLINE SYNTHETIC",version:"V080",results:evidence},null,2));
}finally{
 try{if(socket?.readyState===1)socket.close();}catch{}
 if(browser.exitCode===null){browser.kill("SIGTERM");await pause(800);}
 try{rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:200});}catch{}
}
