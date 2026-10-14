// Review actual compiled ANEVUM Atlas on desktop and phone, including working Deck dialogs.
// Offline synthetic catalogue fixtures may be present; screenshots are not live provider acceptance.
// Chromium CDP + Node built-in WebSocket; no browser packages, keys or deployment required.
import {spawn} from "node:child_process";
import {readFileSync,existsSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(action,timeout=17000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){try{const v=await action();if(v)return v;}catch{}await delay(130);}
 throw Error("Atlas review timed out");
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url),pending=new Map();let serial=0;
  socket.addEventListener("open",()=>{
   resolve({
    send(method,params={}){return new Promise((res,rej)=>{const id=++serial;pending.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}));});},
    close(){socket.close();}
   });
  },{once:true});
  socket.addEventListener("message",({data})=>{
   const reply=JSON.parse(String(data));
   if(typeof reply.id!=="number")return;
   const waiting=pending.get(reply.id);
   if(!waiting)return;
   pending.delete(reply.id);
   reply.error?waiting.rej(Error(reply.error.message)):waiting.res(reply.result||{});
  });
  socket.addEventListener("error",()=>reject(Error("Atlas cannot connect to Chromium")),{once:true});
  socket.addEventListener("close",()=>{for(const x of pending.values())x.rej(Error("Chromium closed"));pending.clear();});
 });
}
const args=process.argv.slice(2),opt=name=>{const at=args.indexOf(name);return at>=0?args[at+1]:null};
const chrome=opt("--chrome"),base=opt("--base"),output=opt("--output");
if(!chrome||!output||!base||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error("Chrome, safe local origin and output directory required");
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-atlas-review-"));
const processChrome=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let client=null;
try{
 const port=await until(()=>{
  const p=join(profile,"DevToolsActivePort");if(!existsSync(p))return null;
  const n=readFileSync(p,"utf8").split("\n")[0];return /^\d+$/.test(n)?n:null;
 });
 const websocket=await until(async()=>{
  const r=await fetch("http://127.0.0.1:"+port+"/json/list");
  if(!r.ok)return null;
  return (await r.json()).find(x=>x.type==="page"&&x.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
 });
 client=await connect(websocket);
 await client.send("Page.enable");
 await client.send("Runtime.enable");
 const evaluate=async expression=>{
  const response=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(response.exceptionDetails)throw Error(response.exceptionDetails.text||"Runtime evaluation failed");
  return response.result?.value;
 };
 const screenshot=async(name,width)=>{
  const image=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!image.data)throw Error("Atlas missing screenshot "+name);
  writeFileSync(join(output,name+"-"+width+".png"),Buffer.from(image.data,"base64"));
 };
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<600});
  await client.send("Page.navigate",{url:base+"/creator/atlas"});
  await until(()=>evaluate("document.readyState==='complete' && document.querySelectorAll('button.atlas-world').length===10"));
  await delay(650);
  const inspect=await evaluate("({nodes:document.querySelectorAll('button.atlas-world').length,screen:getComputedStyle(document.querySelector('.atlas-page')).position,overflow:document.documentElement.scrollWidth>innerWidth,auth:!!document.querySelector('iframe'),link:!!document.querySelector('.atlas-exit[href=\"/creator/\"]')})");
  if(inspect.nodes!==10||inspect.screen!=="fixed"||inspect.overflow||inspect.auth)throw Error("Atlas map "+width+" failed "+JSON.stringify(inspect));
  const clipped=await evaluate("(()=>{const e=document.querySelector('.atlas-exit');const r=e?.getBoundingClientRect();return !r || r.right>innerWidth+1 || r.left<0;})()");
  if(clipped)throw Error("Atlas exit control clipped at "+width);
  const hudClipped=await evaluate("(()=>{const e=document.querySelector('.atlas-xp-mini');const r=e?.getBoundingClientRect();return !r||r.left<0||r.right>innerWidth+1;})()");
  if(hudClipped)throw Error("Atlas XP HUD clipped at "+width);
  await screenshot("atlas-map",width);
  await evaluate("document.querySelector('button.atlas-world--play').click()");
  await until(()=>evaluate("!!document.querySelector('dialog.atlas-deck[open]') && document.querySelector('#atlas-deck-title')?.textContent?.includes('PLAY')"));
  await delay(520);
  if(!await evaluate("!!document.querySelector('dialog.atlas-deck[open]')"))throw Error("Atlas deck closed unexpectedly");
  await screenshot("atlas-play-deck",width);
  if(width===1440){
    await evaluate("document.querySelector('#atlas-catalogue-search').value='PLANET';document.querySelector('#atlas-catalogue-search').dispatchEvent(new Event('input',{bubbles:true}));");
    // Direct DOM entry can bypass React's value tracker. The native input setter fires a true change event.
    await evaluate("(()=>{const e=document.querySelector('#atlas-catalogue-search');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(e,'PLANET');e.dispatchEvent(new Event('input',{bubbles:true}));e.closest('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));})()");
    await until(()=>evaluate("document.querySelector('.atlas-deck-feed-header h3')?.textContent==='SEARCH RESULTS' && document.querySelectorAll('.atlas-deck-project').length===1 && document.querySelector('dialog.atlas-deck[open]')!==null"));
    await screenshot("atlas-play-deck-search",width);
  }
  const play=await evaluate("({open:document.querySelector('dialog.atlas-deck').open,primary:document.querySelector('.atlas-deck-action')?.getAttribute('href'),overscroll:document.documentElement.scrollWidth>innerWidth})");
  if(!play.open||!play.primary||play.overscroll)throw Error("Atlas game deck "+width+" failed "+JSON.stringify(play));
  await evaluate("document.querySelector('.atlas-deck-close').click()");
  await until(()=>evaluate("!document.querySelector('dialog.atlas-deck[open]')"));
  if(width===1440){
   await evaluate("document.querySelector('button.atlas-world--collaborate').click()");
   await until(()=>evaluate("!!document.querySelector('dialog.atlas-deck[open]') && document.querySelector('.atlas-deck-roadmap')?.textContent?.includes('No actual live presence')"));
   await delay(520);
   if(!await evaluate("!!document.querySelector('dialog.atlas-deck[open]')"))throw Error("Collaboration deck unexpectedly dismissed");
   await screenshot("atlas-collab-deck",width);
  }
  console.log("ATLAS_COMPILED_INTERACTION_"+width+"=PASS");
 }
}finally{
 client?.close();
 processChrome.kill("SIGTERM");
 await delay(180);
 rmSync(profile,{recursive:true,force:true});
}
