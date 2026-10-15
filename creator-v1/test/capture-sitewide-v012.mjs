// Creator V1 V012: browser-rendered visual acceptance using local synthetic fixtures.
// No real creator records, D1, authentication or production access.
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=18000){
 const stop=Date.now()+timeout;
 while(Date.now()<stop){try{let value=await fn();if(value)return value;}catch{}await delay(140);}
 throw Error("SITEWIDE_V012_BROWSER_TIMEOUT");
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url),calls=new Map();let seq=0;
  socket.addEventListener("open",()=>resolve({
   send(method,params={}){return new Promise((res,rej)=>{let id=++seq;calls.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}));});},
   close(){socket.close();}
  }),{once:true});
  socket.addEventListener("message",({data})=>{
   const value=JSON.parse(String(data));if(typeof value.id!=="number")return;
   const call=calls.get(value.id);if(!call)return;calls.delete(value.id);
   value.error?call.rej(Error(value.error.message)):call.res(value.result||{});
  });
  socket.addEventListener("error",()=>reject(Error("SITEWIDE_V012_CDP_CONNECT")),{once:true});
  socket.addEventListener("close",()=>{for(const call of calls.values())call.rej(Error("SITEWIDE_V012_CDP_CLOSED"));calls.clear();});
 });
}
const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const chrome=option("--chrome"),base=option("--base"),output=option("--output");
if(!chrome||!output||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||""))
 throw Error("SITEWIDE_V012_ONLY_LOCAL_FIXTURES");
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-v012-sitewide-"));
const child=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*","--remote-debugging-port=0",
 "--no-first-run","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let client=null;const results=[];
try{
 const port=await until(()=>{
  const file=join(profile,"DevToolsActivePort");
  if(!existsSync(file))return null;
  const value=readFileSync(file,"utf8").split("\n")[0];return /^\d+$/.test(value)?value:null;
 });
 const ws=await until(async()=>{
  const response=await fetch("http://127.0.0.1:"+port+"/json/list");
  if(!response.ok)return null;
  return (await response.json()).find(item=>item.type==="page"&&item.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
 });
 client=await connect(ws);
 await client.send("Page.enable");await client.send("Runtime.enable");
 const evaluate=async expression=>{
  const result=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.text||"SITEWIDE_V012_EVALUATE_FAILED");
  return result.result?.value;
 };
 const screenshot=async label=>{
  const reply=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!reply.data)throw Error("SITEWIDE_V012_NO_IMAGE_"+label);
  const bytes=Buffer.from(reply.data,"base64");if(bytes.length<4000)throw Error("SITEWIDE_V012_SHORT_IMAGE_"+label);
  writeFileSync(join(output,label+".png"),bytes);
 };
 const pages=[
  ["home","/",".av8-live-signal"],["discover","/discover",".portal-discover"],
  ["project","/projects/00000000000000000000000000000001",".portal-project"],
  ["creators","/creators",".portal-creators"],["creator-channel","/creators/nova_demo",".portal-creator-channel"],
  ["community","/community",".ch7-hub"],["boards","/boards",".cnb-hub"],
  ["levels","/levels",".levels-page"],["start","/start",".start-page"],
  ["guide","/guide",".field-guide-page"],["status","/status",".status-list"],
  ["guest-library","/library",".member-gate"],
  ["member-account","/account",".member-shell"],
  ["member-profile-editor","/account/edit",".member-profile-page"],
  ["member-studio","/create",".member-shell"],["member-draft","/create/new",".member-shell"]
 ];
 const context=await fetch(base+"/__context-fixture?enabled=1");
 if(!context.ok)throw Error("SITEWIDE_V012_FIXTURE_UNAVAILABLE");
 for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,720]]){
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<641});
  await client.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  const selected=width===1440||width===390?pages:pages.filter(([id])=>
   ["home","discover","project","community","boards","levels","guest-library"].includes(id));
  for(const [name,path,selector] of selected){
   if(name==="guest-library")await client.send("Network.clearBrowserCookies");
   const target=base+"/creator"+path;
   const result=await client.send("Page.navigate",{url:target});
   if(result.errorText)throw Error("SITEWIDE_V012_NAVIGATION_"+name+"_"+width+":"+result.errorText);
   try{
    await until(()=>evaluate("document.readyState==='complete'&&location.pathname==="+JSON.stringify("/creator"+path)+"&&!!document.querySelector("+JSON.stringify(selector)+")"));
   }catch(error){throw Error("SITEWIDE_V012_PAGE_MISSING_"+name+"_"+width+":"+String(error));}
   await delay(240);
   const state=await evaluate('(()=>({path:location.pathname,header:document.querySelectorAll(".site-header.av9-header").length,main:document.querySelectorAll("#main").length,cinematic:!!document.querySelector(".site-shell--cinematic.av9-shell"),overflow:document.documentElement.scrollWidth>innerWidth+1,width:innerWidth,atlas:!!document.querySelector(".atm-header,.atlas-universe-viewport"),fixture:getComputedStyle(document.body,"::after").content.includes("SYNTHETIC OFFLINE REVIEW")}))()');
   if(!state.cinematic||state.header!==1||state.main!==1||state.overflow||state.atlas||!state.fixture)
    throw Error("SITEWIDE_V012_INCONSISTENT_"+name+"_"+width+":"+JSON.stringify(state));
   await screenshot(name+"-"+width);
   results.push({page:name,width,...state});
   console.log("SITEWIDE_V012_"+name.toUpperCase()+"_"+width+"=PASS");
  }
  await client.send("Page.navigate",{url:base+"/creator/atlas/boards"});
  await until(()=>evaluate('location.pathname==="/creator/boards"&&!!document.querySelector(".cnb-hub")'));
  const archived=await evaluate('({headers:document.querySelectorAll(".site-header.av9-header").length,legacy:document.querySelectorAll(".atm-header").length})');
  if(archived.headers!==1||archived.legacy)throw Error("SITEWIDE_V012_DUPLICATE_SHELL_"+width+":"+JSON.stringify(archived));
  if(width===1440||width===390){
   await client.send("Page.navigate",{url:base+"/creator/community/posts/"+'a'.repeat(32)});
   await until(()=>evaluate('document.readyState==="complete"&&!!document.querySelector("article.discussion-page h1")'));
   const post=await evaluate('({title:document.querySelector("article.discussion-page h1")?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1})');
   if(post.overflow||!post.title?.includes("Keyboard feedback"))throw Error("SITEWIDE_V012_DISCUSSION_"+width+":"+JSON.stringify(post));
   await screenshot("discussion-"+width);
   results.push({page:"discussion",width,...post});
  }
 }
 writeFileSync(join(output,"sitewide-v012-capture.json"),JSON.stringify({syntheticFixture:true,pages:results},null,2));
 writeFileSync(join(output,"capture-status.txt"),"SITEWIDE_V012_BROWSER_CAPTURE=PASS\nAll records are synthetic offline visual fixtures; no live member acceptance.\n");
 console.log("SITEWIDE_V012_BROWSER_CAPTURE=PASS; PAGES="+results.length);
}finally{
 client?.close();child.kill("SIGTERM");await delay(180);
 rmSync(profile,{recursive:true,force:true});
}
