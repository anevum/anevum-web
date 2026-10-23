/**
 * V123 compiled React signup + existing IREN loopback visual acceptance.
 * Only the read-only synthetic fixture; no accounts, outbound email, D1 writes
 * or privileged data. High-density captures for responsive visual review.
 */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)
 throw Error("V123_JOIN_REQUIRES_LOCAL_CHROME_FIXTURE");
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-join-v123-"));
const child=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--no-first-run","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=23000){
 let last="";
 for(const end=Date.now()+timeout;Date.now()<end;){
  try{const answer=await fn();if(answer)return answer}catch(e){last=String(e)}
  await delay(130);
 }
 throw Error("V123_JOIN_BROWSER_TIMEOUT: "+last.slice(0,160));
}
let ws=null;
const results=[];
try{
 const port=await until(()=>{
  const file=join(profile,"DevToolsActivePort");
  return existsSync(file)?readFileSync(file,"utf8").split("\n")[0]:null;
 });
 const debuggerUrl=await until(async()=>{
  const response=await fetch("http://127.0.0.1:"+port+"/json/list");
  return response.ok?(await response.json()).find(v=>v.type==="page")?.webSocketDebuggerUrl:null;
 });
 ws=new WebSocket(debuggerUrl);
 const tasks=new Map();let sequence=0;
 ws.addEventListener("message",({data})=>{
  const result=JSON.parse(String(data)),pending=tasks.get(result.id);
  if(!pending)return;
  tasks.delete(result.id);
  result.error?pending.reject(Error(result.error.message)):pending.resolve(result.result||{});
 });
 await new Promise((resolve,reject)=>{
  ws.addEventListener("open",resolve,{once:true});
  ws.addEventListener("error",reject,{once:true});
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++sequence;tasks.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result?.value;
 };
 const snapshot=async filename=>{
  const screenshot=await send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!screenshot.data||screenshot.data.length<4500)
   throw Error("V123_JOIN_CAPTURE_EMPTY_"+filename);
  writeFileSync(join(output,filename+".png"),Buffer.from(screenshot.data,"base64"));
 };
 await send("Page.enable");await send("Runtime.enable");
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 for(const [width,height,label] of [[1440,900,"desktop"],[390,844,"phone"],[320,720,"small-phone"]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:2,mobile:width<700});
  await send("Page.navigate",{url:base+"/creator/join"});
  await until(()=>evaluate('!!document.querySelector("#anevum-email")&&!!document.querySelector(".av123-iren-join button")&&!!document.querySelector(".ir80-dock")'));
  const view=await evaluate('(()=>{const story=document.querySelector(".join-story"),form=document.querySelector(".av12-email-entry"),panel=document.querySelector(".join-panel"),head=document.querySelector("#phase1-join-title"),email=document.querySelector("#anevum-email"),help=document.querySelector(".av123-iren-join button"),box=panel?.getBoundingClientRect();return {heading:head?.innerText,hasStory:!!story,hasForm:!!form,hasEmail:!!email,hasHelp:!!help,methods:[...document.querySelectorAll(".join-methods button")].length,ireN:document.querySelectorAll(".ir80-dock").length,registration:document.querySelector(".join-state")?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,panelBounds:box?[box.left,box.right]:null,firstEmail:true,privacy:document.querySelector(".join-security")?.textContent};})()');
  assert.equal(view.hasStory,true,"Join story was not rendered");
  assert.equal(view.hasForm,true,"Email code form absent");
  assert.equal(view.hasEmail,true,"Email field absent");
  assert.equal(view.hasHelp,true,"IREN opt-in missing");
  assert.equal(view.ireN,1,"IREN companion duplicated");
  assert.equal(view.overflow,false,"Horizontal overflow at "+width+": "+JSON.stringify(view));
  assert.ok(view.panelBounds[0]>=-1&&view.panelBounds[1]<=width+1,"Form panel beyond viewport: "+JSON.stringify(view));
  assert.ok(view.registration?.includes("INVITATION BETA"),"Synthetic signup availability label unexpected");
  assert.equal(view.methods,0,"Unverified provider method improperly offered");
  assert.ok(view.privacy?.includes("private"),"First profile privacy not explained");
  await snapshot("join-v123-"+width);
  results.push({width,height,label,view});
  if(width===390){
   await evaluate('document.querySelector(".av123-iren-join button")?.click()');
   await until(()=>evaluate('!!document.querySelector(".ir123-code-boundary")&&!!document.querySelector(".ir80-topic-detail")'));
   const iren=await evaluate('(()=>{const panel=document.querySelector(".ir80-help"),b=panel?.getBoundingClientRect();return {joinTitle:document.querySelector(".ir80-help h2")?.textContent,joinTopic:document.querySelector(".ir80-topic-detail")?.textContent,codeBoundary:document.querySelector(".ir123-code-boundary")?.textContent,one:document.querySelectorAll(".ir80-dock").length===1,bounds:b?[b.left,b.top,b.right,b.bottom]:null,focused:document.activeElement?.getAttribute("aria-label")};})()');
   assert.equal(iren.one,true);
   assert.ok(iren.joinTitle?.includes("first signal"),"No contextual signup orientation: "+JSON.stringify(iren));
   assert.ok(iren.joinTopic?.includes("eight-digit"),"Missing code safety guidance: "+JSON.stringify(iren));
   assert.ok(iren.codeBoundary?.includes("official form"));
   assert.ok(iren.bounds&&iren.bounds[0]>=-1&&iren.bounds[2]<=391,"IREN panel exceeds phone width");
   await snapshot("iren-join-v123-390");
   results.push({label:"iren-join-phone",iren});
  }
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({pass:true,source:"compiled React / read-only localhost",writes:0,results},null,2));
 console.log("V123_SIGNUP_IREN_COMPILED_BROWSER=PASS");
}finally{
 try{ws?.close()}catch{}
 child.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140})}
 catch(e){if(!["ENOTEMPTY","EBUSY"].includes(e?.code))throw e}
}
