// Actual compiled Atlas Morph review, with SYNTHETIC OFFLINE public fixtures.
// It verifies browser input/routes on desktop and phone, without private accounts.
import {spawn} from "node:child_process";
import {readFileSync,existsSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const delay=n=>new Promise(resolve=>setTimeout(resolve,n));
async function until(fn,timeout=18000){
 const end=Date.now()+timeout;
 while(Date.now()<end){try{const r=await fn();if(r)return r;}catch{}await delay(140);}
 throw Error("Morph interaction timed out");
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket(url),pending=new Map();let id=0;
  ws.addEventListener("open",()=>resolve({
   send(method,params={}){return new Promise((res,rej)=>{const key=++id;pending.set(key,{res,rej});ws.send(JSON.stringify({id:key,method,params}));});},
   close(){ws.close();}
  }),{once:true});
  ws.addEventListener("message",({data})=>{
   const x=JSON.parse(String(data));if(typeof x.id!=="number")return;
   const p=pending.get(x.id);if(!p)return;pending.delete(x.id);
   x.error?p.rej(Error(x.error.message)):p.res(x.result||{});
  });
  ws.addEventListener("error",()=>reject(Error("CDP connect error")),{once:true});
  ws.addEventListener("close",()=>{for(const p of pending.values())p.rej(Error("CDP disconnected"));pending.clear();});
 });
}
const args=process.argv.slice(2),opt=n=>{const i=args.indexOf(n);return i<0?null:args[i+1]};
const chrome=opt("--chrome"),base=opt("--base"),output=opt("--output");
if(!chrome||!output||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||""))throw Error("Chrome and localhost fixture required");
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-morph-"));
const child=spawn(chrome,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*","--remote-debugging-port=0",
 "--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
let client=null;
try{
 const port=await until(()=>{const f=join(profile,"DevToolsActivePort");if(!existsSync(f))return null;const x=readFileSync(f,"utf8").split("\n")[0];return /^\d+$/.test(x)?x:null;});
 const target=await until(async()=>{const r=await fetch("http://127.0.0.1:"+port+"/json/list");return r.ok?(await r.json()).find(v=>v.type==="page"&&v.webSocketDebuggerUrl)?.webSocketDebuggerUrl:null;});
 client=await connect(target);
 await client.send("Page.enable");await client.send("Runtime.enable");
 const evaluate=async expression=>{
  const x=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(x.exceptionDetails)throw Error(x.exceptionDetails.text||"Browser evaluation failed");
  return x.result?.value;
 };
 const shot=async(name,width)=>{
  const x=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!x.data)throw Error("Missing Morph screenshot");
  writeFileSync(join(output,name+"-"+width+".png"),Buffer.from(x.data,"base64"));
 };
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<600});
  await client.send("Page.navigate",{url:base+"/creator/atlas"});
  await until(()=>evaluate("document.readyState==='complete'&&document.querySelectorAll('.atm-node').length===10&&!!document.querySelector('.atm-shell--overview')"));
  await delay(360);
  const overview=await evaluate("(()=>{const nodes=[...document.querySelectorAll('.atm-node')];return {nodes:nodes.length,layout:document.querySelector('.atm-shell')?.dataset.layout,outerScroll:document.documentElement.scrollWidth>innerWidth,node3d:nodes.some(n=>getComputedStyle(n).transform.startsWith('matrix3d')),missing:nodes.filter(n=>{const r=n.getBoundingClientRect();return r.right<0||r.left>innerWidth||r.bottom<0||r.top>innerHeight}).length,oldAtlas:!!document.querySelector('a[href=\"/creator/atlas/orbit\"]')}})()");
  if(overview.nodes!==10||overview.layout!=="overview"||overview.outerScroll||overview.node3d||overview.missing||!overview.oldAtlas)throw Error("Morph overview "+width+": "+JSON.stringify(overview));
  await shot("morph-overview",width);
  await evaluate("document.querySelector('.atm-node--play').click()");
  await until(()=>evaluate("!!document.querySelector('.atm-shell--focused .atm-workspace')&&location.pathname.endsWith('/atlas/discover')&&location.search.includes('category=games')"));
  await until(()=>evaluate("!!document.querySelector('.atm-content .portal-discover')"));
  await delay(470);
  const focused=await evaluate("(()=>{const c=document.querySelector('.atm-content'),r=document.querySelector('.atm-workspace').getBoundingClientRect();return {scroll:getComputedStyle(c).overflowY,visible:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,navigation:innerWidth<641?!!document.querySelector('.atm-mobile-dock'):!!document.querySelector('.atm-shell--focused .atm-node--play'),overflow:document.documentElement.scrollWidth>innerWidth}})()");
  if(focused.scroll!=="auto"||!focused.visible||!focused.navigation||focused.overflow)throw Error("Morph workspace "+width+": "+JSON.stringify(focused));
  await shot("morph-play-world",width);
  if(width===1440){
    await until(()=>evaluate("!!document.querySelector('.atm-content a[href*=\"/projects/\"]')"));
    await evaluate("document.querySelector('.atm-content a[href*=\"/projects/\"]').click()");
    await until(()=>evaluate("location.pathname.includes('/atlas/projects/')&&!!document.querySelector('.atm-shell--focused .atm-content .portal-project')"));
    await delay(400);await shot("morph-project-inside",width);
    await evaluate("document.querySelector('.atm-workspace-controls button').click()");
    await until(()=>evaluate("!!document.querySelector('.atm-shell--overview')&&location.pathname.endsWith('/atlas')"));
    await evaluate("document.querySelector('.atm-node--collaborate').click()");
    await until(()=>evaluate("!!document.querySelector('.atm-future')&&location.pathname.endsWith('/atlas/collaborate')"));
    await delay(280);await shot("morph-collaboration",width);
  }
  await evaluate("document.querySelector('.atm-workspace-controls button').click()");
  await until(()=>evaluate("!!document.querySelector('.atm-shell--overview')&&location.pathname.endsWith('/atlas')"));
  console.log("ATLAS_MORPH_COMPILED_"+width+"=PASS");
 }
}finally{client?.close();child.kill("SIGTERM");await delay(200);rmSync(profile,{recursive:true,force:true});}
