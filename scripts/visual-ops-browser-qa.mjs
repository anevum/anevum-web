import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const base = process.env.BASE_URL;
if (!base) throw new Error("BASE_URL is required");

const publicRoutes = ["/", "/communities", "/learn", "/sign-in", "/products", "/feed", "/products/rhen", "/products/rhen/evidence", "/products/rhen/architecture", "/field-notes", "/field-notes/prediction-outcome-evidence-chain", "/about", "/resume", "/products/rhen/releases", "/me", "/privacy", "/terms"];
const commandRoutes = ["/command/rhen/operate", "/command/rhen/discover", "/command/rhen/review", "/command/rhen/public", "/command/rhen/system"];
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
  for (let i = 0; i < 600; i += 1) {
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
  throw new Error(
    "Chrome DevTools endpoint did not become ready after 60 seconds; " +
    "profile entries=" + fs.readdirSync(profile).join(",")
  );
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
  await send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  if (route.startsWith("/command/")) await send("Page.addScriptToEvaluateOnNewDocument", {source: "(" + "() => {\n    const originalFetch=window.fetch.bind(window);\n    window.fetch=async (input,init={}) => {\n      const url=String(input);\n      if(url.includes(\"/api/command/session\")) return Response.json({authenticated:true,auth_source:\"cloudflare_access\",command_admin:true,email:\"qa@example.test\"});\n      if(url.includes(\"/api/command/iren/status\")) {\n        const at=new Date().toISOString();\n        return Response.json({\n          schema_version:\"iren_command.v2\",revision:42,observed_at:at,stale:false,state:\"HEALTHY\",action_required:false,\n          topology:{services:[\"IREN\",\"RHEN\",\"GRAEN\",\"NOSTRA\",\"VELUM\"].map(name=>({service_id:name.toLowerCase(),service_name:name+\" runtime\",runtime_kind:name.toLowerCase(),independent_runtime:false,status:[\"GRAEN\",\"NOSTRA\",\"VELUM\"].includes(name)?\"IDLE\":\"HEALTHY\",liveness:true,readiness:true,observed_at:at,last_heartbeat_at:at,scope:\"qa\",revision:\"qa-fixture-not-production\",current_activity:{IREN:\"Coordinating deterministic control.\",RHEN:\"Observing the latest market cycle.\",GRAEN:\"On-demand research idle.\",NOSTRA:\"Embedded forecast loop healthy.\",VELUM:\"On-demand replay idle.\"}[name]})),dependencies:{rhen_core:{status:\"HEALTHY\",last_success:at}}},\n          incidents:[],\n          work:{active_jobs:0,requires_human:0,blocked_objectives:0,objectives:[],jobs:[],job_events:[],commands:[],handoffs:[],next_action:{title:\"No bounded research work queued\"}},\n          research:{graen_problems:[],graen_runs:[],velum_replays:[],graen_runtime:{worker_id:null,runtime_version:\"on-demand\",heartbeat_at:null,active_problem_id:null,queue_depth:0}},\n          operator:{state:\"HEALTHY\",message:\"No operator action required.\",recent_transitions:[]}\n        });\n      }\n      if(url.includes(\"/api/command/\")) return Response.json({});\n      return originalFetch(input,init);\n    };\n  }" + ")()"});
  await send("Page.navigate", { url: base + route });

  // Lazy public routes and Cloudflare asset propagation are asynchronous.
  // Assert only after the requested route is actually hydrated.
  const routeReadyDeadline = Date.now() + 12000;
  let routeReady = {};
  while (Date.now() < routeReadyDeadline) {
    try {
      const result = await send("Runtime.evaluate", {
        expression: `(() => {
          const pathReady = location.pathname === ${JSON.stringify(route)};
          const suspenseReady = !document.querySelector(".route-loader");
          const homeReady = ${JSON.stringify(route)} !== "/" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".global-header"));\n          const productsReady = ${JSON.stringify(route)} !== "/products" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-project"));\n          const feedReady = ${JSON.stringify(route)} !== "/feed" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".post-list .post"));\n          const rhenReady = ${JSON.stringify(route)} !== "/products/rhen" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-page .c2-truth"));
          const liveReady = ${JSON.stringify(route)} !== "/products/rhen/evidence" || Boolean(document.querySelector('[data-visual-ops="public-terminal"]'));
          const architectureReady = ${JSON.stringify(route)} !== "/products/rhen/architecture" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-page .c2-grid .c2-card"));
          const researchReady = ${JSON.stringify(route)} !== "/field-notes" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-page .c2-note"));
          const fieldNoteReady = !${JSON.stringify(route)}.startsWith("/field-notes/") || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-article .c2-method"));
          const aboutReady = ${JSON.stringify(route)} !== "/about" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-about"));
          const resumeReady = ${JSON.stringify(route)} !== "/resume" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-resume .c2-card"));
          const releasesReady = ${JSON.stringify(route)} !== "/products/rhen/releases" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-stack .c2-card"));
          const memberReady = ${JSON.stringify(route)} !== "/me" || Boolean(document.querySelector(".member-command"));
          const legalReady = !["/privacy", "/terms"].includes(${JSON.stringify(route)}) || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-legal .member-legal"));
          const commandReady = !${JSON.stringify(route)}.startsWith("/command/") || Boolean(document.querySelector(".command-v4"));
          const extraReady = !["/communities", "/learn", "/sign-in"].includes(${JSON.stringify(route)}) || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-page"));
          return {ready:pathReady && suspenseReady && homeReady && productsReady && feedReady && rhenReady && liveReady && architectureReady && researchReady && fieldNoteReady && aboutReady && resumeReady && releasesReady && memberReady && legalReady && commandReady && extraReady,
            pathname:location.pathname,title:document.title,suspenseReady,homeReady,productsReady,feedReady,rhenReady,liveReady,architectureReady,researchReady,fieldNoteReady,aboutReady,resumeReady,releasesReady,commandReady};
        })()`,
        returnByValue:true
      });
      routeReady = result.result?.value || {};
      if (routeReady.ready) break;
    } catch {
      // A navigation can replace the execution context between polls.
    }
    await sleep(125);
  }
  if (!routeReady.ready) {
    await send("Page.reload", {ignoreCache:true});
    await sleep(2500);
    const result = await send("Runtime.evaluate", {
      expression: `(() => {
        const pathReady = location.pathname === ${JSON.stringify(route)};
        const suspenseReady = !document.querySelector(".route-loader");
        const homeReady = ${JSON.stringify(route)} !== "/" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".global-header"));\n          const productsReady = ${JSON.stringify(route)} !== "/products" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-project"));\n          const feedReady = ${JSON.stringify(route)} !== "/feed" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".post-list .post"));\n          const rhenReady = ${JSON.stringify(route)} !== "/products/rhen" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-page .c2-truth"));
        const liveReady = ${JSON.stringify(route)} !== "/products/rhen/evidence" || Boolean(document.querySelector('[data-visual-ops="public-terminal"]'));
        const architectureReady = ${JSON.stringify(route)} !== "/products/rhen/architecture" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-page .c2-grid .c2-card"));
        const researchReady = ${JSON.stringify(route)} !== "/field-notes" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-page .c2-note"));
        const fieldNoteReady = !${JSON.stringify(route)}.startsWith("/field-notes/") || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-article .c2-method"));
        const aboutReady = ${JSON.stringify(route)} !== "/about" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-about"));
        const resumeReady = ${JSON.stringify(route)} !== "/resume" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-resume .c2-card"));
          const releasesReady = ${JSON.stringify(route)} !== "/products/rhen/releases" || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-stack .c2-card"));
        const memberReady = ${JSON.stringify(route)} !== "/me" || Boolean(document.querySelector(".member-command"));
        const legalReady = !["/privacy", "/terms"].includes(${JSON.stringify(route)}) || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-legal .member-legal"));
        const commandReady = !${JSON.stringify(route)}.startsWith("/command/") || Boolean(document.querySelector(".command-v4"));
          const extraReady = !["/communities", "/learn", "/sign-in"].includes(${JSON.stringify(route)}) || Boolean(document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-page"));
        return {ready:pathReady && suspenseReady && homeReady && productsReady && feedReady && rhenReady && liveReady && architectureReady && researchReady && fieldNoteReady && aboutReady && resumeReady && releasesReady && memberReady && legalReady && commandReady && extraReady,
          pathname:location.pathname,title:document.title,suspenseReady,homeReady,productsReady,feedReady,rhenReady,liveReady,architectureReady,researchReady,fieldNoteReady,aboutReady,resumeReady,releasesReady,commandReady};
      })()`,
      returnByValue:true
    });
    routeReady = result.result?.value || {};
  }
  if (!routeReady.ready) throw new Error("Route did not hydrate before visual assertion: "+JSON.stringify({route,...routeReady}));

  // Stage 1 Commons parity checks: test geometry of the *rendered React app*
  // (inside its isolated ShadowRoot), not a descriptive concept image.
  if (route === "/") {
    const reply = await send("Runtime.evaluate", {expression:`(() => {
      const host = document.querySelector(".anevum-commons-v5-mount");
      const root = host?.shadowRoot;
      const header = root?.querySelector(".global-header");
      const left = root?.querySelector(".left-sidebar");
      const center = root?.querySelector(".main");
      const right = root?.querySelector(".right-sidebar");
      const mobile = root?.querySelector(".mobile-nav");
      const posts = root?.querySelectorAll(".post") || [];
      const isVisible = el => { if (!el || getComputedStyle(el).display === "none") return false; const rect=el.getBoundingClientRect(); return rect.width > 0 && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight; };
      const width = el => Math.round(el?.getBoundingClientRect().width || 0);
      const createGlyph=root?.querySelector(".mobile-create .ico");
      const createStyle=createGlyph ? getComputedStyle(createGlyph) : null;
      const createGlyphPaintWidth=createGlyph && createStyle ?
        Math.round(createGlyph.getBoundingClientRect().width -
          parseFloat(createStyle.paddingLeft||"0") - parseFloat(createStyle.paddingRight||"0")) : 0;
      return {
        isolated: Boolean(host && root && !document.querySelector(".global-header")),
        headerHeight: Math.round(header?.getBoundingClientRect().height || 0),
        leftWidth: width(left), centerWidth: width(center), rightWidth: width(right),
        leftVisible: isVisible(left), rightVisible: isVisible(right),
        mobileVisible: isVisible(mobile), createGlyphPaintWidth, postCount: posts.length,
        hasAuthenticNotes: Boolean(root?.querySelector('[href*="field-notes/anevum-lean-runtime-reset"]')),
        containsFiction: /Mara Cole|Eli Rowan|184 votes|sample community/i.test(root?.textContent || "")
      };
    })()`,returnByValue:true});
    const ui=reply.result?.value||{};
    const desktop=viewport.width>=1200;
    if(!ui.isolated || ui.postCount<6 || !ui.hasAuthenticNotes || ui.containsFiction ||
      !ui.headerHeight || (desktop && (Math.abs(ui.headerHeight-64)>2 || !ui.leftVisible || !ui.rightVisible ||
        Math.abs(ui.leftWidth-252)>4 || Math.abs(ui.rightWidth-312)>4 || ui.centerWidth<500)) ||
      (!desktop && viewport.width<721 && (!ui.mobileVisible || ui.rightVisible || ui.leftVisible ||
        ui.createGlyphPaintWidth<14))) {
      throw new Error("Commons V5 rendered-app parity failed: "+JSON.stringify({viewport:viewport.name,...ui}));
    }

    // Verify that the real React state drives the ShadowRoot design tokens.
    // Reset preferences before screenshot capture to retain a stable baseline.
    const behavior=await send("Runtime.evaluate", {expression:`(async()=>{
      const host=document.querySelector(".anevum-commons-v5-mount");
      const root=host?.shadowRoot;
      const wait=()=>new Promise(resolve=>setTimeout(resolve,140));
      const launch=root?.querySelector(".design-launch");
      if(!launch) return {ok:false,reason:"Missing appearance button"};
      launch.click();
      await wait();
      const carbon=[...root.querySelectorAll(".theme-option")].find(button=>button.textContent.includes("Carbon"));
      if(!carbon) return {ok:false,reason:"Missing Carbon palette control"};
      carbon.click();
      await wait();
      const changedTheme=host.getAttribute("data-theme")==="carbon";
      root.querySelector('[aria-label="Compact feed"]')?.click();
      await wait();
      const changedDensity=host.getAttribute("data-density")==="compact";
      root.querySelector(".reset-design")?.click();
      await wait();
      const resetDefaults=host.getAttribute("data-theme")==="midnight"&&host.getAttribute("data-density")==="comfortable";
      root.querySelector('[aria-label="Close appearance settings"]')?.click();
      await wait();
      const fontSize=parseFloat(getComputedStyle(root.querySelector(".post-title")).fontSize);
      return {ok:changedTheme&&changedDensity&&resetDefaults&&fontSize>=15,changedTheme,changedDensity,resetDefaults,fontSize,closed:!root.querySelector(".design-panel")};
    })()`,awaitPromise:true,returnByValue:true});
    if(!behavior.result?.value?.ok || !behavior.result?.value?.closed) {
      throw new Error("Commons V5 appearance controls failed: "+JSON.stringify(behavior.result?.value));
    }
  }

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
  if(route === "/products/rhen/evidence" && (!details.surface || !details.cards || !details.links)) {
    throw new Error("Missing accessible public visual surface: "+JSON.stringify(details));
  }

  if(route.startsWith("/command/")) {
    const workspace = await send("Runtime.evaluate", {expression: `(() => {
      const visible = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      };
      const active = document.querySelector(".command-v4-header nav a.active");
      return {
        root: visible(".command-v4"),
        readablePage: getComputedStyle(document.querySelector(".command-v4")).position === "relative" && getComputedStyle(document.querySelector(".command-v4"), "::after").display === "none",
        heading: document.querySelector(".command-v4-heading h1")?.textContent?.trim() || "",
        navCurrent: active?.getAttribute("href") || "",
        operate: visible(".command-v4-operate .command-v4-strip") && visible(".command-trading-lanes"),
        discover: visible(".command-v4-discover") && visible(".command-v4-funnel"),
        review: visible(".command-v4-review-stack") && visible(".command-v4-review"),
        public: visible(".command-v4-public .command-v4-strip"),
        system: visible(".command-v4-system-stack") && (
          visible(".operations-terminal") || visible(".ops-center") || visible(".command-topology")
        )
      };
    })()`, returnByValue:true});
    const value=workspace.result?.value||{};
    const expected = {
      "/command/rhen/operate": ["Operate", "operate"],
      "/command/rhen/discover": ["Discover", "discover"],
      "/command/rhen/review": ["Review", "review"],
      "/command/rhen/public": ["Public", "public"],
      "/command/rhen/system": ["System", "system"]
    }[route];
    if(!expected || !value.root || !value.readablePage || value.navCurrent !== route || value.heading !== expected[0] || value[expected[1]] !== true) {
      throw new Error("Canonical Command V4 workspace failed: "+JSON.stringify({route,...value}));
    }
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
      const nav=document.querySelector(".command-v4-header nav");
      const links=[...nav?.querySelectorAll("a")||[]].filter(el=>el.getBoundingClientRect().width>0);
      const rects=links.map(el=>{const r=el.getBoundingClientRect();return {label:el.textContent?.trim()||"",current:el.getAttribute("aria-current"),left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}});
      const overlaps=[];
      for(let i=0;i<rects.length;i++) for(let j=i+1;j<rects.length;j++){
        const a=rects[i],b=rects[j];
        if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top) overlaps.push(a.label+" × "+b.label);
      }
      const rows=[...new Set(rects.map(r=>Math.round(r.top)))];
      return {
        count:rects.length,
        labels:rects.map(r=>r.label),\n        current:rects.filter(r=>r.current==="page").map(r=>r.label),
        rows,
        overlaps,
        minWidth:Math.min(...rects.map(r=>r.width)),
        maxRight:Math.max(...rects.map(r=>r.right)),
        viewport:document.documentElement.clientWidth
      };
    })()`,returnByValue:true});
    const nav=navAudit.result?.value||{};
    const canonicalLabels=["Operate","Discover","Review","Public","System"];
    const labelsMatch=Array.isArray(nav.labels)&&canonicalLabels.every((label,index)=>nav.labels[index]===label);
    if(nav.count!==5||!labelsMatch||nav.current?.length!==1||nav.overlaps?.length||nav.minWidth<44||nav.maxRight>nav.viewport+1||nav.rows?.length!==1){
      throw new Error("Command icon navigation geometry failed: "+JSON.stringify(nav));
    }
  }

  if(route==="/products/rhen/architecture") {
    const architectureGeometry = await send("Runtime.evaluate", {expression: "(() => {\n  const root=document.querySelector(\".anevum-commons-v5-mount\")?.shadowRoot;\n  const grid=root?.querySelector(\".c2-page .c2-grid\");\n  const cards=[...(grid?.querySelectorAll(\":scope > section.c2-card\")||[])];\n  return {\n    present:Boolean(grid),\n    cards:cards.length,\n    labels:cards.map(x=>x.querySelector(\"h2\")?.textContent?.trim()||\"\"),\n    collapsed:cards.filter(x=>x.getBoundingClientRect().width<140).length,\n    outside:cards.filter(x=>x.getBoundingClientRect().right>innerWidth+1).length\n  };\n})()", returnByValue:true});
    const architecture=architectureGeometry.result?.value||{};
    const required=["Identity and privacy","Research","Replay","Forecast","Operations and evidence","Execution gates"];
    const missingLabels=required.filter(label=>!(architecture.labels||[]).includes(label));
    if(!architecture.present || architecture.cards!==6 || architecture.collapsed || architecture.outside || missingLabels.length) {
      throw new Error("RHEN V5 authority-card geometry/content failure: "+JSON.stringify({...architecture,missingLabels}));
    }
  }

  if(route==="/command/rhen/overview" && details.legacySummaryVisible) throw new Error("Legacy trading strip obscures fleet overview");
  if(route==="/command/rhen/overview" && (details.nostra!=="HEALTHY" || details.velum!=="HEALTHY" || details.velumActivity!=="WAITING_FOR_WORK" || details.activeGraen!=="false")) throw new Error("Lean health/activity rendering failed: "+JSON.stringify(details));
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
  // Reuse this bounded, hydrated browser target for the release evidence.
  // The duplicate CLI screenshot process could hang until the entire job died.
  const evidenceRoutes = {
    "/":["home",["anevum-commons-v5-mount","The Commons","Public ANEVUM work"]],
    "/products":["products",["c2-project","Projects and applications"]],
    "/products/rhen":["rhen",["V5 foundation","RHEN","Legacy live trading is suspended"]],
    "/products/rhen/evidence":["terminal",["EVIDENCE DRAWER","public-terminal-page","RESEARCH","REPLAY","RHEN"]],
    "/field-notes":["research",["c2-note","Research and Field Notes"]],
    "/field-notes/prediction-outcome-evidence-chain":["field-note",["c2-method","Research method and limitations"]],
    "/products/rhen/architecture":["architecture",["Architecture and authority","Execution gates"]],
    "/about":["about",["c2-about","Independent work, shared openly."]],
    "/resume":["resume",["c2-resume","Technical skills"]],
    "/products/rhen/releases":["releases",["c2-card","Release history"]],
    "/feed":["feed",["post-list","Public ANEVUM work"]],
    "/communities":["communities",["Explore the subjects","No fictional communities"]],
    "/learn":["learn",["Learn by examining real work","A practical research loop"]],
    "/sign-in":["sign-in",["member-auth-page","Your projects. Your Command."]],
    "/me":["member-command",["member-command","My programs","Programs"]],
    "/privacy":["privacy",["member-legal"]],
    "/terms":["terms",["member-legal"]]
  };
  if (evidenceRoutes[route]) {
    const [name, markers] = evidenceRoutes[route];
    const rendered = await send("Runtime.evaluate", {
      expression:`(() => {
        const outer = document.documentElement.outerHTML;
        const host = document.querySelector(".anevum-commons-v5-mount");
        return host && host.shadowRoot ? outer + "\\n<!-- V5 SHADOW DOM -->\\n" + host.shadowRoot.innerHTML : outer;
      })()`,returnByValue:true
    });
    const html = rendered.result?.value;
    if (typeof html !== "string" || markers.some(marker => !html.includes(marker))) {
      throw new Error("Release evidence marker missing: "+JSON.stringify({route,viewport:viewport.name,markers}));
    }
    fs.writeFileSync(path.join(output,name+"-"+viewport.name+".png"),Buffer.from(screenshot.data,"base64"));
    if (viewport.name === "desktop") fs.writeFileSync(path.join(output,name+"-rendered.html"),html);
  }
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
  await send("Page.navigate", { url: base + "/field-notes" });

  // Do not hold one Runtime.evaluate promise across navigation. Chromium may
  // replace the execution context after Page.navigate, leaving a long-running
  // evaluation attached to the initial blank document. Poll with short
  // evaluations so each attempt binds to the current document instead.
  const readyDeadline = Date.now() + 12000;
  let ready = {};
  while (Date.now() < readyDeadline) {
    try {
      const readyResult = await send("Runtime.evaluate", {
        expression: `(() => {
          const scroller = document.scrollingElement || document.documentElement || null;
          const link = document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector('a[href="/products"]');
          const maxScroll = scroller
            ? Math.max(0, scroller.scrollHeight - scroller.clientHeight)
            : 0;
          return {
            ready: location.pathname === "/field-notes" && Boolean(link),
            maxScroll,
            pathname: location.pathname
          };
        })()`,
        returnByValue: true
      });
      ready = readyResult.result?.value || {};
      if (ready.ready) break;
    } catch {
      // Navigation can briefly destroy the current execution context.
    }
    await sleep(100);
  }

  if (!ready.ready) {
    const value = {
      ok: false,
      reason: "research route not ready for scroll-reset assertion",
      before: 0,
      after: 0,
      maxScroll: ready.maxScroll || 0,
      pathname: ready.pathname || ""
    };
    console.log(JSON.stringify({ case: "route-scroll-reset", viewport: viewport.name, ...value }));
    ws.close();
    await closeTarget(page.id);
    return ["route navigation did not reset scroll to top " + JSON.stringify(value)];
  }

  // Force a deterministic scrollable document. The route-reset assertion should
  // test navigation behavior, not depend on the natural height of /research.
  const spacerResult = await send("Runtime.evaluate", {
    expression: `(() => {
      let spacer=document.getElementById("qa-route-scroll-spacer");
      if(!spacer){
        spacer=document.createElement("div");
        spacer.id="qa-route-scroll-spacer";
        spacer.setAttribute("aria-hidden","true");
        spacer.style.height="2200px";
        spacer.style.width="1px";
        spacer.style.pointerEvents="none";
        document.body.appendChild(spacer);
      }
      const scroller=document.scrollingElement || document.documentElement;
      return {maxScroll:Math.max(0,scroller.scrollHeight-scroller.clientHeight)};
    })()`,
    returnByValue:true
  });
  ready.maxScroll = Number(spacerResult.result?.value?.maxScroll || ready.maxScroll || 0);

  const scrollDeadline = Date.now() + 5000;
  let before = 0;
  while (Date.now() < scrollDeadline && before <= 200) {
    const scrollResult = await send("Runtime.evaluate", {
      expression: `(async () => {
        const scroller = document.scrollingElement || document.documentElement;
        const root = document.documentElement;
        const body = document.body;
        const previousScrollBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        const target = Math.min(1200, Math.max(0, scroller.scrollHeight - scroller.clientHeight));
        scroller.scrollTop = target;
        root.scrollTop = target;
        if (body) body.scrollTop = target;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const before = scroller.scrollTop;
        root.style.scrollBehavior = previousScrollBehavior;
        return { before };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    before = Number(scrollResult.result?.value?.before || 0);
    if (before <= 200) await sleep(100);
  }
  if (before <= 200) {
    const value = {ok:false,reason:"scrolled precondition not established",before,maxScroll:Number(ready.maxScroll)||0};
    console.log(JSON.stringify({case:"route-scroll-reset",viewport:viewport.name,...value}));
    ws.close();
    await closeTarget(page.id);
    return ["route scroll setup failed " + JSON.stringify(value)];
  }

  await send("Runtime.evaluate", {
    expression: `(() => {
      const link = document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector('a[href="/products"]');
      if (!link) return false;
      link.click();
      return true;
    })()`,
    returnByValue: true
  });

  const deadline = Date.now() + 7000;
  let state = { pathname: "", after: Number.NaN };
  while (Date.now() < deadline) {
    try {
      const stateResult = await send("Runtime.evaluate", {
        expression: `(() => {
          const scroller = document.scrollingElement || document.documentElement;
          return { pathname: location.pathname, after: scroller.scrollTop };
        })()`,
        returnByValue: true
      });
      state = stateResult.result?.value || state;
      if (state.pathname === "/products" && Number(state.after) <= 1) break;
    } catch {
      // A real document navigation can briefly replace the execution context.
    }
    await sleep(50);
  }

  const value = {
    ok: state.pathname === "/products" && before > 200 && Number(state.after) <= 1,
    before,
    after: Number.isFinite(Number(state.after)) ? Number(state.after) : null,
    maxScroll: Number(ready.maxScroll) || 0,
    pathname: state.pathname
  };
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
      let routeFailures = await runCase(route, viewport);
      const transientChunkRace =
        routeFailures.length > 0 &&
        routeFailures.every((item) =>
          item.includes("Failed to fetch dynamically imported module")
        );
      if (transientChunkRace) {
        await sleep(2500);
        routeFailures = await runCase(route, viewport);
      }
      failures = failures.concat(
        routeFailures.map((item) => viewport.name + " " + route + ": " + item)
      );
    }
  }
  // Explicit narrow-phone acceptance without repeating all legacy routes.
  const narrow = { name:"narrow",width:320,height:720,mobile:true,deviceScaleFactor:1 };
  failures = failures.concat((await runCase("/", narrow)).map(item=>"narrow /: "+item));
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

