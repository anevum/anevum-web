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
    ready: !!site && !!site.querySelector("h1") && nav?.length === 6,
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
    route === "/design/original-works/wiki" ? "original-works-wiki" :
    route === "/design/original-works/wiki/ovara" ? "original-works-wiki-article" :
    route.endsWith("/reading-room") ? "original-works-reading-room" :
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

    if(process.env.ORIGINAL_WORKS_VERIFY_DISABLED==="1"){
      // Public production builds must NOT mount draft review routes, even when
      // manually navigated to a known URL. Noindex alone is not access control.
      let disabledState;
      for(let n=0;n<80;n++){
        const probe=await send("Runtime.evaluate",{
          expression:'({path:location.pathname,robots:document.querySelector("meta[name=\\"robots\\"]")?.content||"",reviewRoot:!!document.querySelector(".ow-site[data-anevum-original-works-preview]"),reader:!!document.querySelector(".ow-reading-room"),text:document.body?.innerText||""})',
          returnByValue:true
        });
        disabledState=probe.result?.value;
        if(disabledState?.robots?.startsWith("noindex"))break;
        await sleep(100);
      }
      if(!disabledState||disabledState.path!==route||!disabledState.robots.startsWith("noindex")||
         disabledState.reviewRoot||disabledState.reader||
         disabledState.text.includes("Three signals.")||disabledState.text.includes("A universe worth knowing."))
        throw Error("Review-only route visible in default production build: "+JSON.stringify(disabledState));
      const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
      fs.writeFileSync(path.join(output,name+"-gate-off-"+viewport.name+".png"),Buffer.from(shot.data,"base64"));
      console.log(JSON.stringify({gate:"DISABLED",path:route,robots:disabledState.robots,reviewMounted:false}));
      return;
    }

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
    if(name==="original-works-reading-room"&&(!state.heading.includes("Three signals")||!state.banner.includes("not excerpts from the novel")||!state.banner.includes("not an approved promotional release")))
      throw Error("REPLY study room missing editorial disclosure or title");
    if(name==="original-works-reading-room"){
      const read=async expression=>(await send("Runtime.evaluate",{expression,returnByValue:true})).result?.value;
      const buttons=await read('document.querySelectorAll(".ow-room-index-button").length');
      if(buttons!==3)throw Error("REPLY study room must expose exactly three tab buttons");
      for(const [nth,title,href] of [
        [2,"The world was already here.","/design/original-works/atlas/merva"],
        [3,"Elsewhere, distance is infrastructure.","/design/original-works/atlas/open-road"],
        [1,"A measurement survives.","/design/original-works/atlas/nali-solan"]
      ]){
        await send("Runtime.evaluate",{expression:'document.querySelector(".ow-room-index-button:nth-child('+nth+')")?.click()'});
        let observed;
        for(let n=0;n<45;n++){
          observed=await read('({title:document.querySelector(".ow-room-card h2")?.textContent||"",href:document.querySelector(".ow-room-card-bottom a")?.getAttribute("href")||"",active:[...document.querySelectorAll(".ow-room-index-button[aria-pressed=true]")].length,robots:document.querySelector("meta[name=\\"robots\\"]")?.content||""})');
          if(observed?.title===title&&observed.href===href&&observed.active===1&&observed.robots.startsWith("noindex"))break;
          await sleep(80);
        }
        if(observed?.title!==title||observed.href!==href||observed.active!==1||!observed.robots.startsWith("noindex"))
          throw Error("REPLY study selection failed: "+JSON.stringify(observed));
      }
      if(!state.links.includes("/design/original-works/reply"))
        throw Error("REPLY study room missing return navigation");
    }
    if(name==="original-works-wiki" || name==="original-works-wiki-article"){
      const readWiki=async expression=>(await send("Runtime.evaluate",{
        expression,returnByValue:true
      })).result?.value;
      const metadata=await readWiki('({wiki:!!document.querySelector("[data-wiki-editorial-preview]"),heading:document.querySelector(".ow-wiki h1")?.textContent||"",category:document.querySelector(".ow-wiki-article")?.getAttribute("data-wiki-category")||"",columns:getComputedStyle(document.querySelector(".ow-wiki-layout")).gridTemplateColumns,links:[...document.querySelectorAll(".ow-wiki a[href]")].map(a=>a.getAttribute("href")),articleTextSize:document.querySelector(".ow-wiki-copy section p")?getComputedStyle(document.querySelector(".ow-wiki-copy section p")).fontSize:"",rail:!!document.querySelector(".ow-wiki-left-rail"),box:!!document.querySelector(".ow-wiki-infobox"),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1})');
      if(!metadata.wiki||metadata.overflow||!metadata.rail)
        throw Error("Wiki shell or responsive layout failed: "+JSON.stringify(metadata));
      if(name==="original-works-wiki"){
        if(!state.heading.includes("An archive")||!metadata.links.includes("/design/original-works/wiki/special/all-pages")||
          !metadata.links.includes("/design/original-works/wiki/category/world"))
          throw Error("Encyclopedia index missing reader navigation: "+JSON.stringify(metadata));
        if((await readWiki('document.querySelectorAll(".ow-wiki-result").length'))!==8)
          throw Error("Reader wiki missing eight reviewed articles");
        const taxonomy=await readWiki('([...document.querySelectorAll(".ow-wiki-filter-row button[data-wiki-category]")].map(b=>({name:b.dataset.wikiCategory,accent:getComputedStyle(b).getPropertyValue("--wk-accent").trim()})))');
        const values=taxonomy.filter(x=>x.name!=="All").map(x=>x.accent);
        if(taxonomy.length!==5||new Set(values).size!==4||values.some(v=>!v))
          throw Error("Wiki semantic category colors missing/distinctness: "+JSON.stringify(taxonomy));

        await send("Runtime.evaluate",{expression:'(() => {const input=document.querySelector("#ow-wiki-search");const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(input,"Nali");input.dispatchEvent(new Event("input",{bubbles:true}));})()'});
        let found=false;
        for(let n=0;n<45;n++){
          const data=await readWiki('({count:document.querySelectorAll(".ow-wiki-result").length,title:document.querySelector(".ow-wiki-result strong")?.textContent||"",url:location.search})');
          if(data.count===1&&data.title==="Nali Solan"&&data.url.includes("q=Nali")){found=true;break}
          await sleep(85);
        }
        if(!found)throw Error("Wiki deep-linkable search failed");
        await send("Runtime.evaluate",{expression:'document.querySelector(".ow-wiki-filter-row button[data-wiki-category=\\"Place\\"]")?.click()'});
        let empty=false;
        for(let n=0;n<35;n++){
          if(await readWiki('!!document.querySelector(".ow-wiki-empty")')){empty=true;break}
          await sleep(85);
        }
        if(!empty)throw Error("Wiki category + search empty state missing");
        await send("Runtime.evaluate",{expression:'document.querySelector(".ow-wiki-empty button")?.click()'});
        let reset=false;
        for(let n=0;n<35;n++){
          if((await readWiki('document.querySelectorAll(".ow-wiki-result").length'))===8){reset=true;break}
          await sleep(85);
        }
        if(!reset)throw Error("Wiki reset did not restore curated articles");
        await send("Runtime.evaluate",{expression:'document.querySelector(".ow-wiki-filter-row button[data-wiki-category=\\"World\\"]")?.click()'});
        let filtered=false;
        for(let n=0;n<35;n++){
          const data=await readWiki('({count:document.querySelectorAll(".ow-wiki-result").length,active:document.querySelector(".ow-wiki-filter-row button[aria-pressed=true]")?.dataset.wikiCategory,url:location.search})');
          if(data.count===3&&data.active==="World"&&data.url.includes("category=World")){filtered=true;break}
          await sleep(85);
        }
        if(!filtered)throw Error("Wiki world category color-coded filter failed");
        await send("Page.navigate",{url:base+"/design/original-works/wiki"});
        let returned=false;
        for(let n=0;n<65;n++){
          if((await readWiki('document.querySelectorAll(".ow-wiki-result").length'))===8){returned=true;break}
          await sleep(110);
        }
        if(!returned)throw Error("Wiki index did not reload with complete curated articles");
      }else{
        if(!state.heading.includes("Ovara")||metadata.category!=="World"||
          !metadata.box||!metadata.links.includes("/design/original-works/wiki/nali-solan")||
          !metadata.links.includes("/design/original-works/wiki/category/world")||
          !metadata.articleTextSize)
          throw Error("Wiki article, infobox or links missing: "+JSON.stringify(metadata));
        if((await readWiki('document.querySelectorAll(".ow-wiki-contents a[href^=\\"#wiki-\\"]").length'))!==4)
          throw Error("Wiki table of contents should expose four article sections");
        if((await readWiki('document.querySelectorAll("#wiki-linked a").length'))<1)
          throw Error("Wiki incoming links did not derive from reviewed relation set");
        const expectedGrid=viewport.width>=1190?3:1;
        if(viewport.width>=1190&&metadata.columns.split(" ").length!==expectedGrid)
          throw Error("Wikipedia-style three-column article grid missing: "+metadata.columns);
        if(viewport.width<=620&&metadata.columns.split(" ").length!==1)
          throw Error("Wiki mobile article grid did not collapse: "+metadata.columns);
      }
    }
    if(name==="original-works-home"&&!state.heading.includes("Somewhere"))
      throw Error("Missing Anevum studio hero");
    if(name==="original-works-atlas") {
      const searchCheck = async expr => (await send("Runtime.evaluate",{expression:expr,returnByValue:true})).result?.value;
      const initial=await searchCheck('document.querySelectorAll(".ow-atlas-card").length');
      if(initial!==8)throw Error("Atlas initial eight opening records missing: "+initial);
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
      if((await searchCheck('document.querySelectorAll(".ow-atlas-card").length'))!==8)
        throw Error("Atlas reset did not restore records");

      // Every newly approved opening-state type must be searchable, filtered,
      // and accessible. A map of worlds must not flatten all articles to World.
      for (const [buttonPosition, expectedCount, label] of [[4,1,"Places"],[5,3,"Infrastructure"],[2,3,"Worlds"],[3,1,"People"]]) {
        await send("Runtime.evaluate",{expression:'document.querySelector(".ow-atlas-filters button:nth-child('+buttonPosition+')")?.click()'});
        let observed=false;
        for(let n=0;n<35;n++){
          const state=await searchCheck('({count:document.querySelectorAll(".ow-atlas-card").length,active:[...document.querySelectorAll(".ow-atlas-filters button[aria-pressed=true]")].map(x=>x.textContent)})');
          if(state?.count===expectedCount&&state.active?.length===1&&state.active[0]===label){observed=true;break}
          await sleep(90);
        }
        if(!observed)throw Error("Atlas "+label+" filter failed");
      }
      await send("Runtime.evaluate",{expression:'document.querySelector(".ow-atlas-filters button:first-child")?.click()'});
      for(let n=0;n<30;n++){
        if((await searchCheck('document.querySelectorAll(".ow-atlas-card").length'))===8)break;
        await sleep(90);
      }
      if((await searchCheck('document.querySelectorAll(".ow-atlas-card").length'))!==8)
        throw Error("Atlas all-records filter did not restore curated selection");
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

      // Verify independent direct access to the newly curated setting/technology
      // articles, not only the original four records on the directory.
      for(const [slug,title] of [
        ["merva","Merva"],
        ["serein-skygate","Serein Skygate"],
        ["neral-skygate","Neral Skygate"],
        ["open-road","Open Road"]
      ]) {
        const full="/design/original-works/atlas/"+slug;
        await send("Page.navigate",{url:base+full});
        let observed;
        for(let n=0;n<65;n++){
          try{
            observed=await read('({path:location.pathname,title:document.querySelector("#ow-atlas-detail-heading")?.textContent||"",robots:document.querySelector("meta[name=\\"robots\\"]")?.content||"",canonical:document.querySelector("link[rel=\\"canonical\\"]")?.href||"",active:document.querySelector(".ow-navigation a[href=\\"/design/original-works/atlas\\"]")?.getAttribute("aria-current")||"",overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1})');
            if(observed?.path===full&&observed.title.includes(title))break;
          }catch{}
          await sleep(95);
        }
        if(observed?.path!==full||!observed.title.includes(title)||!observed.robots.startsWith("noindex")||observed.canonical||observed.active!=="page"||observed.overflow)
          throw Error("New Atlas direct article route failed: "+slug+" "+JSON.stringify(observed));
        if((viewport.name==="desktop"&&slug==="open-road")||(viewport.name==="mobile"&&slug==="merva")){
          const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
          fs.writeFileSync(path.join(output,"original-works-atlas-"+slug+"-"+viewport.name+".png"),Buffer.from(shot.data,"base64"));
        }
      }

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


/**
 * Route-level disabling is insufficient if draft manuscripts or reviewed
 * article text remain downloadable in production chunks or sourcemaps.
 * Reject a default build if any distinctive editorial preview bytes ship.
 */
function assertNoDraftReaderTextInDefaultBuild() {
  const root = path.resolve(process.cwd(), "dist/client");
  if (!fs.existsSync(root)) throw new Error("default dist/client build missing");
  const markers = [
    "Three signals.",
    "The world was already here.",
    "A universe of different starting points.",
    "Merva's streets and neighborhoods mix older canal alignments",
    "Reader orientation only. This entry does not include plot outcomes",
    "An archive of worlds.",
    "Guessing a URL never reveals private or unpublished canon."
  ];
  let examined = 0;
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) { visit(full); continue; }
      if (!entry.isFile() || !/\.(?:js|css|map|html)$/.test(entry.name)) continue;
      examined += 1;
      const bytes = fs.readFileSync(full, "utf8");
      for (const phrase of markers) {
        if (bytes.includes(phrase)) {
          throw new Error("Draft original-works content bundled into default build: " +
            path.relative(root, full) + " (" + phrase.length + "-character marker)");
        }
      }
    }
  };
  visit(root);
  if (!examined) throw new Error("No default-built client files were checked");
  console.log("Default client bundle isolation verified across " + examined + " assets.");
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
  if(process.env.ORIGINAL_WORKS_VERIFY_DISABLED==="1"){
    assertNoDraftReaderTextInDefaultBuild();
    const desktop=viewports[0];
    for(const route of ["/design/original-works","/design/original-works/reply/reading-room","/design/original-works/wiki","/design/original-works/wiki/ovara"])
      await runCase(route,desktop);
    console.log("Default production build gate verified: original-works routes are not mounted.");
  }else{
    for(const viewport of viewports){
      for(const route of ["/design/original-works","/design/original-works/reply","/design/original-works/reply/reading-room","/design/original-works/atlas","/design/original-works/wiki","/design/original-works/wiki/ovara"]){
        if(!viewport.homeOnly||route==="/design/original-works")await runCase(route,viewport);
      }
    }
    console.log("Gated original-works visual QA passed at 1440,390,320,768,1024 px.");
  }
} finally {
  chrome.kill("SIGTERM");await sleep(200);
  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100})}catch{}
}
