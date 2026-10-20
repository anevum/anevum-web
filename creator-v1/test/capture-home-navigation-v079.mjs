/**
 * V079 visual acceptance: real built React against isolated synthetic fixture.
 * No production account, token, database or privileged write is accessed.
 */
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const [chrome,base,output]=process.argv.slice(2);
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
 for(const [width,height,label] of [[1440,900,"desktop"],[390,844,"phone"],[320,720,"small-phone"]]){
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<700});
  const navigation=await send("Page.navigate",{url:base+"/creator/"});
  if(navigation.errorText)throw Error("V079_NAV_"+label+":"+navigation.errorText);
  await until(()=>evaluate('!!document.querySelector(".av79-home .av79-hero")&&!!document.querySelector(".av79-feature")&&document.querySelectorAll(".av79-gateway").length===4'));
  const home=await evaluate('(()=>{const hero=document.querySelector(".av79-hero"),feature=document.querySelector(".av79-feature");return {title:hero?.querySelector("h1")?.textContent,routes:[...document.querySelectorAll(".av79-gateway")].map(x=>x.getAttribute("href")),project:feature?.querySelector("h3")?.textContent,author:!!feature?.querySelector("[data-player-card=v078]"),legacy:document.querySelectorAll(".av73-world-deck,.av11-live-index,.av6-community-index").length,art:document.querySelectorAll(".av79-home img,.av79-home .cw-artwork").length,overflow:document.documentElement.scrollWidth>innerWidth+1,fold:hero?.getBoundingClientRect().top<innerHeight}})()');
  if(!home.title?.includes("Find your next")||home.routes.length!==4||
   !home.project||!home.author||home.legacy||home.art||home.overflow||!home.fold)
   throw Error("V079_HOME_ENTRY_"+label+":"+JSON.stringify(home));
  await screenshot("home-"+label);
  await evaluate('document.querySelector(".av9-menu-trigger").click()');
  await until(()=>evaluate('document.querySelector(".av79-navigation[open]")?.querySelectorAll(".av79-destination").length===4'));
  const menu=await evaluate("(()=>{const root=document.querySelector(\".av79-navigation[open]\");const grid=root.querySelector(\".av79-navigation-primary\");const help=grid.querySelector(\".ir80-wayfinder-entry\");const copy=help.children[1];const action=help.querySelector(\".ir80-wayfinder-action\");const hr=help.getBoundingClientRect(),gr=grid.getBoundingClientRect(),cr=copy.getBoundingClientRect(),ar=action.getBoundingClientRect();return {routes:[...root.querySelectorAll(\".av79-destination\")].map(x=>x.getAttribute(\"href\")),art:root.querySelectorAll(\"img,.cw-artwork,canvas\").length,join:!!root.querySelector(\".av79-navigation-join,.av79-navigation-identity\"),search:!!root.querySelector(\".av79-navigation-search\"),overflow:root.scrollWidth>root.clientWidth+1,helper:{width:Math.round(hr.width),gridWidth:Math.round(gr.width),copyWidth:Math.round(cr.width),actionVisible:getComputedStyle(action).display!==\"none\",actionSafe:ar.left>=hr.left-1&&ar.right<=hr.right+1&&ar.bottom<=hr.bottom+1&&(ar.top>=cr.bottom-1||ar.left>=cr.right-1),actionStacked:ar.top>=cr.bottom-1}}})()");
  if(menu.routes.length!==4||menu.art||!menu.join||!menu.search||menu.overflow||!menu.helper.actionVisible||!menu.helper.actionSafe||menu.helper.width<menu.helper.gridWidth-2||menu.helper.copyWidth<(label==="small-phone"?120:160)||(label!=="desktop"&&!menu.helper.actionStacked))
   throw Error("V079_MENU_ACCESS_"+label+":"+JSON.stringify(menu));
  await screenshot("wayfinder-"+label);
  await evaluate('document.querySelector(".ir80-wayfinder-entry")?.scrollIntoView({block:"center"})');
  await screenshot("wayfinder-iren-"+label);
  await evaluate('document.querySelector(".av79-navigation-search").click()');
  await until(()=>evaluate('!!document.querySelector(".portal-launcher[open] input[type=search]")'));
  await evaluate('(()=>{const field=document.querySelector(".portal-launcher[open] input[type=search]"),setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;setter.call(field,"ARCADE");field.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await until(()=>evaluate('[...document.querySelectorAll(".portal-launcher-result-copy strong")].some(x=>x.textContent?.includes("ARCADE AFTER DARK"))'));
  const search=await evaluate('(()=>({live:document.querySelector(".portal-launcher-live-status")?.textContent,matches:[...document.querySelectorAll(".portal-launcher-result-copy strong")].map(x=>x.textContent)}))()');
  if(!search.live?.includes("DIRECT MATCHES")||!search.matches.some(x=>x.includes("ARCADE AFTER DARK")))
   throw Error("V079_VERIFIED_SEARCH_"+label+":"+JSON.stringify(search));
  await screenshot("search-"+label);
  evidence.push({viewport:label,home,menu,search});
  console.log("V079_BROWSER_"+label+"=PASS");
 }
 writeFileSync(join(output,"acceptance.json"),JSON.stringify({pass:true,source:"isolated built React and synthetic public fixture",protectedWrites:0,evidence},null,2));
 console.log("V079_REAL_REACT_VISUAL_QA=PASS");
}finally{
 try{ws?.close();}catch{}
 browser.kill("SIGTERM");
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140});}
 catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error?.code))throw error;}
}
