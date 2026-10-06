import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const base = process.env.BASE_URL;
if (!base) throw new Error("BASE_URL is required");

const publicRoutes = ["/", "/live", "/architecture", "/research", "/research/multi-market-architecture-equities-crypto", "/founder", "/resume", "/releases"];
const commandRoutes = ["/command/overview", "/command/trading", "/command/research", "/command/system"];
const routes = process.env.PUBLIC_ONLY === "1" ? publicRoutes : [...publicRoutes, ...commandRoutes];
const output = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "anevum-visuals");
fs.mkdirSync(output, {recursive:true});
const viewports = [
  { name: "desktop", width: 1440, height: 1000, mobile: false, deviceScaleFactor: 1 },
  { name: "mobile", width: 390, height: 844, mobile: true, deviceScaleFactor: 1 }
];

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "anevum-browser-qa-"));
const chrome = spawn("google-chrome", [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--remote-debugging-address=127.0.0.1",
  "--remote-debugging-port=0",
  "--no-first-run",
  "--disable-background-networking",
  "--disable-sync",
  "--user-data-dir=" + profile,
  "about:blank"
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let debugPort = null;

async function waitForDebugger() {
  const activePortFile = path.join(profile, "DevToolsActivePort");
  for (let i = 0; i < 200; i += 1) {
    if (chrome.exitCode !== null) {
      throw new Error("Chrome exited before DevTools became ready: " + chrome.exitCode);
    }
    try {
      if (fs.existsSync(activePortFile)) {
        const [port] = fs.readFileSync(activePortFile, "utf8").trim().split(/\r?\n/);
        if (port && /^\d+$/.test(port)) {
          const response = await fetch("http://127.0.0.1:" + port + "/json/version");
          if (response.ok) {
            debugPort = Number(port);
            return;
          }
        }
      }
    } catch {}
    await sleep(100);
  }
  throw new Error("Chrome DevTools endpoint did not become ready after 20 seconds");
}

async function target() {
  if (!debugPort) throw new Error("Chrome DevTools port is unavailable");
  const response = await fetch("http://127.0.0.1:" + debugPort + "/json/new?about:blank", { method: "PUT" });
  if (!response.ok) throw new Error("Could not create browser QA target");
  return response.json();
}

async function closeTarget(id) {
  try {
    if (debugPort) await fetch("http://127.0.0.1:" + debugPort + "/json/close/" + id);
  } catch {}
}

async function runCase(route, viewport) {
  const page = await target();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  const runtimeErrors = [];
  let nextId = 1;

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 10000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket open timeout")), 10000);
    ws.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("WebSocket error")); }, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      clearTimeout(item.timer);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message));
      else item.resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      const detail = message.params?.exceptionDetails || {};
      runtimeErrors.push(JSON.stringify({
        message: detail.exception?.description || detail.text || "Runtime exception",
        url: detail.url, line: detail.lineNumber, stack: detail.stackTrace?.callFrames
      }));
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
      const values = (message.params.args || []).map((arg) => arg.value || arg.description || "").join(" ");
      runtimeErrors.push("console.error: " + values);
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile
  });
  if (route.startsWith("/command/")) await send("Page.addScriptToEvaluateOnNewDocument", {source: "(" + "() => {\n    const originalFetch=window.fetch.bind(window);\n    window.fetch=async (input,init={}) => {\n      const url=String(input);\n      if(url.includes(\"/api/command/session\")) return Response.json({authenticated:true,auth_source:\"cloudflare_access\",command_admin:true,email:\"qa@example.test\"});\n      if(url.includes(\"/api/command/iren/status\")) {\n        const at=new Date().toISOString();\n        return Response.json({\n          schema_version:\"iren_command.v2\",revision:42,observed_at:at,stale:false,state:\"DEGRADED\",action_required:true,\n          topology:{services:[\"IREN\",\"RHEN\",\"GRAEN\",\"NOSTRA\",\"VELUM\"].map(name=>({service_id:name.toLowerCase(),service_name:name+\" runtime\",runtime_kind:name.toLowerCase(),independent_runtime:true,status:name===\"NOSTRA\"?\"OFFLINE\":name===\"VELUM\"?\"IDLE\":\"HEALTHY\",liveness:name!==\"NOSTRA\",readiness:name!==\"NOSTRA\",observed_at:at,last_heartbeat_at:at,scope:\"qa\",revision:\"qa-fixture-not-production\",current_activity:{IREN:\"Coordinating observation and evidence.\",RHEN:\"Observing the latest market cycle.\",GRAEN:\"Evaluating retained research evidence.\",NOSTRA:\"Forecast runtime unavailable.\",VELUM:\"Ready for the next replay.\"}[name]})),dependencies:{rhen_core:{status:\"HEALTHY\",last_success:at}}},\n          incidents:[{key:\"service.nostra\",severity:\"warning\",reason:\"Forecast runtime is offline\",opened_at:at}],\n          work:{active_jobs:1,requires_human:1,blocked_objectives:1,objectives:[{owner_system:\"GRAEN\",objective_key:\"qa-research\",title:\"Evaluate retained evidence\",status:\"ACTIVE\",description:\"Review the current evidence window.\",updated_at:at}],jobs:[{owner_system:\"GRAEN\",job_id:\"qa-job\",title:\"BTC V14 R2H evaluation\",status:\"RUNNING\",job_type:\"RESEARCH\",metadata:{stage:\"CRYPTO_BTC_4H_CONSENSUS_V14_R2H_VELUM_REPLAY\",run_id:\"qa-r2h-run\",candidate_id:\"qa-r2h\"},updated_at:at}],job_events:[{event_id:1,job_id:\"qa-job\",event_type:\"RUNNING\",event:{stage:\"CRYPTO_BTC_4H_CONSENSUS_V14_R2H_VELUM_REPLAY\",run_id:\"qa-r2h-run\"},created_at:at,owner_system:\"GRAEN\",objective_key:\"qa-research\",title:\"BTC V14 R2H evaluation\",job_type:\"RESEARCH\"}],commands:[],handoffs:[],next_action:{title:\"Restore forecast observations\"}},\n          research:{graen_problems:[{problem_id:\"qa-problem\",title:\"BTC V14 R2H\",status:\"RUNNING\",research_stage:\"CRYPTO_BTC_4H_CONSENSUS_V14_R2H_VELUM_REPLAY\",candidate_id:\"qa-r2h\",hypothesis:\"4H consensus transfer\",updated_at:at,started_at:at}],graen_runs:[{run_id:\"qa-r2h-run\",problem_id:\"qa-problem\",status:\"RUNNING\",methodology_version:\"btc-4h-consensus-v14-r2h\",started_at:at,created_at:at}],velum_replays:[{status:\"RUNNING\",started_at:at}],graen_runtime:{worker_id:\"qa-graen-worker\",runtime_version:\"qa\",heartbeat_at:at,active_problem_id:\"qa-problem\",queue_depth:0}},\n          btc_canary:{available:true,run_id:\"BTC-CANARY-001-PAPER-20261004\",strategy_version_id:\"BTC-CANARY-001\",paper_only:true,live_execution_authorized:false,promotion_ready:false,research_status:\"NOT_PROMOTED\",evidence_state:\"COLLECTING_OPEN_POSITION\",observed_at:at,decision_at:at,action:\"hold\",reason:\"BTC canary position protected; waiting for frozen R2H exit\",bar_interval:\"4Hour\",strategy_family:\"btc_4h_momentum_or_sma_consensus_experimental_canary\",model_version:\"graen-btc-4h-consensus-v14-r2h\",position_open:true,position_observed_at:at,entry_price:\"121000.00\",current_price:\"122512.50\",current_return_pct:\"0.0125\",risk_stop_pct:\"0.05\",account_observed_at:at,protection_status:\"new\",protection_observed_at:at,signal:{bar_at:at,close:\"123456.78\",momentum_return:\"0.0842\",momentum_positive:true,momentum_lookback_bars:1080,sma:\"118500.00\",above_sma:true,sma_window_bars:1500,desired_long:true,completed_bar_count:12592},recent_cycles:[{at,action:\"hold\",reason:\"BTC canary position protected; waiting for frozen R2H exit\"},{at:new Date(Date.now()-3000).toISOString(),action:\"hold\",reason:\"Frozen R2H consensus remains long\"}],return_history:[{at:new Date(Date.now()-12000).toISOString(),return_pct:\"-0.003\"},{at:new Date(Date.now()-9000).toISOString(),return_pct:\"0.002\"},{at:new Date(Date.now()-6000).toISOString(),return_pct:\"0.007\"},{at,return_pct:\"0.0125\"}]},\n          operator:{state:\"DEGRADED\",message:\"NOSTRA needs attention. Other systems remain observable.\",recent_transitions:[{key:\"service.nostra\",transition:\"INCIDENT_OPENED\",severity:\"warning\",reason:\"Forecast runtime is offline\",created_at:at}]}\n        });\n      }\n      if(url.includes(\"/api/command/\")) return Response.json({});\n      return originalFetch(input,init);\n    };\n  }" + ")()"});
  await send("Page.navigate", { url: base + route });
  await sleep(5000);
  const ops = await send("Runtime.evaluate", {expression: `(() => {
    const surface=document.querySelector("[data-visual-ops]");
    const cards=[...document.querySelectorAll(".vo-system-card, .vo-node, .terminal-lane, .terminal-focus-card, .pt-system-button, .pt-map-card")];
    const visible=el=>el.getBoundingClientRect().width>0;
    return {surface:Boolean(surface), cards:cards.filter(visible).length,
      legacySummaryVisible:[...document.querySelectorAll(".command-stats")].some(visible),
      heading:document.querySelector(".vo-console h1")?.textContent,
      nostra:document.querySelector('[data-system="NOSTRA"]')?.getAttribute("data-state"),
      velum:document.querySelector('[data-system="VELUM"]')?.getAttribute("data-state"),
      velumActivity:document.querySelector('[data-system="VELUM"]')?.getAttribute("data-activity"),
      activeGraen:document.querySelector('[data-system="GRAEN"][data-active]')?.getAttribute("data-active"),
      links:cards.filter(el=>el.tagName==="A").every(el=>el.tabIndex===0&&el.hasAttribute("aria-label")),
      nav:routePlaceholder
    };
  })()`.replace("routePlaceholder", JSON.stringify(route)),returnByValue:true});
  const details=ops.result?.value||{};
  const requiresVisualOpsSurface = route === "/live" || route === "/command/overview" || route === "/command/system";
  const requiresSystemCards = route === "/live" || route === "/command/overview" || route === "/command/system";
  if((requiresVisualOpsSurface && !details.surface) || (requiresSystemCards && (!details.cards || !details.links))) {
    throw new Error("Missing accessible visual surface: "+JSON.stringify(details));
  }
  if(route === "/command/trading" || route === "/command/research") {
    const workspace = await send("Runtime.evaluate", {expression: `({
      pageClass: document.querySelector(".command-shell")?.className || "",
      panels: [...document.querySelectorAll(".command-panel")].filter(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      }).length,
      navCurrent: document.querySelector('.command-header nav a[aria-current="page"]')?.getAttribute("href")
    })`, returnByValue:true});
    const value=workspace.result?.value||{};
    if(!value.panels || value.navCurrent !== route) {
      throw new Error("Canonical Command workspace failed: "+JSON.stringify({route,...value}));
    }
  }

  if(route.startsWith("/products/") && route.split("/").filter(Boolean).length === 2) {
    const iconGeometry = await send("Runtime.evaluate", {expression: `(() => {
      const icon=document.querySelector(".product-hero .vo-card-top .system-icon");
      const mark=icon?.querySelector(".system-mark-svg");
      if(!icon || !mark) return {present:false};
      const a=icon.getBoundingClientRect();
      const b=mark.getBoundingClientRect();
      const style=getComputedStyle(icon);
      return {
        present:true,
        width:Math.round(a.width),
        height:Math.round(a.height),
        overflow:style.overflow,
        markInside:b.left>=a.left-1 && b.top>=a.top-1 && b.right<=a.right+1 && b.bottom<=a.bottom+1
      };
    })()`, returnByValue:true});
    const geometry=iconGeometry.result?.value||{};
    if(!geometry.present || geometry.width!==geometry.height || !geometry.markInside) {
      throw new Error("Subsystem hero icon geometry failed: "+JSON.stringify(geometry));
    }

    const relatedAudit = await send("Runtime.evaluate", {expression: `(() => {
      const failures=[];
      for(const link of document.querySelectorAll(".related-products a")){
        const icon=link.querySelector(":scope > .system-icon");
        const name=link.querySelector(":scope > strong");
        if(!icon||!name) continue;
        const a=icon.getBoundingClientRect();
        const b=name.getBoundingClientRect();
        if(a.left>=b.left || a.right>b.left+2) failures.push({name:name.textContent,iconLeft:Math.round(a.left),iconRight:Math.round(a.right),nameLeft:Math.round(b.left)});
      }
      return failures;
    })()`,returnByValue:true});
    if(relatedAudit.result?.value?.length) throw new Error("Related-system icon placement failed: "+JSON.stringify(relatedAudit.result.value));
  }

  const iconAudit = await send("Runtime.evaluate", {expression: `(() => {
    const visible=el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=="none"&&s.visibility!=="hidden"};
    const failures=[];
    for(const icon of [...document.querySelectorAll(".system-icon")].filter(visible)){
      const mark=icon.querySelector(".system-mark-svg");
      if(!mark) continue;
      const a=icon.getBoundingClientRect();
      const b=mark.getBoundingClientRect();
      const square=Math.abs(a.width-a.height)<=1;
      const inside=b.left>=a.left-1&&b.top>=a.top-1&&b.right<=a.right+1&&b.bottom<=a.bottom+1;
      if(!square||!inside) failures.push({
        system:[...icon.classList].find(value=>value.startsWith("system-icon-")&&!["system-icon-xs","system-icon-sm","system-icon-md","system-icon-lg"].includes(value)),
        width:Math.round(a.width),height:Math.round(a.height),
        mark:{left:Math.round(b.left-a.left),top:Math.round(b.top-a.top),right:Math.round(a.right-b.right),bottom:Math.round(a.bottom-b.bottom)}
      });
    }
    return failures.slice(0,12);
  })()`,returnByValue:true});
  if(iconAudit.result?.value?.length) throw new Error("Visible subsystem icon clipping/sizing failure: "+JSON.stringify(iconAudit.result.value));

  if(route.startsWith("/command/")) {
    const navAudit=await send("Runtime.evaluate",{expression:`(() => {
      const nav=document.querySelector(".command-header nav");
      const links=[...nav?.querySelectorAll("a")||[]].filter(el=>el.getBoundingClientRect().width>0);
      const rects=links.map(el=>{const r=el.getBoundingClientRect();return {label:el.getAttribute("aria-label"),left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}});
      const overlaps=[];
      for(let i=0;i<rects.length;i++) for(let j=i+1;j<rects.length;j++){
        const a=rects[i],b=rects[j];
        if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top) overlaps.push(a.label+" × "+b.label);
      }
      const rows=[...new Set(rects.map(r=>Math.round(r.top)))];
      return {
        count:rects.length,
        labels:rects.map(r=>r.label),
        rows,
        overlaps,
        minWidth:Math.min(...rects.map(r=>r.width)),
        maxRight:Math.max(...rects.map(r=>r.right)),
        viewport:document.documentElement.clientWidth
      };
    })()`,returnByValue:true});
    const nav=navAudit.result?.value||{};
    const canonicalLabels=["Overview","Trading","Research","System"];
    const labelsMatch=Array.isArray(nav.labels)&&canonicalLabels.every((label,index)=>nav.labels[index]===label);
    if(nav.count!==4||!labelsMatch||nav.overlaps?.length||nav.minWidth<44||nav.maxRight>nav.viewport+1||nav.rows?.length!==1){
      throw new Error("Command icon navigation geometry failed: "+JSON.stringify(nav));
    }
  }

  if(route==="/architecture") {
    const architectureGeometry = await send("Runtime.evaluate", {expression: `(() => {
      const grid=document.querySelector(".architecture-role-grid");
      if(!grid) return {present:false,cards:0,missingIcons:[],collapsedCards:[],labels:[]};
      const cards=[...grid.querySelectorAll(":scope > a")];
      const missingIcons=[];
      const collapsedCards=[];
      const labels=[];
      for(const card of cards) {
        const rect=card.getBoundingClientRect();
        const icon=card.querySelector(".system-icon");
        const ir=icon?.getBoundingClientRect();
        const style=icon ? getComputedStyle(icon) : null;
        const label=card.querySelector("strong")?.textContent?.trim() || "";
        labels.push(label);
        if(rect.width<140 || rect.height<120) collapsedCards.push(label || "module");
        if(!icon || !ir || ir.width<20 || ir.height<20 || style?.display==="none" || style?.visibility==="hidden") {
          missingIcons.push(label || "module");
        }
      }
      return {present:true,cards:cards.length,missingIcons,collapsedCards,labels};
    })()`, returnByValue:true});
    const architecture=architectureGeometry.result?.value||{};
    const required=["EXECUTION","CONTROL","RESEARCH","REPLAY","FORECAST","CORE / STORE","RESEARCH WORKER","COMMAND / API"];
    const missingLabels=required.filter((label)=>!(architecture.labels||[]).includes(label));
    if(!architecture.present || architecture.cards!==8 || architecture.missingIcons?.length || architecture.collapsedCards?.length || missingLabels.length) {
      throw new Error("RHEN v3 architecture geometry/icon failure: "+JSON.stringify({...architecture,missingLabels}));
    }
  }

  if(route==="/command/terminal") {
    const terminalAudit=await send("Runtime.evaluate",{expression:`(() => ({
      terminal:Boolean(document.querySelector(".operations-terminal")),
      focusCards:document.querySelectorAll(".terminal-focus-card").length,
      lanes:document.querySelectorAll(".terminal-lane").length,
      workingFocus:document.querySelectorAll(".terminal-focus-card.is-working").length,
      canary:Boolean(document.querySelector(".terminal-canary.is-available")),
      canaryTitle:document.querySelector(".terminal-canary h2")?.textContent,
      canarySafeguards:[...document.querySelectorAll(".terminal-canary-authority b")].map(el=>el.textContent),
      canaryPipelineNodes:document.querySelectorAll(".terminal-canary-node").length,
      canaryCycles:document.querySelectorAll(".terminal-canary-cycles li:not(.terminal-canary-empty)").length,
      canaryChart:Boolean(document.querySelector(".terminal-canary-spark svg")),
      canaryOverflow:(()=>{const el=document.querySelector(".terminal-canary");return el?el.scrollWidth>el.clientWidth+1:false})(),
      streamRows:document.querySelectorAll(".terminal-stream li").length
    }))()`,returnByValue:true});
    const terminal=terminalAudit.result?.value||{};
    const safeguards=terminal.canarySafeguards||[];
    if(!terminal.terminal||terminal.focusCards!==2||terminal.lanes!==5||terminal.workingFocus<2||!terminal.canary||terminal.canaryTitle!=="BTC-CANARY-001"||terminal.canaryPipelineNodes!==5||terminal.canaryCycles<2||!terminal.canaryChart||terminal.canaryOverflow||!safeguards.includes("PAPER ONLY")||!safeguards.includes("LIVE DISABLED")||!safeguards.includes("NOT PROMOTED")||terminal.streamRows<3){
      throw new Error("Live operations terminal fixture failed: "+JSON.stringify(terminal));
    }
  }

  if(route==="/command/overview" && details.legacySummaryVisible) throw new Error("Legacy trading strip obscures fleet overview");
  if(route==="/command/overview" && (details.nostra!=="OFFLINE" || details.velum!=="HEALTHY" || details.velumActivity!=="IDLE" || details.activeGraen!=="true")) throw new Error("Health/activity rendering failed: "+JSON.stringify(details));
  if(route.startsWith("/command/")) {
    await send("Runtime.evaluate",{expression:'document.querySelector(".vo-details summary")?.click()'});
    await send("Runtime.evaluate",{expression:'document.querySelector(".vo-details summary")?.click()'});
  }
  const focus = await send("Runtime.evaluate",{expression:`(() => {
    const link=[...document.querySelectorAll(".vo-node, a.vo-system-card")].find(el=>el.getBoundingClientRect().width>0);
    if(!link) return true;
    link.focus();
    const good=document.activeElement===link && parseFloat(getComputedStyle(link).outlineWidth)>=2;
    link.blur(); return good;
  })()`,returnByValue:true});
  if(!focus.result?.value) throw new Error("System card keyboard focus is not visible");
  const screenshot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  fs.writeFileSync(path.join(output,"visual-"+(route.slice(1).replaceAll("/","-")||"home")+"-"+viewport.name+".png"),Buffer.from(screenshot.data,"base64"));
  if(route==="/") {
    await send("Runtime.evaluate",{expression:'document.querySelector(".vo-public-status")?.scrollIntoView({block:"start"})'});
    await sleep(300);
    const systems=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    fs.writeFileSync(path.join(output,"visual-home-systems-"+viewport.name+".png"),Buffer.from(systems.data,"base64"));
    await send("Runtime.evaluate",{expression:"window.scrollTo(0,0)"});
  }
  await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  const motion=await send("Runtime.evaluate",{expression:`[...document.querySelectorAll(".vo-console *, .vo-public-status *, .public-terminal-page *")].filter(el=>getComputedStyle(el).animationName!=="none" && getComputedStyle(el).animationDuration!=="0s").length`,returnByValue:true});
  if(motion.result?.value) throw new Error("Reduced motion left animations running: "+motion.result.value);
  const result = await send("Runtime.evaluate", {
    expression: `(() => {
      const root = document.documentElement;
      const body = document.body;
      const offenders = [...document.querySelectorAll("*")].filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > root.clientWidth + 1 || rect.left < -1;
      }).slice(0, 12).map((el) => ({
        tag: el.tagName,
        className: String(el.className || "").slice(0, 120),
        left: Math.round(el.getBoundingClientRect().left),
        right: Math.round(el.getBoundingClientRect().right)
      }));
      return {
        title: document.title,
        rootClientWidth: root.clientWidth,
        rootScrollWidth: root.scrollWidth,
        bodyScrollWidth: body ? body.scrollWidth : 0,
        overflow: root.scrollWidth > root.clientWidth + 1 || (body && body.scrollWidth > root.clientWidth + 1),
        offenders
      };
    })()`,
    returnByValue: true
  });

  const value = result.result?.value || {};
  const failures = [];
  if (value.overflow) {
    failures.push("horizontal overflow " + JSON.stringify(value));
  }
  if (runtimeErrors.length) {
    failures.push("runtime errors " + JSON.stringify(runtimeErrors));
  }

  console.log(JSON.stringify({ route, viewport: viewport.name, ...value, runtimeErrors }));
  ws.close();
  await closeTarget(page.id);
  return failures;
}


