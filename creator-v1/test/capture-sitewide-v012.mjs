// Creator V1 V012: browser-rendered visual acceptance using local synthetic fixtures.
// No real creator records, D1, authentication or production access.
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=18000){
 const stop=Date.now()+timeout;
 while(Date.now()<stop){try{let value=await fn();if(value)return value;}catch{}await delay(140);}
 throw Error("SITEWIDE_V012_BROWSER_TIMEOUT");
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url),calls=new Map();let seq=0;
  socket.addEventListener("open",()=>resolve({
   send(method,params={}){return new Promise((res,rej)=>{let id=++seq;calls.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}));});},
   close(){socket.close();}
  }),{once:true});
  socket.addEventListener("message",({data})=>{
   const value=JSON.parse(String(data));if(typeof value.id!=="number")return;
   const call=calls.get(value.id);if(!call)return;calls.delete(value.id);
   value.error?call.rej(Error(value.error.message)):call.res(value.result||{});
  });
  socket.addEventListener("error",()=>reject(Error("SITEWIDE_V012_CDP_CONNECT")),{once:true});
  socket.addEventListener("close",()=>{for(const call of calls.values())call.rej(Error("SITEWIDE_V012_CDP_CLOSED"));calls.clear();});
 });
}
const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const chrome=option("--chrome"),base=option("--base"),output=option("--output");
if(!chrome||!output||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||""))
 throw Error("SITEWIDE_V012_ONLY_LOCAL_FIXTURES");
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),"anevum-v012-sitewide-"));
const child=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--remote-allow-origins=*","--remote-debugging-port=0",
 "--no-first-run","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let client=null;const results=[];
