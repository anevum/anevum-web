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
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<641});
  await client.send("Page.navigate",{url:base+"/creator/atlas"});
  await until(()=>evaluate('document.readyState==="complete"&&!!document.querySelector(".atm-content--overview .mhc-console")'));
  await until(()=>evaluate('document.querySelectorAll(".mhc-signal-item").length>0'));
  await delay(350);
  const overview=await evaluate('(()=>{const top=document.querySelector(".atm-header").getBoundingClientRect();const page=document.querySelector(".atm-content").getBoundingClientRect();const hero=document.querySelector(".mhc-headliner").getBoundingClientRect();return {header:Math.round(top.height),pageTop:Math.round(page.top),pageLeft:page.left,pageRight:page.right,bodyHeight:page.height,heroWidth:Math.round(hero.width),menuButtons:document.querySelectorAll(".atm-header .atm-menu-button").length,navTabs:document.querySelectorAll(".atm-header .atm-primary-nav,.atm-header .atm-worlds-trigger,.atm-world-tile,.atm-mobile-dock").length,feedItems:document.querySelectorAll(".mhc-signal-item").length,member:!!document.querySelector(".atm-profile-card"),settings:!!document.querySelector(".atm-profile-settings"),overflow:document.documentElement.scrollWidth>innerWidth+1,scroll:getComputedStyle(document.querySelector(".atm-content")).overflowY};})()');
  if(overview.menuButtons!==1||overview.navTabs||overview.feedItems<1||!overview.member||!overview.settings||overview.overflow||overview.pageLeft!==0||Math.abs(overview.pageRight-width)>1||Math.abs(overview.pageTop-overview.header)>1||overview.bodyHeight<height-overview.header-2||overview.heroWidth<width*(width<641?.85:.5)||overview.scroll!=="auto")throw Error("MORPH_FRONT_PAGE_"+width+": "+JSON.stringify(overview));
  console.log("MORPH_CONSOLE_"+width+" "+JSON.stringify(overview));
  await shot("morph-console-overview",width);

  await evaluate('document.querySelector(".atm-menu-button").click()');
  await until(()=>evaluate('!!document.querySelector("dialog.atm-navigation-overlay[open]")&&document.querySelectorAll(".atm-navigation-link").length===10'));
  const overlay=await evaluate('(()=>{const r=document.querySelector("dialog.atm-navigation-overlay").getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,height:r.height,count:document.querySelectorAll(".atm-navigation-link").length,button:document.querySelector(".atm-menu-button")?.getAttribute("aria-expanded")};})()');
  if(overlay.count!==10||overlay.left<0||overlay.right>width+1||Math.abs(overlay.top-overview.header)>2||overlay.button!=="true")throw Error("MORPH_MENU_OVERLAY_"+width+": "+JSON.stringify(overlay));
  await shot("morph-console-menu",width);

  await evaluate('document.querySelector(".atm-navigation-link:nth-child(2)").click()');
  await until(()=>evaluate('location.pathname.endsWith("/atlas/discover")&&location.search.includes("category=games")&&!!document.querySelector(".atm-content .portal-discover")'));
  const play=await evaluate('(()=>{const h=document.querySelector(".portal-page-heading"),image=h?.querySelector(".cw-artwork-image");return {label:h?.innerText||"",image:image?.getAttribute("src")||""};})()');
  if(!play.label.includes("ARCADE.")||!play.image.includes("categories/games.webp"))throw Error("MORPH_PLAY_"+width+": "+JSON.stringify(play));
  const section=await evaluate('(()=>{const main=document.querySelector(".atm-content"),r=main.getBoundingClientRect(),body=document.querySelector(".atm-embedded").getBoundingClientRect(),heading=document.querySelector(".portal-page-heading").getBoundingClientRect();return {left:r.left,right:r.right,bodyWidth:body.width,headingWidth:heading.width,overflow:document.documentElement.scrollWidth>innerWidth+1,duplicate:document.querySelectorAll(".site-header,.site-footer,.portal-navigation,.signal-strip,.atm-footer,.atm-workspace,.atm-mobile-dock").length};})()');
  if(section.left!==0||Math.abs(section.right-width)>1||section.bodyWidth<width*(width<641?.85:.84)||section.headingWidth<width*(width<641?.82:.78)||section.overflow||section.duplicate)throw Error("MORPH_FULL_PAGE_"+width+": "+JSON.stringify(section));
  await shot("morph-console-play",width);

  await evaluate('document.querySelector(".atm-menu-button").click()');
  await until(()=>evaluate('!!document.querySelector(".atm-navigation-overlay[open]")'));
  await evaluate('document.querySelector(".atm-navigation-link:nth-child(8)").click()');
  await until(()=>evaluate('location.pathname.endsWith("/atlas/signals")&&!!document.querySelector(".atm-future")'));
  await shot("morph-console-signals",width);
  await evaluate('document.querySelector(".atm-menu-button").click()');
  await until(()=>evaluate('!!document.querySelector(".atm-navigation-overlay[open]")'));
  await evaluate('document.querySelector(".atm-navigation-search").click()');
  await until(()=>evaluate('!!document.querySelector("dialog.portal-launcher[open]")'));
  const quick=await evaluate('({urls:[...document.querySelectorAll("dialog.portal-launcher[open] a[href]")].map(a=>a.pathname),search:!!document.querySelector("dialog.portal-launcher input")})');
  if(!quick.search||quick.urls.some(url=>!url.startsWith("/creator/atlas")))throw Error("MORPH_QUICK_JUMP_"+width+": "+JSON.stringify(quick));
  await shot("morph-console-search",width);
  await evaluate('document.querySelector(".portal-launcher-close").click()');
  await until(()=>evaluate('!document.querySelector("dialog.portal-launcher[open]")'));

  if(width===1440){
    await evaluate('document.querySelector(".atm-menu-button").click()');
    await until(()=>evaluate('!!document.querySelector(".atm-navigation-overlay[open]")'));
    await evaluate('document.querySelector(".atm-navigation-link:nth-child(2)").click()');
    await until(()=>evaluate('document.querySelector(".atm-content a[href*=\\\"/projects/\\\"]")'));
    await evaluate('document.querySelector(".atm-content a[href*=\\\"/projects/\\\"]").click()');
    await until(()=>evaluate('location.pathname.includes("/atlas/projects/")&&!!document.querySelector(".atm-content .portal-project")'));
    await shot("morph-console-project",width);
  }
  console.log("ANEVUM_CREATIVE_CONSOLE_"+width+"=PASS");
 }
}finally{client?.close();child.kill("SIGTERM");await delay(200);rmSync(profile,{recursive:true,force:true});}
