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
  await send("Page.navigate",{url:base+"/creator/"});
  await until(()=>evaluate('!!document.querySelector(".ir80-dock")&&!!document.querySelector(".av79-home")'));
  await check("one-compact-helper-"+width,'(()=>{const buttons=document.querySelectorAll(".ir87-scout");if(buttons.length!==1||document.querySelector(".an-notification-center"))return false;const r=buttons[0].getBoundingClientRect();return r.width>=48&&r.width<=58&&r.height>=48&&r.height<=58;})()');
  await capture("iren-scout-"+width);
  await evaluate('document.querySelector(".ir80-dock").click()');
  await until(()=>evaluate('!!document.querySelector(".ir80-help")'));
  await check("help-accessible-"+width,'document.querySelector(".ir80-help").getAttribute("aria-label")==="IREN companion"');
  await check("help-inside-"+width,'(()=>{const r=document.querySelector(".ir80-help").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;})()');
  await capture("iren-help-"+width);
  await evaluate('document.querySelector("#ir87-updates-tab").click()');
  await until(()=>evaluate('!!document.querySelector("#ir87-updates-body")'));
  await check("signals-guest-boundary-"+width,'document.querySelector("#ir87-updates-body").textContent.includes("Sign in")');
  await capture("iren-signals-"+width);
  await evaluate('document.querySelector("#ir87-help-tab").click()');
  await evaluate('document.querySelector(".ir80-tour-launch").click()');
  await until(()=>evaluate('!!document.querySelector(".ir80-guide-card")&&location.pathname.endsWith("/discover")'));
  await until(()=>evaluate('!!document.querySelector(".ir80-spotlight")'));
  await check("tour-step-"+width,'document.querySelector("#ir80-guide-title")?.textContent.includes("interests you")');
  await check("tour-modal-"+width,'document.querySelector(".ir80-guide-card").getAttribute("aria-modal")==="true"');
  await check("tour-inside-"+width,'(()=>{const r=document.querySelector(".ir80-guide-card").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;})()');
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
  await evaluate('document.querySelector(".ir80-tour-launch").click()');
  await until(()=>evaluate('document.querySelector("#ir80-guide-title")?.textContent.includes("your people")'));
  await evaluate('document.querySelector("[data-iren-next]").click()');
  await until(()=>evaluate('document.querySelector("#ir80-guide-title")?.textContent.includes("whole network")'));
  await evaluate('document.querySelector("[data-iren-next]").click()');
  await until(()=>evaluate('!document.querySelector(".ir80-guide-card")'));
  await check("finished-"+width,'(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith("anevum.iren.guided-continuance.v080."));return k&&JSON.parse(localStorage.getItem(k)).status==="completed";})()');
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
