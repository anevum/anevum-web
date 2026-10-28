/** Real-React IREN V111 visual checks against loopback fixtures; no production writes. */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)throw Error("V111_LOOPBACK_BROWSER_REQUIRED");
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=15000){
 const stop=Date.now()+timeout;let last="";
 while(Date.now()<stop){try{let v=await fn();if(v)return v}catch(e){last=String(e)}await delay(125)}
 throw Error("V111_BROWSER_TIMEOUT: "+last.slice(0,180));
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-iren-v111-"));
const browser=spawn(chrome,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--disable-background-networking","--remote-allow-origins=*","--no-first-run","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
let ws=null;
const evidence=[];
try{
 const port=await until(()=>{const file=join(profile,"DevToolsActivePort");return existsSync(file)?readFileSync(file,"utf8").split("\n")[0]:null});
 const url=await until(async()=>{const r=await fetch("http://127.0.0.1:"+port+"/json/list");return r.ok?(await r.json()).find(p=>p.type==="page")?.webSocketDebuggerUrl:null});
 ws=new WebSocket(url);
 const requests=new Map();let serial=0;
 ws.addEventListener("message",({data})=>{const r=JSON.parse(String(data)),p=requests.get(r.id);if(!p)return;requests.delete(r.id);r.error?p.reject(Error(r.error.message)):p.resolve(r.result||{})});
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;requests.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value};
 const capture=async name=>{const data=(await send("Page.captureScreenshot",{format:"png",fromSurface:true})).data;if(!data||data.length<3500)throw Error("V111_MISSING_SCREENSHOT_"+name);writeFileSync(join(output,name+".png"),Buffer.from(data,"base64"))};
 const trigger=(key,title)=>'window.dispatchEvent(new CustomEvent("anevum:alert",{detail:{owner:undefined,alert:{key:"'+key+'",kind:"info",title:"'+title+'",detail:"Visual QA only. No rewards were granted.",preview:true}}}))';
 await send("Page.enable");await send("Runtime.enable");
 await send("Page.addScriptToEvaluateOnNewDocument",{source:'localStorage.setItem("anevum.iren.first-contact.v092","seen");'});
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
  await send("Page.navigate",{url:base+"/creator/"});
  await until(()=>evaluate('!!document.querySelector(".av79-home .av79-hero")&&!!document.querySelector(".ir87-scout")'));
  await delay(220);
  await evaluate(trigger("qa-"+width,"Transmission preview"));
  await until(()=>evaluate('!!document.querySelector(".ir111-phase-open .ir111-transmission")'));
  // Inspect the settled visual state, not the first transparent transition frame.
  await delay(650);
  const geometry=await evaluate('(()=>{const e=document.querySelector(".ir111-transmission"),r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,text:e.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,one:document.querySelectorAll(".ir87-scout").length===1,old:!!document.querySelector(".an-toast"),live:document.querySelector(".an-live")?.textContent,dismiss:!!e.querySelector("button")}})()');
  if(!geometry.one||geometry.old||geometry.overflow||!geometry.dismiss||!geometry.live?.includes("Transmission preview")||!geometry.text?.includes("VISUAL PREVIEW")||geometry.left<0||geometry.top<0||geometry.right>width+1||geometry.bottom>height+1)
   throw Error("V111_TRANSMISSION_GEOMETRY_"+width+": "+JSON.stringify(geometry));
  await capture("iren-transmission-"+width);
  await evaluate('document.querySelector(".ir111-transmission button").click()');
  await until(()=>evaluate('!document.querySelector(".ir111-transmission")'));
  // Real mounted IREN behavior: a full informational queue cannot swallow
  // the local failure of a user action. Signals are synthetic display fixtures;
  // no server award, login or private data is created.
  await evaluate('(()=>{for(let i=0;i<26;i++)window.dispatchEvent(new CustomEvent("anevum:alert",{detail:{owner:undefined,alert:{key:"flood-'+width+'-"+i,kind:"info",title:"CI background info "+i,preview:true}}}));window.dispatchEvent(new CustomEvent("anevum:alert",{detail:{owner:undefined,alert:{key:"critical-'+width+'",kind:"error",title:"CI action could not be saved",detail:"Synthetic local failure; no changes were made."}}}));})()');
  await until(()=>evaluate('document.querySelector(".ir111-transmission")?.textContent?.includes("CI background info 0")'));
  await evaluate('document.querySelector(".ir111-transmission button").click()');
  await until(()=>evaluate('document.querySelector(".ir111-transmission")?.textContent?.includes("CI action could not be saved")'));
  // Match the original V111 screenshot contract: measure the settled panel,
  // not an intentional -24px opening transform partway through its .55s ease.
  await delay(650);
  const priority=await evaluate('(()=>{const el=document.querySelector(".ir111-transmission"),box=el.getBoundingClientRect();return {text:el.textContent,live:document.querySelector(".an-live")?.textContent,left:box.left,right:box.right,bottom:box.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1}})()');
  if(!priority.text.includes("ATTENTION REQUIRED")||!priority.live.includes("CI action could not be saved")||
    priority.overflow||priority.left<0||priority.right>width+1||priority.bottom>height+1)
    throw Error("V139_PRIORITY_SIGNAL_DROPPED_OR_CLIPPED_"+width+": "+JSON.stringify(priority));
  await capture("iren-priority-"+width);
  evidence.push({width,height,geometry,priority});
 }
 await evaluate('localStorage.setItem("anevum.iren.guided-continuance.v080.visitor.hidden","yes")');
 await send("Page.navigate",{url:base+"/creator/"});
 await until(()=>evaluate('!!document.querySelector(".av79-home .av79-hero")'));
 await delay(250);
 await evaluate(trigger("qa-hidden","Quiet preview"));
 await until(()=>evaluate('!!document.querySelector(".ir111-quiet")'));
 if(!await evaluate('!document.querySelector(".ir87-scout")&&document.querySelector(".ir111-quiet")?.textContent?.includes("Quiet preview")'))
  throw Error("V111_HIDDEN_NOT_DELIVERED");
 await evaluate('document.querySelector(".ir111-quiet button").click()');
 await until(()=>evaluate('!document.querySelector(".ir111-quiet")'));
 await evaluate('localStorage.removeItem("anevum.iren.guided-continuance.v080.visitor.hidden")');
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 await send("Page.navigate",{url:base+"/creator/"});
 await until(()=>evaluate('!!document.querySelector(".ir87-scout")'));
 await delay(220);
 await evaluate(trigger("qa-reduced","Reduced motion preview"));
 await until(()=>evaluate('!!document.querySelector(".ir111-transmission")'));
 const reduced=await evaluate('(()=>{const e=document.querySelector(".ir111-transmission"),s=getComputedStyle(e);return {media:matchMedia("(prefers-reduced-motion: reduce)").matches,transition:s.transitionDuration,animation:s.animationName,animationDuration:s.animationDuration}})()');
 // The existing accessibility baseline normalizes zero duration to 0.01ms
 // in computed styles. A <=1ms upper bound is effectively instantaneous
 // while still rejecting any meaningful transition or keyframe animation.
 const durationReduced=value=>value.split(",").every(item=>{
  const seconds=Number.parseFloat(item);
  return Number.isFinite(seconds)&&seconds>=0&&seconds<=0.001;
 });
 if(!reduced.media||!durationReduced(reduced.transition)||!durationReduced(reduced.animationDuration)||reduced.animation!=="none")
  throw Error("V111_REDUCED_MOTION_NOT_HONORED "+JSON.stringify(reduced));
 await evaluate('document.querySelector(".ir111-transmission button").click()');
 await until(()=>evaluate('!document.querySelector(".ir111-transmission")'));
 // The active immersive player is top-layer/fixed and conceals the helper.
 // Keep signals in the one queue until the user returns to the page chrome.
 await evaluate('document.body.classList.add("av095-expanded")');
 await delay(200);
 await evaluate(trigger("qa-immersive","Immersive queued preview"));
 await until(()=>evaluate('document.querySelector(".an-live")?.textContent?.includes("Immersive queued preview")'));
 await delay(6200);
 const preserved=await evaluate('document.querySelector(".an-live")?.textContent?.includes("Immersive queued preview")');
 if(!preserved)throw Error("V111_IMMERSIVE_SIGNAL_DISMISSED_WITHOUT_PRESENTATION");
 await evaluate('document.body.classList.remove("av095-expanded")');
 await until(()=>evaluate('!!document.querySelector(".ir111-phase-open .ir111-transmission")'));
 await evaluate('document.querySelector(".ir111-transmission button").click()');
 await until(()=>evaluate('!document.querySelector(".ir111-transmission")'));
 // Guided-tour cards mask the normal transmission. Do not silently ACK a
 // verified signal after the six-second timer while the tour owns the screen.
 await evaluate('window.dispatchEvent(new Event("anevum:iren-tour"))');
 await until(()=>evaluate('!!document.querySelector(".ir80-guide-card")&&document.body.classList.contains("ir80-tour-active")'));
 await evaluate(trigger("qa-tour-queued","Guided tour queued preview"));
 await until(()=>evaluate('document.querySelector(".an-live")?.textContent?.includes("Guided tour queued preview")'));
 await delay(6200);
 if(!await evaluate('document.querySelector(".an-live")?.textContent?.includes("Guided tour queued preview")'))
   throw Error("V116_TOUR_SIGNAL_DISMISSED_WITHOUT_PRESENTATION");
 await evaluate('document.querySelector(".ir80-skip").click()');
 await until(()=>evaluate('!document.body.classList.contains("ir80-tour-active")'));
 await until(()=>evaluate('!!document.querySelector(".ir111-phase-open .ir111-transmission")'));
 await evaluate('document.querySelector(".ir111-transmission button").click()');
 await until(()=>evaluate('!document.querySelector(".ir111-transmission")'));
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({pass:true,syntheticOnly:true,productionChanges:0,checks:["desktop","phone","small-phone","urgent-error-after-saturated-info","hidden-helper","reduced-motion","immersive-playback-queue","guided-tour-queue"],evidence},null,2));
 console.log("IREN_V111_REACT_VISUAL_ACCEPTANCE=PASS");
}catch(error){
 try{
  if(ws?.readyState===WebSocket.OPEN){
   const id=Date.now();
   ws.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression:'JSON.stringify({url:location.href,ready:document.readyState,text:document.body.innerText.slice(0,2500),hero:!!document.querySelector(".av79-home .av79-hero"),scout:!!document.querySelector(".ir87-scout")})',returnByValue:true}}));
   const diagnostic=await Promise.race([new Promise(resolve=>ws.addEventListener('message',({data})=>{const r=JSON.parse(String(data));if(r.id===id)resolve(r.result) })),delay(3000)]);
   writeFileSync(join(output,'failure-diagnostic.json'),JSON.stringify({error:String(error),diagnostic},null,2));
  }
 }catch{}
 throw error;
}finally{
 try{ws?.close()}catch{}
 browser.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140})}catch(e){if(!["ENOTEMPTY","EBUSY"].includes(e?.code))throw e}
}
