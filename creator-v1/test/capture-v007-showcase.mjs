// ANEVUM V007 browser acceptance: actual compiled React, local synthetic
// fixture ONLY. Never a hosted account test or evidence of real earned awards.
import {spawn} from "node:child_process";
import {readFileSync,existsSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const args=process.argv.slice(2);
const opt=name=>{const n=args.indexOf(name);return n<0?null:args[n+1]};
const chrome=opt("--chrome"),origin=opt("--base"),output=opt("--output");
if(!chrome||!output||!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin||""))
 throw Error("Local synthetic browser fixture and Chrome are required");
mkdirSync(output,{recursive:true});
async function until(callback,timeout=18000){
 const stop=Date.now()+timeout;
 while(Date.now()<stop){try{const value=await callback();if(value)return value;}catch{}await sleep(160)}
 throw Error("V007 interactive showcase capture timed out");
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url),pending=new Map();let next=0;
  socket.addEventListener("open",()=>resolve({
   send(method,params={}){return new Promise((yes,no)=>{
     const id=++next;pending.set(id,{yes,no});
     socket.send(JSON.stringify({id,method,params}));
   });},
   close(){socket.close()}
  }),{once:true});
  socket.addEventListener("message",({data})=>{
   const message=JSON.parse(String(data));
   if(typeof message.id!=="number")return;
   const found=pending.get(message.id);if(!found)return;
   pending.delete(message.id);
   message.error?found.no(Error(message.error.message)):found.yes(message.result||{});
  });
  socket.addEventListener("error",()=>reject(Error("Chromium DevTools not reachable")),{once:true});
  socket.addEventListener("close",()=>{for(const item of pending.values())item.no(Error("Browser disconnected"));pending.clear()});
 });
}
const profile=mkdtempSync(join(tmpdir(),"anevum-v007-"));
const browser=spawn(chrome,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*","--remote-debugging-port=0",
 "--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
let client;
const captures=[];
try{
 const port=await until(()=>{
  const file=join(profile,"DevToolsActivePort");
  if(!existsSync(file))return null;
  const value=readFileSync(file,"utf8").split("\n")[0];
  return /^\d+$/.test(value)?value:null;
 });
 const websocket=await until(async()=>{
  const result=await fetch("http://127.0.0.1:"+port+"/json/list");
  if(!result.ok)return null;
  return (await result.json()).find(item=>item.type==="page"&&item.webSocketDebuggerUrl)?.webSocketDebuggerUrl||null;
 });
 client=await connect(websocket);
 await client.send("Page.enable");
 await client.send("Runtime.enable");
 const evalPage=async expression=>{
  const result=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.text||"Browser script failed");
  return result.result?.value;
 };
 const visit=async(path,condition)=>{
  await client.send("Page.navigate",{url:origin+path});
  await until(()=>evalPage(`location.pathname===${JSON.stringify(path)}&&(${condition})`));
  await sleep(380);
 };
 const photo=async(name,width)=>{
  const result=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!result.data)throw Error("Missing V007 browser screenshot");
  writeFileSync(join(output,name+"-"+width+".png"),Buffer.from(result.data,"base64"));
 };
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<641});
  await visit("/creator/","document.querySelectorAll('.av7-author').length>=4");
  await until(()=>evalPage("document.querySelectorAll('.av7-level-panel').length>=3"));
  const summary=await evalPage(`(()=>{
   const all=[...document.querySelectorAll('.av7-author')];
   const moss=all.find(x=>x.textContent.includes('Moss Workshop'));
   const relay=all.find(x=>x.textContent.includes('Relay Lab'));
   const result={cards:all.length,levels:document.querySelectorAll('.av7-level-panel').length,
     rewards:document.querySelectorAll('.av7-award-panel').length,
     equipped:moss?.querySelector('.av7-item-face [data-artifact-motif="key"]')!==null,
     privateNotExposed:!relay?.querySelector('.av7-level-panel'),
     overflow:document.documentElement.scrollWidth>innerWidth+1,
     synthetic:document.body.textContent.includes('Illustrative')};
   document.querySelector('#community-index')?.scrollIntoView({block:'start',behavior:'instant'});
   return result;
  })()`);
  if(summary.cards<4||summary.levels<3||summary.rewards<2||!summary.equipped||!summary.privateNotExposed||summary.overflow||!summary.synthetic)
   throw Error("V007_FEED_SHOWCASE_"+width+": "+JSON.stringify(summary));
  await until(()=>evalPage("(()=>{const img=document.querySelector('.av6-feed-art .cw-artwork-image');return !!img&&img.complete&&img.naturalWidth>0;})()"));
  await sleep(180);
  await photo("v007-community-dossiers",width);
  await visit("/creator/creators/moss_demo","!!document.querySelector('.portal-channel-content .av7-author')");
  const creator=await evalPage(`({
    equipped:!!document.querySelector('.portal-channel-content .av7-item-face [data-artifact-motif="key"]'),
    level:document.querySelector('.portal-channel-content .av7-level-copy')?.textContent,
    overflow:document.documentElement.scrollWidth>innerWidth+1
   })`);
  if(!creator.equipped||!creator.level?.includes("30")||creator.overflow)
   throw Error("V007_CREATOR_CHANNEL_"+width+": "+JSON.stringify(creator));
  await photo("v007-creator-channel",width);
  await visit("/creator/account","!!document.querySelector('.av7-settings-live-preview')");
  const account=await evalPage(`({
   preview:document.querySelector('.av7-settings-live-preview')?.textContent,
   consent:document.querySelector('.av7-privacy-setting input')?.checked,
   awardOptions:document.querySelectorAll('.av7-picker-option').length,
   overflow:document.documentElement.scrollWidth>innerWidth+1
  })`);
  if(!account.preview?.includes("PRIVATE")||account.consent!==false||account.awardOptions!==2||account.overflow)
   throw Error("V007_MEMBER_CUSTOMIZER_"+width+": "+JSON.stringify(account));
  await documentScroll(evalPage);
  await photo("v007-member-customizer",width);
  // Phase 1: real compiled React, provider CLOSED in offline fixture.
  // A visible join page never authorizes a real signup without canonical D1.
  await visit("/creator/join","!!document.querySelector('.av12-phase1-join')");
  await until(()=>evalPage("document.querySelector('.join-state')?.textContent.includes('REGISTRATION CLOSED')"));
  const join=await evalPage(`({
     heading:document.querySelector('#phase1-join-title')?.textContent,
     readyProviders:document.querySelectorAll('.join-method-ready').length,
     availableButtons:document.querySelectorAll('.join-method-open:not(:disabled)').length,
     overflow:document.documentElement.scrollWidth>innerWidth+1
  })`);
  if(!join.heading?.includes("UNIVERSE")||join.readyProviders!==0||
     join.availableButtons!==0||join.overflow)
   throw Error("PHASE1_INVITE_FAIL_CLOSED_"+width+": "+JSON.stringify(join));
  await photo("phase1-invited-join-closed",width);
  await visit("/creator/@unlisted_member","!!document.querySelector('.av12-public-world')");
  await until(()=>evalPage("document.querySelector('#av12-world-heading')?.textContent.includes('PRIVATE WORLD')"));
  const publicWorld=await evalPage(`({
    private:document.querySelector('#av12-world-heading')?.textContent.includes("PRIVATE WORLD"),
    leaked:!!document.querySelector('.av12-world-bio'),
    overflow:document.documentElement.scrollWidth>innerWidth+1
  })`);
  if(!publicWorld.private||publicWorld.leaked||publicWorld.overflow)
    throw Error("PHASE1_PRIVATE_MEMBER_"+width+": "+JSON.stringify(publicWorld));
  await photo("phase1-unlisted-member",width);
  await visit("/creator/member","!!document.querySelector('.av12-account-await')");
  await until(()=>evalPage("document.querySelector('.av12-account-await h1')?.textContent.includes('MEMBER ACCESS IS CLOSED')"));
  const closed=await evalPage("document.documentElement.scrollWidth<=innerWidth+1");
  if(!closed)throw Error("PHASE1_PRIVATE_ACCOUNT_OVERFLOW_"+width);
  await photo("phase1-protected-account",width);
  captures.push({width,fixture:"SYNTHETIC OFFLINE — NOT REAL EARNED RECORDS",summary,creator,account,
    phase1:{join,publicWorld,closedAccount:true,origin:"OFFLINE SYNTHETIC; canonical signup disabled"}});
  console.log("PHASE1_CANONICAL_BROWSER_"+width+"=PASS");
  console.log("V007_SHOWCASE_BROWSER_"+width+"=PASS");
 }
 writeFileSync(join(output,"v007-showcase-browser.json"),JSON.stringify(captures,null,2));
}finally{
 // Chrome can still mutate its profile after SIGTERM. Wait for the spawned
 // browser to exit before filesystem cleanup so a successful screenshot run
 // cannot fail with ENOTEMPTY on an ephemeral runner directory.
 client?.close();
 if(browser.exitCode===null){
  const stopped=new Promise(resolve=>browser.once("exit",resolve));
  browser.kill("SIGTERM");
  await Promise.race([stopped,sleep(1800)]);
 }
 try{
  rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:160});
 }catch(error){
  // This fixture contains synthetic, disposable browser cache only. Report a
  // non-blocking cleanup warning rather than invalidating passed browser tests.
  console.warn("V007_BROWSER_TEMP_CLEANUP_WARNING",error?.code||String(error));
 }
}
async function documentScroll(evaluate){
  // Global CSS uses smooth scrolling: without behavior:"instant", a narrow
  // phone screenshot captures a midpoint around the legacy achievement list.
  const selector=".av7-settings-live-preview";
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center',behavior:'instant'})`);
  await sleep(240);
  const bounds=await evaluate(`(()=>{
    const box=document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect();
    return box?{top:box.top,bottom:box.bottom,height:innerHeight}:null;
  })()`);
  if(!bounds||bounds.bottom<75||bounds.top>bounds.height-90)
    throw Error("V007_CUSTOMIZER_SCREENSHOT_NOT_VISIBLE: "+JSON.stringify(bounds));
}
