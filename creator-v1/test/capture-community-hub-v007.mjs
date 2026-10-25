// ANEVUM Community V007 compiled UI acceptance. Offline loopback fixture only.
// SYNTHETIC OFFLINE records may be present; never confuse captures with real users.
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, timeout = 22000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { const result = await fn(); if (result) return result; } catch {}
    await delay(150);
  }
  throw Error("V007_BROWSER_TIMEOUT");
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url), pending = new Map();
    let id = 0;
    ws.addEventListener("open", () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const key = ++id;
          pending.set(key, { res, rej });
          ws.send(JSON.stringify({ id: key, method, params }));
        });
      },
      close() { ws.close(); }
    }), { once: true });
    ws.addEventListener("message", ({ data }) => {
      const result = JSON.parse(String(data));
      if (typeof result.id !== "number") return;
      const handler = pending.get(result.id);
      if (!handler) return;
      pending.delete(result.id);
      result.error ? handler.rej(Error(result.error.message)) : handler.res(result.result || {});
    });
    ws.addEventListener("error", () => reject(Error("V007_CDP_CONNECT")), { once: true });
    ws.addEventListener("close", () => {
      for (const handler of pending.values()) handler.rej(Error("V007_CDP_CLOSED"));
      pending.clear();
    });
  });
}

const args = process.argv.slice(2);
const option = key => { const at = args.indexOf(key); return at < 0 ? null : args[at + 1]; };
const chrome = option("--chrome"), base = option("--base"), output = option("--output");
if (!chrome || !output || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base || ""))
  throw Error("V007 requires a Chrome binary and a loopback-only fixture");
