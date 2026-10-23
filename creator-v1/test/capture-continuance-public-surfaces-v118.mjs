/**
 * ANEVUM V118 responsive browser acceptance against a compiled React localhost
 * site and synthetic public fixture. Never connects to real members or production.
 */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,mkdirSync,writeFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)
 throw Error("V118_LOCAL_BROWSER_REQUIRED");
const delay=ms=>new Promise(done=>setTimeout(done,ms));
async function until(check,timeout=16000){
 const end=Date.now()+timeout;let last="";
 while(Date.now()<end){
  try{const ok=await check();if(ok)return ok}
  catch(error){last=String(error)}
  await delay(140);
 }
 throw Error("V118_BROWSER_TIMEOUT: "+last.slice(0,130));
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-surfaces-v118-"));
const browser=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--no-first-run","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
const pending=new Map(),proof=[];let ws=null,serial=0;
try{
 const port=await until(()=>{
  const path=join(profile,"DevToolsActivePort");
  return existsSync(path)?readFileSync(path,"utf8").split("\n")[0]:null;
 });
 const url=await until(async()=>{
  const r=await fetch("http://127.0.0.1:"+port+"/json/list");
  return r.ok?(await r.json()).find(x=>x.type==="page")?.webSocketDebuggerUrl:null;
 });
 ws=new WebSocket(url);
 ws.addEventListener("message",({data})=>{
  const result=JSON.parse(String(data)),task=pending.get(result.id);
  if(!task)return;
  pending.delete(result.id);
  result.error?task.reject(Error(result.error.message)):task.resolve(result.result||{});
 });
 await new Promise((done,fail)=>{
  ws.addEventListener("open",done,{once:true});
  ws.addEventListener("error",fail,{once:true});
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++serial;pending.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result?.value;
 };
 const screenshot=async name=>{
  const result=await send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!result.data||result.data.length<3500)throw Error("V118_SCREENSHOT_EMPTY_"+name);
  writeFileSync(join(output,name+".png"),Buffer.from(result.data,"base64"));
 };
 await send("Page.enable");
 await send("Runtime.enable");
 await send("Page.addScriptToEvaluateOnNewDocument",{
  source:'localStorage.setItem("anevum.iren.first-contact.v092","seen");'
 });
 await send("Emulation.setEmulatedMedia",{
  features:[{name:"prefers-reduced-motion",value:"reduce"}]
 });
 for(const [width,height,label] of [[1440,900,"desktop"],[390,844,"phone"],[320,720,"small-phone"]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
  for(const [page,expected] of [["discover","discover"],["community","community"]]){
   await send("Page.navigate",{url:base+"/creator/"+page});
   await until(()=>evaluate('document.querySelectorAll(".av118-workspace-switch .av118-workspace-link").length===3'));
   const data=await evaluate('(()=>{const shell=document.querySelector(".av118-workspace-switch"),links=[...shell.querySelectorAll(".av118-workspace-link")],active=links.filter(x=>x.getAttribute("aria-current")==="page"),help=shell.querySelector(".av118-workspace-iren"),rect=shell.getBoundingClientRect(),helpRect=help.getBoundingClientRect();return {path:location.pathname,links:links.map(x=>({href:x.getAttribute("href"),height:x.getBoundingClientRect().height})),current:active.map(x=>x.getAttribute("href")),help:!!help,helpHeight:helpRect.height,rect:[rect.left,rect.right],overflow:document.documentElement.scrollWidth>innerWidth+1,componentOverflow:shell.scrollWidth>shell.clientWidth+1,accessibleNav:!!shell.querySelector("nav[aria-label]")};})()');
   if(!data.path.endsWith("/"+expected)||data.links.length!==3||data.current.length!==1||
      !data.current[0].endsWith("/"+expected)||!data.links[0].href.endsWith("/discover")||
      !data.links[1].href.endsWith("/community")||!data.links[2].href.endsWith("/studio")||
      data.links.some(x=>x.height<44)||!data.help||data.helpHeight<44||
      data.rect[0]<-1||data.rect[1]>width+1||data.overflow||!data.accessibleNav)
    throw Error("V118_WORKSPACE_"+label+"_"+page+":"+JSON.stringify(data));
   await evaluate('document.querySelector(".av118-workspace-switch")?.scrollIntoView({block:"center",behavior:"instant"})');
   await screenshot("workspace-"+page+"-"+label);
   if(page==="community"&&label==="phone"){
    await evaluate('document.querySelector(".av118-workspace-iren")?.click()');
    await until(()=>evaluate('!!document.querySelector(".ir87-panel")'));
    const iren=await evaluate('(()=>({one:document.querySelectorAll(".ir87-scout").length===1,help:!!document.querySelector(".ir80-topic-grid"),path:location.pathname}))()');
    if(!iren.one||!iren.help||!iren.path.endsWith("/community"))
     throw Error("V118_UNIFIED_IREN_"+JSON.stringify(iren));
    await screenshot("workspace-iren-community-phone");
    await evaluate('document.querySelector(".ir80-help-head .ir80-icon-button")?.click()');
   }
   proof.push({label,page,width,height,data});
  }
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({
  pass:true,source:"compiled React localhost",
  realMemberWrites:0,realProviderCalls:0,proof
 },null,2));
 console.log("V118_PUBLIC_SURFACES_BROWSER=PASS");
}finally{
 try{ws?.close()}catch{}
 browser.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:120})}
 catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error?.code))throw error}
}
