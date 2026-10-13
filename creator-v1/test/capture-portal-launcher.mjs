// Capture the real open native dialog from the compiled React staging build.
// Uses Chromium DevTools Protocol and Node's built-in WebSocket: no extra
// browser packages, fake app data, credentials or public deployment.
import {spawn} from "node:child_process";
import {readFileSync,existsSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=14000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){
  try{const value=await fn();if(value)return value;}catch{}
  await sleep(140);
 }
 throw new Error("Chromium interaction verification timed out");
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url);
  const pending=new Map();
  let serial=0;
  socket.addEventListener("open",()=>{
   resolve({
    send(method,params={}){
     return new Promise((res,rej)=>{
      const id=++serial;
      pending.set(id,{res,rej});
      socket.send(JSON.stringify({id,method,params}));
     });
    },
    close(){socket.close();}
   });
  },{once:true});
  socket.addEventListener("message",({data})=>{
   const response=JSON.parse(String(data));
   if(typeof response.id!=="number")return;
   const waiting=pending.get(response.id);
   if(!waiting)return;
   pending.delete(response.id);
   if(response.error)waiting.rej(new Error(response.error.message));
   else waiting.res(response.result||{});
  });
  socket.addEventListener("error",()=>reject(new Error("Cannot open Chrome debugger")),{once:true});
  socket.addEventListener("close",()=>{for(const req of pending.values())req.rej(new Error("Chromium closed"));pending.clear();});
 });
}
const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1]};
const chrome=option("--chrome");
const base=option("--base");
const output=option("--output");
if(!chrome||!base||!output||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw new Error("Chrome, loopback fixture origin and output directory required");

mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-dialog-cdp-"));
const processChrome=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,
 "about:blank"
],{stdio:"ignore"});
let client=null;
try{
 const debug=await until(()=>{
  const location=join(profile,"DevToolsActivePort");
  if(!existsSync(location))return null;
  const port=readFileSync(location,"utf8").split("\n")[0];
  return /^\d+$/.test(port)?port:null;
 });
 const targets=await until(async()=>{
  const response=await fetch("http://127.0.0.1:"+debug+"/json/list");
  if(!response.ok)return null;
  const list=await response.json();
  return list.find(item=>item.type==="page"&&item.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
 });
 client=await connect(targets);
 await client.send("Page.enable");
 await client.send("Runtime.enable");
 const evaluate=async expression=>{
  const out=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(out.exceptionDetails)throw new Error(out.exceptionDetails.text||"Browser expression failed");
  return out.result?.value;
 };
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<600});
  await client.send("Page.navigate",{url:base+"/creator/start"});
  await until(()=>evaluate("document.readyState==='complete' && !!document.querySelector('button[aria-label=\\\"Open quick navigation\\\"]')"));
  await evaluate("document.querySelector('button[aria-label=\\\"Open quick navigation\\\"]').click()");
  await until(()=>evaluate("!!document.querySelector('dialog.portal-launcher[open]') && document.activeElement===document.querySelector('dialog.portal-launcher input[type=\\\"search\\\"]')"));
  const path=join(output,"launcher-open-"+width+".png");
  const shot=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!shot.data)throw new Error("Screenshot missing at width "+width);
  writeFileSync(path,Buffer.from(shot.data,"base64"));
  const actual=await evaluate("({modal:document.querySelector('dialog.portal-launcher').open,hasGuide:!!Array.from(document.querySelectorAll('dialog.portal-launcher a')).find(a=>a.textContent.includes('Field Guide')),isOverwide:document.documentElement.scrollWidth>innerWidth})");
  if(!actual.modal||!actual.hasGuide||actual.isOverwide)throw new Error("Launcher contract failed at "+width+": "+JSON.stringify(actual));
  console.log("LAUNCHER_MODAL_"+width+"=PASS");
 }
}finally{
 client?.close();
 processChrome.kill("SIGTERM");
 await sleep(200);
 rmSync(profile,{recursive:true,force:true});
}