mkdirSync(output, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "anevum-community-v007-"));
const child = spawn(chrome, [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
  "--disable-background-networking", "--remote-allow-origins=*",
  "--remote-debugging-port=0", "--no-first-run", "--user-data-dir=" + profile,
  "about:blank"
], { stdio: ["ignore","ignore","pipe"] });
let chromeStderr="", chromeSpawnError=null;
child.stderr?.on("data", chunk => { chromeStderr=(chromeStderr+String(chunk)).slice(-8192); });
child.on("error", error => { chromeSpawnError=error; });
let client = null;
try {
  // Browser startup receives a larger budget on heavily loaded hosted runners.
  // All viewport, screenshot and interaction assertions retain their limits.
  let port;
  try {
    port=await until(()=>{
      const file=join(profile,"DevToolsActivePort");
      if (!existsSync(file)) return null;
      const value=readFileSync(file,"utf8").split("\n")[0];
      return /^\d+$/.test(value)?value:null;
    },60000);
  } catch(error) {
    throw Error("V007_CHROMIUM_STARTUP: "+(chromeSpawnError?.message||
      (child.exitCode!==null?"exit="+child.exitCode:"missing DevTools port"))+
      " / stderr="+chromeStderr.slice(-1600),{cause:error});
  }
  const debuggerUrl = await until(async () => {
    const response = await fetch("http://127.0.0.1:" + port + "/json/list");
    if (!response.ok) return null;
    const pages = await response.json();
    return pages.find(page => page.type === "page" && page.webSocketDebuggerUrl)?.webSocketDebuggerUrl || null;
  });
  client = await connect(debuggerUrl);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  const evaluate = async expression => {
    const result = await client.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true
    });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text || "V007_BROWSER_EVALUATE");
    return result.result?.value;
  };
  async function screenshot(name, width) {
    const response = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    if (!response.data) throw Error("V007_SCREENSHOT_EMPTY");
    writeFileSync(join(output, name + "-" + width + ".png"), Buffer.from(response.data, "base64"));
  }
  for (const [width, height] of [[1440, 900], [1024, 768], [390, 844], [320, 720]]) {
    await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 641 });
    await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await client.send("Page.navigate", { url: base + "/creator/community" });
    await until(() => evaluate('document.readyState==="complete" && !!document.querySelector(".ch7-hub")'));
    await until(() => evaluate('(()=>{const n=document.querySelector(".ch7-status strong");return !!n && n.textContent!=="—" && !!document.querySelector(".ch7-tabs button")})()'));
    await delay(450);
    const state = await evaluate('(()=>({title:document.querySelector(".ch7-hero h1")?.textContent,tabs:document.querySelectorAll(".ch7-tabs button").length,columns:!!document.querySelector(".ch7-columns"),native:!!document.querySelector(".ch7-hero-copy")&&!document.querySelector(".ch7-hero-art img"),retiredImages:document.querySelectorAll(".ch7-hero-art img").length,overflow:document.documentElement.scrollWidth>innerWidth+1,iframe:document.querySelectorAll("iframe").length}))()');
    await screenshot("community-v007-top", width);
    if (state.overflow) {
      const offenders = await evaluate('([...document.querySelectorAll("body *")].map(el=>({name:el.tagName.toLowerCase()+"."+String(el.className).slice(0,70),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)})).filter(x=>x.left< -1||x.right>innerWidth+1).slice(0,25))');
      console.log("V007_OVERFLOW_OFFENDERS_" + width + "=" + JSON.stringify(offenders));
    }
    if (!state.title?.includes("Made by people") || state.tabs !== 4 || !state.columns ||
        !state.native || state.retiredImages!==0 || state.overflow || state.iframe)
      throw Error("V007_COMMUNITY_LAYOUT_" + width + ":" + JSON.stringify(state));

    await evaluate('document.querySelector(".ch7-tabs button:nth-child(2)").click()');
    await until(() => evaluate('document.querySelector(".ch7-tabs button:nth-child(2)")?.getAttribute("aria-pressed")==="true"'));
    await evaluate('document.querySelector(".ch7-tabs-row").scrollIntoView({block:"start"})');
    await delay(350);
    if (await evaluate('document.documentElement.scrollWidth>innerWidth+1')) throw Error("V007_PROJECTS_OVERFLOW_" + width);
    const artFrame = await evaluate('(()=>{const link=document.querySelector(".ch7-entry-art"),image=link?.querySelector(".av136-project-thumbnail");if(!link||!image)return null;const a=link.getBoundingClientRect(),b=image.getBoundingClientRect();return {width:a.width,artWidth:b.width,height:a.height,artHeight:b.height,loaded:image.complete&&image.naturalWidth>0,type:image.dataset.thumbnailKind,source:image.dataset.thumbnailSource}})()');
    if (!artFrame || !artFrame.loaded || artFrame.type!=="games" || artFrame.source!=="default" || Math.abs(artFrame.width-artFrame.artWidth)>2 || Math.abs(artFrame.height-artFrame.artHeight)>2)
      throw Error("V007_PROJECT_ART_COVER_" + width + ":" + JSON.stringify(artFrame));
    await screenshot("community-v007-projects", width);

    await evaluate('document.querySelector(".ch7-tabs button:nth-child(3)").click()');
    await until(() => evaluate('document.querySelector(".ch7-tabs button:nth-child(3)")?.getAttribute("aria-pressed")==="true"'));
    await screenshot("community-v007-discussions", width);

    await evaluate('document.querySelector(".ch7-tabs button:nth-child(4)").click()');
    await until(() => evaluate('document.querySelector(".ch7-tabs button:nth-child(4)")?.getAttribute("aria-pressed")==="true"'));
    if (await evaluate('document.documentElement.scrollWidth>innerWidth+1')) throw Error("V007_PEOPLE_OVERFLOW_" + width);
    await screenshot("community-v007-people", width);

    // V115 HOME: inspect the real compiled discovery-first homepage, not
    // the obsolete game-first V079 featured card. Fixture projects remain
    // available through Discover, including the unpromoted temporary game.
    await client.send("Page.navigate", {url:base+"/creator/"});
    await until(()=>evaluate('document.readyState==="complete"&&!!document.querySelector(".av115-wayfinder")&&!!document.querySelector(".av115-public-index")&&document.querySelectorAll(".av115-gateway").length===4'));
    const signature=await evaluate('(()=>{const records=[...document.querySelectorAll(".av115-public-item")],first=records[0],card=first?.querySelector("[data-player-card=v078]"),hero=document.querySelector(".av115-arrival"),member=document.querySelector(".av115-gateway-member");return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,headline:hero?.querySelector("h1")?.textContent,primary:hero?.querySelector(".av79-hero-actions a")?.getAttribute("href"),gateways:document.querySelectorAll(".av115-gateway").length,member:member?.getAttribute("href"),records:records.length,firstTitle:first?.querySelector("h3")?.textContent||null,creator:card?.querySelector(".av61-member-name")?.textContent||null,channel:card?card.classList.contains("av65-player-card--channel"):null,unearnedLevel:!!card?.querySelector(".av61-specimen,.av61-level-label"),featuredGame:!!document.querySelector(".av79-feature"),oldModules:document.querySelectorAll(".av73-world-deck,.av11-live-index,.av6-community-index").length,watermark:getComputedStyle(document.body,"::after").content.includes("SYNTHETIC OFFLINE REVIEW")};})()');
    if(signature.overflow||!signature.headline?.includes("A universe")||
       !signature.primary?.endsWith("/discover")||signature.gateways!==4||
       !signature.member?.endsWith("/join")||signature.featuredGame||
       signature.unearnedLevel||signature.oldModules||!signature.watermark||
       (signature.creator&&!signature.channel))
      throw Error("V115_HOME_DISCOVERY_"+width+":"+JSON.stringify(signature));
    await screenshot("v079-home-creator",width); // Historical artifact name required by wider CI.
    await screenshot("v115-home-discovery",width);
    await evaluate('document.querySelector(".av9-menu-trigger").click()');
    await until(()=>evaluate('document.querySelector(".av79-navigation[open]")?.querySelectorAll(".av79-destination").length===4'));
    const navigation=await evaluate('(()=>{const dialog=document.querySelector(".av79-navigation[open]");return {open:!!dialog,links:dialog?.querySelectorAll(".av79-destination").length,categoryArtwork:dialog?.querySelectorAll("img,.cw-artwork,canvas").length,overflow:dialog?.scrollWidth>dialog?.clientWidth+1}})()');
    if(!navigation.open||navigation.links!==4||navigation.categoryArtwork||navigation.overflow)
      throw Error("V079_WAYFINDER_COMMUNITY_"+width+":"+JSON.stringify(navigation));
    await screenshot("v079-wayfinder-community",width);
    console.log("V115_HOME_DISCOVERY_"+width+"="+JSON.stringify(signature));
    console.log("COMMUNITY_V007_BROWSER_" + width + "=" + JSON.stringify(state));
  }
  writeFileSync(join(output, "capture-status.txt"),
    "COMMUNITY_V007_BROWSER_CAPTURE=PASS\nAll records in these screenshots are offline synthetic review fixtures, not live user activity. No staff, member, D1 or production mutations.\n");
} finally {
  // Preserve the actual Chrome launch error without relaxing QA assertions.
  writeFileSync(join(output,"chromium-startup.log"),chromeStderr.slice(-8192));
  try{if(client)await client.send("Browser.close");}catch{}
  client?.close();
  if(child.exitCode===null){
    const exited=new Promise(resolve=>child.once("exit",resolve));
    child.kill("SIGTERM");
    await Promise.race([exited,delay(2000)]);
    if(child.exitCode===null){child.kill("SIGKILL");await Promise.race([exited,delay(1000)]);}
  }
  try{rmSync(profile, { recursive: true, force: true, maxRetries:5, retryDelay:200 });}
  catch(error){if(!["ENOTEMPTY","EBUSY"].includes(error.code))throw error;console.warn("Temporary browser profile cleanup deferred:",error.code);}
}
