/**
 * V114 real React first-load browser acceptance.
 * Local synthetic catalogue only; no production accounts, releases or writes.
 */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)
 throw Error("V114_LOOPBACK_BROWSER_REQUIRED");
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=18000){
 const end=Date.now()+timeout;let last="";
 while(Date.now()<end){
  try{const value=await fn();if(value)return value;}catch(e){last=String(e)}
  await pause(125);
 }
 throw Error("V114_BROWSER_TIMEOUT: "+last.slice(0,200));
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-home-v114-"));
const chromeProc=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--no-first-run","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let ws=null;const acceptance=[];
try{
 const port=await until(()=>{
  const file=join(profile,"DevToolsActivePort");
  return existsSync(file)?readFileSync(file,"utf8").split("\n")[0]:null;
 });
 const url=await until(async()=>{
  const r=await fetch("http://127.0.0.1:"+port+"/json/list");
  return r.ok?(await r.json()).find(t=>t.type==="page")?.webSocketDebuggerUrl:null;
 });
 ws=new WebSocket(url);let sequence=0;const pending=new Map();
 ws.addEventListener("message",({data})=>{
  const response=JSON.parse(String(data)),task=pending.get(response.id);
  if(!task)return;
  pending.delete(response.id);
  response.error?task.reject(Error(response.error.message)):task.resolve(response.result||{});
 });
 await new Promise((ok,fail)=>{
  ws.addEventListener("open",ok,{once:true});
  ws.addEventListener("error",fail,{once:true});
 });
 const send=(method,params={})=>new Promise((ok,fail)=>{
  const id=++sequence;pending.set(id,{resolve:ok,reject:fail});
  ws.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result?.value;
 };
 const capture=async name=>{
  const encoded=(await send("Page.captureScreenshot",{format:"png",fromSurface:true})).data;
  if(!encoded||encoded.length<3500)throw Error("V114_SCREENSHOT_EMPTY_"+name);
  writeFileSync(join(output,name+".png"),Buffer.from(encoded,"base64"));
 };
 await send("Page.enable");
 await send("Runtime.enable");
 await send("Page.addScriptToEvaluateOnNewDocument",{
  source:'localStorage.setItem("anevum.iren.first-contact.v092","seen");'
 });
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
  await send("Page.navigate",{url:base+"/creator/"});
  await until(()=>evaluate('!!document.querySelector(".av114-hero")&&!!document.querySelector(".av79-feature")&&document.querySelectorAll(".av79-gateway").length===4'));
  const view=await evaluate('(()=>{const hero=document.querySelector(".av114-hero"),a=hero.querySelector(".av79-hero-actions"),links=[...a.querySelectorAll("a")],r=hero.getBoundingClientRect(),portal=hero.querySelector(".av114-portal"),style=getComputedStyle(portal.querySelector(".av114-portal-core"));return {title:hero.querySelector("h1")?.textContent,description:hero.querySelector("p")?.textContent,paths:links.map(l=>new URL(l.href).pathname),labels:links.map(l=>l.textContent.trim()),rect:[r.left,r.top,r.right,r.bottom],inside:links.every(l=>{const t=l.getBoundingClientRect();return t.left>=-1&&t.right<=innerWidth+1&&t.width>100&&t.height>=44}),gateways:document.querySelectorAll(".av79-gateway").length,feature:document.querySelector(".av79-feature h3")?.textContent,linksToGame:links.some(l=>l.href.includes("?category=games")),orbitAria:portal.getAttribute("aria-hidden"),reduced:style.animationName==="none",overflow:document.documentElement.scrollWidth>innerWidth+1}})()');
  if(!view.title?.includes("Enter a universe in the making.")||!view.description?.includes("creative network")||
    !view.paths[0]?.endsWith("/discover")||!view.paths[1]?.endsWith("/join")||view.linksToGame||!view.inside||
    view.rect[0]<-1||view.rect[2]>width+1||view.gateways!==4||!view.feature||
    view.orbitAria!=="true"||!view.reduced||view.overflow)
    throw Error("V114_ARRIVAL_"+width+": "+JSON.stringify(view));
  await capture("arrival-"+width);
  acceptance.push({width,height,view});
  if(width===390){
   await evaluate('document.querySelector(".av114-hero .av79-button--bright")?.click()');
   await until(()=>evaluate('location.pathname.endsWith("/discover")'));
   if(!await evaluate('!!document.querySelector(".ir87-scout")'))
    throw Error("V114_IREN_MISSING_AFTER_DISCOVERY");
  }
  console.log("V114_FIRST_LOAD_"+width+"=PASS");
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({
  pass:true,source:"real compiled React with local synthetic catalogue",
  authenticUserSessions:0,productionWrites:0,evidence:acceptance
 },null,2));
 console.log("V114_FIRST_LOAD_BROWSER=PASS");
}finally{
 try{ws?.close()}catch{}
 chromeProc.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140})}
 catch(e){if(!["ENOTEMPTY","EBUSY"].includes(e?.code))throw e}
}