async function runScrollResetCase(viewport) {
  const page = await target();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 1;

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 10000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket open timeout")), 10000);
    ws.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("WebSocket error")); }, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const item = pending.get(message.id);
    clearTimeout(item.timer);
    pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message));
    else item.resolve(message.result);
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile
  });
  await send("Page.navigate", { url: base + "/research" });
  await sleep(5000);

  const result = await send("Runtime.evaluate", {
    expression: `(async () => {
      const scroller = document.scrollingElement || document.documentElement;
      const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: Math.min(1200, maxScroll), left: 0, behavior: "auto" });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const before = scroller.scrollTop;
      root.style.scrollBehavior = previousScrollBehavior;
      const link = document.querySelector('a[href="/architecture"]');
      if (!link) return { ok: false, reason: "architecture link missing", before, maxScroll, pathname: location.pathname, after: scroller.scrollTop };
      link.click();

      const deadline = Date.now() + 5000;
      while (
        (location.pathname !== "/architecture" || scroller.scrollTop > 1) &&
        Date.now() < deadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        ok: location.pathname === "/architecture" && before > 200 && scroller.scrollTop <= 1,
        before,
        after: scroller.scrollTop,
        maxScroll,
        pathname: location.pathname
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const value = result.result?.value || {};
  console.log(JSON.stringify({ case: "route-scroll-reset", viewport: viewport.name, ...value }));
  ws.close();
  await closeTarget(page.id);
  return value.ok ? [] : ["route navigation did not reset scroll to top " + JSON.stringify(value)];
}

let failures = [];
try {
  await waitForDebugger();
  for (const viewport of viewports) {
    failures = failures.concat((await runScrollResetCase(viewport)).map((item) => viewport.name + " scroll-reset: " + item));
    for (const route of routes) {
      failures = failures.concat((await runCase(route, viewport)).map((item) => viewport.name + " " + route + ": " + item));
    }
  }
} finally {
  chrome.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => {
      if (chrome.exitCode !== null) resolve();
      else chrome.once("exit", resolve);
    }),
    sleep(2000)
  ]);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    // The GitHub runner is ephemeral; cleanup must never turn a passed browser QA into a failure.
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Browser runtime QA passed: no horizontal overflow, JavaScript runtime errors, or route scroll-restoration regressions.");
