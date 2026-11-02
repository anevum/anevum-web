// Local-only browser QA. This is not evidence of a hosted Cloudflare preview.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const base = String(process.env.BASE_URL || "").replace(/\/$/, "");
if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(base))
  throw new Error("Only a local http:// loopback preview URL is accepted");
const output = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "anevum-original-works-preview");
fs.mkdirSync(output, {recursive:true});
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "anevum-original-works-"));
const chrome = spawn("google-chrome", [
  "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  "--no-first-run", "--disable-background-networking", "--disable-sync",
  "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0",
  "--user-data-dir=" + profile, "about:blank"
], {stdio:"ignore"});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let debugPort;

async function waitForDebugger() {
  const portFile = path.join(profile, "DevToolsActivePort");
  for (let n=0;n<300;n++) {
    if (chrome.exitCode !== null) throw new Error("Headless Chrome exited early: " + chrome.exitCode);
    try {
      if (fs.existsSync(portFile)) {
        const p = fs.readFileSync(portFile, "utf8").trim().split(/\r?\n/)[0];
        if (/^\d+$/.test(p) && (await fetch("http://127.0.0.1:" + p + "/json/version")).ok) {
          debugPort = Number(p); return;
        }
      }
    } catch {}
    await sleep(100);
  }
  throw new Error("Headless Chrome not ready");
}

const inspectExpression = "(" + function inspectPreview() {
  const site = document.querySelector('.ow-site[data-anevum-original-works-preview="true"]');
  const nav = site?.querySelectorAll(".ow-navigation a");
  const root = document.documentElement;
  const orbit = site?.querySelector(".ow-scene-orbit-outer");
  return {
    ready: !!site && !!site.querySelector("h1") && nav?.length === 5,
    route: location.pathname,
    heading: site?.querySelector("h1")?.textContent || "",
    banner: site?.textContent || "",
    robots: document.querySelector('meta[name="robots"]')?.content || "",
    canonical: document.querySelector('link[rel="canonical"]')?.href || "",
    links: [...(site?.querySelectorAll("a[href]") || [])].map(a => a.getAttribute("href")),
    hasSkip: !!site?.querySelector('.ow-skip[href="#ow-main"]'),
    width: root.clientWidth,
    scrollWidth: root.scrollWidth,
    bodyScrollWidth: document.body?.scrollWidth || 0,
    animation: orbit ? getComputedStyle(orbit).animationName : "none"
  };
}.toString() + ")()";

