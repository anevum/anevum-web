/**
 * V117 visual acceptance of the real compiled React join page using localhost fixtures.
 * No provider OAuth, real OTP request, account write, live member identity or deployment.
 */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)
 throw Error("V117_LOCAL_PREVIEW_AND_CHROME_REQUIRED");

const wait=ms=>new Promise(done=>setTimeout(done,ms));
async function until(check,ms=17000){
 const end=Date.now()+ms;let last="";
 while(Date.now()<end){
  try{const value=await check();if(value)return value}
  catch(error){last=String(error)}
  await wait(140);
 }
 throw Error("V117_WAIT_FAILED "+last.slice(0,120));
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-entry-v117-"));
const browser=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--no-first-run","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});

let ws=null,serial=0;
const pending=new Map(),evidence=[];
try{
 const port=await until(()=>{const path=join(profile,"DevToolsActivePort");return existsSync(path)?readFileSync(path,"utf8").split("\n")[0]:null});
 const listing=await until(async()=>{const r=await fetch("http://127.0.0.1:"+port+"/json/list");return r.ok?(await r.json()).find(x=>x.type==="page")?.webSocketDebuggerUrl:null});
 ws=new WebSocket(listing);
 ws.addEventListener("message",({data})=>{
  const reply=JSON.parse(String(data)),task=pending.get(reply.id);
  if(!task)return;
  pending.delete(reply.id);
  reply.error?task.reject(Error(reply.error.message)):task.resolve(reply.result||{});
 });
 await new Promise((done,fail)=>{ws.addEventListener("open",done,{once:true});ws.addEventListener("error",fail,{once:true})});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expr=>{
  const response=await send("Runtime.evaluate",{expression:expr,returnByValue:true,awaitPromise:true});
  if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description||response.exceptionDetails.text);
  return response.result?.value;
 };
 const screenshot=async name=>{
  const result=await send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!result.data||result.data.length<3500)throw Error("V117_EMPTY_SCREENSHOT_"+name);
  writeFileSync(join(output,name+".png"),Buffer.from(result.data,"base64"));
 };
 await send("Page.enable");await send("Runtime.enable");
 await send("Page.addScriptToEvaluateOnNewDocument",{source:'localStorage.setItem("anevum.iren.first-contact.v092","seen");'});
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 for(const [width,height,label] of [[1440,900,"desktop"],[390,844,"phone"],[320,720,"small-phone"]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
  await send("Page.navigate",{url:base+"/creator/join"});
  await until(()=>evaluate('!!document.querySelector(".av12-phase1-join .av117-join-progress")&&!!document.querySelector(".av117-join-guide button")'));
  await until(()=>evaluate('!!document.querySelector(".av12-email-entry input[type=email]")'));
  const result=await evaluate(`(()=>{
   const root=document.querySelector(".av12-phase1-join"),panel=root?.querySelector(".join-panel"),
   progress=panel?.querySelector(".av117-join-progress"),otp=panel?.querySelector("#anevum-otp"),
   guide=panel?.querySelector(".av117-join-guide button"),guest=panel?.querySelector(".join-guest-action"),
   panelRect=panel?.getBoundingClientRect(),guideRect=guide?.getBoundingClientRect();
   return {path:location.pathname,stepItems:progress?.querySelectorAll('[role="listitem"]').length,
    current:progress?.querySelector('[aria-current="step"]')?.textContent,
    guide:guide?.textContent,guest:guest?.getAttribute("href"),
    otpRendered:!!otp,availableEmail:!!panel?.querySelector('.av12-email-entry input[type="email"]'),
    guideHeight:guideRect?.height,panelLeft:panelRect?.left,panelRight:panelRect?.right,
    overflow:document.documentElement.scrollWidth>innerWidth+1,bodyWidth:document.documentElement.scrollWidth};
  })()`);
  if(!result.path.endsWith("/join")||result.stepItems!==3||!result.current?.includes("ACCOUNT")||
   !result.guide?.includes("ASK IREN")||!result.guest?.endsWith("/discover")||
   result.otpRendered||!result.availableEmail||result.guideHeight<44||
   result.panelLeft<-1||result.panelRight>width+1||result.overflow)
   throw Error("V117_JOIN_ACCESSIBILITY_"+label+": "+JSON.stringify(result));
  await screenshot("join-arrival-"+label);
  await evaluate('document.querySelector(".join-panel")?.scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot("join-panel-"+label);
  if(label==="phone"){
   await evaluate('document.querySelector(".av117-join-guide button")?.click()');
   await until(()=>evaluate('!!document.querySelector(".ir87-panel")'));
   const iren=await evaluate(`(()=>({
    one:document.querySelectorAll(".ir87-scout").length===1,
    station:document.querySelector(".ir88-station")?.textContent,
    help:!!document.querySelector(".ir80-topic-grid"),
    title:document.querySelector(".ir87-panel h2")?.textContent,
    intro:document.querySelector(".ir87-panel .ir80-subtitle")?.textContent,
    route:location.pathname
   }))()`);
   if(!iren.one||!iren.station?.includes("REGISTRATION")||!iren.help||
    !iren.title?.includes("Joining ANEVUM")||!iren.intro?.includes("eight-digit code")||
    !iren.route.endsWith("/join"))
    throw Error("V117_IREN_JOIN_"+JSON.stringify(iren));
   await screenshot("join-iren-phone");
   await evaluate('document.querySelector(".ir80-help-head .ir80-icon-button")?.click()');
  }
  evidence.push({label,width,height,result});
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({pass:true,source:"compiled React local fixture",memberWrites:0,providerCalls:0,evidence},null,2));
 console.log("V117_CONTINUANCE_JOIN_REACT_BROWSER=PASS");
}finally{
 try{ws?.close()}catch{}
 browser.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140})}
 catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error?.code))throw error}
}
