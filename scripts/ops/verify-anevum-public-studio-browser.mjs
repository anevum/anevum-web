// Browser acceptance against the exact standalone Worker module on loopback.
// No public route, auth bypass, Cloudflare token, or automatic deployment.
import {spawn, spawnSync} from "node:child_process";
import {mkdtempSync,readFileSync,writeFileSync,existsSync,mkdirSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(path.join(tmpdir(),"anevum-public-cdp-"));
const output=process.env.RUNNER_TEMP || tmpdir();
mkdirSync(output,{recursive:true});
const base="http://127.0.0.1:4178";
const server=spawn(process.execPath,["scripts/ops/anevum-public-studio-test-server.mjs"],{stdio:"ignore"});
let chrome,ws,next=0,port;
const pending=new Map();
function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++next;
  const timer=setTimeout(()=>{pending.delete(id);reject(Error("CDP timeout: "+method));},17000);
  pending.set(id,{resolve,reject,timer});
  ws.send(JSON.stringify({id,method,params}));
 });
}
async function evalJS(expression){
 const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text||"runtime exception");
 return r.result?.value;
}
async function waitFor(fn,label){
 for(let i=0;i<110;i++){
  try{const v=await fn();if(v)return v;}catch{}
  await sleep(110);
 }
 throw Error("Timed out waiting for "+label);
}
async function view(pathname,width,height,name,saveScreenshot=false){
 await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<650});
 await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
 await send("Page.navigate",{url:base+pathname});
 const state=await waitFor(async()=>{
  const v=await evalJS(`(()=>{const desktop=document.querySelector('nav.desktop-nav'),mobile=document.querySelector('details.mobile-menu'),orbit=document.querySelector('.orb.a');return {path:location.pathname,width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,bodyScroll:document.body.scrollWidth,heading:document.querySelector('main#main h1')?.textContent,links:[...(desktop?.querySelectorAll('a')||[])].map(a=>a.getAttribute('href')),main:!!document.querySelector('main#main'),skip:!!document.querySelector('a.skip[href="#main"]'),menu:!!mobile,menuVisible:!!mobile&&(getComputedStyle(mobile).display!=='none'),motion:orbit?getComputedStyle(orbit).animationName:null,scripts:document.scripts.length}})()`);
  return v?.path===pathname&&v?.heading?v:null;
 },name);
 if(!state.main||!state.skip||!state.menu)throw Error("Missing accessibility landmark: "+JSON.stringify(state));
 if(state.width>width||state.width<width-20||state.scrollWidth>state.width+1||state.bodyScroll>state.width+1)
  throw Error("Horizontal overflow: "+JSON.stringify({requestedWidth:width,...state}));
 if((state.motion!==null&&state.motion!=="none")||state.scripts!==0)
  throw Error("Unexpected motion or client JS: "+JSON.stringify(state));
 if(state.links.length!==6||!state.links.includes("/original-works/works")||!state.links.includes("/original-works/reply"))
  throw Error("Invalid desktop navigation: "+JSON.stringify(state));
 if((width<=780)!==state.menuVisible)throw Error("Mobile disclosure breakpoint mismatch: "+JSON.stringify(state));

 const journey=await evalJS(`(()=>{const nav=document.querySelector('nav.journey'),next=nav?.querySelector('a.journey-next'),prev=nav?.querySelector('a.journey-prev'),meter=nav?.querySelector('.journey-meter');return {found:!!nav,href:next?.getAttribute('href'),tapHeight:next?.getBoundingClientRect().height||0,previous:prev?.getAttribute('href')||null,segments:meter?.querySelectorAll('span').length||0,current:meter?.querySelectorAll('span.now').length||0,accessibleProgress:meter?.getAttribute('aria-label'),focusable:next?.tabIndex>=0}})()`);
 if(!journey?.found||!journey.href?.startsWith("/original-works")||journey.tapHeight<44||journey.current!==1||journey.segments!==7||!journey.focusable)
  throw Error("Editorial journey is unusable: "+JSON.stringify({name,width,journey}));
 if(width===390&&pathname==="/original-works"){
  const focus=await evalJS(`(()=>{const next=document.querySelector('.journey-next');next.focus();return document.activeElement===next})()`);
  if(!focus)throw Error("Journey must accept keyboard focus");
 }

 if(width===390&&pathname==="/original-works"){
  const menu=await evalJS(`(()=>{const d=document.querySelector('details.mobile-menu');d.querySelector('summary').click();const open=d.open;const links=[...d.querySelectorAll('nav a')].map(a=>a.getAttribute('href'));d.querySelector('summary').click();return {open,closed:!d.open,links}})()`);
  if(!menu.open||!menu.closed||!menu.links.includes('/original-works/works'))throw Error("Mobile disclosure failed: "+JSON.stringify(menu));
 }

 if(pathname==="/original-works/reply"){
  const reply=await evalJS(`(()=>{const nav=document.querySelector('.reply-quick-nav'),links=[...(nav?.querySelectorAll('a')||[])],book=document.querySelector('.reply-book'),edition=document.querySelector('#reply-edition'),cta=document.querySelector('.reply-editorial-actions .btn'),figure=document.querySelector('.reply-art'),h=document.querySelector('.reply-hero h1'),q=links[0];const rect=book?.getBoundingClientRect(),hRect=h?.getBoundingClientRect();q?.focus();return {anchors:links.map(x=>x.getAttribute('href')),resolved:links.map(x=>!!document.getElementById((x.getAttribute('href')||'').slice(1))),hasBook:!!book,hasFigure:!!figure,conceptLabel:book?.getAttribute('aria-label'),edition:!!edition,ctaHeight:cta?.getBoundingClientRect().height||0,touchHeights:links.map(x=>x.getBoundingClientRect().height),titleLeft:hRect?.left,titleRight:hRect?.right,bookLeft:rect?.left,bookRight:rect?.right,viewport:document.documentElement.clientWidth,coverMotion:book?getComputedStyle(book).transitionDuration:null,focus:document.activeElement===q}})()`);
  const expected=["#reply-work","#reply-edition","#reply-universe"];
  if(JSON.stringify(reply?.anchors)!==JSON.stringify(expected)||reply.resolved.some(x=>!x)||!reply.hasBook||!reply.hasFigure||!reply.edition||!reply.conceptLabel?.includes("not an approved final publication cover"))
   throw Error("REPLY editorial or anchors missing: "+JSON.stringify(reply));
  if(reply.ctaHeight<44||reply.touchHeights.some(x=>x<44)||!reply.focus||reply.coverMotion!=="0s")
   throw Error("REPLY touch/focus/reduced motion failure: "+JSON.stringify(reply));
  if(reply.titleLeft< -2||reply.titleRight>reply.viewport+2||reply.bookLeft< -8||reply.bookRight>reply.viewport+8)
   throw Error("REPLY content clipped at "+width+": "+JSON.stringify(reply));
 }

 if(saveScreenshot){
  const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  const filepath=path.join(output,"anevum-public-"+name+".png");
  writeFileSync(filepath,Buffer.from(shot.data,"base64"));
  if(readFileSync(filepath).length<12000)throw Error("Empty browser screenshot: "+filepath);
 }
 console.log(JSON.stringify({case:name,path:state.path,width:state.width,scrollWidth:state.scrollWidth,heading:state.heading,menuVisible:state.menuVisible}));
}
try {
 await waitFor(async()=>{if(server.exitCode!==null)throw Error("local server exited");return (await fetch(base+"/original-works")).status===200; },"loopback server");
 const lookup=spawnSync("which",["google-chrome"],{encoding:"utf8"});
 const chromeBin=lookup.status===0?lookup.stdout.trim():process.env.CHROME_BIN||"chromium";
 chrome=spawn(chromeBin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--no-first-run","--disable-background-networking","--remote-debugging-address=127.0.0.1","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
 const devtools=await waitFor(async()=>{
  if(chrome.exitCode!==null)throw Error("Chrome exited: "+chrome.exitCode);
  const f=path.join(profile,"DevToolsActivePort");
  if(!existsSync(f))return null;
  const n=Number(readFileSync(f,"utf8").split(/\r?\n/)[0]);
  return Number.isInteger(n)&&n>0?n:null;
 },"Chrome DevTools");
 const target=await (await fetch("http://127.0.0.1:"+devtools+"/json/new?about:blank",{method:"PUT"})).json();
 ws=new WebSocket(target.webSocketDebuggerUrl);
 ws.addEventListener("message",ev=>{
  const data=JSON.parse(String(ev.data));
  if(!data.id||!pending.has(data.id))return;
  const waiter=pending.get(data.id);pending.delete(data.id);clearTimeout(waiter.timer);
  if(data.error)waiter.reject(Error(data.error.message));else waiter.resolve(data.result);
 });
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 await send("Page.enable");await send("Runtime.enable");
 for(const [width,height] of [[320,768],[390,844],[768,1024],[1024,768],[1440,900]]){
  for(const [slug,label] of [["","home"],["works","works"],["reply","reply"],["transcosmic","universe"],["wiki","encyclopedia"],["journal","journal"],["about","about"]]){
   const name=label+"-"+width;
   await view("/original-works"+(slug?"/"+slug:""),width,height,name,["home","reply","encyclopedia"].includes(label)&&[390,1440].includes(width));
   if(label==="reply"&&[390,1440].includes(width)){
    await evalJS(`(()=>{document.querySelector('.reply-art').scrollIntoView({behavior:'instant',block:'center'});return true})()`);
    const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    const filepath=path.join(output,"anevum-public-reply-book-"+width+".png");
    writeFileSync(filepath,Buffer.from(shot.data,"base64"));
    if(readFileSync(filepath).length<12000)throw Error("REPLY book screenshot blank: "+filepath);
   }
   if(label==="home"&&[390,1440].includes(width)){
    await evalJS(`(()=>{document.querySelector('.journey').scrollIntoView({behavior:'instant',block:'center'});return true})()`);
    const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    const filepath=path.join(output,"anevum-public-journey-"+width+".png");
    writeFileSync(filepath,Buffer.from(shot.data,"base64"));
    if(readFileSync(filepath).length<12000)throw Error("Journey screenshot is blank: "+filepath);
   }

  }
 }
 console.log("ANEVUM_PUBLIC_STUDIO_BROWSER_QA_PASS");
} finally {
 for(const wait of pending.values()){clearTimeout(wait.timer);wait.reject(Error("Browser ending"));}pending.clear();
 if(ws)ws.close();
 if(chrome){chrome.kill("SIGTERM");}
 server.kill("SIGTERM");
 await sleep(200);
 rmSync(profile,{recursive:true,force:true});
}
