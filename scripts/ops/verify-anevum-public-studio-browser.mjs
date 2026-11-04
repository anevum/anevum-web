// Browser acceptance against the exact standalone Worker module on loopback.
// No public route, auth bypass, Cloudflare token, or automatic deployment.
import {spawn, spawnSync} from "node:child_process";
import {mkdtempSync,readFileSync,writeFileSync,existsSync,mkdirSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(path.join(tmpdir(),"anevum-public-cdp-"));
const output=process.env.RUNNER_TEMP || tmpdir();
mkdirSync(output,{recursive:true});
const base="http://127.0.0.1:4178";
const server=spawn(process.execPath,["scripts/ops/anevum-public-studio-test-server.mjs"],{stdio:"ignore"});
let chrome,ws,next=0,port;
const pending=new Map();
function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++next;
  const timer=setTimeout(()=>{pending.delete(id);reject(Error("CDP timeout: "+method));},17000);
  pending.set(id,{resolve,reject,timer});
  ws.send(JSON.stringify({id,method,params}));
 });
}
async function evalJS(expression){
 const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text||"runtime exception");
 return r.result?.value;
}
async function waitFor(fn,label){
 for(let i=0;i<110;i++){
  try{const v=await fn();if(v)return v;}catch{}
  await sleep(110);
 }
 throw Error("Timed out waiting for "+label);
}
async function view(pathname,width,height,name){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<650});
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 await send("Page.navigate",{url:base+pathname});
 const state=await waitFor(async()=>{
   const v=await evalJS("(()=>{const nav=document.querySelector('nav');return {path:location.pathname,width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,bodyScroll:document.body.scrollWidth,title:document.querySelector('h1')?.textContent,links:[...(nav?.querySelectorAll('a')||[])].map(a=>a.getAttribute('href')),main:!!document.querySelector('main#main'),skip:!!document.querySelector('a.skip[href=\"#main\"]'),motion:document.querySelector('.art-ring')?getComputedStyle(document.querySelector('.art-ring')).animationName:null}})()");
   return v?.path===pathname&&v?.title?v:null;
 },name);
 if(!state.main||!state.skip)throw Error("Missing accessibility landmark: "+JSON.stringify(state));
 // Desktop Chromium reserves a scrollbar gutter (~15px); documentElement.clientWidth
 // is the usable content width, not the device metrics width. Mobile remains exact.
 if(state.width>width||state.width<width-20||state.scrollWidth>state.width+1||state.bodyScroll>state.width+1)
   throw Error("Horizontal overflow or unexpected viewport: "+JSON.stringify({requestedWidth:width,...state}));
 if(state.motion!=="none")throw Error("Reduced motion not respected: "+JSON.stringify(state));
 if(state.links.length!==5||!state.links.includes("/original-works/works"))
   throw Error("Invalid navigation: "+JSON.stringify(state));
 const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
 const filepath=path.join(output,"anevum-public-"+name+".png");
 writeFileSync(filepath,Buffer.from(shot.data,"base64"));
 if(readFileSync(filepath).length<12000)throw Error("Suspiciously empty browser screenshot: "+filepath);
 console.log(JSON.stringify({case:name,path:state.path,width:state.width,scrollWidth:state.scrollWidth,heading:state.title,shotBytes:readFileSync(filepath).length}));
}
try {
 await waitFor(async()=>{if(server.exitCode!==null)throw Error("local server exited");return (await fetch(base+"/original-works")).status===200; },"loopback server");
 const lookup=spawnSync("which",["google-chrome"],{encoding:"utf8"});
 const chromeBin=lookup.status===0?lookup.stdout.trim():process.env.CHROME_BIN||"chromium";
 chrome=spawn(chromeBin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--no-first-run","--disable-background-networking","--remote-debugging-address=127.0.0.1","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
 const devtools=await waitFor(async()=>{
  if(chrome.exitCode!==null)throw Error("Chrome exited: "+chrome.exitCode);
  const f=path.join(profile,"DevToolsActivePort");
  if(!existsSync(f))return null;
  const n=Number(readFileSync(f,"utf8").split(/\r?\n/)[0]);
  return Number.isInteger(n)&&n>0?n:null;
 },"Chrome DevTools");
 const target=await (await fetch("http://127.0.0.1:"+devtools+"/json/new?about:blank",{method:"PUT"})).json();
 ws=new WebSocket(target.webSocketDebuggerUrl);
 ws.addEventListener("message",ev=>{
  const data=JSON.parse(String(ev.data));
  if(!data.id||!pending.has(data.id))return;
  const waiter=pending.get(data.id);pending.delete(data.id);clearTimeout(waiter.timer);
  if(data.error)waiter.reject(Error(data.error.message));else waiter.resolve(data.result);
 });
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 await send("Page.enable");await send("Runtime.enable");
 await view("/original-works",390,844,"home-mobile");
 await view("/original-works/works",390,844,"works-mobile");
 await view("/original-works/reply",390,844,"reply-mobile");
 await view("/original-works",1440,900,"home-desktop");
 await view("/original-works/transcosmic",1440,900,"universe-desktop");
 console.log("ANEVUM_PUBLIC_STUDIO_BROWSER_QA_PASS");
} finally {
 for(const wait of pending.values()){clearTimeout(wait.timer);wait.reject(Error("Browser ending"));}pending.clear();
 if(ws)ws.close();
 if(chrome){chrome.kill("SIGTERM");}
 server.kill("SIGTERM");
 await sleep(200);
 rmSync(profile,{recursive:true,force:true});
}
