// Actual compiled Vite staging React UI with OFFLINE SYNTHETIC catalogue fixtures.
// Proves feature -> project focus -> isolated first-party puzzle -> return.
// This never endorses arbitrary creator JavaScript or external demo embedding.
import {spawn} from "node:child_process";
import {readFileSync,existsSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const delay=n=>new Promise(resolve=>setTimeout(resolve,n));
async function until(fn,timeout=20000){
 const end=Date.now()+timeout;
 while(Date.now()<end){try{const r=await fn();if(r)return r;}catch{}await delay(120);}
 throw Error("Featured play interaction browser check timed out");
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket(url),pending=new Map();let serial=0;
  ws.addEventListener("open",()=>resolve({
   send(method,params={}){return new Promise((res,rej)=>{const id=++serial;pending.set(id,{res,rej});ws.send(JSON.stringify({id,method,params}));});},
   close(){ws.close();}
  }),{once:true});
  ws.addEventListener("message",({data})=>{
   const message=JSON.parse(String(data));if(typeof message.id!=="number")return;
   const p=pending.get(message.id);if(!p)return;pending.delete(message.id);
   message.error?p.rej(Error(message.error.message)):p.res(message.result||{});
  });
  ws.addEventListener("error",()=>reject(Error("Could not connect to Chromium")),{once:true});
  ws.addEventListener("close",()=>{for(const p of pending.values())p.rej(Error("Browser terminated"));pending.clear();});
 });
}
const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null};
const chrome=option("--chrome"),base=option("--base"),output=option("--output");
if(!chrome||!output||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||""))throw Error("Chromium, localhost fixture and evidence path required");
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-featured-play-"));
const child=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let client=null;
try{
 const port=await until(()=>{
  const p=join(profile,"DevToolsActivePort");
  if(!existsSync(p))return null;
  const n=readFileSync(p,"utf8").split("\n")[0];return /^\d+$/.test(n)?n:null;
 });
 const ws=await until(async()=>{
  const r=await fetch("http://127.0.0.1:"+port+"/json/list");
  return r.ok?(await r.json()).find(x=>x.type==="page"&&x.webSocketDebuggerUrl)?.webSocketDebuggerUrl:null;
 });
 client=await connect(ws);
 await client.send("Page.enable");await client.send("Runtime.enable");
 async function evaluate(expression){
  const r=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.text||"Browser JS exception");
  return r.result?.value;
 }
 async function shot(name,width){
  const r=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!r.data)throw Error("Missing screenshot "+name);
  writeFileSync(join(output,name+"-"+width+".png"),Buffer.from(r.data,"base64"));
 }
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<641});
  await client.send("Page.navigate",{url:base+"/creator/atlas"});
  await until(()=>evaluate('!!document.querySelector(".mhc-headliner h1")&&document.querySelector(".mhc-primary-action")?.getAttribute("href")?.includes("/atlas/experience/")'));
  const home=await evaluate('({href:document.querySelector(".mhc-primary-action")?.getAttribute("href"),title:document.querySelector(".mhc-headliner h1")?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1})');
  if(!home.href?.startsWith("/creator/atlas/experience/")||home.overflow)throw Error("FEATURED_HOME_"+width+": "+JSON.stringify(home));
  await evaluate('document.querySelector(".atm-content").scrollTop=120');
  await shot("feature-entry",width);
  await evaluate('document.querySelector(".mhc-primary-action").click()');
  await until(()=>evaluate('location.pathname.includes("/atlas/experience/")&&!!document.querySelector(".fx-focus-intro h1")'));
  const focus=await evaluate('({name:document.querySelector(".fx-focus-intro h1")?.textContent,external:document.querySelector(".fx-focus-primary")?.href,tab:document.querySelector(".fx-focus-primary")?.target,iframes:document.querySelectorAll(".fx-focus iframe").length,lab:!!document.querySelector(".fx-focus-lab a[href$=\\"/atlas/lab/orbit-align\\"]"),overflow:document.documentElement.scrollWidth>innerWidth+1})');
  if(focus.name?.trim()!==home.title?.trim()+"."||focus.iframes||!focus.external?.startsWith("https://example.com/")||focus.tab!=="_blank"||!focus.lab||focus.overflow)
    throw Error("FEATURED_FOCUS_"+width+": "+JSON.stringify(focus));
  await shot("feature-focus",width);
  await evaluate('document.querySelector(".fx-focus-lab a").click()');
  await until(()=>evaluate('location.pathname.endsWith("/atlas/lab/orbit-align")&&!!document.querySelector(".fx-game-overlay-start")'));
  const gameIntro=await evaluate('({state:document.querySelector(".fx-game")?.className,header:!!document.querySelector(".atm-header"),game:!!document.querySelector(".fx-game-orbit"),error:document.documentElement.scrollWidth>innerWidth+1})');
  if(!gameIntro.state.includes("ready")||!gameIntro.header||!gameIntro.game||gameIntro.error)throw Error("FEATURED_GAME_READY_"+width+": "+JSON.stringify(gameIntro));
  await shot("play-ready",width);
  await evaluate('document.querySelector(".fx-game-overlay-start").click()');
  await until(()=>evaluate('document.querySelector(".fx-game--playing")!==null'));
  await evaluate('document.querySelector(".fx-game-controls button:nth-child(1)").click()');
  await evaluate('document.querySelector(".fx-game-controls button:nth-child(1)").click()');
  await evaluate('document.querySelector(".fx-game-foot-controls button").click()');
  await until(()=>evaluate('!!document.querySelector(".fx-game--paused")&&!!document.querySelector(".fx-game-overlay-start")'));
  const paused=await evaluate('({moves:document.querySelectorAll(".fx-game-hud strong")[1]?.textContent,paused:!!document.querySelector(".fx-game--paused")})');
  if(paused.moves!=="2"||!paused.paused)throw Error("FEATURED_PAUSE_"+width+": "+JSON.stringify(paused));
  await shot("play-paused",width);
  await evaluate('document.querySelector(".fx-game-overlay-start").click()');
  await until(()=>evaluate('!!document.querySelector(".fx-game--playing")'));
  for(let index=2;index<=3;index++){
    for(let step=0;step<(index===2?5:3);step++){
      await evaluate('document.querySelector(".fx-game-controls button:nth-child('+index+')").click()');
    }
  }
  await until(()=>evaluate('!!document.querySelector(".fx-game--complete")&&!!document.querySelector(".fx-game-overlay-start")'));
  const completed=await evaluate('({moves:document.querySelectorAll(".fx-game-hud strong")[1]?.textContent,signals:document.querySelectorAll(".fx-game-ring-ready").length,success:document.querySelector(".fx-game-overlay-card")?.textContent?.includes("ORBIT")})');
  if(completed.moves!=="10"||completed.signals!==3||!completed.success)throw Error("FEATURED_GAME_WIN_"+width+": "+JSON.stringify(completed));
  await shot("play-completed",width);
  await evaluate('document.querySelector(".fx-game-overlay-start").click()');
  await until(()=>evaluate('!!document.querySelector(".fx-game--ready")'));
  const reset=await evaluate('({moves:document.querySelectorAll(".fx-game-hud strong")[1]?.textContent,ready:!!document.querySelector(".fx-game--ready")})');
  if(reset.moves!=="0"||!reset.ready)throw Error("FEATURED_RESET_"+width+": "+JSON.stringify(reset));
  await evaluate('document.querySelector(".fx-game-overlay-exit").click()');
  await until(()=>evaluate('location.pathname.includes("/atlas/experience/")&&!!document.querySelector(".fx-focus-intro h1")'));
  const back=await evaluate('({target:location.pathname,project:!!document.querySelector(".fx-focus-intro")})');
  if(!back.project)throw Error("FEATURED_RETURN_TO_PROJECT_"+width+": "+JSON.stringify(back));
  await shot("feature-return",width);
  await evaluate('document.querySelector(".fx-focus-return").click()');
  await until(()=>evaluate('location.pathname.endsWith("/atlas")&&!!document.querySelector(".mhc-headliner")'));
  await delay(250);
  const restored=await evaluate('({scroll:document.querySelector(".atm-content").scrollTop,hero:document.querySelector(".mhc-headliner h1")?.textContent})');
  if(restored.scroll<80||restored.hero!==home.title)throw Error("FEATURED_RETURN_TO_HOME_"+width+": "+JSON.stringify(restored));
  console.log("FEATURED_ENTER_PLAY_PAUSE_WIN_RESET_RETURN_"+width+"=PASS");
 }
}finally{
 client?.close();child.kill("SIGTERM");await delay(160);rmSync(profile,{recursive:true,force:true});
}
