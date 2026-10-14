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
  await until(()=>evaluate('document.readyState==="complete"&&!!document.querySelector(".atm-content--overview")&&document.querySelectorAll(".atm-world-tile").length===10'));
  await delay(480);
  const overview=await evaluate('(()=>{const top=document.querySelector(".atm-header").getBoundingClientRect();const body=document.querySelector(".atm-content").getBoundingClientRect();const tile=document.querySelector(".atm-world-tile").getBoundingClientRect();return {header:Math.round(top.height),top:Math.round(body.top),left:body.left,right:body.right,contentHeight:body.height,tiles:document.querySelectorAll(".atm-world-tile").length,tileWidth:Math.round(tile.width),navs:document.querySelectorAll(".atm-header .atm-primary-nav").length,rails:document.querySelectorAll(".atm-constellation,.atm-node,.atm-workspace,.atm-mobile-dock,.atm-footer").length,overflow:document.documentElement.scrollWidth>innerWidth+1,scroll:getComputedStyle(document.querySelector(".atm-content")).overflowY};})()');
  if(overview.tiles!==10||overview.navs!==1||overview.rails||overview.overflow||overview.left!==0||Math.abs(overview.right-width)>1||Math.abs(overview.top-overview.header)>1||overview.contentHeight<height-overview.header-2||overview.tileWidth<110||overview.scroll!=="auto")throw Error("MORPH_OVERVIEW_LAYOUT_"+width+": "+JSON.stringify(overview));
  const header=await evaluate('(()=>{const a=document.querySelector(".atm-brand").getBoundingClientRect(),b=document.querySelector(".atm-worlds-trigger").getBoundingClientRect(),c=document.querySelector(".atm-actions").getBoundingClientRect();return {brandRight:a.right,worldLeft:b.left,worldRight:b.right,actionsLeft:c.left,actionsRight:c.right,brandVisible:a.width>0,worldVisible:b.width>0,actionsVisible:c.width>0};})()');
  if(!header.brandVisible||!header.worldVisible||!header.actionsVisible||header.brandRight>header.worldLeft+2||header.worldRight>header.actionsLeft+2||header.actionsRight>width+1)throw Error("MORPH_TOP_NAV_COLLISION_"+width+": "+JSON.stringify(header));

  console.log("MORPH_OVERVIEW_"+width+" "+JSON.stringify(overview));
  await shot("morph-one-nav-overview",width);
  await evaluate('document.querySelector(".atm-world-tile--play").click()');
  await until(()=>evaluate('location.pathname.endsWith("/atlas/discover")&&location.search.includes("category=games")&&!!document.querySelector(".atm-content .portal-discover")'));
  await delay(480);
  const section=await evaluate('(()=>{const main=document.querySelector(".atm-content"),r=main.getBoundingClientRect(),body=document.querySelector(".atm-embedded").getBoundingClientRect(),heading=document.querySelector(".portal-page-heading").getBoundingClientRect();return {left:r.left,right:r.right,bodyWidth:Math.round(body.width),headingWidth:Math.round(heading.width),scroll:getComputedStyle(main).overflowY,duplicate:document.querySelectorAll(".site-header,.site-footer,.portal-navigation,.signal-strip,.atm-footer,.atm-workspace,.atm-mobile-dock").length,overflow:document.documentElement.scrollWidth>innerWidth+1};})()');
  if(section.left!==0||Math.abs(section.right-width)>1||section.bodyWidth<width*(width<641?.85:.84)||section.headingWidth<width*(width<641?.82:.78)||section.scroll!=="auto"||section.duplicate||section.overflow)throw Error("MORPH_FULL_WIDTH_PAGE_"+width+": "+JSON.stringify(section));
  console.log("MORPH_PAGE_"+width+" "+JSON.stringify(section));
  await shot("morph-one-nav-play",width);
  await evaluate('document.querySelector(".atm-worlds-trigger").click()');
  await until(()=>evaluate('!!document.querySelector(".atm-worlds-menu")&&document.querySelectorAll(".atm-worlds-menu-grid button").length===10'));
  const menu=await evaluate('(()=>{const r=document.querySelector(".atm-worlds-menu").getBoundingClientRect();return {n:document.querySelectorAll(".atm-worlds-menu-grid button").length,left:r.left,right:r.right};})()');
  if(menu.n!==10||menu.left<0||menu.right>width+1)throw Error("MORPH_WORLD_MENU_"+width+": "+JSON.stringify(menu));
  await shot("morph-one-nav-worlds",width);
  await evaluate('document.querySelector(".atm-worlds-menu-grid button:nth-child(8)").click()');
  await until(()=>evaluate('location.pathname.endsWith("/atlas/signals")&&!!document.querySelector(".atm-future")'));
  await shot("morph-one-nav-signals",width);
  await evaluate('document.querySelector(".atm-search").click()');
  await until(()=>evaluate('!!document.querySelector("dialog.portal-launcher[open]")'));
  const switchboard=await evaluate('({routes:[...document.querySelectorAll("dialog.portal-launcher[open] a[href]")].map(a=>a.pathname),visible:!!document.querySelector("dialog.portal-launcher input")})');
  if(!switchboard.visible||switchboard.routes.some(u=>!u.startsWith("/creator/atlas")))throw Error("MORPH_SEARCH_ROUTING_"+width+": "+JSON.stringify(switchboard));
  await shot("morph-one-nav-search",width);
  await evaluate('document.querySelector(".portal-launcher-close").click()');
  await until(()=>evaluate('!document.querySelector("dialog.portal-launcher[open]")'));
  if(width===1440){
    await evaluate('document.querySelector(".atm-worlds-trigger").click()');
    await until(()=>evaluate('!!document.querySelector(".atm-worlds-menu")'));
    await evaluate('document.querySelector(".atm-worlds-menu-grid button:nth-child(2)").click()');
    await until(()=>evaluate('!!document.querySelector(".atm-content a[href*=\\\"/projects/\\\"]")'));
    await evaluate('document.querySelector(".atm-content a[href*=\\\"/projects/\\\"]").click()');
    await until(()=>evaluate('location.pathname.includes("/atlas/projects/")&&!!document.querySelector(".atm-content .portal-project")'));
    await shot("morph-one-nav-project",width);
  }
  console.log("ATLAS_MORPH_ONE_NAV_"+width+"=PASS");
 }
}finally{client?.close();child.kill("SIGTERM");await delay(200);rmSync(profile,{recursive:true,force:true});}
