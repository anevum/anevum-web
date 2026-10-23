/**
 * V111 homepage first-contact browser acceptance of the actual compiled React site
 * using loopback synthetic project fixtures. No real users or production access.
 */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)
 throw Error("V111_HOME_LOCAL_BROWSER_REQUIRED");
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
 const screenshot=async name=>{const data=(await send("Page.captureScreenshot",{format:"png",fromSurface:true})).data;if(!data||data.length<3500)throw Error("V111_HOME_SCREENSHOT_EMPTY_"+name);writeFileSync(join(output,name+".png"),Buffer.from(data,"base64"))};
 await send("Page.enable");await send("Runtime.enable");
 await send("Page.addScriptToEvaluateOnNewDocument",{source:'localStorage.setItem("anevum.iren.first-contact.v092","seen");'});
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 for(const [width,height,label] of [[1440,900,"desktop"],[390,844,"phone"],[320,720,"small-phone"]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
  await send("Page.navigate",{url:base+"/creator/"});
  // The canonical featured project is loaded asynchronously from the real
  // local catalogue fixture, so await it before asserting the first fold.
  await until(()=>evaluate('!!document.querySelector(".av111-onramp")&&!!document.querySelector(".av79-feature")&&document.querySelectorAll(".av79-gateway").length===4'));
  const entry=await evaluate('(()=>{const rail=document.querySelector(".av111-onramp"),join=rail.querySelector("a.av111-onramp-primary"),tour=rail.querySelector("button.av111-onramp-guide"),r=rail.getBoundingClientRect(),j=join?.getBoundingClientRect(),t=tour?.getBoundingClientRect();return {hero:!!document.querySelector(".av79-hero"),featured:!!document.querySelector(".av79-feature"),gateways:document.querySelectorAll(".av79-gateway").length,join:join?.getAttribute("href"),tour:!!tour,rail:[r.left,r.right,r.width],buttons:[j?.height,t?.height],overflow:document.documentElement.scrollWidth>innerWidth+1,text:rail.textContent}})()');
  if(!entry.hero||!entry.featured||entry.gateways!==4||!entry.join?.endsWith("/join")||!entry.tour||entry.overflow||entry.rail[0]<-1||entry.rail[1]>width+1||entry.buttons.some(h=>h<44)||!entry.text?.includes("Explore first. Join when ready."))
   throw Error("V111_HOME_FIRST_CONTACT_"+label+":"+JSON.stringify(entry));
  if(width<=420){
   const action=await evaluate('(()=>{const head=document.querySelector(".av79-now .av79-section-heading"),link=head?.querySelector("a"),title=head?.querySelector("h2"),r=link?.getBoundingClientRect(),h=title?.getBoundingClientRect();return {width:r?.width,top:r?.top,titleBottom:h?.bottom,right:r?.right}})()');
   if(!action.width||action.width<82||action.top<action.titleBottom-1||action.right>width+1)
    throw Error("V111_HOME_NARROW_SECTION_ACTION_"+label+":"+JSON.stringify(action));
  }
  await evaluate('document.querySelector(".av111-onramp")?.scrollIntoView({block:"center",behavior:"instant"})');
  await screenshot("first-contact-"+label);
  evidence.push({label,width,height,entry});
  if(label==="phone"){
   await evaluate('document.querySelector(".av111-onramp-guide")?.click()');
   await until(()=>evaluate('!!document.querySelector(".ir80-guide-card")'));
   const tour=await evaluate('(()=>({route:location.pathname,title:document.querySelector("#ir80-guide-title")?.textContent,one:document.querySelectorAll(".ir87-scout").length<=1}))()');
   if(!tour.route?.endsWith("/discover")||!tour.title||!tour.one)throw Error("V111_HOME_IREN_TOUR_"+JSON.stringify(tour));
   await screenshot("first-contact-iren-tour-phone");
   await evaluate('document.querySelector(".ir80-skip")?.click()');
   await until(()=>evaluate('!document.querySelector(".ir80-guide-card")'));
  }
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({pass:true,source:"compiled React local loopback",memberWrites:0,evidence},null,2));
 console.log("V111_FIRST_CONTACT_REACT_BROWSER=PASS");
}finally{
 try{ws?.close()}catch{}
 chromeProc.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140})}
 catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error?.code))throw error}
}
