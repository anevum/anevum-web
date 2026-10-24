/**
 * V115 homepage first-contact and IREN browser acceptance of the actual compiled React site
 * using loopback synthetic project fixtures. No real users or production access.
 */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)
 throw Error("V115_HOME_LOCAL_BROWSER_REQUIRED");
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
async function until(fn,timeout=18000){
 let last="";
 for(let end=Date.now()+timeout;Date.now()<end;){
  try{const value=await fn();if(value)return value}catch(error){last=String(error)}
  await delay(140);
 }
 throw Error("V111_HOME_TIMEOUT "+last.slice(0,150));
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-home-v111-"));
const chromeProc=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--no-first-run","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let ws=null;const evidence=[];
try{
 const port=await until(()=>{const file=join(profile,"DevToolsActivePort");return existsSync(file)?readFileSync(file,"utf8").split("\n")[0]:null});
 const url=await until(async()=>{const r=await fetch("http://127.0.0.1:"+port+"/json/list");return r.ok?(await r.json()).find(t=>t.type==="page")?.webSocketDebuggerUrl:null});
 ws=new WebSocket(url);let seq=0;const tasks=new Map();
 ws.addEventListener("message",({data})=>{const v=JSON.parse(String(data)),t=tasks.get(v.id);if(!t)return;tasks.delete(v.id);v.error?t.reject(Error(v.error.message)):t.resolve(v.result||{})});
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;tasks.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value};
 const screenshot=async name=>{const data=(await send("Page.captureScreenshot",{format:"png",fromSurface:true})).data;if(!data||data.length<3500)throw Error("V115_HOME_SCREENSHOT_EMPTY_"+name);writeFileSync(join(output,name+".png"),Buffer.from(data,"base64"))};
 await send("Page.enable");await send("Runtime.enable");
 await send("Page.addScriptToEvaluateOnNewDocument",{source:'localStorage.setItem("anevum.iren.first-contact.v092","seen");'});
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 for(const [width,height,label] of [[1440,900,"desktop"],[390,844,"phone"],[320,720,"small-phone"]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:2,mobile:width<700});
  await send("Page.navigate",{url:base+"/creator/"});
  // First contact is now an ANEVUM world/wayfinder experience, not a game
  // promotion. The local catalogue fixture remains authentic public data.
  await until(()=>evaluate('!!document.querySelector(".av115-wayfinder")&&!!document.querySelector(".av115-iren-console")&&!!document.querySelector(".av115-public-index")&&document.querySelectorAll(".av79-gateway").length===4'));
  const entry=await evaluate('(()=>{const wayfinder=document.querySelector(".av115-wayfinder"),cards=[...wayfinder.querySelectorAll(".av79-gateway")],join=wayfinder.querySelector(".av115-gateway-member"),consoleButton=document.querySelector(".av115-iren-console button"),headline=document.querySelector("#av115-wayfinder-title"),rect=wayfinder.getBoundingClientRect();return {gateways:cards.length,labels:cards.map(x=>x.querySelector("strong")?.textContent),join:join?.getAttribute("href"),intro:!!consoleButton,headline:headline?.textContent,rect:[rect.left,rect.right],overflow:document.documentElement.scrollWidth>innerWidth+1,testGameFeatured:!!document.querySelector(".av79-feature")}})()');
  if(entry.gateways!==4||!entry.join?.endsWith("/join")||!entry.intro||entry.overflow||entry.rect[0]<-1||entry.rect[1]>width+1||entry.testGameFeatured||!entry.headline?.includes("Where will you go?"))
   throw Error("V115_HOME_WAYFINDER_"+label+":"+JSON.stringify(entry));
  if(width<=420){
   const action=await evaluate('(()=>{const head=document.querySelector(".av79-now .av79-section-heading"),link=head?.querySelector("a"),title=head?.querySelector("h2"),r=link?.getBoundingClientRect(),h=title?.getBoundingClientRect();return {width:r?.width,top:r?.top,titleBottom:h?.bottom,right:r?.right}})()');
   if(!action.width||action.width<82||action.top<action.titleBottom-1||action.right>width+1)
    throw Error("V115_HOME_NARROW_SECTION_ACTION_"+label+":"+JSON.stringify(action));
  }
  const arrival=await evaluate('(()=>{const hero=document.querySelector(".av114-arrival"),heading=hero?.querySelector("h1"),scene=hero?.querySelector(".av114-arrival-scene"),actions=[...(hero?.querySelectorAll(".av79-hero-actions :is(a,button)")||[])],r=hero?.getBoundingClientRect();return {exists:!!hero,scene:!!scene,heading:heading?.textContent,actionCount:actions.length,actions:actions.map(a=>{const b=a.getBoundingClientRect();return {text:a.textContent,href:a.getAttribute("href"),height:b.height,top:b.top,bottom:b.bottom,left:b.left,right:b.right}}),rect:r?[r.left,r.right,r.top,r.bottom]:null,overflow:document.documentElement.scrollWidth>innerWidth+1}})()');
  // V123 supports one optional member entry without weakening primary
  // discovery, viewport safety, or a single real IREN helper.
  const discover=arrival.actions[0],member=arrival.actions[1];
  const two=arrival.actionCount===2;
  const collision=two&&discover.left<member.right-1&&member.left<discover.right-1&&
    discover.top<member.bottom-1&&member.top<discover.bottom-1;
  if(!arrival.exists||!arrival.scene||!arrival.heading?.includes("Find something")||
     ![1,2].includes(arrival.actionCount)||arrival.overflow||
     arrival.actions.some(b=>b.height<44||b.top<0||b.bottom>height)||
     arrival.rect[0]<-1||arrival.rect[1]>width+1||
     !discover.href?.endsWith("/discover")||
     (two&&(!member.href?.endsWith("/join")||!member.text?.includes("Join the early community")||collision)))
   throw Error("V115_FIRST_ARRIVAL_"+label+":"+JSON.stringify({...arrival,collision}));
  await screenshot("first-arrival-"+label);
  // V133 source-bound first look: it must be the actual approved catalogue
  // fixture, not a hard-coded mascot, fake rating or decorative project.
  await until(()=>evaluate('!!document.querySelector(".av133-first-look-card")||!!document.querySelector(".av133-first-look-empty")'));
  const firstLook=await evaluate('(()=>{const root=document.querySelector(".av133-first-look"),card=root?.querySelector(".av133-first-look-card"),index=root?.querySelector(".av133-index-link"),preview=card?.querySelector(".av133-first-look-bottom a"),rect=root?.getBoundingClientRect(),title=card?.querySelector("h3")?.textContent;return {heading:root?.querySelector("h2")?.textContent,card:!!card,preview:preview?.getAttribute("href"),title,index:index?.getAttribute("href"),rect:rect?[rect.left,rect.right]:null,overflow:document.documentElement.scrollWidth>innerWidth+1}})()');
  if(!firstLook.heading?.includes("See what lives here")||!firstLook.card||
    !firstLook.title||!firstLook.preview?.includes("/projects/")||
    !firstLook.index?.endsWith("/discover")||firstLook.overflow||
    firstLook.rect[0]<-1||firstLook.rect[1]>width+1)
    throw Error("V133_FIRST_LOOK_"+label+":"+JSON.stringify(firstLook));
  await evaluate('document.querySelector(".av133-first-look").scrollIntoView({block:"center",behavior:"instant"})');
  await screenshot("first-look-"+label);
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');
  evidence.push({label:"first-look-"+label,firstLook});
  if(width<=390){
   const orientation=await evaluate('(()=>{const b=document.querySelector(".av115-iren-console button").getBoundingClientRect(),d=document.querySelector(".ir80-dock").getBoundingClientRect();return {bottom:b.bottom,obstructed:b.left<d.right&&d.left<b.right&&b.top<d.bottom&&d.top<b.bottom}})()');
   if(orientation.bottom>height||orientation.obstructed)throw Error("V125_ORIENTATION_OBSTRUCTED_"+JSON.stringify(orientation));
  }
  // V125: exercise the real control, including the OS reduced-motion state.
  const reduced=await evaluate('(()=>({hidden:getComputedStyle(document.querySelector(".av125-motion-toggle")).display==="none",note:getComputedStyle(document.querySelector(".av125-motion-note")).display!=="none",running:document.querySelector(".av114-arrival-scene").getAnimations({subtree:true}).filter(a=>a.playState==="running").length,companions:document.querySelectorAll(".ir80-dock").length}))()');
  if(!reduced.hidden||!reduced.note||reduced.running||reduced.companions!==1)
   throw Error("V125_REDUCED_MOTION_"+JSON.stringify(reduced));
  await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  await until(()=>evaluate('document.querySelector(".av125-atlas-beacon-sweep").getAnimations().some(a=>a.playState==="running")'));
  await evaluate('document.querySelector(".av125-motion-toggle").focus();document.querySelector(".av125-motion-toggle").click()');
  await until(()=>evaluate('document.querySelector(".av125-motion-toggle").getAttribute("aria-pressed")==="true"'));
  const paused=await evaluate('(()=>{const toggle=document.querySelector(".av125-motion-toggle"),a=toggle.getBoundingClientRect(),way=document.querySelector(".av124-hero-wayfinder").getBoundingClientRect();return {running:[...document.querySelector(".av125-arrival").getAnimations({subtree:true}),...document.querySelector(".av125-charter").getAnimations({subtree:true})].filter(a=>a.playState==="running").length,focused:document.activeElement===toggle,utilitiesOneRow:Math.abs(a.top-way.top)<5,label:toggle.textContent}})()');
  if(paused.running||!paused.focused||(width<=390&&!paused.utilitiesOneRow))
   throw Error("V125_PAUSE_"+JSON.stringify(paused));
  await screenshot("motion-paused-"+label);
  await evaluate('document.querySelector(".av125-motion-toggle").click()');
  await until(()=>evaluate('document.querySelector(".av125-motion-toggle").getAttribute("aria-pressed")==="false"&&document.querySelector(".av125-atlas-beacon-sweep").getAnimations().some(a=>a.playState==="running")'));
  evidence.push({label:"motion-"+label,reduced,paused,resumed:true});
  await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await evaluate('document.querySelector(".av115-wayfinder")?.scrollIntoView({block:"center",behavior:"instant"})');
  await screenshot("first-contact-"+label);
  evidence.push({label,width,height,entry,arrival});
  if(label==="phone"){
   await evaluate('document.querySelector(".av115-iren-console button")?.click()');
   await until(()=>evaluate('!!document.querySelector(".ir92-first-contact")'));
   const welcome=await evaluate('(()=>({title:document.querySelector(".ir92-first-contact h2")?.textContent,choices:document.querySelectorAll(".ir92-intent-grid a,.ir92-intent-grid button").length,one:document.querySelectorAll(".ir87-scout").length<=1}))()');
   if(!welcome.title?.includes("Continuance")||welcome.choices!==4||!welcome.one)throw Error("V115_HOME_IREN_WELCOME_"+JSON.stringify(welcome));
   await screenshot("first-contact-iren-welcome-phone");
   await evaluate('document.querySelector(".ir80-help-head .ir80-icon-button")?.click()');
   await until(()=>evaluate('!document.querySelector(".ir92-first-contact")'));
   await evaluate('window.dispatchEvent(new Event("anevum:iren-tour"))');
   await until(()=>evaluate('!!document.querySelector(".ir80-guide-card")'));
   const tour=await evaluate('(()=>({route:location.pathname,title:document.querySelector("#ir80-guide-title")?.textContent,one:document.querySelectorAll(".ir87-scout").length<=1}))()');
   if(!tour.route?.endsWith("/creator/")||!tour.title?.includes("ANEVUM")||!tour.one)throw Error("V115_HOME_IREN_TOUR_"+JSON.stringify(tour));
   await screenshot("first-contact-iren-tour-phone");
   await evaluate('document.querySelector(".ir80-skip")?.click()');
   await until(()=>evaluate('!document.querySelector(".ir80-guide-card")'));
  }
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({pass:true,source:"compiled React local loopback",memberWrites:0,evidence},null,2));
 console.log("V115_FIRST_CONTACT_REACT_BROWSER=PASS");
}finally{
 try{ws?.close()}catch{}
 chromeProc.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140})}
 catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error?.code))throw error}
}
