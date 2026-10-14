// Actual compiled community-first Morph review, with SYNTHETIC OFFLINE public fixtures.
// It verifies browser input/routes on desktop and phone, without private accounts.
import {spawn} from "node:child_process";
import {readFileSync,existsSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const delay=n=>new Promise(resolve=>setTimeout(resolve,n));
async function until(fn,timeout=18000){
 const end=Date.now()+timeout;
 while(Date.now()<end){try{const r=await fn();if(r)return r;}catch{}await delay(140);}
 throw Error("Community-first interaction timed out");
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
  await until(()=>evaluate('document.readyState==="complete"&&!!document.querySelector(".nfc-home")&&document.querySelectorAll(".mhc-signal-item").length===8'));
  await delay(370);
  const summary=await evaluate('(()=>{const header=document.querySelector(".atm-header").getBoundingClientRect(),main=document.querySelector(".atm-content").getBoundingClientRect(),layout=document.querySelector(".nfc-layout").getBoundingClientRect();return {width:innerWidth,header:header.height,top:main.top,scroll:getComputedStyle(document.querySelector(".atm-content")).overflowY,feed:document.querySelectorAll(".mhc-signal-item").length,makers:document.querySelectorAll(".nfc-maker").length,topics:document.querySelectorAll(".nfc-topic").length,hotPosts:document.querySelectorAll(".nfc-post").length,postEmpty:!!document.querySelector(".nfc-discussion-empty"),spotlight:!!document.querySelector(".nfc-spotlight"),noOrbital:!document.body.textContent.includes("ORBIT ALIGN"),overflow:document.documentElement.scrollWidth>innerWidth+1,regionWidth:layout.width,menu:!!document.querySelector(".atm-menu-button"),account:!!document.querySelector(".atm-profile-card")};})()');
  if(summary.feed!==8||summary.makers!==4||summary.topics!==6||summary.hotPosts!==0||!summary.postEmpty||!summary.spotlight||!summary.noOrbital||summary.overflow||!summary.menu||!summary.account||Math.abs(summary.top-summary.header)>2||summary.regionWidth<width*.86||summary.scroll!=="auto"){
    throw Error("COMMUNITY_FEED_LAYOUT_"+width+": "+JSON.stringify(summary));
  }
  console.log("COMMUNITY_FEED_"+width+"="+JSON.stringify(summary));
  await shot("community-feed-home",width);
  await evaluate('document.querySelector(".mhc-feed-filters button:nth-child(2)").click()');
  await until(()=>evaluate('document.querySelectorAll(".mhc-signal-item").length===3'));
  const filtered=await evaluate('({count:document.querySelectorAll(".mhc-signal-item").length,types:[...document.querySelectorAll(".mhc-signal-item-content small:first-child")].map(x=>x.textContent)})');
  if(filtered.count!==3||filtered.types.some(x=>!x.startsWith("GAMES")))throw Error("COMMUNITY_FEED_FILTER_"+width+": "+JSON.stringify(filtered));
  await shot("community-feed-games",width);
  await evaluate('document.querySelector(".mhc-feed-filters button:first-child").click()');
  await until(()=>evaluate('document.querySelectorAll(".mhc-signal-item").length===8'));
  await evaluate('document.querySelector(".nfc-discussion-switch button:nth-child(2)").click()');
  await until(()=>evaluate('document.querySelector(".nfc-discussion-switch button:nth-child(2)").getAttribute("aria-pressed")==="true"'));
  if(await evaluate('document.querySelectorAll(".nfc-post").length')!==0)throw Error("Fake posts appeared after sort");
  await shot("community-feed-discussions",width);
  await evaluate('document.querySelector(".atm-menu-button").click()');
  await until(()=>evaluate('!!document.querySelector(".atm-navigation-overlay[open]")&&document.querySelectorAll(".atm-navigation-link").length===10'));
  await shot("community-feed-menu",width);
  await evaluate('document.querySelector(".atm-navigation-close").click()');
  await until(()=>evaluate('!document.querySelector(".atm-navigation-overlay[open]")'));
  await evaluate('document.querySelector(".nfc-spotlight h3 a").click()');
  await until(()=>evaluate('location.pathname.includes("/atlas/experience/")&&!!document.querySelector(".fx-focus-intro h1")'));
  const focused=await evaluate('({title:document.querySelector(".fx-focus-intro h1")?.textContent,host:document.querySelector(".fx-focus-primary")?.target,iframe:document.querySelectorAll("iframe").length,notGame:!document.body.textContent.includes("TRY ORBIT ALIGN"),overflow:document.documentElement.scrollWidth>innerWidth+1})');
  if(!focused.title?.includes("ARCADE AFTER DARK")||focused.host!=="_blank"||focused.iframe||!focused.notGame||focused.overflow)throw Error("COMMUNITY_FOCUS_"+width+": "+JSON.stringify(focused));
  await shot("community-feed-focus",width);
  await evaluate('document.querySelector(".fx-focus-return").click()');
  await until(()=>evaluate('location.pathname.endsWith("/atlas")&&!!document.querySelector(".nfc-home")'));
  await evaluate('document.querySelector(".nfc-maker:first-child").click()');
  await until(()=>evaluate('location.pathname.includes("/atlas/creators/")&&!!document.querySelector(".portal-creator-channel")'));
  await shot("community-feed-creator",width);
  // The removed game route is asserted absent from App by a separate static route
  // contract; do not reload the whole Chromium page to test a retired URL here.
  if(await evaluate('!!document.querySelector(".fx-game")'))throw Error("Retired game UI rendered during creator navigation");
  console.log("COMMUNITY_FEED_NAVIGATION_"+width+"=PASS");
 }
}finally{client?.close();child.kill("SIGTERM");await delay(200);rmSync(profile,{recursive:true,force:true});}
