/**
 * V079 visual acceptance: real built React against isolated synthetic fixture.
 * No production account, token, database or privileged write is accessed.
 */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const [chrome,base,output,phase="after"]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||"")||!output)
 throw Error("V079_CHROME_LOOPBACK_AND_OUTPUT_REQUIRED");
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=27000){
 const deadline=Date.now()+timeout;let last="";
 while(Date.now()<deadline){
  try{const result=await fn();if(result)return result;}catch(error){last=String(error);}
  await delay(150);
 }
 throw Error("V079_BROWSER_WAIT "+last.slice(0,200));
}
const profile=mkdtempSync(join(tmpdir(),"anevum-v079-"));
mkdirSync(output,{recursive:true});
const browser=spawn(chrome,[
 "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
 "--disable-background-networking","--no-first-run","--remote-allow-origins=*",
 "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let ws=null;const evidence=[];
try{
 const port=await until(()=>{
  const path=join(profile,"DevToolsActivePort");
  return existsSync(path)?readFileSync(path,"utf8").split("\n")[0]:null;
 });
 const url=await until(async()=>{
  const response=await fetch("http://127.0.0.1:"+port+"/json/list");
  return response.ok?(await response.json()).find(item=>item.type==="page")?.webSocketDebuggerUrl:null;
 });
 ws=new WebSocket(url);const pending=new Map();let sequence=0;
 ws.addEventListener("message",({data})=>{
  const reply=JSON.parse(String(data));if(typeof reply.id!=="number")return;
  const call=pending.get(reply.id);if(!call)return;pending.delete(reply.id);
  reply.error?call.reject(Error(reply.error.message)):call.resolve(reply.result||{});
 });
 await new Promise((resolve,reject)=>{
  ws.addEventListener("open",resolve,{once:true});
  ws.addEventListener("error",reject,{once:true});
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const reply=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(reply.exceptionDetails)throw Error(reply.exceptionDetails.exception?.description||reply.exceptionDetails.text);
  return reply.result?.value;
 };
 const screenshot=async title=>{
  const reply=await send("Page.captureScreenshot",{format:"png",fromSurface:true});
  const data=Buffer.from(reply.data||"","base64");
  if(data.length<3500)throw Error("V079_EMPTY_CAPTURE_"+title);
  writeFileSync(join(output,title+".png"),data);
 };
 await send("Page.enable");await send("Runtime.enable");
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 const pages=[
  ["home","/",".av79-home"], ["discover","/discover",".portal-discover-results"],
  ["boards","/boards",phase==="before"?".cnb-project-grid":".av79-board-results"],
  ["creators","/creators",".portal-creator-grid"], ["creator","/creators/nova_demo",".portal-creator-channel"],
  ["project","/projects/00000000000000000000000000000001",".avp-stage"],
  ["community","/community",".ch7-project"], ["levels","/levels",".av75-levels-page"],
  ["rewards","/recognition",".av75-recognition-page"], ["join","/join",".join-experience"],
  ["account","/member",".av12-account-await"], ["studio","/studio",".st-status"],
  ["staff-review-gate","/studio/review",".st-status"], ["support","/support",".av45-support"],
  ["saved","/saved",".avsaved-shell"]
 ];
 for(const [width,height,label] of [[1440,900,"desktop"],[768,1024,"tablet"],[390,844,"phone"],[320,720,"small-phone"]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
  for(const [name,path,selector] of pages){
   await send("Page.navigate",{url:base+"/creator"+path});
   await until(()=>evaluate('!!document.querySelector('+JSON.stringify(selector)+')'));
   // Wait for the loaded route, then collect after a painted frame.
   await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
   const state=await evaluate(String.raw`(()=>({main:document.querySelectorAll('main').length,header:document.querySelectorAll('.site-header').length,overflow:document.documentElement.scrollWidth>innerWidth+1,heading:document.querySelector('main h1')?.textContent||null,unlinked:[...document.querySelectorAll('main a')].filter(a=>/\/creators\/(null|undefined)(?:$|[?#])/.test(a.href)).length}))()`);
   if(state.main!==1||state.header!==1||(phase==="after"&&(state.overflow||state.unlinked)))throw Error("SITEWIDE_LAYOUT_"+phase+"_"+name+"_"+label+":"+JSON.stringify(state));
   if(phase==="after"&&["boards","creator"].includes(name)&&await evaluate('!!document.querySelector("main .cw-artwork")'))throw Error("DECORATIVE_CATEGORY_ART_"+name);
   if(phase==="after"&&["boards","creator"].includes(name)&&!await evaluate('(()=>{const card=document.querySelector(".av73-project-card");return !card||parseFloat(getComputedStyle(card).paddingLeft)>=14})()'))throw Error("EDITORIAL_CARD_MATERIAL_MISSING_"+name);
   await screenshot(name+"-"+label);
   evidence.push({viewport:label,page:name,...state});
   console.log(phase+" "+label+" "+name+" PASS");
  }
  await send("Page.navigate",{url:base+"/creator/"});
  await until(()=>evaluate('!!document.querySelector(".av79-feature")'));
  await evaluate('document.querySelector(".av9-menu-trigger").click()');
  await until(()=>evaluate('!!document.querySelector(".av79-navigation[open]")'));
  await screenshot("wayfinder-"+label);
  await evaluate('document.querySelector(".av79-navigation-search").click()');
  await until(()=>evaluate('!!document.querySelector(".portal-launcher[open]")'));
  await evaluate('(()=>{const f=document.querySelector(".portal-launcher input"),setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;setter.call(f,"nova");f.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await until(()=>evaluate('[...document.querySelectorAll(".portal-launcher-result-copy strong")].some(x=>x.textContent.includes("Nova Studio"))'));
  await screenshot("search-"+label);
  if(phase==="after"){
   const semantics=await evaluate('(()=>{const input=document.querySelector(".portal-launcher input"),active=document.getElementById(input.getAttribute("aria-activedescendant"));return {role:input.getAttribute("role"),option:active?.getAttribute("role"),lock:document.documentElement.style.overflow,overflow:document.querySelector(".portal-launcher").scrollWidth>document.querySelector(".portal-launcher").clientWidth+1}})()');
   if(semantics.role!=="combobox"||semantics.option!=="option"||semantics.lock!=="hidden"||semantics.overflow)throw Error("SEARCH_ACCESSIBILITY_"+JSON.stringify(semantics));
   if(!await evaluate('document.querySelector(".portal-launcher").getBoundingClientRect().height<=document.querySelector(".portal-launcher-content").getBoundingClientRect().height+3'))throw Error("SEARCH_OVERSIZED_EMPTY_SURFACE");
   await send("Input.dispatchKeyEvent",{type:"keyDown",key:"ArrowDown",code:"ArrowDown",windowsVirtualKeyCode:40});
   await send("Input.dispatchKeyEvent",{type:"keyUp",key:"ArrowDown",code:"ArrowDown",windowsVirtualKeyCode:40});
   if(!await evaluate('document.querySelector(".portal-launcher input").getAttribute("aria-activedescendant").endsWith("-1")'))throw Error("SEARCH_ARROW_SELECTION");
   await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
   await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
   await until(()=>evaluate('!document.querySelector("dialog[open]")&&document.documentElement.style.overflow!=="hidden"'));
  }
 }
 if(phase==="after"){
  await send("Page.navigate",{url:base+"/creator/boards?view=firstLooks&category=tools"});
  await until(()=>evaluate('!!document.querySelector(".av79-board-state h3")'));
  await screenshot("boards-filtered-empty");
  await evaluate('[...document.querySelectorAll(".av79-board-tabs button")].find(b=>b.textContent==="New releases").click()');
  await until(()=>evaluate('!!document.querySelector(".av79-board-results")'));
  await evaluate('document.querySelector(".av73-project-card-action").click()');
  await until(()=>evaluate('!!document.querySelector(".avp-stage")'));
  if(!await evaluate('document.querySelector(".portal-crumbs a").textContent.includes("BACK TO BOARDS")'))throw Error("BOARDS_RETURN_PATH");
  await evaluate('document.querySelector(".portal-crumbs a").click()');
  await until(()=>evaluate('!!document.querySelector(".av79-board-results")'));
  await fetch(base+"/__boards-fixture?mode=error");
  await evaluate('document.querySelector(".av79-board-refresh").click()');
  await until(()=>evaluate('document.querySelector(".av79-board-state[role=alert]")?.textContent.includes("could not load")'));
  await screenshot("boards-network-error");
  await fetch(base+"/__boards-fixture?mode=ready");
  await evaluate('document.querySelector(".av79-board-state button").click()');
  await until(()=>evaluate('!!document.querySelector(".av79-board-results")'));
  await fetch(base+"/__boards-fixture?mode=render-error");
  await send("Page.navigate",{url:base+"/creator/boards?view=publishing"});
  await until(()=>evaluate('!!document.querySelector(".av79-route-recovery")'));
  if(!await evaluate('!!document.querySelector(".site-header .av9-menu-trigger")&&document.querySelectorAll("main").length===1'))throw Error("ROUTE_RECOVERY_SHELL_LOST");
  await screenshot("route-recovery");
  await evaluate('document.querySelector(".av79-route-recovery a").click()');
  await until(()=>evaluate('!!document.querySelector(".portal-discover-results")'));
  await fetch(base+"/__boards-fixture?mode=ready");
  await send("Network.enable");
  await send("Network.setCacheDisabled",{cacheDisabled:true});
  await send("Network.setBlockedURLs",{urls:["*PublicBoardsPage-*.js"]});
  await send("Page.navigate",{url:base+"/creator/boards"});
  await until(()=>evaluate('!!document.querySelector(".av79-route-recovery")'));
  await screenshot("boards-lazy-import-recovery");
  await send("Network.setBlockedURLs",{urls:[]});
  await send("Page.navigate",{url:base+"/creator/boards"});
  await until(()=>evaluate('!!document.querySelector(".av79-board-results")'));
  await send("Page.navigate",{url:base+"/creator/library"});
  await until(()=>evaluate('location.pathname.endsWith("/saved")&&!!document.querySelector(".avsaved-shell")'));
  // Keyboard traversal stays inside the native modal; reduced-motion CSS is applied.
  await evaluate('document.querySelector(".av9-menu-trigger").click()');
  await until(()=>evaluate('!!document.querySelector(".av79-navigation[open]")'));
  for(let i=0;i<32;i++){
   await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
   await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
   if(!await evaluate('!!document.activeElement?.closest("dialog[open]")||document.activeElement===document.body'))throw Error("MODAL_FOCUS_ESCAPED");
  }
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({pass:true,phase,source:"built React; explicitly SYNTHETIC, loopback-only fixtures; creatorHandle:null",protectedWrites:0,evidence},null,2));
 console.log("V079_SITEWIDE_"+phase.toUpperCase()+"=PASS ("+evidence.length+" route/viewport observations)");
}finally{
 try{ws?.close();}catch{}
 browser.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140});}
 catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error?.code))throw error;}
}