async function runCase(route, viewport) {
  const response=await fetch("http://127.0.0.1:" + debugPort + "/json/new?about:blank",{method:"PUT"});
  if(!response.ok) throw Error("Could not create Chrome target");
  const target=await response.json();
  const ws=new WebSocket(target.webSocketDebuggerUrl);
  const pending=new Map(), exceptions=[];
  let next=0;
  const connected=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error("CDP WebSocket timed out")),10000);
    ws.addEventListener("open",()=>{clearTimeout(timer);resolve()},{once:true});
    ws.addEventListener("error",()=>{clearTimeout(timer);reject(Error("CDP WebSocket error"))},{once:true});
  });
  ws.addEventListener("message",e=>{
    const msg=JSON.parse(String(e.data));
    if(msg.id&&pending.has(msg.id)){
      const wait=pending.get(msg.id);pending.delete(msg.id);clearTimeout(wait.timer);
      if(msg.error)wait.reject(Error(msg.error.message));else wait.resolve(msg.result);
    }else if(msg.method==="Runtime.exceptionThrown")
      exceptions.push(msg.params?.exceptionDetails?.exception?.description||msg.params?.exceptionDetails?.text||"Script exception");
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++next;
    const timer=setTimeout(()=>{pending.delete(id);reject(Error("CDP timeout: "+method))},15000);
    pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));
  });
  const name = route === "/design/original-works" ? "original-works-home" :
    route.endsWith("/reply") ? "original-works-reply" : "original-works-atlas";
  try{
    await connected;
    await send("Page.enable");await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride",{
      width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:viewport.width<600
    });
    await send("Emulation.setEmulatedMedia",{
      features:[{name:"prefers-reduced-motion",value:"reduce"}]
    });
    await send("Page.navigate",{url:base+route});
    let state;
    const deadline=Date.now()+14000;
    while(Date.now()<deadline){
      try {
        state=(await send("Runtime.evaluate",{expression:inspectExpression,returnByValue:true})).result?.value;
        if(state?.ready&&state.route===route&&state.robots.startsWith("noindex"))break;
      } catch {}
      await sleep(150);
    }
    if(!state?.ready||state.route!==route)throw Error("Unhydrated route: "+JSON.stringify(state));
    if(!state.robots.startsWith("noindex")||state.canonical)
      throw Error("Preview indexing failure: "+JSON.stringify(state));
    if(!state.hasSkip||!state.links.includes("/design/original-works/atlas")||
       (name!=="original-works-reply"&&!state.links.includes("/design/original-works/reply")))
      throw Error("Preview navigation missing: "+JSON.stringify(state.links));
    if(state.links.some(href=>href&&!href.startsWith("/")&&!href.startsWith("#")))
      throw Error("Unexpected outbound preview links: "+JSON.stringify(state.links));
    if(state.width+1<state.scrollWidth||state.width+1<state.bodyScrollWidth)
      throw Error("Horizontal overflow at "+viewport.width+": "+JSON.stringify(state));
    if(state.animation!=="none")throw Error("Reduced-motion setting ignored");
    if(name==="original-works-reply"&&(!state.heading.includes("REPLY")||!state.banner.includes("Author revision in progress")))
      throw Error("Missing honest REPLY editorial status");
    if(name==="original-works-atlas"&&(!state.heading.includes("A universe")||!state.banner.includes("Nali Solan")))
      throw Error("Missing public-safe opening canon");
    if(name==="original-works-home"&&!state.heading.includes("Somewhere"))
      throw Error("Missing Anevum studio hero");
    if(name==="original-works-atlas") {
      const searchCheck = async expr => (await send("Runtime.evaluate",{expression:expr,returnByValue:true})).result?.value;
      const initial=await searchCheck('document.querySelectorAll(".ow-atlas-card").length');
      if(initial!==4)throw Error("Atlas initial four opening records missing: "+initial);
      const network=await searchCheck('(() => {const clusters=[...document.querySelectorAll(".ow-atlas-cluster")];return clusters.map(c=>({name:c.querySelector(".ow-atlas-cluster-label")?.textContent||"",links:[...c.querySelectorAll("a")].map(a=>a.getAttribute("href")),relation:c.querySelector(".ow-atlas-connection")?.textContent||""}));})()');
      const expected=[
        {name:"Ovara / Independent context",links:["/design/original-works/atlas/ovara","/design/original-works/atlas/nali-solan"],relation:"Home of"},
        {name:"Veyra – Neral / Mature network",links:["/design/original-works/atlas/veyra","/design/original-works/atlas/neral"],relation:"Established Road"}
      ];
      if(JSON.stringify(network)!==JSON.stringify(expected))
        throw Error("Atlas opening-state relationships do not match canon boundaries: "+JSON.stringify(network));

      await send("Runtime.evaluate",{expression:'(() => {const input=document.querySelector("#ow-atlas-query");const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(input,"Nali");input.dispatchEvent(new Event("input",{bubbles:true}));})()'});
      let found=false;
      for(let n=0;n<25;n++){const state=await searchCheck('({count:document.querySelectorAll(".ow-atlas-card").length,text:document.querySelector(".ow-atlas-card")?.textContent||""})');if(state?.count===1&&state.text.includes("Nali")){found=true;break;}await sleep(80)}
      if(!found)throw Error("Atlas search did not filter to Nali");
      await send("Runtime.evaluate",{expression:'document.querySelector(".ow-atlas-filters button:nth-child(2)")?.click()'});
      if(!(await searchCheck('!!document.querySelector(".ow-atlas-empty")')))
        throw Error("Atlas empty state did not appear for incompatible filter");
      await send("Runtime.evaluate",{expression:'document.querySelector(".ow-atlas-empty button")?.click()'});
      if((await searchCheck('document.querySelectorAll(".ow-atlas-card").length'))!==4)
        throw Error("Atlas reset did not restore records");
    }
    await sleep(300);
    const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    fs.writeFileSync(path.join(output,name+"-"+viewport.name+".png"),Buffer.from(shot.data,"base64"));
    const html=await send("Runtime.evaluate",{expression:"document.documentElement.outerHTML",returnByValue:true});
    if(viewport.name==="desktop")fs.writeFileSync(path.join(output,name+"-rendered.html"),html.result?.value||"");
    const {banner,...safe}=state;
    fs.writeFileSync(path.join(output,name+"-"+viewport.name+".json"),JSON.stringify(safe,null,2));
    if(exceptions.length)throw Error("Browser JavaScript exception: "+JSON.stringify(exceptions));
    console.log(JSON.stringify({route,viewport:viewport.name,heading:state.heading,width:state.width,overflow:false,robots:state.robots}));
    if(name==="original-works-atlas"&&["desktop","mobile"].includes(viewport.name)){
      // Validate an actual reader transition, not just a card-shaped link.
      await send("Runtime.evaluate",{expression:'document.querySelector(".ow-atlas-card[href=\\"/design/original-works/atlas/ovara\\"]")?.click()'});
      const read = async expression => (await send("Runtime.evaluate",{expression,returnByValue:true})).result?.value;
      let detail;
      for(let n=0;n<65;n++){
        try{
          detail=await read('({path:location.pathname,title:document.querySelector("#ow-atlas-detail-heading")?.textContent||"",active:document.querySelector(".ow-navigation a[href=\\"/design/original-works/atlas\\"]")?.getAttribute("aria-current")||"",robots:document.querySelector("meta[name=\\"robots\\"]")?.content||"",canonical:document.querySelector("link[rel=\\"canonical\\"]")?.href||"",overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1})');
          if(detail?.path==="/design/original-works/atlas/ovara"&&detail.title.includes("Ovara"))break;
        }catch{}
        await sleep(110);
      }
      if(detail?.path!=="/design/original-works/atlas/ovara"||!detail.title.includes("Ovara")||detail.active!=="page"||!detail.robots.startsWith("noindex")||detail.canonical||detail.overflow)
        throw Error("Atlas deep-linked entry failed: "+JSON.stringify(detail));
      const detailShot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
      fs.writeFileSync(path.join(output,"original-works-atlas-detail-"+viewport.name+".png"),Buffer.from(detailShot.data,"base64"));
      const relatedLink=await read('document.querySelector(".ow-atlas-related-link")?.getAttribute("href")||""');
      if(relatedLink!=="/design/original-works/atlas/nali-solan")
        throw Error("Ovara article should relate to Nali, not an unrelated Road world: "+relatedLink);
      await send("Runtime.evaluate",{expression:'document.querySelector(".ow-atlas-related-link")?.click()'});
      let followed=false;
      for(let n=0;n<45;n++){
        if(await read('location.pathname==="/design/original-works/atlas/nali-solan" && !!document.querySelector("#ow-atlas-detail-heading")?.textContent?.includes("Nali Solan")')){followed=true;break}
        await sleep(100);
      }
      if(!followed)throw Error("Related record link did not navigate to Nali Solan");

      await send("Page.navigate",{url:base+"/design/original-works/atlas/unknown-private-record"});
      let missing;
      for(let n=0;n<65;n++){
        try{
          missing=await read('({path:location.pathname,title:document.querySelector("#ow-atlas-missing")?.textContent||"",robots:document.querySelector("meta[name=\\"robots\\"]")?.content||"",canonical:document.querySelector("link[rel=\\"canonical\\"]")?.href||"",hasBack:!!document.querySelector(".ow-atlas-detail a[href=\\"/design/original-works/atlas\\"]")})');
          if(missing?.path.endsWith("/unknown-private-record")&&missing.title.includes("unavailable"))break;
        }catch{}
        await sleep(110);
      }
      if(!missing?.title.includes("unavailable")||!missing.robots.startsWith("noindex")||missing.canonical||!missing.hasBack)
        throw Error("Unknown Atlas slug did not fail closed: "+JSON.stringify(missing));
      console.log(JSON.stringify({route:"/design/original-works/atlas/ovara",viewport:viewport.name,detail:"PASS",unreleasedSlug:"NOT_FOUND"}));
    }
    if(name==="original-works-home"&&["desktop","mobile"].includes(viewport.name)){
      await send("Runtime.evaluate",{expression:"document.querySelector('.ow-site a[href=\"/design/original-works/reply\"]')?.click()"});
      let navigated=false;
      for(let i=0;i<70;i++){
        const check=await send("Runtime.evaluate",{expression:'location.pathname==="/design/original-works/reply" && !!document.querySelector(".ow-reply-page h1")',returnByValue:true});
        if(check.result?.value===true){navigated=true;break;}
        await sleep(100);
      }
      if(!navigated)throw Error("Book CTA failed real navigation");
    }
  }finally{
    ws.close();
    try{await fetch("http://127.0.0.1:"+debugPort+"/json/close/"+target.id)}catch{}
  }
}

const viewports=[
  {name:"desktop",width:1440,height:1000},
  {name:"mobile",width:390,height:844},
  {name:"narrow",width:320,height:720,homeOnly:true},
  {name:"tablet",width:768,height:980,homeOnly:true},
  {name:"small-desktop",width:1024,height:860,homeOnly:true}
];
try {
  await waitForDebugger();
  for(const viewport of viewports){
    for(const route of ["/design/original-works","/design/original-works/reply","/design/original-works/atlas"]){
      if(!viewport.homeOnly||route==="/design/original-works")await runCase(route,viewport);
    }
  }
  console.log("Local original-works visual QA passed at 1440,390,320,768,1024 px.");
} finally {
  chrome.kill("SIGTERM");await sleep(200);
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100})}catch{}
}