try{
 const port=await until(()=>{
  const file=join(profile,"DevToolsActivePort");
  if(!existsSync(file))return null;
  const value=readFileSync(file,"utf8").split("\n")[0];return /^\d+$/.test(value)?value:null;
 });
 const ws=await until(async()=>{
  const response=await fetch("http://127.0.0.1:"+port+"/json/list");
  if(!response.ok)return null;
  return (await response.json()).find(item=>item.type==="page"&&item.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
 });
 client=await connect(ws);
 await client.send("Page.enable");await client.send("Runtime.enable");
 const evaluate=async expression=>{
  const result=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||"SITEWIDE_V012_EVALUATE_FAILED");
  return result.result?.value;
 };
 const screenshot=async label=>{
  const reply=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
  if(!reply.data)throw Error("SITEWIDE_V012_NO_IMAGE_"+label);
  const bytes=Buffer.from(reply.data,"base64");if(bytes.length<4000)throw Error("SITEWIDE_V012_SHORT_IMAGE_"+label);
  writeFileSync(join(output,label+".png"),bytes);
 };
 const pages=[
  ["home","/",".av8-live-signal"],["discover","/discover",".portal-discover"],
  ["project","/projects/00000000000000000000000000000001",".portal-project"],
  ["creators","/creators",".portal-creators"],["creator-channel","/creators/nova_demo",".portal-creator-channel"],
  ["community","/community",".ch7-hub"],["boards","/boards",".cnb-hub"],
  ["levels","/levels",".levels-page"],["start","/start",".start-page"],
  ["guide","/guide",".field-guide-page"],["status","/status",".status-list"],
  ["guest-library","/library",".member-gate"],
  ["member-account","/account",".member-shell"],
  ["member-profile-editor","/account/edit",".member-profile-page"],
  ["member-studio","/create",".member-shell"],["member-draft","/create/new",".member-shell"]
 ];
 const context=await fetch(base+"/__context-fixture?enabled=1");
 if(!context.ok)throw Error("SITEWIDE_V012_FIXTURE_UNAVAILABLE");
 for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,720]]){
  await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<641});
  await client.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  const selected=width===1440||width===390?pages:pages.filter(([id])=>
   ["home","discover","project","community","boards","levels","guest-library"].includes(id));
  for(const [name,path,selector] of selected){
   if(name==="guest-library")await client.send("Network.clearBrowserCookies");
   const target=base+"/creator"+path;
   const result=await client.send("Page.navigate",{url:target});
   if(result.errorText)throw Error("SITEWIDE_V012_NAVIGATION_"+name+"_"+width+":"+result.errorText);
   try{
    await until(()=>evaluate("document.readyState==='complete'&&location.pathname==="+JSON.stringify("/creator"+path)+"&&!!document.querySelector("+JSON.stringify(selector)+")"));
   }catch(error){throw Error("SITEWIDE_V012_PAGE_MISSING_"+name+"_"+width+":"+String(error));}
   await delay(240);
   const state=await evaluate('(()=>({path:location.pathname,header:document.querySelectorAll(".site-header.av9-header").length,main:document.querySelectorAll("#main").length,cinematic:!!document.querySelector(".site-shell--cinematic.av9-shell"),overflow:document.documentElement.scrollWidth>innerWidth+1,width:innerWidth,atlas:!!document.querySelector(".atm-header,.atlas-universe-viewport"),fixture:getComputedStyle(document.body,"::after").content.includes("SYNTHETIC OFFLINE REVIEW")}))()');
   const presentation=await evaluate(String.raw`(()=>{
     const root=document.querySelector(".site-shell--cinematic.av9-shell");
     if(!root)return {missingRoot:true};
      const styles=getComputedStyle(root);
     const active=document.querySelector(".av9-menu-trigger");
     const forbidden=[...document.querySelectorAll(".site-header a,.av9-navigation a,.site-main a,.site-footer a")]
       .map(a=>a.getAttribute("href")).filter(Boolean)
       .filter(href=>{
         let url;try{url=new URL(href,location.href);}catch{return false;}
         if(["lab.anevum.com","portfolio.anevum.com"].includes(url.hostname))return true;
         if(url.origin!==location.origin)return false;
         const pathname=url.pathname.replace(/^\/creator(?=\/|$)/,"");
         return /^\/(?:atlas|experience|workspace|portfolio)(?:\/|$)/.test(pathname);
       }).slice(0,8);
     return {
       tokens:["--av9-space","--av9-paper","--av9-display","--av9-glass","--av10-editorial"]
         .every(token=>Boolean(styles.getPropertyValue(token).trim())),
       roundedControl:active?parseFloat(getComputedStyle(active).borderTopLeftRadius)>=8:false,
       forbidden,
       legacyBrand:/\bTHE COMMONS\b/i.test(document.getElementById("main")?.innerText||"")
     };
   })()`);
   if(presentation.missingRoot||!presentation.tokens||!presentation.roundedControl||presentation.forbidden.length||presentation.legacyBrand)
     throw Error("SITEWIDE_V012_VISUAL_OR_ROUTE_DRIFT_"+name+"_"+width+":"+JSON.stringify(presentation));
   if(!state.cinematic||state.header!==1||state.main!==1||state.overflow||state.atlas||!state.fixture)
    throw Error("SITEWIDE_V012_INCONSISTENT_"+name+"_"+width+":"+JSON.stringify(state));
   if(name==="levels"){
    const metrics=await evaluate('(()=>{const hero=document.querySelector(".levels-masthead"),paragraph=hero?.querySelector("p"),emblem=hero?.querySelector(".levels-emblem");return {heroWidth:hero?.getBoundingClientRect().width,textWidth:paragraph?.getBoundingClientRect().width,emblemPosition:emblem?getComputedStyle(emblem).position:null}})()');
    if(!metrics.textWidth||(width<=700&&metrics.textWidth<Math.min(240,width*.67))||
      (width<=700&&metrics.emblemPosition!=="absolute"))
      throw Error("SITEWIDE_V012_LEVELS_TEXT_SQUEEZED_"+width+":"+JSON.stringify(metrics));
   }
   await screenshot(name+"-"+width);
   if(name==="home"){
    await evaluate('document.getElementById("world-gateways").scrollIntoView({block:"start"})');
    if(width<541){
     // Native lazy loading deliberately defers offscreen horizontal cards.
     // Exercise each card before requiring all four decoded originals.
     for(let index=0;index<4;index++){
      await evaluate('document.querySelectorAll(".av9-world-gateway")['+index+'].scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"})');
      await until(()=>evaluate('(()=>{const image=document.querySelectorAll(".av9-world-gateway-art>img")['+index+'];return image?.complete&&image.naturalWidth>0;})()'));
     }
     await evaluate('document.getElementById("community-portal-cards").scrollTo({left:0,behavior:"instant"});document.getElementById("world-gateways").scrollIntoView({block:"start"})');
     await until(()=>evaluate('document.getElementById("community-portal-cards").scrollLeft<5'));
    }
    await until(()=>evaluate('document.querySelectorAll(".av9-world-gateway-art>img").length===4&&Array.from(document.querySelectorAll(".av9-world-gateway-art>img")).every(image=>image.complete&&image.naturalWidth>0)'));
    // naturalWidth is density-corrected with width-descriptor srcsets. Decode
    // the selected file itself to verify physical source pixels instead.
    const portals=await evaluate('(async()=>({images:document.querySelectorAll(".av9-world-gateway-art>img[srcset]").length,resolutions:await Promise.all([...document.querySelectorAll(".av9-world-gateway-art>img")].map(async image=>{const bitmap=await createImageBitmap(await(await fetch(image.currentSrc)).blob());const width=bitmap.width;bitmap.close();return width;})),links:[...document.querySelectorAll(".av9-world-gateway")].map(a=>a.getAttribute("href")),readingSurface:[...document.querySelectorAll(".av9-world-gateway-content")].every(el=>getComputedStyle(el).position!=="absolute"),overflow:document.documentElement.scrollWidth>innerWidth+1}))()');
    if(portals.images!==4||portals.resolutions.some(width=>width<768)||!portals.readingSurface||portals.overflow||portals.links.some(href=>!href.includes("/discover?category=")))
     throw Error("COMMUNITY_PORTAL_ART_OR_LAYOUT_"+width+":"+JSON.stringify(portals));
    if(width<541){
     await evaluate("document.querySelector("+JSON.stringify('button[aria-label="Next collection"]')+").click()");
     await until(()=>evaluate('document.getElementById("community-portal-cards").scrollLeft>100'));
     await evaluate("document.querySelector("+JSON.stringify('button[aria-label="Previous collection"]')+").click()");
     await until(()=>evaluate('document.getElementById("community-portal-cards").scrollLeft<5'));
    }
    await screenshot("home-collections-"+width);
    await evaluate('document.querySelector(".av11-live-index").scrollIntoView({block:"start"})');
    await screenshot("home-community-modules-"+width);
   }
   results.push({page:name,width,...state});
   console.log("SITEWIDE_V012_"+name.toUpperCase()+"_"+width+"=PASS");
  }
  await client.send("Page.navigate",{url:base+"/creator/atlas/boards"});
  await until(()=>evaluate('location.pathname==="/creator/boards"&&!!document.querySelector(".cnb-hub")'));
  const archived=await evaluate('({headers:document.querySelectorAll(".site-header.av9-header").length,legacy:document.querySelectorAll(".atm-header").length})');
  if(archived.headers!==1||archived.legacy)throw Error("SITEWIDE_V012_DUPLICATE_SHELL_"+width+":"+JSON.stringify(archived));
  if(width===1440||width===390){
   await client.send("Page.navigate",{url:base+"/creator/community/posts/"+'a'.repeat(32)});
   await until(()=>evaluate('document.readyState==="complete"&&!!document.querySelector("article.discussion-page h1")'));
   const post=await evaluate('({title:document.querySelector("article.discussion-page h1")?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1})');
   if(post.overflow||!post.title?.includes("Keyboard feedback"))throw Error("SITEWIDE_V012_DISCUSSION_"+width+":"+JSON.stringify(post));
   await screenshot("discussion-"+width);
   results.push({page:"discussion",width,...post});
  }
 }
 writeFileSync(join(output,"sitewide-v012-capture.json"),JSON.stringify({syntheticFixture:true,pages:results},null,2));
 writeFileSync(join(output,"capture-status.txt"),"SITEWIDE_V012_BROWSER_CAPTURE=PASS\nAll records are synthetic offline visual fixtures; no live member acceptance.\n");
 console.log("SITEWIDE_V012_BROWSER_CAPTURE=PASS; PAGES="+results.length);
}finally{
 try{if(client)await client.send("Browser.close");}catch{}
 client?.close();
 if(child.exitCode===null){
  const exited=new Promise(resolve=>child.once("exit",resolve));
  child.kill("SIGTERM");await Promise.race([exited,delay(2000)]);
  if(child.exitCode===null){child.kill("SIGKILL");await Promise.race([exited,delay(1000)]);}
 }
 try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
 catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error.code))throw error;console.warn("Temporary browser profile cleanup deferred:",error.code);}
}
